import { create } from 'zustand';

export const useAIAssistantStore = create((set) => ({
  isOpen: false,
  openAIAssistant: () => set({ isOpen: true }),
  closeAIAssistant: () => set({ isOpen: false }),
  toggleAIAssistant: () => set((state) => ({ isOpen: !state.isOpen })),
}));
