import React, { useRef, useEffect, useMemo, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, Html } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { useGameStore } from '../store/gameStore'

// Build duration in seconds
const BUILD_DURATION = 5

// Audio context shared between sounds
let audioContext = null

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

// Create hit sound for building
const createHitSound = () => {
  return () => {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Voxel-style hit sound
    oscillator.frequency.setValueAtTime(200 + Math.random() * 100, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1)
    oscillator.type = 'square'

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  }
}

// Create footstep sound with distance-based volume
const createFootstepSound = () => {
  // Alternate between two slightly different footstep sounds
  let stepIndex = 0

  return (distance) => {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // Calculate volume based on distance (max distance ~25 units)
    const maxDistance = 25
    const minVolume = 0.01
    const maxVolume = 0.35
    const volume = Math.max(minVolume, maxVolume * (1 - Math.min(distance / maxDistance, 1)))

    // Alternate between left/right foot
    stepIndex = (stepIndex + 1) % 2

    // Create noise buffer for footstep texture
    const bufferSize = ctx.sampleRate * 0.08 // 80ms of noise
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }

    // Noise source (the "scrape/texture" of the step)
    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuffer

    // Bandpass filter to shape the noise into a footstep sound
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(stepIndex === 0 ? 800 : 900, now)
    filter.Q.setValueAtTime(1.5, now)

    // Gain envelope for noise
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(volume * 0.5, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(ctx.destination)

    // Low thump (the impact)
    const thump = ctx.createOscillator()
    const thumpGain = ctx.createGain()
    thump.type = 'sine'
    thump.frequency.setValueAtTime(stepIndex === 0 ? 60 : 55, now)
    thump.frequency.exponentialRampToValueAtTime(30, now + 0.06)
    thumpGain.gain.setValueAtTime(volume * 0.8, now)
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    thump.connect(thumpGain)
    thumpGain.connect(ctx.destination)

    // Start and stop
    noise.start(now)
    noise.stop(now + 0.08)
    thump.start(now)
    thump.stop(now + 0.08)
  }
}

let playHitSound = null
let playFootstepSound = null

