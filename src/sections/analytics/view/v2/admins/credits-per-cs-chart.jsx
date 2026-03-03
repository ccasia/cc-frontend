import { memo, useMemo, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import { Box, Stack, Avatar, Skeleton, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useDrawingArea, useXScale, useYScale } from '@mui/x-charts/hooks';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

import useGetCreditsPerCS from 'src/hooks/use-get-credits-per-cs';

import ChartCard from '../components/chart-card';
import { useDateFilter } from '../date-filter-context';
import ChartLegend from '../components/chart-legend';
import CreditsPerCSDrawer from './credits-per-cs-drawer';
import ChartAxisTooltip from '../components/chart-axis-tooltip';
import { UI_COLORS, CHART_SX, CHART_GRID, CHART_COLORS, CHART_MARGIN, TICK_LABEL_STYLE } from '../chart-config';

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

const AVATAR_SIZE = 28;

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function AvatarOverlay({ data, visibleKeys }) {
  const { top } = useDrawingArea();
  const xScale = useXScale();
  const yScale = useYScale();

  if (!xScale?.bandwidth || !yScale) return null;

  const bandwidth = xScale.bandwidth();

  return (
    <g>
      {data.map((d) => {
        const x = xScale(d.csName);
        if (x == null) return null;

        const stackTotal = visibleKeys.reduce((sum, key) => sum + (d[key] || 0), 0);
        const barTopY = yScale(stackTotal) ?? top;

        const cx = x + bandwidth / 2;
        const avatarY = barTopY - AVATAR_SIZE - 4;

        return (
          <foreignObject
            key={d.csName}
            x={cx - AVATAR_SIZE / 2}
            y={Math.max(avatarY, 0)}
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            style={{ overflow: 'visible' }}
          >
            <Avatar
              src={d.csPhoto || undefined}
              alt={d.csName}
              sx={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: `${CHART_COLORS.primary}18`,
                color: CHART_COLORS.primary,
                border: `1.5px solid ${CHART_COLORS.primary}40`,
              }}
            >
              {getInitials(d.csName)}
            </Avatar>
          </foreignObject>
        );
      })}
    </g>
  );
}

AvatarOverlay.propTypes = {
  data: PropTypes.array.isRequired,
  visibleKeys: PropTypes.array.isRequired,
};

function CreditsPerCSChart() {
  const [hiddenSeries, setHiddenSeries] = useState([]);
  const [selectedCS, setSelectedCS] = useState(null);
  const { startDate, endDate } = useDateFilter();
  const { csAdmins, isLoading } = useGetCreditsPerCS({ startDate, endDate });

  useEffect(() => setSelectedCS(null), [startDate, endDate]);

  const handleToggle = useCallback((label) => {
    setHiddenSeries((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }, []);

  const sorted = useMemo(
    () =>
      [...csAdmins].sort(
        (a, b) => (b.basic + b.essential + b.pro + b.custom) - (a.basic + a.essential + a.pro + a.custom)
      ),
    [csAdmins]
  );

  const activeSeries = useMemo(
    () => ALL_SERIES.filter((s) => !hiddenSeries.includes(s.label)),
    [hiddenSeries]
  );

  const visibleKeys = useMemo(() => activeSeries.map((s) => s.key), [activeSeries]);

  const visibleSeries = useMemo(
    () => activeSeries.map((s) => ({
        data: sorted.map((d) => d[s.key]),
        label: s.label,
        color: s.color,
        stack: 'total',
        valueFormatter: (val) => `${val} credits`,
      })),
    [activeSeries, sorted]
  );

  const handleAxisClick = useCallback((_event, data) => {
    if (!data || data.dataIndex == null) return;
    setSelectedCS(sorted[data.dataIndex]);
  }, [sorted]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <Stack spacing={1} sx={{ px: 3, pb: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={36} />
          ))}
        </Stack>
      );
    }

    if (sorted.length === 0) {
      return (
        <Box sx={{ px: 3, pb: 3, pt: 1 }}>
          <Typography variant="body2" sx={{ color: UI_COLORS.textMuted }}>
            No CS admin data found for this period.
          </Typography>
        </Box>
      );
    }

    return (
      <Stack spacing={1}>
        <BarChart
          series={visibleSeries}
          xAxis={[{ scaleType: 'band', data: sorted.map((d) => d.csName), tickLabelStyle: { ...TICK_LABEL_STYLE, angle: -45 }, tickLabelInterval: () => true, height: 80 }]}
          yAxis={[{ tickLabelStyle: TICK_LABEL_STYLE }]}
          height={420}
          margin={{ ...CHART_MARGIN, top: AVATAR_SIZE + 8 }}
          grid={CHART_GRID}
          hideLegend
          tooltip={{ trigger: 'axis' }}
          slots={{ axisContent: ChartAxisTooltip }}
          onAxisClick={handleAxisClick}
          sx={{ ...CHART_SX, cursor: 'pointer' }}
        >
          <AvatarOverlay data={sorted} visibleKeys={visibleKeys} />
        </BarChart>
      </Stack>
    );
  };

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
      {renderContent()}

      <CreditsPerCSDrawer
        selectedCS={selectedCS}
        csAdmins={sorted}
        onClose={() => setSelectedCS(null)}
        onNavigate={setSelectedCS}
      />
    </ChartCard>
  );
}

export default memo(CreditsPerCSChart);
