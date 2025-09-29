/**
 * Test setup file for Vitest
 * This file is run before all tests to set up the testing environment
 */

import { vi } from 'vitest'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_DEMO_MODE: 'true'
}))

// Mock IndexedDB for tests
const mockIndexedDB = {
  open: vi.fn().mockResolvedValue({
    result: {
      createObjectStore: vi.fn(),
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          add: vi.fn().mockResolvedValue(undefined),
          put: vi.fn().mockResolvedValue(undefined),
          get: vi.fn().mockResolvedValue(undefined),
          delete: vi.fn().mockResolvedValue(undefined),
          clear: vi.fn().mockResolvedValue(undefined),
          count: vi.fn().mockResolvedValue(0),
          getAll: vi.fn().mockResolvedValue([]),
          getAllKeys: vi.fn().mockResolvedValue([]),
          key: vi.fn().mockResolvedValue(undefined),
          index: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(undefined),
            getAll: vi.fn().mockResolvedValue([]),
            count: vi.fn().mockResolvedValue(0)
          })
        })
      })
    }
  })
}

global.indexedDB = mockIndexedDB

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}))

// Mock fetch
global.fetch = vi.fn()

// Mock crypto for ID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-123')
  }
})

// Mock Date.now for consistent timestamps
const mockDateNow = vi.fn(() => 1234567890000)
global.Date.now = mockDateNow

// Mock setTimeout and clearTimeout
global.setTimeout = vi.fn((fn) => {
  fn()
  return 1
})
global.clearTimeout = vi.fn()
