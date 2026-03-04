import { memo, useMemo, useState, useEffect, useCallback, useRef } from 'react';
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
const MIN_CHART_HEIGHT = 420;
const MIN_BAR_WIDTH = 48;
const AXIS_MARGIN_H = CHART_MARGIN.left + CHART_MARGIN.right;

const SCROLL_SX_HORIZONTAL = {
  '&::-webkit-scrollbar': { height: '3px' },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': { background: 'transparent', borderRadius: '1.5px' },
  '&:hover::-webkit-scrollbar-thumb': { background: '#D0D5DA' },
  scrollbarWidth: 'thin',
  scrollbarColor: 'transparent transparent',
  '&:hover': { scrollbarColor: '#D0D5DA transparent' },
};

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
  const chartContainerRef = useRef(null);
  const scrollRef = useRef(null);
  const [chartHeight, setChartHeight] = useState(MIN_CHART_HEIGHT);
  const [containerWidth, setContainerWidth] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { startDate, endDate } = useDateFilter();
  const { csAdmins, isLoading } = useGetCreditsPerCS({ startDate, endDate });

  useEffect(() => setSelectedCS(null), [startDate, endDate]);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (height > 0) setChartHeight((prev) => Math.max(MIN_CHART_HEIGHT, Math.floor(height)));
      if (width > 0) setContainerWidth(Math.floor(width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const updateScrollIndicators = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 4;
    setCanScrollLeft(el.scrollLeft > threshold);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - threshold);
  }, []);

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

  const chartWidth = useMemo(() => {
    if (sorted.length === 0 || containerWidth === 0) return undefined;
    const computed = sorted.length * MIN_BAR_WIDTH + AXIS_MARGIN_H;
    return Math.max(computed, containerWidth);
  }, [sorted.length, containerWidth]);

  const needsScroll = containerWidth > 0 && chartWidth !== undefined && chartWidth > containerWidth;

  useEffect(() => {
    updateScrollIndicators();
  }, [needsScroll, sorted.length, containerWidth, updateScrollIndicators]);

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

    const fadeSx = {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 32,
      pointerEvents: 'none',
      zIndex: 1,
      transition: 'opacity 0.2s',
    };

    return (
      <Box ref={chartContainerRef} sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {needsScroll && (
          <Box
            sx={{
              ...fadeSx,
              left: 0,
              background: 'linear-gradient(to right, #fff 0%, transparent 100%)',
              opacity: canScrollLeft ? 1 : 0,
            }}
          />
        )}
        {needsScroll && (
          <Box
            sx={{
              ...fadeSx,
              right: 0,
              background: 'linear-gradient(to left, #fff 0%, transparent 100%)',
              opacity: canScrollRight ? 1 : 0,
            }}
          />
        )}
        <Box
          ref={scrollRef}
          onScroll={updateScrollIndicators}
          sx={{
            overflowX: needsScroll ? 'auto' : 'visible',
            overflowY: 'visible',
            ...(needsScroll ? SCROLL_SX_HORIZONTAL : {}),
          }}
        >
          <BarChart
            series={visibleSeries}
            xAxis={[{ scaleType: 'band', data: sorted.map((d) => d.csName), tickLabelStyle: { ...TICK_LABEL_STYLE, angle: -45 }, tickLabelInterval: () => true, height: 80 }]}
            yAxis={[{ tickLabelStyle: TICK_LABEL_STYLE }]}
            height={chartHeight}
            width={needsScroll ? chartWidth : undefined}
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
        </Box>
      </Box>
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
