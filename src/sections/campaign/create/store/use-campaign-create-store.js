import { create } from 'zustand';

// UI state shared between the campaign create form (form-v2) and its step components.
const initialState = {
  // Bumped on every Next press that fails validation, so a step can re-highlight whatever is
  // blocking it (e.g. the Finalise step's "Link a package" prompt) on each press
  failedNextCount: 0,
};

export const useCampaignCreateStore = create(() => ({ ...initialState }));

export const registerFailedNext = () =>
  useCampaignCreateStore.setState((state) => ({ failedNextCount: state.failedNextCount + 1 }));

export const resetCampaignCreate = () => useCampaignCreateStore.setState({ ...initialState });
