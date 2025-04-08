import { create } from 'zustand';

export const useSocialMediaData = create((set) => ({
  instagram: {},
  tiktok: {},
  setInstagram: (instagram) => set(() => ({ instagram })),
  setTiktok: (tiktok) => set(() => ({ tiktok })),
}));
