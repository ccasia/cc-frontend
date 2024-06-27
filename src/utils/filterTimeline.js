export const filterTimelineAdmin = (timeline) => ({
  filterPitch: timeline?.filterPitch,
  shortlistCreator: timeline?.shortlistCreator,
  feedBackFirstDraft: timeline?.feedBackFirstDraft,
  feedBackFinalDraft: timeline?.feedBackFinalDraft,
  qc: timeline?.qc,
});

export const filterTimelineCreator = (timeline) => ({});
