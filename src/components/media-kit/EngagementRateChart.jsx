import PropTypes from 'prop-types';
import { useState } from 'react';

import { LineChart } from '@mui/x-charts/LineChart';
import { Box, Typography } from '@mui/material';

import { useMediaKitResponsive } from 'src/hooks/use-media-kit-responsive';

import { processEngagementRateData, getMonthsData } from 'src/utils/media-kit-utils';

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
  const [hoveredColumn, setHoveredColumn] = useState(null);

  // Use custom data if provided, otherwise process from dataSource
  const chartData = customData || processEngagementRateData(dataSource, platform);
  const monthsData = getMonthsData(dataSource);

  // Calculate dynamic Y-axis max based on actual data
  const maxDataValue = Math.max(...chartData, 0);
  const yAxisMax = Math.ceil(maxDataValue * 1.2);
  const yAxisMin = 0;

  // Responsive dimensions
  const chartWidth = isMobile 
    ? (isTablet ? 310 : 208) 
    : 450;
  const chartHeight = isMobile 
    ? (isTablet ? 200 : 160) 
    : 227;
  
  const margins = isMobile
    ? {
        left: 10,
        right: 15,
        top: 15,
        bottom: isTablet ? 35 : 25,
      }
    : { left: 10, right: 15, top: 5, bottom: 60 };

  // Handle mouse move to track hovered column
  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;

    // Calculate plot area
    const plotAreaLeft = margins.left;
    const plotAreaRight = chartWidth - margins.right;

    // Check if mouse is within plot area
    if (x >= plotAreaLeft && x <= plotAreaRight) {
      const plotAreaWidth = chartWidth - margins.left - margins.right;
      const bandWidth = plotAreaWidth / chartData.length;
      const columnIndex = Math.floor((x - plotAreaLeft) / bandWidth);

      if (columnIndex >= 0 && columnIndex < chartData.length) {
        setHoveredColumn(columnIndex);
      } else {
        setHoveredColumn(null);
      }
    } else {
      setHoveredColumn(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredColumn(null);
  };

  return (
    <Box
      sx={{ position: 'relative', ...containerStyle }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Column hover shading */}
      {hoveredColumn !== null && (() => {
        const bandWidth = (chartWidth - margins.left - margins.right) / chartData.length;
        const centerX = margins.left + (hoveredColumn * bandWidth) + (bandWidth / 2);

        // Responsive shade width
        const shadeWidth = isMobile ? (isTablet ? 50 : 40) : 60;

        // Responsive positioning and sizing
        const topOffset = isMobile ? (isTablet ? -22 : 0) : -25;
        const textTopOffset = isMobile ? (isTablet ? -17 : 5) : -20;
        const fontSize = isMobile ? (isTablet ? 12 : 11) : 14;
        const shadeHeight = chartHeight - margins.bottom + (isMobile ? (isTablet ? 20 : 30) : 58);

        const engagementValue = chartData[hoveredColumn];

        return (
          <>
            <Box
              sx={{
                position: 'absolute',
                left: centerX - (shadeWidth / 2),
                top: topOffset,
                width: shadeWidth,
                height: shadeHeight,
                borderRadius: 1,
                backgroundColor: 'rgba(19, 64, 255, 0.1)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            <Typography
              sx={{
                position: 'absolute',
                left: centerX,
                top: textTopOffset,
                transform: 'translateX(-50%)',
                fontSize,
                fontWeight: 600,
                color: '#1340FF',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              {engagementValue.toFixed(1)}%
            </Typography>
          </>
        );
      })()}

      <LineChart
        series={[
          {
            curve: 'linear',
            data: chartData,
            color: '#1340FF',
            valueFormatter: (value) => `${value.toFixed(1)}%`,
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
            },
          },
        ]}
        yAxis={[
          {
            min: yAxisMin,
            max: yAxisMax,
            tickNumber: 0,
            hideTooltip: true,
            axisLine: false,
            tickLine: false,
          },
        ]}
        grid={{ horizontal: true, vertical: false }}
        slotProps={{
          legend: { hidden: true },
          tooltip: { trigger: 'none' },
          axisHighlight: { x: 'none', y: 'none' },
          mark: {
            style: {
              fill: '#1340FF',
              stroke: '#1340FF',
              strokeWidth: 2,
              r: isMobile ? (isTablet ? 6 : 5) : 6,
            },
          },
        }}
        sx={{
          '& .MuiChartsAxis-line': {
            display: 'none',
          },
          '& .MuiChartsAxis-tick': {
            display: 'none',
          },
          '& .MuiChartsAxis-tickLabel': {
            fontStyle: 'italic',
          },
          '& .MuiChartsAxis-left': {
            display: 'none !important',
          },
          '& .MuiChartsAxis-left .MuiChartsAxis-tickLabel': {
            display: 'none !important',
          },
          '& .MuiChartsGrid-line': {
            stroke: 'rgba(0, 0, 26, 0.3)',
            strokeWidth: 1,
          },
          '& .MuiChartsGrid-root .MuiChartsGrid-line:not(:first-child)': {
            display: 'none',
          },
          '& .MuiLineElement-root': {
            strokeWidth: 1,
          },
          '& .MuiMarkElement-root': {
            fill: '#1340FF !important',
            stroke: '#1340FF !important',
            strokeWidth: '2px !important',
            r: `${isMobile ? (isTablet ? 6 : 5) : 6}px !important`,
            cursor: 'default !important',
            pointerEvents: 'auto !important',
          },
          '& .MuiChartsTooltip-mark': {
            display: 'none !important',
          },
          '& .MuiChartsAxisHighlight-root': {
            display: 'none !important',
          },
        }}
      />

      {/* Optional Data Labels */}
      {showDataLabels && (
        <Box
          sx={{
            bgcolor: 'pink',
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

            // Calculate Y position based on data value (dynamic scale)
            const normalizedValue = (value - yAxisMin) / (yAxisMax - yAxisMin);
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
                {value.toFixed(1)}%
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