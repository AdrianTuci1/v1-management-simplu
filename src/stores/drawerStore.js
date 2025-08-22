import { create } from 'zustand'

const useDrawerStore = create((set, get) => ({
  // State
  drawers: [],
  
  // Actions
  openDrawer: (type, data = null) => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newDrawer = {
      id,
      type,
      data,
      zIndex: get().drawers.length + 50,
      timestamp: Date.now()
    }
    
    set((state) => ({
      drawers: [...state.drawers, newDrawer]
    }))
    
    return id
  },
  
  closeDrawer: (id) => {
    set((state) => ({
      drawers: state.drawers.filter(drawer => drawer.id !== id)
    }))
  },
  
  closeTopDrawer: () => {
    set((state) => ({
      drawers: state.drawers.slice(0, -1)
    }))
  },
  
  closeAllDrawers: () => {
    set({ drawers: [] })
  },
  
  updateDrawer: (id, data) => {
    set((state) => ({
      drawers: state.drawers.map(drawer => 
        drawer.id === id 
          ? { ...drawer, data, timestamp: Date.now() }
          : drawer
      )
    }))
  },
  
  // Getters
  getTopDrawer: () => {
    const { drawers } = get()
    return drawers[drawers.length - 1] || null
  },
  
  hasOpenDrawers: () => {
    return get().drawers.length > 0
  },
  
  getDrawerCount: () => {
    return get().drawers.length
  },
  
  getDrawerById: (id) => {
    return get().drawers.find(drawer => drawer.id === id) || null
  },
  
  getDrawersByType: (type) => {
    return get().drawers.filter(drawer => drawer.type === type)
  }
}))

export default useDrawerStore
