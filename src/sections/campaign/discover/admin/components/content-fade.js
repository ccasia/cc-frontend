import { keyframes } from '@mui/material/styles';

const fadeIn = keyframes`
  from { opacity: 0; }
`;

// Content that replaces a skeleton fades in. The skeleton already held its place, so nothing
// moves; opacity only, which also suits reduced motion. Same timing as the submission cards.
export const CONTENT_FADE_IN = {
  animation: `${fadeIn} 200ms cubic-bezier(0.23, 1, 0.32, 1) both`,
};
