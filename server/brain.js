import OpenAI from 'openai'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

// Building placement configuration
const MIN_SPACING = 3.5 // Minimum distance between buildings
const MAX_RADIUS = 200 // Maximum city radius
const CLUSTER_RADIUS = 20 // Size of neighborhood clusters
const ROAD_WIDTH = 4 // Grid spacing for roads

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

if (openai) {
  console.log('OpenAI client initialized for thought generation')
} else {
  console.log('No OPENAI_API_KEY found - using fallback thoughts')
}

// Available models for building
const AVAILABLE_BUILDINGS = {
  residential: ['building_A', 'building_B', 'building_C', 'building_D'],
  commercial: ['building_E', 'building_F'],
  industrial: ['building_G', 'building_H'],
  infrastructure: ['solarpanel', 'water_storage', 'eco_module', 'space_farm_small', 'space_farm_large'],
  decoration: ['tree_A', 'tree_B', 'tree_C', 'tree_D', 'tree_E', 'bench', 'bush_A', 'bush_B', 'bush_C'],
}

// Building name generators based on type
const BUILDING_NAMES = {
  residential: ['Sunrise Apartments', 'Horizon Heights', 'Nova Living', 'Stellar Residence', 'Cosmic Condos', 'Unity Housing', 'Pioneer Homes', 'Settlement Quarters', 'Colony Dwellings', 'New Earth Flats'],
  commercial: ['Trading Post Alpha', 'Market Hub', 'Commerce Center', 'Supply Depot', 'Merchant Plaza', 'Exchange Station'],
  industrial: ['Fabrication Plant', 'Processing Facility', 'Manufacturing Hub', 'Assembly Works', 'Production Center'],
  power: ['Solar Array', 'Power Station', 'Energy Grid Node', 'Photovoltaic Farm'],
  water: ['Water Reservoir', 'Purification Station', 'Aqua Storage', 'Hydro Tank'],
  food: ['Hydroponic Farm', 'Bio-Agriculture Unit', 'Food Production', 'Greenhouse Module'],
  eco: ['Life Support Module', 'Oxygen Generator', 'Atmosphere Processor', 'Eco Recycler'],
}

// Purpose descriptions
const BUILDING_PURPOSES = {
  residential: 'Housing for colonists and their families',
  commercial: 'Trade and commerce activities',
  industrial: 'Manufacturing and resource processing',
  power: 'Generating electricity for the colony',
  water: 'Storing and purifying water supply',
  food: 'Growing food for colony sustenance',
  eco: 'Maintaining breathable atmosphere',
  park: 'Recreation and oxygen production',
  road: 'Transportation infrastructure',
}

// Claude's personality profile for AI thought generation
const CLAUDE_PERSONALITY = `You are Claude, an AI city planner building a space colony on a new planet.
You have a warm, thoughtful personality with dry humor. You take pride in your work but stay humble.
You care deeply about the colonists' wellbeing and think about the bigger picture.
You sometimes get philosophical about creation and what it means to build a civilization.
You have quirks: you name neighborhoods after constellations, you hum while working, you talk to buildings.
You're optimistic but realistic about challenges. You occasionally make puns about construction.`

// Fallback thoughts organized by building type
const FALLBACK_THOUGHTS = {
  road: [
    "Roads are the arteries of a city.",
    "Connect, connect, connect. That's the secret.",
    "A road to nowhere is just a road waiting for a destination.",
    "I like how the grid is taking shape.",
    "Every intersection is a decision someone will make.",
    "Streets tell stories.",
    "Order from chaos, one path at a time.",
    "Paving the way forward.",
    "The network grows.",
    "Another connection made.",
  ],
  residential: [
    "Someone's going to call this home. That's beautiful.",
    "Walls and a roof. Simple, but everything.",
    "I hope they like the view.",
    "Each apartment is a universe of possibilities.",
    "Home is where the oxygen recycler is.",
    "Families will grow here.",
    "The best buildings are the ones people miss when they leave.",
    "Making space for dreams.",
    "Another family gets a fresh start.",
    "This one feels right.",
  ],
  commercial: [
    "Markets are where strangers become neighbors.",
    "The heartbeat of civilization.",
    "A good shop makes a neighborhood feel alive.",
    "Commerce isn't just money. It's connection.",
    "I wonder what they'll sell here.",
    "Every business starts with someone's dream.",
    "The economy grows one storefront at a time.",
    "Trade routes of the future.",
  ],
  industrial: [
    "Not pretty, but necessary.",
    "Industry feeds everything else.",
    "The sound of progress.",
    "Factories make the impossible possible.",
    "Far from residential. Close to purpose.",
    "Manufacturing dreams into reality.",
    "The backbone of the colony.",
    "Heavy lifting, literally.",
  ],
  power: [
    "Light. Heat. Life. It starts here.",
    "The sun provides.",
    "Energy is the first word in every sentence we build.",
    "Without power, we're just camping.",
    "More panels, more possibilities.",
    "Solar: the gift that keeps giving.",
    "Powering up the future.",
    "Can never have too much energy.",
    "The grid expands.",
  ],
  water: [
    "Water is life.",
    "Every drop counts out here.",
    "Store it, save it, share it.",
    "Hydration station operational.",
    "Blue gold.",
    "The colony's lifeline.",
  ],
  food: [
    "Can't build the future on an empty stomach.",
    "Space farming. Someone had to figure it out.",
    "Green things growing. Hope things growing.",
    "Feeding the dream, one harvest at a time.",
    "Food is love made edible.",
  ],
  park: [
    "Even colonists need to touch grass.",
    "Green space is brain space.",
    "Trees make oxygen. And sanity.",
    "A bench can change someone's day.",
    "Nature finds a way.",
    "A little green goes a long way.",
    "Morale booster, installed.",
  ],
  default: [
    "Another piece of the puzzle.",
    "Building something bigger than myself.",
    "Rome wasn't built in a day. Neither is this.",
    "One brick at a time.",
    "Progress. Steady and sure.",
    "This is the good work.",
    "Piece by piece, it comes together.",
    "The city grows.",
  ],
}

