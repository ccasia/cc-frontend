import * as React from 'react';

import Box from '@mui/material/Box';

/**
 * Renders the Next Steps icon, switching between light and dark SVGs
 * depending on whether the step is active.
 *
 * @param {object} props
 * @param {boolean} props.active - If true, renders the light icon; otherwise, renders the dark icon.
 * @param {number|string} [props.size=28] - Icon size in px.
 * @returns {JSX.Element}
 */

function NextStepsIcon({ active, size = 28, ...rest }) {
  // Use public path for SVGs
  const iconSrc = active
    ? '/assets/icons/navbar/ic_next_steps.svg'
    : '/assets/icons/navbar/ic_next_steps_dark.svg';
  return (
    <Box
      sx={{
        width: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 0,
        m: 0,
      }}
      {...rest}
    >
      <img src={iconSrc} width={size} height={size} alt="Next Steps" style={{ display: 'block' }} />
    </Box>
  );
};

export default memo(NextStepsIcon);
