import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

import { useMediaKitResponsive } from 'src/hooks/use-media-kit-responsive';

/**
 * Reusable Chart Container Component
 * Provides consistent styling for analytics charts in media kit components
 */
const ChartContainer = ({ 
  title, 
  children, 
  containerStyle = {},
}) => {
  const { isMobile, isTablet } = useMediaKitResponsive();

  const containerDimensions = isMobile 
    ? {
        minWidth: isTablet ? '350px' : '240px',
        maxWidth: isTablet ? '350px' : '240px',
        height: isTablet ? '300px' : '240px',
        p: isTablet ? 3 : 2,
      }
    : {
        flex: 1,
        width: 'auto',
        minWidth: '400px',
        minHeight: '311px',
        height: '311px',
        p: 3,
      };

  // Calculate responsive values
  const fontSize = isMobile ? (isTablet ? '16px' : '14px') : '18px';
  const topPosition = isMobile ? (isTablet ? 16 : 12) : 24;
  const leftPosition = isMobile ? (isTablet ? 20 : 16) : 28;

  const titleStyles = {
    color: 'black',
    fontWeight: 600,
    fontSize,
    position: 'absolute',
    top: topPosition,
    left: leftPosition,
    ...(isMobile && { zIndex: 2 }),
  };

  const chartAreaStyles = {
    position: 'absolute',
    ...(isMobile ? {
      bottom: isTablet ? 20 : 16,
      left: isTablet ? 20 : 16,
      right: isTablet ? 20 : 16,
      top: isTablet ? 50 : 40,
    } : {
      bottom: 24,
      left: 28,
      right: 28,
      top: title ? 90 : 60, // Adjust top based on whether there's a title
    }),
  };

  return (
    <Box
      sx={{
        backgroundColor: '#E7E7E7',
        borderRadius: isMobile ? 2 : 3,
        position: 'relative',
        ...(isMobile && {
          flex: '0 0 auto',
          scrollSnapAlign: 'center',
        }),
        ...containerDimensions,
        ...containerStyle,
      }}
    >
      {title && (
        <Typography
          variant="subtitle2"
          sx={titleStyles}
        >
          {title}
        </Typography>
      )}
      
      <Box sx={chartAreaStyles}>
        {children}
      </Box>
    </Box>
  );
};

ChartContainer.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  containerStyle: PropTypes.object,
};

export default ChartContainer;