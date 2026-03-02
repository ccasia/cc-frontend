import { useState, useMemo, useCallback } from 'react';

import EditIcon from '@mui/icons-material/Edit';
import { Stack, Skeleton, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';

import useGetRequireChangesRate from 'src/hooks/use-get-require-changes-rate';

import ChartCard from '../components/chart-card';
import ChartLegend from '../components/chart-legend';
import ChartAxisTooltip from '../components/chart-axis-tooltip';
import { CHART_SX, CHART_GRID, CHART_COLORS, CHART_MARGIN, TICK_LABEL_STYLE } from '../chart-config';
import { useFilteredData } from '../date-filter-context';

const LEGEND_ITEMS = [
  { label: 'V2 Campaigns', color: CHART_COLORS.warning },
  { label: 'V4 Campaigns', color: CHART_COLORS.primary },
];

export default function RequireChangesChart() {
  const { v2, v4, isLoading } = useGetRequireChangesRate();

  const filteredV2 = useFilteredData(v2);
  const filteredV4 = useFilteredData(v4);
  const months = useMemo(() => filteredV2.map((d) => d.month), [filteredV2]);

  const [hiddenSeries, setHiddenSeries] = useState([]);

  const handleToggle = useCallback((label) => {
    setHiddenSeries((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }, []);

  const allSeries = useMemo(() => [
    { data: filteredV2.map((d) => d.rate), label: 'V2 Campaigns', color: CHART_COLORS.warning, valueFormatter: (val) => `${val ?? 0}%` },
    { data: filteredV4.map((d) => d.rate), label: 'V4 Campaigns', color: CHART_COLORS.primary, valueFormatter: (val) => `${val ?? 0}%` },
  ], [filteredV2, filteredV4]);

  const visibleSeries = useMemo(
    () => allSeries.filter((s) => !hiddenSeries.includes(s.label)),
    [hiddenSeries, allSeries]
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <Stack spacing={1} sx={{ px: 2, py: 1 }}>
          <Skeleton variant="rectangular" height={480} sx={{ borderRadius: 1 }} />
        </Stack>
      );
    }

    if (filteredV2.length === 0 && filteredV4.length === 0) {
      return (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
          <Typography variant="body2" sx={{ color: '#919EAB' }}>
            No data found for the selected period.
          </Typography>
        </Stack>
      );
    }

    return (
      <Stack spacing={1}>
        <BarChart
          series={visibleSeries}
          xAxis={[{ scaleType: 'band', data: months, tickLabelStyle: TICK_LABEL_STYLE }]}
          yAxis={[{ valueFormatter: (val) => `${val}%`, tickLabelStyle: TICK_LABEL_STYLE }]}
          height={480}
          margin={CHART_MARGIN}
          grid={CHART_GRID}
          hideLegend
          tooltip={{ trigger: 'axis' }}
          slots={{ axisContent: ChartAxisTooltip }}
          sx={CHART_SX}
        />
      </Stack>
    );
  };

  return (
    <ChartCard
      title="Require Changes Rate" icon={EditIcon}
      subtitle="Changes required / (deliverables x 2) — V2 vs V4"
      headerRight={
        <ChartLegend
          items={LEGEND_ITEMS}
          interactive
          hiddenSeries={hiddenSeries}
          onToggle={handleToggle}
        />
      }
    >
      {renderContent()}
    </ChartCard>
  );
}
