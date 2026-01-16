import OpenAI from 'openai'

// Grid configuration
const GRID_SIZE = 4 // Each tile is 4x4 units
const BLOCK_SIZE = 24 // Larger blocks = more buildings per block

// Initialize OpenAI client (only if API key exists)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

// Available models for building
const AVAILABLE_BUILDINGS = {
  residential: ['building_A', 'building_B', 'building_C', 'building_D'],
  commercial: ['building_E', 'building_F'],
  industrial: ['building_G', 'building_H'],
  infrastructure: ['solarpanel', 'water_storage', 'eco_module', 'space_farm_small', 'space_farm_large'],
  decoration: ['tree_A', 'tree_B', 'tree_C', 'bench', 'bush_A', 'bush_B'],
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

export class ClaudeBrain {
  constructor(worldState) {
    this.worldState = worldState
    this.actionCallbacks = []

    // AI state
    this.isThinking = false
    // Base cooldown: 5 seconds between builds at 1x speed
    // This means ~12 buildings per minute at 1x, ~120 at 10x
    this.baseActionCooldown = 5000
    this.speedMultiplier = 1

    // Build state
    this.isBuildingInProgress = false
    this.currentRing = 0
    this.buildQueue = []

    // Track road positions to avoid building on them
    this.roadPositions = new Set()

    // City planning state
    this.totalPopulation = 0
    this.buildingCount = 0

    // Activity loop
    this.activityInterval = null
    this.isActive = false

    // Start with core infrastructure
    this.generateCoreInfrastructure()

    console.log('AI City Planner initialized')
  }

  // Check if position is on a road
  isOnRoad(x, z) {
    return this.roadPositions.has(`${x},${z}`)
  }

  // Mark position as road
  markAsRoad(x, z) {
    this.roadPositions.add(`${x},${z}`)
  }

  // Generate building metadata
  generateBuildingMetadata(model, position, buildingType) {
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
- Current expansion level: ${this.currentRing}

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

  // Core infrastructure around the crashed ship
  generateCoreInfrastructure() {
    // Small solar farm (east)
    for (let x = 8; x <= 12; x += 4) {
      for (let z = -4; z <= 4; z += 4) {
        this.buildQueue.push({
          model: 'solarpanel',
          position: [x, 0, z],
          rotation: [0, 0, 0],
          folder: 'space',
          scale: 2,
          buildingType: 'power',
        })
      }
    }

    // Water storage (north)
    this.buildQueue.push({
      model: 'water_storage',
      position: [0, 0, 10],
      rotation: [0, 0, 0],
      folder: 'space',
      scale: 2,
      buildingType: 'water',
    })

    // Food farm (west)
    this.buildQueue.push({
      model: 'space_farm_small',
      position: [-10, 0, 0],
      rotation: [0, 0, 0],
      folder: 'space',
      scale: 2,
      buildingType: 'food',
    })

    // Eco module (south)
    this.buildQueue.push({
      model: 'eco_module',
      position: [0, 0, -10],
      rotation: [0, 0, 0],
      folder: 'space',
      scale: 2,
      buildingType: 'eco',
    })

    console.log('Core infrastructure queued')
  }

  // Generate expansion - BUILDINGS FIRST, then minimal roads
  async generateExpansion() {
    this.currentRing++
    const offset = this.currentRing * BLOCK_SIZE

    console.log(`Expanding to ring ${this.currentRing}`)

    // Get AI decision for what types of buildings to prioritize
    const plan = await this.askGPTForPlan()

    // Generate LOTS of buildings in city blocks (not on roads)
    this.generateCityBlocks(offset, plan.decision)

    // Generate minimal road network (only main arteries)
    this.generateMinimalRoads(offset)
  }

  // Generate dense city blocks with buildings
  generateCityBlocks(offset, priorityType) {
    // Create 4 quadrants of dense building clusters
    const quadrants = [
      { xSign: 1, zSign: 1 },   // NE
      { xSign: -1, zSign: 1 },  // NW
      { xSign: 1, zSign: -1 },  // SE
      { xSign: -1, zSign: -1 }, // SW
    ]

    for (const quad of quadrants) {
      // Each quadrant gets a cluster of buildings
      const centerX = quad.xSign * (offset - BLOCK_SIZE / 2)
      const centerZ = quad.zSign * (offset - BLOCK_SIZE / 2)

      // Fill the block with buildings (avoid road positions)
      for (let dx = -8; dx <= 8; dx += 4) {
        for (let dz = -8; dz <= 8; dz += 4) {
          const x = centerX + dx
          const z = centerZ + dz

          // Skip if on a road, near ship, or occupied
          if (this.isOnRoad(x, z) || this.isNearShip(x, z)) continue

          // Determine building type with some randomness
          let type
          const roll = Math.random()
          if (roll < 0.5) {
            type = priorityType // 50% priority type
          } else if (roll < 0.75) {
            type = 'residential'
          } else if (roll < 0.9) {
            type = 'commercial'
          } else {
            type = Math.random() > 0.5 ? 'industrial' : 'park'
          }

          this.queueBuilding(type, x, z)
        }
      }
    }

    // Add some infrastructure based on how many buildings we're adding
    this.queueInfrastructureForRing(offset)
  }

  queueBuilding(type, x, z) {
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
        model = AVAILABLE_BUILDINGS.decoration[Math.floor(Math.random() * 3)]
        folder = 'city'
        scale = 1.5
        break
      default:
        model = AVAILABLE_BUILDINGS.residential[0]
        folder = 'city'
        scale = 1.3
    }

    this.buildQueue.push({
      model,
      position: [x, 0, z],
      rotation: [0, Math.floor(Math.random() * 4) * Math.PI / 2, 0],
      folder,
      scale,
      buildingType: type,
    })

    this.buildingCount++
  }

  queueInfrastructureForRing(offset) {
    // Add infrastructure clusters at specific spots (away from main roads)
    const infraSpots = [
      [offset - 4, offset - 4],      // NE corner
      [-offset + 4, offset - 4],     // NW corner
      [offset - 4, -offset + 4],     // SE corner
      [-offset + 4, -offset + 4],    // SW corner
    ]

    for (const [x, z] of infraSpots) {
      if (this.isOnRoad(x, z) || this.isNearShip(x, z)) continue

      // Randomly pick infrastructure type
      const infraTypes = ['power', 'power', 'water', 'food']
      const type = infraTypes[Math.floor(Math.random() * infraTypes.length)]

      let model
      if (type === 'power') model = 'solarpanel'
      else if (type === 'water') model = 'water_storage'
      else model = 'space_farm_small'

      this.buildQueue.push({
        model,
        position: [x, 0, z],
        rotation: [0, 0, 0],
        folder: 'space',
        scale: 2,
        buildingType: type,
      })
    }
  }

  // Generate only main roads (cross pattern, no ring roads)
  generateMinimalRoads(offset) {
    const prevOffset = (this.currentRing - 1) * BLOCK_SIZE
    const startPos = prevOffset > 0 ? prevOffset + GRID_SIZE : 12

    // Main east-west road (only along z=0)
    for (let x = startPos; x <= offset; x += GRID_SIZE) {
      this.markAsRoad(x, 0)
      this.markAsRoad(-x, 0)
      this.buildQueue.push({
        model: 'road_straight',
        position: [x, 0, 0],
        rotation: [0, Math.PI / 2, 0],
        folder: 'city',
        scale: 2,
        buildingType: 'road',
      })
      this.buildQueue.push({
        model: 'road_straight',
        position: [-x, 0, 0],
        rotation: [0, Math.PI / 2, 0],
        folder: 'city',
        scale: 2,
        buildingType: 'road',
      })
    }

    // Main north-south road (only along x=0)
    for (let z = startPos; z <= offset; z += GRID_SIZE) {
      this.markAsRoad(0, z)
      this.markAsRoad(0, -z)
      this.buildQueue.push({
        model: 'road_straight',
        position: [0, 0, z],
        rotation: [0, 0, 0],
        folder: 'city',
        scale: 2,
        buildingType: 'road',
      })
      this.buildQueue.push({
        model: 'road_straight',
        position: [0, 0, -z],
        rotation: [0, 0, 0],
        folder: 'city',
        scale: 2,
        buildingType: 'road',
      })
    }
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

  isOccupied(x, z) {
    if (this.isNearShip(x, z)) return true
    if (this.isOnRoad(x, z)) return true
    return this.worldState.isCellOccupied(x, z)
  }

  async buildNext() {
    if (this.isBuildingInProgress || this.isThinking) return

    this.isThinking = true

    try {
      // Check power status first
      const netPower = this.getNetPower()
      const needsPower = netPower < 5

      if (this.buildQueue.length === 0) {
        await this.generateExpansion()
      }

      // If we need power, filter queue to only power buildings OR inject solar panels
      if (needsPower) {
        // Find a power building in queue or add one
        const powerIndex = this.buildQueue.findIndex(item => item.buildingType === 'power')

        if (powerIndex === -1) {
          // No power building in queue - add solar panels at a valid position
          console.log(`⚡ POWER CRITICAL (${netPower}) - Injecting solar panel into build queue!`)
          const solarPosition = this.findValidPositionForSolar()
          if (solarPosition) {
            this.buildQueue.unshift({
              model: 'solarpanel',
              position: solarPosition,
              rotation: [0, 0, 0],
              folder: 'space',
              scale: 2,
              buildingType: 'power',
            })
          }
        } else if (powerIndex > 0) {
          // Move power building to front of queue
          const powerItem = this.buildQueue.splice(powerIndex, 1)[0]
          this.buildQueue.unshift(powerItem)
        }
      }

      while (this.buildQueue.length > 0) {
        const item = this.buildQueue.shift()

        // If we need power, skip non-power buildings (except roads)
        if (needsPower && item.buildingType !== 'power' && item.buildingType !== 'road') {
          // Put it back at the end - we'll build it once we have power
          this.buildQueue.push(item)
          continue
        }

        // For non-roads, check if position is on a road
        if (item.buildingType !== 'road' && this.isOnRoad(item.position[0], item.position[2])) {
          continue
        }

        if (this.worldState.isCellOccupied(item.position[0], item.position[2])) {
          continue
        }

        if (this.isNearShip(item.position[0], item.position[2])) {
          continue
        }

        this.isThinking = false
        this.startBuild(item)
        return
      }

      this.isThinking = false
      await this.generateExpansion()
    } catch (error) {
      console.error('Build error:', error)
      this.isThinking = false
    }
  }

  // Find a valid position for emergency solar panel
  findValidPositionForSolar() {
    // Try positions in expanding rings around existing buildings
    for (let ring = 1; ring <= 10; ring++) {
      const offset = ring * BLOCK_SIZE
      const positions = [
        [offset, 0, offset],
        [-offset, 0, offset],
        [offset, 0, -offset],
        [-offset, 0, -offset],
        [offset, 0, 0],
        [-offset, 0, 0],
        [0, 0, offset],
        [0, 0, -offset],
      ]

      for (const pos of positions) {
        const [x, , z] = pos
        if (!this.isOnRoad(x, z) && !this.worldState.isCellOccupied(x, z) && !this.isNearShip(x, z)) {
          return [x, 0, z]
        }
      }
    }

    // Fallback - find any empty cell
    const empty = this.worldState.findEmptyCell(0, 0, 100)
    if (empty) {
      return [empty.x, 0, empty.z]
    }

    return null
  }

  startBuild(item) {
    this.isBuildingInProgress = true

    const metadata = this.generateBuildingMetadata(item.model, item.position, item.buildingType)

    console.log(`Building ${metadata.name} (${item.model}) at [${item.position}]`)

    const buildData = {
      model: item.model,
      position: item.position,
      rotation: item.rotation || [0, 0, 0],
      scale: item.scale || 2,
      folder: item.folder || 'city',
      metadata,
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
