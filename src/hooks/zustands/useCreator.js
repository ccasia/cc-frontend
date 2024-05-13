import { create } from 'zustand';

export const useCreator = create((set) => ({
  email: '',
  creators: [],
  setEmail: (data) => set(() => ({ email: data })),
  setCreators: (data) => set(() => ({ creators: [...data] })),
}));
