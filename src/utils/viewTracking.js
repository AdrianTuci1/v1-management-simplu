/**
 * View Tracking Utility
 * 
 * Manages localStorage tracking for current view context (menu, drawer, etc.)
 * Used by AI Assistant to understand user's current context
 */

const STORAGE_KEYS = {
  DASHBOARD_VIEW: 'dashboard-view',
  CURRENT_DRAWER: 'current-drawer',
  DRAWER_TYPE: 'current-drawer-type',
  DRAWER_DATA: 'current-drawer-data'
};

/**
 * Get current dashboard view from localStorage
 * @returns {string|null} Current view/menu name
 */
export const getCurrentDashboardView = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.DASHBOARD_VIEW);
  } catch (error) {
    console.error('Error getting dashboard view:', error);
    return null;
  }
};

/**
 * Set current dashboard view in localStorage
 * @param {string} viewName - Name of the current view/menu
 */
export const setCurrentDashboardView = (viewName) => {
  try {
    if (viewName) {
      localStorage.setItem(STORAGE_KEYS.DASHBOARD_VIEW, viewName);
    } else {
      localStorage.removeItem(STORAGE_KEYS.DASHBOARD_VIEW);
    }
  } catch (error) {
    console.error('Error setting dashboard view:', error);
  }
};

/**
 * Get current drawer info from localStorage
 * @returns {Object|null} Object with drawer, drawerType, and drawerData
 */
export const getCurrentDrawerInfo = () => {
  try {
    const drawer = localStorage.getItem(STORAGE_KEYS.CURRENT_DRAWER);
    const drawerType = localStorage.getItem(STORAGE_KEYS.DRAWER_TYPE);
    const drawerDataStr = localStorage.getItem(STORAGE_KEYS.DRAWER_DATA);
    
    let drawerData = null;
    if (drawerDataStr) {
      try {
        drawerData = JSON.parse(drawerDataStr);
      } catch (parseError) {
        console.error('Error parsing drawer data:', parseError);
      }
    }
    
    // Return null if no drawer is open
    if (!drawer && !drawerType) {
      return null;
    }
    
    return {
      drawer: drawer || drawerType, // Fallback to drawerType if drawer is not set
      drawerType: drawerType,
      drawerData: drawerData
    };
  } catch (error) {
    console.error('Error getting drawer info:', error);
    return null;
  }
};

/**
 * Set current drawer info in localStorage
 * @param {string} drawer - General drawer identifier
 * @param {string} drawerType - Specific drawer type
 * @param {Object} drawerData - Data associated with the drawer
 */
export const setCurrentDrawerInfo = (drawer, drawerType = null, drawerData = null) => {
  try {
    if (drawer) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_DRAWER, drawer);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_DRAWER);
    }
    
    if (drawerType) {
      localStorage.setItem(STORAGE_KEYS.DRAWER_TYPE, drawerType);
    } else {
      localStorage.removeItem(STORAGE_KEYS.DRAWER_TYPE);
    }
    
    if (drawerData && typeof drawerData === 'object') {
      try {
        // Only store serializable data, remove functions and circular references
        const serializableData = JSON.parse(JSON.stringify(drawerData));
        localStorage.setItem(STORAGE_KEYS.DRAWER_DATA, JSON.stringify(serializableData));
      } catch (stringifyError) {
        console.error('Error stringifying drawer data:', stringifyError);
        localStorage.removeItem(STORAGE_KEYS.DRAWER_DATA);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.DRAWER_DATA);
    }
  } catch (error) {
    console.error('Error setting drawer info:', error);
  }
};

/**
 * Clear drawer info from localStorage (when drawer is closed)
 */
export const clearDrawerInfo = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_DRAWER);
    localStorage.removeItem(STORAGE_KEYS.DRAWER_TYPE);
    localStorage.removeItem(STORAGE_KEYS.DRAWER_DATA);
  } catch (error) {
    console.error('Error clearing drawer info:', error);
  }
};

/**
 * Get complete view context for AI Assistant
 * Includes dashboard view and drawer info
 * @returns {Object} Complete view context
 */
export const getViewContext = () => {
  const dashboardView = getCurrentDashboardView();
  const drawerInfo = getCurrentDrawerInfo();
  
  const viewContext = {
    dashboardView: dashboardView,
    timestamp: new Date().toISOString()
  };
  
  // Add drawer info if available
  if (drawerInfo) {
    viewContext.drawer = drawerInfo.drawer;
    viewContext.drawerType = drawerInfo.drawerType;
    
    // Only include drawerData if it exists and is not empty
    if (drawerInfo.drawerData && Object.keys(drawerInfo.drawerData).length > 0) {
      viewContext.drawerData = drawerInfo.drawerData;
    }
  }
  
  return viewContext;
};

/**
 * Format view context for logging/debugging
 * @param {Object} viewContext - View context object
 * @returns {string} Formatted string
 */
export const formatViewContext = (viewContext) => {
  if (!viewContext) return 'No view context';
  
  const parts = [];
  
  if (viewContext.dashboardView) {
    parts.push(`View: ${viewContext.dashboardView}`);
  }
  
  if (viewContext.drawer) {
    parts.push(`Drawer: ${viewContext.drawer}`);
  }
  
  if (viewContext.drawerType) {
    parts.push(`Type: ${viewContext.drawerType}`);
  }
  
  return parts.length > 0 ? parts.join(' | ') : 'Default view';
};

