import { create } from 'zustand'

export const useInvoiceDrawerStore = create((set, get) => ({
  isOpen: false,
  appointmentData: null,
  invoiceData: null, // Pentru facturi existente
  
  openInvoiceDrawer: (appointmentData = null) => {
    set({ 
      isOpen: true, 
      appointmentData,
      invoiceData: null 
    })
  },
  
  openInvoiceDrawerWithInvoice: (invoiceData = null) => {
    set({ 
      isOpen: true, 
      invoiceData,
      appointmentData: null 
    })
  },
  
  closeInvoiceDrawer: () => {
    set({ 
      isOpen: false, 
      appointmentData: null,
      invoiceData: null 
    })
  }
}))
