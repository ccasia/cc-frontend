import { create } from 'zustand';

/**
 * Numbers an admin entered on a failed scrape, by posting link id, until the server's copy
 * catches up. Shared by the row and its fix button.
 */
export const useScrapeDraftsStore = create(() => ({ drafts: {} }));

export const setScrapeDraft = (postingUrlId, entered) =>
  useScrapeDraftsStore.setState((state) => ({
    drafts: { ...state.drafts, [postingUrlId]: entered },
  }));

export const clearScrapeDraft = (postingUrlId) =>
  useScrapeDraftsStore.setState((state) => {
    if (!(postingUrlId in state.drafts)) return state;
    const drafts = { ...state.drafts };
    delete drafts[postingUrlId];
    return { drafts };
  });
