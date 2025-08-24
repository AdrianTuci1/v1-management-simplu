import { create } from 'zustand';

export const useQuickActionsStore = create((set) => ({
  isOpen: false,
  openQuickActions: () => set({ isOpen: true }),
  closeQuickActions: () => set({ isOpen: false }),
  toggleQuickActions: () => set((state) => ({ isOpen: !state.isOpen })),
}));
