import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'

// Weather area size - large enough to cover the entire city
const WEATHER_SIZE = 500
const WEATHER_HEIGHT = 50

// Rain particle system
function Rain() {
  const particlesRef = useRef()
  const particleCount = 15000 // More particles for larger area

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      // Spread particles across entire weather area
      positions[i * 3] = (Math.random() - 0.5) * WEATHER_SIZE
      positions[i * 3 + 1] = Math.random() * WEATHER_HEIGHT
      positions[i * 3 + 2] = (Math.random() - 0.5) * WEATHER_SIZE
      velocities[i] = 0.4 + Math.random() * 0.3 // Fall speed variation
    }

    return { positions, velocities }
  }, [])

  useFrame(() => {
    if (!particlesRef.current) return

    const posArray = particlesRef.current.geometry.attributes.position.array

    for (let i = 0; i < particleCount; i++) {
      // Move rain down
      posArray[i * 3 + 1] -= velocities[i]

      // Reset to top when hitting ground
      if (posArray[i * 3 + 1] < 0) {
        posArray[i * 3 + 1] = WEATHER_HEIGHT
        posArray[i * 3] = (Math.random() - 0.5) * WEATHER_SIZE
        posArray[i * 3 + 2] = (Math.random() - 0.5) * WEATHER_SIZE
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#8ec8e8"
        size={0.12}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

// Snow particle system
function Snow() {
  const particlesRef = useRef()
  const particleCount = 10000 // More particles for larger area

  const { positions, velocities, wobble } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount)
    const wobble = new Float32Array(particleCount * 2) // x and z wobble phase

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * WEATHER_SIZE
      positions[i * 3 + 1] = Math.random() * WEATHER_HEIGHT
      positions[i * 3 + 2] = (Math.random() - 0.5) * WEATHER_SIZE
      velocities[i] = 0.03 + Math.random() * 0.04 // Slow fall
      wobble[i * 2] = Math.random() * Math.PI * 2 // x phase
      wobble[i * 2 + 1] = Math.random() * Math.PI * 2 // z phase
    }

    return { positions, velocities, wobble }
  }, [])

  const timeRef = useRef(0)

  useFrame((state, delta) => {
    if (!particlesRef.current) return

    timeRef.current += delta
    const posArray = particlesRef.current.geometry.attributes.position.array

    for (let i = 0; i < particleCount; i++) {
      // Move snow down with gentle wobble
      posArray[i * 3 + 1] -= velocities[i]
      posArray[i * 3] += Math.sin(timeRef.current * 2 + wobble[i * 2]) * 0.008
      posArray[i * 3 + 2] += Math.cos(timeRef.current * 2 + wobble[i * 2 + 1]) * 0.008

      // Reset to top when hitting ground
      if (posArray[i * 3 + 1] < 0) {
        posArray[i * 3 + 1] = WEATHER_HEIGHT
        posArray[i * 3] = (Math.random() - 0.5) * WEATHER_SIZE
        posArray[i * 3 + 2] = (Math.random() - 0.5) * WEATHER_SIZE
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.2}
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  )
}

function Weather() {
  const weather = useGameStore((state) => state.weather)

  if (weather === 'clear') return null

  return (
    <>
      {weather === 'rain' && <Rain />}
      {weather === 'snow' && <Snow />}
    </>
  )
}

export default Weather
