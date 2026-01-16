import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import { Line, XAxis, YAxis, Legend, Tooltip, LineChart, ResponsiveContainer } from 'recharts';

import { Box, Alert, Typography, CircularProgress } from '@mui/material';

import { useGetTopCreatorsTrend } from './use-get-top-creators-trend';

const CREATOR_COLORS = ['#FFC702', '#FF9FBD', '#8A5AFE', '#0067D5', '#FF3500'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Custom tooltip to show views cleanly with color indicators
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
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
        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1, color: '#000' }}>
          {label}
        </Typography>
        {payload
          .filter((entry) => entry.value !== null)
          .sort((a, b) => b.value - a.value)
          .map((entry) => {
            let formattedValue;
            if (entry.value >= 1000000) {
              formattedValue = `${(entry.value / 1000000).toFixed(1)}M`;
            } else if (entry.value >= 1000) {
              formattedValue = `${(entry.value / 1000).toFixed(1)}K`;
            } else {
              formattedValue = entry.value.toLocaleString();
            }
            
            return (
              <Box
                key={entry.dataKey}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: entry.color,
                    flexShrink: 0,
                  }}
                />
                <Typography sx={{ fontSize: 12, color: '#000' }}>
                  {formattedValue} views
                </Typography>
              </Box>
            );
          })}
      </Box>
    );
  }
  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(PropTypes.object),
  label: PropTypes.string,
};

// Custom X-axis tick with day and date
const CustomXAxisTick = ({ x, y, payload, chartData }) => {
  const dayData = chartData?.weekData?.find(d => d.day === payload.value);
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

// Custom legend
const CustomLegend = ({ payload }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 0.5,
      columnGap: 1,
    }}
  >
    {payload?.map((entry, index) => (
      <Box
        key={`legend-${index}`}
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          ml: 3
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 28,
            backgroundColor: entry.color,
            flexShrink: 0,
          }}
        />
        <Typography fontSize={{ xs: 10, sm: 12 }} lineHeight={1.2}>
          {entry.value}
        </Typography>
      </Box>
    ))}
  </Box>
);

CustomLegend.propTypes = {
  payload: PropTypes.arrayOf(PropTypes.object),
};

/**
 * TopCreatorsLineChart Component
 * Displays a line chart of top 5 creators by views over the past 7 days
 * X-axis: Days of the week (Mon-Sun)
 * Y-axis: Views
 * 5 different colored lines for each creator
 */
export const TopCreatorsLineChart = ({ campaignId, platform = 'All', days = 7 }) => {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = last week, etc.

  // Fetch enough data to cover the current week plus offset weeks (fetch 30 days of historical data)
  const { trendData, isLoading, error } = useGetTopCreatorsTrend(campaignId, {
    platform,
    days: 30, // Fetch 30 days to support multiple weeks of pagination
  });

  // Process and prepare chart data
  const chartData = useMemo(() => {
    if (!trendData?.trend) return null;

    // Get all unique creators across all days and rank by total views
    const creatorViewsMap = new Map();
    
    trendData.trend.forEach((dayData) => {
      dayData.topCreators?.forEach((creator) => {
        const existing = creatorViewsMap.get(creator.userId) || { 
          userId: creator.userId, 
          userName: creator.userName, 
          totalViews: 0 
        };
        existing.totalViews += creator.views || 0;
        creatorViewsMap.set(creator.userId, existing);
      });
    });

    // Get top 5 creators by total views
    const top5Creators = Array.from(creatorViewsMap.values())
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 5);

    if (top5Creators.length === 0) return null;

    // Generate data for the past 7 days starting from Monday
    const today = dayjs();
    const currentDayOfWeek = today.day(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate days to subtract to get to last Monday
    let daysToMonday;
    if (currentDayOfWeek === 0) {
      // If today is Sunday, go back to previous Monday (6 days)
      daysToMonday = 6;
    } else {
      // Otherwise, go back to this week's Monday
      daysToMonday = currentDayOfWeek - 1;
    }

    const lastMonday = today.subtract(daysToMonday, 'day').subtract(weekOffset * 7, 'day').startOf('day');

    // Build chart data for each day of the week
    const weekData = [];
    
    for (let i = 0; i < 7; i += 1) {
      const date = lastMonday.add(i, 'day');
      const dateStr = date.format('YYYY-MM-DD');
      const dayName = DAY_NAMES[i];
      
      // Check if we have data for this date
      const daySnapshot = trendData.trend.find((d) => 
        dayjs(d.date).format('YYYY-MM-DD') === dateStr
      );

      const dataPoint = {
        day: dayName,
        date: dateStr,
        fullDate: date.toDate(),
      };

      // Add views for each of the top 5 creators
      top5Creators.forEach((creator, index) => {
        const creatorData = daySnapshot?.topCreators?.find(
          (c) => c.userId === creator.userId
        );
        dataPoint[`creator${index}`] = creatorData?.views || null;
      });

      weekData.push(dataPoint);
    }

    // Calculate min and max views for Y-axis domain
    let minViews = Infinity;
    let maxViews = -Infinity;
    
    weekData.forEach((dayData) => {
      top5Creators.forEach((creator, index) => {
        const views = dayData[`creator${index}`];
        if (views !== null && views !== undefined) {
          if (views < minViews) minViews = views;
          if (views > maxViews) maxViews = views;
        }
      });
    });

    // Add some padding to the domain
    const padding = (maxViews - minViews) * 0.1;
    const yMin = Math.floor(minViews);
    const yMax = Math.ceil(maxViews + padding);

    return {
      weekData,
      top5Creators,
      yMin: yMin === Infinity ? 0 : yMin,
      yMax: yMax === -Infinity ? 100 : yMax,
      mondayDate: lastMonday.toDate(),
    };
  }, [trendData, weekOffset]);

  if (error) {
    return (
      <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 2, height: '100%' }}>
        <Alert severity="error">Failed to load top creators trend data</Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        p: 4,
        bgcolor: 'background.neutral',
        borderRadius: 2,
        height: '100%',
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!chartData || chartData.top5Creators.length === 0) {
    return (
      <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 2, height: '100%' }}>
        <Alert severity="info">
          No creator data available yet. Data updates daily once creators have posted content.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
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
            Top 5 Creators in Views
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#636366',
              fontSize: 14,
            }}
          >
            Last {days} days ({platform})
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
        <LineChart
          data={chartData.weekData}
          margin={{ top: 30, right: 5, left: -10, bottom: 40 }}
        >
          
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
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
              return value;
            }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend
            content={<CustomLegend />}
            wrapperStyle={{ paddingTop: 20 }}
          />

          {/* Create a line for each of the top 5 creators */}
          {chartData.top5Creators.map((creator, index) => (
            <Line
              key={creator.userId}
              type="monotone"
              dataKey={`creator${index}`}
              name={creator.userName}
              stroke={CREATOR_COLORS[index]}
              strokeWidth={2}
              dot={{ fill: 'white', stroke: CREATOR_COLORS[index], strokeWidth: 2, r: 8 }}
              activeDot={{ fill: CREATOR_COLORS[index], stroke: CREATOR_COLORS[index], r: 8 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

TopCreatorsLineChart.propTypes = {
  campaignId: PropTypes.string.isRequired,
  platform: PropTypes.string,
  days: PropTypes.number,
};

export default TopCreatorsLineChart;
