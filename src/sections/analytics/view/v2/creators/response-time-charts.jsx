import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';
import { memo, useRef, useMemo, useState, useEffect, useCallback } from 'react';

import RemoveIcon from '@mui/icons-material/Remove';
import { LineChart } from '@mui/x-charts/LineChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SplitscreenIcon from '@mui/icons-material/Splitscreen';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import StackedLineChartIcon from '@mui/icons-material/StackedLineChart';
import { Box, Stack, Divider, Tooltip, IconButton, Typography } from '@mui/material';

import useChartZoom from 'src/hooks/use-chart-zoom';
import useGetAvgFirstCampaign from 'src/hooks/use-get-avg-first-campaign';
import useGetAvgAgreementResponse from 'src/hooks/use-get-avg-agreement-response';
import useGetAvgSubmissionResponse from 'src/hooks/use-get-avg-submission-response';

import ChartCard from '../components/chart-card';
import ChartLegend from '../components/chart-legend';
import ResponseTimeDrawer from './response-time-drawer';
import ZoomableChart from '../components/zoomable-chart';
import ChartAxisTooltip from '../components/chart-axis-tooltip';
import { useIsDaily, useDateFilter, useTrendLabel, useFilteredData } from '../date-filter-context';
import { CHART_SX, CHART_GRID, CHART_COLORS, CHART_MARGIN, CHART_HEIGHT, getTrendProps, TICK_LABEL_STYLE } from '../chart-config';

const LEGEND_ITEMS = [
  { label: 'Agreement Response', color: CHART_COLORS.primary },
  { label: 'Time to 1st Accepted Campaign', color: CHART_COLORS.warning },
  { label: 'Submission Response', color: CHART_COLORS.success },
];

const METRIC_TOOLTIPS = {
  'Avg Agreement Response': 'Average time for creators to sign and submit the agreement after it\u2019s sent by CS.',
  'Avg Time to 1st Accepted Campaign': 'Average time from a creator\u2019s pitch to being shortlisted for their first campaign.',
  'Avg Submission Response': 'Average time for creators to submit their first draft after the agreement is approved.',
};

function SingleMetricChart({ title, numericData, color, months, latestValue, trend, trendLabel, fmtHours, fmtShort: fmtShortProp, onAxisClick }) {
  const indices = useMemo(() => months.map((_, i) => i), [months]);
  const clickStartRef = useRef(null);

  const series = useMemo(() => [
    { data: numericData, label: title, color, curve: 'linear', area: true, showMark: true, connectNulls: true, valueFormatter: fmtHours },
  ], [numericData, title, color, fmtHours]);

  const { xAxis: xDomain, yDomain, isZoomed, resetZoom, containerProps, setYSources } = useChartZoom(months.length);

  useEffect(() => {
    setYSources([numericData]);
  }, [setYSources, numericData]);

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
          {fmtShortProp(latestValue)}
        </Typography>
        <Stack direction="row" alignItems="center" sx={{ bgcolor: tp.bg, borderRadius: 0.75, px: 0.5, py: 0.25 }}>
          <TrendIcon sx={{ fontSize: tp.iconSize, color: tp.color, ml: -0.25 }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: tp.color, fontSize: '0.75rem', mr: 0.25 }}>
            {isNeutral ? '0h' : `${trend > 0 ? '+' : '-'}${fmtShortProp(Math.abs(trend))}`}
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
          yAxis={[{ ...yDomain, tickLabelStyle: TICK_LABEL_STYLE, valueFormatter: (val) => `${val}h` }]}
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
  numericData: PropTypes.arrayOf(PropTypes.number).isRequired,
  color: PropTypes.string.isRequired,
  months: PropTypes.arrayOf(PropTypes.string).isRequired,
  latestValue: PropTypes.number.isRequired,
  trend: PropTypes.number,
  trendLabel: PropTypes.string,
  fmtHours: PropTypes.func.isRequired,
  fmtShort: PropTypes.func.isRequired,
  onAxisClick: PropTypes.func.isRequired,
};

