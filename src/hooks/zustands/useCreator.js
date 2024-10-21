import { create } from 'zustand';

export const useCreator = create((set) => ({
  email: '',
  creators: [],
  creator: [],
  setEmail: (data) => set(() => ({ email: data })),
  setCreators: (data) => set(() => ({ creators: [...data] })),
  setCreator: (data) => set(() => ({ creator: data })),
}));
