import { create } from 'zustand'

export const useGameStore = create((set, get) => ({
  // Character state
  characterPosition: [0, 0, 0],
  characterTargetPosition: null,
  characterRotation: 0,
  isMoving: false,

  // Movement keys pressed
  keysPressed: {
    forward: false,
    backward: false,
    left: false,
    right: false
  },

  // Weather and time system
  weather: 'clear', // 'clear', 'rain', 'snow'
  timeOfDay: 6, // 0-24 hours (start at dawn)
  autoTimeEnabled: true, // auto-advance time (enabled by default)
  day: 1, // Current day number
  buildingsToday: 0, // Buildings built today
  buildingsPerDay: [], // History: [{ day: 1, count: 5 }, ...]
  lastWeatherChangeHour: 6, // Hour when weather last changed

  // Claude's stats
  mood: 80, // 0-100 (happy to sad)
  energy: 100, // 0-100
  isSleeping: false, // true when Claude is sleeping at the ship

  // Admin mode - allows manual control of character
  adminMode: false,

  // AI speed multiplier for debugging
  aiSpeed: 1, // 1 = normal, 2 = 2x faster, etc.

  // AI status for display
  aiStatus: 'Idle',
  aiCurrentAction: null, // { type, reason, model }

  // Building system
  buildMenu: {
    isOpen: false,
    position: null, // world position where to build
    screenPosition: null, // screen position for menu
  },
  previewModel: null, // model currently being hovered in menu (for grid preview)
  currentBuildTask: null, // { model, position, progress, startTime }
  isBuilding: false,
  placedBuildings: [], // { id, model, position, rotation, scale }

  // Actions
  setCharacterPosition: (position) => set({ characterPosition: position }),
  setCharacterTargetPosition: (position) => set({ characterTargetPosition: position }),
  setCharacterRotation: (rotation) => set({ characterRotation: rotation }),
  setIsMoving: (moving) => set({ isMoving: moving }),

  setKeyPressed: (key, pressed) => set((state) => ({
    keysPressed: { ...state.keysPressed, [key]: pressed }
  })),

  clearTargetPosition: () => set({ characterTargetPosition: null }),

  // Build menu actions
  openBuildMenu: (worldPos, screenPos) => set({
    buildMenu: { isOpen: true, position: worldPos, screenPosition: screenPos }
  }),
  closeBuildMenu: () => set({
    buildMenu: { isOpen: false, position: null, screenPosition: null },
    previewModel: null
  }),
  setPreviewModel: (model) => set({ previewModel: model }),

  // Building actions
  startBuildTask: (model, position, folder = 'city', scale = 2) => set({
    currentBuildTask: { model, position, progress: 0, startTime: Date.now(), folder, scale },
    isBuilding: false, // will be true once character arrives
    characterTargetPosition: position,
  }),
  setIsBuilding: (building) => set({ isBuilding: building }),
  updateBuildProgress: (progress) => set((state) => ({
    currentBuildTask: state.currentBuildTask ? { ...state.currentBuildTask, progress } : null
  })),
  completeBuild: () => {
    const state = get()
    if (state.currentBuildTask) {
      const newBuilding = {
        id: Date.now(),
        model: state.currentBuildTask.model,
        position: state.currentBuildTask.position,
        rotation: [0, 0, 0],
        scale: state.currentBuildTask.scale || 2,
        folder: state.currentBuildTask.folder || 'city'
      }
      console.log('Build complete:', newBuilding.model, 'at', newBuilding.position, 'folder:', newBuilding.folder)
      set({
        placedBuildings: [...state.placedBuildings, newBuilding],
        currentBuildTask: null,
        isBuilding: false
      })
    }
  },
  cancelBuild: () => set({ currentBuildTask: null, isBuilding: false }),

  // Weather and time actions
  setWeather: (weather) => set({ weather }),
  setTimeOfDay: (time) => set({ timeOfDay: time % 24 }),
  setDay: (day) => set({ day }),
  toggleAutoTime: () => set((state) => ({ autoTimeEnabled: !state.autoTimeEnabled })),

  // Advance time with day tracking and weather changes
  advanceTime: (delta) => set((state) => {
    const newTime = state.timeOfDay + delta
    const newState = { timeOfDay: newTime % 24 }

    // Check for new day (crossing midnight)
    if (newTime >= 24) {
      const newDay = state.day + 1
      // Save today's building count to history
      const newHistory = [...state.buildingsPerDay, { day: state.day, count: state.buildingsToday }]
      newState.day = newDay
      newState.buildingsToday = 0
      newState.buildingsPerDay = newHistory
      console.log(`Day ${newDay} begins! Yesterday: ${state.buildingsToday} buildings`)
    }

    // Weather changes every ~6 game hours
    const currentHour = newTime % 24
    const hoursSinceWeatherChange = currentHour - state.lastWeatherChangeHour
    const normalizedHours = hoursSinceWeatherChange < 0 ? hoursSinceWeatherChange + 24 : hoursSinceWeatherChange

    // Only change weather after 6+ hours have passed
    if (normalizedHours >= 6) {
      // 70% clear, 15% rain, 15% snow - favoring nice weather
      const roll = Math.random()
      let newWeather
      if (roll < 0.70) newWeather = 'clear'
      else if (roll < 0.85) newWeather = 'rain'
      else newWeather = 'snow'

      newState.weather = newWeather
      newState.lastWeatherChangeHour = Math.floor(currentHour)
    }

    return newState
  }),

  // Track building completion for daily stats
  incrementBuildingsToday: () => set((state) => ({
    buildingsToday: state.buildingsToday + 1
  })),

  // Stats actions
  setMood: (mood) => set({ mood: Math.max(0, Math.min(100, mood)) }),
  setEnergy: (energy) => set({ energy: Math.max(0, Math.min(100, energy)) }),
  adjustMood: (delta) => set((state) => ({ mood: Math.max(0, Math.min(100, state.mood + delta)) })),
  adjustEnergy: (delta) => set((state) => ({ energy: Math.max(0, Math.min(100, state.energy + delta)) })),
  setIsSleeping: (sleeping) => set({ isSleeping: sleeping }),

  // AI speed control
  setAISpeed: (speed) => set({ aiSpeed: Math.max(0.1, Math.min(10, speed)) }),

  // AI status
  setAIStatus: (status) => set({ aiStatus: status }),
  setAICurrentAction: (action) => set({ aiCurrentAction: action }),

  // Admin mode toggle
  toggleAdminMode: () => set((state) => ({ adminMode: !state.adminMode })),
  setAdminMode: (enabled) => set({ adminMode: enabled }),

  // Load state from server (for persistence)
  loadServerState: (serverState) => set((state) => {
    // If buildings count dropped significantly, this is likely a reset
    const isReset = serverState.buildings?.length === 0 && state.placedBuildings.length > 0

    return {
      placedBuildings: serverState.buildings || [],
      characterPosition: serverState.characterPosition || [0, 0, 0],
      characterRotation: serverState.characterRotation || 0,
      timeOfDay: serverState.timeOfDay || 6,
      weather: serverState.weather || 'clear',
      mood: serverState.mood || 80,
      energy: serverState.energy || 100,
      // Reset day tracking if this is a world reset
      ...(isReset ? {
        day: 1,
        buildingsToday: 0,
        buildingsPerDay: [],
        lastWeatherChangeHour: 6,
      } : {}),
    }
  }),

  // Full reset of world state (called when reset button is clicked)
  resetWorld: () => set({
    placedBuildings: [],
    day: 1,
    buildingsToday: 0,
    buildingsPerDay: [],
    timeOfDay: 6,
    weather: 'clear',
    lastWeatherChangeHour: 6,
    mood: 80,
    energy: 100,
    aiStatus: 'Building...',
    aiCurrentAction: null,
    currentBuildTask: null,
    isBuilding: false,
  }),

  // Buildings placed by AI (legacy)
  buildings: [],
  addBuilding: (building) => set((state) => ({
    buildings: [...state.buildings, building]
  })),

  // Add a building directly (for server-synced builds)
  addPlacedBuilding: (building) => set((state) => {
    // Avoid duplicates
    if (state.placedBuildings.some(b => b.id === building.id)) {
      return state
    }
    return { placedBuildings: [...state.placedBuildings, building] }
  }),
}))
