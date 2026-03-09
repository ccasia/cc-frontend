import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';
import { memo, useRef, useMemo, useState, useEffect, useCallback } from 'react';

import TimerIcon from '@mui/icons-material/Timer';
import RemoveIcon from '@mui/icons-material/Remove';
import { LineChart } from '@mui/x-charts/LineChart';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import SplitscreenIcon from '@mui/icons-material/Splitscreen';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import StackedLineChartIcon from '@mui/icons-material/StackedLineChart';
import { Box, Stack, Divider, Tooltip, IconButton, Typography } from '@mui/material';

import useChartZoom from 'src/hooks/use-chart-zoom';
import useGetTimeToActivation from 'src/hooks/use-get-time-to-activation';
import useGetTimeToIgActivation from 'src/hooks/use-get-time-to-ig-activation';
import useGetTimeToTiktokActivation from 'src/hooks/use-get-time-to-tiktok-activation';
import useGetTimeToIgActivationCreators from 'src/hooks/use-get-time-to-ig-activation-creators';
import useGetTimeToTiktokActivationCreators from 'src/hooks/use-get-time-to-tiktok-activation-creators';

import ChartCard from '../components/chart-card';
import ChartLegend from '../components/chart-legend';
import ZoomableChart from '../components/zoomable-chart';
import ChartAxisTooltip from '../components/chart-axis-tooltip';
import CreatorDrilldownDrawer from './creator-drilldown-drawer';
import { useIsDaily, useDateFilter, useTrendLabel, useFilteredData } from '../date-filter-context';
import { CHART_SX, CHART_GRID, CHART_COLORS, CHART_MARGIN, CHART_HEIGHT, getTrendProps, TICK_LABEL_STYLE } from '../chart-config';

const LEGEND_ITEMS = [
  { label: 'Payment Form', color: CHART_COLORS.warning },
  { label: 'Instagram', color: '#E1306C' },
  { label: 'TikTok', color: '#000000' },
];

const METRIC_TOOLTIPS = {
  'Avg Payment Form': 'Average days from account registration to completing the payment form.',
  'Avg Instagram Activation': 'Average days from account registration to linking an Instagram account.',
  'Avg TikTok Activation': 'Average days from account registration to linking a TikTok account.',
};

const SERIES_TO_METRIC = {
  payment: 'paymentForm',
  instagram: 'instagram',
  tiktok: 'tiktok',
};

const METRIC_KEYS = ['paymentForm', 'instagram', 'tiktok'];

const DRILLDOWN_CONFIGS = {
  paymentForm: null, // uses default CreatorDrilldownDrawer config
  instagram: {
    useCreatorsHook: useGetTimeToIgActivationCreators,
    subtitle: (
      <>
        Avg days from <Typography component="span" sx={{ fontWeight: 700, color: '#637381', fontSize: 'inherit' }}>account creation</Typography> to <Typography component="span" sx={{ fontWeight: 700, color: '#637381', fontSize: 'inherit' }}>Instagram connection</Typography>
      </>
    ),
    dateLabel: 'IG Linked',
    dateColor: '#E1306C',
    dateField: 'igConnectedAt',
    daysField: 'daysToActivation',
    emptyTitle: 'No Instagram activations',
    emptySubtitle: 'No Instagram connections in this period',
  },
  tiktok: {
    useCreatorsHook: useGetTimeToTiktokActivationCreators,
    subtitle: (
      <>
        Avg days from <Typography component="span" sx={{ fontWeight: 700, color: '#637381', fontSize: 'inherit' }}>account creation</Typography> to <Typography component="span" sx={{ fontWeight: 700, color: '#637381', fontSize: 'inherit' }}>TikTok connection</Typography>
      </>
    ),
    dateLabel: 'TikTok Linked',
    dateColor: '#000000',
    dateField: 'tiktokConnectedAt',
    daysField: 'daysToActivation',
    emptyTitle: 'No TikTok activations',
    emptySubtitle: 'No TikTok connections in this period',
  },
};

// ---------------------------------------------------------------------------
// SingleMetricChart (separate view)
// ---------------------------------------------------------------------------

