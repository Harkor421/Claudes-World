import React, { Suspense, useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'

// Floating dropship - no ground, transparent background
function FloatingShip() {
  const groupRef = useRef()
  const { scene: shipScene } = useGLTF('/models/space/dropship.gltf')

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating and rotation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3
    }
  })

  return (
    <group ref={groupRef}>
      <primitive
        object={shipScene.clone()}
        scale={2.5}
        position={[0, 0, 0]}
        rotation={[0.1, 0, -0.05]}
      />
      {/* Subtle glow underneath */}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 32]} />
        <meshBasicMaterial color="#C15F3C" transparent opacity={0.1} />
      </mesh>

      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight position={[5, 10, 5]} intensity={1} color="#ffddaa" />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#88aaff" />
    </group>
  )
}

// Dust particle for trail effect
function DustParticle({ startPosition, delay }) {
  const meshRef = useRef()
  const [opacity, setOpacity] = useState(0)
  const startTime = useRef(null)

  useFrame((state) => {
    if (!meshRef.current) return

    if (!startTime.current) {
      startTime.current = state.clock.elapsedTime + delay
    }

    const elapsed = state.clock.elapsedTime - startTime.current
    if (elapsed < 0) return

    // Particle lifetime ~1 second
    const life = elapsed / 1.2
    if (life > 1) {
      meshRef.current.visible = false
      return
    }

    meshRef.current.visible = true
    // Rise and spread
    meshRef.current.position.y = startPosition[1] + elapsed * 0.3
    meshRef.current.position.x = startPosition[0] + (Math.random() - 0.5) * 0.1
    meshRef.current.position.z = startPosition[2] + (Math.random() - 0.5) * 0.1

    // Scale up slightly
    const scale = 0.08 + life * 0.15
    meshRef.current.scale.setScalar(scale)

    // Fade out
    setOpacity((1 - life) * 0.4)
  })

  return (
    <mesh ref={meshRef} position={startPosition} visible={false}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#8b7355" transparent opacity={opacity} />
    </mesh>
  )
}

// Character running on a grid plane with proper animations
function RunningCharacter() {
  const groupRef = useRef()
  const modelRef = useRef()
  const [dustParticles, setDustParticles] = useState([])
  const lastDustTime = useRef(0)
  const dustIdRef = useRef(0)

  // Load character model
  const characterGltf = useGLTF('/models/character.glb')

  // Load animation files (same as main game)
  const movementGltf = useGLTF('/models/Rig_Medium_MovementBasic.glb')
  const generalGltf = useGLTF('/models/Rig_Medium_General.glb')

  // Combine all animations
  const allAnimations = useMemo(() => {
    return [...movementGltf.animations, ...generalGltf.animations]
  }, [movementGltf.animations, generalGltf.animations])

  // Clone the character scene
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(characterGltf.scene)
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [characterGltf.scene])

  // Set up animations
  const { actions, mixer } = useAnimations(allAnimations, modelRef)

  // Start walking animation
  useEffect(() => {
    if (actions) {
      // Use Walking_A animation
      const walkAction = actions['Walking_A']
      if (walkAction) {
        walkAction.reset().fadeIn(0.2).play()
        walkAction.setLoop(THREE.LoopRepeat)
        // Speed up the animation slightly for running feel
        walkAction.timeScale = 1.3
      }
    }
  }, [actions])

  useFrame((state, delta) => {
    // Update animation mixer
    if (mixer) mixer.update(delta)

    if (groupRef.current) {
      // Stay in the center
      groupRef.current.position.x = 0
      groupRef.current.position.z = 0
      groupRef.current.position.y = 0

      // Face forward (no rotation) - camera orbits around him
      groupRef.current.rotation.y = 0

      // Spawn dust particles periodically behind character's feet
      const now = state.clock.elapsedTime
      if (now - lastDustTime.current > 0.12) {
        lastDustTime.current = now
        dustIdRef.current++

        // Add dust particle behind character (negative z) with slight random offset
        const offsetX = (Math.random() - 0.5) * 0.2
        const offsetZ = -0.2 + (Math.random() - 0.5) * 0.15
        setDustParticles(prev => {
          const newParticles = [...prev, {
            id: dustIdRef.current,
            position: [offsetX, 0.02, offsetZ],
            delay: 0
          }]
          // Keep only last 20 particles
          return newParticles.slice(-20)
        })
      }
    }
  })

  // Grid size - smaller and more subtle
  const gridSize = 6

  return (
    <>
      {/* Grid plane like in the game - gray tones */}
      <group position={[0, -0.01, 0]}>
        <gridHelper args={[gridSize, 8, '#444444', '#333333']} />
        {/* Solid ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[gridSize, gridSize]} />
          <meshStandardMaterial color="#1a1a1a" transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Dust trail particles */}
      {dustParticles.map(particle => (
        <DustParticle
          key={particle.id}
          startPosition={particle.position}
          delay={particle.delay}
        />
      ))}

      {/* Running character */}
      <group ref={groupRef}>
        <group ref={modelRef} scale={2}>
          <primitive object={clonedScene} />
        </group>
      </group>

      {/* Lighting */}
      <ambientLight intensity={0.5} color="#8899aa" />
      <directionalLight position={[5, 10, 5]} intensity={1} color="#ffffff" />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#7dd3a0" />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#7dd3a0" distance={10} />
    </>
  )
}

