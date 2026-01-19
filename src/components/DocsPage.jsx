import React, { useState } from 'react'

const sections = [
  {
    id: 'overview',
    title: 'Overview',
    icon: '◈',
    subsections: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'architecture', title: 'Architecture' },
      { id: 'tech-stack', title: 'Tech Stack' },
    ]
  },
  {
    id: 'frontend',
    title: 'Frontend',
    icon: '◇',
    subsections: [
      { id: 'components', title: 'Components' },
      { id: 'state-management', title: 'State Management' },
      { id: '3d-rendering', title: '3D Rendering' },
      { id: 'character-system', title: 'Character System' },
      { id: 'lighting', title: 'Day/Night Cycle' },
    ]
  },
  {
    id: 'backend',
    title: 'Backend',
    icon: '◆',
    subsections: [
      { id: 'server', title: 'Server Architecture' },
      { id: 'websocket', title: 'WebSocket Protocol' },
      { id: 'world-state', title: 'World State' },
    ]
  },
  {
    id: 'ai-system',
    title: 'AI System',
    icon: '✦',
    subsections: [
      { id: 'claude-brain', title: 'Claude Brain' },
      { id: 'decision-making', title: 'Decision Making' },
      { id: 'thought-generation', title: 'Thought Generation' },
      { id: 'neighborhood-planning', title: 'Neighborhood Planning' },
    ]
  },
  {
    id: 'game-mechanics',
    title: 'Game Mechanics',
    icon: '◎',
    subsections: [
      { id: 'building-system', title: 'Building System' },
      { id: 'resource-management', title: 'Resource Management' },
      { id: 'time-system', title: 'Time System' },
    ]
  },
]