function SingleMetricChart({ title, numericData, color, months, latestValue, trend, trendLabel, onAxisClick }) {
  const indices = useMemo(() => months.map((_, i) => i), [months]);
  const clickStartRef = useRef(null);

  const fmtDays = useCallback((val) => (val != null ? `${val} days` : 'No data'), []);

  const series = useMemo(() => [
    { data: numericData, label: title, color, curve: 'linear', area: true, showMark: true, connectNulls: true, valueFormatter: fmtDays },
  ], [numericData, title, color, fmtDays]);

  const { xAxis: xDomain, yDomain, isZoomed, resetZoom, containerProps, setYSources } = useChartZoom(months.length);

  useEffect(() => { setYSources([numericData]); }, [setYSources, numericData]);

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

  const handleClick = useCallback((event, data) => {
    if (!data || data.dataIndex == null) return;
    if (clickStartRef.current) {
      const dx = event.clientX - clickStartRef.current.x;
      const dy = event.clientY - clickStartRef.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) return;
    }
    onAxisClick(data.dataIndex);
  }, [onAxisClick]);

  const isNeutral = trend == null || trend === 0;
  const isGood = !isNeutral && trend < 0;
  const tp = getTrendProps(isNeutral, isGood);
  let TrendIcon = RemoveIcon;
  if (!isNeutral) TrendIcon = trend < 0 ? ArrowDropDownIcon : ArrowDropUpIcon;

  return (
    <Box sx={{ border: '1px solid #E8ECEE', borderRadius: 1.5, p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
        <Typography variant="caption" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.8125rem' }}>
          {title}
        </Typography>
        {METRIC_TOOLTIPS[title] && (
          <Tooltip title={METRIC_TOOLTIPS[title]} arrow placement="top" slotProps={{ tooltip: { sx: { fontSize: '0.75rem', maxWidth: 260 } } }}>
            <InfoOutlinedIcon sx={{ fontSize: 15, color: '#919EAB', cursor: 'help' }} />
          </Tooltip>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }} />
        <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2 }}>
          {latestValue != null ? `${latestValue}d` : '\u2014'}
        </Typography>
        <Stack direction="row" alignItems="center" sx={{ bgcolor: tp.bg, borderRadius: 0.75, px: 0.5, py: 0.25 }}>
          <TrendIcon sx={{ fontSize: tp.iconSize, color: tp.color, ml: -0.25 }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: tp.color, fontSize: '0.75rem', mr: 0.25 }}>
            {isNeutral ? '0d' : `${trend > 0 ? '+' : ''}${trend}d`}
          </Typography>
        </Stack>
        <Typography variant="caption" sx={{ color: '#919EAB', fontSize: '0.75rem' }}>
          {trendLabel}
        </Typography>
      </Stack>
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
          series={series}
          xAxis={xAxisConfig}
          yAxis={[{ ...yDomain, tickLabelStyle: TICK_LABEL_STYLE, valueFormatter: (val) => `${val}d` }]}
          height={200}
          margin={CHART_MARGIN}
          grid={CHART_GRID}
          tooltip={{ trigger: 'axis' }}
          slots={{ axisContent: ChartAxisTooltip }}
          onAxisClick={handleClick}
          skipAnimation={isZoomed}
          hideLegend
          sx={{
            ...CHART_SX,
            cursor: 'pointer',
            '& .MuiMarkElement-root': { display: 'initial' },
          }}
        />
      </ZoomableChart>
    </Box>
  );
}

SingleMetricChart.propTypes = {
  title: PropTypes.string.isRequired,
  numericData: PropTypes.array.isRequired,
  color: PropTypes.string.isRequired,
  months: PropTypes.arrayOf(PropTypes.string).isRequired,
  latestValue: PropTypes.number,
  trend: PropTypes.number,
  trendLabel: PropTypes.string,
  onAxisClick: PropTypes.func.isRequired,
};

// ---------------------------------------------------------------------------
// Main Chart
// ---------------------------------------------------------------------------

