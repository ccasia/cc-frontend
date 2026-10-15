import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useTabs = create()(
  persist(
    () => ({
      currentTab: 'overview',
    }),
    {
      name: 'currentTab',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const setCurrentTab = (val) => useTabs.setState(() => ({ currentTab: val }));
