import React, { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

// Building sizes in grid units (1 grid unit = 2 world units, matching building scale)
// Format: [width, depth] in grid squares
export const BUILDING_SIZES = {
  // Base modules - various sizes
  'basemodule_A': [1, 1],
  'basemodule_B': [1, 1],
  'basemodule_C': [1, 1],
  'basemodule_D': [1, 1],
  'basemodule_E': [1, 1],
  'basemodule_garage': [2, 1],
  'dome': [1, 1],
  'eco_module': [1, 1],
  'water_storage': [1, 1],

  // Roof modules
  'roofmodule_base': [1, 1],
  'roofmodule_cargo_A': [1, 1],
  'roofmodule_cargo_B': [1, 1],
  'roofmodule_cargo_C': [1, 1],
  'roofmodule_solarpanels': [1, 1],

  // Cargo and containers
  'cargo_A': [1, 1],
  'cargo_A_packed': [1, 1],
  'cargo_A_stacked': [1, 1],
  'cargo_B': [1, 1],
  'cargo_B_packed': [1, 1],
  'cargo_B_stacked': [1, 1],
  'containers_A': [1, 1],
  'containers_B': [1, 1],
  'containers_C': [1, 1],
  'containers_D': [1, 1],
  'cargodepot_A': [2, 1],
  'cargodepot_B': [2, 1],
  'cargodepot_C': [2, 1],

  // Vehicles
  'dropship': [2, 2],
  'dropship_packed': [2, 2],
  'lander_A': [1, 1],
  'lander_B': [1, 1],
  'lander_base': [1, 1],
  'spacetruck': [1, 2],
  'spacetruck_large': [1, 2],
  'spacetruck_trailer': [1, 2],
  'mobile_base_cargo': [1, 2],
  'mobile_base_carriage': [1, 2],
  'mobile_base_command': [1, 2],
  'mobile_base_frame': [1, 2],

  // Landing pads
  'landingpad_large': [2, 2],
  'landingpad_small': [1, 1],

  // Structures
  'structure_low': [1, 1],
  'structure_tall': [1, 1],
  'drill_structure': [1, 1],
  'space_farm_large': [2, 2],
  'space_farm_small': [1, 1],
  'solarpanel': [1, 1],
  'lights': [1, 1],

  // Terrain
  'terrain_low': [1, 1],
  'terrain_tall': [1, 1],

  // Tunnels
  'tunnel_straight_A': [1, 1],
  'tunnel_straight_B': [1, 1],
  'tunnel_diagonal_short_A': [1, 1],
  'tunnel_diagonal_long_A': [2, 1],

  // Rocks
  'rock_A': [1, 1],
  'rock_B': [1, 1],
  'rocks_A': [1, 1],
  'rocks_B': [1, 1],
}

// Get size for a model, default to 1x1
export const getBuildingSize = (model) => BUILDING_SIZES[model] || [1, 1]

const MENU_CATEGORIES = [
  {
    name: 'Modules',
    items: [
      { model: 'basemodule_A', label: 'Module A' },
      { model: 'basemodule_B', label: 'Module B' },
      { model: 'basemodule_C', label: 'Module C' },
      { model: 'basemodule_D', label: 'Module D' },
      { model: 'basemodule_garage', label: 'Garage' },
      { model: 'dome', label: 'Dome' },
      { model: 'eco_module', label: 'Eco Module' },
      { model: 'water_storage', label: 'Water Tank' },
    ]
  },
  {
    name: 'Roofs',
    items: [
      { model: 'roofmodule_base', label: 'Roof Base' },
      { model: 'roofmodule_cargo_A', label: 'Roof Cargo' },
      { model: 'roofmodule_solarpanels', label: 'Solar Roof' },
    ]
  },
  {
    name: 'Cargo',
    items: [
      { model: 'cargo_A', label: 'Cargo A' },
      { model: 'cargo_B', label: 'Cargo B' },
      { model: 'cargo_A_stacked', label: 'Stacked Cargo' },
      { model: 'containers_A', label: 'Containers A' },
      { model: 'containers_B', label: 'Containers B' },
      { model: 'cargodepot_A', label: 'Cargo Depot' },
    ]
  },
  {
    name: 'Vehicles',
    items: [
      { model: 'dropship', label: 'Dropship' },
      { model: 'lander_A', label: 'Lander A' },
      { model: 'lander_B', label: 'Lander B' },
      { model: 'spacetruck', label: 'Space Truck' },
      { model: 'spacetruck_large', label: 'Large Truck' },
      { model: 'mobile_base_command', label: 'Mobile Base' },
    ]
  },
  {
    name: 'Structures',
    items: [
      { model: 'landingpad_large', label: 'Landing Pad L' },
      { model: 'landingpad_small', label: 'Landing Pad S' },
      { model: 'solarpanel', label: 'Solar Panel' },
      { model: 'drill_structure', label: 'Drill' },
      { model: 'space_farm_small', label: 'Small Farm' },
      { model: 'lights', label: 'Lights' },
    ]
  },
  {
    name: 'Terrain',
    items: [
      { model: 'rock_A', label: 'Rock A' },
      { model: 'rock_B', label: 'Rock B' },
      { model: 'rocks_A', label: 'Rocks A' },
      { model: 'rocks_B', label: 'Rocks B' },
      { model: 'terrain_low', label: 'Low Terrain' },
      { model: 'terrain_tall', label: 'Tall Terrain' },
    ]
  },
  {
    name: 'Tunnels',
    items: [
      { model: 'tunnel_straight_A', label: 'Tunnel Straight' },
      { model: 'tunnel_straight_B', label: 'Tunnel B' },
      { model: 'tunnel_diagonal_short_A', label: 'Diagonal Short' },
      { model: 'tunnel_diagonal_long_A', label: 'Diagonal Long' },
    ]
  },
]

// Create placement sound
let audioContext = null
const playPlacementSound = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }

  const now = audioContext.currentTime

  // Main pop sound
  const osc1 = audioContext.createOscillator()
  const gain1 = audioContext.createGain()
  osc1.connect(gain1)
  gain1.connect(audioContext.destination)
  osc1.frequency.setValueAtTime(400, now)
  osc1.frequency.exponentialRampToValueAtTime(600, now + 0.05)
  osc1.frequency.exponentialRampToValueAtTime(300, now + 0.1)
  osc1.type = 'square'
  gain1.gain.setValueAtTime(0.2, now)
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
  osc1.start(now)
  osc1.stop(now + 0.15)

  // Satisfying click
  const osc2 = audioContext.createOscillator()
  const gain2 = audioContext.createGain()
  osc2.connect(gain2)
  gain2.connect(audioContext.destination)
  osc2.frequency.setValueAtTime(800, now)
  osc2.frequency.exponentialRampToValueAtTime(400, now + 0.05)
  osc2.type = 'triangle'
  gain2.gain.setValueAtTime(0.15, now)
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
  osc2.start(now)
  osc2.stop(now + 0.08)
}