function TimeToActivationChart() {
  const { startDate, endDate, creditTiers } = useDateFilter();
  const isDaily = useIsDaily();
  const trendLabel = useTrendLabel();

  const hookOptions = useMemo(() => {
    const opts = {};
    if (isDaily && startDate && endDate) {
      Object.assign(opts, { granularity: 'daily', startDate, endDate });
    }
    if (creditTiers.length > 0) opts.creditTiers = creditTiers;
    return opts;
  }, [isDaily, startDate, endDate, creditTiers]);

  const { timeToActivation: paymentRaw, periodComparison: paymentComparison } = useGetTimeToActivation(hookOptions);
  const { timeToActivation: igRaw, periodComparison: igComparison } = useGetTimeToIgActivation(hookOptions);
  const { timeToActivation: tiktokRaw, periodComparison: tiktokComparison } = useGetTimeToTiktokActivation(hookOptions);

  // For monthly, filter to visible range; for daily, backend already returns the range
  const monthlyPayment = useFilteredData(paymentRaw);
  const filteredPayment = isDaily ? paymentRaw : monthlyPayment;

  const monthlyIg = useFilteredData(igRaw);
  const filteredIg = isDaily ? igRaw : monthlyIg;

  const monthlyTiktok = useFilteredData(tiktokRaw);
  const filteredTiktok = isDaily ? tiktokRaw : monthlyTiktok;

  // All filtered arrays share the same time range (gap-filled), so they should
  // have the same length.  Use the longest as the reference and trim trailing
  // nulls based on the COMBINED last non-null across all three series so every
  // data array stays the same length (required by MUI X Charts).
  const { referenceData, months, paymentData, igData, tiktokData } = useMemo(() => {
    const series = [filteredPayment, filteredIg, filteredTiktok];
    const longest = series.reduce((a, b) => (b.length >= a.length ? b : a), series[0]);
    const len = longest.length;

    // Find the last index where ANY series has a non-null value
    let lastIdx = len - 1;
    while (lastIdx >= 0) {
      if (
        (filteredPayment[lastIdx]?.avgDays != null) ||
        (filteredIg[lastIdx]?.avgDays != null) ||
        (filteredTiktok[lastIdx]?.avgDays != null)
      ) break;
      lastIdx -= 1;
    }
    const trimLen = lastIdx + 1;

    const ref = longest.slice(0, trimLen);

    // Pad shorter arrays with nulls then slice to trimLen so all have equal length
    const toNumeric = (arr) => {
      const result = [];
      for (let i = 0; i < trimLen; i += 1) {
        const d = i < arr.length ? arr[i] : null;
        result.push(d?.avgDays != null ? Number(d.avgDays) : null);
      }
      return result;
    };

    return {
      referenceData: ref,
      months: ref.map((d) => d.date || d.month),
      paymentData: toNumeric(filteredPayment),
      igData: toNumeric(filteredIg),
      tiktokData: toNumeric(filteredTiktok),
    };
  }, [filteredPayment, filteredIg, filteredTiktok]);

  const indices = useMemo(() => months.map((_, i) => i), [months]);

  const fmtDays = useCallback((val) => (val != null ? `${val} days` : 'No data'), []);

  const allSeries = useMemo(() => [
    { id: 'payment', data: paymentData, label: 'Payment Form', color: CHART_COLORS.warning, shape: 'circle', curve: 'linear', area: true, showMark: true, connectNulls: true, valueFormatter: fmtDays },
    { id: 'instagram', data: igData, label: 'Instagram', color: '#E1306C', shape: 'diamond', curve: 'linear', area: true, showMark: true, connectNulls: true, valueFormatter: fmtDays },
    { id: 'tiktok', data: tiktokData, label: 'TikTok', color: '#000000', shape: 'square', curve: 'linear', area: true, showMark: true, connectNulls: true, valueFormatter: fmtDays },
  ], [paymentData, igData, tiktokData, fmtDays]);

  const [hiddenSeries, setHiddenSeries] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [viewMode, setViewMode] = useState('combined');
  const [activeMetric, setActiveMetric] = useState(null);
  const clickStartRef = useRef(null);
  const cardRef = useRef(null);

  const handleToggle = useCallback((label) => {
    setHiddenSeries((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }, []);

  // Trend calculations
  const calcTrend = (arr, comparison) => {
    const nonNull = arr.filter((v) => v != null);
    const latest = nonNull.length > 0 ? nonNull[nonNull.length - 1] : null;
    if (isDaily && comparison) return { latest, trend: comparison.change };
    const prev = nonNull.length >= 2 ? nonNull[nonNull.length - 2] : null;
    const change = latest != null && prev != null ? Math.round((latest - prev) * 10) / 10 : null;
    return { latest, trend: change };
  };

  const { latest: latestPayment, trend: paymentTrend } = calcTrend(paymentData, paymentComparison);
  const { latest: latestIg, trend: igTrend } = calcTrend(igData, igComparison);
  const { latest: latestTiktok, trend: tiktokTrend } = calcTrend(tiktokData, tiktokComparison);

  const { xAxis: xDomain, yDomain, isZoomed, resetZoom, containerProps, setYSources } = useChartZoom(months.length);

  const visibleSeries = useMemo(
    () => allSeries.filter((s) => !hiddenSeries.includes(s.label)),
    [hiddenSeries, allSeries]
  );

  useEffect(() => {
    setYSources(visibleSeries.map((s) => s.data));
  }, [setYSources, visibleSeries]);

  // Explicit y-axis range for the combined chart — MUI's auto-scaling
  // misbehaves when sparse series contain negative values alongside positive
  // ones, so we compute our own min/max from visible data.
  const { combinedYMin, combinedYMax } = useMemo(() => {
    const allValues = visibleSeries.flatMap((s) => s.data).filter((v) => v != null);
    if (allValues.length === 0) return { combinedYMin: 0, combinedYMax: 1 };
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const span = (max - min) || 1;
    return {
      combinedYMin: min < 0 ? Math.floor(min - span * 0.1) : 0,
      combinedYMax: Math.ceil((max + span * 0.15) * 10) / 10 || 1,
    };
  }, [visibleSeries]);

  const handleAxisClick = useCallback((event, data) => {
    if (!data || data.dataIndex == null) return;
    if (clickStartRef.current) {
      const dx = event.clientX - clickStartRef.current.x;
      const dy = event.clientY - clickStartRef.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) return;
    }
    const label = months[data.dataIndex];
    if (label) {
      setActiveMetric('paymentForm');
      setSelectedPoint(label);
    }
  }, [months]);

  const handleMarkClick = useCallback((event, data) => {
    if (!data || data.dataIndex == null) return;
    if (clickStartRef.current) {
      const dx = event.clientX - clickStartRef.current.x;
      const dy = event.clientY - clickStartRef.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) return;
    }
    const label = months[data.dataIndex];
    if (label) {
      setActiveMetric(SERIES_TO_METRIC[data.seriesId] || 'paymentForm');
      setSelectedPoint(label);
    }
  }, [months]);

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

  const metrics = [
    { title: 'Avg Payment Form', value: latestPayment, trend: paymentTrend },
    { title: 'Avg Instagram Activation', value: latestIg, trend: igTrend },
    { title: 'Avg TikTok Activation', value: latestTiktok, trend: tiktokTrend },
  ];

  const isCombined = viewMode === 'combined';

  const toggleBtnSx = (active) => ({
    width: 32,
    height: 32,
    borderRadius: 1,
    bgcolor: active ? '#F4F6F8' : 'transparent',
    color: active ? '#333' : '#919EAB',
    '&:hover': { bgcolor: '#F4F6F8' },
  });

  const headerToggle = (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title="Combined chart" arrow placement="top">
        <IconButton size="small" onClick={() => setViewMode('combined')} sx={toggleBtnSx(isCombined)}>
          <StackedLineChartIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Separate charts" arrow placement="top">
        <IconButton size="small" onClick={() => setViewMode('separate')} sx={toggleBtnSx(!isCombined)}>
          <SplitscreenIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  const separateConfigs = [
    { title: 'Avg Payment Form', data: paymentData, color: CHART_COLORS.warning, value: latestPayment, trend: paymentTrend, metricKey: METRIC_KEYS[0] },
    { title: 'Avg Instagram Activation', data: igData, color: '#E1306C', value: latestIg, trend: igTrend, metricKey: METRIC_KEYS[1] },
    { title: 'Avg TikTok Activation', data: tiktokData, color: '#000000', value: latestTiktok, trend: tiktokTrend, metricKey: METRIC_KEYS[2] },
  ];

  // Resolve drilldown config based on active metric
  const drilldownConfig = activeMetric ? DRILLDOWN_CONFIGS[activeMetric] : null;

  return (
    <ChartCard
      ref={cardRef}
      title="Time to Activation"
      icon={TimerIcon}
      subtitle="Avg days from account creation to key activation milestones"
      headerRight={headerToggle}
    >
      <AnimatePresence mode="wait">
        <m.div
          key={viewMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.43, 0.13, 0.23, 0.96] }}
          onAnimationComplete={() => {
            if (!isCombined && cardRef.current) {
              cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
          }}
        >
          {isCombined ? (
            <>
              <Box sx={{ border: '1px solid #E8ECEE', borderRadius: 1.5, mx: 2.5, mb: 2 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  divider={<Divider orientation="vertical" flexItem sx={{ borderColor: '#E8ECEE', display: { xs: 'none', sm: 'block' } }} />}
                  spacing={{ xs: 2, sm: 0 }}
                  sx={{ py: 2 }}
                >
                  {metrics.map((metric) => {
                    const isNeutral = metric.trend == null || metric.trend === 0;
                    const isGood = !isNeutral && metric.trend < 0;
                    const tp = getTrendProps(isNeutral, isGood);
                    let TrendIcon = RemoveIcon;
                    if (!isNeutral) TrendIcon = metric.trend < 0 ? ArrowDropDownIcon : ArrowDropUpIcon;
                    return (
                      <Stack key={metric.title} spacing={0.75} sx={{ flex: 1, px: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography variant="caption" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.8125rem' }}>
                            {metric.title}
                          </Typography>
                          {METRIC_TOOLTIPS[metric.title] && (
                            <Tooltip title={METRIC_TOOLTIPS[metric.title]} arrow placement="top" slotProps={{ tooltip: { sx: { fontSize: '0.75rem', maxWidth: 260 } } }}>
                              <InfoOutlinedIcon sx={{ fontSize: 15, color: '#919EAB', cursor: 'help' }} />
                            </Tooltip>
                          )}
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.2 }}>
                            {metric.value != null ? `${metric.value}d` : '\u2014'}
                          </Typography>
                          <Stack
                            direction="row"
                            alignItems="center"
                            sx={{ bgcolor: tp.bg, borderRadius: 0.75, px: 0.5, py: 0.25 }}
                          >
                            <TrendIcon sx={{ fontSize: tp.iconSize, color: tp.color, ml: -0.25 }} />
                            <Typography variant="caption" sx={{ fontWeight: 600, color: tp.color, fontSize: '0.75rem', mr: 0.25 }}>
                              {isNeutral ? '0d' : `${metric.trend > 0 ? '+' : ''}${metric.trend}d`}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" sx={{ color: '#919EAB', fontSize: '0.75rem' }}>
                            {trendLabel}
                          </Typography>
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>
              <Stack spacing={1} sx={{ px: 2.5 }}>
                <ChartLegend
                  items={LEGEND_ITEMS}
                  interactive
                  hiddenSeries={hiddenSeries}
                  onToggle={handleToggle}
                />
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
                    series={visibleSeries}
                    xAxis={xAxisConfig}
                    yAxis={[{
                      min: yDomain.max != null ? yDomain.min : combinedYMin,
                      max: yDomain.max ?? combinedYMax,
                      tickLabelStyle: TICK_LABEL_STYLE,
                      valueFormatter: (val) => `${val}d`,
                    }]}
                    height={CHART_HEIGHT}
                    margin={CHART_MARGIN}
                    grid={CHART_GRID}
                    tooltip={{ trigger: 'axis' }}
                    slots={{ axisContent: ChartAxisTooltip }}
                    onAxisClick={handleAxisClick}
                    onMarkClick={handleMarkClick}
                    skipAnimation={isZoomed}
                    hideLegend
                    sx={{
                      ...CHART_SX,
                      cursor: 'pointer',
                      '& .MuiMarkElement-root': { display: 'initial' },
                    }}
                  />
                </ZoomableChart>
              </Stack>
            </>
          ) : (
            <Stack spacing={2} sx={{ px: 2.5 }}>
              {separateConfigs.map((cfg) => (
                <SingleMetricChart
                  key={cfg.metricKey}
                  title={cfg.title}
                  numericData={cfg.data}
                  color={cfg.color}
                  months={months}
                  latestValue={cfg.value}
                  trend={cfg.trend}
                  trendLabel={trendLabel}
                  onAxisClick={(dataIndex) => {
                    const month = months[dataIndex];
                    if (month) {
                      setActiveMetric(cfg.metricKey);
                      setSelectedPoint(month);
                    }
                  }}
                />
              ))}
            </Stack>
          )}
        </m.div>
      </AnimatePresence>
      <CreatorDrilldownDrawer
        selectedPoint={selectedPoint}
        points={months}
        data={referenceData}
        isDaily={isDaily}
        onClose={() => { setSelectedPoint(null); setActiveMetric(null); }}
        onNavigate={setSelectedPoint}
        config={drilldownConfig}
      />
    </ChartCard>
  );
}

export default memo(TimeToActivationChart);
