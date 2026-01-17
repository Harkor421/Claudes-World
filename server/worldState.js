// World State - tracks everything in the game world

export class WorldState {
  constructor() {
    this.buildings = []
    this.timeOfDay = 12
    this.day = 1
    this.weather = 'clear'

    // Character state (Claude's position and movement)
    this.characterPosition = [0, 0, 0]
    this.characterRotation = 0
    this.characterTargetPosition = null
    this.isMoving = false

    // Claude's stats
    this.mood = 80
    this.energy = 100

    // City statistics (for AI to optimize)
    this.stats = {
      population: 0,
      power: 0,
      powerConsumption: 0,
      water: 0,
      waterConsumption: 0,
      food: 0,
      foodConsumption: 0,
      morale: 50,
    }

    // Zone tracking for organized city building
    this.zones = {
      residential: [],
      industrial: [],
      power: [],
      agriculture: [],
      storage: [],
    }

    // Grid occupancy map (which cells are taken)
    this.occupiedCells = new Set()

    // History for AI memory
    this.history = []
    this.totalBuildingsEverBuilt = 0

    // Action queue for Claude's activities
    this.actionQueue = []
    this.currentAction = null
  }

  getState() {
    return {
      buildings: this.buildings,
      timeOfDay: this.timeOfDay,
      day: this.day,
      weather: this.weather,
      stats: this.stats,
      // Don't send zones and occupiedCells - they're huge and can be rebuilt
      totalBuildings: this.buildings.length,
      // Character state
      characterPosition: this.characterPosition,
      characterRotation: this.characterRotation,
      characterTargetPosition: this.characterTargetPosition,
      isMoving: this.isMoving,
      mood: this.mood,
      energy: this.energy,
    }
  }

  syncFromClient(clientState) {
    if (clientState.placedBuildings) {
      this.buildings = clientState.placedBuildings
      this.rebuildOccupancyMap()
    }
    // Time is now managed by the server - don't sync from client
    if (clientState.weather) {
      this.weather = clientState.weather
    }
  }

  // Update character position from client
  updateCharacterPosition(position, rotation, isMoving) {
    this.characterPosition = position
    if (rotation !== undefined) this.characterRotation = rotation
    if (isMoving !== undefined) this.isMoving = isMoving
  }

  // Set character target position
  setCharacterTarget(targetPosition) {
    this.characterTargetPosition = targetPosition
  }

  // Update Claude's stats
  updateStats(mood, energy) {
    if (mood !== undefined) this.mood = Math.max(0, Math.min(100, mood))
    if (energy !== undefined) this.energy = Math.max(0, Math.min(100, energy))
  }

  // Add action to queue
  queueAction(action) {
    this.actionQueue.push(action)
  }

  // Get next action from queue
  getNextAction() {
    if (this.actionQueue.length > 0) {
      this.currentAction = this.actionQueue.shift()
      return this.currentAction
    }
    return null
  }

  // Complete current action
  completeCurrentAction() {
    this.currentAction = null
  }

  setTime(time) {
    const previousTime = this.timeOfDay
    this.timeOfDay = time

    // New day detection - when time wraps from high to low
    if (previousTime > 20 && time < 4) {
      this.day++
      console.log(`Day ${this.day} begins!`)
      this.calculateDailyStats()
    }
  }

  addBuilding(building) {
    this.buildings.push(building)
    this.totalBuildingsEverBuilt++

    // Mark cells as occupied
    const cellKey = `${Math.round(building.position[0])},${Math.round(building.position[2])}`
    this.occupiedCells.add(cellKey)

    // Categorize building into zones
    this.categorizeBuilding(building)

    // Update stats based on building type
    this.updateStatsForBuilding(building)

    // Add to history
    this.history.push({
      type: 'BUILD',
      building: building.model,
      position: building.position,
      day: this.day,
      time: this.timeOfDay,
    })
  }

  removeBuilding(buildingId) {
    const index = this.buildings.findIndex(b => b.id === buildingId)
    if (index !== -1) {
      const building = this.buildings[index]
      const cellKey = `${Math.round(building.position[0])},${Math.round(building.position[2])}`
      this.occupiedCells.delete(cellKey)
      this.buildings.splice(index, 1)
    }
  }

