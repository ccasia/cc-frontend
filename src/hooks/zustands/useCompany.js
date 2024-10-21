import { create } from 'zustand';


export const useCompany = create((set) => ({
  company: [],
  setCompany: (data) => set((state) => ({ company: [...data] })),
}));
