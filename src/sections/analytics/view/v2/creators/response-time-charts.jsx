import { useRef, useState, useMemo, useCallback, useEffect } from 'react';

import RemoveIcon from '@mui/icons-material/Remove';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Box, Stack, Divider, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';

import useChartZoom from 'src/hooks/use-chart-zoom';

import { useFilteredData } from '../date-filter-context';
import ChartCard from '../components/chart-card';
import ChartLegend from '../components/chart-legend';
import ZoomableChart from '../components/zoomable-chart';
import ChartAxisTooltip from '../components/chart-axis-tooltip';
import ResponseTimeDrawer from './response-time-drawer';
import { CHART_SX, CHART_GRID, CHART_COLORS, CHART_MARGIN, CHART_HEIGHT, TICK_LABEL_STYLE, getTrendProps } from '../chart-config';
import {
  MOCK_AVG_AGREEMENT_TIME,
  MOCK_AVG_SUBMISSION_TIME,
  MOCK_AVG_FIRST_CAMPAIGN_TIME,
} from '../mock-data';

const LEGEND_ITEMS = [
  { label: 'Agreement Response', color: CHART_COLORS.primary },
  { label: 'Time to 1st Accepted Campaign', color: CHART_COLORS.warning },
  { label: 'Submission Response', color: CHART_COLORS.success },
];

export default function ResponseTimeCharts() {
  const filteredAgreement = useFilteredData(MOCK_AVG_AGREEMENT_TIME);
  const filteredCampaign = useFilteredData(MOCK_AVG_FIRST_CAMPAIGN_TIME);
  const filteredSubmission = useFilteredData(MOCK_AVG_SUBMISSION_TIME);

  const months = useMemo(() => filteredAgreement.map((d) => d.month), [filteredAgreement]);
  const indices = useMemo(() => months.map((_, i) => i), [months]);

  const allSeries = useMemo(() => [
    { data: filteredAgreement.map((d) => d.avgHours), label: 'Agreement Response', color: CHART_COLORS.primary, curve: 'linear', area: true, valueFormatter: (val) => `${val}h` },
    { data: filteredCampaign.map((d) => d.avgHours), label: 'Time to 1st Accepted Campaign', color: CHART_COLORS.warning, curve: 'linear', area: true, valueFormatter: (val) => `${val}h` },
    { data: filteredSubmission.map((d) => d.avgHours), label: 'Submission Response', color: CHART_COLORS.success, curve: 'linear', area: true, valueFormatter: (val) => `${val}h` },
  ], [filteredAgreement, filteredCampaign, filteredSubmission]);

  const [hiddenSeries, setHiddenSeries] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const clickStartRef = useRef(null);

  const handleToggle = useCallback((label) => {
    setHiddenSeries((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }, []);

  const latestAgreement = filteredAgreement.length > 0 ? filteredAgreement[filteredAgreement.length - 1].avgHours : 0;
  const latestCampaign = filteredCampaign.length > 0 ? filteredCampaign[filteredCampaign.length - 1].avgHours : 0;
  const latestSubmission = filteredSubmission.length > 0 ? filteredSubmission[filteredSubmission.length - 1].avgHours : 0;
  const prevAgreement = filteredAgreement.length > 1 ? filteredAgreement[filteredAgreement.length - 2].avgHours : null;
  const prevCampaign = filteredCampaign.length > 1 ? filteredCampaign[filteredCampaign.length - 2].avgHours : null;
  const prevSubmission = filteredSubmission.length > 1 ? filteredSubmission[filteredSubmission.length - 2].avgHours : null;

  const calcTrend = (current, p) => (p != null ? Math.round((current - p) * 10) / 10 : null);

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
      trend: calcTrend(latestAgreement, prevAgreement),
    },
    {
      title: 'Avg Time to 1st Accepted Campaign',
      value: `${latestCampaign}h`,
      trend: calcTrend(latestCampaign, prevCampaign),
    },
    {
      title: 'Avg Submission Response',
      value: `${latestSubmission}h`,
      trend: calcTrend(latestSubmission, prevSubmission),
    },
  ];

  return (
    <ChartCard title="Response Times" icon={AccessTimeIcon} subtitle="Monthly avg response times across key workflow stages">
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
                    vs last month
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
            }}
          />
        </ZoomableChart>
      </Stack>
      <ResponseTimeDrawer
        selectedMonth={selectedMonth}
        months={months}
        onClose={() => setSelectedMonth(null)}
        onNavigate={setSelectedMonth}
      />
    </ChartCard>
  );
}
