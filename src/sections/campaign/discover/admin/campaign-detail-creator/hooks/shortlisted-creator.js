import { create } from 'zustand';

export const useShortlistedCreators = create((set) => ({
  shortlistedCreators: [],
  addCreators: (item) => set(() => ({ shortlistedCreators: item })),
  removeCreators: (id) =>
    set((state) => ({
      shortlistedCreators: state.shortlistedCreators.filter((item) => item.id !== id),
    })),
  addUGCCredits: (id, credits) =>
    set((state) => ({
      shortlistedCreators: state.shortlistedCreators.map((item) =>
        item.id === id ? { ...item, credits } : item
      ),
    })),

  reset: () => set(() => ({ shortlistedCreators: [] })),
}));
