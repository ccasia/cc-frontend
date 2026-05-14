import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

import { Box, Alert, Tooltip, Typography, CircularProgress } from '@mui/material';

import { useGetPostDailyTrend } from './use-get-post-daily-trend';

/**
 * PostEngagementRateHeatmap
 * Per-post variant of EngagementRateHeatmap. Same calendar grid layout
 * (Mon-Sun rows × N-week columns, latest week rightmost) but the data is
 * the daily engagement-rate series for ONE post rather than a campaign-wide
 * aggregate. Used in the content performance report.
 */

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const COLORS = {
  lowest: '#E6EFFF',
  lowMiddle: '#98BBFF',
  highMiddle: '#1340FF',
  highest: '#01197B',
  empty: '#EBEBF0',
};

const DEFAULT_SCALES = {
  lowest: { min: 0, max: 8, label: '< 8%' },
  mediumLow: { min: 8, max: 12, label: '8% - 12%' },
  mediumHigh: { min: 12, max: 18, label: '12% - 18%' },
  highest: { min: 18, max: 100, label: '> 18%' },
};

// Linear-interpolated percentile over a sorted ascending array.
const getPercentile = (sorted, percentile) => {
  if (sorted.length === 0) return 0;
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

// Mirrors the backend's calculateDynamicScales (in trendController) so the
// per-post heatmap colours partition the same way the campaign-wide one does.
const computeScales = (rates) => {
  if (rates.length === 0) return DEFAULT_SCALES;
  const sorted = [...rates].sort((a, b) => a - b);
  const q1 = getPercentile(sorted, 25);
  const q2 = getPercentile(sorted, 50);
  const q3 = getPercentile(sorted, 75);
  const max = sorted[sorted.length - 1];
  return {
    lowest: { min: 0, max: Number(q1.toFixed(2)), label: `< ${q1.toFixed(1)}%` },
    mediumLow: {
      min: Number(q1.toFixed(2)),
      max: Number(q2.toFixed(2)),
      label: `${q1.toFixed(1)}% - ${q2.toFixed(1)}%`,
    },
    mediumHigh: {
      min: Number(q2.toFixed(2)),
      max: Number(q3.toFixed(2)),
      label: `${q2.toFixed(1)}% - ${q3.toFixed(1)}%`,
    },
    highest: {
      min: Number(q3.toFixed(2)),
      max: Number((max + 1).toFixed(2)),
      label: `> ${q3.toFixed(1)}%`,
    },
  };
};

export const PostEngagementRateHeatmap = ({ campaignId, submissionId, postUrl, weeks = 6 }) => {
  const days = weeks * 7;
  const { trendData, isLoading, error } = useGetPostDailyTrend(campaignId, {
    submissionId,
    postUrl,
    days,
  });

  // Build a 6 (or N) × 7 grid where index 0 = oldest week, last = latest.
  // Always anchor on today's week so the rightmost column is the current
  // week; cells past today render as empty (same color used for missing
  // data), which gives the "shaded up to today" look.
  const { heatmapGrid, scales } = useMemo(() => {
    const rows = trendData ?? [];
    const rates = rows.map((r) => r.engagementRate).filter((v) => v !== null && v > 0);
    const dynamicScales = computeScales(rates);

    // Index snapshots by YYYY-MM-DD for O(1) cell lookup
    const byDate = new Map();
    rows.forEach((r) => {
      byDate.set(dayjs(r.snapshotDate).format('YYYY-MM-DD'), r);
    });

    const anchorDate = dayjs();
    const anchorDow = anchorDate.day(); // 0 = Sun
    const daysFromMonday = anchorDow === 0 ? 6 : anchorDow - 1;
    const latestMonday = anchorDate.subtract(daysFromMonday, 'day').startOf('day');

    const grid = [];
    for (let w = 0; w < weeks; w += 1) {
      const weekMonday = latestMonday.subtract(weeks - 1 - w, 'week');
      const weekData = [];
      for (let d = 0; d < 7; d += 1) {
        const cellDate = weekMonday.add(d, 'day');
        const snapshot = byDate.get(cellDate.format('YYYY-MM-DD'));
        weekData.push({
          date: cellDate.toDate(),
          engagementRate: snapshot?.engagementRate ?? null,
          views: snapshot?.views ?? null,
          hasData: !!snapshot,
        });
      }
      grid.push(weekData);
    }

    return { heatmapGrid: grid, scales: dynamicScales };
  }, [trendData, weeks]);

  const getHeatColor = (rate) => {
    if (rate === null || rate === undefined) return COLORS.empty;
    if (rate <= scales.lowest.max) return COLORS.lowest;
    if (rate <= scales.mediumLow.max) return COLORS.lowMiddle;
    if (rate <= scales.mediumHigh.max) return COLORS.highMiddle;
    return COLORS.highest;
  };

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Failed to load post engagement heatmap</Alert>
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

  if (!trendData || trendData.length === 0) {
    return (
      <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 2, height: '100%' }}>
        <Alert severity="info">No engagement data for this post yet. Data updates daily.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, md: 3 } }}>
        <Typography
          sx={{
            fontFamily: 'Aileron',
            fontWeight: 600,
            fontSize: 24,
            color: '#000',
          }}
        >
          Engagement Rate Heatmap
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.5, md: 1 } }}>
          {DAY_NAMES.map((day) => (
            <Box
              key={day}
              sx={{
                height: { xs: 28, md: 37 },
                display: 'flex',
                alignItems: 'center',
                fontSize: { xs: 10, md: 13 },
                fontWeight: 600,
                color: '#000',
                fontFamily: 'Aileron',
                minWidth: { xs: 30, md: 40 },
              }}
            >
              {day}
            </Box>
          ))}
        </Box>

        {/* Main Heatmap Grid */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.5, md: 1 } }}>
          {Array.from({ length: 7 }).map((_, displayRow) => (
            <Box
              key={`day-row-${displayRow}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${weeks}, 1fr)`,
                gap: { xs: 0.5, md: 1 },
              }}
            >
              {heatmapGrid.map((weekData, weekIndex) => {
                const cell = weekData[displayRow] || { date: null, engagementRate: null };

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
                          {cell.views !== null && (
                            <Typography variant="caption" display="block">
                              Views: {cell.views.toLocaleString()}
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
                        minWidth: { xs: 40, sm: 55, md: 67 },
                        height: { xs: 28, md: 37 },
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
          ))}

          {/* X-axis: Week Labels at Bottom */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${weeks}, 1fr)`,
              gap: { xs: 0.5, md: 1 },
              mb: 1,
            }}
          >
            {Array.from({ length: weeks }).map((_, weekIndex) => (
              <Box
                key={`week-label-${weekIndex}`}
                sx={{
                  textAlign: 'center',
                  fontSize: { xs: 10, md: 13 },
                  fontWeight: 600,
                  color: '#000',
                  fontFamily: 'Aileron',
                  height: { xs: 24, md: 32 },
                  minWidth: { xs: 40, sm: 55, md: 67 },
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
            <Box
              sx={{
                width: '100%',
                backgroundColor: COLORS.lowest,
                textAlign: 'center',
                py: 0.2,
              }}
            >
              <Typography sx={{ fontSize: { xs: 9, md: 12 }, color: '#48484A' }}>
                {scales.lowest.label}
              </Typography>
            </Box>

            <Box
              sx={{
                width: '100%',
                textAlign: 'center',
                backgroundColor: COLORS.lowMiddle,
                py: 0.2,
              }}
            >
              <Typography sx={{ fontSize: { xs: 9, md: 12 }, color: '#48484A' }}>
                {scales.mediumLow.label}
              </Typography>
            </Box>

            <Box
              sx={{
                width: '100%',
                textAlign: 'center',
                backgroundColor: COLORS.highMiddle,
                py: 0.2,
              }}
            >
              <Typography sx={{ fontSize: { xs: 9, md: 12 }, color: '#E7E7E7' }}>
                {scales.mediumHigh.label}
              </Typography>
            </Box>

            <Box
              sx={{
                width: '100%',
                textAlign: 'center',
                backgroundColor: COLORS.highest,
                py: 0.2,
              }}
            >
              <Typography sx={{ fontSize: { xs: 9, md: 12 }, color: '#E7E7E7' }}>
                {scales.highest.label}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" flex={1} flexDirection="row" justifyContent="space-between">
            <Typography sx={{ fontSize: { xs: 10, md: 14 } }}>Lowest Engagement</Typography>
            <Typography sx={{ fontSize: { xs: 10, md: 14 } }}>Highest Engagement</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

PostEngagementRateHeatmap.propTypes = {
  campaignId: PropTypes.string.isRequired,
  submissionId: PropTypes.string,
  postUrl: PropTypes.string,
  weeks: PropTypes.number,
};

export default PostEngagementRateHeatmap;
