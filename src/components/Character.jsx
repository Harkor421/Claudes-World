import React, { useRef, useEffect, useMemo, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, Html } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { useGameStore } from '../store/gameStore'

// Build duration in seconds
const BUILD_DURATION = 5

// Create hit sound
const createHitSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()

  return () => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Voxel-style hit sound
    oscillator.frequency.setValueAtTime(200 + Math.random() * 100, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1)
    oscillator.type = 'square'

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  }
}

let playHitSound = null

// Main character with loaded GLB model and animations
function LoadedCharacter() {
  const groupRef = useRef()
  const modelRef = useRef()
  const currentActionRef = useRef(null)
  const wasMovingRef = useRef(false)
  const wasBuildingRef = useRef(false)
  const buildStartTimeRef = useRef(null)
  const lastHitSoundRef = useRef(0)

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

  // Initialize sound on first interaction
  useEffect(() => {
    const initSound = () => {
      if (!playHitSound) {
        playHitSound = createHitSound()
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
