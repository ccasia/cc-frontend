// Step-indicator vocabulary for the create-campaign flow.
//
// The form renders these as its header indicator; the drafts page reuses them to
// say how far a saved draft got. Keep them here so the two never drift.

export const backSectionLabels = ['General', 'Objective', 'Audience', 'Logistics', 'Finalise'];

export const frontSectionLabels = ['Additional 1', 'Additional 2'];

// Determine if we're in back section (steps 0-7) or front section (steps 8-9)
export const isInFrontSection = (activeStep) => activeStep >= 8;
export const isInBackSection = (activeStep) => activeStep <= 7;

// Get which indicator is active in back section
export const getBackSectionIndicatorIndex = (internalStep) => {
  if (internalStep >= 7) return 5; // Next Steps
  if (internalStep >= 6) return 4; // Finalise
  if (internalStep >= 3) return 3; // Logistics (includes sub-steps 3, 4, 5)
  return internalStep; // 0, 1, 2 map directly
};

// Get which indicator is active in front section (0 for Details 1, 1 for Details 2)
export const getFrontSectionIndicatorIndex = (internalStep) => {
  if (internalStep >= 9) return 1; // Additional Details 2
  return 0; // Additional Details 1
};

// Full indicator names in order. "Next Steps" is part of the back section but the
// form renders it outside `backSectionLabels`, so it is spelled out here.
const indicatorLabels = [
  ...backSectionLabels,
  'Next Steps',
  'Additional Details 1',
  'Additional Details 2',
];

const BACK_SECTION_INDICATORS = 6;

/** Position of `activeStep` in the indicator sequence, 0-based. */
const getIndicatorIndex = (activeStep) =>
  isInFrontSection(activeStep)
    ? BACK_SECTION_INDICATORS + getFrontSectionIndicatorIndex(activeStep)
    : getBackSectionIndicatorIndex(activeStep);

/** The tab a draft was last on, e.g. "Objective". */
export const getDraftStepLabel = (activeStep) =>
  indicatorLabels[getIndicatorIndex(Number(activeStep) || 0)] || indicatorLabels[0];

/**
 * How far through the flow a draft got, 0-100. Measured against the indicators
 * the creator actually sees, so a draft without additional details can still
 * reach 100%.
 */
export const getDraftProgress = (activeStep, showAdditionalDetails) => {
  const total = showAdditionalDetails ? indicatorLabels.length : BACK_SECTION_INDICATORS;
  const index = Math.min(getIndicatorIndex(Number(activeStep) || 0), total - 1);
  return Math.round(((index + 1) / total) * 100);
};
