import { create } from 'zustand'

export const useInvoiceDrawerStore = create((set, get) => ({
  isOpen: false,
  appointmentData: null,
  
  openInvoiceDrawer: (appointmentData = null) => {
    set({ 
      isOpen: true, 
      appointmentData 
    })
  },
  
  closeInvoiceDrawer: () => {
    set({ 
      isOpen: false, 
      appointmentData: null 
    })
  }
}))
