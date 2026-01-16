import React, { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

// Building sizes in grid units (1 unit = 1 grid square)
// Format: [width, depth] in grid squares
export const BUILDING_SIZES = {
  // Buildings (larger footprints)
  'building_A': [2, 2],
  'building_B': [2, 2],
  'building_C': [2, 2],
  'building_D': [2, 2],
  'building_E': [2, 2],
  'building_F': [2, 2],
  'building_G': [2, 2],
  'building_H': [2, 2],
  'watertower': [1, 1],

  // Roads (standard road width)
  'road_straight': [2, 2],
  'road_corner': [2, 2],
  'road_corner_curved': [2, 2],
  'road_junction': [2, 2],
  'road_tsplit': [2, 2],
  'road_straight_crossing': [2, 2],

  // Nature (smaller)
  'tree_A': [1, 1],
  'tree_B': [1, 1],
  'tree_C': [1, 1],
  'tree_D': [1, 1],
  'tree_E': [1, 1],
  'bush': [1, 1],
  'bush_A': [1, 1],
  'bush_B': [1, 1],
  'bush_C': [1, 1],

  // Props (small)
  'bench': [1, 1],
  'streetlight': [1, 1],
  'streetlight_old_single': [1, 1],
  'streetlight_old_double': [1, 1],
  'firehydrant': [1, 1],
  'dumpster': [1, 1],
  'trash_A': [1, 1],
  'trash_B': [1, 1],
  'box_A': [1, 1],
  'box_B': [1, 1],

  // Vehicles
  'car_sedan': [1, 2],
  'car_taxi': [1, 2],
  'car_police': [1, 2],
  'car_hatchback': [1, 2],
  'car_stationwagon': [1, 2],
}

// Get size for a model, default to 1x1
export const getBuildingSize = (model) => BUILDING_SIZES[model] || [1, 1]

const MENU_CATEGORIES = [
  {
    name: 'Buildings',
    items: [
      { model: 'building_A', label: 'Shop' },
      { model: 'building_B', label: 'Apartment' },
      { model: 'building_C', label: 'Office' },
      { model: 'building_D', label: 'Red Building' },
      { model: 'building_E', label: 'Tall Building' },
      { model: 'building_F', label: 'Green Building' },
      { model: 'building_G', label: 'Yellow Building' },
      { model: 'building_H', label: 'Blue Building' },
      { model: 'watertower', label: 'Water Tower' },
    ]
  },
  {
    name: 'Roads',
    items: [
      { model: 'road_straight', label: 'Road Straight' },
      { model: 'road_corner', label: 'Road Corner' },
      { model: 'road_corner_curved', label: 'Road Curved' },
      { model: 'road_junction', label: 'Road Junction' },
      { model: 'road_tsplit', label: 'Road T-Split' },
    ]
  },
  {
    name: 'Nature',
    items: [
      { model: 'tree_A', label: 'Tree A' },
      { model: 'tree_B', label: 'Tree B' },
      { model: 'tree_C', label: 'Tree C' },
      { model: 'bush', label: 'Bush' },
      { model: 'bush_A', label: 'Bush A' },
    ]
  },
  {
    name: 'Props',
    items: [
      { model: 'bench', label: 'Bench' },
      { model: 'streetlight', label: 'Street Light' },
      { model: 'streetlight_old_single', label: 'Old Light' },
      { model: 'firehydrant', label: 'Fire Hydrant' },
      { model: 'dumpster', label: 'Dumpster' },
      { model: 'trash_A', label: 'Trash' },
    ]
  },
  {
    name: 'Vehicles',
    items: [
      { model: 'car_sedan', label: 'Sedan' },
      { model: 'car_taxi', label: 'Taxi' },
      { model: 'car_police', label: 'Police Car' },
      { model: 'car_hatchback', label: 'Hatchback' },
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

  return (
    <div
      style={{
        position: 'fixed',
        left: buildMenu.screenPosition?.x || 0,
        top: buildMenu.screenPosition?.y || 0,
        transform: 'translate(-50%, -50%)',
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
