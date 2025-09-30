import { createContext, useContext, useState } from 'react'
import { useDrawerStackStore } from '../stores/drawerStackStore.js'

const DrawerContext = createContext()

export const useDrawer = () => {
  const context = useContext(DrawerContext)
  if (!context) {
    throw new Error('useDrawer must be used within a DrawerProvider')
  }
  return context
}

export const DrawerProvider = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerContent, setDrawerContent] = useState(null)
  
  // Folosește stiva de drawere din Zustand
  const { 
    pushDrawer, 
    popDrawer, 
    getCurrentDrawer, 
    getStackSize,
    hasDrawers 
  } = useDrawerStackStore()

  const openDrawer = (content) => {
    // Adaugă drawer-ul în stivă
    pushDrawer(content)
    
    // Setează conținutul curent
    setDrawerContent(content)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    // Elimină ultimul drawer din stivă
    popDrawer()
    
    // Verifică dacă mai există drawere în stivă
    if (hasDrawers()) {
      const nextDrawer = getCurrentDrawer()
      if (nextDrawer) {
        setDrawerContent(nextDrawer)
        setDrawerOpen(true)
      } else {
        setDrawerOpen(false)
        setDrawerContent(null)
      }
    } else {
      setDrawerOpen(false)
      setDrawerContent(null)
    }
  }

  const openAppointmentDrawer = (appointmentData = null) => {
    openDrawer({
      type: 'appointment',
      isNew: !appointmentData,
      data: appointmentData
    })
  }

  const openMenuDrawer = () => {
    openDrawer({ type: 'menu' })
  }

  const openNotificationsDrawer = () => {
    openDrawer({ type: 'notifications' })
  }

  const openUserDrawer = () => {
    openDrawer({ type: 'user' })
  }

  const openSearchDrawer = () => {
    openDrawer({ type: 'search' })
  }

  const openQuickActionsDrawer = () => {
    openDrawer({ type: 'quick-actions' })
  }

  const openTreatmentDrawer = (treatmentData = null) => {
    openDrawer({
      type: 'treatment',
      isNew: !treatmentData,
      data: treatmentData
    })
  }

  const openRoleDrawer = (roleData = null) => {
    openDrawer({
      type: 'role',
      data: roleData
    })
  }

  const openCashRegisterDrawer = (cashRegisterData = null) => {
    openDrawer({
      type: 'cash-register',
      data: cashRegisterData
    })
  }

  const openDataDownloadDrawer = () => {
    openDrawer({ type: 'data-download' })
  }

  const openStripePaymentDrawer = () => {
    openDrawer({ type: 'stripe-payment' })
  }

  const openAIAssistantDrawer = () => {
    openDrawer({ type: 'ai-assistant' })
  }

  const openUserProfileDrawer = () => {
    openDrawer({ type: 'user-profile' })
  }

  // Funcții pentru gestionarea stivei
  const getStackInfo = () => {
    return {
      size: getStackSize(),
      hasDrawers: hasDrawers(),
      currentDrawer: getCurrentDrawer()
    }
  }

  const value = {
    drawerOpen,
    drawerContent,
    openDrawer,
    closeDrawer,
    openAppointmentDrawer,
    openMenuDrawer,
    openNotificationsDrawer,
    openUserDrawer,
    openSearchDrawer,
    openQuickActionsDrawer,
    openTreatmentDrawer,
    openRoleDrawer,
    openCashRegisterDrawer,
    openDataDownloadDrawer,
    openStripePaymentDrawer,
    openAIAssistantDrawer,
    openUserProfileDrawer,
    // Funcții pentru stiva de drawere
    getStackInfo,
    getStackSize,
    hasDrawers,
  }

  return (
    <DrawerContext.Provider value={value}>
      {children}
    </DrawerContext.Provider>
  )
}
