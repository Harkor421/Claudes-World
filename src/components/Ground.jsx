import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Ground({ onClick, onContextMenu }) {
  const gridRef = useRef()

  return (
    <group>
      {/* Main ground plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={onClick}
        onContextMenu={onContextMenu}
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color="#3d4a5c"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Subtle grid pattern */}
      <gridHelper
        ref={gridRef}
        args={[50, 50, '#4a5568', '#4a5568']}
        position={[0, 0.01, 0]}
      />

      {/* Ground glow/highlight spots for visual interest */}
      <GroundSpot position={[0, 0.02, 0]} />
    </group>
  )
}

// Circular highlight on ground (like the green circle under character)
function GroundSpot({ position }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position}>
      <circleGeometry args={[0.5, 32]} />
      <meshBasicMaterial
        color="#4a7c59"
        transparent
        opacity={0.6}
      />
    </mesh>
  )
}

export default Ground
