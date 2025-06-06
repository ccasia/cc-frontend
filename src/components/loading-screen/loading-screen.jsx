import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import { keyframes } from '@mui/system';

// animation
const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// ----------------------------------------------------------------------

export default function LoadingScreen({ sx, ...other }) {
  return (
    <Box
      sx={{
        px: 5,
        width: 1,
        flexGrow: 1,
        minHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
      {...other}
    >
      <Box
        component="img"
        src="/logo/newlogo.svg"
        sx={{
          width: 48,
          height: 48,
          filter: 'invert(1)',
          animation: `${pulse} 0.5s ease-in-out infinite, ${rotate} 0.5s linear infinite`,
        }}
      />
    </Box>
  );
}

LoadingScreen.propTypes = {
  sx: PropTypes.object,
};
