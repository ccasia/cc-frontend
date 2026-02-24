import { useRef, useState, useMemo, useCallback, useEffect } from 'react';

import RemoveIcon from '@mui/icons-material/Remove';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SplitscreenIcon from '@mui/icons-material/Splitscreen';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import StackedLineChartIcon from '@mui/icons-material/StackedLineChart';
import { Box, Stack, Divider, Tooltip, IconButton, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';

import useChartZoom from 'src/hooks/use-chart-zoom';
import useGetAvgAgreementResponse from 'src/hooks/use-get-avg-agreement-response';
import useGetAvgFirstCampaign from 'src/hooks/use-get-avg-first-campaign';
import useGetAvgSubmissionResponse from 'src/hooks/use-get-avg-submission-response';

import { useIsDaily, useDateFilter, useFilteredData, useTrendLabel } from '../date-filter-context';
import ChartCard from '../components/chart-card';
import ChartLegend from '../components/chart-legend';
import ZoomableChart from '../components/zoomable-chart';
import ChartAxisTooltip from '../components/chart-axis-tooltip';
import ResponseTimeDrawer from './response-time-drawer';
import { CHART_SX, CHART_GRID, CHART_COLORS, CHART_MARGIN, CHART_HEIGHT, TICK_LABEL_STYLE, getTrendProps } from '../chart-config';

const LEGEND_ITEMS = [
  { label: 'Agreement Response', color: CHART_COLORS.primary },
  { label: 'Time to 1st Accepted Campaign', color: CHART_COLORS.warning },
  { label: 'Submission Response', color: CHART_COLORS.success },
];

function SingleMetricChart({ title, numericData, color, months, latestValue, trend, trendLabel, fmtHours, onAxisClick }) {
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
        <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2 }}>
          {latestValue}h
        </Typography>
        <Stack direction="row" alignItems="center" sx={{ bgcolor: tp.bg, borderRadius: 0.75, px: 0.5, py: 0.25 }}>
          <TrendIcon sx={{ fontSize: tp.iconSize, color: tp.color, ml: -0.25 }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: tp.color, fontSize: '0.75rem', mr: 0.25 }}>
            {isNeutral ? '0h' : `${trend > 0 ? '+' : ''}${trend}h`}
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

export default function ResponseTimeCharts() {
  const { startDate, endDate } = useDateFilter();
  const isDaily = useIsDaily();
  const trendLabel = useTrendLabel();

  const hookOptions = useMemo(() => {
    if (isDaily && startDate && endDate) return { granularity: 'daily', startDate, endDate };
    return {};
  }, [isDaily, startDate, endDate]);

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
      value: `${latestAgreement}h`,
      trend: agreementTrend,
    },
    {
      title: 'Avg Time to 1st Accepted Campaign',
      value: `${latestCampaign}h`,
      trend: campaignTrend,
    },
    {
      title: 'Avg Submission Response',
      value: `${latestSubmission}h`,
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
    <ChartCard title="Response Times" icon={AccessTimeIcon} subtitle="Monthly avg response times across key workflow stages" headerRight={headerToggle}>
      {isCombined ? (
        <>
          <Box sx={{ border: '1px solid #E8ECEE', borderRadius: 1.5, mx: 2.5, mb: 2 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              divider={<Divider orientation="vertical" flexItem sx={{ borderColor: '#E8ECEE', display: { xs: 'none', sm: 'block' } }} />}
              spacing={{ xs: 2, sm: 0 }}
              sx={{ py: 2 }}
            >
              {metrics.map((m) => {
                const isNeutral = m.trend == null || m.trend === 0;
                const isGood = !isNeutral && m.trend < 0;
                const tp = getTrendProps(isNeutral, isGood);
                let TrendIcon = RemoveIcon;
                if (!isNeutral) TrendIcon = m.trend < 0 ? ArrowDropDownIcon : ArrowDropUpIcon;
                return (
                  <Stack key={m.title} spacing={0.75} sx={{ flex: 1, px: 2 }}>
                    <Typography variant="caption" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.8125rem' }}>
                      {m.title}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.2 }}>
                        {m.value}
                      </Typography>
                      <Stack
                        direction="row"
                        alignItems="center"
                        sx={{ bgcolor: tp.bg, borderRadius: 0.75, px: 0.5, py: 0.25 }}
                      >
                        <TrendIcon sx={{ fontSize: tp.iconSize, color: tp.color, ml: -0.25 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: tp.color, fontSize: '0.75rem', mr: 0.25 }}>
                          {isNeutral ? '0h' : `${m.trend > 0 ? '+' : ''}${m.trend}h`}
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
