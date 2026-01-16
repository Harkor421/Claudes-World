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
  timeOfDay: 12, // 0-24 hours (12 = noon)
  autoTimeEnabled: false, // auto-advance time

  // Claude's stats
  mood: 80, // 0-100 (happy to sad)
  energy: 100, // 0-100

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
  startBuildTask: (model, position) => set({
    currentBuildTask: { model, position, progress: 0, startTime: Date.now() },
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
        scale: 2
      }
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
  toggleAutoTime: () => set((state) => ({ autoTimeEnabled: !state.autoTimeEnabled })),
  advanceTime: (delta) => set((state) => ({
    timeOfDay: (state.timeOfDay + delta) % 24
  })),

  // Stats actions
  setMood: (mood) => set({ mood: Math.max(0, Math.min(100, mood)) }),
  setEnergy: (energy) => set({ energy: Math.max(0, Math.min(100, energy)) }),
  adjustMood: (delta) => set((state) => ({ mood: Math.max(0, Math.min(100, state.mood + delta)) })),
  adjustEnergy: (delta) => set((state) => ({ energy: Math.max(0, Math.min(100, state.energy + delta)) })),

  // Buildings placed by AI (legacy)
  buildings: [],
  addBuilding: (building) => set((state) => ({
    buildings: [...state.buildings, building]
  })),
}))