// Main character with loaded GLB model and animations
function LoadedCharacter() {
  const groupRef = useRef()
  const modelRef = useRef()
  const currentActionRef = useRef(null)
  const wasMovingRef = useRef(false)
  const wasBuildingRef = useRef(false)
  const buildStartTimeRef = useRef(null)
  const lastHitSoundRef = useRef(0)
  const lastFootstepRef = useRef(0)

  const characterPosition = useGameStore((state) => state.characterPosition)
  const setCharacterPosition = useGameStore((state) => state.setCharacterPosition)
  const targetPosition = useGameStore((state) => state.characterTargetPosition)
  const clearTargetPosition = useGameStore((state) => state.clearTargetPosition)
  const keysPressed = useGameStore((state) => state.keysPressed)
  const setIsMoving = useGameStore((state) => state.setIsMoving)

  // Building state
  const currentBuildTask = useGameStore((state) => state.currentBuildTask)
  const isBuilding = useGameStore((state) => state.isBuilding)
  const setIsBuilding = useGameStore((state) => state.setIsBuilding)
  const updateBuildProgress = useGameStore((state) => state.updateBuildProgress)
  const completeBuild = useGameStore((state) => state.completeBuild)

  const moveSpeed = 0.06
  const rotationSpeed = 0.12

  // Initialize sounds on first interaction
  useEffect(() => {
    const initSound = () => {
      if (!playHitSound) {
        playHitSound = createHitSound()
      }
      if (!playFootstepSound) {
        playFootstepSound = createFootstepSound()
      }
      window.removeEventListener('click', initSound)
    }
    window.addEventListener('click', initSound)
    return () => window.removeEventListener('click', initSound)
  }, [])

  // Load the character model (has the mesh)
  const characterGltf = useGLTF('/models/character.glb')

  // Load the animation files
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

  // Set up animations with the cloned model
  const { actions, mixer } = useAnimations(allAnimations, modelRef)

  // Log and start idle animation
  useEffect(() => {
    if (actions) {
      console.log('Available animations:', Object.keys(actions))

      // Use Idle_A for standing still
      const idleAction = actions['Idle_A']
      if (idleAction) {
        idleAction.reset().fadeIn(0.2).play()
        currentActionRef.current = idleAction
        console.log('Playing idle:', idleAction.getClip().name)
      }
    }
  }, [actions])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const currentPos = new THREE.Vector3(...characterPosition)
    let moving = false
    let targetDir = new THREE.Vector3()

    // Get camera position for distance-based sound
    const cameraPos = state.camera.position

    // Check if we have a build task and arrived at destination
    const hasBuildTask = currentBuildTask && !isBuilding
    const buildTarget = currentBuildTask ? new THREE.Vector3(...currentBuildTask.position) : null

    const moveDir = new THREE.Vector3()
    const forwardDir = new THREE.Vector3(-1, 0, -1).normalize()
    const rightDir = new THREE.Vector3(1, 0, -1).normalize()

    // Don't allow keyboard movement while building
    if (!isBuilding) {
      if (keysPressed.forward) { moveDir.add(forwardDir); moving = true }
      if (keysPressed.backward) { moveDir.sub(forwardDir); moving = true }
      if (keysPressed.left) { moveDir.sub(rightDir); moving = true }
      if (keysPressed.right) { moveDir.add(rightDir); moving = true }
    }

    if (moving && moveDir.length() > 0) {
      moveDir.normalize()
      currentPos.add(moveDir.multiplyScalar(moveSpeed))
      targetDir = moveDir.clone()
      clearTargetPosition()
    } else if (targetPosition && !isBuilding) {
      const target = new THREE.Vector3(...targetPosition)
      const direction = target.clone().sub(currentPos)
      const distance = direction.length()

      if (distance > 0.1) {
        direction.normalize()
        currentPos.add(direction.multiplyScalar(Math.min(moveSpeed, distance)))
        targetDir = direction.clone()
        moving = true
      } else {
        clearTargetPosition()
        // Check if we arrived at build location
        if (hasBuildTask && buildTarget) {
          const distToBuild = currentPos.distanceTo(buildTarget)
          if (distToBuild < 0.5) {
            setIsBuilding(true)
            buildStartTimeRef.current = Date.now()
          }
        }
      }
    }

    // Play footstep sounds while moving
    if (moving && playFootstepSound) {
      const now = Date.now()
      const stepInterval = 250 // ms between footsteps
      if (now - lastFootstepRef.current > stepInterval) {
        // Calculate distance from camera to character
        const distanceToCamera = cameraPos.distanceTo(currentPos)
        playFootstepSound(distanceToCamera)
        lastFootstepRef.current = now
      }
    }

    // Handle building progress
    if (isBuilding && currentBuildTask) {
      const elapsed = (Date.now() - buildStartTimeRef.current) / 1000
      const progress = Math.min(elapsed / BUILD_DURATION, 1)
      updateBuildProgress(progress)

      // Face the build location
      if (buildTarget) {
        const dirToBuild = buildTarget.clone().sub(currentPos).normalize()
        const targetAngle = Math.atan2(dirToBuild.x, dirToBuild.z)
        groupRef.current.rotation.y = targetAngle
      }

      // Play hit sound periodically
      const now = Date.now()
      if (now - lastHitSoundRef.current > 400 && playHitSound) {
        playHitSound()
        lastHitSoundRef.current = now
      }

      // Complete building
      if (progress >= 1) {
        completeBuild()
        buildStartTimeRef.current = null
      }
    }

    setCharacterPosition([currentPos.x, currentPos.y, currentPos.z])
    groupRef.current.position.set(currentPos.x, currentPos.y, currentPos.z)

    // Smooth rotation (only when moving, not building)
    if (moving && targetDir.length() > 0 && !isBuilding) {
      const targetAngle = Math.atan2(targetDir.x, targetDir.z)
      let angleDiff = targetAngle - groupRef.current.rotation.y
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
      groupRef.current.rotation.y += angleDiff * rotationSpeed
    }

    // Switch animations based on state
    if (actions && Object.keys(actions).length > 0) {
      const currentlyBuilding = isBuilding
      const currentlyMoving = moving

      // Handle building animation
      if (currentlyBuilding !== wasBuildingRef.current) {
        wasBuildingRef.current = currentlyBuilding

        const hitAction = actions['Hit_A']
        const idleAction = actions['Idle_A']

        if (currentlyBuilding && hitAction) {
          currentActionRef.current?.fadeOut(0.2)
          hitAction.reset().fadeIn(0.2).play()
          hitAction.setLoop(THREE.LoopRepeat)
          currentActionRef.current = hitAction
        } else if (!currentlyBuilding && idleAction) {
          currentActionRef.current?.fadeOut(0.2)
          idleAction.reset().fadeIn(0.2).play()
          currentActionRef.current = idleAction
        }
      }

      // Handle movement animation (only if not building)
      if (!currentlyBuilding && currentlyMoving !== wasMovingRef.current) {
        wasMovingRef.current = currentlyMoving

        const walkAction = actions['Walking_A']
        const idleAction = actions['Idle_A']

        if (currentlyMoving && walkAction) {
          currentActionRef.current?.fadeOut(0.2)
          walkAction.reset().fadeIn(0.2).play()
          currentActionRef.current = walkAction
        } else if (!currentlyMoving && idleAction) {
          currentActionRef.current?.fadeOut(0.2)
          idleAction.reset().fadeIn(0.2).play()
          currentActionRef.current = idleAction
        }
      }
    }

    // Update animation mixer
    if (mixer) mixer.update(delta)
    setIsMoving(moving)
  })

  return (
    <group ref={groupRef} position={characterPosition}>

      {/* Selection circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.35, 0.48, 32]} />
        <meshBasicMaterial color="#3a8a4a" transparent opacity={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.35, 32]} />
        <meshBasicMaterial color="#2d5a35" transparent opacity={0.4} />
      </mesh>

      {/* Character model */}
      <group ref={modelRef} scale={1}>
        <primitive object={clonedScene} />
      </group>
    </group>
  )
}

