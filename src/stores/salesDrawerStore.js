import { create } from 'zustand';

export const useSalesDrawerStore = create((set) => ({
  isOpen: false,
  appointmentData: null,
  openSalesDrawer: (data = null) => set({ isOpen: true, appointmentData: data }),
  closeSalesDrawer: () => set({ isOpen: false, appointmentData: null }),
  toggleSalesDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
}));
