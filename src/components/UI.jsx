import React from 'react'

function UI() {
  return (
    <>
      {/* Game title and info */}
      <div className="game-ui">
        <h1>Claude's World</h1>
        <p>An AI-driven city builder</p>
      </div>

      {/* Controls hint */}
      <div className="controls-hint">
        WASD or Arrow Keys to move • Click to move • Scroll to zoom • Drag to rotate view
      </div>
    </>
  )
}

export default UI
