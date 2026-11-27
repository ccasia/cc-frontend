export const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
export const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';

export const pressSx = {
  '@media (prefers-reduced-motion: no-preference)': {
    '&:active:not(:disabled)': { transform: 'scale(0.97)' },
  },
};

export const pressTransition = `transform 140ms ${EASE_OUT}, background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease`;

export const dialogEnterSx = {
  '@keyframes createDialogIn': {
    from: { transform: 'scale(0.98)' },
    to: { transform: 'scale(1)' },
  },
  animation: `createDialogIn 250ms ${EASE_OUT}`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
};

// A section that appears fades up a little, so a change reads as a change, not a jump
export const sectionInSx = {
  '@keyframes createSectionIn': {
    from: { opacity: 0, transform: 'translateY(4px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  '@keyframes createSectionFade': { from: { opacity: 0 }, to: { opacity: 1 } },
  animation: `createSectionIn 200ms ${EASE_OUT}`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'createSectionFade 200ms ease' },
};
