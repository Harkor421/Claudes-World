import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Shared geometry for all cloud voxels
const voxelGeometry = new THREE.BoxGeometry(1, 1, 1)
const cloudMaterial = new THREE.MeshBasicMaterial({
  color: '#ffffff',
  transparent: true,
  opacity: 0.7,
})

// Generate a single cloud shape (cluster of voxels)
function generateCloudShape() {
  const voxels = []
  // Cloud core
  const width = 3 + Math.floor(Math.random() * 4)
  const depth = 2 + Math.floor(Math.random() * 3)
  const height = 1 + Math.floor(Math.random() * 2)

  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      for (let y = 0; y < height; y++) {
        // Add some randomness to create fluffy shape
        const distFromCenter = Math.sqrt(
          Math.pow(x - width / 2, 2) + Math.pow(z - depth / 2, 2)
        ) / (width / 2)

        // Higher chance to skip voxels at edges
        if (Math.random() > 0.3 + distFromCenter * 0.4) {
          voxels.push([x - width / 2, y, z - depth / 2])
        }
      }
    }
  }

  return voxels
}

// Single cloud using instanced mesh
function Cloud({ position, speed, scale = 1 }) {
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const offsetRef = useRef(position[0])

  const voxels = useMemo(() => generateCloudShape(), [])

  // Initialize instance matrices
  useMemo(() => {
    if (!meshRef.current) return
    voxels.forEach((voxelPos, i) => {
      dummy.position.set(
        voxelPos[0] * scale,
        voxelPos[1] * scale,
        voxelPos[2] * scale
      )
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [voxels, scale, dummy])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    // Move cloud slowly
    offsetRef.current += delta * speed

    // Wrap around when cloud goes too far
    const wrapDistance = 300
    if (offsetRef.current > wrapDistance) {
      offsetRef.current = -wrapDistance
    }

    // Update position
    meshRef.current.position.x = offsetRef.current
    meshRef.current.position.y = position[1]
    meshRef.current.position.z = position[2]
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[voxelGeometry, cloudMaterial, voxels.length]}
      frustumCulled={false}
    />
  )
}

function VoxelClouds() {
  // Generate cloud positions at initialization
  const clouds = useMemo(() => {
    const cloudData = []
    const cloudCount = 15

    for (let i = 0; i < cloudCount; i++) {
      cloudData.push({
        id: i,
        position: [
          (Math.random() - 0.5) * 400,
          40 + Math.random() * 20, // Height between 40-60
          (Math.random() - 0.5) * 400,
        ],
        speed: 1 + Math.random() * 2, // Slow drift
        scale: 2 + Math.random() * 3, // Scale 2-5
      })
    }

    return cloudData
  }, [])

  return (
    <group>
      {clouds.map((cloud) => (
        <Cloud
          key={cloud.id}
          position={cloud.position}
          speed={cloud.speed}
          scale={cloud.scale}
        />
      ))}
    </group>
  )
}

export default VoxelClouds
