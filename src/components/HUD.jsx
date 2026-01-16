import React from 'react'
import { useGameStore } from '../store/gameStore'

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

function HUD() {
  const mood = useGameStore((state) => state.mood)
  const energy = useGameStore((state) => state.energy)
  const timeOfDay = useGameStore((state) => state.timeOfDay)

  const moodInfo = getMoodEmoji(mood)

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Time display */}
      <div style={{
        background: 'rgba(20, 20, 35, 0.85)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: '300',
          color: '#ffffff',
          letterSpacing: '-0.5px',
        }}>
          {formatTime(timeOfDay)}
        </div>
        <div style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          {getTimePeriod(timeOfDay)}
        </div>
      </div>

      {/* Stats container */}
      <div style={{
        background: 'rgba(20, 20, 35, 0.85)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        minWidth: '160px',
      }}>
        {/* Mood */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px',
          }}>
            <span style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Mood
            </span>
            <span style={{
              fontSize: '12px',
              color: '#ffffff',
              fontFamily: 'monospace',
            }}>
              {moodInfo.emoji}
            </span>
          </div>
          <div style={{
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${mood}%`,
              background: mood >= 60 ? '#7dd3a0' : mood >= 30 ? '#f0c674' : '#e06c75',
              borderRadius: '2px',
              transition: 'width 0.3s ease, background 0.3s ease',
            }} />
          </div>
        </div>

        {/* Energy */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px',
          }}>
            <span style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Energy
            </span>
            <span style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.6)',
            }}>
              {Math.round(energy)}%
            </span>
          </div>
          <div style={{
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${energy}%`,
              background: energy >= 60 ? '#61afef' : energy >= 30 ? '#f0c674' : '#e06c75',
              borderRadius: '2px',
              transition: 'width 0.3s ease, background 0.3s ease',
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HUD
