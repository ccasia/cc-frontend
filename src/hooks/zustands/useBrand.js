import { create } from 'zustand';

export const useBrand = create((set) => ({
  brand: [],
  setBrand: (data) => set((state) => ({ brand: [...data] })),
}));
