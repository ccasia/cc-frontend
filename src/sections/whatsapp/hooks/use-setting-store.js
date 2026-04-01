/**
 * @typedef {Object} SettingData
 * @property {boolean} isFeatureEnabled
 * @property {string} phoneNumberId
 * @property {string} accessToken
 * @property {string} templateName
 * @property {string} businessAccountId
 */

/**
 * @typedef {Object} SettingStore
 * @property {SettingData} data
 * @property {() => void} toggleFeature
 * @property {(name: keyof SettingData, value: SettingData[keyof SettingData]) => void} setData
 */

import { create } from 'zustand';

const useSettingStore = create(
  /** @param {(partial: Partial<SettingStore>) => void} set */
  (set) => ({
    data: {
      isFeatureEnabled: false,
      phoneNumberId: '',
      accessToken: '',
      templateName: '',
      businessAccountId: '',
    },
    toggleFeature: () =>
      set((state) => ({
        data: {
          ...state.data,
          isFeatureEnabled: !state.data.isFeatureEnabled,
        },
      })),
    setData: (name, value) => set((state) => ({ data: { ...state.data, [name]: value } })),
  })
);

export default useSettingStore;
