import React, { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { gameSocket } from '../services/socket'

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

// Get city size label
const getCitySizeLabel = (size) => {
  const labels = {
    tiny: 'Outpost',
    small: 'Settlement',
    medium: 'Town',
    large: 'City',
    massive: 'Metropolis',
  }
  return labels[size] || 'Colony'
}

function HUD({ onHome }) {
  const [logbookOpen, setLogbookOpen] = useState(true)
  const [homeHovered, setHomeHovered] = useState(false)

  const timeOfDay = useGameStore((state) => state.timeOfDay)
  const day = useGameStore((state) => state.day)
  const placedBuildings = useGameStore((state) => state.placedBuildings)
  const aiSpeed = useGameStore((state) => state.aiSpeed)
  const setAISpeed = useGameStore((state) => state.setAISpeed)
  const resetWorld = useGameStore((state) => state.resetWorld)
  const logbook = useGameStore((state) => state.logbook)

  // Get latest entry for current state
  const latestEntry = logbook[logbook.length - 1]
  const citySize = latestEntry?.citySize || 'tiny'
  const population = latestEntry?.population || 0
  const neighborhoods = latestEntry?.neighborhoods || 0
  const mood = latestEntry?.mood || 'optimistic'

  // Mood emoji mapping
  const moodEmojis = {
    optimistic: { emoji: ':)', color: '#7dd3a0' },
    focused: { emoji: ':|', color: '#61afef' },
    tired: { emoji: ':/', color: '#f0c674' },
    proud: { emoji: ':D', color: '#c9a0dc' },
    philosophical: { emoji: ':o', color: '#7dd3fc' },
  }
  const moodInfo = moodEmojis[mood] || moodEmojis.optimistic

  const handleSpeedChange = (e) => {
    const newSpeed = parseFloat(e.target.value)
    setAISpeed(newSpeed)
    gameSocket.send('SET_SPEED', { speed: newSpeed })
  }

  const handleReset = () => {
    resetWorld()
    fetch('https://claudesworldback-production.up.railway.app/reset', { method: 'POST' })
      .then(res => res.json())
      .then(data => console.log('World reset:', data))
      .catch(err => console.error('Reset failed:', err))
  }

  // Shared styles
  const panelStyle = {
    background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(25, 25, 40, 0.9) 100%)',
    backdropFilter: 'blur(12px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  }

  return (
    <>
      {/* Home Button - Top Left */}
      <button
        className="hud-home-btn"
        onClick={onHome}
        onMouseEnter={() => setHomeHovered(true)}
        onMouseLeave={() => setHomeHovered(false)}
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 100,
          ...panelStyle,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          border: homeHovered ? '1px solid rgba(232, 167, 84, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
          transition: 'all 0.2s ease',
          transform: homeHovered ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={homeHovered ? '#e8a754' : 'rgba(255,255,255,0.6)'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'stroke 0.2s ease' }}
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span style={{
          fontSize: '12px',
          fontWeight: '500',
          color: homeHovered ? '#e8a754' : 'rgba(255,255,255,0.6)',
          letterSpacing: '0.5px',
          transition: 'color 0.2s ease',
        }}>
          Home
        </span>
      </button>

      {/* Top Bar - Time & Stats */}
      <div className="hud-top-bar" style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        ...panelStyle,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {/* Day */}
        <div className="hud-stat" style={{ textAlign: 'center' }}>
          <div className="hud-stat-label" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', marginBottom: '2px' }}>DAY</div>
          <div className="hud-stat-value" style={{ fontSize: '20px', fontWeight: '600', color: '#7dd3fc' }}>{day}</div>
        </div>

        {/* Divider */}
        <div className="hud-divider" style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.1)' }} />

        {/* Time */}
        <div className="hud-stat" style={{ textAlign: 'center' }}>
          <div className="hud-stat-label" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', marginBottom: '2px' }}>{getTimePeriod(timeOfDay).toUpperCase()}</div>
          <div className="hud-stat-value" style={{ fontSize: '20px', fontWeight: '300', color: '#fff', letterSpacing: '-0.5px' }}>{formatTime(timeOfDay)}</div>
        </div>

        {/* Divider */}
        <div className="hud-divider" style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.1)' }} />

        {/* City Status */}
        <div className="hud-stat" style={{ textAlign: 'center' }}>
          <div className="hud-stat-label" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', marginBottom: '2px' }}>{getCitySizeLabel(citySize).toUpperCase()}</div>
          <div className="hud-stat-value" style={{ fontSize: '16px', fontWeight: '500', color: '#7dd3a0' }}>
            {placedBuildings.length}
          </div>
        </div>

        {/* Divider */}
        <div className="hud-divider" style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.1)' }} />

        {/* Population */}
        <div className="hud-stat" style={{ textAlign: 'center' }}>
          <div className="hud-stat-label" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', marginBottom: '2px' }}>POP</div>
          <div className="hud-stat-value" style={{ fontSize: '16px', fontWeight: '500', color: '#f0c674' }}>
            {population.toLocaleString()}
          </div>
        </div>

        {/* Divider */}
        <div className="hud-divider" style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.1)' }} />

        {/* Claude's Mood */}
        <div className="hud-stat" style={{ textAlign: 'center' }}>
          <div className="hud-stat-label" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', marginBottom: '2px' }}>CLAUDE</div>
          <div className="hud-stat-value" style={{ fontSize: '18px', fontFamily: 'monospace', color: moodInfo.color }}>
            {moodInfo.emoji}
          </div>
        </div>
      </div>

      {/* Bottom Left - Speed Control */}
      <div className="hud-speed-control" style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        zIndex: 100,
        ...panelStyle,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>SPEED</span>
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.5"
          value={aiSpeed}
          onChange={handleSpeedChange}
          style={{
            width: '80px',
            height: '4px',
            appearance: 'none',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '2px',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <span style={{ fontSize: '14px', color: '#7dd3a0', fontWeight: '600', minWidth: '32px' }}>{aiSpeed}x</span>

        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', marginLeft: '4px' }} />

        <button
          onClick={handleReset}
          style={{
            background: 'rgba(224, 108, 117, 0.2)',
            border: '1px solid rgba(224, 108, 117, 0.3)',
            borderRadius: '6px',
            padding: '6px 12px',
            color: '#e06c75',
            fontSize: '11px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(224, 108, 117, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(224, 108, 117, 0.2)'
          }}
        >
          Reset
        </button>
      </div>

      {/* Bottom Center - Controls Hint */}
      <div className="hud-controls-hint" style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        ...panelStyle,
        padding: '8px 16px',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.4)',
        letterSpacing: '0.5px',
      }}>
        WASD to move • Click to walk • Scroll to zoom
      </div>

      {/* Right Side - Claude's Logbook */}
      <div className="hud-logbook" style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 100,
        ...panelStyle,
        width: '320px',
        maxHeight: logbookOpen ? '70vh' : '48px',
        transition: 'max-height 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {/* Header */}
        <div
          onClick={() => setLogbookOpen(!logbookOpen)}
          style={{
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            borderBottom: logbookOpen ? '1px solid rgba(255,255,255,0.08)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#7dd3a0',
              boxShadow: '0 0 8px rgba(125, 211, 160, 0.5)',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff', letterSpacing: '0.5px' }}>
              CLAUDE'S THOUGHTS
            </span>
          </div>
          <span style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.3)',
            transform: logbookOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}>
            ▼
          </span>
        </div>

        {/* Logbook Content */}
        {logbookOpen && (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 0',
          }}>
            {logbook.length === 0 ? (
              <div style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.3)',
                fontSize: '12px',
                fontStyle: 'italic',
              }}>
                Waiting for Claude to share thoughts...
              </div>
            ) : (
              [...logbook].reverse().slice(0, 20).map((entry, index) => {
                // Mood-based accent colors
                const moodColors = {
                  optimistic: '#7dd3a0',
                  focused: '#61afef',
                  tired: '#f0c674',
                  proud: '#c9a0dc',
                  philosophical: '#7dd3fc',
                }
                const accentColor = moodColors[entry.mood] || moodColors.optimistic

                return (
                  <div
                    key={entry.id}
                    style={{
                      padding: '14px 16px',
                      borderLeft: `3px solid ${accentColor}`,
                      marginLeft: '8px',
                      marginBottom: '12px',
                      background: index === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                    }}
                  >
                    {/* Main thought - the star of the show */}
                    {entry.thought && (
                      <div style={{
                        fontSize: '13px',
                        color: index === 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
                        lineHeight: '1.5',
                        fontWeight: index === 0 ? '400' : '300',
                      }}>
                        {entry.thought}
                      </div>
                    )}

                    {/* Subtle metadata footer */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '8px',
                      opacity: 0.5,
                    }}>
                      <span style={{
                        fontSize: '10px',
                        color: accentColor,
                        textTransform: 'lowercase',
                      }}>
                        {entry.mood || 'thinking'}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.4)',
                      }}>
                        day {entry.day} · {entry.totalBuildings} buildings
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* CSS Animation for pulse */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #7dd3a0;
          border-radius: 50%;
          cursor: pointer;
        }

        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #7dd3a0;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }

        ::-webkit-scrollbar {
          width: 4px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .hud-top-bar {
            left: 16px !important;
            right: 16px !important;
            transform: none !important;
            padding: 10px 12px !important;
            gap: 12px !important;
            overflow-x: auto !important;
            justify-content: flex-start !important;
          }
          .hud-top-bar .hud-divider {
            display: none !important;
          }
          .hud-top-bar .hud-stat {
            min-width: auto !important;
          }
          .hud-top-bar .hud-stat-label {
            font-size: 8px !important;
          }
          .hud-top-bar .hud-stat-value {
            font-size: 14px !important;
          }
          .hud-home-btn {
            padding: 8px !important;
          }
          .hud-home-btn span {
            display: none !important;
          }
          .hud-logbook {
            width: calc(100vw - 32px) !important;
            max-width: 320px !important;
            right: 16px !important;
            top: auto !important;
            bottom: 70px !important;
            max-height: 50vh !important;
          }
          .hud-speed-control {
            bottom: 10px !important;
            left: 10px !important;
            padding: 8px 12px !important;
          }
          .hud-controls-hint {
            display: none !important;
          }
        }

        @media (max-width: 480px) {
          .hud-top-bar {
            top: 10px !important;
            gap: 8px !important;
            padding: 8px 10px !important;
          }
          .hud-logbook {
            bottom: 60px !important;
            max-height: 40vh !important;
          }
        }
      `}</style>
    </>
  )
}

export default HUD
