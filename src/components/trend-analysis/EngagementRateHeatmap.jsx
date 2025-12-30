import React, { useMemo } from 'react';
import { Box, Typography, CircularProgress, Alert, Tooltip, Stack } from '@mui/material';
import dayjs from 'dayjs';
import { useGetEngagementHeatmap } from './use-get-engagement-heatmap';

/**
 * EngagementRateHeatmap Component
 * Displays a calendar-style heatmap of engagement rates over time
 * Days (Mon-Sun) on Y-axis, Weeks (1-6) on X-axis
 * 4-color scheme representing engagement rate intensity
 */
export const EngagementRateHeatmap = ({ campaignId, platform = 'All', weeks = 6 }) => {
  const { heatmapData, isLoading, error } = useGetEngagementHeatmap(campaignId, {
    platform,
    weeks,
  });

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Map display position to backend dayOfWeek index
  // Display row 0 (Mon) = backend index 1, Display row 1 (Tue) = backend index 2, etc.
  const dayOfWeekIndex = [5, 6, 0, 1, 2, 3, 4];

  const colorScales = heatmapData?.summary?.scales || null;

  const COLORS = {
    lowest: '#E6EFFF', // Lowest engagement
    lowMiddle: '#98BBFF', // Low-middle engagement
    highMiddle: '#1340FF', // High-middle engagement
    highest: '#01197B', // Highest engagement
  };

  // Color scale for engagement rates - use backend scales for ranges but hardcoded colors
  const getHeatColor = (rate) => {
    if (rate === null || rate === undefined) return '#EBEBF0'; // No data
    if (!colorScales) return '#EBEBF0'; // Fallback if scales not available

    // Check which scale range the rate falls into and return hardcoded color
    if (rate <= colorScales.lowest.max) return COLORS.lowest;
    if (rate <= colorScales.mediumLow.max) return COLORS.lowMiddle;
    if (rate <= colorScales.mediumHigh.max) return COLORS.highMiddle;
    return COLORS.highest;
  };

  // Process heatmap grid data - backend returns 2D grid already (weeks x days)
  const heatmapGrid = useMemo(() => {
    if (!heatmapData?.heatmap) return [];

    // Backend returns array of weeks, each containing 7 days
    return heatmapData.heatmap || [];
  }, [heatmapData?.heatmap]);

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Failed to load engagement heatmap data</Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!heatmapData || heatmapGrid.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">No engagement data available yet. Data updates daily.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'Aileron',
            fontWeight: 600,
            fontSize: 18,
            color: '#000',
            mb: 1,
          }}
        >
          Engagement Rate Heatmap
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#636366',
            fontSize: 14,
          }}
        >
          Last {weeks} weeks ({platform})
        </Typography>
      </Box>

      {/* Heatmap Container - Grid Layout */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          mb: 1,
        }}
      >
        {/* Y-axis: Day Labels */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {dayNames.map((day) => (
            <Box
              key={day}
              sx={{
                height: 37,
                display: 'flex',
                alignItems: 'center',
                fontSize: 13,
                fontWeight: 600,
                color: '#000',
                fontFamily: 'Aileron',
                minWidth: 40,
              }}
            >
              {day}
            </Box>
          ))}
        </Box>

        {/* Main Heatmap Grid */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Array.from({ length: 7 }).map((_, displayRow) => {
            // Map display row position to backend dayOfWeek index
            const backendDayOfWeek = dayOfWeekIndex[displayRow];

            return (
              <Box
                key={`day-row-${displayRow}`}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${weeks}, 1fr)`,
									gap: 1
                }}
              >
                {heatmapGrid.map((weekData, weekIndex) => {
                  // Use mapped dayOfWeek to access backend data
                  // backendDayOfWeek tells us which dayOfWeek to get from the data
                  const cell = weekData[backendDayOfWeek] || { date: null, engagementRate: null };
                  const isToday = cell?.date && dayjs(cell.date).isSame(dayjs(), 'day');

                  return (
                    <Tooltip
                      key={`${weekIndex}-${displayRow}`}
                      title={
                        cell?.date ? (
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {dayjs(cell.date).format('ddd, MMM D, YYYY')}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Engagement Rate:{' '}
                              {cell.engagementRate !== null
                                ? `${cell.engagementRate.toFixed(2)}%`
                                : 'No data'}
                            </Typography>
                            {cell.totalPosts && (
                              <Typography variant="caption" display="block">
                                Posts: {cell.totalPosts}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          'No data'
                        )
                      }
                      arrow
                    >
                      <Box
                        sx={{
                          minWidth: 67,
                          height: 37,
                          backgroundColor: getHeatColor(cell?.engagementRate),
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.15)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            zIndex: 10,
                          },
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Box>
            );
          })}

          {/* X-axis: Week Labels at Bottom */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${weeks}, 1fr)`,
							mb: 1
            }}
          >
            {Array.from({ length: weeks }).map((_, weekIndex) => (
              <Box
                key={`week-label-${weekIndex}`}
                sx={{
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#000',
                  fontFamily: 'Aileron',
                  height: 32,
                  minWidth: 67,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Week {weekIndex + 1}
              </Box>
            ))}
          </Box>

					{/* Legend */}
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
						}}
					>
						{/* Lowest */}
						<Box
							sx={{
								width: '100%',
								backgroundColor: COLORS.lowest,
								textAlign: 'center',
								py: 0.2
							}}
						>
							<Typography sx={{ fontSize: 12, color: '#48484A' }}>
								{colorScales?.lowest.label || '< 0%'}
							</Typography>
						</Box>

						{/* Low-Middle */}
						<Box
							sx={{
								width: '100%',
								textAlign: 'center',
								backgroundColor: COLORS.lowMiddle,
								py: 0.2
							}}
						>
							<Typography sx={{ fontSize: 12, color: '#48484A' }}>
								{colorScales?.mediumLow.label || '0% - 0%'}
							</Typography>
						</Box>

						{/* High-Middle */}
						<Box
							sx={{
								width: '100%',
								textAlign: 'center',
								backgroundColor: COLORS.highMiddle,
								py: 0.2
							}}
						>
							<Typography sx={{ fontSize: 12, color: '#E7E7E7' }}>
								{colorScales?.mediumHigh.label || '0% - 0%'}
							</Typography>
						</Box>

						{/* Highest */}
						<Box
							sx={{
								width: '100%',
								textAlign: 'center',
								backgroundColor: COLORS.highest,
								py: 0.2
							}}
						>
							<Typography sx={{ fontSize: 12, color: '#E7E7E7' }}>
								{colorScales?.highest.label || '> 0%'}
							</Typography>
						</Box>
					</Box>

					<Box display={'flex'} flex={1} flexDirection={'row'} justifyContent={'space-between'}>
						<Typography>Lowest Engagement</Typography>
						<Typography>Highest Engagement</Typography>
					</Box>
        </Box>
      </Box>


    </Box>
  );
};

export default EngagementRateHeatmap;
