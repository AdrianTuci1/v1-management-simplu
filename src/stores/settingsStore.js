import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Working Hours Settings
      workingHours: {
        monday: { enabled: true, start: '09:00', end: '18:00' },
        tuesday: { enabled: true, start: '09:00', end: '18:00' },
        wednesday: { enabled: true, start: '09:00', end: '18:00' },
        thursday: { enabled: true, start: '09:00', end: '18:00' },
        friday: { enabled: true, start: '09:00', end: '18:00' },
        saturday: { enabled: false, start: '09:00', end: '14:00' },
        sunday: { enabled: false, start: '09:00', end: '14:00' }
      },

      // Location Details
      locationDetails: {
        name: '',
        address: '',
        phone: '',
        email: '',
        description: ''
      },

      // Currency Settings
      currency: {
        code: 'RON',
        name: 'Leu românesc',
        symbol: 'lei'
      },

      // Tax Settings
      taxSettings: {
        defaultVAT: 19,
        vatRates: [
          { id: 1, name: 'TVA Standard', rate: 19, enabled: true },
          { id: 2, name: 'TVA Redus', rate: 9, enabled: true },
          { id: 3, name: 'TVA Zero', rate: 0, enabled: true },
          { id: 4, name: 'Scutit de TVA', rate: 0, enabled: true }
        ]
      },

      // Language Settings
      language: {
        code: 'ro',
        name: 'Română'
      },

      // Cash Register Settings
      cashRegister: {
        receiptSettings: {
          header: 'Cabinet Medical Dr. Popescu',
          address: 'Str. Mihai Viteazu nr. 10, București',
          phone: '+40 21 123 4567',
          email: 'contact@cabinet.ro',
          footer: 'Mulțumim pentru încredere!',
          showLogo: true,
          showQRCode: true
        },
        printerSettings: {
          printerName: '',
          paperWidth: 80,
          autoPrint: true,
          printCopies: 1
        },
        receiptItems: {
          showItemDetails: true,
          showTaxBreakdown: true,
          showPaymentMethod: true,
          showCashierInfo: true
        }
      },

      // Settings Status
      settingsStatus: {
        'working-hours': { configured: true, lastUpdated: new Date().toISOString() },
        'currency-tax': { configured: true, lastUpdated: new Date().toISOString() },
        'language': { configured: true, lastUpdated: new Date().toISOString() },
        'cash-register': { configured: false, lastUpdated: null }
      },

      // Actions
      updateWorkingHours: (day, updates) => set((state) => ({
        workingHours: {
          ...state.workingHours,
          [day]: { ...state.workingHours[day], ...updates }
        },
        settingsStatus: {
          ...state.settingsStatus,
          'working-hours': { configured: true, lastUpdated: new Date().toISOString() }
        }
      })),

      updateLocationDetails: (updates) => set((state) => ({
        locationDetails: { ...state.locationDetails, ...updates },
        settingsStatus: {
          ...state.settingsStatus,
          'working-hours': { configured: true, lastUpdated: new Date().toISOString() }
        }
      })),

      updateCurrency: (currency) => set((state) => ({
        currency,
        settingsStatus: {
          ...state.settingsStatus,
          'currency-tax': { configured: true, lastUpdated: new Date().toISOString() }
        }
      })),

      updateTaxSettings: (updates) => set((state) => ({
        taxSettings: { ...state.taxSettings, ...updates },
        settingsStatus: {
          ...state.settingsStatus,
          'currency-tax': { configured: true, lastUpdated: new Date().toISOString() }
        }
      })),

      updateLanguage: (language) => set((state) => ({
        language,
        settingsStatus: {
          ...state.settingsStatus,
          'language': { configured: true, lastUpdated: new Date().toISOString() }
        }
      })),

      updateCashRegister: (updates) => set((state) => ({
        cashRegister: { ...state.cashRegister, ...updates },
        settingsStatus: {
          ...state.settingsStatus,
          'cash-register': { configured: true, lastUpdated: new Date().toISOString() }
        }
      })),

      // Helper methods
      getSettingStatus: (settingId) => {
        const status = get().settingsStatus[settingId]
        if (!status) return { configured: false, lastUpdated: null }
        
        const lastUpdated = status.lastUpdated 
          ? new Date(status.lastUpdated).toLocaleDateString('ro-RO')
          : 'Niciodată'
        
        return {
          configured: status.configured,
          lastUpdated
        }
      },

      resetSettings: () => set({
        workingHours: {
          monday: { enabled: true, start: '09:00', end: '18:00' },
          tuesday: { enabled: true, start: '09:00', end: '18:00' },
          wednesday: { enabled: true, start: '09:00', end: '18:00' },
          thursday: { enabled: true, start: '09:00', end: '18:00' },
          friday: { enabled: true, start: '09:00', end: '18:00' },
          saturday: { enabled: false, start: '09:00', end: '14:00' },
          sunday: { enabled: false, start: '09:00', end: '14:00' }
        },
        locationDetails: {
          name: '',
          address: '',
          phone: '',
          email: '',
          description: ''
        },
        currency: {
          code: 'RON',
          name: 'Leu românesc',
          symbol: 'lei'
        },
        taxSettings: {
          defaultVAT: 19,
          vatRates: [
            { id: 1, name: 'TVA Standard', rate: 19, enabled: true },
            { id: 2, name: 'TVA Redus', rate: 9, enabled: true },
            { id: 3, name: 'TVA Zero', rate: 0, enabled: true },
            { id: 4, name: 'Scutit de TVA', rate: 0, enabled: true }
          ]
        },
        language: {
          code: 'ro',
          name: 'Română'
        },
        cashRegister: {
          receiptSettings: {
            header: 'Cabinet Medical Dr. Popescu',
            address: 'Str. Mihai Viteazu nr. 10, București',
            phone: '+40 21 123 4567',
            email: 'contact@cabinet.ro',
            footer: 'Mulțumim pentru încredere!',
            showLogo: true,
            showQRCode: true
          },
          printerSettings: {
            printerName: '',
            paperWidth: 80,
            autoPrint: true,
            printCopies: 1
          },
          receiptItems: {
            showItemDetails: true,
            showTaxBreakdown: true,
            showPaymentMethod: true,
            showCashierInfo: true
          }
        },
        settingsStatus: {
          'working-hours': { configured: false, lastUpdated: null },
          'currency-tax': { configured: false, lastUpdated: null },
          'language': { configured: false, lastUpdated: null },
          'cash-register': { configured: false, lastUpdated: null }
        }
      })
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        workingHours: state.workingHours,
        locationDetails: state.locationDetails,
        currency: state.currency,
        taxSettings: state.taxSettings,
        language: state.language,
        cashRegister: state.cashRegister,
        settingsStatus: state.settingsStatus
      })
    }
  )
)

export default useSettingsStore
