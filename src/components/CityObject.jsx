import React, { useRef, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'

// Check if it's nighttime (windows and lights should be on)
const isNightTime = (timeOfDay) => {
  return timeOfDay < 6 || timeOfDay > 18
}

// Get light intensity based on time (smooth transition)
const getLightIntensity = (timeOfDay) => {
  if (timeOfDay >= 6 && timeOfDay <= 7) {
    // Dawn transition: lights fading out
    return 1 - (timeOfDay - 6)
  } else if (timeOfDay >= 17 && timeOfDay <= 18) {
    // Dusk transition: lights fading in
    return timeOfDay - 17
  } else if (timeOfDay < 6 || timeOfDay > 18) {
    return 1
  }
  return 0
}

// Generic component for loading any city object from the KayKit bundle
function CityObject({
  model,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1
}) {
  const { scene } = useGLTF(`/models/city/${model}.gltf`)
  const timeOfDay = useGameStore((state) => state.timeOfDay)
  const groupRef = useRef()
  const materialsRef = useRef([])

  const isStreetlight = model.includes('streetlight')
  const isBuilding = model.includes('building')

  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    materialsRef.current = []

    // Enable shadows and setup materials on all meshes
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true

        // Clone material to avoid affecting other instances
        if (child.material) {
          child.material = child.material.clone()

          // Track window-like materials for buildings
          if (isBuilding && child.material.color) {
            const color = child.material.color
            const matName = child.material.name?.toLowerCase() || ''
            const meshName = child.name?.toLowerCase() || ''

            // Detect windows by name or by color (lighter colors, cyan/blue tints)
            const isWindowByName = matName.includes('window') || matName.includes('glass') ||
                meshName.includes('window') || meshName.includes('glass')

            // Check for typical window colors (lighter blue/cyan or dark for glass)
            const r = color.r, g = color.g, b = color.b
            const isLightColor = (r + g + b) / 3 > 0.5
            const isBlueTint = b > r && b > g * 0.8
            const isDarkGlass = (r + g + b) / 3 < 0.2

            if (isWindowByName || (isBuilding && (isBlueTint || isDarkGlass))) {
              materialsRef.current.push({
                material: child.material,
                type: 'window',
                originalColor: child.material.color.clone()
              })
            }
          }
        }
      }
    })

    return clone
  }, [scene, isBuilding])

  // Update emissive materials based on time of day
  useFrame(() => {
    const intensity = getLightIntensity(timeOfDay)

    materialsRef.current.forEach(({ material, type, originalColor }) => {
      if (type === 'window' && intensity > 0) {
        // Make windows glow warm yellow at night
        material.emissive = new THREE.Color('#ffaa44')
        material.emissiveIntensity = intensity * 0.8
      } else if (type === 'window') {
        material.emissiveIntensity = 0
      }
    })
  })

  // Calculate light position offset based on streetlight type (in local model space before scale)
  const lightOffset = useMemo(() => {
    if (model === 'streetlight') return [-0.18, 0.92, 0]
    if (model === 'streetlight_old_single') return [0.15, 0.85, 0]
    if (model === 'streetlight_old_double') return [0, 0.85, 0]
    return [0, 0.85, 0]
  }, [model])

  const lightIntensity = getLightIntensity(timeOfDay)

  // Building window light positions (simulate light coming from windows)
  const buildingLights = useMemo(() => {
    if (!isBuilding) return []
    // Add a few window lights at different heights
    return [
      { pos: [0.3, 1.2, 0.3], color: '#ffdd99' },
      { pos: [-0.3, 2.0, 0.3], color: '#ffcc77' },
      { pos: [0.2, 1.6, -0.3], color: '#ffeebb' },
    ]
  }, [isBuilding])

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <primitive
        object={clonedScene}
        scale={scale}
      />
      {/* Add point light for streetlights */}
      {isStreetlight && lightIntensity > 0 && (
        <>
          <pointLight
            position={[lightOffset[0] * scale, lightOffset[1] * scale, lightOffset[2] * scale]}
            color="#ffcc77"
            intensity={lightIntensity * 3}
            distance={8 * scale}
            decay={2}
            castShadow={false}
          />
          {/* Small glowing bulb effect */}
          <mesh position={[lightOffset[0] * scale, lightOffset[1] * scale, lightOffset[2] * scale]}>
            <sphereGeometry args={[0.028 * scale, 8, 8]} />
            <meshBasicMaterial color="#ffdd88" transparent opacity={lightIntensity * 0.9} />
          </mesh>
        </>
      )}
      {/* Add window lights for buildings at night */}
      {isBuilding && lightIntensity > 0 && buildingLights.map((light, i) => (
        <pointLight
          key={i}
          position={[light.pos[0] * scale, light.pos[1] * scale, light.pos[2] * scale]}
          color={light.color}
          intensity={lightIntensity * 1.5}
          distance={4 * scale}
          decay={2}
          castShadow={false}
        />
      ))}
    </group>
  )
}

// Available models list for reference
export const CITY_MODELS = {
  // Buildings
  buildings: [
    'building_A', 'building_B', 'building_C', 'building_D',
    'building_E', 'building_F', 'building_G', 'building_H',
    'building_A_withoutBase', 'building_B_withoutBase', 'building_C_withoutBase',
    'building_D_withoutBase', 'building_E_withoutBase', 'building_F_withoutBase',
    'building_G_withoutBase', 'building_H_withoutBase',
    'watertower'
  ],
  // Roads
  roads: [
    'road_straight', 'road_corner', 'road_corner_curved',
    'road_junction', 'road_tsplit', 'road_straight_crossing'
  ],
  // Park elements
  park: [
    'park_base', 'park_base_decorated_bushes', 'park_base_decorated_trees',
    'park_road_corner', 'park_road_corner_decorated',
    'park_road_junction', 'park_road_junction_decorated_A',
    'park_road_junction_decorated_B', 'park_road_junction_decorated_C',
    'park_road_straight', 'park_road_straight_decorated_A', 'park_road_straight_decorated_B',
    'park_road_tsplit', 'park_road_tsplit_decorated',
    'park_wall_entry', 'park_wall_entry_decorated',
    'park_wall_innerCorner', 'park_wall_innerCorner_decorated',
    'park_wall_outerCorner', 'park_wall_outerCorner_decorated',
    'park_wall_straight', 'park_wall_straight_decorated'
  ],
  // Vehicles
  vehicles: [
    'car_hatchback', 'car_police', 'car_sedan', 'car_stationwagon', 'car_taxi'
  ],
  // Props
  props: [
    'bench', 'bush', 'bush_A', 'bush_B', 'bush_C',
    'tree_A', 'tree_B', 'tree_C', 'tree_D', 'tree_E',
    'streetlight', 'streetlight_old_double', 'streetlight_old_single',
    'trafficlight_A', 'trafficlight_B', 'trafficlight_C',
    'firehydrant', 'dumpster', 'trash_A', 'trash_B',
    'box_A', 'box_B', 'base'
  ]
}

export default CityObject
