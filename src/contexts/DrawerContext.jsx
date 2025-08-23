import { createContext, useContext, useState } from 'react'

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

  const openDrawer = (content) => {
    setDrawerContent(content)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setDrawerContent(null)
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
    openTreatmentDrawer
  }

  return (
    <DrawerContext.Provider value={value}>
      {children}
    </DrawerContext.Provider>
  )
}
