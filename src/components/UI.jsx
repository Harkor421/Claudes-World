import React from 'react'

function UI() {
  return (
    <>
      {/* Controls hint - bottom center */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        background: 'rgba(20, 20, 35, 0.7)',
        backdropFilter: 'blur(8px)',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.5)',
        letterSpacing: '0.5px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        WASD to move • Click to walk • Right-click to build • Scroll to zoom
      </div>
    </>
  )
}

export default UI