// Preload models for landing page
useGLTF.preload('/models/character.glb')
useGLTF.preload('/models/Rig_Medium_MovementBasic.glb')
useGLTF.preload('/models/Rig_Medium_General.glb')

// Animated button with voxel particle effects
function VoxelButton({ onClick, children, primary = false, style = {} }) {
  const [isHovered, setIsHovered] = useState(false)
  const [particles, setParticles] = useState([])
  const particleIdRef = useRef(0)

  // Spawn particles on hover
  useEffect(() => {
    if (!isHovered) {
      setParticles([])
      return
    }

    const interval = setInterval(() => {
      particleIdRef.current++
      const newParticle = {
        id: particleIdRef.current,
        x: Math.random() * 100,
        delay: Math.random() * 0.3,
      }
      setParticles(prev => [...prev.slice(-8), newParticle])
    }, 150)

    return () => clearInterval(interval)
  }, [isHovered])

  const baseStyle = primary ? {
    background: '#C15F3C',
    border: 'none',
    color: '#0d1117',
  } : {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.7)',
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...baseStyle,
        padding: '12px 24px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: primary ? '600' : '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered
          ? (primary ? '0 8px 20px rgba(193, 95, 60, 0.3)' : '0 8px 20px rgba(255,255,255,0.1)')
          : 'none',
        ...style,
      }}
    >
      {/* Voxel particles */}
      {particles.map(particle => (
        <span
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            bottom: '0',
            width: '4px',
            height: '4px',
            background: primary ? '#0d1117' : '#C15F3C',
            opacity: 0,
            animation: `voxelFloat 0.8s ease-out ${particle.delay}s forwards`,
            pointerEvents: 'none',
          }}
        />
      ))}
      {/* Shimmer effect on hover */}
      {isHovered && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: primary
              ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(193, 95, 60, 0.1), transparent)',
            animation: 'shimmer 0.6s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </button>
  )
}

// Small nav button variant
function NavButton({ onClick, children }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'transparent',
        border: '1px solid rgba(193, 95, 60, 0.3)',
        color: '#C15F3C',
        padding: '8px 16px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        borderColor: isHovered ? 'rgba(193, 95, 60, 0.6)' : 'rgba(193, 95, 60, 0.3)',
        boxShadow: isHovered ? '0 0 15px rgba(193, 95, 60, 0.2)' : 'none',
      }}
    >
      {/* Corner voxels on hover */}
      {isHovered && (
        <>
          <span style={{ position: 'absolute', top: '2px', left: '2px', width: '3px', height: '3px', background: '#C15F3C', animation: 'voxelPulse 0.4s ease-in-out infinite' }} />
          <span style={{ position: 'absolute', top: '2px', right: '2px', width: '3px', height: '3px', background: '#C15F3C', animation: 'voxelPulse 0.4s ease-in-out 0.1s infinite' }} />
          <span style={{ position: 'absolute', bottom: '2px', left: '2px', width: '3px', height: '3px', background: '#C15F3C', animation: 'voxelPulse 0.4s ease-in-out 0.2s infinite' }} />
          <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '3px', height: '3px', background: '#C15F3C', animation: 'voxelPulse 0.4s ease-in-out 0.3s infinite' }} />
        </>
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </button>
  )
}

