import { create } from 'zustand';

export const useCreator = create((set) => ({
  email: '',
  setEmail: (data) => set(() => ({ email: data })),
}));
