import React, { useState } from 'react'
import { useGameStore } from '../store/gameStore'

const WEATHER_OPTIONS = [
  { value: 'clear', label: 'Clear', icon: '☀️' },
  { value: 'rain', label: 'Rain', icon: '🌧️' },
  { value: 'snow', label: 'Snow', icon: '❄️' },
]

const TIME_PRESETS = [
  { value: 5, label: 'Dawn', icon: '🌅' },
  { value: 12, label: 'Noon', icon: '☀️' },
  { value: 17, label: 'Dusk', icon: '🌇' },
  { value: 22, label: 'Night', icon: '🌙' },
]

function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const weather = useGameStore((state) => state.weather)
  const setWeather = useGameStore((state) => state.setWeather)
  const timeOfDay = useGameStore((state) => state.timeOfDay)
  const setTimeOfDay = useGameStore((state) => state.setTimeOfDay)
  const autoTimeEnabled = useGameStore((state) => state.autoTimeEnabled)
  const toggleAutoTime = useGameStore((state) => state.toggleAutoTime)

  const formatTime = (time) => {
    const hours = Math.floor(time)
    const minutes = Math.floor((time % 1) * 60)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1001,
          background: isOpen ? 'rgba(125, 211, 160, 0.9)' : 'rgba(30, 30, 50, 0.9)',
          border: '2px solid #4a5568',
          borderRadius: '8px',
          padding: '10px 16px',
          color: '#e2e8f0',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: '18px' }}>⚙️</span>
        Settings
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            right: '20px',
            zIndex: 1000,
            background: 'rgba(30, 30, 50, 0.95)',
            border: '2px solid #4a5568',
            borderRadius: '12px',
            padding: '16px',
            minWidth: '280px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Weather Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              color: '#7dd3a0',
              fontSize: '13px',
              fontWeight: 'bold',
              marginBottom: '10px',
              textTransform: 'uppercase',
            }}>
              Weather
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {WEATHER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setWeather(option.value)}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    background: weather === option.value
                      ? 'rgba(125, 211, 160, 0.4)'
                      : 'rgba(74, 85, 104, 0.5)',
                    border: weather === option.value
                      ? '2px solid #7dd3a0'
                      : '2px solid transparent',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              color: '#7dd3a0',
              fontSize: '13px',
              fontWeight: 'bold',
              marginBottom: '10px',
              textTransform: 'uppercase',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>Time of Day</span>
              <span style={{
                color: '#a0aec0',
                fontSize: '12px',
                fontWeight: 'normal',
              }}>
                {formatTime(timeOfDay)}
              </span>
            </div>

            {/* Time Slider */}
            <input
              type="range"
              min="0"
              max="24"
              step="0.5"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right,
                  #112244 0%,
                  #ff9966 25%,
                  #87ceeb 50%,
                  #ff7744 75%,
                  #112244 100%
                )`,
                outline: 'none',
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            />

            {/* Time Presets */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setTimeOfDay(preset.value)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    background: Math.abs(timeOfDay - preset.value) < 2
                      ? 'rgba(125, 211, 160, 0.4)'
                      : 'rgba(74, 85, 104, 0.5)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{preset.icon}</span>
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Auto Time Toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: 'rgba(74, 85, 104, 0.3)',
            borderRadius: '8px',
          }}>
            <span style={{ color: '#e2e8f0', fontSize: '13px' }}>
              Auto Time Cycle
            </span>
            <button
              onClick={toggleAutoTime}
              style={{
                width: '48px',
                height: '24px',
                borderRadius: '12px',
                border: 'none',
                background: autoTimeEnabled ? '#7dd3a0' : '#4a5568',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#ffffff',
                position: 'absolute',
                top: '2px',
                left: autoTimeEnabled ? '26px' : '2px',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {/* Instructions */}
          <div style={{
            marginTop: '16px',
            padding: '10px',
            background: 'rgba(74, 85, 104, 0.2)',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#a0aec0',
            lineHeight: '1.5',
          }}>
            Right-click on ground to build. WASD or click to move.
          </div>
        </div>
      )}
    </>
  )
}

export default SettingsMenu
