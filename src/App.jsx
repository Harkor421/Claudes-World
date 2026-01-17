import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import Game from './components/Game'
import HUD from './components/HUD'
import AIController from './components/AIController'
import LandingPage from './components/LandingPage'

function App() {
  const [showLanding, setShowLanding] = useState(true)

  // Add/remove game-active class on html element to control overflow
  useEffect(() => {
    if (showLanding) {
      document.documentElement.classList.remove('game-active')
    } else {
      document.documentElement.classList.add('game-active')
    }
    return () => document.documentElement.classList.remove('game-active')
  }, [showLanding])

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />
  }

  return (
    <>
      <Canvas
        shadows
        camera={{
          position: [10, 10, 10],
          fov: 50,
          near: 0.1,
          far: 2000
        }}
        style={{ background: '#2a2a4a' }}
      >
        <Game />
      </Canvas>
      <HUD onHome={() => setShowLanding(true)} />
      <AIController />
    </>
  )
}

export default App
