import { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { gameSocket } from '../services/socket'

export function useAIBrain() {
  const isConnected = useRef(false)
  const lastSyncTime = useRef(0)

  // Get store values and actions
  const timeOfDay = useGameStore((state) => state.timeOfDay)
  const placedBuildings = useGameStore((state) => state.placedBuildings)
  const weather = useGameStore((state) => state.weather)
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

      default:
        console.log('Unknown AI action:', payload)
    }
  }, [startBuildTask, adjustMood, adjustEnergy, setCharacterTargetPosition, setIsSleeping, adminMode, setAIStatus, setAICurrentAction, addPlacedBuilding, incrementBuildingsToday])

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

  // Connect to server on mount
  useEffect(() => {
    // Listen for AI actions
    gameSocket.on('AI_ACTION', handleAIAction)
    gameSocket.on('WORLD_STATE', handleWorldState)
    gameSocket.on('CHARACTER_POSITION', handleCharacterPosition)

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
      gameSocket.disconnect()
    }
  }, [handleAIAction, handleWorldState, handleCharacterPosition])

  // Sync time updates to server (throttled)
  useEffect(() => {
    const now = Date.now()
    // Only sync every 500ms to avoid flooding
    if (now - lastSyncTime.current > 500) {
      lastSyncTime.current = now
      gameSocket.updateTime(timeOfDay)
    }
  }, [timeOfDay])

  // Note: Character position sync is handled in Character.jsx to avoid duplicate syncing

  // Sync when buildings change
  useEffect(() => {
    if (isConnected.current) {
      gameSocket.syncState({
        placedBuildings,
        timeOfDay,
        weather,
      })
    }
  }, [placedBuildings, timeOfDay, weather])

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
