import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import { Box, ButtonBase } from '@mui/material';

// ----------------------------------------------------------------------

/**
 * The platform's call-to-action button: a solid (or white) face sitting on a 3px lip.
 * Pressing pushes the face all the way down onto the lip (the lip disappears while
 * held), like a physical key. Space for the lip is reserved below the button, so pressing never
 * shifts the layout.
 *
 * - variant "dark" | "blue": filled, white text
 * - variant "white": white face, 1px border + lip in #E7E7E7; `color` sets the text
 *   (e.g. #1ABF66 approve, #D4321C request a change)
 * - size "small" (28) | "medium" (40) | "large" (44, fits a `hint` second line)
 * - hint: optional second line under the label ("marks as completed")
 *
 * Every other prop (onClick, disabled, type, aria-*) goes to the underlying ButtonBase.
 */

// Every style shows the same 3px band under the face. White's 1px bottom border is the same
// colour as its lip and reads as part of it, so its shadow is 1px shorter to match.
const LIP = 3;
const BORDER = 1;
// Lip left showing while pressed (0 = the face lands fully on it)
const LIP_WHEN_PRESSED = 0;

const VARIANTS = {
  dark: { bg: '#3A3A3C', hover: '#48484A', lip: '#202021', text: '#FFFFFF' },
  blue: { bg: '#1340FF', hover: '#2B54FF', lip: '#0A238C', text: '#FFFFFF' },
  white: { bg: '#FFFFFF', hover: '#F9F9F9', lip: '#E7E7E7', text: '#3A3A3C', border: '#E7E7E7' },
};

const DISABLED = {
  filled: { bg: '#B0B0B1', lip: '#9E9E9F', text: '#FFFFFF' },
  white: { bg: '#F7F7F7', lip: '#E7E7E7', text: '#B0B0B1', border: '#E7E7E7' },
};

const SIZES = {
  small: { height: 28, px: 1.25, fontSize: 12, borderRadius: 1 },
  medium: { height: 40, px: 2, fontSize: 14, borderRadius: 1.25 },
  large: { height: 44, px: 2, fontSize: 14, borderRadius: 1.25 },
};

const lipShadow = (depth, color) => `0 ${depth}px 0 0 ${color}`;

const CtaButton = forwardRef(
  (
    { variant = 'dark', size = 'medium', color, hint, fullWidth = false, children, sx, ...other },
    ref
  ) => {
    const palette = VARIANTS[variant] ?? VARIANTS.dark;
    const disabled = variant === 'white' ? DISABLED.white : DISABLED.filled;
    const { height, px, fontSize, borderRadius } = SIZES[size] ?? SIZES.medium;
    const textColor = color ?? palette.text;
    const lip = palette.border ? LIP - BORDER : LIP;
    const press = lip - LIP_WHEN_PRESSED;

    return (
      <ButtonBase
        ref={ref}
        disableRipple
        sx={{
          flexDirection: 'column',
          justifyContent: 'center',
          gap: hint ? 0.125 : 0,
          minHeight: height,
          px,
          mb: `${lip}px`,
          width: fullWidth ? 1 : 'auto',
          flexShrink: fullWidth ? 1 : 0,
          borderRadius,
          fontFamily: 'inherit',
          fontSize,
          fontWeight: 600,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          color: textColor,
          bgcolor: palette.bg,
          border: palette.border ? `${BORDER}px solid ${palette.border}` : 'none',
          boxShadow: lipShadow(lip, palette.lip),
          transition: 'transform 80ms ease, box-shadow 80ms ease, background-color 150ms ease',
          '&:hover': { bgcolor: palette.hover },
          // Pressed: the face drops onto the lip
          '&:active': {
            transform: `translateY(${press}px)`,
            boxShadow: lipShadow(LIP_WHEN_PRESSED, palette.lip),
          },
          '&.Mui-focusVisible': { outline: '2px solid #1340FF', outlineOffset: 2 },
          '&.Mui-disabled': {
            color: disabled.text,
            bgcolor: disabled.bg,
            boxShadow: lipShadow(lip, disabled.lip),
            ...(palette.border && { border: `${BORDER}px solid ${disabled.border}` }),
          },
          ...sx,
        }}
        {...other}
      >
        {children}
        {hint && (
          <Box component="span" sx={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>
            {hint}
          </Box>
        )}
      </ButtonBase>
    );
  }
);

CtaButton.propTypes = {
  variant: PropTypes.oneOf(['dark', 'blue', 'white']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.string,
  hint: PropTypes.node,
  fullWidth: PropTypes.bool,
  children: PropTypes.node,
  sx: PropTypes.object,
};

export default CtaButton;
