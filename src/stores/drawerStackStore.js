import { create } from 'zustand'

export const useDrawerStackStore = create((set, get) => ({
  // Stiva de drawere
  drawerStack: [],
  
  // Adaugă un drawer în stivă
  pushDrawer: (drawerData) => {
    const newDrawer = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...drawerData
    }
    
    set((state) => ({
      drawerStack: [...state.drawerStack, newDrawer]
    }))
    
    return newDrawer.id
  },
  
  // Elimină ultimul drawer din stivă
  popDrawer: () => {
    set((state) => {
      const newStack = [...state.drawerStack]
      newStack.pop()
      return { drawerStack: newStack }
    })
  },
  
  // Elimină un drawer specific din stivă
  removeDrawer: (id) => {
    set((state) => ({
      drawerStack: state.drawerStack.filter(drawer => drawer.id !== id)
    }))
  },
  
  // Elimină toate drawerele din stivă
  clearStack: () => {
    set({ drawerStack: [] })
  },
  
  // Obține ultimul drawer din stivă
  getTopDrawer: () => {
    const stack = get().drawerStack
    return stack.length > 0 ? stack[stack.length - 1] : null
  },
  
  // Obține toate drawerele din stivă
  getAllDrawers: () => {
    return get().drawerStack
  },
  
  // Obține numărul de drawere din stivă
  getStackSize: () => {
    return get().drawerStack.length
  },
  
  // Verifică dacă stiva este goală
  isEmpty: () => {
    return get().drawerStack.length === 0
  },
  
  // Obține drawer-ul curent (ultimul din stivă)
  getCurrentDrawer: () => {
    const stack = get().drawerStack
    return stack.length > 0 ? stack[stack.length - 1] : null
  },
  
  // Verifică dacă există drawere în stivă
  hasDrawers: () => {
    return get().drawerStack.length > 0
  }
}))
