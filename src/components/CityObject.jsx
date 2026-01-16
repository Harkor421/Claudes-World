import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

// Generic component for loading any city object from the KayKit bundle
function CityObject({
  model,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1
}) {
  const { scene } = useGLTF(`/models/city/${model}.gltf`)
  const clonedScene = scene.clone()

  // Enable shadows on all meshes
  clonedScene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
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
