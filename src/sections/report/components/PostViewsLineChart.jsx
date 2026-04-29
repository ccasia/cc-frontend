import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import { Line, XAxis, YAxis, Tooltip, LineChart, ResponsiveContainer } from 'recharts';

import { Box, Alert, Typography, CircularProgress } from '@mui/material';

import { useGetPostDailyTrend } from './use-get-post-daily-trend';

/**
 * PostViewsLineChart
 * Per-post variant of TopCreatorsLineChart. Renders a single creator's post
 * over a Mon-Sun week of daily views, with the same pagination chevrons that
 * step backward through history. Used in the content performance report.
 */

const LINE_COLOR = '#FFC702';
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const formatViews = (value) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  if (entry.value === null || entry.value === undefined) return null;

  return (
    <Box
      sx={{
        backgroundColor: 'white',
        border: '1px solid #E0E0E0',
        borderRadius: 1,
        p: 1.5,
        boxShadow: 2,
      }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1, color: '#000' }}>{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: entry.color,
            flexShrink: 0,
          }}
        />
        <Typography sx={{ fontSize: 12, color: '#000' }}>{formatViews(entry.value)} views</Typography>
      </Box>
    </Box>
  );
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(PropTypes.object),
  label: PropTypes.string,
};

const CustomXAxisTick = ({ x, y, payload, chartData }) => {
  const dayData = chartData?.weekData?.find((d) => d.day === payload.value);
  const dateFormatted = dayData?.fullDate ? dayjs(dayData.fullDate).format('DD/MM') : '';

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={20}
        textAnchor="middle"
        fill="#636366"
        fontSize={12}
        fontFamily="Aileron"
        fontWeight={600}
      >
        {payload.value}
      </text>
      <text
        x={0}
        y={0}
        dy={40}
        textAnchor="middle"
        fill="#636366"
        fontSize={10}
        fontFamily="Aileron"
      >
        ({dateFormatted})
      </text>
    </g>
  );
};

CustomXAxisTick.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  payload: PropTypes.object,
  chartData: PropTypes.object,
};

