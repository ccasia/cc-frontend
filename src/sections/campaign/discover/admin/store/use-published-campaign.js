import { create } from 'zustand';

// The campaign that was just published. While it is set, the campaign list animates
// the new card in and the other cards move over to make room. The list clears it
// once the new card has played its entrance.
export const usePublishedCampaign = create(() => ({ publishedId: null }));

export const markPublished = (id) => usePublishedCampaign.setState({ publishedId: id ?? null });

export const clearPublished = () => usePublishedCampaign.setState({ publishedId: null });
