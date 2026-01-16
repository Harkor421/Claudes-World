import React from 'react'
import { Html } from '@react-three/drei'
import { useGameStore } from '../store/gameStore'
import SpaceObject from './SpaceObject'
import CityObject from './CityObject'

// Space models list for folder detection
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

// Determine folder from model name or explicit folder property
const getModelFolder = (model, folder) => {
  if (SPACE_MODELS.includes(model)) return 'space'
  return folder || 'city'
}

// Shows the building being constructed with progress
function BuildProgress() {
  const currentBuildTask = useGameStore((state) => state.currentBuildTask)
  const isBuilding = useGameStore((state) => state.isBuilding)

  if (!currentBuildTask) return null

  const progress = currentBuildTask.progress || 0
  const position = currentBuildTask.position
  const folder = getModelFolder(currentBuildTask.model, currentBuildTask.folder)
  const ObjectComponent = folder === 'space' ? SpaceObject : CityObject

  return (
    <group position={position}>
      {/* Ghost preview of building being constructed */}
      <group scale={[2 * progress, 2 * progress, 2 * progress]}>
        <ObjectComponent
          model={currentBuildTask.model}
          position={[0, 0, 0]}
          scale={1}
        />
      </group>

      {/* Construction particles/effect */}
      {isBuilding && (
        <>
          {/* Dust particles */}
          {[...Array(5)].map((_, i) => (
            <mesh
              key={i}
              position={[
                Math.sin(Date.now() / 200 + i) * 0.5,
                0.3 + Math.sin(Date.now() / 300 + i * 2) * 0.3,
                Math.cos(Date.now() / 200 + i) * 0.5
              ]}
            >
              <boxGeometry args={[0.1, 0.1, 0.1]} />
              <meshBasicMaterial color="#d4a574" transparent opacity={0.6} />
            </mesh>
          ))}
        </>
      )}

      {/* Progress bar above construction site */}
      <Html position={[0, 3, 0]} center>
        <div style={{
          background: 'rgba(0,0,0,0.7)',
          padding: '4px 8px',
          borderRadius: '4px',
          minWidth: '80px',
        }}>
          <div style={{
            color: '#7dd3a0',
            fontSize: '10px',
            marginBottom: '4px',
            textAlign: 'center',
          }}>
            Building...
          </div>
          <div style={{
            background: '#333',
            borderRadius: '2px',
            height: '6px',
            overflow: 'hidden',
          }}>
            <div style={{
              background: '#7dd3a0',
              height: '100%',
              width: `${progress * 100}%`,
              transition: 'width 0.1s',
            }} />
          </div>
          <div style={{
            color: '#aaa',
            fontSize: '9px',
            marginTop: '2px',
            textAlign: 'center',
          }}>
            {Math.round(progress * 100)}%
          </div>
        </div>
      </Html>
    </group>
  )
}

export default BuildProgress
