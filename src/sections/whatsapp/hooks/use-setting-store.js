import { create } from 'zustand';

const useSettingStore = create((set) => ({
  data: {
    isFeatureEnabled: false,
    phoneNumberId: '',
    accessToken: '',
    templateName: '',
  },
  toggleFeature: () =>
    set((state) => ({
      data: {
        ...state.data,
        isFeatureEnabled: !state.data.isFeatureEnabled,
      },
    })),
}));

export default useSettingStore;