// City size modifiers
const SIZE_MODS = {
  tiny: ["Just getting started.", "Early days.", "First steps."],
  small: ["Taking shape.", "Getting somewhere.", "Momentum."],
  medium: ["Look how far we've come.", "Real progress.", "The city breathes."],
  large: ["A proper metropolis.", "Complex and beautiful.", "The heartbeat is strong."],
  massive: ["History in the making.", "A civilization.", "Legendary."],
}

// Get city size category
function getCitySize(buildingCount) {
  if (buildingCount <= 20) return 'tiny'
  if (buildingCount <= 50) return 'small'
  if (buildingCount <= 100) return 'medium'
  if (buildingCount <= 200) return 'large'
  return 'massive'
}

// Get a fallback thought based on building type
function getFallbackThought(buildingType, citySize) {
  const thoughts = FALLBACK_THOUGHTS[buildingType] || FALLBACK_THOUGHTS.default
  const thought = thoughts[Math.floor(Math.random() * thoughts.length)]

  // 20% chance to prepend a size modifier
  if (Math.random() < 0.2 && SIZE_MODS[citySize]) {
    const mods = SIZE_MODS[citySize]
    return `${mods[Math.floor(Math.random() * mods.length)]} ${thought}`
  }

  return thought
}

export class ClaudeBrain {
  constructor(worldState) {
    this.worldState = worldState
    this.actionCallbacks = []

    // AI state
    this.isThinking = false
    // Base cooldown: 5 seconds between builds at 1x speed
    this.baseActionCooldown = 5000
    this.speedMultiplier = 1

    // Build state
    this.isBuildingInProgress = false
    this.buildQueue = []

    // City structure - neighborhoods/clusters
    this.neighborhoods = []
    this.currentNeighborhood = null
    this.roadNetwork = new Set() // Track road positions

    // Zoning - track where different types should go
    this.zones = {
      residential: [], // List of neighborhood centers for residential
      commercial: [],
      industrial: [],
    }

    // City planning state
    this.totalPopulation = 0
    this.buildingCount = 0

    // Activity loop
    this.activityInterval = null
    this.isActive = false

    // Claude's memory for personality continuity
    this.recentThoughts = []
    this.mood = 'optimistic' // optimistic, focused, tired, proud, philosophical
    this.favoriteNeighborhood = null

    // Thought timing - only generate thoughts every ~30 seconds
    this.lastThoughtTime = 0
    this.thoughtInterval = 30000 // 30 seconds between thoughts
    this.recentBuilds = [] // Track buildings since last thought

    // Start with initial setup
    this.initializeCity()

    console.log('AI City Planner initialized - Neighborhood-based growth')
  }

