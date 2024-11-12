import { create } from 'zustand';

export const useXero = create((set) => ({
  contacts: [],
  setContacts: (contacts) => set((state) => ({ contacts })),
}));
