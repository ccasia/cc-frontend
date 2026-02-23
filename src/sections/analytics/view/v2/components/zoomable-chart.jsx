import PropTypes from 'prop-types';

import { Box, Chip } from '@mui/material';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';

export default function ZoomableChart({ containerProps, isZoomed, resetZoom, children }) {
  return (
    <Box
      {...containerProps}
      sx={{
        position: 'relative',
        width: '100%',
        cursor: isZoomed ? 'grab' : 'default',
        touchAction: 'none',
        userSelect: 'none',
        '&:active': {
          cursor: isZoomed ? 'grabbing' : 'default',
        },
      }}
    >
      {isZoomed && (
        <Chip
          label="Reset zoom"
          icon={<ZoomOutMapIcon />}
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            resetZoom();
          }}
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            zIndex: 10,
            bgcolor: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(4px)',
            fontWeight: 600,
            fontSize: 11,
            '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
          }}
        />
      )}
      {children}
    </Box>
  );
}

ZoomableChart.propTypes = {
  containerProps: PropTypes.object.isRequired,
  isZoomed: PropTypes.bool.isRequired,
  resetZoom: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};
