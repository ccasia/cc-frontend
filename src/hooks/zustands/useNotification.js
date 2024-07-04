import { create } from 'zustand';

export const useNotification = create((set) => ({
  notification: [],
  setNotification: (data) => set((state) => ({ notification: [...data] })),
  // addNotification: (data) => set((state) => ({ notification: [state.notification, ...data] })),
}));
