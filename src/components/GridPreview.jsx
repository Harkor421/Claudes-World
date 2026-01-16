import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/gameStore'
import { getBuildingSize } from './BuildMenu'

// Grid size matches the building scale (2 units per square)
const GRID_SIZE = 2

// Snap position to grid
const snapToGrid = (pos) => {
  return [
    Math.round(pos[0] / GRID_SIZE) * GRID_SIZE,
    0.02,
    Math.round(pos[2] / GRID_SIZE) * GRID_SIZE
  ]
}

function GridPreview() {
  const buildMenu = useGameStore((state) => state.buildMenu)
  const previewModel = useGameStore((state) => state.previewModel)
  const groupRef = useRef()
  const timeRef = useRef(0)

  // Animate the preview
  useFrame((state, delta) => {
    if (groupRef.current) {
      timeRef.current += delta
      // Gentle pulse animation
      const pulse = 1 + Math.sin(timeRef.current * 4) * 0.05
      groupRef.current.scale.setScalar(pulse)
    }
  })

  // Only show when menu is open
  if (!buildMenu.isOpen || !buildMenu.position) return null

  // Get size based on hovered model or default to 1x1
  const size = previewModel ? getBuildingSize(previewModel) : [1, 1]
  const [width, depth] = size

  // Snap the build position to grid
  const snappedPos = snapToGrid(buildMenu.position)

  // Generate grid cells
  const cells = []
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      cells.push({
        x: snappedPos[0] + (x - width / 2 + 0.5) * GRID_SIZE,
        z: snappedPos[2] + (z - depth / 2 + 0.5) * GRID_SIZE
      })
    }
  }

  return (
    <group ref={groupRef}>
      {cells.map((cell, i) => (
        <group key={i} position={[cell.x, 0.02, cell.z]}>
          {/* Green fill */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[GRID_SIZE * 0.95, GRID_SIZE * 0.95]} />
            <meshBasicMaterial
              color="#4ade80"
              transparent
              opacity={0.4}
            />
          </mesh>

          {/* Border outline */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <ringGeometry args={[GRID_SIZE * 0.42, GRID_SIZE * 0.48, 4]} />
            <meshBasicMaterial
              color="#22c55e"
              transparent
              opacity={0.8}
            />
          </mesh>

          {/* Corner accents */}
          {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([cx, cz], j) => (
            <mesh
              key={j}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[cx * GRID_SIZE * 0.4, 0.002, cz * GRID_SIZE * 0.4]}
            >
              <planeGeometry args={[GRID_SIZE * 0.15, GRID_SIZE * 0.15]} />
              <meshBasicMaterial
                color="#86efac"
                transparent
                opacity={0.9}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Center marker showing where character will build */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[snappedPos[0], 0.03, snappedPos[2]]}>
        <ringGeometry args={[0.1, 0.15, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

export default GridPreview
