import { useEffect } from 'react'
import DashboardHome from './views/DashboardHome'
import OperationsPlanning from './views/OperationsPlanning'
import OperationsPeople from './views/OperationsPeople'
import OperationsTreatments from './views/OperationsTreatments'
import OperationsActivities from './views/OperationsActivities'
import BusinessSales from './views/BusinessSales'
import BusinessInventory from './views/BusinessInventory'
import BusinessProcesses from './views/BusinessProcesses'
import FinancialBilling from './views/FinancialBilling'
import FinancialAccounting from './views/FinancialAccounting'
import AnalyticsReports from './views/AnalyticsReports'
import AnalyticsDashboard from './views/AnalyticsDashboard'
import AdminAccess from './views/AdminAccess'
import AdminUsers from './views/AdminUsers'
import AdminSettings from './views/AdminSettings'
import { useSettings } from '../hooks/useSettings'
import useSettingsStore from '../stores/settingsStore'

const Dashboard = ({ currentView }) => {
  // Încarcă setările automat la montare pentru a le avea disponibile în IndexedDB
  // Avem nevoie de: working-hours (detalii companie) și currency-tax
  const { settings, loadSettings } = useSettings()
  const updateLocationDetails = useSettingsStore((state) => state.updateLocationDetails)
  const updateCurrency = useSettingsStore((state) => state.updateCurrency)
  const updateTaxSettings = useSettingsStore((state) => state.updateTaxSettings)
  
  useEffect(() => {
    // Încarcă setările la montarea Dashboard-ului
    loadSettings()
  }, [loadSettings])
  
  // Sincronizează datele din API cu Zustand store-ul
  useEffect(() => {
    if (settings && settings.length > 0) {
      console.log('📦 Dashboard - Sincronizare setări din API cu store-ul:', settings)
      
      // Găsește working-hours settings
      const workingHoursSetting = settings.find(s => s.settingType === 'working-hours')
      if (workingHoursSetting && workingHoursSetting.data) {
        console.log('🏢 Dashboard - Working hours găsite:', workingHoursSetting.data)
        
        // Datele de locație sunt în workingHoursSetting.data.locationDetails
        const locationDetails = workingHoursSetting.data.locationDetails || {}
        
        // Actualizează location details în store
        const locationData = {
          name: locationDetails.name || '',
          companyName: locationDetails.companyName || '',
          address: locationDetails.address || '',
          phone: locationDetails.phone || '',
          email: locationDetails.email || '',
          description: locationDetails.description || '',
          cif: locationDetails.cif || '',
          iban: locationDetails.iban || '',
          banca: locationDetails.banca || ''
        }
        
        console.log('🏢 Dashboard - Actualizare locationDetails în store:', locationData)
        updateLocationDetails(locationData)
      }
      
      // Găsește currency-tax settings
      const currencyTaxSetting = settings.find(s => s.settingType === 'currency-tax')
      if (currencyTaxSetting && currencyTaxSetting.data) {
        console.log('💰 Dashboard - Currency-Tax găsite:', currencyTaxSetting.data)
        
        // Actualizează currency în store
        if (currencyTaxSetting.data.currency) {
          console.log('💰 Dashboard - Actualizare currency în store:', currencyTaxSetting.data.currency)
          updateCurrency(currencyTaxSetting.data.currency)
        }
        
        // Actualizează tax settings în store
        if (currencyTaxSetting.data.taxSettings) {
          console.log('💰 Dashboard - Actualizare taxSettings în store:', currencyTaxSetting.data.taxSettings)
          updateTaxSettings(currencyTaxSetting.data.taxSettings)
        }
      }
    }
  }, [settings, updateLocationDetails, updateCurrency, updateTaxSettings])
  
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardHome />
      case 'operations-planning':
        return <OperationsPlanning />
      case 'operations-people':
        return <OperationsPeople />
      case 'operations-treatments':
        return <OperationsTreatments />
      case 'operations-activities':
        return <OperationsActivities />
      case 'business-sales':
        return <BusinessSales />
      case 'business-inventory':
        return <BusinessInventory />
      case 'business-processes':
        return <BusinessProcesses />
      case 'financial-billing':
        return <FinancialBilling />
      case 'financial-accounting':
        return <FinancialAccounting />
      case 'analytics-reports':
        return <AnalyticsReports />
      case 'analytics-dashboard':
        return <AnalyticsDashboard />
      case 'admin-access':
        return <AdminAccess />
      case 'admin-users':
        return <AdminUsers />
      case 'admin-settings':
        return <AdminSettings />
      default:
        return <DashboardHome />
    }
  }

  return (
    <div className="space-y-6">
      {renderView()}
    </div>
  )
}

export default Dashboard