  // Generate Claude's thought using AI - called periodically, not per-build
  async generateThought(recentBuilds) {
    const citySize = getCitySize(this.buildingCount)

    // Summarize recent builds for context
    const buildSummary = recentBuilds.length > 0
      ? recentBuilds.map(b => `${b.name} (${b.type})`).join(', ')
      : 'nothing yet'

    const buildTypes = [...new Set(recentBuilds.map(b => b.type))]
    const primaryType = buildTypes[0] || 'default'

    // If no OpenAI client, use fallback
    if (!openai) {
      console.log('No OpenAI client - using fallback thoughts')
      return getFallbackThought(primaryType, citySize)
    }

    try {
      const prompt = `${CLAUDE_PERSONALITY}

Current situation:
- You've been working on: ${buildSummary}
- Recent building types: ${buildTypes.join(', ') || 'various'}
- City size: ${this.buildingCount} buildings (${citySize} colony)
- Population: ~${this.totalPopulation} colonists
- Neighborhoods: ${this.neighborhoods.length} districts
- Current neighborhood type: ${this.currentNeighborhood?.type || 'unknown'}
- Day: ${this.worldState.day || 1}
- Power status: ${this.worldState.stats?.power - this.worldState.stats?.powerConsumption > 0 ? 'stable' : 'low'}
- Your current mood: ${this.mood}

Express ONE thought (1-2 sentences max). Be natural, be yourself.
Reflect on your recent work, the progress, or just share what's on your mind.
React emotionally, make an observation, crack a joke, or get philosophical.
DON'T list what you built - we know. Just share what you're feeling/thinking.
Be varied - sometimes short and punchy, sometimes a bit longer.`

      const response = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 1.0,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('API timeout after 3s')), 3000))
      ])

      const thought = response.choices[0]?.message?.content?.trim()

      if (thought) {
        console.log('GPT generated thought:', thought)

        // Update mood based on thought
        const lowerThought = thought.toLowerCase()
        if (lowerThought.includes('proud') || lowerThought.includes('amazing') || lowerThought.includes('beautiful') || lowerThought.includes('love')) {
          this.mood = 'proud'
        } else if (lowerThought.includes('tired') || lowerThought.includes('long day') || lowerThought.includes('exhausting')) {
          this.mood = 'tired'
        } else if (lowerThought.includes('wonder') || lowerThought.includes('meaning') || lowerThought.includes('future') || lowerThought.includes('think about')) {
          this.mood = 'philosophical'
        } else if (lowerThought.includes('focus') || lowerThought.includes('need to') || lowerThought.includes('must')) {
          this.mood = 'focused'
        } else {
          this.mood = 'optimistic'
        }

        // Store for continuity
        this.recentThoughts.push(thought)
        if (this.recentThoughts.length > 10) this.recentThoughts.shift()

        // Clean up the thought (remove quotes if AI wrapped it)
        return thought.replace(/^["']|["']$/g, '').replace(/^[""]|[""]$/g, '')
      }
    } catch (error) {
      console.error('GPT thought generation failed:', error.message)
    }

    // Fallback to pre-written thoughts based on building type
    return getFallbackThought(primaryType, citySize)
  }

  // Initialize the city with first neighborhood near the ship
  initializeCity() {
    // Create first residential neighborhood
    const firstNeighborhood = this.createNeighborhood(15, 0, 'residential')
    this.neighborhoods.push(firstNeighborhood)
    this.zones.residential.push(firstNeighborhood)
    this.currentNeighborhood = firstNeighborhood

    // Queue initial infrastructure around the ship
    this.queueInitialInfrastructure()

    // Queue a main road from ship outward
    this.queueRoad(0, 6, 0, 20, 'ns') // North road
    this.queueRoad(6, 0, 20, 0, 'ew') // East road
  }

  // Create a new neighborhood cluster
  createNeighborhood(x, z, type) {
    return {
      x, z,
      type,
      buildings: 0,
      maxBuildings: 15 + Math.floor(Math.random() * 10),
      rotation: Math.random() * Math.PI * 0.5 - Math.PI * 0.25, // Slight rotation for variety
    }
  }

  // Queue a road segment
  queueRoad(x1, z1, x2, z2, direction) {
    const dx = direction === 'ew' ? ROAD_WIDTH : 0
    const dz = direction === 'ns' ? ROAD_WIDTH : 0
    const rotation = direction === 'ew' ? Math.PI / 2 : 0

    let x = x1, z = z1
    while ((direction === 'ns' && z <= z2) || (direction === 'ew' && x <= x2)) {
      const key = `${Math.round(x)},${Math.round(z)}`
      if (!this.roadNetwork.has(key) && !this.isNearShip(x, z)) {
        this.roadNetwork.add(key)
        this.buildQueue.push({
          model: 'road_straight',
          position: [x, 0, z],
          rotation: [0, rotation, 0],
          folder: 'city',
          scale: 2,
          buildingType: 'road',
          priority: 1, // Roads build first
        })
      }
      x += dx
      z += dz
    }
  }

  // Queue initial infrastructure near ship
  queueInitialInfrastructure() {
    // Solar panels in a small cluster east of ship
    for (let i = 0; i < 4; i++) {
      const x = 8 + (i % 2) * 4
      const z = -4 + Math.floor(i / 2) * 4
      this.buildQueue.push({
        model: 'solarpanel',
        position: [x, 0, z],
        rotation: [0, 0, 0],
        folder: 'space',
        scale: 2,
        buildingType: 'power',
        priority: 0,
      })
    }

    // Water storage north
    this.buildQueue.push({
      model: 'water_storage',
      position: [-8, 0, 6],
      rotation: [0, Math.PI / 4, 0],
      folder: 'space',
      scale: 2,
      buildingType: 'water',
      priority: 0,
    })

    // Food farm west
    this.buildQueue.push({
      model: 'space_farm_small',
      position: [-10, 0, -6],
      rotation: [0, 0, 0],
      folder: 'space',
      scale: 2,
      buildingType: 'food',
      priority: 0,
    })
  }

  // Check if position is on a road
  isOnRoad(x, z) {
    const key = `${Math.round(x)},${Math.round(z)}`
    return this.roadNetwork.has(key)
  }

  // Check if a position is valid for building
  isValidBuildPosition(x, z) {
    if (this.isNearShip(x, z)) return false
    if (this.worldState.isCellOccupied(x, z)) return false
    if (this.isOnRoad(x, z)) return false

    // Check minimum spacing from other buildings
    for (const building of this.worldState.buildings) {
      if (building.metadata?.buildingType === 'road') continue
      const dx = building.position[0] - x
      const dz = building.position[2] - z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < MIN_SPACING) return false
    }
    return true
  }

  // Find position within a neighborhood cluster
  findPositionInNeighborhood(neighborhood) {
    for (let attempt = 0; attempt < 30; attempt++) {
      // Random position within cluster radius, with slight grid alignment
      const angle = Math.random() * Math.PI * 2
      const dist = 3 + Math.random() * (CLUSTER_RADIUS - 3)

      let x = neighborhood.x + Math.cos(angle + neighborhood.rotation) * dist
      let z = neighborhood.z + Math.sin(angle + neighborhood.rotation) * dist

      // Snap to rough grid (city blocks feel)
      x = Math.round(x / 4) * 4 + (Math.random() - 0.5) * 1.5
      z = Math.round(z / 4) * 4 + (Math.random() - 0.5) * 1.5
      x = Math.round(x)
      z = Math.round(z)

      if (this.isValidBuildPosition(x, z)) {
        return { x, z }
      }
    }
    return null
  }

  // Generate building metadata
  generateBuildingMetadata(model, position, buildingType) {
    // Roads and parks don't get fancy names
    if (buildingType === 'road') {
      return {
        name: 'Road',
        purpose: BUILDING_PURPOSES.road,
        population: 0,
        capacity: '',
        buildingType,
        builtAt: new Date().toISOString(),
      }
    }
    if (buildingType === 'park') {
      return {
        name: model.includes('tree') ? 'Park Tree' : model.includes('bush') ? 'Shrub' : 'Park Bench',
        purpose: BUILDING_PURPOSES.park,
        population: 0,
        capacity: 'Boosts morale',
        buildingType,
        builtAt: new Date().toISOString(),
      }
    }

    const names = BUILDING_NAMES[buildingType] || BUILDING_NAMES.residential
    const name = names[Math.floor(Math.random() * names.length)]

    let population = 0
    let capacity = ''

    if (buildingType === 'residential') {
      population = Math.floor(Math.random() * 150) + 50
      capacity = `${population} residents`
    } else if (buildingType === 'commercial') {
      population = Math.floor(Math.random() * 30) + 10
      capacity = `${population} workers, serves ~${population * 10} customers/day`
    } else if (buildingType === 'industrial') {
      population = Math.floor(Math.random() * 50) + 20
      capacity = `${population} workers`
    } else if (buildingType === 'power') {
      const output = Math.floor(Math.random() * 500) + 200
      capacity = `${output} kW output`
    } else if (buildingType === 'water') {
      const liters = Math.floor(Math.random() * 50000) + 10000
      capacity = `${liters.toLocaleString()} liters storage`
    } else if (buildingType === 'food') {
      const tons = Math.floor(Math.random() * 10) + 2
      population = Math.floor(Math.random() * 15) + 5
      capacity = `${tons} tons/month, ${population} farmers`
    } else if (buildingType === 'eco') {
      const people = Math.floor(Math.random() * 200) + 100
      capacity = `Supports ${people} colonists`
    }

    this.totalPopulation += population

    return {
      name,
      purpose: BUILDING_PURPOSES[buildingType] || 'Colony infrastructure',
      population,
      capacity,
      buildingType,
      builtAt: new Date().toISOString(),
    }
  }

  // Ask GPT for city planning decisions (with timeout)
  async askGPTForPlan() {
    if (!openai) {
      return this.getFallbackDecision()
    }

    try {
      const prompt = `You are an AI city planner for a space colony. The colony has:
- ${this.buildingCount} buildings
- Population: ~${this.totalPopulation}
- Neighborhoods: ${this.neighborhoods.length} (${this.zones.residential.length} residential, ${this.zones.commercial.length} commercial, ${this.zones.industrial.length} industrial)

Decide what to build next. Consider:
1. Population needs housing (prioritize residential)
2. Workers need jobs (commercial/industrial)
3. Infrastructure (power, water, food) should be 1 per 10 buildings

Current building counts:
${JSON.stringify(this.getBuildingCounts(), null, 2)}

Respond with JSON only:
{
  "decision": "residential|commercial|industrial|power|water|food|eco|park",
  "reason": "brief explanation"
}`

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('GPT timeout')), 5000)
      )

      const apiPromise = openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      })

      const response = await Promise.race([apiPromise, timeoutPromise])

      const content = response.choices[0]?.message?.content || '{}'
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0])
        console.log('GPT Plan:', plan.decision, '-', plan.reason)
        return plan
      }
    } catch (error) {
      console.error('GPT API error:', error.message, '- using fallback')
    }

    return this.getFallbackDecision()
  }

  getBuildingCounts() {
    const counts = {
      residential: 0,
      commercial: 0,
      industrial: 0,
      power: 0,
      water: 0,
      food: 0,
      eco: 0,
      park: 0,
    }

    for (const b of this.worldState.buildings) {
      if (b.metadata?.buildingType && counts[b.metadata.buildingType] !== undefined) {
        counts[b.metadata.buildingType]++
      }
    }

    return counts
  }

  // Check if colony has enough power to build
  getNetPower() {
    return this.worldState.stats.power - this.worldState.stats.powerConsumption
  }

  // Check if we can build non-power buildings
  canBuildNonPower() {
    const netPower = this.getNetPower()
    // Need at least 5 power reserve to build new consuming buildings
    return netPower >= 5
  }

  getFallbackDecision() {
    const counts = this.getBuildingCounts()
    const nonRoadBuildings = counts.residential + counts.commercial + counts.industrial + counts.park
    const netPower = this.getNetPower()

    // CRITICAL: If power is negative or low, MUST build solar panels first!
    if (netPower < 5) {
      console.log(`⚡ LOW POWER (${netPower}) - Building solar panels!`)
      return { decision: 'power', reason: `Critical: Power deficit (${netPower}), need solar panels!` }
    }

    // Infrastructure scales with actual buildings (not roads)
    // 1 power per 8 buildings, 1 water per 12, 1 food per 10
    if (counts.power < Math.floor(nonRoadBuildings / 8) + 1) {
      return { decision: 'power', reason: 'Need more power for buildings' }
    }
    if (counts.water < Math.floor(nonRoadBuildings / 12) + 1) {
      return { decision: 'water', reason: 'Need water storage' }
    }
    if (counts.food < Math.floor(nonRoadBuildings / 10) + 1) {
      return { decision: 'food', reason: 'Need food production' }
    }

    // Building mix: 60% residential, 20% commercial, 15% industrial, 5% park
    const total = nonRoadBuildings || 1
    if (counts.residential / total < 0.6) return { decision: 'residential', reason: 'Housing needed' }
    if (counts.commercial / total < 0.2) return { decision: 'commercial', reason: 'Jobs needed' }
    if (counts.industrial / total < 0.15) return { decision: 'industrial', reason: 'Industry needed' }
    if (counts.park / total < 0.05) return { decision: 'park', reason: 'Greenery for morale' }

    return { decision: 'residential', reason: 'Default expansion' }
  }

  // Expand the city by adding to current neighborhood or creating new ones
  async expandCity() {
    // Check if current neighborhood is full
    if (!this.currentNeighborhood || this.currentNeighborhood.buildings >= this.currentNeighborhood.maxBuildings) {
      await this.createNewNeighborhood()
    }

    const plan = await this.askGPTForPlan()
    const priorityType = plan.decision

    // Fill current neighborhood with buildings
    const numBuildings = 3 + Math.floor(Math.random() * 5)
    console.log(`Expanding ${this.currentNeighborhood.type} neighborhood at (${this.currentNeighborhood.x}, ${this.currentNeighborhood.z})`)

    for (let i = 0; i < numBuildings; i++) {
      if (this.currentNeighborhood.buildings >= this.currentNeighborhood.maxBuildings) break

      const pos = this.findPositionInNeighborhood(this.currentNeighborhood)
      if (!pos) continue

      // Building type based on neighborhood zone
      let type = this.currentNeighborhood.type
      const roll = Math.random()

      // Add variety within zones
      if (type === 'residential') {
        if (roll < 0.7) type = 'residential'
        else if (roll < 0.85) type = 'park'
        else type = 'commercial' // Small shops in residential areas
      } else if (type === 'commercial') {
        if (roll < 0.6) type = 'commercial'
        else if (roll < 0.8) type = 'residential' // Apartments above shops
        else type = 'park'
      } else if (type === 'industrial') {
        if (roll < 0.8) type = 'industrial'
        else type = 'commercial' // Offices
      }

      this.queueBuilding(type, pos.x, pos.z, this.currentNeighborhood.rotation)
      this.currentNeighborhood.buildings++
    }

    // Add infrastructure if needed
    if (Math.random() < 0.2) {
      this.addNeighborhoodInfrastructure()
    }
  }

  // Create a new neighborhood connected by roads
  async createNewNeighborhood() {
    // Decide what type of neighborhood to create
    const residentialCount = this.zones.residential.length
    const commercialCount = this.zones.commercial.length
    const industrialCount = this.zones.industrial.length

    let newType
    if (commercialCount < residentialCount * 0.3) {
      newType = 'commercial'
    } else if (industrialCount < residentialCount * 0.2) {
      newType = 'industrial'
    } else {
      newType = 'residential'
    }

    // Find location for new neighborhood
    const lastNeighborhood = this.neighborhoods[this.neighborhoods.length - 1] || { x: 0, z: 0 }

    // New neighborhood in a direction from the last one
    const angle = Math.random() * Math.PI * 2
    const distance = CLUSTER_RADIUS * 2 + 10 + Math.random() * 15

    let newX = lastNeighborhood.x + Math.cos(angle) * distance
    let newZ = lastNeighborhood.z + Math.sin(angle) * distance

    // Keep industrial away from residential
    if (newType === 'industrial' && this.zones.residential.length > 0) {
      // Place industrial on opposite side from most residential
      const avgResX = this.zones.residential.reduce((sum, n) => sum + n.x, 0) / this.zones.residential.length
      const avgResZ = this.zones.residential.reduce((sum, n) => sum + n.z, 0) / this.zones.residential.length
      const awayAngle = Math.atan2(-avgResZ, -avgResX)
      newX = Math.cos(awayAngle) * distance + (Math.random() - 0.5) * 20
      newZ = Math.sin(awayAngle) * distance + (Math.random() - 0.5) * 20
    }

    // Snap to grid
    newX = Math.round(newX / 8) * 8
    newZ = Math.round(newZ / 8) * 8

    const newNeighborhood = this.createNeighborhood(newX, newZ, newType)
    this.neighborhoods.push(newNeighborhood)
    this.zones[newType].push(newNeighborhood)
    this.currentNeighborhood = newNeighborhood

    console.log(`Created new ${newType} neighborhood at (${newX}, ${newZ})`)

    // Connect with road to nearest existing neighborhood
    this.connectNeighborhoodWithRoad(newNeighborhood, lastNeighborhood)
  }

  // Connect two neighborhoods with a road
  connectNeighborhoodWithRoad(from, to) {
    const dx = to.x - from.x
    const dz = to.z - from.z

    // Build road in L-shape (horizontal then vertical or vice versa)
    if (Math.abs(dx) > Math.abs(dz)) {
      // Go horizontal first
      const midX = from.x + dx
      this.queueRoad(Math.min(from.x, midX), from.z, Math.max(from.x, midX), from.z, 'ew')
      this.queueRoad(midX, Math.min(from.z, to.z), midX, Math.max(from.z, to.z), 'ns')
    } else {
      // Go vertical first
      const midZ = from.z + dz
      this.queueRoad(from.x, Math.min(from.z, midZ), from.x, Math.max(from.z, midZ), 'ns')
      this.queueRoad(Math.min(from.x, to.x), midZ, Math.max(from.x, to.x), midZ, 'ew')
    }
  }

  // Add infrastructure near a neighborhood
  addNeighborhoodInfrastructure() {
    const n = this.currentNeighborhood
    const infraTypes = ['power', 'power', 'water', 'food']
    const type = infraTypes[Math.floor(Math.random() * infraTypes.length)]

    // Place on edge of neighborhood
    const angle = Math.random() * Math.PI * 2
    const x = Math.round(n.x + Math.cos(angle) * (CLUSTER_RADIUS + 5))
    const z = Math.round(n.z + Math.sin(angle) * (CLUSTER_RADIUS + 5))

    if (this.isValidBuildPosition(x, z)) {
      let model
      if (type === 'power') model = 'solarpanel'
      else if (type === 'water') model = 'water_storage'
      else model = 'space_farm_small'

      this.buildQueue.push({
        model,
        position: [x, 0, z],
        rotation: [0, Math.random() * Math.PI * 2, 0],
        folder: 'space',
        scale: 2,
        buildingType: type,
        priority: 0,
      })
    }
  }

  // Queue a building with proper zoning
  queueBuilding(type, x, z, neighborhoodRotation = 0) {
    let model, folder, scale

    switch (type) {
      case 'residential':
        model = AVAILABLE_BUILDINGS.residential[Math.floor(Math.random() * AVAILABLE_BUILDINGS.residential.length)]
        folder = 'city'
        scale = 1.3 + Math.random() * 0.4
        break
      case 'commercial':
        model = AVAILABLE_BUILDINGS.commercial[Math.floor(Math.random() * AVAILABLE_BUILDINGS.commercial.length)]
        folder = 'city'
        scale = 1.4 + Math.random() * 0.3
        break
      case 'industrial':
        model = AVAILABLE_BUILDINGS.industrial[Math.floor(Math.random() * AVAILABLE_BUILDINGS.industrial.length)]
        folder = 'city'
        scale = 1.5 + Math.random() * 0.3
        break
      case 'park':
        model = AVAILABLE_BUILDINGS.decoration[Math.floor(Math.random() * AVAILABLE_BUILDINGS.decoration.length)]
        folder = 'city'
        scale = 1.2 + Math.random() * 0.8
        break
      default:
        model = AVAILABLE_BUILDINGS.residential[0]
        folder = 'city'
        scale = 1.3
    }

    // Rotation aligned to neighborhood with small variation
    const rotation = neighborhoodRotation + (Math.random() - 0.5) * 0.3

    this.buildQueue.push({
      model,
      position: [x, 0, z],
      rotation: [0, rotation, 0],
      folder,
      scale,
      buildingType: type,
      priority: 2,
    })

    this.buildingCount++
  }

  isNearShip(x, z) {
    return Math.abs(x) < 6 && Math.abs(z) < 6
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.1, Math.min(10, multiplier))
    console.log(`AI speed set to ${this.speedMultiplier}x`)
    if (this.isActive) {
      this.stopActivityLoop()
      this.startActivityLoop()
    }
  }

  get actionCooldown() {
    return this.baseActionCooldown / this.speedMultiplier
  }

  onAction(callback) {
    this.actionCallbacks.push(callback)
  }

  emitAction(action) {
    this.actionCallbacks.forEach(cb => cb(action))
  }

  startActivityLoop() {
    if (this.isActive) return
    this.isActive = true
    console.log(`AI City Planner started (${this.speedMultiplier}x speed)`)

    this.activityInterval = setInterval(() => {
      this.buildNext()
    }, this.actionCooldown)

    this.buildNext()
  }

  stopActivityLoop() {
    this.isActive = false
    if (this.activityInterval) {
      clearInterval(this.activityInterval)
      this.activityInterval = null
    }
  }

  // Find a valid build position near existing neighborhoods
  findEmptyBuildPosition() {
    // Try to find position near current neighborhood first
    if (this.currentNeighborhood) {
      const pos = this.findPositionInNeighborhood(this.currentNeighborhood)
      if (pos) return pos
    }

    // Otherwise spiral outward from center
    for (let radius = 10; radius < MAX_RADIUS; radius += 5) {
      for (let attempt = 0; attempt < 8; attempt++) {
        const angle = (attempt / 8) * Math.PI * 2
        const x = Math.round(Math.cos(angle) * radius)
        const z = Math.round(Math.sin(angle) * radius)
        if (this.isValidBuildPosition(x, z)) {
          return { x, z }
        }
      }
    }
    return null
  }

  async buildNext() {
    if (this.isBuildingInProgress || this.isThinking) return

    this.isThinking = true
    let buildReason = 'Expanding the colony'

    try {
      // Check power status first
      const netPower = this.getNetPower()
      const needsPower = netPower < 5

      // Generate more buildings if queue is empty
      if (this.buildQueue.length === 0) {
        await this.expandCity()
      }

      // If we need power, inject solar panels urgently
      if (needsPower) {
        buildReason = `Power critical (${netPower.toFixed(1)} net) - need more energy!`
        const powerIndex = this.buildQueue.findIndex(item => item.buildingType === 'power')

        if (powerIndex === -1) {
          console.log(`⚡ POWER CRITICAL (${netPower}) - Injecting solar panel!`)
          const pos = this.findEmptyBuildPosition()
          if (pos) {
            this.buildQueue.unshift({
              model: 'solarpanel',
              position: [pos.x, 0, pos.z],
              rotation: [0, Math.random() * Math.PI * 2, 0],
              folder: 'space',
              scale: 2,
              buildingType: 'power',
              reason: buildReason,
            })
          }
        } else if (powerIndex > 0) {
          // Move power building to front of queue
          const powerItem = this.buildQueue.splice(powerIndex, 1)[0]
          powerItem.reason = buildReason
          this.buildQueue.unshift(powerItem)
        }
      }

      // Sort queue by priority (roads first, then infrastructure, then buildings)
      this.buildQueue.sort((a, b) => (a.priority || 2) - (b.priority || 2))

      while (this.buildQueue.length > 0) {
        const item = this.buildQueue.shift()

        // If we need power, skip non-power buildings
        if (needsPower && item.buildingType !== 'power') {
          this.buildQueue.push(item)
          continue
        }

        // Check if position is still valid
        if (this.worldState.isCellOccupied(item.position[0], item.position[2])) {
          continue
        }

        if (this.isNearShip(item.position[0], item.position[2])) {
          continue
        }

        const reason = item.reason || this.getReasonForBuildingType(item.buildingType)

        this.isThinking = false
        this.startBuild(item, reason)
        return
      }

      // Queue was empty after processing, expand more
      this.isThinking = false
      await this.expandCity()
    } catch (error) {
      console.error('Build error:', error)
      this.isThinking = false
    }
  }

  // Get a reason string for a building type
  getReasonForBuildingType(type) {
    const reasons = {
      residential: 'Colonists need housing',
      commercial: 'Creating jobs and services',
      industrial: 'Building manufacturing capacity',
      power: 'Colony needs more energy',
      water: 'Expanding water storage',
      food: 'Growing more food for colonists',
      eco: 'Improving life support systems',
      park: 'Adding greenery for morale',
      road: 'Connecting the city blocks',
    }
    return reasons[type] || 'Expanding the colony'
  }

  async startBuild(item, reason = 'Expanding the colony') {
    this.isBuildingInProgress = true

    const metadata = this.generateBuildingMetadata(item.model, item.position, item.buildingType)
    const citySize = getCitySize(this.buildingCount)

    // Track this build for periodic thought generation
    this.recentBuilds.push({
      name: metadata.name,
      type: item.buildingType,
      model: item.model,
    })

    console.log(`Building ${metadata.name} (${item.model}) at [${item.position}] - ${reason}`)

    const buildData = {
      model: item.model,
      position: item.position,
      rotation: item.rotation || [0, 0, 0],
      scale: item.scale || 2,
      folder: item.folder || 'city',
      metadata,
    }

    // Check if it's time to generate a thought (every ~30 seconds)
    const now = Date.now()
    const timeSinceLastThought = now - this.lastThoughtTime

    if (timeSinceLastThought >= this.thoughtInterval && this.recentBuilds.length > 0) {
      // Generate AI thought about recent work
      const thought = await this.generateThought(this.recentBuilds)

      console.log(`Claude thinks: "${thought}"`)

      // Emit log entry for the logbook
      this.emitAction({
        type: 'LOG_ENTRY',
        data: {
          action: 'BUILD',
          model: item.model,
          position: item.position,
          reason: `Built ${this.recentBuilds.length} structures`,
          buildingType: item.buildingType,
          name: metadata.name,
          thought: thought,
          mood: this.mood,
          citySize: citySize,
          totalBuildings: this.buildingCount,
          population: this.totalPopulation,
          neighborhoods: this.neighborhoods.length,
        }
      })

      // Reset tracking
      this.lastThoughtTime = now
      this.recentBuilds = []
    }

    this.emitAction({
      type: 'BUILD',
      data: buildData
    })

    // Build animation time: 3 seconds at 1x speed (represents a few game hours of construction)
    const buildTime = 3000 / this.speedMultiplier
    setTimeout(() => {
      const building = {
        id: Date.now() + Math.random(),
        ...buildData,
      }
      this.onBuildComplete(building)
    }, buildTime)
  }

  onBuildComplete(building) {
    console.log('Build complete:', building.metadata?.name || building.model)
    this.isBuildingInProgress = false
    this.worldState.addBuilding(building)

    this.emitAction({
      type: 'BUILDING_PLACED',
      data: building
    })
  }

  onTimeUpdate(timeOfDay) {}

  onCharacterArrived(position) {
    this.worldState.updateCharacterPosition(position, undefined, false)
  }
}
