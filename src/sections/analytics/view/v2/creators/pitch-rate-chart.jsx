import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { LineChart } from '@mui/x-charts/LineChart';
import RemoveIcon from '@mui/icons-material/Remove';
import { Chip, Stack, Typography } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import useChartZoom from 'src/hooks/use-chart-zoom';
import useGetPitchRate from 'src/hooks/use-get-pitch-rate';
import useGetPitchRateCreators from 'src/hooks/use-get-pitch-rate-creators';

import ChartCard from '../components/chart-card';
import ZoomableChart from '../components/zoomable-chart';
import ChartAxisTooltip from '../components/chart-axis-tooltip';
import CreatorDrilldownDrawer from './creator-drilldown-drawer';
import { useIsDaily, useDateFilter, useFilterLabel, useFilteredData } from '../date-filter-context';
import { CHART_SX, CHART_GRID, CHART_COLORS, CHART_MARGIN, CHART_HEIGHT, getTrendProps, TICK_LABEL_STYLE } from '../chart-config';

const PITCH_DRAWER_CONFIG = {
  useCreatorsHook: useGetPitchRateCreators,
  subtitle: (
    <>
      Creators who made their <Typography component="span" sx={{ fontWeight: 700, color: '#637381', fontSize: 'inherit' }}>first pitch</Typography> in this period
    </>
  ),
  dateLabel: 'First Pitched',
  dateColor: CHART_COLORS.secondary,
  dateField: 'firstPitchAt',
  daysField: 'daysToPitch',
  emptyTitle: 'No creators pitched',
  emptySubtitle: 'No first pitches recorded in this period',
};

export default function PitchRateChart() {
  const { startDate, endDate } = useDateFilter();
  const isDaily = useIsDaily();
  const chipLabel = useFilterLabel();

  const hookOptions = useMemo(() => {
    if (isDaily && startDate && endDate) {
      return { granularity: 'daily', startDate, endDate };
    }
    return {};
  }, [isDaily, startDate, endDate]);

  const { pitchRate, periodComparison } = useGetPitchRate(hookOptions);

  // For monthly, filter to visible range; for daily, backend already returns the range
  const monthlyFiltered = useFilteredData(pitchRate);
  const filtered = isDaily ? pitchRate : monthlyFiltered;

  const rates = useMemo(() => filtered.map((d) => d.rate), [filtered]);
  const labels = useMemo(() => filtered.map((d) => d.date || d.month), [filtered]);
  const indices = useMemo(() => labels.map((_, i) => i), [labels]);

  const [selectedPoint, setSelectedPoint] = useState(null);
  const clickStartRef = useRef(null);

  const handleAxisClick = useCallback((event, d) => {
    if (!d || d.dataIndex == null) return;
    if (clickStartRef.current) {
      const dx = event.clientX - clickStartRef.current.x;
      const dy = event.clientY - clickStartRef.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) return;
    }
    const label = labels[d.dataIndex];
    if (label) setSelectedPoint(label);
  }, [labels]);

  const { xAxis: xDomain, yDomain, isZoomed, resetZoom, containerProps, setYSources } = useChartZoom(filtered.length);

  useEffect(() => { setYSources([rates]); }, [setYSources, rates]);

  const latest = rates[rates.length - 1];
  const prev = rates.length >= 2 ? rates[rates.length - 2] : undefined;

  // For daily mode, use periodComparison; for monthly, use rate delta
  let change = null;
  if (isDaily && periodComparison) {
    change = periodComparison.percentChange;
  } else if (prev != null) {
    change = Math.round((latest - prev) * 10) / 10;
  }

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
      return i >= 0 && i < labels.length ? labels[i] : '';
    },
    tickMinStep: 1,
    tickLabelStyle: TICK_LABEL_STYLE,
  }], [xMin, xMax, labels, indices]);

  const headerRight = (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Chip label={chipLabel} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: 11, height: 22, color: '#919EAB', borderColor: '#E8ECEE' }} />
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>
        {latest != null ? `${latest}%` : '\u2014'}
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        sx={{ bgcolor: trend.bg, borderRadius: 0.75, px: 0.5, py: 0.25 }}
      >
        <TrendIcon sx={{ fontSize: trend.iconSize, color: trend.color, ml: -0.25 }} />
        <Typography variant="caption" sx={{ fontWeight: 600, color: trend.color, fontSize: '0.7rem', mr: 0.25 }}>
          {isNeutral ? '0%' : `${isUp ? '+' : ''}${change}%`}
        </Typography>
      </Stack>
    </Stack>
  );

  return (
    <ChartCard title="Pitch Rate" icon={TrackChangesIcon} subtitle="Creators who pitched divided by total active creators" headerRight={headerRight}>
      <ZoomableChart
        containerProps={{
          ...containerProps,
          onMouseDown: (e) => {
            clickStartRef.current = { x: e.clientX, y: e.clientY };
            containerProps.onMouseDown(e);
          },
        }}
        isZoomed={isZoomed}
        resetZoom={resetZoom}
      >
        <LineChart
          series={[{ data: rates, label: 'Pitch Rate', color: CHART_COLORS.secondary, curve: 'linear', area: true, valueFormatter: (val) => `${val}%` }]}
          xAxis={xAxisConfig}
          yAxis={[{ ...yDomain, valueFormatter: (val) => `${val}%`, tickLabelStyle: TICK_LABEL_STYLE }]}
          height={CHART_HEIGHT}
          margin={CHART_MARGIN}
          grid={CHART_GRID}
          tooltip={{ trigger: 'axis' }}
          slots={{ axisContent: ChartAxisTooltip }}
          onAxisClick={handleAxisClick}
          skipAnimation={isZoomed}
          hideLegend
          sx={{
            ...CHART_SX,
            cursor: 'pointer',
          }}
        />
      </ZoomableChart>
      <CreatorDrilldownDrawer
        selectedPoint={selectedPoint}
        points={labels}
        data={filtered}
        isDaily={isDaily}
        onClose={() => setSelectedPoint(null)}
        onNavigate={setSelectedPoint}
        config={PITCH_DRAWER_CONFIG}
      />
    </ChartCard>
  );
}
