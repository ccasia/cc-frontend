import { produce } from 'immer';
import { create } from 'zustand';

export const usePcrStore = create(() => ({
  campaignId: '',
  isEditMode: { type: '', state: false },
  isAiRegenerating: {},
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

export const setIsAiRegenerating = (section, val) => {
  usePcrStore.setState(
    produce((draft) => {
      draft.isAiRegenerating[section] = val;
    })
  );
};