function ResponseTimeCharts() {
  const { startDate, endDate, creditTiers } = useDateFilter();
  const isDaily = useIsDaily();
  const trendLabel = useTrendLabel();

  const hookOptions = useMemo(() => {
    const opts = {};
    if (isDaily && startDate && endDate) Object.assign(opts, { granularity: 'daily', startDate, endDate });
    if (creditTiers.length > 0) opts.creditTiers = creditTiers;
    return opts;
  }, [isDaily, startDate, endDate, creditTiers]);

  const { avgAgreementResponse, periodComparison: agreementComparison } = useGetAvgAgreementResponse(hookOptions);
  const { avgFirstCampaign, periodComparison: campaignComparison } = useGetAvgFirstCampaign(hookOptions);
  const { avgSubmissionResponse, periodComparison: submissionComparison } = useGetAvgSubmissionResponse(hookOptions);

  // For monthly, filter to visible range; for daily, backend already returns the range
  const monthlyFilteredAgreement = useFilteredData(avgAgreementResponse);
  const filteredAgreement = isDaily ? avgAgreementResponse : monthlyFilteredAgreement;

  const monthlyFilteredCampaign = useFilteredData(avgFirstCampaign);
  const filteredCampaign = isDaily ? avgFirstCampaign : monthlyFilteredCampaign;

  const monthlyFilteredSubmission = useFilteredData(avgSubmissionResponse);
  const filteredSubmission = isDaily ? avgSubmissionResponse : monthlyFilteredSubmission;

  // Trim trailing nulls (future months with no data) so the line doesn't trail off
  const trimmedAgreement = useMemo(() => {
    let lastIdx = filteredAgreement.length - 1;
    while (lastIdx >= 0 && filteredAgreement[lastIdx].avgHours == null) lastIdx -= 1;
    return filteredAgreement.slice(0, lastIdx + 1);
  }, [filteredAgreement]);

  const trimmedCampaign = useMemo(() => {
    let lastIdx = filteredCampaign.length - 1;
    while (lastIdx >= 0 && filteredCampaign[lastIdx]?.avgHours == null) lastIdx -= 1;
    return filteredCampaign.slice(0, lastIdx + 1);
  }, [filteredCampaign]);

  const trimmedSubmission = useMemo(() => {
    let lastIdx = filteredSubmission.length - 1;
    while (lastIdx >= 0 && filteredSubmission[lastIdx]?.avgHours == null) lastIdx -= 1;
    return filteredSubmission.slice(0, lastIdx + 1);
  }, [filteredSubmission]);

  // Ensure numeric values (Prisma Decimal may arrive as strings)
  const agreementData = useMemo(
    () => trimmedAgreement.map((d) => d.avgHours != null ? Number(d.avgHours) : null),
    [trimmedAgreement]
  );

  const campaignData = useMemo(
    () => trimmedCampaign.map((d) => d.avgHours != null ? Number(d.avgHours) : null),
    [trimmedCampaign]
  );

  const submissionData = useMemo(
    () => trimmedSubmission.map((d) => d.avgHours != null ? Number(d.avgHours) : null),
    [trimmedSubmission]
  );

  // Use the longest series for x-axis labels (and keep reference data for drawer isoDate lookup)
  const { months, referenceData } = useMemo(() => {
    const series = [trimmedAgreement, trimmedCampaign, trimmedSubmission];
    const longest = series.reduce((a, b) => (b.length >= a.length ? b : a), series[0]);
    return {
      months: longest.map((d) => d.date || d.month),
      referenceData: longest,
    };
  }, [trimmedAgreement, trimmedCampaign, trimmedSubmission]);

  const indices = useMemo(() => months.map((_, i) => i), [months]);

  const fmtHours = useCallback((val) => {
    if (val == null) return 'No data';
    const totalSecs = Math.round(val * 3600);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${val}h (${mins}m ${secs}s)`;
  }, []);

  const fmtShort = useCallback((val) => {
    if (val == null) return '—';
    const h = Number(val);
    const totalSecs = Math.round(h * 3600);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (h >= 1) return `${h}h`;
    return `${mins}m ${secs}s`;
  }, []);

  const allSeries = useMemo(() => [
    { data: agreementData, label: 'Agreement Response', color: CHART_COLORS.primary, curve: 'linear', area: true, showMark: true, connectNulls: true, valueFormatter: fmtHours },
    { data: campaignData, label: 'Time to 1st Accepted Campaign', color: CHART_COLORS.warning, curve: 'linear', area: true, showMark: true, connectNulls: true, valueFormatter: fmtHours },
    { data: submissionData, label: 'Submission Response', color: CHART_COLORS.success, curve: 'linear', area: true, showMark: true, connectNulls: true, valueFormatter: fmtHours },
  ], [agreementData, campaignData, submissionData, fmtHours]);

  const [hiddenSeries, setHiddenSeries] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [viewMode, setViewMode] = useState('combined');
  const [activeMetric, setActiveMetric] = useState(null);
  const clickStartRef = useRef(null);
  const cardRef = useRef(null);

  const handleToggle = useCallback((label) => {
    setHiddenSeries((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }, []);

  // Agreement trend: daily mode uses API periodComparison, monthly uses last vs prev
  const nonNullAgreement = useMemo(() => agreementData.filter((v) => v != null), [agreementData]);
  const nonNullCampaign = useMemo(() => campaignData.filter((v) => v != null), [campaignData]);
  const nonNullSubmission = useMemo(() => submissionData.filter((v) => v != null), [submissionData]);
  const latestAgreement = nonNullAgreement.length > 0 ? nonNullAgreement[nonNullAgreement.length - 1] : 0;
  const latestCampaign = nonNullCampaign.length > 0 ? nonNullCampaign[nonNullCampaign.length - 1] : 0;
  const latestSubmission = nonNullSubmission.length > 0 ? nonNullSubmission[nonNullSubmission.length - 1] : 0;

  const calcTrend = (current, p) => (p != null ? Math.round((current - p) * 10) / 10 : null);

  let agreementTrend = null;
  if (isDaily && agreementComparison) {
    agreementTrend = agreementComparison.change;
  } else {
    const prevAgreement = nonNullAgreement.length >= 2 ? nonNullAgreement[nonNullAgreement.length - 2] : null;
    agreementTrend = calcTrend(latestAgreement, prevAgreement);
  }

  let campaignTrend = null;
  if (isDaily && campaignComparison) {
    campaignTrend = campaignComparison.change;
  } else {
    const prevCampaign = nonNullCampaign.length >= 2 ? nonNullCampaign[nonNullCampaign.length - 2] : null;
    campaignTrend = calcTrend(latestCampaign, prevCampaign);
  }

  let submissionTrend = null;
  if (isDaily && submissionComparison) {
    submissionTrend = submissionComparison.change;
  } else {
    const prevSubmission = nonNullSubmission.length >= 2 ? nonNullSubmission[nonNullSubmission.length - 2] : null;
    submissionTrend = calcTrend(latestSubmission, prevSubmission);
  }

  const { xAxis: xDomain, yDomain, isZoomed, resetZoom, containerProps, setYSources } = useChartZoom(months.length);

  const visibleSeries = useMemo(
    () => allSeries.filter((s) => !hiddenSeries.includes(s.label)),
    [hiddenSeries, allSeries]
  );

  useEffect(() => {
    setYSources(visibleSeries.map((s) => s.data));
  }, [setYSources, visibleSeries]);

  const handleAxisClick = useCallback((event, data) => {
    if (!data || data.dataIndex == null) return;
    // Guard against drag — if mouse moved >5px, it was a pan, not a click
    if (clickStartRef.current) {
      const dx = event.clientX - clickStartRef.current.x;
      const dy = event.clientY - clickStartRef.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) return;
    }
    const month = months[data.dataIndex];
    if (month) setSelectedMonth(month);
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
    {
      title: 'Avg Agreement Response',
      value: fmtShort(latestAgreement),
      trend: agreementTrend,
    },
    {
      title: 'Avg Time to 1st Accepted Campaign',
      value: fmtShort(latestCampaign),
      trend: campaignTrend,
    },
    {
      title: 'Avg Submission Response',
      value: fmtShort(latestSubmission),
      trend: submissionTrend,
    },
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

  const METRIC_KEYS = ['agreement', 'firstCampaign', 'submission'];
  const separateConfigs = [
    { title: 'Avg Agreement Response', data: agreementData, color: CHART_COLORS.primary, value: latestAgreement, trend: agreementTrend, metricKey: METRIC_KEYS[0] },
    { title: 'Avg Time to 1st Accepted Campaign', data: campaignData, color: CHART_COLORS.warning, value: latestCampaign, trend: campaignTrend, metricKey: METRIC_KEYS[1] },
    { title: 'Avg Submission Response', data: submissionData, color: CHART_COLORS.success, value: latestSubmission, trend: submissionTrend, metricKey: METRIC_KEYS[2] },
  ];

  return (
    <ChartCard ref={cardRef} title="Response Times" icon={AccessTimeIcon} subtitle="Monthly avg response times across key workflow stages" headerRight={headerToggle}>
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
                            {metric.value}
                          </Typography>
                          <Stack
                            direction="row"
                            alignItems="center"
                            sx={{ bgcolor: tp.bg, borderRadius: 0.75, px: 0.5, py: 0.25 }}
                          >
                            <TrendIcon sx={{ fontSize: tp.iconSize, color: tp.color, ml: -0.25 }} />
                            <Typography variant="caption" sx={{ fontWeight: 600, color: tp.color, fontSize: '0.75rem', mr: 0.25 }}>
                              {isNeutral ? '0h' : `${metric.trend > 0 ? '+' : '-'}${fmtShort(Math.abs(metric.trend))}`}
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
                    yAxis={[{ ...yDomain, tickLabelStyle: TICK_LABEL_STYLE, valueFormatter: (val) => `${val}h` }]}
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
                  fmtHours={fmtHours}
                  fmtShort={fmtShort}
                  onAxisClick={(dataIndex) => {
                    const month = months[dataIndex];
                    if (month) {
                      setActiveMetric(cfg.metricKey);
                      setSelectedMonth(month);
                    }
                  }}
                />
              ))}
            </Stack>
          )}
        </m.div>
      </AnimatePresence>
      <ResponseTimeDrawer
        selectedMonth={selectedMonth}
        months={months}
        data={referenceData}
        isDaily={isDaily}
        onClose={() => { setSelectedMonth(null); setActiveMetric(null); }}
        onNavigate={setSelectedMonth}
        activeMetric={isCombined ? null : activeMetric}
      />
    </ChartCard>
  );
}

export default memo(ResponseTimeCharts);
