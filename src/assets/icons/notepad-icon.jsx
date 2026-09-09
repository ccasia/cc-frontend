import { memo } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

/**
 * Notepad outline icon. Strokes with `currentColor` so it follows the colour of
 * whatever it sits in -- including on hover.
 */
function NotepadIcon({ size = 24, ...other }) {
  return (
    <Box
      component="svg"
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      sx={{ flexShrink: 0, display: 'block' }}
      {...other}
    >
      <path
        d="M9 10H15M9 14H13M12 4.5V2.5M16 4.5V2.5M8 4.5V2.5M4.5 3.5H19.5V20.5H4.5V3.5Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}

NotepadIcon.propTypes = {
  size: PropTypes.number,
};

export default memo(NotepadIcon);
