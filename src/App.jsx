import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import Game from './components/Game'
import UI from './components/UI'
import BuildMenu from './components/BuildMenu'
import SettingsMenu from './components/SettingsMenu'
import { useGameStore } from './store/gameStore'

function App() {
  const closeBuildMenu = useGameStore((state) => state.closeBuildMenu)

  // Prevent browser context menu
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault()
    }
    window.addEventListener('contextmenu', handleContextMenu)
    return () => window.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  return (
    <>
      <Canvas
        shadows
        camera={{
          position: [10, 10, 10],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        style={{ background: '#2a2a4a' }}
        onPointerMissed={() => closeBuildMenu()}
      >
        <Game />
      </Canvas>
      <UI />
      <BuildMenu />
      <SettingsMenu />
    </>
  )
}

export default App
