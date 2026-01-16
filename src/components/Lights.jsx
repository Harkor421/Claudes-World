import React from 'react'

function Lights() {
  return (
    <>
      {/* Ambient light for overall illumination */}
      <ambientLight intensity={0.4} color="#8090b0" />

      {/* Main directional light (sun) */}
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.2}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
      />

      {/* Fill light from opposite side */}
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.3}
        color="#b0c0ff"
      />

      {/* Hemisphere light for sky/ground color variation */}
      <hemisphereLight
        skyColor="#87ceeb"
        groundColor="#362f2f"
        intensity={0.5}
      />
    </>
  )
}

export default Lights
