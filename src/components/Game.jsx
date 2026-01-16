import React, { useEffect } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import Ground from './Ground'
import Character from './Character'
import DayNightCycle from './DayNightCycle'
import Weather from './Weather'
import SpaceObject from './SpaceObject'
import BuildProgress from './BuildProgress'
import GridPreview from './GridPreview'
import { useGameStore } from '../store/gameStore'

// Grid size for snapping (matches building scale of 2)
const GRID_SIZE = 2

// Snap position to grid center
const snapToGrid = (pos) => [
  Math.round(pos[0] / GRID_SIZE) * GRID_SIZE,
  0,
  Math.round(pos[2] / GRID_SIZE) * GRID_SIZE
]

// Component to handle auto time advancement
function TimeAdvancer() {
  const autoTimeEnabled = useGameStore((state) => state.autoTimeEnabled)
  const advanceTime = useGameStore((state) => state.advanceTime)

  useFrame((state, delta) => {
    if (autoTimeEnabled) {
      // Advance 1 hour per 10 real seconds
      advanceTime(delta * 0.1)
    }
  })

  return null
}

function Game() {
  const setKeyPressed = useGameStore((state) => state.setKeyPressed)
  const setCharacterTargetPosition = useGameStore((state) => state.setCharacterTargetPosition)
  const openBuildMenu = useGameStore((state) => state.openBuildMenu)
  const placedBuildings = useGameStore((state) => state.placedBuildings)

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeyPressed('forward', true)
          break
        case 'KeyS':
        case 'ArrowDown':
          setKeyPressed('backward', true)
          break
        case 'KeyA':
        case 'ArrowLeft':
          setKeyPressed('left', true)
          break
        case 'KeyD':
        case 'ArrowRight':
          setKeyPressed('right', true)
          break
      }
    }

    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeyPressed('forward', false)
          break
        case 'KeyS':
        case 'ArrowDown':
          setKeyPressed('backward', false)
          break
        case 'KeyA':
        case 'ArrowLeft':
          setKeyPressed('left', false)
          break
        case 'KeyD':
        case 'ArrowRight':
          setKeyPressed('right', false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [setKeyPressed])

  // Left click to move
  const handleGroundClick = (e) => {
    if (e.button !== 0) return // Only left click
    e.stopPropagation()
    const point = e.point
    setCharacterTargetPosition([point.x, 0, point.z])
  }

  // Right click to open build menu
  const handleGroundRightClick = (e) => {
    e.stopPropagation()
    const point = e.point
    // Snap to grid
    const snappedPos = snapToGrid([point.x, 0, point.z])
    // Get screen coordinates for menu position
    const screenPos = { x: e.clientX || e.nativeEvent?.clientX || window.innerWidth / 2, y: e.clientY || e.nativeEvent?.clientY || window.innerHeight / 2 }
    openBuildMenu(snappedPos, screenPos)
  }

  return (
    <>
      <DayNightCycle />
      <Weather />
      <TimeAdvancer />

      {/* Isometric-style camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 3}
        minDistance={8}
        maxDistance={60}
      />

      {/* Ground plane - clickable for movement, right-click for build */}
      <Ground onClick={handleGroundClick} onContextMenu={handleGroundRightClick} />

      {/* The Claude character */}
      <Character />

      {/* === CRASHED SHIP - CHARACTER SPAWN/REST AREA === */}
      {/* Main crashed dropship - tilted as if it crashed */}
      <SpaceObject
        model="dropship"
        position={[0, 0.2, 0]}
        rotation={[0.1, 0.3, 0.08]}
        scale={2}
      />

      {/* Small debris right next to the ship */}
      <SpaceObject model="cargo_A" position={[-2.5, 0, 1.5]} rotation={[0.05, 0.6, 0]} scale={2} />
      <SpaceObject model="cargo_B" position={[2.5, 0, 1]} rotation={[0, -0.4, 0.05]} scale={2} />

      {/* Grid preview for building placement */}
      <GridPreview />

      {/* Building in progress */}
      <BuildProgress />

      {/* Player-placed buildings */}
      {placedBuildings.map((building) => (
        <SpaceObject
          key={building.id}
          model={building.model}
          position={building.position}
          rotation={building.rotation}
          scale={building.scale}
        />
      ))}
    </>
  )
}

// Simple rock decoration
function Rock({ position }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.15, 0]}>
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color="#4a5568" roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.3, 0.1, 0.2]}>
        <dodecahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial color="#3d4452" roughness={0.9} />
      </mesh>
    </group>
  )
}

export default Game
