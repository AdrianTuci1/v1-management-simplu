
import { getDrawerComponent } from './DrawerRegistry.jsx'

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
        case 'working-hours':
          return { ...baseProps, settingId: content?.settingId, settingData: content?.settingData }
        case 'ai-assistant':
          // AI Assistant are nevoie de onClose
          return { onClose }
        case 'sms-configuration':
        case 'email-configuration':
        case 'voice-agent-configuration':
        case 'meta-configuration':
          return { ...baseProps, isOpen: open, locationId: content?.locationId || 'default' }
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
