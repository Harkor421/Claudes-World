import React from 'react'
import { OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import Ground from './Ground'
import Character from './Character'
import DayNightCycle from './DayNightCycle'
import SpaceObject from './SpaceObject'
import CityObject from './CityObject'
import BuildProgress from './BuildProgress'
import GridPreview from './GridPreview'
import { InteractiveBuilding } from './BuildingInteraction'
import VoxelEffectsManager from './VoxelParticles'
import VoxelClouds from './VoxelClouds'
import { useGameStore } from '../store/gameStore'

// Space models - used to detect folder when not specified
const SPACE_MODELS = [
  'basemodule_A', 'basemodule_B', 'basemodule_C', 'basemodule_D', 'basemodule_E',
  'basemodule_garage', 'dome', 'eco_module', 'water_storage',
  'roofmodule_base', 'roofmodule_cargo_A', 'roofmodule_cargo_B', 'roofmodule_cargo_C',
  'roofmodule_solarpanels',
  'cargo_A', 'cargo_A_packed', 'cargo_A_stacked',
  'cargo_B', 'cargo_B_packed', 'cargo_B_stacked',
  'containers_A', 'containers_B', 'containers_C', 'containers_D',
  'cargodepot_A', 'cargodepot_B', 'cargodepot_C',
  'dropship', 'dropship_packed', 'lander_A', 'lander_B', 'lander_base',
  'spacetruck', 'spacetruck_large', 'spacetruck_trailer',
  'mobile_base_cargo', 'mobile_base_carriage', 'mobile_base_command', 'mobile_base_frame',
  'landingpad_large', 'landingpad_small',
  'structure_low', 'structure_tall', 'drill_structure',
  'space_farm_large', 'space_farm_large_sprinkler', 'space_farm_small',
  'solarpanel', 'lights',
  'terrain_low', 'terrain_low_curved', 'terrain_mining',
  'terrain_slope', 'terrain_slope_inner_corner', 'terrain_slope_outer_corner',
  'terrain_tall', 'terrain_tall_curved',
  'tunnel_diagonal_long_A', 'tunnel_diagonal_long_B',
  'tunnel_diagonal_short_A', 'tunnel_diagonal_short_B',
  'tunnel_straight_A', 'tunnel_straight_B',
  'rock_A', 'rock_B', 'rocks_A', 'rocks_B'
]

// Determine which folder a model belongs to
const getModelFolder = (building) => {
  if (SPACE_MODELS.includes(building.model)) return 'space'
  return building.folder || 'city'
}

// Component to handle auto time advancement (synced with AI speed)
function TimeAdvancer() {
  const autoTimeEnabled = useGameStore((state) => state.autoTimeEnabled)
  const advanceTime = useGameStore((state) => state.advanceTime)
  const aiSpeed = useGameStore((state) => state.aiSpeed)

  useFrame((state, delta) => {
    if (autoTimeEnabled) {
      // Base: 1 real second = 30 game minutes (0.5 hours)
      // So 1 full day (24 hours) = 48 real seconds at 1x speed
      // At 10x speed: 1 full day = 4.8 real seconds
      const hoursPerSecond = 0.5 * aiSpeed // 0.5 hours per second * speed multiplier
      advanceTime(delta * hoursPerSecond)
    }
  })

  return null
}

function Game() {
  const placedBuildings = useGameStore((state) => state.placedBuildings)

  return (
    <>
      <DayNightCycle />
      <VoxelClouds />
      <TimeAdvancer />

      {/* Voxel particle effects */}
      <VoxelEffectsManager />

      {/* Isometric-style camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 3}
        minDistance={8}
        maxDistance={500}
      />

      {/* Ground plane */}
      <Ground />

      {/* The Claude character */}
      <Character />

      {/* === CRASHED SHIP - CHARACTER SPAWN/REST AREA === */}
      <SpaceObject
        model="dropship"
        position={[0, 0.2, 0]}
        rotation={[0.1, 0.3, 0.08]}
        scale={2}
      />
      <SpaceObject model="cargo_A" position={[-2.5, 0, 1.5]} rotation={[0.05, 0.6, 0]} scale={2} />
      <SpaceObject model="cargo_B" position={[2.5, 0, 1]} rotation={[0, -0.4, 0.05]} scale={2} />

      {/* Grid preview for building placement */}
      <GridPreview />

      {/* Building in progress */}
      <BuildProgress />

      {/* Player-placed buildings with interaction */}
      {placedBuildings.map((building) => {
        const folder = getModelFolder(building)
        const ObjectComponent = folder === 'space' ? SpaceObject : CityObject

        // Only wrap non-road buildings with interaction
        const isInteractive = building.metadata && building.metadata.buildingType !== 'road'

        if (isInteractive) {
          return (
            <InteractiveBuilding key={building.id} building={building}>
              <ObjectComponent
                model={building.model}
                position={building.position}
                rotation={building.rotation}
                scale={building.scale}
              />
            </InteractiveBuilding>
          )
        }

        return (
          <ObjectComponent
            key={building.id}
            model={building.model}
            position={building.position}
            rotation={building.rotation}
            scale={building.scale}
          />
        )
      })}
    </>
  )
}

export default Game
