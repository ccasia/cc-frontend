import { create } from 'zustand';

export const usePublicUrl = create(() => ({
  publicUrl: '',
  password: '',
  openModal: false,
}));

export const setOpenModal = (val) => usePublicUrl.setState(() => ({ openModal: val }));
export const setPublicUrl = (val) => usePublicUrl.setState(() => ({ publicUrl: val }));
export const setPassword = (val) => usePublicUrl.setState(() => ({ password: val }));
