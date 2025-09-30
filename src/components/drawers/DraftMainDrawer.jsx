import { X, Bell, User, Settings, Calendar, Loader2 } from 'lucide-react'
import { getDrawerComponent } from './DrawerRegistry.jsx'

// Draft-urile sunt create doar de AI, nu automat pentru drawerele noi

/**
 * DraftMainDrawer - Versiunea cu suport pentru draft-uri a MainDrawer-ului
 * 
 * Această componentă este identică cu MainDrawer-ul original.
 * Draft-urile sunt create doar de AI, nu automat când se deschid drawerele.
 */
const DraftMainDrawer = ({ open, content, onClose, position = "side", externalNavigationState, onExternalNavigationChange }) => {
  if (!open) return null

  const renderContent = () => {
    const DrawerComponent = getDrawerComponent(content?.type)
    
    // Props specifice pentru fiecare tip de drawer
    const getDrawerProps = () => {
      const baseProps = { onClose, position }
      
      // Props pentru navigația externă
      const externalNavProps = {
        externalCurrentMenu: externalNavigationState?.[content?.type],
        onExternalMenuChange: (id) => onExternalNavigationChange?.(id, content?.type)
      }
      
      switch (content?.type) {
        case 'appointment':
          return { ...baseProps, ...externalNavProps, isNewAppointment: content?.isNew, appointmentData: content?.data }
        case 'new-person':
          return { ...baseProps, ...externalNavProps, isNewPatient: true }
        case 'edit-person':
          return { ...baseProps, ...externalNavProps, isNewPatient: false, patientData: content?.data }
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

    // Draft-urile sunt create doar de AI, nu automat pentru drawerele noi
    // Returnează drawerele normale fără wrapper DraftAwareDrawer
    return <DrawerComponent {...getDrawerProps()} />
  }

  return (
    <div className="h-full w-full">
      {renderContent()}
    </div>
  )
}

export default DraftMainDrawer
