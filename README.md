# Claude's World

An interactive 3D city-building simulation where an AI agent autonomously builds a space colony in real-time. Watch as Claude explores, plans, and constructs an entire settlement — every decision visible, every thought logged.

Built with **React**, **Three.js**, and **OpenAI GPT-4**.

![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.160-000000?logo=three.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-010101?logo=socket.io&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991?logo=openai&logoColor=white)

---

## Overview

Claude's World is a full-stack web application that visualizes autonomous AI decision-making through a 3D city builder. An AI "brain" running on the backend evaluates the world state, decides what to build and where, then streams those actions to a browser-based 3D client in real time.

**Key features:**
- Autonomous AI agent that plans and builds a city with no human input
- Real-time 3D visualization with voxel-style buildings and terrain
- Day/night cycle with dynamic lighting
- AI personality system — mood, energy, and internal thoughts
- Live logbook showing Claude's reasoning for every decision
- Procedural audio (footsteps, construction, ambient)
- Neighborhood-based urban planning with resource management

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                   │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Landing   │  │  3D Canvas   │  │  State (Zustand) │  │
│  │ Page      │  │  Three.js    │  │  Character, Time │  │
│  │           │  │  R3F + Drei  │  │  Buildings, AI   │  │
│  └──────────┘  └──────┬───────┘  └────────┬─────────┘  │
│                        │                   │            │
│                        └───────┬───────────┘            │
│                                │                        │
└────────────────────────────────┼────────────────────────┘
                                 │ WebSocket
┌────────────────────────────────┼────────────────────────┐
│                      Backend (Node.js)                  │
│                                │                        │
│  ┌─────────────┐  ┌───────────┴──────┐  ┌───────────┐  │
│  │ Express     │  │  WebSocket       │  │ World     │  │
│  │ HTTP Server │  │  Real-time Sync  │  │ State     │  │
│  └─────────────┘  └───────┬──────────┘  └───────────┘  │
│                            │                            │
│                   ┌────────┴────────┐                   │
│                   │  AI Brain       │                   │
│                   │  (OpenAI GPT-4) │                   │
│                   └─────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 18** | UI framework and component architecture |
| **Three.js** | 3D rendering engine |
| **React Three Fiber** | React renderer for Three.js — declarative 3D scenes |
| **React Three Drei** | Helper components (OrbitControls, GLTF loader, etc.) |
| **Zustand** | Lightweight state management |
| **Vite** | Build tool and dev server |

### Backend

| Technology | Purpose |
|---|---|
| **Node.js + Express** | HTTP server and REST API |
| **WebSocket (ws)** | Real-time bidirectional communication |
| **OpenAI SDK** | GPT-4 integration for AI decision-making |
| **dotenv** | Environment variable management |

---

## Project Structure

```
claudes-world/
├── public/
│   ├── logo.png                    # Project logo
│   └── models/
│       ├── character.glb           # Character model + animations
│       ├── space/                  # Space colony modules (GLTF)
│       └── city/                   # City buildings - voxel style (GLTF)
│
├── src/
│   ├── main.jsx                    # React entry point
│   ├── App.jsx                     # Root component + page routing
│   ├── index.css                   # Global styles
│   │
│   ├── components/
│   │   ├── LandingPage.jsx         # Marketing landing page
│   │   ├── DocsPage.jsx            # Technical documentation
│   │   ├── Game.jsx                # 3D scene container
│   │   ├── HUD.jsx                 # Heads-up display overlay
│   │   ├── Character.jsx           # AI character controller + animations
│   │   ├── AIController.jsx        # WebSocket message handler
│   │   ├── BuildMenu.jsx           # Building selection UI
│   │   ├── BuildProgress.jsx       # Construction progress indicator
│   │   ├── GridPreview.jsx         # Placement grid preview
│   │   ├── CityObject.jsx          # City building renderer
│   │   ├── SpaceObject.jsx         # Space module renderer
│   │   ├── BuildingInteraction.jsx # Click-to-build system
│   │   ├── CompanySign.jsx         # Floating building labels
│   │   ├── DayNightCycle.jsx       # Time system + dynamic lighting
│   │   ├── Ground.jsx              # Ground plane
│   │   ├── VoxelClouds.jsx         # Procedural cloud system
│   │   ├── VoxelParticles.jsx      # Particle effects
│   │   └── Weather.jsx             # Weather effects
│   │
│   ├── store/
│   │   └── gameStore.js            # Zustand store (game state)
│   │
│   ├── services/
│   │   └── socket.js               # WebSocket client
│   │
│   └── hooks/
│       └── useAIBrain.js           # AI communication hook
│
├── server/
│   ├── index.js                    # Express + WebSocket server
│   ├── brain.js                    # AI decision engine
│   ├── worldState.js               # Server-side state manager
│   ├── .env.example                # Environment variables template
│   └── package.json
│
├── index.html                      # HTML entry point
├── vite.config.js                  # Vite configuration
└── package.json
```

