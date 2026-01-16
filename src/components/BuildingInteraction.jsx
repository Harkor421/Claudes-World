import React, { useState, useRef, useMemo } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Shared geometries and materials to prevent uniform overflow
const hitBoxGeometry = new THREE.BoxGeometry(4, 6, 4)
const ringGeometry = new THREE.RingGeometry(2, 2.5, 32)
const invisibleMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })

// Cache for glow materials by color
const glowMaterialCache = new Map()
const getGlowMaterial = (color, opacity) => {
  const key = `${color}-${opacity}`
  if (!glowMaterialCache.has(key)) {
    glowMaterialCache.set(key, new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      side: THREE.DoubleSide,
    }))
  }
  return glowMaterialCache.get(key)
}

// Tooltip that appears on click
function BuildingTooltip({ building, isSelected, onClose }) {
  if (!building.metadata || !isSelected) return null

  const { name, purpose, population, capacity, buildingType } = building.metadata

  const typeColors = {
    residential: '#4ade80',
    commercial: '#60a5fa',
    industrial: '#f59e0b',
    power: '#facc15',
    water: '#22d3ee',
    food: '#a3e635',
    eco: '#34d399',
    park: '#86efac',
    road: '#9ca3af',
  }

  const color = typeColors[buildingType] || '#ffffff'

  return (
    <Html
      position={[0, 3, 0]}
      center
      style={{
        pointerEvents: 'auto',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.9)',
          border: `2px solid ${color}`,
          borderRadius: '8px',
          padding: '16px',
          minWidth: '220px',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '12px',
          boxShadow: `0 0 20px ${color}40`,
          position: 'relative',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'transparent',
            border: `1px solid ${color}60`,
            borderRadius: '4px',
            color: color,
            width: '24px',
            height: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = `${color}30`
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent'
          }}
        >
          X
        </button>

        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '8px',
          color: color,
          borderBottom: `1px solid ${color}40`,
          paddingBottom: '6px',
          paddingRight: '30px',
        }}>
          {name}
        </div>

        <div style={{
          display: 'inline-block',
          background: `${color}30`,
          color: color,
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>
          {buildingType}
        </div>

        <div style={{
          color: '#9ca3af',
          fontSize: '11px',
          marginBottom: '8px',
          fontStyle: 'italic',
        }}>
          {purpose}
        </div>

        {capacity && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '6px',
          }}>
            <span style={{ color: '#9ca3af' }}>
              {population > 0 ? '👥' : '⚡'}
            </span>
            <span style={{ color: '#e5e7eb' }}>{capacity}</span>
          </div>
        )}

        <div style={{
          marginTop: '10px',
          paddingTop: '8px',
          borderTop: '1px solid #374151',
          color: '#6b7280',
          fontSize: '10px',
        }}>
          [{building.position.map(p => p.toFixed(0)).join(', ')}]
        </div>
      </div>
    </Html>
  )
}

// Wrapper component that adds interactivity to buildings
export function InteractiveBuilding({ building, children }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isSelected, setIsSelected] = useState(false)
  const groupRef = useRef()
  const glowRef = useRef()

  // Get glow color based on building type
  const glowColor = useMemo(() => {
    const type = building.metadata?.buildingType
    const colors = {
      residential: '#4ade80',
      commercial: '#60a5fa',
      industrial: '#f59e0b',
      power: '#facc15',
      water: '#22d3ee',
      food: '#a3e635',
      eco: '#34d399',
    }
    return colors[type] || '#ffffff'
  }, [building.metadata?.buildingType])

  // Get cached material
  const glowMaterial = useMemo(() => {
    const opacity = isSelected ? 0.6 : 0.3
    return getGlowMaterial(glowColor, opacity)
  }, [glowColor, isSelected])

  // Animate glow effect
  useFrame((state) => {
    if (glowRef.current && (isHovered || isSelected)) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.02
      glowRef.current.scale.setScalar(scale)
    }
  })

  const handleClick = (e) => {
    e.stopPropagation()
    setIsSelected(!isSelected)
  }

  const handleClose = () => {
    setIsSelected(false)
  }

  const handlePointerOver = (e) => {
    e.stopPropagation()
    setIsHovered(true)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    setIsHovered(false)
    document.body.style.cursor = 'auto'
  }

  return (
    <group ref={groupRef}>
      {/* Invisible hit area for interaction - uses shared geometry/material */}
      <mesh
        position={building.position}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        geometry={hitBoxGeometry}
        material={invisibleMaterial}
      />

      {/* Glow effect when hovered/selected */}
      {(isHovered || isSelected) && (
        <group position={building.position}>
          <mesh
            ref={glowRef}
            position={[0, 0.1, 0]}
            geometry={ringGeometry}
            material={glowMaterial}
          />
        </group>
      )}

      {/* The actual building */}
      {children}

      {/* Tooltip - only shows when selected (clicked) */}
      <group position={building.position}>
        <BuildingTooltip
          building={building}
          isSelected={isSelected}
          onClose={handleClose}
        />
      </group>
    </group>
  )
}

export default InteractiveBuilding