// Token CA Section with copy functionality
function TokenSection() {
  const [copied, setCopied] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Placeholder CA - replace with actual contract address
  const contractAddress = "TBA"

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Truncate address for display
  const displayAddress = contractAddress.length > 20
    ? `${contractAddress.slice(0, 8)}...${contractAddress.slice(-8)}`
    : contractAddress

  return (
    <section className="landing-section" style={{
      padding: '40px 60px',
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      justifyContent: 'center',
    }}>
      <div className="token-section-card" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 24px',
        background: 'rgba(193, 95, 60, 0.03)',
        border: '1px solid rgba(193, 95, 60, 0.1)',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '100%',
      }}>
        {/* CA Label */}
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#C15F3C',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
        }}>
          CA
        </div>

        {/* Divider */}
        <div className="token-divider" style={{
          width: '1px',
          height: '20px',
          background: 'rgba(193, 95, 60, 0.2)',
        }} />

        {/* Address */}
        <div style={{
          fontFamily: "'SF Mono', 'Fira Code', 'Monaco', monospace",
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.7)',
          letterSpacing: '0.5px',
          flex: 1,
        }}>
          {displayAddress}
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: copied
              ? 'rgba(125, 211, 160, 0.15)'
              : isHovered
                ? 'rgba(193, 95, 60, 0.15)'
                : 'rgba(193, 95, 60, 0.08)',
            border: `1px solid ${copied ? 'rgba(125, 211, 160, 0.3)' : 'rgba(193, 95, 60, 0.2)'}`,
            borderRadius: '6px',
            color: copied ? '#7dd3a0' : '#C15F3C',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: isHovered && !copied ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          {copied ? (
            <>
              <span style={{ fontSize: '14px' }}>&#10003;</span>
              Copied
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
    </section>
  )
}

// Cleaner inline CA for hero section
function HeroTokenSection() {
  const [copied, setCopied] = useState(false)

  const contractAddress = "xMsYjG92MRPGcPFAZ5bLZgZ6kvaLvgJdZkQHhExypump"

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const displayAddress = contractAddress.length > 20
    ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`
    : contractAddress

  return (
    <div className="hero-ca-section" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '60px',
      padding: '10px 16px',
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '8px',
    }}>
      <span style={{
        fontSize: '10px',
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.4)',
        letterSpacing: '1px',
      }}>
        CA
      </span>
      <span style={{
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.6)',
        letterSpacing: '0.3px',
      }}>
        {displayAddress}
      </span>
      <button
        onClick={handleCopy}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          background: copied ? 'rgba(125, 211, 160, 0.1)' : 'transparent',
          border: `1px solid ${copied ? 'rgba(125, 211, 160, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
          borderRadius: '4px',
          color: copied ? '#7dd3a0' : 'rgba(255, 255, 255, 0.5)',
          fontSize: '11px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {copied ? (
          <span>Copied</span>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  )
}

