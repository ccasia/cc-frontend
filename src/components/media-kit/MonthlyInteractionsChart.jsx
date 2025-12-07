import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

import { useMediaKitResponsive } from 'src/hooks/use-media-kit-responsive';

import { processMonthlyInteractionsData } from 'src/utils/media-kit-utils';

/**
 * Reusable Monthly Interactions Bar Chart Component
 * Used by both Instagram and TikTok media kit components
 */
const MonthlyInteractionsChart = ({ 
  dataSource, 
  containerStyle = {},
  customData = null,
}) => {
  const { isMobile, isTablet } = useMediaKitResponsive();

  // Use custom data if provided, otherwise process from dataSource
  const chartData = customData || processMonthlyInteractionsData(dataSource);
  
  // Calculate max value for scaling
  const maxValue = Math.max(...chartData.map(item => item.interactions), 1);
  
  // Responsive dimensions
  const maxBarHeight = isMobile ? (isTablet ? 140 : 110) : 160;
  const barWidth = isMobile ? (isTablet ? '40px' : '36px') : '60px';
  const borderRadius = isMobile ? (isTablet ? '20px' : '18px') : '30px';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'end',
        justifyContent: isMobile ? 'center' : 'space-between',
        gap: isMobile ? (isTablet ? 1.5 : 1) : 2,
        height: '100%',
        ...containerStyle,
      }}
    >
      {chartData.map((data, index) => {
        const barHeight = ((data.interactions || 0) / maxValue) * maxBarHeight;
        const minHeight = isMobile ? '20px' : '25px';

        return (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              ...(isMobile ? {
                width: isTablet ? '60px' : '50px',
                gap: 0.8,
                height: '100%',
                justifyContent: 'flex-end',
              } : {
                flex: 1,
                gap: 1,
              }),
            }}
          >
            {/* Value above bar */}
            <Typography
              sx={{
                fontSize: isMobile ? (isTablet ? 13 : 10) : 16,
                fontWeight: 400,
                color: 'black',
                fontFamily: 'Aileron, sans-serif',
                textAlign: 'center',
                lineHeight: 1,
                ...(isMobile && { mb: 0.5 }),
              }}
            >
              {(data.interactions || 0).toLocaleString()}
            </Typography>

            {/* Bar */}
            <Box
              sx={{
                width: barWidth,
                height: `${Math.max(barHeight, parseInt(minHeight, 10))}px`,
                backgroundColor: '#1340FF',
                borderRadius,
                transition: 'all 0.3s ease',
                minHeight,
                boxShadow: isMobile 
                  ? '0 2px 8px rgba(19, 64, 255, 0.3)'
                  : '0 4px 12px rgba(19, 64, 255, 0.3)',
              }}
            />

            {/* Month label */}
            <Typography
              sx={{
                fontSize: isMobile ? (isTablet ? 12 : 9) : 12,
                fontWeight: 400,
                color: 'black',
                fontStyle: 'italic',
                fontFamily: 'Aileron, sans-serif',
                textAlign: 'center',
                mt: isMobile ? 0.5 : 1,
              }}
            >
              {data.month}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

MonthlyInteractionsChart.propTypes = {
  dataSource: PropTypes.object.isRequired,
  containerStyle: PropTypes.object,
  customData: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired,
      interactions: PropTypes.number.isRequired,
    })
  ),
};

export default MonthlyInteractionsChart;