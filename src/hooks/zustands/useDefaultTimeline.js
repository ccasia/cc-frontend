import { create } from 'zustand';

export const useDefaultTimeline = create((set) => ({
  defaultTimelines: [],
  setDefaultTimeline: (data) => set(() => data),
}));
