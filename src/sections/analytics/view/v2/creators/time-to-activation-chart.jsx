import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import TimerIcon from '@mui/icons-material/Timer';
import { LineChart } from '@mui/x-charts/LineChart';
import RemoveIcon from '@mui/icons-material/Remove';
import { Chip, Stack, Typography } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import useChartZoom from 'src/hooks/use-chart-zoom';
import useGetTimeToActivation from 'src/hooks/use-get-time-to-activation';

import ChartCard from '../components/chart-card';
import ZoomableChart from '../components/zoomable-chart';
import ChartAxisTooltip from '../components/chart-axis-tooltip';
import TimeToActivationDrawer from './time-to-activation-drawer';
import { useIsDaily, useDateFilter, useFilterLabel, useFilteredData } from '../date-filter-context';
import { CHART_SX, CHART_GRID, CHART_COLORS, CHART_MARGIN, CHART_HEIGHT, getTrendProps, TICK_LABEL_STYLE } from '../chart-config';

export default function TimeToActivationChart() {
  const { startDate, endDate } = useDateFilter();
  const isDaily = useIsDaily();
  const chipLabel = useFilterLabel();

  const hookOptions = useMemo(() => {
    if (isDaily && startDate && endDate) {
      return { granularity: 'daily', startDate, endDate };
    }
    return {};
  }, [isDaily, startDate, endDate]);

  const { timeToActivation, periodComparison } = useGetTimeToActivation(hookOptions);

  // For monthly, filter to visible range; for daily, backend already returns the range
  const monthlyFiltered = useFilteredData(timeToActivation);
  const filtered = isDaily ? timeToActivation : monthlyFiltered;

  // Trim trailing nulls (future dates with no data) so the line doesn't trail off
  const trimmed = useMemo(() => {
    let lastIdx = filtered.length - 1;
    while (lastIdx >= 0 && filtered[lastIdx].avgDays == null) lastIdx -= 1;
    return filtered.slice(0, lastIdx + 1);
  }, [filtered]);

  // Ensure numeric values (Prisma Decimal may arrive as strings from the API)
  const avgDays = useMemo(() => trimmed.map((d) => d.avgDays != null ? Number(d.avgDays) : null), [trimmed]);
  const labels = useMemo(() => trimmed.map((d) => d.date || d.month), [trimmed]);
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

  const { xAxis: xDomain, yDomain, isZoomed, resetZoom, containerProps, setYSources } = useChartZoom(trimmed.length);

  useEffect(() => { setYSources([avgDays]); }, [setYSources, avgDays]);

  // Find the last two non-null values for display and trend
  const nonNullValues = useMemo(() => avgDays.filter((v) => v != null), [avgDays]);
  const latest = nonNullValues[nonNullValues.length - 1];
  const prev = nonNullValues.length >= 2 ? nonNullValues[nonNullValues.length - 2] : undefined;

  // For daily mode, use periodComparison; for monthly, use latest - prev
  let change = null;
  if (isDaily && periodComparison) {
    change = periodComparison.change;
  } else if (prev != null && latest != null) {
    change = Math.round((latest - prev) * 10) / 10;
  }

  // For time-to-activation, lower is better — so a negative change is good
  const isNeutral = change == null || change === 0;
  const isImproved = !isNeutral && change < 0;
  const trend = getTrendProps(isNeutral, isImproved);
  let TrendIcon = RemoveIcon;
  if (!isNeutral) TrendIcon = isImproved ? ArrowDropDownIcon : ArrowDropUpIcon;

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
        {latest != null ? `${latest}d` : '—'}
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        sx={{ bgcolor: trend.bg, borderRadius: 0.75, px: 0.5, py: 0.25 }}
      >
        <TrendIcon sx={{ fontSize: trend.iconSize, color: trend.color, ml: -0.25 }} />
        <Typography variant="caption" sx={{ fontWeight: 600, color: trend.color, fontSize: '0.7rem', mr: 0.25 }}>
          {isNeutral ? '0d' : `${change > 0 ? '+' : ''}${change}d`}
        </Typography>
      </Stack>
    </Stack>
  );

  return (
    <ChartCard title="Time to Activation" icon={TimerIcon} subtitle="Avg days from account creation to payment form completion" headerRight={headerRight}>
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
          series={[{ data: avgDays, label: 'Avg Days', color: CHART_COLORS.warning, curve: 'linear', area: true, connectNulls: true, valueFormatter: (val) => val != null ? `${val} days` : 'No data' }]}
          xAxis={xAxisConfig}
          yAxis={[{ ...yDomain, valueFormatter: (val) => `${val}d`, tickLabelStyle: TICK_LABEL_STYLE }]}
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
      <TimeToActivationDrawer
        selectedPoint={selectedPoint}
        points={labels}
        data={trimmed}
        isDaily={isDaily}
        onClose={() => setSelectedPoint(null)}
        onNavigate={setSelectedPoint}
      />
    </ChartCard>
  );
}
