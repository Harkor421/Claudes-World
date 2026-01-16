import React, { useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import { gameSocket } from '../services/socket'

// Building definitions for resource calculation (must match server)
const BUILDINGS = {
  // Space models
  solarpanel: { power: 15 },
  roofmodule_solarpanels: { power: 12 },
  water_storage: { water: 40 },
  space_farm_small: { food: 25, power: -5 },
  eco_module: { food: 15, water: 10, power: -3 },
  basemodule_A: { power: -3, water: -4, food: -3 },
  basemodule_B: { power: -3, water: -4, food: -3 },
  basemodule_C: { power: -3, water: -4, food: -3 },
  basemodule_D: { power: -3, water: -4, food: -3 },
  dome: { power: -6, water: -6, food: -5 },
  lights: { power: -1 },
  cargodepot_A: { power: -2 },
  drill_structure: { power: -8 },
  // City buildings
  building_A: { power: -5 },
  building_B: { power: -6 },
  building_C: { power: -4 },
  building_D: { power: -5 },
  building_E: { power: -7 },
  building_F: { power: -8 },
  building_G: { power: -10 },
  building_H: { power: -12 },
  // City infrastructure
  watertower: { water: 50, power: -2 },
  streetlight: { power: -1 },
  streetlight_old_single: { power: -1 },
  streetlight_old_double: { power: -1 },
  trafficlight_A: { power: -1 },
  trafficlight_B: { power: -1 },
  trafficlight_C: { power: -1 },
  // Roads (no resource cost, just track them)
  road_straight: { power: 0 },
  road_corner: { power: 0 },
  road_tsplit: { power: 0 },
  road_junction: { power: 0 },
}

const BASE_POWER_PER_BUILDING = 0.5

// Get mood emoji based on value
const getMoodEmoji = (mood) => {
  if (mood >= 80) return { emoji: ':)', label: 'Happy' }
  if (mood >= 60) return { emoji: ':|', label: 'Content' }
  if (mood >= 40) return { emoji: ':(', label: 'Tired' }
  if (mood >= 20) return { emoji: ':/', label: 'Sad' }
  return { emoji: 'x(', label: 'Exhausted' }
}

// Format time as 12-hour clock
const formatTime = (time) => {
  const hours = Math.floor(time)
  const minutes = Math.floor((time % 1) * 60)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

// Get time period label
const getTimePeriod = (time) => {
  if (time >= 5 && time < 7) return 'Dawn'
  if (time >= 7 && time < 12) return 'Morning'
  if (time >= 12 && time < 14) return 'Noon'
  if (time >= 14 && time < 17) return 'Afternoon'
  if (time >= 17 && time < 20) return 'Evening'
  if (time >= 20 && time < 22) return 'Dusk'
  return 'Night'
}

// Resource bar component
function ResourceBar({ label, value, max, color, showNet = false }) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100))
  const isPositive = value >= 0

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '3px',
      }}>
        <span style={{
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {label}
        </span>
        <span style={{
          fontSize: '10px',
          color: showNet ? (isPositive ? '#7dd3a0' : '#e06c75') : 'rgba(255, 255, 255, 0.6)',
          fontFamily: 'monospace',
        }}>
          {showNet && value > 0 ? '+' : ''}{value.toFixed(1)}
        </span>
      </div>
      <div style={{
        height: '3px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: color,
          borderRadius: '2px',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  )
}

// Format game time for logbook
const formatGameTime = (time, day) => {
  const hours = Math.floor(time)
  const minutes = Math.floor((time % 1) * 60)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `Day ${day}, ${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

function HUD() {
  const mood = useGameStore((state) => state.mood)
  const energy = useGameStore((state) => state.energy)
  const timeOfDay = useGameStore((state) => state.timeOfDay)
  const day = useGameStore((state) => state.day)
  const buildingsToday = useGameStore((state) => state.buildingsToday)
  const buildingsPerDay = useGameStore((state) => state.buildingsPerDay)
  const adminMode = useGameStore((state) => state.adminMode)
  const aiSpeed = useGameStore((state) => state.aiSpeed)
  const setAISpeed = useGameStore((state) => state.setAISpeed)
  const isSleeping = useGameStore((state) => state.isSleeping)
  const placedBuildings = useGameStore((state) => state.placedBuildings)
  const aiStatus = useGameStore((state) => state.aiStatus)
  const aiCurrentAction = useGameStore((state) => state.aiCurrentAction)
  const currentBuildTask = useGameStore((state) => state.currentBuildTask)
  const isBuilding = useGameStore((state) => state.isBuilding)
  const resetWorld = useGameStore((state) => state.resetWorld)
  const logbook = useGameStore((state) => state.logbook)

  const moodInfo = getMoodEmoji(mood)

  // Calculate resources from buildings
  const resources = useMemo(() => {
    const totalBuildings = placedBuildings.length
    let powerProd = 0, powerCons = totalBuildings * BASE_POWER_PER_BUILDING
    let waterProd = 0, waterCons = 0
    let foodProd = 0, foodCons = 0

    placedBuildings.forEach(b => {
      const def = BUILDINGS[b.model]
      if (def) {
        if (def.power > 0) powerProd += def.power
        if (def.power < 0) powerCons += Math.abs(def.power)
        if (def.water > 0) waterProd += def.water
        if (def.water < 0) waterCons += Math.abs(def.water)
        if (def.food > 0) foodProd += def.food
        if (def.food < 0) foodCons += Math.abs(def.food)
      }
    })

    return {
      power: { prod: powerProd, cons: powerCons, net: powerProd - powerCons },
      water: { prod: waterProd, cons: waterCons, net: waterProd - waterCons },
      food: { prod: foodProd, cons: foodCons, net: foodProd - foodCons },
    }
  }, [placedBuildings])

  const handleSpeedChange = (e) => {
    const newSpeed = parseFloat(e.target.value)
    setAISpeed(newSpeed)
    gameSocket.send('SET_SPEED', { speed: newSpeed })
  }

  // Panel style
  const panelStyle = {
    background: 'rgba(20, 20, 35, 0.9)',
    backdropFilter: 'blur(8px)',
    borderRadius: '10px',
    padding: '10px 14px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    minWidth: '180px',
  }

  const labelStyle = {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      left: '16px',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Day & Time display */}
      <div style={panelStyle}>
        {/* Day number */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#7dd3fc',
          }}>
            Day {day}
          </span>
          <span style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.4)',
          }}>
            Colony Est.
          </span>
        </div>

        {/* Time */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            fontSize: '22px',
            fontWeight: '300',
            color: '#ffffff',
            letterSpacing: '-0.5px',
          }}>
            {formatTime(timeOfDay)}
          </div>
          <div style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            {getTimePeriod(timeOfDay)}
          </div>
          {isSleeping && (
            <div style={{ fontSize: '12px', color: '#7dd3fc' }}>zzz</div>
          )}
        </div>

        {/* Buildings today */}
        <div style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.5)',
          }}>
            Built today
          </span>
          <span style={{
            fontSize: '12px',
            color: '#7dd3a0',
            fontWeight: '600',
          }}>
            {buildingsToday}
          </span>
        </div>

        {/* Yesterday's stats if available */}
        {buildingsPerDay.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '4px',
          }}>
            <span style={{
              fontSize: '9px',
              color: 'rgba(255, 255, 255, 0.3)',
            }}>
              Yesterday
            </span>
            <span style={{
              fontSize: '9px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}>
              {buildingsPerDay[buildingsPerDay.length - 1]?.count || 0}
            </span>
          </div>
        )}
      </div>

      {/* AI Status Panel */}
      <div style={panelStyle}>
        <div style={{ ...labelStyle, marginBottom: '6px' }}>AI Status</div>
        <div style={{
          fontSize: '13px',
          color: '#7dd3fc',
          fontWeight: '500',
          marginBottom: '4px',
        }}>
          {aiStatus || 'Idle'}
        </div>
        {aiCurrentAction?.reason && (
          <div style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontStyle: 'italic',
          }}>
            {aiCurrentAction.reason}
          </div>
        )}
        {isBuilding && currentBuildTask && (
          <div style={{ marginTop: '6px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '3px',
            }}>
              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>
                Building...
              </span>
              <span style={{ fontSize: '10px', color: '#7dd3a0' }}>
                {Math.round((currentBuildTask.progress || 0) * 100)}%
              </span>
            </div>
            <div style={{
              height: '3px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(currentBuildTask.progress || 0) * 100}%`,
                background: '#7dd3a0',
                borderRadius: '2px',
                transition: 'width 0.1s ease',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Resources Panel */}
      <div style={panelStyle}>
        <div style={{ ...labelStyle, marginBottom: '8px' }}>Colony Resources</div>

        <ResourceBar
          label="Power"
          value={resources.power.net}
          max={50}
          color={resources.power.net >= 0 ? '#f0c674' : '#e06c75'}
          showNet
        />
        <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.3)', marginBottom: '6px', marginTop: '-4px' }}>
          {resources.power.prod.toFixed(0)} produced / {resources.power.cons.toFixed(1)} consumed
        </div>

        <ResourceBar
          label="Water"
          value={resources.water.net}
          max={100}
          color={resources.water.net >= 0 ? '#61afef' : '#e06c75'}
          showNet
        />
        <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.3)', marginBottom: '6px', marginTop: '-4px' }}>
          {resources.water.prod.toFixed(0)} stored / {resources.water.cons.toFixed(0)} needed
        </div>

        <ResourceBar
          label="Food"
          value={resources.food.net}
          max={50}
          color={resources.food.net >= 0 ? '#7dd3a0' : '#e06c75'}
          showNet
        />
        <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.3)', marginTop: '-4px' }}>
          {resources.food.prod.toFixed(0)} grown / {resources.food.cons.toFixed(0)} consumed
        </div>
      </div>

      {/* Claude Stats */}
      <div style={panelStyle}>
        <div style={{ ...labelStyle, marginBottom: '8px' }}>Claude</div>

        {/* Mood */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '3px',
          }}>
            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Mood</span>
            <span style={{ fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}>{moodInfo.emoji}</span>
          </div>
          <div style={{
            height: '3px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${mood}%`,
              background: mood >= 60 ? '#7dd3a0' : mood >= 30 ? '#f0c674' : '#e06c75',
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Energy */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '3px',
          }}>
            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Energy</span>
            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)' }}>{Math.round(energy)}%</span>
          </div>
          <div style={{
            height: '3px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${energy}%`,
              background: energy >= 60 ? '#61afef' : energy >= 30 ? '#f0c674' : '#e06c75',
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Buildings count */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Buildings</span>
          <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)' }}>{placedBuildings.length}</span>
        </div>
      </div>

      {/* AI Speed Control */}
      <div style={panelStyle}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
        }}>
          <span style={labelStyle}>AI Speed</span>
          <span style={{ fontSize: '11px', color: '#7dd3a0', fontWeight: '600' }}>{aiSpeed}x</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.5"
          value={aiSpeed}
          onChange={handleSpeedChange}
          style={{
            width: '100%',
            height: '4px',
            appearance: 'none',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '3px',
        }}>
          <span style={{ fontSize: '8px', color: 'rgba(255, 255, 255, 0.3)' }}>0.5x</span>
          <span style={{ fontSize: '8px', color: 'rgba(255, 255, 255, 0.3)' }}>10x</span>
        </div>
      </div>

      {/* Reset & Build City Button */}
      <button
        onClick={() => {
          // Reset client state first
          resetWorld()
          // Then reset server
          fetch('https://claudesworldback-production.up.railway.app/reset', { method: 'POST' })
            .then(res => res.json())
            .then(data => console.log('World reset:', data))
            .catch(err => console.error('Reset failed:', err))
        }}
        style={{
          ...panelStyle,
          cursor: 'pointer',
          border: '1px solid rgba(125, 211, 160, 0.3)',
          background: 'rgba(125, 211, 160, 0.2)',
          color: '#7dd3a0',
          fontSize: '12px',
          fontWeight: '600',
          textAlign: 'center',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(125, 211, 160, 0.4)'
          e.target.style.borderColor = 'rgba(125, 211, 160, 0.6)'
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(125, 211, 160, 0.2)'
          e.target.style.borderColor = 'rgba(125, 211, 160, 0.3)'
        }}
      >
        Reset & Build City
      </button>

      {/* Admin mode indicator */}
      {adminMode && (
        <div style={{
          background: 'rgba(224, 108, 117, 0.9)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}>
          <span style={{
            fontSize: '10px',
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: '600',
          }}>
            Admin Mode
          </span>
          <span style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.7)' }}>
            Ctrl+Shift+A
          </span>
        </div>
      )}

      {/* Claude's Logbook - positioned on right side */}
      <div style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        left: 'auto',
        ...panelStyle,
        maxHeight: '400px',
        width: '280px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          ...labelStyle,
          marginBottom: '8px',
          paddingBottom: '6px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>Claude's Logbook</span>
          <span style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.3)' }}>
            {logbook.length} entries
          </span>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: '340px',
        }}>
          {logbook.length === 0 ? (
            <div style={{
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.3)',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '20px 0',
            }}>
              No entries yet...
            </div>
          ) : (
            [...logbook].reverse().map((entry) => (
              <div
                key={entry.id}
                style={{
                  marginBottom: '8px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div style={{
                  fontSize: '9px',
                  color: 'rgba(255, 255, 255, 0.3)',
                  marginBottom: '2px',
                }}>
                  {formatGameTime(entry.gameTime, entry.day)}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: entry.action === 'BUILD' ? '#7dd3a0' : '#7dd3fc',
                  fontWeight: '500',
                }}>
                  {entry.action === 'BUILD' ? 'Built' : entry.action}: {entry.model?.replace(/_/g, ' ') || 'Unknown'}
                </div>
                {entry.reason && (
                  <div style={{
                    fontSize: '9px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontStyle: 'italic',
                    marginTop: '2px',
                  }}>
                    "{entry.reason}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default HUD
