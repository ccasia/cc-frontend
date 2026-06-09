import { create } from 'zustand';

export const useAnalyticsStore = create((set) => ({
  selectedPlatform: 'ALL',
  reportState: 'generate',
  showReportPage: false,
  showAddCreatorForm: false,
  formState: {
    isValid: false,
    isFormComplete: false,
    isSubmitting: false,
  },
  deleteModalOpen: false,
  entryToDelete: null,
}));

export const setSelectedPlatform = (platform) =>
  useAnalyticsStore.setState(() => ({ selectedPlatform: platform }));

export const setReportState = (reportState) => useAnalyticsStore.setState(() => ({ reportState }));

export const setShowReportPage = () =>
  useAnalyticsStore.setState((state) => ({ showReportPage: !state.showReportPage }));

export const setShowAddCreatorForm = () =>
  useAnalyticsStore.setState((state) => ({ showAddCreatorForm: !state.showAddCreatorForm }));

export const setFormState = (data) =>
  useAnalyticsStore.setState((state) => ({
    formState: { ...state.formState, ...data },
  }));

export const setDeleteModalOpen = () =>
  useAnalyticsStore.setState((state) => ({ deleteModalOpen: !state.deleteModalOpen }));

export const setEntryToDelete = (data) =>
  useAnalyticsStore.setState(() => ({ entryToDelete: data }));
