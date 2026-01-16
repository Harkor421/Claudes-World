import React from 'react'
import { Html } from '@react-three/drei'
import { useGameStore } from '../store/gameStore'
import CityObject from './CityObject'

// Shows the building being constructed with progress
function BuildProgress() {
  const currentBuildTask = useGameStore((state) => state.currentBuildTask)
  const isBuilding = useGameStore((state) => state.isBuilding)

  if (!currentBuildTask) return null

  const progress = currentBuildTask.progress || 0
  const position = currentBuildTask.position

  return (
    <group position={position}>
      {/* Ghost preview of building being constructed */}
      <group scale={[2 * progress, 2 * progress, 2 * progress]}>
        <CityObject
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
