import { EASE_OUT } from './motion';

export const FIELD_HEIGHT = 50;

export const singleLineSx = { '& .MuiOutlinedInput-root': { height: FIELD_HEIGHT } };

export const multiLineSx = {
  '& .MuiOutlinedInput-root': { minHeight: FIELD_HEIGHT, padding: '13px 14px' },
  '& .MuiInputBase-inputMultiline': { fontSize: 14, lineHeight: '22px', color: '#212B36' },
};

const ERROR_ICON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.5h1.5v4.75h-1.5V4.5Zm0 6h1.5V12h-1.5v-1.5Z'/%3E%3C/svg%3E\")";

// One look for every field message: aligned with the label, with an icon on errors
export const helperTextSx = {
  '& .MuiFormHelperText-root, & [data-field-error] > .MuiTypography-caption': {
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    mx: 0,
    mt: 0.75,
    fontSize: 12,
    lineHeight: '16px',
  },
  '@keyframes fieldErrorIn': {
    from: { opacity: 0, transform: 'translateY(-4px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  '@keyframes fieldErrorFade': { from: { opacity: 0 }, to: { opacity: 1 } },
  '& .MuiFormHelperText-root.Mui-error, & [data-field-error="true"] > .MuiTypography-caption': {
    animation: `fieldErrorIn 200ms ${EASE_OUT}`,
    '@media (prefers-reduced-motion: reduce)': { animation: 'fieldErrorFade 200ms ease' },
  },
  '& .MuiFormHelperText-root.Mui-error::before, & [data-field-error="true"] > .MuiTypography-caption::before':
    {
      content: '""',
      flexShrink: 0,
      width: 14,
      height: 14,
      bgcolor: 'currentColor',
      mask: `${ERROR_ICON} center / contain no-repeat`,
    },
};
