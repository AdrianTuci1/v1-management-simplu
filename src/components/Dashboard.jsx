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

const Dashboard = ({ currentView }) => {
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
