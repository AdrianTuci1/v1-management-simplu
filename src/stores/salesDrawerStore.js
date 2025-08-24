import { create } from 'zustand';

export const useSalesDrawerStore = create((set) => ({
  isOpen: false,
  openSalesDrawer: () => set({ isOpen: true }),
  closeSalesDrawer: () => set({ isOpen: false }),
  toggleSalesDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
}));
