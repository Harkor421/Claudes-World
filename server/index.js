import express from 'express'
import { WebSocketServer } from 'ws'
import cors from 'cors'
import { createServer } from 'http'
import { ClaudeBrain } from './brain.js'
import { WorldState } from './worldState.js'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const server = createServer(app)
const wss = new WebSocketServer({ server })

// Initialize world state and AI brain
const worldState = new WorldState()
const claudeBrain = new ClaudeBrain(worldState)

// Track connected clients
const clients = new Set()

// Broadcast to all connected clients
function broadcast(message) {
  const data = JSON.stringify(message)
  clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(data)
    }
  })
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected')
  clients.add(ws)

  // Send current world state to new client
  ws.send(JSON.stringify({
    type: 'WORLD_STATE',
    payload: worldState.getState()
  }))

  // AI already running independently - no need to start on client connect

  // Handle messages from client
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data)
      handleClientMessage(message, ws)
    } catch (e) {
      console.error('Invalid message:', e)
    }
  })

  ws.on('close', () => {
    console.log('Client disconnected')
    clients.delete(ws)
    // AI keeps running even with no clients - it's autonomous
  })
})

// Handle incoming client messages
function handleClientMessage(message, ws) {
  switch (message.type) {
    case 'SYNC_STATE':
      // Client sending their current state
      worldState.syncFromClient(message.payload)
      break

    case 'TIME_UPDATE':
      // Client updating time of day
      worldState.setTime(message.payload.timeOfDay)
      claudeBrain.onTimeUpdate(message.payload.timeOfDay)
      break

    case 'CHARACTER_POSITION':
      // Client sending character position update - broadcast to all other clients
      const { position, rotation, isMoving } = message.payload
      worldState.updateCharacterPosition(position, rotation, isMoving)
      // Broadcast to all OTHER clients (not the sender)
      const positionData = JSON.stringify({
        type: 'CHARACTER_POSITION',
        payload: { position, rotation, isMoving }
      })
      clients.forEach(client => {
        if (client !== ws && client.readyState === 1) {
          client.send(positionData)
        }
      })
      break

    case 'ACTION_COMPLETE':
      // Client notifying that an action was completed
      const { actionType } = message.payload
      if (actionType === 'ARRIVED') {
        claudeBrain.onCharacterArrived(message.payload.position)
      } else if (actionType === 'BUILD_COMPLETE') {
        claudeBrain.onBuildComplete(message.payload.building)
      }
      break

    case 'BUILDING_PLACED':
      // Client confirming a building was placed
      worldState.addBuilding(message.payload)
      // Broadcast updated state to all clients
      broadcast({ type: 'WORLD_STATE', payload: worldState.getState() })
      break

    case 'REQUEST_AI_ACTION':
      // Manual request for AI to take action
      claudeBrain.think().then(action => {
        if (action) {
          broadcast({ type: 'AI_ACTION', payload: action })
        }
      })
      break

    case 'REQUEST_STATE':
      // Client requesting full state (for reconnection)
      ws.send(JSON.stringify({
        type: 'WORLD_STATE',
        payload: worldState.getState()
      }))
      break

    case 'ADMIN_MOVE':
      // Admin command to move character
      const targetPos = message.payload.targetPosition
      worldState.setCharacterTarget(targetPos)
      // Broadcast the move command to all clients
      broadcast({
        type: 'AI_ACTION',
        payload: {
          type: 'MOVE',
          data: { position: targetPos }
        }
      })
      break

    case 'ADMIN_BUILD':
      // Admin command to place building instantly
      const { model, position: buildPos } = message.payload
      const building = {
        id: Date.now(),
        model,
        position: buildPos,
        rotation: [0, 0, 0],
        scale: 2
      }
      worldState.addBuilding(building)
      // Broadcast building placement
      broadcast({
        type: 'BUILDING_PLACED',
        payload: building
      })
      broadcast({
        type: 'WORLD_STATE',
        payload: worldState.getState()
      })
      break

    case 'SET_SPEED':
      // Change AI speed multiplier
      const { speed } = message.payload
      claudeBrain.setSpeed(speed)
      console.log(`AI speed changed to ${speed}x`)
      break

    default:
      console.log('Unknown message type:', message.type)
  }
}

// When AI brain decides on an action, broadcast it
claudeBrain.onAction((action) => {
  console.log('AI Action:', action.type, action.data?.model || action.data?.position || '')
  broadcast({ type: 'AI_ACTION', payload: action })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', clients: clients.size })
})

// Get current world state
app.get('/state', (req, res) => {
  res.json(worldState.getState())
})

// Manual trigger for AI thinking (for testing)
app.post('/think', async (req, res) => {
  const action = await claudeBrain.think()
  res.json({ action })
})

// Force start activity loop (for testing)
app.post('/start', (req, res) => {
  claudeBrain.startActivityLoop()
  res.json({ status: 'Activity loop started' })
})

// Stop activity loop (for testing)
app.post('/stop', (req, res) => {
  claudeBrain.stopActivityLoop()
  res.json({ status: 'Activity loop stopped' })
})

// Reset world - clear all buildings and restart
app.post('/reset', (req, res) => {
  console.log('Resetting world state...')
  claudeBrain.stopActivityLoop()

  // Clear all buildings
  worldState.buildings = []
  worldState.occupiedCells.clear()
  worldState.characterPosition = [0, 0, 0]
  worldState.energy = 100
  worldState.mood = 80

  // Reset brain state for AI city planner
  claudeBrain.currentRing = 0
  claudeBrain.buildQueue = []
  claudeBrain.isBuildingInProgress = false
  claudeBrain.isThinking = false
  claudeBrain.totalPopulation = 0
  claudeBrain.buildingCount = 0
  claudeBrain.roadPositions.clear()
  claudeBrain.generateCoreInfrastructure()

  // Broadcast reset to all clients
  broadcast({
    type: 'WORLD_STATE',
    payload: worldState.getState()
  })

  // Restart building
  claudeBrain.startActivityLoop()

  res.json({ status: 'World reset', buildings: 0 })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Claude's World Server running on port ${PORT}`)
  console.log(`WebSocket available at ws://localhost:${PORT}`)

  // Start AI activity loop immediately - independent of clients
  console.log('Starting autonomous AI city builder...')
  claudeBrain.startActivityLoop()
})
