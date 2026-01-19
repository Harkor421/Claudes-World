import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import Game from './components/Game'
import HUD from './components/HUD'
import AIController from './components/AIController'
import LandingPage from './components/LandingPage'
import DocsPage from './components/DocsPage'

function App() {
  const [currentPage, setCurrentPage] = useState('landing') // 'landing', 'game', 'docs'

  // Add/remove game-active class on html element to control overflow
  useEffect(() => {
    if (currentPage === 'game') {
      document.documentElement.classList.add('game-active')
    } else {
      document.documentElement.classList.remove('game-active')
    }
    return () => document.documentElement.classList.remove('game-active')
  }, [currentPage])

  if (currentPage === 'docs') {
    return <DocsPage onBack={() => setCurrentPage('landing')} />
  }

  if (currentPage === 'landing') {
    return (
      <LandingPage
        onEnter={() => setCurrentPage('game')}
        onDocs={() => setCurrentPage('docs')}
      />
    )
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
      <HUD onHome={() => setCurrentPage('landing')} />
      <AIController />
    </>
  )
}

export default App