const content = {
  introduction: {
    title: 'Introduction',
    content: `
**Claude's World** is an interactive 3D city-building simulation where Claude (an AI character) autonomously builds a space colony. Watch as Claude makes decisions, constructs buildings, and shares thoughts about the growing civilization.

## What Makes It Unique

- **Autonomous AI**: Claude independently decides what to build and where
- **Real-time 3D**: Watch the city grow in a fully rendered 3D environment
- **AI Personality**: Claude shares thoughts and emotions as the city develops
- **Dynamic World**: Day/night cycles, weather, and evolving neighborhoods

## How It Works

The simulation runs on a client-server architecture where:
1. The **server** manages game time, world state, and AI decision-making
2. The **client** renders the 3D world and displays Claude's actions
3. **WebSocket** communication keeps everything synchronized in real-time
    `
  },
  architecture: {
    title: 'System Architecture',
    content: `
## High-Level Overview

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   React UI   │  │  Three.js    │  │   Zustand    │       │
│  │  Components  │  │  3D Canvas   │  │    Store     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│           │               │                 │                │
│           └───────────────┴─────────────────┘                │
│                           │                                  │
│                    WebSocket Client                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                     WebSocket Connection
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                        SERVER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Express    │  │  WorldState  │  │ ClaudeBrain  │       │
│  │   Server     │  │   Manager    │  │   AI Logic   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                              │                │
│                                       OpenAI GPT-4           │
└─────────────────────────────────────────────────────────────┘
\`\`\`

## Data Flow

1. **Server Time Loop**: Advances game time every second
2. **AI Decision Loop**: Claude Brain evaluates and queues buildings
3. **Action Broadcast**: Server sends BUILD/MOVE commands to clients
4. **Client Render**: Three.js renders character movement and construction
5. **State Sync**: Zustand store updates, UI reflects changes
    `
  },
  'tech-stack': {
    title: 'Technology Stack',
    content: `
## Frontend Technologies

| Technology | Purpose |
|------------|---------|
| **React 18** | UI component framework |
| **Three.js** | 3D graphics engine |
| **@react-three/fiber** | React renderer for Three.js |
| **@react-three/drei** | Three.js helpers and utilities |
| **Zustand** | Lightweight state management |
| **Vite** | Build tool and dev server |

## Backend Technologies

| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express** | HTTP server framework |
| **ws** | WebSocket server |
| **OpenAI API** | GPT-4 for AI decisions |

## Asset Pipeline

| Format | Usage |
|--------|-------|
| **GLTF/GLB** | 3D models (KayKit voxel assets) |
| **Web Audio API** | Procedural sound generation |
    `
  },
  components: {
    title: 'React Components',
    content: `
## Component Hierarchy

\`\`\`
App.jsx
├── LandingPage.jsx      # Initial landing screen
└── Canvas (Three.js)
    └── Game.jsx         # Main 3D scene
        ├── DayNightCycle.jsx    # Lighting system
        ├── VoxelClouds.jsx      # Atmospheric effects
        ├── Ground.jsx           # Terrain plane
        ├── Character.jsx        # Claude character
        ├── SpaceObject.jsx      # Ship & space modules
        ├── CityObject.jsx       # City buildings
        ├── BuildProgress.jsx    # Construction viz
        └── GridPreview.jsx      # Placement grid
    └── HUD.jsx          # User interface overlay
\`\`\`

## Key Components

### Game.jsx
The main 3D scene container that:
- Sets up camera and lighting
- Renders all placed buildings
- Manages character positioning
- Handles click interactions

### Character.jsx
Controls Claude's avatar:
- Loads animated GLTF model
- Handles walk/idle/build animations
- Generates procedural audio (footsteps, building sounds)
- Manages movement interpolation

### CityObject.jsx & SpaceObject.jsx
Render building models with:
- Dynamic window glow based on time
- Shadow casting/receiving
- Model scaling and rotation
    `
  },
  'state-management': {
    title: 'Zustand State Management',
    content: `
## Store Structure

The game uses Zustand for client-side state management. Here's the complete state shape:

\`\`\`javascript
// Character State
characterPosition: [0, 0, 0]     // World coordinates
characterTargetPosition: null    // AI movement target
characterRotation: 0             // Facing angle (radians)
isMoving: false                  // Movement state

// Building System
placedBuildings: []              // Array of building objects
currentBuildTask: null           // Active construction
isBuilding: false                // Building animation state

// Time System
timeOfDay: 8                     // Hour (0-24)
day: 1                           // Day counter
autoTimeEnabled: true            // Auto-advance time

// Claude's State
mood: 80                         // 0-100 happiness
energy: 100                      // 0-100 energy
aiStatus: "Thinking..."          // Current activity
logbook: []                      // Thought history

// Settings
aiSpeed: 1.0                     // Speed multiplier
adminMode: false                 // Manual control
\`\`\`

## Key Actions

\`\`\`javascript
// Building
addBuilding(building)            // Add completed building
setCurrentBuildTask(task)        // Start construction
clearBuildTask()                 // Complete construction

// Character
setCharacterPosition(pos)        // Update position
setCharacterTargetPosition(pos)  // Set movement goal
setIsMoving(bool)                // Toggle movement

// Time
setTimeOfDay(hour)               // Update time
advanceDay()                     // Increment day

// AI
addLogEntry(entry)               // Add thought
setAIStatus(status)              // Update status display
\`\`\`
    `
  },
  '3d-rendering': {
    title: '3D Rendering System',
    content: `
## Canvas Configuration

\`\`\`jsx
<Canvas
  shadows
  camera={{
    position: [10, 10, 10],
    fov: 50,
    near: 0.1,
    far: 2000
  }}
>
  <Game />
</Canvas>
\`\`\`

## Shadow System

- Shadow map resolution: 2048x2048
- Directional light casts shadows
- Buildings cast and receive shadows
- Character casts shadows

## Model Loading

Buildings are loaded dynamically based on type:

\`\`\`javascript
// Space models (modules, solar, farms)
const SPACE_MODELS = [
  'basemodule_A', 'solarpanel',
  'water_storage', 'space_farm_small'
]

// Routing logic
if (SPACE_MODELS.includes(model)) {
  return <SpaceObject model={model} />
} else {
  return <CityObject model={model} />
}
\`\`\`

## Performance Optimizations

- **No per-building lights**: Uses emissive materials for glow
- **Model cloning**: SkeletonUtils for efficient animation sharing
- **Frustum culling**: Three.js default culling enabled
- **Instancing**: Consider for future optimization
    `
  },
  'character-system': {
    title: 'Character System',
    content: `
## Model Structure

Claude's character uses multiple GLTF files:
- \`character.glb\` - Base mesh
- \`Rig_Medium_MovementBasic.glb\` - Walk animation
- \`Rig_Medium_General.glb\` - Idle and build animations

## Animation States

| State | Animation | Trigger |
|-------|-----------|---------|
| Idle | Idle_A | No movement target |
| Walking | Walking_A | Moving to target |
| Building | Hit_A | During construction |

## Movement Algorithm

\`\`\`javascript
// Movement parameters
const MOVE_SPEED = 0.06    // Units per frame
const ROTATE_SPEED = 0.12  // Radians per frame

// Each frame:
1. Calculate direction to target
2. Smoothly rotate toward direction
3. Move forward if facing target
4. Stop when within 0.1 units
\`\`\`

## Procedural Audio

All sounds are generated using Web Audio API:

**Footsteps**
- Alternating left/right pattern
- White noise + sine wave mix
- 250ms interval while walking

**Building Sounds**
- Square wave frequency sweep
- 200Hz → 100Hz over 100ms
- Plays every 400ms during build

**Snoring (Sleeping)**
- Sawtooth wave oscillation
- 60Hz → 120Hz breathing pattern
- Noise texture overlay
    `
  },
  lighting: {
    title: 'Day/Night Cycle',
    content: `
## Time Phases

The day is divided into 4 phases, each 6 hours:

\`\`\`
┌────────┬────────┬────────┬────────┐
│ NIGHT  │  DAWN  │  DAY   │  DUSK  │
│ 0-6    │  6-12  │ 12-18  │ 18-24  │
└────────┴────────┴────────┴────────┘
\`\`\`

## Lighting Parameters

| Phase | Ambient | Sun | Sky Color |
|-------|---------|-----|-----------|
| Night | 0.35 | 0.5 | #1a1a2e |
| Dawn | 0.45 | 0.8 | #ff9966 |
| Day | 0.6 | 1.2 | #87ceeb |
| Dusk | 0.45 | 0.7 | #ff7744 |

## Moon System

- Visible from 18:00 to 06:00
- Arc motion across sky
- Glow halo effect
- Smooth fade at sunrise/sunset

## Window Glow

Buildings have dynamic window lighting:
\`\`\`javascript
// Glow intensity calculation
if (time >= 18 || time < 6) {
  // Night: full glow
  emissiveIntensity = 0.8
} else if (time >= 6 && time < 8) {
  // Dawn: fading glow
  emissiveIntensity = lerp(0.8, 0, (time - 6) / 2)
}
\`\`\`
    `
  },
  server: {
    title: 'Server Architecture',
    content: `
## Entry Point (index.js)

The server handles three main responsibilities:

### 1. HTTP Server
\`\`\`javascript
const app = express()
app.use(cors())
app.use(express.json())

// Endpoints
GET  /state    // Return current world state
POST /reset    // Reset world to initial state
\`\`\`

### 2. WebSocket Server
\`\`\`javascript
const wss = new WebSocket.Server({ port: 3001 })

wss.on('connection', (ws) => {
  // Send full state on connect
  ws.send(JSON.stringify({
    type: 'WORLD_STATE',
    payload: worldState.getState()
  }))
})
\`\`\`

### 3. Time Management
\`\`\`javascript
// Server is authoritative time source
// 10 real minutes = 1 game day
const TIME_SCALE = 24 / 600  // 0.04 hours/second

setInterval(() => {
  worldState.timeOfDay += TIME_SCALE
  broadcast({ type: 'TIME_UPDATE', ... })
}, 1000)
\`\`\`
    `
  },
  websocket: {
    title: 'WebSocket Protocol',
    content: `
## Message Types

### Server → Client

| Type | Payload | Purpose |
|------|---------|---------|
| WORLD_STATE | Full state object | Initial sync |
| TIME_UPDATE | { timeOfDay, day } | Time advancement |
| AI_ACTION | { action, position, model } | AI commands |
| BUILDING_PLACED | Building object | Confirm placement |
| LOG_ENTRY | { thought, mood, ... } | Claude's thoughts |

### Client → Server

| Type | Payload | Purpose |
|------|---------|---------|
| CHARACTER_POSITION | { position, rotation } | Sync position |
| ACTION_COMPLETE | { actionType } | Notify completion |
| ADMIN_MOVE | { targetPosition } | Manual movement |
| ADMIN_BUILD | { model, position } | Manual building |
| SET_SPEED | { speed } | Adjust AI speed |

## Connection Handling

\`\`\`javascript
// Client reconnection logic
attemptReconnect() {
  if (this.reconnectAttempts >= 5) return

  const delay = 2000 * Math.pow(2, this.reconnectAttempts)
  setTimeout(() => this.connect(url), delay)
}
\`\`\`
    `
  },
  'world-state': {
    title: 'World State Management',
    content: `
## WorldState Class

Server-side state container that tracks:

\`\`\`javascript
class WorldState {
  buildings = []           // All placed buildings
  timeOfDay = 8            // Current hour
  day = 1                  // Current day
  characterPosition = [0, 0, 0]
  characterRotation = 0

  stats = {
    population: 0,
    power: 0,
    powerConsumption: 0,
    water: 0,
    waterConsumption: 0,
    food: 0,
    foodConsumption: 0,
    morale: 50
  }

  occupiedCells = new Set()  // Grid occupancy
  history = []               // Event log
}
\`\`\`

## Grid System

Buildings occupy cells on a virtual grid:

\`\`\`javascript
// Convert position to cell key
const cellKey = \`\${Math.round(x/4)},\${Math.round(z/4)}\`

// Check occupancy
occupiedCells.has(cellKey)

// Mark occupied
occupiedCells.add(cellKey)
\`\`\`
    `
  },
  'claude-brain': {
    title: 'Claude Brain AI',
    content: `
## Overview

The ClaudeBrain class is the AI engine that makes Claude autonomous. It:
- Decides what buildings to construct
- Plans neighborhood layouts
- Manages resource balance
- Generates personality thoughts

## Core Loop

\`\`\`javascript
async startActivityLoop() {
  while (true) {
    // 1. Check if ready to build
    if (!this.isBuildingInProgress) {
      // 2. Get next building decision
      await this.buildNext()
    }

    // 3. Wait based on speed setting
    await sleep(5000 / this.speedMultiplier)
  }
}
\`\`\`

## Build Priority Queue

Buildings are prioritized:
1. **Roads** (priority: 1) - Infrastructure first
2. **Critical Resources** (priority: 0) - Power, water, food
3. **Buildings** (priority: 2) - Residential, commercial, etc.

\`\`\`javascript
buildQueue.sort((a, b) => a.priority - b.priority)
\`\`\`
    `
  },
  'decision-making': {
    title: 'AI Decision Making',
    content: `
## Decision Tree

Claude follows this priority order:

\`\`\`
┌─────────────────────────────────────────┐
│           CHECK CRITICAL NEEDS          │
├─────────────────────────────────────────┤
│ 1. Power deficit? → Build solar panel   │
│ 2. Water deficit? → Build water storage │
│ 3. Food deficit?  → Build farm          │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           CHECK RATIOS                  │
├─────────────────────────────────────────┤
│ • 1 solar per 8 buildings               │
│ • 1 water per 12 buildings              │
│ • 1 farm per 10 buildings               │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         NEIGHBORHOOD NEEDS              │
├─────────────────────────────────────────┤
│ • 60% Residential                       │
│ • 20% Commercial                        │
│ • 15% Industrial                        │
│ • 5% Parks                              │
└─────────────────────────────────────────┘
\`\`\`

## GPT-4 Integration

For complex decisions, Claude asks GPT-4:

\`\`\`javascript
const prompt = \`
You are Claude, building a space colony.
Current stats: \${JSON.stringify(stats)}
What should you build next and why?
\`

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: prompt }]
})
\`\`\`
    `
  },
  'thought-generation': {
    title: 'Thought Generation',
    content: `
## Personality System

Claude has distinct moods that affect thoughts:

| Mood | Trigger | Color |
|------|---------|-------|
| Optimistic | Growth, success | Green |
| Focused | Building, working | Blue |
| Tired | Low energy | Yellow |
| Proud | Milestones | Purple |
| Philosophical | Night, reflection | Cyan |

## Thought Categories

Thoughts are contextual to actions:

**Building Residential**
- "Every home I build is a promise of safety"
- "Population growing... the colony thrives"

**Building Infrastructure**
- "Power systems coming online..."
- "Water is life. Must ensure supply."

**Milestones**
- "Day 10! The colony is taking shape"
- "100 buildings... from nothing to something"

## GPT Thought Generation

\`\`\`javascript
async generateThought() {
  const prompt = \`
    You are Claude, an AI building a space colony.
    City size: \${this.getCitySize()}
    Current mood: \${this.mood}
    Just built: \${this.lastBuilding}

    Share a brief thought (1-2 sentences).
  \`

  // Fallback to preset thoughts if API fails
  return response || this.getPresetThought()
}
\`\`\`
    `
  },
  'neighborhood-planning': {
    title: 'Neighborhood Planning',
    content: `
## Cluster-Based Growth

The city grows in neighborhoods, not randomly:

\`\`\`
     [Residential]
          │
    ┌─────┴─────┐
    │   ROADS   │
    └─────┬─────┘
          │
   ┌──────┼──────┐
   │      │      │
[Shop] [Park] [Shop]
\`\`\`

## Neighborhood Parameters

\`\`\`javascript
const CLUSTER_RADIUS = 20    // Max distance from center
const BUILDINGS_PER_CLUSTER = 15-25

// Neighborhood types
const types = ['residential', 'commercial', 'industrial']
\`\`\`

## Placement Algorithm

\`\`\`javascript
// 1. Pick neighborhood center
const center = findNewNeighborhoodLocation()

// 2. Create road network (L-shaped)
createRoadNetwork(center.x, center.z)

// 3. Fill with buildings
for (let i = 0; i < targetCount; i++) {
  const pos = findValidPosition(center, CLUSTER_RADIUS)
  queueBuilding(type, pos)
}

// 4. When full, start new neighborhood
if (buildingCount >= BUILDINGS_PER_CLUSTER) {
  createNewNeighborhood()
}
\`\`\`

## Industrial Separation

Industrial zones are placed opposite to residential:

\`\`\`javascript
if (type === 'industrial') {
  // Calculate direction away from residential average
  const awayAngle = Math.atan2(-avgResZ, -avgResX)
  position = polarToCartesian(awayAngle, distance)
}
\`\`\`
    `
  },
  'building-system': {
    title: 'Building System',
    content: `
## Building Types

| Category | Models | Purpose |
|----------|--------|---------|
| Residential | building_A-G | Housing (50-200 pop) |
| Commercial | shop_*, market_* | Services (10-40 pop) |
| Industrial | factory_*, warehouse_* | Production (20-70 pop) |
| Power | solarpanel | Energy (+10 power) |
| Water | water_storage | Water (+50 water) |
| Food | space_farm_* | Food (+20 food) |
| Roads | road_* | Infrastructure |
| Parks | tree_*, bench_* | Decoration |

## Building Process

\`\`\`
1. AI decides building type
         │
         ▼
2. Find valid position
   • Check grid occupancy
   • Verify spacing (3.5 units)
   • Avoid ship area
         │
         ▼
3. Queue BUILD action
         │
         ▼
4. Character walks to site
         │
         ▼
5. Build animation (5 seconds)
   • Hit_A animation loops
   • Progress bar shows %
         │
         ▼
6. Building appears
   • Added to placedBuildings
   • Stats updated
\`\`\`

## Position Validation

\`\`\`javascript
isValidBuildPosition(x, z) {
  // Not too close to ship
  if (distance([0,0], [x,z]) < 8) return false

  // Not occupied
  if (occupiedCells.has(\`\${x},\${z}\`)) return false

  // Minimum spacing from other buildings
  for (const building of buildings) {
    if (distance(building.position, [x,z]) < 3.5) {
      return false
    }
  }

  return true
}
\`\`\`
    `
  },
  'resource-management': {
    title: 'Resource Management',
    content: `
## Resource Types

| Resource | Generator | Rate | Consumers |
|----------|-----------|------|-----------|
| Power | Solar Panel | +10/panel | All buildings |
| Water | Water Storage | +50/facility | Residential, farms |
| Food | Space Farm | +20/farm | Population |

## Consumption Rates

\`\`\`javascript
// Per building type
const consumption = {
  residential: { power: 2, water: 3, food: 1 },
  commercial:  { power: 3, water: 1, food: 0 },
  industrial:  { power: 5, water: 2, food: 0 }
}
\`\`\`

## Balance Checking

\`\`\`javascript
checkResourceBalance() {
  const net = {
    power: stats.power - stats.powerConsumption,
    water: stats.water - stats.waterConsumption,
    food: stats.food - stats.foodConsumption
  }

  // Trigger emergency building if deficit
  if (net.power < 0) queueCritical('solarpanel')
  if (net.water < 0) queueCritical('water_storage')
  if (net.food < 0) queueCritical('space_farm_small')
}
\`\`\`

## Morale System

\`\`\`javascript
// Daily morale update
if (allResourcesPositive) {
  morale = Math.min(100, morale + 5)
} else {
  morale = Math.max(0, morale - 10)
}
\`\`\`
    `
  },
  'time-system': {
    title: 'Time System',
    content: `
## Time Scale

\`\`\`
Real Time          Game Time
─────────────────────────────
1 second     →     0.04 hours (2.4 minutes)
1 minute     →     2.4 hours
10 minutes   →     24 hours (1 day)
1 hour       →     6 days
\`\`\`

## Server Authority

The server is the single source of truth for time:

\`\`\`javascript
// Server time loop
setInterval(() => {
  worldState.timeOfDay += TIME_SCALE

  if (worldState.timeOfDay >= 24) {
    worldState.timeOfDay = 0
    worldState.day++
  }

  broadcast({ type: 'TIME_UPDATE', ... })
}, 1000)
\`\`\`

## Client Synchronization

\`\`\`javascript
// Client receives time updates
socket.on('TIME_UPDATE', ({ timeOfDay, day }) => {
  setTimeOfDay(timeOfDay)
  if (day !== currentDay) {
    advanceDay()
  }
})
\`\`\`

## Speed Control

Users can adjust simulation speed:

\`\`\`javascript
// Speed multiplier (0.5x to 10x)
const cooldown = 5000 / speedMultiplier

// At 2x: builds every 2.5 seconds
// At 10x: builds every 0.5 seconds
\`\`\`
    `
  },
}

