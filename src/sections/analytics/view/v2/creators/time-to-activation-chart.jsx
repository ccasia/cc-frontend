import { useMemo, useEffect } from 'react';

import { LineChart } from '@mui/x-charts/LineChart';
import { Chip, Stack, Typography } from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import RemoveIcon from '@mui/icons-material/Remove';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import useChartZoom from 'src/hooks/use-chart-zoom';

import ChartCard from '../components/chart-card';
import { MOCK_TIME_TO_ACTIVATION } from '../mock-data';
import { useFilteredData, useFilterLabel } from '../date-filter-context';
import ZoomableChart from '../components/zoomable-chart';
import ChartAxisTooltip from '../components/chart-axis-tooltip';
import { CHART_SX, CHART_GRID, CHART_COLORS, CHART_MARGIN, CHART_HEIGHT, TICK_LABEL_STYLE, getTrendProps } from '../chart-config';

export default function TimeToActivationChart() {
  const filtered = useFilteredData(MOCK_TIME_TO_ACTIVATION);
  const chipLabel = useFilterLabel();
  const avgDays = useMemo(() => filtered.map((d) => d.avgDays), [filtered]);
  const months = useMemo(() => filtered.map((d) => d.month), [filtered]);
  const indices = useMemo(() => months.map((_, i) => i), [months]);

  const { xAxis: xDomain, yDomain, isZoomed, resetZoom, containerProps, setYSources } = useChartZoom(filtered.length);

  useEffect(() => { setYSources([avgDays]); }, [setYSources, avgDays]);

  const latest = avgDays[avgDays.length - 1];
  const prev = avgDays.length >= 2 ? avgDays[avgDays.length - 2] : undefined;
  const change = prev != null ? Math.round((latest - prev) * 10) / 10 : null;
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
      return i >= 0 && i < months.length ? months[i] : '';
    },
    tickMinStep: 1,
    tickLabelStyle: TICK_LABEL_STYLE,
  }], [xMin, xMax, months, indices]);

  const headerRight = (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Chip label={chipLabel} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: 11, height: 22, color: '#919EAB', borderColor: '#E8ECEE' }} />
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>
        {latest}d
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
      <ZoomableChart containerProps={containerProps} isZoomed={isZoomed} resetZoom={resetZoom}>
        <LineChart
          series={[{ data: avgDays, label: 'Avg Days', color: CHART_COLORS.warning, curve: 'linear', area: true, valueFormatter: (val) => `${val} days` }]}
          xAxis={xAxisConfig}
          yAxis={[{ ...yDomain, valueFormatter: (val) => `${val}d`, tickLabelStyle: TICK_LABEL_STYLE }]}
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
