import React, { useRef, useMemo } from 'react'
import * as THREE from 'three'

function Ground({ onClick, onContextMenu }) {
  const gridRef = useRef()

  // Create a custom grid material with low opacity
  const gridMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: '#5a6a7a',
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    })
  }, [])

  return (
    <group>
      {/* Main ground plane with cleaner appearance */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={onClick}
        onContextMenu={onContextMenu}
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color="#4a5a6a"
          roughness={0.6}
          metalness={0.05}
        />
      </mesh>

      {/* Very subtle grid pattern with reduced opacity */}
      <gridHelper
        ref={gridRef}
        args={[50, 50, '#6a7a8a', '#6a7a8a']}
        position={[0, 0.01, 0]}
        material={gridMaterial}
      />

      {/* Removed ground spot for cleaner look */}
    </group>
  )
}

export default Ground