function DocsPage({ onBack }) {
  const [activeSection, setActiveSection] = useState('introduction')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const currentContent = content[activeSection] || content.introduction

  // Filter sections based on search
  const filteredSections = sections.map(section => ({
    ...section,
    subsections: section.subsections.filter(sub =>
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.subsections.length > 0 || section.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a12 0%, #12121f 50%, #0a0a12 100%)',
      color: '#e0e0e0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '280px' : '0',
        minWidth: sidebarOpen ? '280px' : '0',
        background: 'rgba(15, 15, 25, 0.95)',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #e8a754 0%, #d4943d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}>
              ◈
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>Claude's World</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Documentation</div>
            </div>
          </div>

          {/* Search */}
          <div style={{
            position: 'relative',
          }}>
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <svg
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.4,
              }}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 0',
        }}>
          {filteredSections.map((section) => (
            <div key={section.id} style={{ marginBottom: '8px' }}>
              <div style={{
                padding: '8px 20px',
                fontSize: '11px',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ color: '#e8a754' }}>{section.icon}</span>
                {section.title.toUpperCase()}
              </div>
              {section.subsections.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSection(sub.id)}
                  style={{
                    width: '100%',
                    padding: '10px 20px 10px 40px',
                    background: activeSection === sub.id ? 'rgba(232, 167, 84, 0.1)' : 'transparent',
                    border: 'none',
                    borderLeft: activeSection === sub.id ? '2px solid #e8a754' : '2px solid transparent',
                    color: activeSection === sub.id ? '#fff' : 'rgba(255,255,255,0.6)',
                    fontSize: '13px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {sub.title}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Back button */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <button
            onClick={onBack}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.08)'
              e.target.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)'
              e.target.style.color = 'rgba(255,255,255,0.6)'
            }}
          >
            ← Back to Home
          </button>
        </div>
      </aside>

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="docs-sidebar-toggle"
        style={{
          position: 'fixed',
          top: '16px',
          left: sidebarOpen ? '296px' : '16px',
          zIndex: 1000,
          width: '36px',
          height: '36px',
          background: 'rgba(15, 15, 25, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'left 0.3s ease',
        }}
      >
        {sidebarOpen ? '←' : '☰'}
      </button>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: '40px 60px',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        {/* Breadcrumb */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '32px',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.4)',
        }}>
          <span>Docs</span>
          <span>/</span>
          <span style={{ color: '#e8a754' }}>{currentContent.title}</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 36px)',
          fontWeight: '700',
          color: '#fff',
          marginBottom: '32px',
          lineHeight: '1.2',
        }}>
          {currentContent.title}
        </h1>

        {/* Content */}
        <div
          className="docs-content"
          style={{
            fontSize: '15px',
            lineHeight: '1.8',
            color: 'rgba(255,255,255,0.8)',
          }}
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(currentContent.content)
          }}
        />

        {/* Navigation Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '60px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          {getPrevSection(activeSection) && (
            <button
              onClick={() => setActiveSection(getPrevSection(activeSection))}
              style={{
                padding: '12px 20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ← Previous
            </button>
          )}
          <div style={{ flex: 1 }} />
          {getNextSection(activeSection) && (
            <button
              onClick={() => setActiveSection(getNextSection(activeSection))}
              style={{
                padding: '12px 20px',
                background: 'rgba(232, 167, 84, 0.1)',
                border: '1px solid rgba(232, 167, 84, 0.2)',
                borderRadius: '8px',
                color: '#e8a754',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Next →
            </button>
          )}
        </div>
      </main>

      {/* Styles */}
      <style>{`
        .docs-content h2 {
          font-size: 22px;
          font-weight: 600;
          color: #fff;
          margin: 40px 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .docs-content h3 {
          font-size: 17px;
          font-weight: 600;
          color: #e8a754;
          margin: 28px 0 12px 0;
        }

        .docs-content p {
          margin: 16px 0;
        }

        .docs-content strong {
          color: #fff;
          font-weight: 600;
        }

        .docs-content code {
          background: rgba(232, 167, 84, 0.1);
          color: #e8a754;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 13px;
        }

        .docs-content pre {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;
          margin: 20px 0;
        }

        .docs-content pre code {
          background: none;
          padding: 0;
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          line-height: 1.6;
        }

        .docs-content ul, .docs-content ol {
          margin: 16px 0;
          padding-left: 24px;
        }

        .docs-content li {
          margin: 8px 0;
        }

        .docs-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 14px;
        }

        .docs-content th {
          background: rgba(232, 167, 84, 0.1);
          color: #e8a754;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .docs-content td {
          padding: 12px 16px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.7);
        }

        .docs-content tr:nth-child(even) td {
          background: rgba(255, 255, 255, 0.02);
        }

        .docs-content blockquote {
          border-left: 3px solid #e8a754;
          padding-left: 16px;
          margin: 20px 0;
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
        }

        @media (max-width: 768px) {
          main {
            padding: 24px 20px !important;
          }

          aside {
            position: fixed !important;
            z-index: 999;
          }

          .docs-sidebar-toggle {
            display: flex !important;
          }
        }

        @media (min-width: 769px) {
          .docs-sidebar-toggle {
            display: none !important;
          }
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}

// Simple markdown renderer
function renderMarkdown(text) {
  return text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Tables
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim())
      if (cells.every(c => c.trim().match(/^-+$/))) {
        return '' // Skip separator row
      }
      const isHeader = match.includes('---') === false &&
                       text.indexOf(match) < text.indexOf('|---|')
      const tag = isHeader ? 'th' : 'td'
      return `<tr>${cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('')}</tr>`
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>')
    // Lists
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[a-z])/gm, '<p>')
    .replace(/(?<![>])$/gm, '</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<[a-z])/g, '$1')
    .replace(/(<\/[a-z]+>)<\/p>/g, '$1')
}

// Navigation helpers
function getAllSections() {
  return sections.flatMap(s => s.subsections.map(sub => sub.id))
}

function getPrevSection(current) {
  const all = getAllSections()
  const idx = all.indexOf(current)
  return idx > 0 ? all[idx - 1] : null
}

function getNextSection(current) {
  const all = getAllSections()
  const idx = all.indexOf(current)
  return idx < all.length - 1 ? all[idx + 1] : null
}

export default DocsPage
