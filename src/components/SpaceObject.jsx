import React, { useRef, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Generic component for loading space base models
function SpaceObject({
  model,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1
}) {
  const { scene } = useGLTF(`/models/space/${model}.gltf`)
  const groupRef = useRef()

  const clonedScene = useMemo(() => {
    const clone = scene.clone()

    // Enable shadows on all meshes (share materials to prevent uniform overflow)
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        // Note: We intentionally don't clone materials here to prevent
        // WebGL shader uniform overflow when many buildings are placed
      }
    })

    return clone
  }, [scene])

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <primitive
        object={clonedScene}
        scale={scale}
      />
    </group>
  )
}

// Available space models list for reference
export const SPACE_MODELS = {
  // Base modules
  modules: [
    'basemodule_A', 'basemodule_B', 'basemodule_C', 'basemodule_D', 'basemodule_E',
    'basemodule_garage', 'dome', 'eco_module', 'water_storage'
  ],
  // Roof modules
  roofs: [
    'roofmodule_base', 'roofmodule_cargo_A', 'roofmodule_cargo_B', 'roofmodule_cargo_C',
    'roofmodule_solarpanels'
  ],
  // Cargo and containers
  cargo: [
    'cargo_A', 'cargo_A_packed', 'cargo_A_stacked',
    'cargo_B', 'cargo_B_packed', 'cargo_B_stacked',
    'containers_A', 'containers_B', 'containers_C', 'containers_D',
    'cargodepot_A', 'cargodepot_B', 'cargodepot_C'
  ],
  // Vehicles and ships
  vehicles: [
    'dropship', 'dropship_packed', 'lander_A', 'lander_B', 'lander_base',
    'spacetruck', 'spacetruck_large', 'spacetruck_trailer',
    'mobile_base_cargo', 'mobile_base_carriage', 'mobile_base_command', 'mobile_base_frame'
  ],
  // Landing pads
  pads: [
    'landingpad_large', 'landingpad_small'
  ],
  // Structures
  structures: [
    'structure_low', 'structure_tall', 'drill_structure',
    'space_farm_large', 'space_farm_large_sprinkler', 'space_farm_small',
    'solarpanel', 'lights'
  ],
  // Terrain
  terrain: [
    'terrain_low', 'terrain_low_curved', 'terrain_mining',
    'terrain_slope', 'terrain_slope_inner_corner', 'terrain_slope_outer_corner',
    'terrain_tall', 'terrain_tall_curved'
  ],
  // Tunnels
  tunnels: [
    'tunnel_diagonal_long_A', 'tunnel_diagonal_long_B',
    'tunnel_diagonal_short_A', 'tunnel_diagonal_short_B',
    'tunnel_straight_A', 'tunnel_straight_B'
  ],
  // Rocks/debris
  rocks: [
    'rock_A', 'rock_B', 'rocks_A', 'rocks_B'
  ]
}

export default SpaceObject
