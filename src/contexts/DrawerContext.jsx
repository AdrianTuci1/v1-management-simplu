import { createContext, useContext, useState } from 'react'
import { useDrawerStackStore } from '../stores/drawerStackStore.js'
import { setCurrentDrawerInfo, clearDrawerInfo } from '../utils/viewTracking.js'

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
  const [treatmentPlanOpen, setTreatmentPlanOpen] = useState(false)
  const [treatmentPlanPatientId, setTreatmentPlanPatientId] = useState(null)
  
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
    
    // Salvează informații despre drawer în localStorage pentru AI Assistant
    if (content && content.type) {
      setCurrentDrawerInfo(
        content.type, // drawer name
        content.type, // drawerType (same as type)
        content.data || null // drawerData
      )
    }
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
        
        // Actualizează informațiile despre drawer pentru următorul drawer din stivă
        if (nextDrawer && nextDrawer.type) {
          setCurrentDrawerInfo(
            nextDrawer.type,
            nextDrawer.type,
            nextDrawer.data || null
          )
        }
      } else {
        setDrawerOpen(false)
        setDrawerContent(null)
        clearDrawerInfo()
      }
    } else {
      setDrawerOpen(false)
      setDrawerContent(null)
      
      // Șterge informațiile despre drawer din localStorage
      clearDrawerInfo()
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

  // Service configuration drawers
  const openSMSConfigurationDrawer = (locationId = 'default') => {
    openDrawer({ type: 'sms-configuration', locationId })
  }

  const openEmailConfigurationDrawer = (locationId = 'default') => {
    openDrawer({ type: 'email-configuration', locationId })
  }

  const openVoiceAgentConfigurationDrawer = (locationId = 'default') => {
    openDrawer({ type: 'voice-agent-configuration', locationId })
  }

  const openMetaConfigurationDrawer = (locationId = 'default') => {
    openDrawer({ type: 'meta-configuration', locationId })
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
    treatmentPlanOpen,
    setTreatmentPlanOpen,
    treatmentPlanPatientId,
    setTreatmentPlanPatientId,
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
    // Service configuration drawers
    openSMSConfigurationDrawer,
    openEmailConfigurationDrawer,
    openVoiceAgentConfigurationDrawer,
    openMetaConfigurationDrawer,
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