function LandingPage({ onEnter, onDocs }) {
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleEnter = () => {
    setIsTransitioning(true)
    // Wait for animation to complete before actually entering
    setTimeout(() => {
      onEnter()
    }, 800)
  }

  return (
    <div style={{
      background: '#0d1117',
      color: '#fff',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflowX: 'hidden',
      overflowY: 'auto',
      // Zoom in animation
      transform: isTransitioning ? 'scale(3)' : 'scale(1)',
      opacity: isTransitioning ? 0 : 1,
      transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease-out',
      transformOrigin: 'center center',
    }}>
      {/* Grid background - fixed */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Radial gradient overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(193, 95, 60, 0.08) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Floating ambient particles */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${3 + (i % 3) * 2}px`,
              height: `${3 + (i % 3) * 2}px`,
              borderRadius: '50%',
              background: i % 2 === 0 ? '#C15F3C' : '#7dd3a0',
              left: `${8 + i * 8}%`,
              top: `${15 + (i * 17) % 70}%`,
              opacity: 0.2,
              animation: `floatParticle ${4 + (i % 3)}s ease-in-out ${i * 0.5}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="landing-nav" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 60px',
        zIndex: 100,
        background: 'linear-gradient(180deg, rgba(13,17,23,0.95) 0%, rgba(13,17,23,0) 100%)',
      }}>
        <img
          src="/logo.png"
          alt="Claude's World"
          className="landing-nav-logo"
          style={{
            height: '54px',
            width: 'auto',
          }}
        />
        <div className="landing-nav-links" style={{ display: 'flex', gap: '40px' }}>
          <a href="#origin" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px' }}>Origin</a>
          <a href="#problem" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px' }}>Problem</a>
          <a href="#solution" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px' }}>Solution</a>
          <a href="#vision" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px' }}>Vision</a>
        </div>
        <NavButton onClick={handleEnter}>
          Enter
        </NavButton>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '120px 20px 60px',
        position: 'relative',
        zIndex: 1,
      }}>
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 64px)',
          fontWeight: '600',
          lineHeight: '1.1',
          marginBottom: '24px',
          padding: '0 10px',
        }}>
          What if you could watch an AI<br />
          <span style={{
            color: '#C15F3C',
            textShadow: '0 0 30px rgba(193, 95, 60, 0.4)',
            animation: 'glowPulse 3s ease-in-out infinite',
          }}>build a world</span>?
        </h1>
        <p style={{
          fontSize: 'clamp(16px, 3vw, 20px)',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '40px',
          padding: '0 20px',
        }}>
          One city. One mind. Every decision visible.
        </p>
        <div className="landing-hero-buttons" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <VoxelButton onClick={handleEnter} primary>
            Enter Simulation
          </VoxelButton>
          <VoxelButton onClick={onDocs}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                <line x1="8" y1="6" x2="16" y2="6"></line>
                <line x1="8" y1="10" x2="14" y2="10"></line>
              </svg>
              View Docs
            </span>
          </VoxelButton>
        </div>

        {/* Inline CA Section */}
        <HeroTokenSection />

        <div style={{
          position: 'absolute',
          bottom: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '12px',
          cursor: 'pointer',
        }}
        onClick={() => document.getElementById('origin').scrollIntoView({ behavior: 'smooth' })}
        >
          <span>Scroll to explore</span>
          <span style={{ fontSize: '20px', animation: 'bounce 2s infinite' }}>↓</span>
        </div>
      </section>

      {/* Origin Story Section with floating 3D Ship */}
      <section id="origin" className="landing-section landing-section-flex" style={{
        minHeight: 'auto',
        padding: '60px 60px',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '40px',
      }}>
        {/* 3D Ship - transparent, hovering */}
        <div className="landing-canvas-container" style={{
          flex: 1.2,
          height: '600px',
          position: 'relative',
        }}>
          <Canvas
            camera={{ position: [6, 3, 6], fov: 50 }}
            style={{ background: 'transparent' }}
            gl={{ alpha: true }}
          >
            <Suspense fallback={null}>
              <FloatingShip />
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate={false}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI / 2}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Story text */}
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: '12px',
            color: '#C15F3C',
            letterSpacing: '2px',
            marginBottom: '16px',
          }}>THE ORIGIN</p>

          <h2 style={{
            fontSize: 'clamp(28px, 3vw, 40px)',
            fontWeight: '600',
            marginBottom: '24px',
            lineHeight: '1.2',
          }}>
            Claude crashed on an<br />
            <span style={{
              color: '#7dd3a0',
              textShadow: '0 0 20px rgba(125, 211, 160, 0.3)',
              animation: 'glowPulseGreen 3s ease-in-out infinite',
            }}>empty planet</span>.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
              No instructions. No map. Just an AI with a mission: <em style={{ color: '#fff' }}>survive and build</em>.
            </p>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.8' }}>
              Watch as Claude surveys the barren landscape, makes decisions about what to build first, and slowly transforms nothing into a thriving colony.
            </p>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.8' }}>
              Every structure has a reason. Every choice reveals how an AI thinks.
            </p>

            <div className="landing-stats-row" style={{
              display: 'flex',
              gap: '20px',
              marginTop: '16px',
            }}>
              <div style={{
                padding: '14px 18px',
                background: 'rgba(125, 211, 160, 0.08)',
                borderRadius: '8px',
                borderLeft: '2px solid #7dd3a0',
                boxShadow: '0 0 20px rgba(125, 211, 160, 0.1)',
                animation: 'cardGlowGreen 3s ease-in-out infinite',
                flex: 1,
              }}>
                <div style={{ fontSize: '22px', fontWeight: '600', color: '#7dd3a0' }}>Day 1</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>The crash</div>
              </div>
              <div style={{
                padding: '14px 18px',
                background: 'rgba(193, 95, 60, 0.08)',
                borderRadius: '8px',
                borderLeft: '2px solid #C15F3C',
                boxShadow: '0 0 20px rgba(193, 95, 60, 0.1)',
                animation: 'cardGlow 3s ease-in-out 0.5s infinite',
                flex: 1,
              }}>
                <div style={{ fontSize: '22px', fontWeight: '600', color: '#C15F3C' }}>Day ???</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>Your arrival</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Claude Section with Character */}
      <section className="landing-section landing-section-flex" style={{
        padding: '40px 60px',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '40px',
      }}>
        {/* Text first */}
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: '12px',
            color: '#7dd3a0',
            letterSpacing: '2px',
            marginBottom: '16px',
          }}>MEET THE BUILDER</p>

          <h2 style={{
            fontSize: 'clamp(28px, 3vw, 40px)',
            fontWeight: '600',
            marginBottom: '24px',
            lineHeight: '1.2',
          }}>
            This is <span style={{
              color: '#C15F3C',
              textShadow: '0 0 20px rgba(193, 95, 60, 0.3)',
              animation: 'glowPulse 3s ease-in-out infinite',
            }}>Claude</span>.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
              An AI with a personality. Watch it think, plan, and build in real-time.
            </p>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.8' }}>
              Claude names neighborhoods after constellations. It gets philosophical about construction. It has good days and tired days.
            </p>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.8' }}>
              This isn't a faceless system. It's a character you can follow, understand, and observe.
            </p>

            <div style={{
              marginTop: '16px',
              padding: '18px',
              background: 'rgba(125, 211, 160, 0.05)',
              borderRadius: '10px',
              border: '1px solid rgba(125, 211, 160, 0.12)',
              boxShadow: '0 0 30px rgba(125, 211, 160, 0.05)',
              animation: 'cardGlowGreen 4s ease-in-out infinite',
            }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: '1.7' }}>
                "Someone's going to call this home. That's beautiful."
              </p>
              <p style={{ fontSize: '11px', color: '#7dd3a0', marginTop: '8px', letterSpacing: '0.3px' }}>— Claude, building residential quarters</p>
            </div>
          </div>
        </div>

        {/* 3D Character running on grid */}
        <div className="landing-canvas-container" style={{
          flex: 1,
          height: '500px',
          position: 'relative',
        }}>
          <Canvas
            camera={{ position: [8, 6, 8], fov: 45 }}
            style={{ background: 'transparent' }}
            gl={{ alpha: true }}
          >
            <Suspense fallback={null}>
              <RunningCharacter />
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.5}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 2.5}
              />
            </Suspense>
          </Canvas>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="landing-section" style={{ padding: '60px 60px', position: 'relative', zIndex: 1 }}>
        <h2 style={{
          fontSize: 'clamp(32px, 4vw, 48px)',
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: '8px',
        }}>
          AI is <span style={{ color: '#C15F3C' }}>invisible</span>.
        </h2>
        <h2 style={{
          fontSize: 'clamp(32px, 4vw, 48px)',
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: '8px',
        }}>
          AI is <span style={{ color: '#c9a0dc' }}>abstract</span>.
        </h2>
        <h2 style={{
          fontSize: 'clamp(32px, 4vw, 48px)',
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: '60px',
          color: '#7dd3a0',
        }}>
          Zero intuition.
        </h2>

        <div className="landing-problem-flex" style={{
          display: 'flex',
          gap: '40px',
          maxWidth: '900px',
          margin: '0 auto',
          alignItems: 'center',
        }}>
          {/* Terminal mockup */}
          <div className="landing-terminal" style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.9) 0%, rgba(20, 25, 35, 0.9) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28ca41' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '4px',
                  padding: '16px 12px',
                }}>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', marginBottom: '8px', width: '85%' }} />
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', width: '60%' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '16px' }}>
              AI systems are powerful. But to understand them, you read logs, parse JSON, stare at dashboards.
            </p>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.8', marginBottom: '24px' }}>
              What about actually <em>seeing</em> what AI does?
            </p>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#fff', lineHeight: '1.8' }}>
              At scale, text interfaces break down.
            </p>
            <p style={{ marginTop: '20px', color: '#C15F3C', fontSize: '14px' }}>
              There has to be a better way.
            </p>
          </div>
        </div>
      </section>

      {/* Core Question */}
      <section className="landing-section" style={{ padding: '50px 60px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>The core question:</p>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '600', marginBottom: '40px' }}>
          How do you give a human <span style={{
            color: '#C15F3C',
            textShadow: '0 0 20px rgba(193, 95, 60, 0.3)',
            animation: 'glowPulse 3s ease-in-out infinite',
          }}>intuitive<br />understanding</span> of AI decisions?
        </h2>
        <div style={{
          width: '80px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #C15F3C, transparent)',
          margin: '0 auto',
          animation: 'lineGlowOrange 2s ease-in-out infinite',
          borderRadius: '1px',
        }} />
      </section>

      {/* Solution Section */}
      <section id="solution" className="landing-section" style={{ padding: '50px 60px', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: '14px', color: '#C15F3C', textAlign: 'center', marginBottom: '16px' }}>A spatial interface</p>
        <p style={{ fontSize: 'clamp(14px, 3vw, 16px)', color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: '700px', margin: '0 auto 40px', lineHeight: '1.7', padding: '0 10px' }}>
          A 3D environment where AI exists as a character you can see, follow, and understand.
        </p>

        <div className="landing-grid-3" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          maxWidth: '900px',
          margin: '0 auto 40px',
        }}>
          {[
            { icon: '◇', title: 'Spatial Understanding', desc: 'See AI decisions at a glance. Know instantly what it\'s doing.' },
            { icon: '◎', title: 'Intuitive Observation', desc: 'Watch. Explore. No command line gymnastics required.' },
            { icon: '◈', title: 'Strategic Overview', desc: 'Know where AI attention is. See the big picture.' },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.8) 0%, rgba(20, 25, 35, 0.8) 100%)',
              border: '1px solid rgba(193, 95, 60, 0.08)',
              borderRadius: '10px',
              padding: '24px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                background: 'rgba(193, 95, 60, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#C15F3C',
                fontSize: '18px',
                animation: `iconGlowOrange 3s ease-in-out ${i * 0.3}s infinite`,
              }}>{item.icon}</div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '10px' }}>{item.title}</h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="landing-section" style={{ padding: '50px 60px', position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '600', textAlign: 'center', marginBottom: '16px' }}>
          The <span style={{ color: '#C15F3C' }}>vision</span>
        </h2>
        <p style={{ fontSize: 'clamp(13px, 3vw, 15px)', color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: '650px', margin: '0 auto 50px', padding: '0 10px' }}>
          Imagine watching AI build a civilization. Every decision manifests in the world.
        </p>

        <div className="landing-grid-3" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          maxWidth: '1000px',
          margin: '0 auto 40px',
        }}>
          {[
            { num: '1', title: 'Enter the World', desc: 'Drop into a 3D environment where Claude is building a space colony from scratch.' },
            { num: '2', title: 'Watch It Think', desc: 'See Claude\'s thoughts in real-time. Read its reasoning. Understand its personality.' },
            { num: '3', title: 'Understand AI', desc: 'See patterns emerge. Watch priorities shift. Witness intelligence in action.', highlight: true },
          ].map((item, i) => (
            <div key={i} style={{
              background: item.highlight
                ? 'linear-gradient(135deg, rgba(26, 31, 46, 0.9) 0%, rgba(20, 25, 35, 0.9) 100%)'
                : 'linear-gradient(135deg, rgba(26, 31, 46, 0.8) 0%, rgba(20, 25, 35, 0.8) 100%)',
              border: item.highlight ? '1px solid rgba(193, 95, 60, 0.15)' : '1px solid rgba(255,255,255,0.05)',
              borderRadius: '10px',
              padding: '24px',
              boxShadow: item.highlight ? '0 0 30px rgba(193, 95, 60, 0.1)' : 'none',
              animation: item.highlight ? 'cardGlow 3s ease-in-out infinite' : 'none',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(193, 95, 60, 0.12)',
                color: '#C15F3C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '14px',
                animation: `iconGlowOrange 3s ease-in-out ${i * 0.4}s infinite`,
              }}>{item.num}</div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '10px' }}>{item.title}</h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-section" style={{ padding: '50px 60px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: '600', marginBottom: '20px' }}>
          Ready to see AI <span style={{
            color: '#C15F3C',
            textShadow: '0 0 20px rgba(193, 95, 60, 0.3)',
            animation: 'glowPulse 2.5s ease-in-out infinite',
          }}>think</span>?
        </h2>
        <VoxelButton onClick={handleEnter} primary style={{ padding: '12px 28px' }}>
          Enter World
        </VoxelButton>
      </section>

      {/* Footer */}
      <footer className="landing-footer" style={{
        padding: '40px 60px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '14px',
        position: 'relative',
        zIndex: 1,
      }}>
        <p>Claude's World — An experiment in visible AI</p>
        <p style={{ marginTop: '8px', fontSize: '12px' }}>
          Built with curiosity. Powered by Claude.
        </p>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        @keyframes voxelFloat {
          0% {
            opacity: 0.8;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-20px) scale(0.5);
          }
        }
        @keyframes voxelPulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes glowPulse {
          0%, 100% {
            text-shadow: 0 0 20px rgba(193, 95, 60, 0.3);
          }
          50% {
            text-shadow: 0 0 40px rgba(193, 95, 60, 0.6), 0 0 60px rgba(193, 95, 60, 0.3);
          }
        }
        @keyframes glowPulseGreen {
          0%, 100% {
            text-shadow: 0 0 20px rgba(125, 211, 160, 0.3);
          }
          50% {
            text-shadow: 0 0 40px rgba(125, 211, 160, 0.6), 0 0 60px rgba(125, 211, 160, 0.3);
          }
        }
        @keyframes floatParticle {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
        @keyframes lineGlow {
          0%, 100% {
            opacity: 0.3;
            box-shadow: 0 0 10px rgba(125, 211, 160, 0.2);
          }
          50% {
            opacity: 0.6;
            box-shadow: 0 0 20px rgba(125, 211, 160, 0.4);
          }
        }
        @keyframes cardGlow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(193, 95, 60, 0.1);
          }
          50% {
            box-shadow: 0 0 25px rgba(193, 95, 60, 0.2);
          }
        }
        @keyframes cardGlowGreen {
          0%, 100% {
            box-shadow: 0 0 15px rgba(125, 211, 160, 0.1);
          }
          50% {
            box-shadow: 0 0 25px rgba(125, 211, 160, 0.2);
          }
        }
        @keyframes iconGlow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(125, 211, 160, 0.2);
          }
          50% {
            box-shadow: 0 0 20px rgba(125, 211, 160, 0.4);
          }
        }
        @keyframes iconGlowOrange {
          0%, 100% {
            box-shadow: 0 0 10px rgba(193, 95, 60, 0.2);
          }
          50% {
            box-shadow: 0 0 20px rgba(193, 95, 60, 0.4);
          }
        }
        @keyframes lineGlowOrange {
          0%, 100% {
            opacity: 0.3;
            box-shadow: 0 0 10px rgba(193, 95, 60, 0.2);
          }
          50% {
            opacity: 0.6;
            box-shadow: 0 0 20px rgba(193, 95, 60, 0.4);
          }
        }
        html {
          scroll-behavior: smooth;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .landing-nav {
            padding: 16px 20px !important;
          }
          .landing-nav-links {
            display: none !important;
          }
          .landing-nav-logo {
            height: 42px !important;
          }
          .landing-section {
            padding: 40px 20px !important;
          }
          .landing-section-flex {
            flex-direction: column !important;
            gap: 24px !important;
          }
          .landing-canvas-container {
            height: 300px !important;
            width: 100% !important;
          }
          .landing-grid-3 {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .landing-stats-row {
            flex-wrap: wrap !important;
            gap: 12px !important;
          }
          .landing-hero-buttons {
            flex-direction: column !important;
            gap: 10px !important;
          }
          .landing-terminal {
            display: none !important;
          }
          .landing-problem-flex {
            flex-direction: column !important;
          }
          .token-section-card {
            flex-direction: column !important;
            gap: 12px !important;
            text-align: center !important;
          }
          .token-divider {
            display: none !important;
          }
          .landing-footer {
            padding: 30px 20px !important;
          }
        }

        @media (max-width: 480px) {
          .landing-hero h1 {
            font-size: 28px !important;
          }
          .landing-hero p {
            font-size: 16px !important;
          }
          .landing-section h2 {
            font-size: 24px !important;
          }
        }
      `}</style>
    </div>
  )
}

export default LandingPage
