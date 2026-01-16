// WebSocket connection to the AI brain server

class GameSocket {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 2000
    this.listeners = new Map()
    this.isConnected = false
    this.messageQueue = []
  }

  connect(url = 'ws://localhost:3001') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Already connected')
      return
    }

    console.log('Connecting to AI brain server...')

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('Connected to AI brain server')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('connected')

        // Send any queued messages
        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift()
          this.send(msg.type, msg.payload)
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (e) {
          console.error('Failed to parse message:', e)
        }
      }

      this.ws.onclose = () => {
        console.log('Disconnected from server')
        this.isConnected = false
        this.emit('disconnected')
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.emit('error', error)
      }
    } catch (error) {
      console.error('Failed to connect:', error)
      this.attemptReconnect()
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached')
      this.emit('reconnect_failed')
      return
    }

    this.reconnectAttempts++
    console.log(`Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      this.connect()
    }, this.reconnectDelay)
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(type, payload) {
    const message = { type, payload }

    if (!this.isConnected) {
      // Queue message if not connected
      this.messageQueue.push(message)
      return
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  handleMessage(message) {
    const { type, payload } = message

    // Emit to specific listeners
    this.emit(type, payload)

    // Also emit to generic 'message' listeners
    this.emit('message', message)
  }

  // Event handling
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return
    const callbacks = this.listeners.get(event)
    const index = callbacks.indexOf(callback)
    if (index !== -1) {
      callbacks.splice(index, 1)
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data)
      } catch (e) {
        console.error(`Error in ${event} listener:`, e)
      }
    })
  }

  // Convenience methods for game communication
  syncState(gameState) {
    this.send('SYNC_STATE', gameState)
  }

  updateTime(timeOfDay) {
    this.send('TIME_UPDATE', { timeOfDay })
  }

  notifyBuildingPlaced(building) {
    this.send('BUILDING_PLACED', building)
  }

  requestAIAction() {
    this.send('REQUEST_AI_ACTION', {})
  }

  // Character position sync
  updateCharacterPosition(position, rotation, isMoving) {
    this.send('CHARACTER_POSITION', { position, rotation, isMoving })
  }

  // Character completed an action (arrived at destination, finished building, etc.)
  notifyActionComplete(actionType, data) {
    this.send('ACTION_COMPLETE', { actionType, ...data })
  }

  // Admin mode commands
  adminMoveCharacter(targetPosition) {
    this.send('ADMIN_MOVE', { targetPosition })
  }

  adminPlaceBuilding(model, position) {
    this.send('ADMIN_BUILD', { model, position })
  }

  // Request full state from server (for reconnection)
  requestFullState() {
    this.send('REQUEST_STATE', {})
  }
}

// Singleton instance
export const gameSocket = new GameSocket()
