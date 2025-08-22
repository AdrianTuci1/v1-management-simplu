import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Drawer from './components/Drawer'
import Dashboard from './components/Dashboard'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerContent, setDrawerContent] = useState(null)

  // Load state from localStorage on mount
  useEffect(() => {
    const savedView = localStorage.getItem('dashboard-view')
    const savedSidebarState = localStorage.getItem('sidebar-collapsed')
    
    if (savedView) {
      setCurrentView(savedView)
    }
    
    if (savedSidebarState) {
      setSidebarCollapsed(JSON.parse(savedSidebarState))
    }
  }, [])

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('dashboard-view', currentView)
  }, [currentView])

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  const handleViewChange = (view) => {
    setCurrentView(view)
  }

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleDrawerOpen = (content) => {
    setDrawerContent(content)
    setDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setDrawerContent(null)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        currentView={currentView}
        onViewChange={handleViewChange}
        onToggle={handleSidebarToggle}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar 
          currentView={currentView}
          onDrawerOpen={handleDrawerOpen}
        />
        
        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <Dashboard 
            currentView={currentView}
            onDrawerOpen={handleDrawerOpen}
          />
        </main>
      </div>
      
      {/* Drawer */}
      <Drawer 
        open={drawerOpen}
        content={drawerContent}
        onClose={handleDrawerClose}
      />
    </div>
  )
}

export default App
