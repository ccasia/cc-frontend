import PropTypes from 'prop-types';

import { LineChart } from '@mui/x-charts/LineChart';
import { Box, Typography } from '@mui/material';

import { useMediaKitResponsive } from 'src/hooks/use-media-kit-responsive';

import { processEngagementRateData, getMonthsData, chartStyles } from 'src/utils/media-kit-utils';

/**
 * Reusable Engagement Rate Chart Component
 * Used by both Instagram and TikTok media kit components
 */
const EngagementRateChart = ({ 
  dataSource, 
  platform = 'instagram',
  containerStyle = {},
  showDataLabels = false,
  customData = null,
}) => {
  const { isMobile, isTablet } = useMediaKitResponsive();

  // Use custom data if provided, otherwise process from dataSource
  const chartData = customData || processEngagementRateData(dataSource, platform);
  const monthsData = getMonthsData(dataSource);

  // Responsive dimensions
  const chartWidth = isMobile 
    ? (isTablet ? 310 : 208) 
    : 450;
  const chartHeight = isMobile 
    ? (isTablet ? 200 : 160) 
    : 227;
  
  const margins = isMobile 
    ? {
        left: 25,
        right: 15,
        top: 15,
        bottom: isTablet ? 35 : 25,
      }
    : { left: 30, right: 15, top: 30, bottom: 60 };

  return (
    <Box sx={{ position: 'relative', ...containerStyle }}>
      <LineChart
        series={[
          {
            curve: 'linear',
            data: chartData,
            color: '#1340FF',
            valueFormatter: (value) => `${value.toFixed(2)}%`,
          },
        ]}
        width={chartWidth}
        height={chartHeight}
        margin={margins}
        xAxis={[
          {
            scaleType: 'band',
            data: monthsData,
            hideTooltip: true,
            tickLabelStyle: {
              fontSize: isMobile ? (isTablet ? 12 : 10) : 12,
              fill: 'black',
              fontStyle: 'italic',
            },
            axisLine: false,
            tickLine: false,
          },
        ]}
        yAxis={[
          {
            min: 0,
            max: 3,
            tickNumber: 4,
            hideTooltip: true,
            tickLabelStyle: {
              fontSize: isMobile ? (isTablet ? 13 : 11) : 13,
              fill: '#333',
              fontWeight: 500,
            },
            axisLine: false,
            tickLine: false,
          },
        ]}
        grid={{ horizontal: true, vertical: false }}
        slotProps={{
          legend: { hidden: true },
          tooltip: {
            trigger: 'item',
            formatter: (params) => `${params.value.toFixed(2)}%`,
          },
          axisHighlight: { x: 'none', y: 'none' },
          mark: {
            style: {
              fill: '#1340FF',
              stroke: '#1340FF',
              strokeWidth: 2,
              r: isMobile ? (isTablet ? 6 : 5) : 6,
              cursor: 'pointer',
            },
          },
        }}
        sx={{
          ...chartStyles.lineChart,
          '& .MuiMarkElement-root': {
            fill: '#1340FF !important',
            stroke: '#1340FF !important',
            strokeWidth: '2px !important',
            r: `${isMobile ? (isTablet ? 6 : 5) : 6}px !important`,
            cursor: 'pointer !important',
            transition: 'all 0.2s ease-in-out !important',
          },
          '& .MuiMarkElement-root:hover, & .MuiMarkElement-root:active': {
            fill: '#0F2FE6 !important',
            stroke: '#0F2FE6 !important',
            strokeWidth: '3px !important',
            r: `${isMobile ? (isTablet ? 8 : 7) : 8}px !important`,
            transform: 'scale(1.1) !important',
          },
        }}
      />

      {/* Optional Data Labels */}
      {showDataLabels && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {chartData.map((value, index) => {
            // Chart plotting area calculations
            const plotAreaLeft = margins.left;
            const plotAreaTop = margins.top;
            const plotAreaWidth = chartWidth - margins.left - margins.right;
            const plotAreaHeight = chartHeight - margins.top - margins.bottom;

            // Calculate exact position for each data point
            const bandWidth = plotAreaWidth / chartData.length;
            const xPosition = plotAreaLeft + bandWidth * 0.5 + index * bandWidth;

            // Calculate Y position based on data value (0-3 scale)
            const normalizedValue = value / 3;
            const dataPointY = plotAreaTop + plotAreaHeight - (normalizedValue * plotAreaHeight);
            const labelY = dataPointY - (isMobile ? 18 : 22);

            return (
              <Typography
                key={index}
                sx={{
                  position: 'absolute',
                  top: labelY,
                  left: xPosition,
                  fontSize: isMobile ? (isTablet ? 12 : 10) : 14,
                  color: '#000',
                  fontWeight: 500,
                  fontFamily: 'Aileron, sans-serif',
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  lineHeight: 1,
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                  minWidth: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {value.toFixed(2)}%
              </Typography>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

EngagementRateChart.propTypes = {
  dataSource: PropTypes.object.isRequired,
  platform: PropTypes.oneOf(['instagram', 'tiktok']),
  containerStyle: PropTypes.object,
  showDataLabels: PropTypes.bool,
  customData: PropTypes.arrayOf(PropTypes.number),
};

export default EngagementRateChart;