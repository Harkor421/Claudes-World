import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'

// Shared geometry for all voxels
const voxelGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15)

// Shared materials pool (reused across all particles)
const materialCache = new Map()
const getMaterial = (color) => {
  if (!materialCache.has(color)) {
    materialCache.set(color, new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1,
    }))
  }
  return materialCache.get(color)
}

// Color sets for building types
const COLOR_SETS = {
  residential: ['#4ade80', '#22c55e', '#86efac'],
  commercial: ['#60a5fa', '#3b82f6', '#93c5fd'],
  industrial: ['#f59e0b', '#d97706', '#fbbf24'],
  power: ['#facc15', '#eab308', '#fde047'],
  water: ['#22d3ee', '#06b6d4', '#67e8f9'],
  food: ['#a3e635', '#84cc16', '#bef264'],
  eco: ['#34d399', '#10b981', '#6ee7b7'],
  road: ['#9ca3af', '#6b7280', '#d1d5db'],
  default: ['#ffffff', '#e5e7eb', '#f3f4f6'],
}

// Particle burst using instanced mesh for performance
function ParticleBurst({ position, buildingType, onComplete }) {
  const meshRef = useRef()
  const particleCount = 20 // Reduced count for performance
  const startTime = useRef(performance.now())

  const colors = COLOR_SETS[buildingType] || COLOR_SETS.default
  const mainColor = colors[0]

  // Generate particle data once
  const particles = useMemo(() => {
    const data = []
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5
      const speed = 2 + Math.random() * 3
      const upSpeed = 4 + Math.random() * 5

      data.push({
        startPos: [
          position[0] + (Math.random() - 0.5) * 1.5,
          position[1] + Math.random() * 1.5,
          position[2] + (Math.random() - 0.5) * 1.5,
        ],
        velocity: [
          Math.cos(angle) * speed,
          upSpeed,
          Math.sin(angle) * speed,
        ],
        scale: 0.4 + Math.random() * 0.4,
        delay: i * 0.02,
      })
    }
    return data
  }, [position])

  // Create instanced mesh
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    // Cleanup after animation
    const timer = setTimeout(() => {
      onComplete?.()
    }, 1500)
    return () => clearTimeout(timer)
  }, [onComplete])

  useFrame(() => {
    if (!meshRef.current) return

    const elapsed = (performance.now() - startTime.current) / 1000
    const gravity = -12
    const lifespan = 1.2

    particles.forEach((p, i) => {
      const t = Math.max(0, elapsed - p.delay)
      if (t <= 0) {
        // Not started yet - hide it
        dummy.scale.setScalar(0)
      } else {
        const progress = t / lifespan
        if (progress >= 1) {
          dummy.scale.setScalar(0)
        } else {
          // Update position with physics
          dummy.position.set(
            p.startPos[0] + p.velocity[0] * t * 0.5,
            p.startPos[1] + p.velocity[1] * t + 0.5 * gravity * t * t,
            p.startPos[2] + p.velocity[2] * t * 0.5
          )

          // Rotation
          dummy.rotation.x = t * 3
          dummy.rotation.y = t * 4

          // Scale and fade
          const scale = p.scale * (1 - progress * 0.5)
          dummy.scale.setScalar(scale)
        }
      }

      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true

    // Update opacity on material
    const opacity = Math.max(0, 1 - elapsed / lifespan)
    meshRef.current.material.opacity = opacity
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[voxelGeometry, null, particleCount]}
      frustumCulled={false}
    >
      <meshBasicMaterial
        color={mainColor}
        transparent
        opacity={1}
      />
    </instancedMesh>
  )
}

// Shared sparkle material
const sparkleMaterial = new THREE.MeshBasicMaterial({
  color: '#fbbf24',
  transparent: true,
  opacity: 0.5,
})

// Construction sparkles using instanced mesh
function ConstructionSparkles({ position, progress }) {
  const meshRef = useRef()
  const sparkleCount = 12 // Reduced for performance
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const sparkles = useMemo(() => {
    const arr = []
    for (let i = 0; i < sparkleCount; i++) {
      arr.push({
        offset: [
          (Math.random() - 0.5) * 2.5,
          Math.random() * 3,
          (Math.random() - 0.5) * 2.5,
        ],
        speed: 0.5 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
      })
    }
    return arr
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return

    sparkles.forEach((sparkle, i) => {
      const time = state.clock.elapsedTime * sparkle.speed + sparkle.phase

      // Float upward with wave motion
      const y = (sparkle.offset[1] + (time * 0.5) % 4)
      const x = sparkle.offset[0] + Math.sin(time) * 0.2
      const z = sparkle.offset[2] + Math.cos(time) * 0.2

      dummy.position.set(
        position[0] + x,
        position[1] + y,
        position[2] + z
      )

      // Pulse scale
      const scale = 0.08 * (0.5 + Math.sin(time * 3) * 0.5) * progress
      dummy.scale.setScalar(scale)

      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    meshRef.current.material.opacity = 0.5 * progress
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[voxelGeometry, sparkleMaterial, sparkleCount]}
      frustumCulled={false}
    />
  )
}

// Manager component that tracks building completions
export function VoxelEffectsManager() {
  const [bursts, setBursts] = useState([])
  const placedBuildings = useGameStore((state) => state.placedBuildings)
  const lastBuildingCount = useRef(0)
  const currentBuildTask = useGameStore((state) => state.currentBuildTask)

  // Detect new buildings - limit active bursts to prevent memory issues
  useEffect(() => {
    if (placedBuildings.length > lastBuildingCount.current) {
      const newBuilding = placedBuildings[placedBuildings.length - 1]

      setBursts((prev) => {
        // Keep only last 5 bursts to prevent accumulation
        const limited = prev.slice(-4)
        return [
          ...limited,
          {
            id: Date.now(),
            position: newBuilding.position,
            buildingType: newBuilding.metadata?.buildingType || 'residential',
          },
        ]
      })
    }
    lastBuildingCount.current = placedBuildings.length
  }, [placedBuildings])

  const removeBurst = (id) => {
    setBursts((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <>
      {bursts.map((burst) => (
        <ParticleBurst
          key={burst.id}
          position={burst.position}
          buildingType={burst.buildingType}
          onComplete={() => removeBurst(burst.id)}
        />
      ))}

      {currentBuildTask && (
        <ConstructionSparkles
          position={currentBuildTask.position}
          progress={currentBuildTask.progress || 0}
        />
      )}
    </>
  )
}

export default VoxelEffectsManager
