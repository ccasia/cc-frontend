import { produce } from 'immer';
import { create } from 'zustand';

export const usePcrStore = create(() => ({
  campaignId: '',
  isEditMode: { type: '', state: false },

  showEducatorCard: false,
  showThirdCard: false,
  showFourthCard: false,
  showFifthCard: false,
}));

export const setCampaignId = (campaignId) => usePcrStore.setState(() => ({ campaignId }));

export const setIsEditMode = ({ type, state }) =>
  usePcrStore.setState(
    produce((draft) => {
      const { isEditMode } = draft;

      isEditMode.type = type;
      isEditMode.state = state;
    })
  );

export const setShowEducatorCard = (val) => {
  usePcrStore.setState((state) => ({
    showEducatorCard: val ? Boolean(val) : !state.showEducatorCard,
  }));
};

export const setShowThirdCard = (val) => {
  usePcrStore.setState((state) => ({
    showThirdCard: val ? Boolean(val) : !state.showThirdCard,
  }));
};

export const setShowFourthCard = (val) => {
  usePcrStore.setState((state) => ({
    showFourthCard: val ? Boolean(val) : !state.showFourthCard,
  }));
};

export const setShowFifthCard = (val) => {
  usePcrStore.setState((state) => ({
    setShowFifthCard: val ? Boolean(val) : !state.showFifthCard,
  }));
};
