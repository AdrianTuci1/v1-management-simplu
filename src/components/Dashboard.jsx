import DashboardHome from './views/DashboardHome'
import OperationsPlanning from './views/OperationsPlanning'
import OperationsPeople from './views/OperationsPeople'
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

const Dashboard = ({ currentView, onDrawerOpen }) => {
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardHome onDrawerOpen={onDrawerOpen} />
      case 'operations-planning':
        return <OperationsPlanning onDrawerOpen={onDrawerOpen} />
      case 'operations-people':
        return <OperationsPeople onDrawerOpen={onDrawerOpen} />
      case 'operations-activities':
        return <OperationsActivities onDrawerOpen={onDrawerOpen} />
      case 'business-sales':
        return <BusinessSales onDrawerOpen={onDrawerOpen} />
      case 'business-inventory':
        return <BusinessInventory onDrawerOpen={onDrawerOpen} />
      case 'business-processes':
        return <BusinessProcesses onDrawerOpen={onDrawerOpen} />
      case 'financial-billing':
        return <FinancialBilling onDrawerOpen={onDrawerOpen} />
      case 'financial-accounting':
        return <FinancialAccounting onDrawerOpen={onDrawerOpen} />
      case 'analytics-reports':
        return <AnalyticsReports onDrawerOpen={onDrawerOpen} />
      case 'analytics-dashboard':
        return <AnalyticsDashboard onDrawerOpen={onDrawerOpen} />
      case 'admin-access':
        return <AdminAccess onDrawerOpen={onDrawerOpen} />
      case 'admin-users':
        return <AdminUsers onDrawerOpen={onDrawerOpen} />
      case 'admin-settings':
        return <AdminSettings onDrawerOpen={onDrawerOpen} />
      default:
        return <DashboardHome onDrawerOpen={onDrawerOpen} />
    }
  }

  return (
    <div className="space-y-6">
      {renderView()}
    </div>
  )
}

export default Dashboard
