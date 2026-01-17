import { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { gameSocket } from '../services/socket'

export function useAIBrain() {
  const isConnected = useRef(false)

  // Get store values and actions
  const adminMode = useGameStore((state) => state.adminMode)

  const startBuildTask = useGameStore((state) => state.startBuildTask)
  const adjustMood = useGameStore((state) => state.adjustMood)
  const adjustEnergy = useGameStore((state) => state.adjustEnergy)
  const setCharacterTargetPosition = useGameStore((state) => state.setCharacterTargetPosition)
  const setCharacterPosition = useGameStore((state) => state.setCharacterPosition)
  const setCharacterRotation = useGameStore((state) => state.setCharacterRotation)
  const setIsMoving = useGameStore((state) => state.setIsMoving)
  const loadServerState = useGameStore((state) => state.loadServerState)
  const setIsSleeping = useGameStore((state) => state.setIsSleeping)
  const setAIStatus = useGameStore((state) => state.setAIStatus)
  const setAICurrentAction = useGameStore((state) => state.setAICurrentAction)
  const addPlacedBuilding = useGameStore((state) => state.addPlacedBuilding)
  const incrementBuildingsToday = useGameStore((state) => state.incrementBuildingsToday)
  const setTimeOfDay = useGameStore((state) => state.setTimeOfDay)
  const setDay = useGameStore((state) => state.setDay)
  const addLogEntry = useGameStore((state) => state.addLogEntry)

  // Handle AI actions from server
  const handleAIAction = useCallback((payload) => {
    // In admin mode, ignore AI movement commands
    if (adminMode && (payload.type === 'MOVE' || payload.type === 'BUILD')) {
      console.log('Admin mode: ignoring AI action', payload.type)
      return
    }

    console.log('AI Action received:', payload)

    switch (payload.type) {
      case 'BUILD':
        // AI wants to build something
        const { model, position, reason, folder, scale } = payload.data
        console.log(`AI building ${model} at [${position}] (${folder || 'city'}): ${reason}`)

        // Update AI status
        setAIStatus(`Building ${model}`)
        setAICurrentAction({ type: 'BUILD', model, reason })

        // Start the build task (Claude character will walk there and build)
        startBuildTask(model, position, folder || 'city', scale || 2)

        // Building makes Claude happy and uses energy
        adjustMood(5)
        adjustEnergy(-10)
        break

      case 'MOVE':
        // AI wants to move somewhere
        const targetPos = payload.data.position
        console.log(`AI moving to [${targetPos}]`)
        setAIStatus('Moving')
        setAICurrentAction({ type: 'MOVE' })
        setCharacterTargetPosition(targetPos)
        break

      case 'WANDER':
        // AI is wandering around
        const wanderPos = payload.data.position
        console.log(`AI wandering to [${wanderPos}]`)
        setAIStatus('Exploring')
        setAICurrentAction({ type: 'WANDER' })
        setCharacterTargetPosition(wanderPos)
        break

      case 'INSPECT':
        // AI is inspecting a building
        const inspectPos = payload.data.position
        console.log(`AI inspecting at [${inspectPos}]`)
        setAIStatus(`Inspecting ${payload.data.building || 'area'}`)
        setAICurrentAction({ type: 'INSPECT', building: payload.data.building })
        setCharacterTargetPosition(inspectPos)
        adjustMood(2) // Feels good to check on things
        break

      case 'REST':
        // AI is resting - go to ship and sleep
        console.log('AI resting at ship')
        setAIStatus('Sleeping')
        setAICurrentAction({ type: 'REST' })
        if (payload.data.position) {
          setCharacterTargetPosition(payload.data.position)
        }
        setIsSleeping(payload.data.sleeping || false)
        adjustEnergy(20)
        break

      case 'STATUS':
        // AI sending a status update
        console.log('AI Status:', payload.data.message)
        setAIStatus(payload.data.message)
        break

      case 'PLAN_CREATED':
        // AI created a plan for the day
        console.log('AI Plan:', payload.data.plan)
        setAIStatus(`Planning: ${payload.data.plan?.length || 0} tasks`)
        setAICurrentAction({ type: 'PLAN', plan: payload.data.plan })
        adjustMood(3) // Planning feels productive
        break

      case 'BUILDING_PLACED':
        // Server autonomously placed a building - sync it to client
        console.log('Building placed by server:', payload.data.model)
        addPlacedBuilding(payload.data)
        incrementBuildingsToday() // Track for daily stats
        break

      case 'LOG_ENTRY':
        // Claude's logbook entry with AI-generated thoughts
        console.log('Claude thinks:', payload.data.thought)
        addLogEntry({
          action: payload.data.action,
          model: payload.data.model,
          name: payload.data.name,
          reason: payload.data.reason,
          thought: payload.data.thought,
          mood: payload.data.mood,
          buildingType: payload.data.buildingType,
          position: payload.data.position,
          citySize: payload.data.citySize,
          totalBuildings: payload.data.totalBuildings,
          population: payload.data.population,
          neighborhoods: payload.data.neighborhoods,
        })
        break

      default:
        console.log('Unknown AI action:', payload)
    }
  }, [startBuildTask, adjustMood, adjustEnergy, setCharacterTargetPosition, setIsSleeping, adminMode, setAIStatus, setAICurrentAction, addPlacedBuilding, incrementBuildingsToday, addLogEntry])

  // Handle full state from server (for reconnection/persistence)
  const handleWorldState = useCallback((payload) => {
    console.log('Received world state from server')
    loadServerState(payload)
  }, [loadServerState])

  // Handle character position updates from other clients
  const handleCharacterPosition = useCallback((payload) => {
    // Update character position from server (for multi-client sync)
    const { position, rotation, isMoving: moving } = payload
    setCharacterPosition(position)
    if (rotation !== undefined) setCharacterRotation(rotation)
    if (moving !== undefined) setIsMoving(moving)
  }, [setCharacterPosition, setCharacterRotation, setIsMoving])

  // Handle time updates from server (server is source of truth for time)
  const handleTimeUpdate = useCallback((payload) => {
    const { timeOfDay: newTime, day: newDay } = payload
    setTimeOfDay(newTime)
    if (newDay !== undefined) setDay(newDay)
  }, [setTimeOfDay, setDay])

  // Handle direct building placed messages (for sync between clients)
  const handleBuildingPlaced = useCallback((payload) => {
    // payload is the building directly (not wrapped in data)
    if (payload && payload.id) {
      addPlacedBuilding(payload)
      incrementBuildingsToday()
    }
  }, [addPlacedBuilding, incrementBuildingsToday])

  // Connect to server on mount
  useEffect(() => {
    // Listen for AI actions
    gameSocket.on('AI_ACTION', handleAIAction)
    gameSocket.on('WORLD_STATE', handleWorldState)
    gameSocket.on('CHARACTER_POSITION', handleCharacterPosition)
    gameSocket.on('TIME_UPDATE', handleTimeUpdate)
    gameSocket.on('BUILDING_PLACED', handleBuildingPlaced)

    gameSocket.on('connected', () => {
      isConnected.current = true
      console.log('AI Brain connected')

      // Request full state from server
      gameSocket.requestFullState()
    })

    gameSocket.on('disconnected', () => {
      isConnected.current = false
    })

    // Connect to server
    gameSocket.connect()

    return () => {
      gameSocket.off('AI_ACTION', handleAIAction)
      gameSocket.off('WORLD_STATE', handleWorldState)
      gameSocket.off('CHARACTER_POSITION', handleCharacterPosition)
      gameSocket.off('TIME_UPDATE', handleTimeUpdate)
      gameSocket.off('BUILDING_PLACED', handleBuildingPlaced)
      gameSocket.disconnect()
    }
  }, [handleAIAction, handleWorldState, handleCharacterPosition, handleTimeUpdate, handleBuildingPlaced])

  // Note: Time is now managed by the server - we receive TIME_UPDATE messages
  // Note: Character position sync is handled in Character.jsx to avoid duplicate syncing
  // Note: Buildings are now managed by server - clients receive BUILDING_PLACED messages

  // Manual trigger for AI thinking
  const requestAIAction = useCallback(() => {
    gameSocket.requestAIAction()
  }, [])

  // Notify server when an action is complete
  const notifyActionComplete = useCallback((actionType, data = {}) => {
    gameSocket.notifyActionComplete(actionType, data)
  }, [])

  return {
    isConnected: isConnected.current,
    requestAIAction,
    notifyActionComplete,
  }
}
