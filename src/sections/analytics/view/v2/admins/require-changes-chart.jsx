import { useState, useMemo, useCallback } from 'react';

import EditIcon from '@mui/icons-material/Edit';
import { Stack } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';

import ChartCard from '../components/chart-card';
import ChartLegend from '../components/chart-legend';
import ChartAxisTooltip from '../components/chart-axis-tooltip';
import { MOCK_REQUIRE_CHANGES } from '../mock-data';
import { CHART_SX, CHART_GRID, CHART_COLORS, CHART_MARGIN, CHART_HEIGHT, TICK_LABEL_STYLE } from '../chart-config';
import { useFilteredData } from '../date-filter-context';

const LEGEND_ITEMS = [
  { label: 'V2 Campaigns', color: CHART_COLORS.warning },
  { label: 'V4 Campaigns', color: CHART_COLORS.primary },
];

export default function RequireChangesChart() {
  const filteredV2 = useFilteredData(MOCK_REQUIRE_CHANGES.v2);
  const filteredV4 = useFilteredData(MOCK_REQUIRE_CHANGES.v4);
  const months = useMemo(() => filteredV2.map((d) => d.month), [filteredV2]);

  const [hiddenSeries, setHiddenSeries] = useState([]);

  const handleToggle = useCallback((label) => {
    setHiddenSeries((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }, []);

  const allSeries = useMemo(() => [
    { data: filteredV2.map((d) => d.rate), label: 'V2 Campaigns', color: CHART_COLORS.warning, valueFormatter: (val) => `${val}%` },
    { data: filteredV4.map((d) => d.rate), label: 'V4 Campaigns', color: CHART_COLORS.primary, valueFormatter: (val) => `${val}%` },
  ], [filteredV2, filteredV4]);

  const visibleSeries = useMemo(
    () => allSeries.filter((s) => !hiddenSeries.includes(s.label)),
    [hiddenSeries, allSeries]
  );

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
    </ChartCard>
  );
}
