import { create } from 'zustand';

export const useAdmins = create((set) => ({
  admins: [],
  setAdmin: (data) => set((state) => ({ admins: [...data] })),
}));
