import { create } from 'zustand';

export const useShortlistedCreators = create((set) => ({
  shortlistedCreators: [],
  showPopup: false,
  popupMessage: '',

  addCreators: (item, user) => {
  const isCreator = user?.role?.toLowerCase() === 'creator';
  
  return set(() => ({
    shortlistedCreators: Array.isArray(item) ? [...item] : [item],
    showPopup: isCreator,
    popupMessage: 'Congratulations! You have been shortlisted.',
    
  }));
},


  removeCreators: (id) => set((state) => ({
    shortlistedCreators: state.shortlistedCreators.filter((item) => item.id !== id),
  })),

  addUGCCredits: (id, credits) => set((state) => ({
    shortlistedCreators: state.shortlistedCreators.map((item) =>
      item.id === id ? { ...item, credits } : item
    ),
  })),

  reset: () => set(() => ({ shortlistedCreators: [] })),

  hidePopup: () => set(() => ({ showPopup: false })),
}));