// Fallback character (shows while loading)
function FallbackCharacter() {
  const groupRef = useRef()
  const characterPosition = useGameStore((state) => state.characterPosition)
  const setCharacterPosition = useGameStore((state) => state.setCharacterPosition)
  const targetPosition = useGameStore((state) => state.characterTargetPosition)
  const clearTargetPosition = useGameStore((state) => state.clearTargetPosition)
  const keysPressed = useGameStore((state) => state.keysPressed)
  const setIsMoving = useGameStore((state) => state.setIsMoving)

  const moveSpeed = 0.06
  const rotationSpeed = 0.12

  useFrame(() => {
    if (!groupRef.current) return

    const currentPos = new THREE.Vector3(...characterPosition)
    let moving = false
    let targetDir = new THREE.Vector3()

    const moveDir = new THREE.Vector3()
    const forwardDir = new THREE.Vector3(-1, 0, -1).normalize()
    const rightDir = new THREE.Vector3(1, 0, -1).normalize()

    if (keysPressed.forward) { moveDir.add(forwardDir); moving = true }
    if (keysPressed.backward) { moveDir.sub(forwardDir); moving = true }
    if (keysPressed.left) { moveDir.sub(rightDir); moving = true }
    if (keysPressed.right) { moveDir.add(rightDir); moving = true }

    if (moving && moveDir.length() > 0) {
      moveDir.normalize()
      currentPos.add(moveDir.multiplyScalar(moveSpeed))
      targetDir = moveDir.clone()
      clearTargetPosition()
    } else if (targetPosition) {
      const target = new THREE.Vector3(...targetPosition)
      const direction = target.clone().sub(currentPos)
      const distance = direction.length()

      if (distance > 0.1) {
        direction.normalize()
        currentPos.add(direction.multiplyScalar(Math.min(moveSpeed, distance)))
        targetDir = direction.clone()
        moving = true
      } else {
        clearTargetPosition()
      }
    }

    setCharacterPosition([currentPos.x, currentPos.y, currentPos.z])
    groupRef.current.position.set(currentPos.x, currentPos.y, currentPos.z)

    if (moving && targetDir.length() > 0) {
      const targetAngle = Math.atan2(targetDir.x, targetDir.z)
      let angleDiff = targetAngle - groupRef.current.rotation.y
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
      groupRef.current.rotation.y += angleDiff * rotationSpeed
    }

    setIsMoving(moving)
  })

  return (
    <group ref={groupRef} position={characterPosition}>
      <Html position={[0, 1.2, 0]} center>
        <div style={{ color: '#7dd3a0', fontSize: '12px' }}>Loading...</div>
      </Html>
      <mesh castShadow position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.2, 0.4, 8, 16]} />
        <meshStandardMaterial color="#888" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

// Main Character component
function Character() {
  return (
    <Suspense fallback={<FallbackCharacter />}>
      <LoadedCharacter />
    </Suspense>
  )
}

// Preload models
useGLTF.preload('/models/character.glb')
useGLTF.preload('/models/Rig_Medium_MovementBasic.glb')
useGLTF.preload('/models/Rig_Medium_General.glb')

export default Character
