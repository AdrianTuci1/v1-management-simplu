import { X, Bell, User, Settings, Calendar, Loader2 } from 'lucide-react'
import { getDrawerComponent } from './DrawerRegistry.jsx'
import { useState, useEffect } from 'react'
import appointmentService from '../../services/appointmentService.js'

const Drawer = ({ open, content, onClose, position = "side" }) => {
  if (!open) return null

  const renderContent = () => {
    const DrawerComponent = getDrawerComponent(content?.type)
    
    // Props specifice pentru fiecare tip de drawer
    const getDrawerProps = () => {
      const baseProps = { onClose, position }
      
      switch (content?.type) {
        case 'appointment':
          return { ...baseProps, isNewAppointment: content?.isNew, appointmentData: content?.data }
        case 'new-person':
          return { ...baseProps, isNewPatient: true }
        case 'edit-person':
          return { ...baseProps, isNewPatient: false, patientData: content?.data }
        case 'product':
          return { ...baseProps, isOpen: open, product: content?.data }
        case 'medic':
          return { ...baseProps, user: content?.data }
        case 'treatment':
          return { ...baseProps, isNewTreatment: content?.isNew, treatmentData: content?.data }
        case 'role':
          return { ...baseProps, roleData: content?.data }
        case 'new-sale':
          return { ...baseProps, appointmentData: content?.data }
        case 'cash-register':
          return { ...baseProps, appointmentData: content?.data }
        case 'ai-assistant':
          // AI Assistant are nevoie de onClose
          return { onClose }
        default:
          return baseProps
      }
    }

    return <DrawerComponent {...getDrawerProps()} />
  }

  return (
    <div className="h-full w-full">
      {renderContent()}
    </div>
  )
}



export default Drawer