export const PostViewsLineChart = ({
  campaignId,
  submissionId,
  postUrl,
  label = 'Daily Views',
}) => {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = last week, etc.

  // Pull a long enough window to support pagination. 6 weeks = 42 days mirrors
  // the heatmap's default and gives a few weeks of history to step back into.
  const { trendData, isLoading, error } = useGetPostDailyTrend(campaignId, {
    submissionId,
    postUrl,
    days: 42,
  });

  const chartData = useMemo(() => {
    const rows = trendData ?? [];

    // Index by YYYY-MM-DD for cell lookup
    const byDate = new Map();
    rows.forEach((r) => {
      byDate.set(dayjs(r.snapshotDate).format('YYYY-MM-DD'), r);
    });

    // Anchor on this week's Monday (Asia agnostic — uses local browser time).
    // Then back off by weekOffset.
    const today = dayjs().startOf('day');
    const dow = today.day();
    const daysToMonday = dow === 0 ? 6 : dow - 1;
    const thisMonday = today.subtract(daysToMonday, 'day').startOf('day');
    const visibleMonday = thisMonday.subtract(weekOffset, 'week');

    // Always render all 7 day-of-week slots so the X-axis is consistent
    // (Mon → Sun). For days that haven't happened yet (current week, after
    // today) we leave views as null — combined with connectNulls={false}
    // on the Line, this makes the line stop visually at today.
    const weekData = [];
    for (let i = 0; i < 7; i += 1) {
      const date = visibleMonday.add(i, 'day');
      const isFuture = date.isAfter(today, 'day');
      const snapshot = byDate.get(date.format('YYYY-MM-DD'));
      weekData.push({
        day: DAY_NAMES[i],
        date: date.format('YYYY-MM-DD'),
        fullDate: date.toDate(),
        views: isFuture ? null : snapshot?.views ?? null,
      });
    }

    // Y-axis domain — only consider populated days
    let minViews = Infinity;
    let maxViews = -Infinity;
    weekData.forEach((d) => {
      if (d.views !== null && d.views !== undefined) {
        if (d.views < minViews) minViews = d.views;
        if (d.views > maxViews) maxViews = d.views;
      }
    });

    const padding = (maxViews - minViews) * 0.1;
    const yMin = minViews === Infinity ? 0 : Math.floor(minViews);
    const yMax = maxViews === -Infinity ? 100 : Math.ceil(maxViews + padding);

    return {
      weekData,
      yMin,
      yMax,
      mondayDate: visibleMonday.toDate(),
      hasAnyData: weekData.some((d) => d.views !== null && d.views !== undefined),
    };
  }, [trendData, weekOffset]);

  if (error) {
    return (
      <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 2, height: '100%' }}>
        <Alert severity="error">Failed to load post views trend</Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          bgcolor: 'background.neutral',
          borderRadius: 2,
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!trendData || trendData.length === 0) {
    return (
      <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 2, height: '100%' }}>
        <Alert severity="info">No views data for this post yet. Data updates daily.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography
            sx={{
              fontFamily: 'Aileron',
              fontWeight: 600,
              fontSize: 24,
              color: '#000',
            }}
          >
            Daily Views
          </Typography>
        </Box>

        {/* Week Pagination */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            onClick={() => setWeekOffset(weekOffset + 1)}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              '&:hover': { opacity: 0.7 },
            }}
          >
            <Typography sx={{ fontSize: 20, color: '#000', fontWeight: 600 }}>‹</Typography>
          </Box>

          <Typography
            sx={{
              fontSize: 16,
              color: '#000',
              fontFamily: 'Aileron',
              fontWeight: 600,
              minWidth: 70,
              textAlign: 'center',
            }}
          >
            {chartData?.mondayDate ? dayjs(chartData.mondayDate).format('DD/MM/YY') : ''}
          </Typography>

          <Box
            onClick={() => weekOffset > 0 && setWeekOffset(weekOffset - 1)}
            sx={{
              cursor: weekOffset > 0 ? 'pointer' : 'not-allowed',
              opacity: weekOffset > 0 ? 1 : 0.3,
              display: 'flex',
              alignItems: 'center',
              '&:hover': { opacity: weekOffset > 0 ? 0.7 : 0.3 },
            }}
          >
            <Typography sx={{ fontSize: 20, color: '#000', fontWeight: 600 }}>›</Typography>
          </Box>
        </Box>
      </Box>

      {/* Line Chart */}
      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={chartData.weekData} margin={{ top: 30, right: 5, left: -10, bottom: 40 }}>
          <XAxis
            dataKey="day"
            tick={<CustomXAxisTick chartData={chartData} />}
            axisLine={{ stroke: 'none' }}
            tickLine={{ stroke: 'none' }}
            height={50}
            padding={{ left: 10, right: 20 }}
          />

          <YAxis
            domain={[chartData.yMin, chartData.yMax]}
            ticks={[chartData.yMin, chartData.yMax]}
            tick={{ fill: '#000', fontSize: 15, fontFamily: 'Aileron' }}
            axisLine={{ stroke: 'none' }}
            tickLine={{ stroke: 'none' }}
            tickFormatter={formatViews}
          />

          <Tooltip content={<CustomTooltip />} />

          <Line
            type="monotone"
            dataKey="views"
            name={label}
            stroke={LINE_COLOR}
            strokeWidth={2}
            dot={{ fill: 'white', stroke: LINE_COLOR, strokeWidth: 2, r: 8 }}
            activeDot={{ fill: LINE_COLOR, stroke: LINE_COLOR, r: 8 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

PostViewsLineChart.propTypes = {
  campaignId: PropTypes.string.isRequired,
  submissionId: PropTypes.string,
  postUrl: PropTypes.string,
  label: PropTypes.string,
};

export default PostViewsLineChart;