function BuildMenu() {
  const buildMenu = useGameStore((state) => state.buildMenu)
  const closeBuildMenu = useGameStore((state) => state.closeBuildMenu)
  const startBuildTask = useGameStore((state) => state.startBuildTask)
  const setPreviewModel = useGameStore((state) => state.setPreviewModel)

  // Clear preview when menu closes
  useEffect(() => {
    if (!buildMenu.isOpen) {
      setPreviewModel(null)
    }
  }, [buildMenu.isOpen, setPreviewModel])

  if (!buildMenu.isOpen) return null

  const handleSelectItem = (model) => {
    playPlacementSound()
    startBuildTask(model, buildMenu.position)
    closeBuildMenu()
  }

  const handleHoverItem = (model) => {
    setPreviewModel(model)
  }

  const handleLeaveItem = () => {
    setPreviewModel(null)
  }

  const handleClose = (e) => {
    e.stopPropagation()
    closeBuildMenu()
  }

  // Position menu to the right side of screen, away from the grid preview
  const menuX = Math.min(buildMenu.screenPosition?.x + 200 || 0, window.innerWidth - 250)
  const menuY = Math.max(Math.min(buildMenu.screenPosition?.y || 0, window.innerHeight - 250), 50)

  return (
    <div
      style={{
        position: 'fixed',
        left: menuX,
        top: menuY,
        zIndex: 1000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
        }}
        onClick={handleClose}
      />

      {/* Menu */}
      <div
        style={{
          background: 'rgba(30, 30, 50, 0.95)',
          border: '2px solid #4a5568',
          borderRadius: '12px',
          padding: '12px',
          maxHeight: '400px',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          minWidth: '220px',
        }}
      >
        <div style={{
          color: '#7dd3a0',
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '8px',
          textAlign: 'center',
          borderBottom: '1px solid #4a5568',
          paddingBottom: '8px',
        }}>
          Build Something
        </div>

        {MENU_CATEGORIES.map((category) => (
          <div key={category.name} style={{ marginBottom: '8px' }}>
            <div style={{
              color: '#a0aec0',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              marginBottom: '4px',
              marginTop: '8px',
            }}>
              {category.name}
            </div>
            {category.items.map((item) => {
              const size = getBuildingSize(item.model)
              return (
                <button
                  key={item.model}
                  onClick={() => handleSelectItem(item.model)}
                  onMouseEnter={() => handleHoverItem(item.model)}
                  onMouseLeave={handleLeaveItem}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: '6px 10px',
                    margin: '2px 0',
                    background: 'rgba(74, 85, 104, 0.5)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(125, 211, 160, 0.3)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(74, 85, 104, 0.5)'}
                >
                  <span>{item.label}</span>
                  <span style={{
                    fontSize: '10px',
                    color: '#7dd3a0',
                    background: 'rgba(125, 211, 160, 0.2)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}>
                    {size[0]}x{size[1]}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default BuildMenu
