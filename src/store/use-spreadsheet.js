import { create } from 'zustand';

export const useSpreadSheet = create(() => ({
  url: '',
  copyDialog: false,
}));

export const setUrl = (val) => useSpreadSheet.setState(() => ({ url: val }));

export const setOpenCopyDialog = (val) => useSpreadSheet.setState(() => ({ copyDialog: val }));