  rebuildOccupancyMap() {
    this.occupiedCells.clear()
    this.buildings.forEach(building => {
      const cellKey = `${Math.round(building.position[0])},${Math.round(building.position[2])}`
      this.occupiedCells.add(cellKey)
    })
  }

  isCellOccupied(x, z) {
    const cellKey = `${Math.round(x)},${Math.round(z)}`
    return this.occupiedCells.has(cellKey)
  }

  findEmptyCell(nearX = 0, nearZ = 0, maxRadius = 50) {
    // Spiral outward from the given position to find empty cell
    for (let radius = 2; radius <= maxRadius; radius += 2) {
      for (let dx = -radius; dx <= radius; dx += 2) {
        for (let dz = -radius; dz <= radius; dz += 2) {
          const x = nearX + dx
          const z = nearZ + dz
          if (!this.isCellOccupied(x, z)) {
            return { x, z }
          }
        }
      }
    }
    return null
  }

  categorizeBuilding(building) {
    const model = building.model.toLowerCase()

    if (model.includes('basemodule') || model.includes('dome')) {
      this.zones.residential.push(building.id)
    } else if (model.includes('drill') || model.includes('cargo') || model.includes('container')) {
      this.zones.industrial.push(building.id)
    } else if (model.includes('solar') || model.includes('power')) {
      this.zones.power.push(building.id)
    } else if (model.includes('farm') || model.includes('eco')) {
      this.zones.agriculture.push(building.id)
    } else if (model.includes('depot') || model.includes('storage')) {
      this.zones.storage.push(building.id)
    }
  }

  updateStatsForBuilding(building) {
    const model = building.model.toLowerCase()
    const buildingType = building.metadata?.buildingType

    // Power generation
    if (model.includes('solar')) {
      this.stats.power += 10
    }

    // Housing/population - space buildings
    if (model.includes('basemodule')) {
      this.stats.population += 5
      this.stats.powerConsumption += 2
      this.stats.waterConsumption += 3
      this.stats.foodConsumption += 2
    } else if (model.includes('dome')) {
      this.stats.population += 10
      this.stats.powerConsumption += 5
      this.stats.waterConsumption += 5
      this.stats.foodConsumption += 4
    }

    // City buildings consume power based on type
    if (model.includes('building_')) {
      if (buildingType === 'residential') {
        this.stats.population += 50
        this.stats.powerConsumption += 3
        this.stats.waterConsumption += 4
        this.stats.foodConsumption += 3
      } else if (buildingType === 'commercial') {
        this.stats.powerConsumption += 5
        this.stats.waterConsumption += 2
      } else if (buildingType === 'industrial') {
        this.stats.powerConsumption += 8
        this.stats.waterConsumption += 3
      }
    }

    // Water storage
    if (model.includes('water_storage')) {
      this.stats.water += 50
    }

    // Food production
    if (model.includes('farm')) {
      this.stats.food += 20
    } else if (model.includes('eco_module')) {
      this.stats.food += 10
      this.stats.water += 5
    }
  }

  calculateDailyStats() {
    // Net resources per day
    const netPower = this.stats.power - this.stats.powerConsumption
    const netWater = this.stats.water - this.stats.waterConsumption
    const netFood = this.stats.food - this.stats.foodConsumption

    // Morale affected by resource balance
    if (netPower >= 0 && netWater >= 0 && netFood >= 0) {
      this.stats.morale = Math.min(100, this.stats.morale + 5)
    } else {
      this.stats.morale = Math.max(0, this.stats.morale - 10)
    }

    return { netPower, netWater, netFood }
  }

  // Get summary for AI prompt
  getSummaryForAI() {
    const netStats = this.calculateDailyStats()

    return {
      day: this.day,
      totalBuildings: this.buildings.length,
      buildingsByType: this.getBuildingCounts(),
      stats: this.stats,
      netResources: netStats,
      recentBuildings: this.buildings.slice(-5).map(b => b.model),
      zones: {
        residential: this.zones.residential.length,
        industrial: this.zones.industrial.length,
        power: this.zones.power.length,
        agriculture: this.zones.agriculture.length,
        storage: this.zones.storage.length,
      }
    }
  }

  getBuildingCounts() {
    const counts = {}
    this.buildings.forEach(b => {
      counts[b.model] = (counts[b.model] || 0) + 1
    })
    return counts
  }
}
