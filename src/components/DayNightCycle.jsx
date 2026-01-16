import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'

// Time phases with their lighting settings
const TIME_SETTINGS = {
  dawn: {
    ambientIntensity: 0.4,
    ambientColor: '#ffb366',
    sunIntensity: 0.6,
    sunColor: '#ff9944',
    sunPosition: [-10, 5, -5],
    skyColor: '#ff9966',
    fogColor: '#ffccaa',
    fogDensity: 0.015,
  },
  day: {
    ambientIntensity: 0.6,
    ambientColor: '#ffffff',
    sunIntensity: 1.2,
    sunColor: '#ffffee',
    sunPosition: [10, 20, 10],
    skyColor: '#87ceeb',
    fogColor: '#c9e9ff',
    fogDensity: 0.008,
  },
  dusk: {
    ambientIntensity: 0.35,
    ambientColor: '#ff8866',
    sunIntensity: 0.5,
    sunColor: '#ff6633',
    sunPosition: [10, 5, -5],
    skyColor: '#ff7744',
    fogColor: '#ffaa88',
    fogDensity: 0.015,
  },
  night: {
    ambientIntensity: 0.15,
    ambientColor: '#334466',
    sunIntensity: 0.2,
    sunColor: '#8899bb',
    sunPosition: [-5, 15, 5],
    skyColor: '#112244',
    fogColor: '#1a2a4a',
    fogDensity: 0.02,
  },
}

// Lerp between colors
const lerpColor = (color1, color2, t) => {
  const c1 = new THREE.Color(color1)
  const c2 = new THREE.Color(color2)
  return c1.lerp(c2, t)
}

// Lerp between vectors
const lerpVector = (v1, v2, t) => {
  return [
    v1[0] + (v2[0] - v1[0]) * t,
    v1[1] + (v2[1] - v1[1]) * t,
    v1[2] + (v2[2] - v1[2]) * t,
  ]
}

// Get current time phase and transition progress
const getTimePhase = (timeOfDay) => {
  // 0-6: night->dawn, 6-12: dawn->day, 12-18: day->dusk, 18-24: dusk->night
  if (timeOfDay < 6) {
    return { from: 'night', to: 'dawn', t: timeOfDay / 6 }
  } else if (timeOfDay < 12) {
    return { from: 'dawn', to: 'day', t: (timeOfDay - 6) / 6 }
  } else if (timeOfDay < 18) {
    return { from: 'day', to: 'dusk', t: (timeOfDay - 12) / 6 }
  } else {
    return { from: 'dusk', to: 'night', t: (timeOfDay - 18) / 6 }
  }
}

function DayNightCycle() {
  const timeOfDay = useGameStore((state) => state.timeOfDay)
  const weather = useGameStore((state) => state.weather)

  const ambientRef = useRef()
  const sunRef = useRef()

  useFrame(({ scene }) => {
    const { from, to, t } = getTimePhase(timeOfDay)
    const fromSettings = TIME_SETTINGS[from]
    const toSettings = TIME_SETTINGS[to]

    // Interpolate all values
    const ambientIntensity = fromSettings.ambientIntensity + (toSettings.ambientIntensity - fromSettings.ambientIntensity) * t
    const sunIntensity = fromSettings.sunIntensity + (toSettings.sunIntensity - fromSettings.sunIntensity) * t
    const ambientColor = lerpColor(fromSettings.ambientColor, toSettings.ambientColor, t)
    const sunColor = lerpColor(fromSettings.sunColor, toSettings.sunColor, t)
    const sunPosition = lerpVector(fromSettings.sunPosition, toSettings.sunPosition, t)
    const fogColor = lerpColor(fromSettings.fogColor, toSettings.fogColor, t)
    const fogDensity = fromSettings.fogDensity + (toSettings.fogDensity - fromSettings.fogDensity) * t

    // Apply weather modifiers
    let weatherMod = 1
    if (weather === 'rain') {
      weatherMod = 0.5 // Darker during rain
    } else if (weather === 'snow') {
      weatherMod = 0.7 // Slightly darker during snow
    }

    // Update ambient light
    if (ambientRef.current) {
      ambientRef.current.intensity = ambientIntensity * weatherMod
      ambientRef.current.color = ambientColor
    }

    // Update sun/moon light
    if (sunRef.current) {
      sunRef.current.intensity = sunIntensity * weatherMod
      sunRef.current.color = sunColor
      sunRef.current.position.set(...sunPosition)
    }

    // Update scene fog
    if (scene.fog) {
      scene.fog.color = fogColor
      scene.fog.density = weather === 'rain' ? fogDensity * 2 : fogDensity
    } else {
      scene.fog = new THREE.FogExp2(fogColor, weather === 'rain' ? fogDensity * 2 : fogDensity)
    }

    // Update scene background
    const bgColor = lerpColor(fromSettings.skyColor, toSettings.skyColor, t)
    if (weather === 'rain') {
      scene.background = new THREE.Color('#556677')
    } else if (weather === 'snow') {
      scene.background = new THREE.Color('#aabbcc')
    } else {
      scene.background = bgColor
    }
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.6} />
      <directionalLight
        ref={sunRef}
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
    </>
  )
}

export default DayNightCycle
