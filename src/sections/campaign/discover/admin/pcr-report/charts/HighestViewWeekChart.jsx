import { useMemo } from 'react';
import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

import { getMetricValue } from 'src/utils/socialMetricsCalculator';

const HighestViewWeekChart = ({ filteredInsightsData, filteredSubmissions, campaign }) => {
  const weekViewsData = useMemo(() => {

    if (!filteredInsightsData || filteredInsightsData.length === 0) {
      return [];
    }

    const actualPostDates = filteredInsightsData
      .filter(insight => insight.video?.timestamp || insight.video?.create_time)
      .map(insight => new Date(insight.video.timestamp || insight.video.create_time).getTime());

    const earliestActualPost = actualPostDates.length > 0 ? Math.min(...actualPostDates) : Date.now();
    const campaignStart = new Date(campaign?.startDate || earliestActualPost);


    const weeklyData = {};

    filteredInsightsData.forEach((insightData) => {
      if (insightData.insight && insightData.video) {
        const actualPostTimestamp = insightData.video.timestamp || insightData.video.create_time;

        if (actualPostTimestamp) {
          const postDate = new Date(actualPostTimestamp);
          const views = getMetricValue(insightData.insight, 'views');

          const daysSinceStart = Math.floor((postDate - campaignStart) / (24 * 60 * 60 * 1000));
          const weekNumber = Math.min(6, Math.max(1, Math.floor(daysSinceStart / 7) + 1));


          if (!weeklyData[weekNumber]) {
            weeklyData[weekNumber] = {
              weekNumber,
              totalViews: 0,
              posts: [],
            };
          }

          weeklyData[weekNumber].totalViews += views;
          weeklyData[weekNumber].posts.push({
            date: postDate,
            views,
          });
        }
      }
    });


    let highestWeek = null;
    let maxWeekViews = 0;

    Object.values(weeklyData).forEach((week) => {
      if (week.totalViews > maxWeekViews) {
        maxWeekViews = week.totalViews;
        highestWeek = week;
      }
    });


    if (!highestWeek) {
      return [];
    }

    const firstPostDate = new Date(Math.min(...highestWeek.posts.map(p => new Date(p.date).getTime())));
    const dayOfWeek = firstPostDate.getDay();

    // Calculate Monday of that week
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStartDate = new Date(firstPostDate);
    weekStartDate.setDate(firstPostDate.getDate() - daysToMonday);
    weekStartDate.setHours(0, 0, 0, 0);


    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekData = [];

    const totalWeekViews = highestWeek.totalViews;

    const distributionPattern = [0.12, 0.15, 0.18, 0.22, 0.15, 0.10, 0.08];

    for (let i = 0; i < 7; i += 1) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(currentDate.getDate() + i);
      currentDate.setHours(0, 0, 0, 0);

      // Calculate if this day is on or after the first post in this week
      const firstPostDateStart = new Date(firstPostDate);
      firstPostDateStart.setHours(0, 0, 0, 0);
      const isAfterFirstPost = currentDate >= firstPostDateStart;

      let dailyViews = 0;

      // Only distribute views to days after the first post
      if (isAfterFirstPost) {
        dailyViews = Math.round(totalWeekViews * distributionPattern[i]);
      }

      weekData.push({
        day: dayNames[i],
        date: `(${currentDate.getDate()}/${currentDate.getMonth() + 1})`,
        views: dailyViews,
        dailyViews,
      });
    }

    return weekData;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredInsightsData, filteredSubmissions, campaign]);

  // If no data, show message
  if (!weekViewsData || weekViewsData.length === 0) {
    return (
      <Box sx={{ width: '100%', p: 4, textAlign: 'center' }}>
        <Typography sx={{ color: '#6B7280', fontSize: '16px' }}>
          No view data available for the campaign yet.
        </Typography>
      </Box>
    );
  }

    const chartWidth = 1400;
    const chartHeight = 480;
    const padding = { top: 80, right: 60, bottom: 150, left: 60 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxViews = Math.max(...weekViewsData.map(d => d.views));
  const minViews = Math.min(...weekViewsData.map(d => d.views));
  const viewsRange = maxViews - minViews || 1;

  // Generate path points
  const points = weekViewsData.map((d, i) => {
    const x = padding.left + (i / (weekViewsData.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - ((d.views - minViews) / viewsRange) * innerHeight;
    return { x, y, ...d };
  });

  // Create SVG path
  const pathData = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');

  return (
    <Box sx={{ width: '100%', p: -4 }}>
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
        {/* Line path */}
        <path
          d={pathData}
          fill="none"
          stroke="#2D7A7B"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points and labels */}
        {points.map((point, i) => {
          // Place labels below the data points
          const labelY = point.y + 40;
          const labelX = point.x;

          return (
            <g key={i}>
              {/* Outer circle (white) */}
              <circle
                cx={point.x}
                cy={point.y}
                r="12"
                fill="white"
                stroke="#2D7A7B"
                strokeWidth="4"
              />

              {/* Value label below point - white fill with green outline and shadow */}
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fill="white"
                fontSize="24"
                fontWeight="700"
                fontFamily="Aileron"
                stroke="#2D7A7B"
                strokeWidth="2"
                paintOrder="stroke"
                style={{
                  filter: 'drop-shadow(4px 5px 3px #026D54) drop-shadow(2px 3px 8px #026D54)'
                }}
              >
                {point.views}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {points.map((point, i) => (
          <g key={`label-${i}`}>
            {/* Day name */}
            <text
              x={point.x}
              y={chartHeight - 75}
              textAnchor="middle"
              fill="#231F20"
              fontSize="18"
              fontWeight="400"
              fontFamily="Aileron"
            >
              {point.day}
            </text>
            {/* Date */}
            <text
              x={point.x}
              y={chartHeight - 45}
              textAnchor="middle"
              fill="#231F20"
              fontSize="18"
              fontWeight="400"
              fontFamily="Aileron"
            >
              {point.date}
            </text>
          </g>
        ))}
      </svg>
    </Box>
  );
};

HighestViewWeekChart.propTypes = {
  filteredInsightsData: PropTypes.array.isRequired,
  filteredSubmissions: PropTypes.array.isRequired,
  campaign: PropTypes.shape({
    startDate: PropTypes.string,
  }),
};

export default HighestViewWeekChart;
