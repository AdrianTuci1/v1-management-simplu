// AI Assistant Configuration
export const AI_ASSISTANT_CONFIG = {
  // Backend API endpoints
  API_ENDPOINTS: {
    MESSAGES: 'http://localhost:3003/api/messages',
    SESSIONS: 'http://localhost:3003/api/sessions',
    WEBSOCKET: 'ws://localhost:4000/socket' // Using public test WebSocket server for debugging
  },

  // Session configuration
  SESSION: {
    // Session ID format: businessId:userId:timestamp
    FORMAT: 'daily', // 'daily' | 'continuous' | 'custom'
    AUTO_CLOSE_HOURS: 24, // Auto-close sessions after X hours
    CLEANUP_DAYS: 30, // Cleanup resolved sessions after X days
  },

  // WebSocket configuration
  WEBSOCKET: {
    RECONNECT_DELAY: 5000, // ms
    MAX_RECONNECT_ATTEMPTS: 5,
    HEARTBEAT_INTERVAL: 30000, // ms
  },

  // Message configuration
  MESSAGE: {
    MAX_LENGTH: 1000,
    TYPING_INDICATOR_DELAY: 1000, // ms
    AUTO_SCROLL: true,
  },

  // UI configuration
  UI: {
    MESSAGES_PER_PAGE: 50,
    SHOW_TIMESTAMPS: true,
    SHOW_SESSION_INFO: true,
    SHOW_CONNECTION_STATUS: true,
    ANIMATIONS: true,
  },

  // AI Response configuration
  AI: {
    RESPONSE_DELAY: 1000, // ms - simulate AI processing time
    CONTEXT_WINDOW: 10, // Number of previous messages to include in context
    MAX_RESPONSE_LENGTH: 500,
  },

  // Default business and user IDs (replace with actual values)
  DEFAULTS: {
    BUSINESS_ID: 'B0100001',
    USER_ID: '33948842-b061-7036-f02f-79b9c0b4225b',
    LOCATION_ID: 'L0100001',
  },

  // Error messages
  ERRORS: {
    CONNECTION_FAILED: 'Conexiunea la server a eșuat. Încerc din nou...',
    MESSAGE_SEND_FAILED: 'Mesajul nu a putut fi trimis. Încercați din nou.',
    SESSION_LOAD_FAILED: 'Sesiunea nu a putut fi încărcată.',
    WEBSOCKET_DISCONNECTED: 'Conexiunea WebSocket a fost întreruptă.',
  },

  // Success messages
  SUCCESS: {
    MESSAGE_SENT: 'Mesaj trimis cu succes',
    CONNECTION_ESTABLISHED: 'Conectat la server',
    SESSION_LOADED: 'Sesiunea a fost încărcată',
  },

  // Logging configuration
  LOGGING: {
    ENABLED: true,
    LEVEL: 'debug', // 'debug' | 'info' | 'warn' | 'error'
    SHOW_CONSOLE: true,
  }
};

// Helper function to get configuration value
export const getConfig = (key, defaultValue = null) => {
  const keys = key.split('.');
  let value = AI_ASSISTANT_CONFIG;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return defaultValue;
    }
  }
  
  return value;
};

// Helper function to set configuration value
export const setConfig = (key, value) => {
  const keys = key.split('.');
  const lastKey = keys.pop();
  let config = AI_ASSISTANT_CONFIG;
  
  for (const k of keys) {
    if (!config[k] || typeof config[k] !== 'object') {
      config[k] = {};
    }
    config = config[k];
  }
  
  config[lastKey] = value;
};

// Environment-specific overrides
export const loadEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    setConfig('API_ENDPOINTS.MESSAGES', 'https://your-production-domain.com/api/messages');
    setConfig('API_ENDPOINTS.SESSIONS', 'https://your-production-domain.com/api/sessions');
    setConfig('API_ENDPOINTS.WEBSOCKET', 'wss://your-production-domain.com/socket/websocket');
    setConfig('LOGGING.LEVEL', 'warn');
  } else if (env === 'staging') {
    setConfig('API_ENDPOINTS.MESSAGES', 'https://your-staging-domain.com/api/messages');
    setConfig('API_ENDPOINTS.SESSIONS', 'https://your-staging-domain.com/api/sessions');
    setConfig('API_ENDPOINTS.WEBSOCKET', 'wss://your-staging-domain.com/socket/websocket');
  }
  
  // Load from localStorage if available
  try {
    const savedConfig = localStorage.getItem('aiAssistantConfig');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      Object.assign(AI_ASSISTANT_CONFIG, parsed);
    }
  } catch (error) {
    console.warn('Could not load saved AI Assistant configuration:', error);
  }
};

// Save configuration to localStorage
export const saveConfig = () => {
  try {
    localStorage.setItem('aiAssistantConfig', JSON.stringify(AI_ASSISTANT_CONFIG));
  } catch (error) {
    console.warn('Could not save AI Assistant configuration:', error);
  }
};

// Initialize configuration
loadEnvironmentConfig();
