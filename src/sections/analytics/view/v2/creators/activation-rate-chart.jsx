import { useMemo, useEffect } from 'react';

import { LineChart } from '@mui/x-charts/LineChart';
import { Chip, Stack, Typography } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import RemoveIcon from '@mui/icons-material/Remove';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import useChartZoom from 'src/hooks/use-chart-zoom';
import useGetActivationRate from 'src/hooks/use-get-activation-rate';

import ChartCard from '../components/chart-card';
import { useDateFilter, useFilteredData, useFilterLabel, useIsDaily } from '../date-filter-context';
import ZoomableChart from '../components/zoomable-chart';
import ChartAxisTooltip from '../components/chart-axis-tooltip';
import { CHART_SX, CHART_GRID, CHART_COLORS, CHART_MARGIN, CHART_HEIGHT, TICK_LABEL_STYLE, getTrendProps } from '../chart-config';

export default function ActivationRateChart() {
  const { startDate, endDate } = useDateFilter();
  const isDaily = useIsDaily();
  const chipLabel = useFilterLabel();

  const hookOptions = useMemo(() => {
    if (isDaily && startDate && endDate) {
      return { granularity: 'daily', startDate, endDate };
    }
    return {};
  }, [isDaily, startDate, endDate]);

  const { activationRate, periodComparison } = useGetActivationRate(hookOptions);

  // For monthly, filter to visible range; for daily, backend already returns the range
  const monthlyFiltered = useFilteredData(activationRate);
  const filtered = isDaily ? activationRate : monthlyFiltered;

  const rates = useMemo(() => filtered.map((d) => d.rate), [filtered]);
  const labels = useMemo(() => filtered.map((d) => d.date || d.month), [filtered]);
  const indices = useMemo(() => labels.map((_, i) => i), [labels]);

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
        {latest != null ? `${latest}%` : '—'}
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
    <ChartCard title="Activation Rate" icon={BoltIcon} subtitle="Users who completed payment form divided by total users" headerRight={headerRight}>
      <ZoomableChart containerProps={containerProps} isZoomed={isZoomed} resetZoom={resetZoom}>
        <LineChart
          series={[{ data: rates, label: 'Activation Rate', color: CHART_COLORS.success, curve: 'linear', area: true, valueFormatter: (val) => `${val}%` }]}
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
