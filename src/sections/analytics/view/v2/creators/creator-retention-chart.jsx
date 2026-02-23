import { useMemo, useEffect } from 'react';

import { LineChart } from '@mui/x-charts/LineChart';
import { Chip, Stack, Typography } from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import RemoveIcon from '@mui/icons-material/Remove';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import useChartZoom from 'src/hooks/use-chart-zoom';

import { MOCK_RETENTION } from '../mock-data';
import { useFilteredData, useFilterLabel } from '../date-filter-context';
import ChartCard from '../components/chart-card';
import ZoomableChart from '../components/zoomable-chart';
import ChartAxisTooltip from '../components/chart-axis-tooltip';
import { CHART_SX, CHART_GRID, CHART_COLORS, CHART_MARGIN, CHART_HEIGHT, TICK_LABEL_STYLE, getTrendProps } from '../chart-config';

export default function CreatorRetentionChart() {
  const filtered = useFilteredData(MOCK_RETENTION);
  const chipLabel = useFilterLabel();
  const rates = useMemo(() => filtered.map((d) => d.rate), [filtered]);
  const months = useMemo(() => filtered.map((d) => d.month), [filtered]);
  const indices = useMemo(() => months.map((_, i) => i), [months]);

  const { xAxis: xDomain, yDomain, isZoomed, resetZoom, containerProps, setYSources } = useChartZoom(filtered.length);

  useEffect(() => { setYSources([rates]); }, [setYSources, rates]);

  const latest = rates[rates.length - 1];
  const prev = rates.length >= 2 ? rates[rates.length - 2] : undefined;
  const change = prev != null ? Math.round((latest - prev) * 10) / 10 : null;
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

  const headerRight = (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Chip label={chipLabel} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: 11, height: 22, color: '#919EAB', borderColor: '#E8ECEE' }} />
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>
        {latest}%
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
    <ChartCard title="Creator Retention" icon={AutorenewIcon} subtitle="Creators in 2+ campaigns within rolling window (30 days)" headerRight={headerRight}>
      <ZoomableChart containerProps={containerProps} isZoomed={isZoomed} resetZoom={resetZoom}>
        <LineChart
          series={[{ data: rates, label: 'Retention Rate', color: CHART_COLORS.success, area: true, curve: 'linear', valueFormatter: (val) => `${val}%` }]}
          xAxis={xAxisConfig}
          yAxis={[{ ...yDomain, valueFormatter: (val) => `${val}%`, tickLabelStyle: TICK_LABEL_STYLE }]}
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
