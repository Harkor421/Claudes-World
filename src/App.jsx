import { Canvas } from '@react-three/fiber'
import Game from './components/Game'
import HUD from './components/HUD'
import AIController from './components/AIController'

function App() {
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
      <HUD />
      <AIController />
    </>
  )
}

export default App