---

## How It Works

### AI Decision Loop

The AI brain runs on the backend as a continuous loop:

1. **Observe** — Reads the full world state (buildings, resources, time of day, mood/energy)
2. **Reason** — Sends the state to GPT-4 with a system prompt that defines Claude's personality and building knowledge
3. **Decide** — GPT-4 returns a structured action: what to build, where, and why
4. **Execute** — The server broadcasts the action via WebSocket to all connected clients
5. **Animate** — The frontend moves the character to the build site, plays construction animations, and places the building

### Real-Time Sync (WebSocket Protocol)

| Direction | Message | Description |
|---|---|---|
| Server → Client | `WORLD_STATE` | Full state sync on connection |
| Server → Client | `AI_ACTION` | Build/move command from AI |
| Server → Client | `TIME_UPDATE` | Day/night cycle progression |
| Server → Client | `LOG_ENTRY` | Claude's internal thoughts |
| Client → Server | `BUILDING_PLACED` | Building placement confirmation |
| Client → Server | `ACTION_COMPLETE` | Action finished notification |

### Time System

- **10 real minutes = 1 in-game day** (24-hour cycle)
- 4 lighting phases: Night (0-6h), Dawn (6-12h), Day (12-18h), Dusk (18-24h)
- Dynamic ambient lighting, shadow direction, and sky color transitions

### AI Personality

Claude has internal states that influence behavior:

- **Mood** (0-100) — Affects building choices and thought patterns
- **Energy** (0-100) — Depletes with activity, recovers during sleep
- **Sleep cycle** — Returns to the crashed ship at night to rest
- **Thoughts** — Logged in real-time with reasoning for each decision

### Building System

Buildings are organized into categories:

| Category | Examples |
|---|---|
| Residential | Houses, apartments |
| Commercial | Shops, markets |
| Industrial | Factories, warehouses |
| Infrastructure | Roads, parks, utilities |
| Space Modules | Solar panels, water storage, farms, habitats |

The AI uses neighborhood-based planning — clustering related buildings together and managing resources (power, water, food) across the settlement.

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **OpenAI API key** ([get one here](https://platform.openai.com/api-keys))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/claudes-world.git
cd claudes-world

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### Configuration

```bash
# In the server/ directory, create a .env file
cp .env.example .env

# Edit .env and add your OpenAI API key
OPENAI_API_KEY=your_api_key_here
PORT=3001
```

### Running

```bash
# Terminal 1 — Start the backend
cd server
npm run dev

# Terminal 2 — Start the frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

The output is in the `dist/` folder, ready to deploy to any static hosting provider.

---

## 3D Assets

- **Character model** — Custom GLB with skeletal animations (Idle, Walk, Build)
- **City buildings** — [KayKit City Builder Bits](https://kaylousberg.itch.io/city-builder-bits) (voxel-style GLTF)
- **Space modules** — [KayKit Space Kit](https://kaylousberg.itch.io/) (GLTF)

---

## License

MIT
