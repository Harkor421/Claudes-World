import React from 'react'
import { Html } from '@react-three/drei'

function CompanySign({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      {/* Base/platform */}
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[3, 0.2, 0.8]} />
        <meshStandardMaterial color="#6b5b4f" roughness={0.9} />
      </mesh>

      {/* Support posts */}
      <mesh castShadow position={[-1.2, 0.6, 0]}>
        <boxGeometry args={[0.1, 1, 0.1]} />
        <meshStandardMaterial color="#5a4a3f" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[1.2, 0.6, 0]}>
        <boxGeometry args={[0.1, 1, 0.1]} />
        <meshStandardMaterial color="#5a4a3f" roughness={0.9} />
      </mesh>

      {/* Sign board background */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <boxGeometry args={[2.8, 0.7, 0.1]} />
        <meshStandardMaterial color="#e8e0d5" roughness={0.6} />
      </mesh>

      {/* Red "MY" section */}
      <mesh castShadow position={[-1, 1.2, 0.06]}>
        <boxGeometry args={[0.6, 0.5, 0.02]} />
        <meshStandardMaterial color="#c44" roughness={0.5} />
      </mesh>

      {/* Sign text using Html */}
      <Html
        position={[-1, 1.2, 0.1]}
        center
        transform
        style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: 'white',
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
        }}
      >
        MY
      </Html>

      <Html
        position={[0.4, 1.2, 0.1]}
        center
        transform
        style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#4a4a4a',
          whiteSpace: 'nowrap'
        }}
      >
        Company Inc.
      </Html>

      {/* Small decorative elements on the base */}
      <mesh castShadow position={[-1, 0.25, 0.3]}>
        <boxGeometry args={[0.2, 0.1, 0.2]} />
        <meshStandardMaterial color="#7a6a5f" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.8, 0.25, 0.35]}>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 8]} />
        <meshStandardMaterial color="#5a7a5a" roughness={0.8} />
      </mesh>
    </group>
  )
}

export default CompanySign
