import { useEffect } from 'react'
import { useAIBrain } from '../hooks/useAIBrain'
import { useGameStore } from '../store/gameStore'

// This component manages the AI brain connection
// It runs outside the 3D canvas since it doesn't render anything
function AIController() {
  const { isConnected, requestAIAction, notifyActionComplete } = useAIBrain()
  const autoTimeEnabled = useGameStore((state) => state.autoTimeEnabled)
  const adminMode = useGameStore((state) => state.adminMode)
  const toggleAdminMode = useGameStore((state) => state.toggleAdminMode)

  // Log connection status changes
  useEffect(() => {
    if (isConnected) {
      console.log('AI Controller: Connected to brain server')
    }
  }, [isConnected])

  // Expose functions globally for debugging
  useEffect(() => {
    window.requestAIAction = requestAIAction
    window.notifyActionComplete = notifyActionComplete
  }, [requestAIAction, notifyActionComplete])

  // Keyboard shortcut for admin mode (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        toggleAdminMode()
        console.log('Admin mode:', !adminMode ? 'ENABLED' : 'DISABLED')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleAdminMode, adminMode])

  // Show admin mode status
  useEffect(() => {
    if (adminMode) {
      console.log('Admin mode enabled - use WASD/arrows to move character manually')
    }
  }, [adminMode])

  return null // This component doesn't render anything
}

export default AIController
