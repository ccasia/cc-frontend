import { create } from 'zustand';

export const useHandleThread = create((set) => ({
  threadId: '',
  setThreadId: (data) => set(() => ({ threadId: data })),
}));
