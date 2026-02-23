import { useMemo, useState, useCallback } from 'react';

import { Stack } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

import ChartCard from '../components/chart-card';
import { MOCK_CREDITS_PER_CS } from '../mock-data';
import ChartLegend from '../components/chart-legend';
import CreditsPerCSDrawer from './credits-per-cs-drawer';
import ChartAxisTooltip from '../components/chart-axis-tooltip';
import { CHART_SX, CHART_GRID, CHART_COLORS, CHART_MARGIN, TICK_LABEL_STYLE } from '../chart-config';

const LEGEND_ITEMS = [
  { label: 'Basic', color: CHART_COLORS.primary },
  { label: 'Essential', color: CHART_COLORS.secondary },
  { label: 'Pro', color: CHART_COLORS.success },
  { label: 'Custom', color: CHART_COLORS.warning },
];

const ALL_SERIES = [
  { key: 'basic', label: 'Basic', color: CHART_COLORS.primary },
  { key: 'essential', label: 'Essential', color: CHART_COLORS.secondary },
  { key: 'pro', label: 'Pro', color: CHART_COLORS.success },
  { key: 'custom', label: 'Custom', color: CHART_COLORS.warning },
];

export default function CreditsPerCSChart() {
  const [hiddenSeries, setHiddenSeries] = useState([]);
  const [selectedCS, setSelectedCS] = useState(null);

  const handleToggle = useCallback((label) => {
    setHiddenSeries((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }, []);

  const sorted = useMemo(
    () =>
      [...MOCK_CREDITS_PER_CS].sort(
        (a, b) => (b.basic + b.essential + b.pro + b.custom) - (a.basic + a.essential + a.pro + a.custom)
      ),
    []
  );

  const visibleSeries = useMemo(
    () => ALL_SERIES
      .filter((s) => !hiddenSeries.includes(s.label))
      .map((s) => ({
        data: sorted.map((d) => d[s.key]),
        label: s.label,
        color: s.color,
        stack: 'total',
        valueFormatter: (val) => `${val} credits`,
      })),
    [hiddenSeries, sorted]
  );

  const handleAxisClick = useCallback((_event, data) => {
    if (!data || data.dataIndex == null) return;
    setSelectedCS(sorted[data.dataIndex]);
  }, [sorted]);

  return (
    <ChartCard
      title="Credits per CS" icon={WorkspacePremiumIcon}
      subtitle="Total credits managed, by package type"
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
          xAxis={[{ scaleType: 'band', data: sorted.map((d) => d.csName), tickLabelStyle: { ...TICK_LABEL_STYLE, angle: -45 }, tickLabelInterval: () => true, height: 80 }]}
          yAxis={[{ tickLabelStyle: TICK_LABEL_STYLE }]}
          height={420}
          margin={CHART_MARGIN}
          grid={CHART_GRID}
          hideLegend
          tooltip={{ trigger: 'axis' }}
          slots={{ axisContent: ChartAxisTooltip }}
          onAxisClick={handleAxisClick}
          sx={{ ...CHART_SX, cursor: 'pointer' }}
        />
      </Stack>

      <CreditsPerCSDrawer
        selectedCS={selectedCS}
        csAdmins={sorted}
        onClose={() => setSelectedCS(null)}
        onNavigate={setSelectedCS}
      />
    </ChartCard>
  );
}
