import { useMemo, useRef, useState, useEffect, useCallback } from 'react';

import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import RemoveIcon from '@mui/icons-material/Remove';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Box, Chip, Popover, Rating, Stack, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';

import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import Iconify from 'src/components/iconify';
import useChartZoom from 'src/hooks/use-chart-zoom';
import useGetCreatorSatisfaction from 'src/hooks/use-get-creator-satisfaction';

import { useFilteredData, useFilterLabel } from '../date-filter-context';
import ChartCard from '../components/chart-card';
import ZoomableChart from '../components/zoomable-chart';
import ChartAxisTooltip from '../components/chart-axis-tooltip';
import { CHART_SX, CHART_GRID, CHART_MARGIN, CHART_HEIGHT, TICK_LABEL_STYLE, getTrendProps } from '../chart-config';

const AMBER = '#FFAB00';
const BAR_BG = '#F4F6F8';

export default function CreatorNpsChart() {
  const { trend: trendData, overall } = useGetCreatorSatisfaction();
  const { averageRating, totalResponses, distribution } = overall;
  const filtered = useFilteredData(trendData);
  const chipLabel = useFilterLabel();

  // Trim trailing null months so the line doesn't trail into future
  const trimmed = useMemo(() => {
    let lastIdx = filtered.length - 1;
    while (lastIdx >= 0 && filtered[lastIdx].avgRating == null) lastIdx -= 1;
    return filtered.slice(0, lastIdx + 1);
  }, [filtered]);

  const ratings = useMemo(() => trimmed.map((d) => d.avgRating != null ? Number(d.avgRating) : null), [trimmed]);
  const months = useMemo(() => trimmed.map((d) => d.month), [trimmed]);
  const indices = useMemo(() => months.map((_, i) => i), [months]);

  const { xAxis: xDomain, yDomain, isZoomed, resetZoom, containerProps, setYSources } = useChartZoom(trimmed.length);

  useEffect(() => { setYSources([ratings]); }, [setYSources, ratings]);

  // Get latest and previous non-null values for trend arrow
  const nonNullRatings = useMemo(() => ratings.filter((r) => r != null), [ratings]);
  const latest = nonNullRatings.length > 0 ? nonNullRatings[nonNullRatings.length - 1] : undefined;
  const prev = nonNullRatings.length >= 2 ? nonNullRatings[nonNullRatings.length - 2] : undefined;
  const change = prev != null && latest != null ? Math.round((latest - prev) * 10) / 10 : null;
  const isNeutral = change == null || change === 0;
  const isUp = !isNeutral && change > 0;
  const trend = getTrendProps(isNeutral, isUp);
  let TrendIcon = RemoveIcon;
  if (!isNeutral) TrendIcon = isUp ? ArrowDropUpIcon : ArrowDropDownIcon;

  const { min: xMin, max: xMax } = xDomain;
  const xAxisConfig = useMemo(() => [{
    scaleType: 'linear',
    data: indices,
    min: xMin,
    max: xMax,
    valueFormatter: (v) => {
      const i = Math.round(v);
      return i >= 0 && i < months.length ? months[i] : '';
    },
    tickMinStep: 1,
    tickLabelStyle: TICK_LABEL_STYLE,
  }], [xMin, xMax, months, indices]);

  // Hover popover state
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);

  const handleEnter = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  }, []);

  const handleLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  // 5-star down to 1-star
  const reversed = [...distribution].reverse();
  const maxCount = Math.max(...distribution.map((d) => d.count));

  const headerRight = (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Stack
        component={RouterLink}
        href={paths.dashboard.feedback.root}
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{
          textDecoration: 'none',
          cursor: 'pointer',
          '&:hover': { opacity: 0.6 },
          transition: 'opacity 0.15s',
        }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#333', borderBottom: '1.5px dotted #333', lineHeight: 1.4 }}>
          View Feedback
        </Typography>
        <ArrowOutwardIcon sx={{ fontSize: 13, color: '#333' }} />
      </Stack>

      <Chip label={chipLabel} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: 11, height: 22, color: '#919EAB', borderColor: '#E8ECEE' }} />

      {/* Hoverable rating value */}
      <Stack
        ref={anchorRef}
        direction="row"
        alignItems="center"
        spacing={0.5}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        sx={{ cursor: 'default' }}
      >
        <Iconify icon="mdi:star" width={18} sx={{ color: AMBER }} />
        <Stack
          direction="row"
          alignItems="baseline"
          sx={{
            borderBottom: '1.5px dashed #E8ECEE',
            pb: 0.25,
            transition: 'border-color 0.2s',
            '&:hover': { borderColor: AMBER },
          }}
        >
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>
            {latest != null ? Number(latest).toFixed(1) : '—'}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#999', lineHeight: 1, ml: 0.3 }}>
            /5
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" alignItems="center" sx={{ bgcolor: trend.bg, borderRadius: 0.75, px: 0.5, py: 0.25 }}>
        <TrendIcon sx={{ fontSize: trend.iconSize, color: trend.color, ml: -0.25 }} />
        <Typography variant="caption" sx={{ fontWeight: 600, color: trend.color, fontSize: '0.7rem', mr: 0.25 }}>
          {isNeutral ? '0' : `${isUp ? '+' : ''}${change}`}
        </Typography>
      </Stack>
    </Stack>
  );

  return (
    <ChartCard
      title="Creator Satisfaction"
      icon={StarOutlineIcon}
      subtitle="Average rating and distribution"
      headerRight={headerRight}
    >
      {/* Hover popover with rating breakdown */}
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            onMouseEnter: handleEnter,
            onMouseLeave: handleLeave,
            sx: {
              mt: 1,
              p: 2,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #F0F2F4',
              minWidth: 280,
            },
          },
        }}
        disableRestoreFocus
        sx={{ pointerEvents: 'none', '& .MuiPopover-paper': { pointerEvents: 'auto' } }}
      >
        {/* Rating + stars */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography sx={{ fontSize: 32, fontWeight: 700, lineHeight: 1, color: '#333' }}>
            {averageRating}
            <Typography component="span" sx={{ fontSize: 16, fontWeight: 500, color: '#999', ml: 0.3 }}>
              /5
            </Typography>
          </Typography>
          <Stack spacing={0.25}>
            <Rating value={averageRating} precision={0.1} readOnly size="small" sx={{ color: AMBER }} />
            <Typography sx={{ color: '#919EAB', fontSize: '0.7rem', fontWeight: 500 }}>
              {totalResponses} responses
            </Typography>
          </Stack>
        </Stack>

        {/* Divider */}
        <Box sx={{ height: '1px', bgcolor: '#F0F2F4', my: 1.5 }} />

        {/* Distribution */}
        <Stack spacing={0.75}>
          {reversed.map((item) => {
            const pct = (item.count / totalResponses) * 100;
            const barWidth = (item.count / maxCount) * 100;

            return (
              <Stack key={item.rating} direction="row" alignItems="center" spacing={0.75}>
                <Stack direction="row" alignItems="center" spacing={0.25} sx={{ flexShrink: 0, width: 26 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#666', lineHeight: 1 }}>
                    {item.rating}
                  </Typography>
                  <Iconify icon="mdi:star" width={12} sx={{ color: AMBER }} />
                </Stack>
                <Box sx={{ flex: 1, height: 8, borderRadius: 0.75, bgcolor: BAR_BG, overflow: 'hidden' }}>
                  <Box sx={{ width: `${barWidth}%`, height: '100%', borderRadius: 0.75, bgcolor: AMBER, transition: 'width 0.3s ease' }} />
                </Box>
                <Typography sx={{ color: '#666', fontWeight: 600, fontSize: '0.7rem', minWidth: 56, textAlign: 'right', flexShrink: 0, lineHeight: 1 }}>
                  {item.count}
                  <Typography component="span" sx={{ color: '#919EAB', fontWeight: 500, fontSize: '0.6rem', ml: 0.3 }}>
                    ({pct.toFixed(0)}%)
                  </Typography>
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Popover>

      {/* Line chart */}
      <ZoomableChart containerProps={containerProps} isZoomed={isZoomed} resetZoom={resetZoom}>
        <LineChart
          series={[{ data: ratings, label: 'Avg Rating', color: AMBER, area: true, curve: 'linear', connectNulls: true, valueFormatter: (val) => val != null ? `${val} / 5` : 'No data' }]}
          xAxis={xAxisConfig}
          yAxis={[{ ...yDomain, valueFormatter: (val) => `${val}`, tickLabelStyle: TICK_LABEL_STYLE }]}
          height={CHART_HEIGHT}
          margin={CHART_MARGIN}
          grid={CHART_GRID}
          tooltip={{ trigger: 'axis' }}
          slots={{ axisContent: ChartAxisTooltip }}
          skipAnimation={isZoomed}
          hideLegend
          sx={CHART_SX}
        />
      </ZoomableChart>
    </ChartCard>
  );
}
