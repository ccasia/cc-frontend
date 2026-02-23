
import { useMemo, useEffect } from 'react';

import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';
import WcOutlinedIcon from '@mui/icons-material/WcOutlined';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import RemoveIcon from '@mui/icons-material/Remove';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { useAxisTooltip } from '@mui/x-charts/ChartsTooltip';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Card, Chip, Stack, Paper, Divider, Tooltip, Typography, useTheme, useMediaQuery } from '@mui/material';

import useChartZoom from 'src/hooks/use-chart-zoom';

import ChartItemTooltip from '../components/chart-item-tooltip';
import ZoomableChart from '../components/zoomable-chart';
import { useFilteredData, useFilterLabel } from '../date-filter-context';
import { MOCK_CREATOR_GROWTH, MOCK_CREATOR_DEMOGRAPHICS } from '../mock-data';
import { CHART_SX, CHART_GRID, CHART_COLORS, CHART_MARGIN, CHART_HEIGHT, TICK_LABEL_STYLE, getTrendProps } from '../chart-config';

function GrowthTooltip() {
  const tooltipData = useAxisTooltip();

  if (!tooltipData) return null;

  const { axisFormattedValue, axisValue, seriesItems } = tooltipData;
  const dataIndex = Math.round(axisValue);
  const item = dataIndex >= 0 && dataIndex < MOCK_CREATOR_GROWTH.length ? MOCK_CREATOR_GROWTH[dataIndex] : null;

  if (!item) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 1.5,
        borderRadius: 1,
        minWidth: 160,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75 }}>
        {axisFormattedValue ?? axisValue}
      </Typography>
      {seriesItems.map((s) => (
        <Stack key={s.seriesId} direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, display: 'inline-block' }} />
            <Typography variant="caption" sx={{ color: '#666' }}>New Sign-ups</Typography>
          </Stack>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>{item.newSignups}</Typography>
        </Stack>
      ))}
      <Divider sx={{ my: 0.75 }} />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" sx={{ color: '#666' }}>Total Creators</Typography>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>{item.total.toLocaleString()}</Typography>
      </Stack>
    </Paper>
  );
}

// Demographics panel — gender donut + age group bars
function DemographicsPanel({ chipLabel, total, growthRate, trend, TrendIcon, isNeutral }) { // eslint-disable-line react/prop-types
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const donutSize = isSmall ? 160 : 180;

  const { gender, ageGroups } = MOCK_CREATOR_DEMOGRAPHICS;
  const genderTotal = gender.reduce((sum, d) => sum + d.value, 0);

  const pieData = gender.map((d, i) => ({
    id: i,
    value: d.value,
    label: d.label,
    color: d.color,
  }));

  return (
    <Stack sx={{ px: 3, pb: 2, width: '100%', height: '100%', justifyContent: 'space-between' }}>
      {/* Gender Section */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.5 }}>
          <WcOutlinedIcon sx={{ fontSize: 18, color: '#919EAB' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
            Gender
          </Typography>
        </Stack>
        <Stack alignItems="center" spacing={1}>
          <Box sx={{ position: 'relative', flexShrink: 0, width: donutSize, height: donutSize }}>
            <PieChart
              series={[{
                data: pieData,
                innerRadius: '55%',
                outerRadius: '90%',
                paddingAngle: 2,
                cornerRadius: 3,
                valueFormatter: (item) => `${item.value.toLocaleString()} creators`,
              }]}
              height={donutSize}
              width={donutSize}
              margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
              hideLegend
              slots={{ tooltip: ChartItemTooltip }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <Typography variant="caption" sx={{ color: '#919EAB', fontSize: '0.7rem', lineHeight: 1 }}>
                Total
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '1.35rem', lineHeight: 1.2, color: '#333' }}>
                {genderTotal.toLocaleString()}
              </Typography>
            </Box>
          </Box>
          {/* Gender legend */}
          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
            {gender.map((d) => (
              <Stack key={d.label} direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color: '#333', fontWeight: 500, fontSize: '0.75rem' }}>
                  {d.label}
                </Typography>
                <Typography variant="caption" sx={{ color: '#919EAB', fontWeight: 500, fontSize: '0.7rem' }}>
                  {((d.value / genderTotal) * 100).toFixed(0)}%
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Box>

      <Divider sx={{ borderColor: '#E8ECEE', my: 1.5 }} />

      {/* Age Groups Section */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <CalendarMonthOutlinedIcon sx={{ fontSize: 18, color: '#919EAB' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
            Age Groups
          </Typography>
        </Stack>
        <Box sx={{ width: '100%' }}>
          <BarChart
            layout="horizontal"
            series={[{
              data: ageGroups.map((d) => d.value),
              valueFormatter: (val) => {
                const pct = ((val / genderTotal) * 100).toFixed(1);
                return `${val.toLocaleString()} (${pct}%)`;
              },
            }]}
            yAxis={[{
              scaleType: 'band',
              data: ageGroups.map((d) => d.label),
              tickLabelStyle: { fill: '#333', fontSize: 12, fontWeight: 500 },
              colorMap: {
                type: 'ordinal',
                values: ageGroups.map((d) => d.label),
                colors: ageGroups.map((d) => d.color),
              },
            }]}
            xAxis={[{
              tickLabelStyle: { fill: '#666', fontSize: 11, fontWeight: 500 },
            }]}
            height={280}
            margin={{ top: 16, bottom: 8, left: 36, right: 36 }}
            grid={{ vertical: true, horizontal: false }}
            hideLegend
            barLabel={(item) => {
              const val = item.value;
              const pct = ((val / genderTotal) * 100).toFixed(0);
              return `${val.toLocaleString()} (${pct}%)`;
            }}
            sx={{
              overflow: 'visible',
              '& .MuiChartsAxis-tick': { display: 'none' },
              '& .MuiChartsAxis-left .MuiChartsAxis-line': { display: 'none' },
              '& .MuiChartsAxis-bottom .MuiChartsAxis-line': { stroke: '#E0E3E7', strokeWidth: 1 },
              '& .MuiChartsGrid-line': { stroke: '#F0F2F4', strokeDasharray: '4 4' },
              '& .MuiBarLabel-root': { fill: '#fff', fontSize: 11, fontWeight: 600 },
              '& .MuiBarElement-root': { rx: 3 },
            }}
          />
        </Box>
      </Box>
    </Stack>
  );
}

export default function CreatorGrowthChart() {
  const filtered = useFilteredData(MOCK_CREATOR_GROWTH);
  const chipLabel = useFilterLabel('All time');
  const signups = useMemo(() => filtered.map((d) => d.newSignups), [filtered]);
  const months = useMemo(() => filtered.map((d) => d.month), [filtered]);
  const indices = useMemo(() => months.map((_, i) => i), [months]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const latest = filtered[filtered.length - 1] || { total: 0, growthRate: 0, newSignups: 0 };
  const prev = filtered.length >= 2 ? filtered[filtered.length - 2] : null;
  const isNeutral = !prev || latest.growthRate === 0;
  const isUp = !isNeutral && latest.total > prev.total;
  const trend = getTrendProps(isNeutral, isUp);
  let TrendIcon = RemoveIcon;
  if (!isNeutral) TrendIcon = isUp ? ArrowDropUpIcon : ArrowDropDownIcon;

  const { xAxis: xDomain, yDomain, isZoomed, resetZoom, containerProps, setYSources } = useChartZoom(filtered.length);

  useEffect(() => { setYSources([signups]); }, [setYSources, signups]);

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

  return (
    <Card
      sx={{
        border: '1px solid #E8ECEE',
        borderRadius: 2,
        bgcolor: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        overflow: 'visible',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{ height: '100%', flex: 1 }}
      >
        {/* Left: Chart section with its own header */}
        <Box sx={{ flex: { md: 3 }, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Chart header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, pt: 3, pb: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <ShowChartIcon sx={{ fontSize: 18, color: '#919EAB', mr: 0.5 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                Creator Growth
              </Typography>
              <Tooltip
                title="New creator sign-ups per month"
                arrow
                placement="top"
                slotProps={{
                  tooltip: {
                    sx: {
                      bgcolor: '#1C252E',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      maxWidth: 240,
                      px: 1.5,
                      py: 1,
                      borderRadius: 1,
                    },
                  },
                  arrow: { sx: { color: '#1C252E' } },
                }}
              >
                <HelpOutlineIcon
                  sx={{
                    fontSize: 16,
                    color: '#919EAB',
                    cursor: 'help',
                    transition: 'color 0.2s',
                    '&:hover': { color: '#333' },
                  }}
                />
              </Tooltip>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Chip label={chipLabel} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: 11, height: 22, color: '#919EAB', borderColor: '#E8ECEE' }} />
              <Stack direction="row" alignItems="baseline" spacing={0.5}>
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>
                  {latest.total.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#919EAB', fontWeight: 500 }}>creators</Typography>
              </Stack>
              <Stack
                direction="row"
                alignItems="center"
                sx={{ bgcolor: trend.bg, borderRadius: 0.75, px: 0.5, py: 0.25 }}
              >
                <TrendIcon sx={{ fontSize: trend.iconSize, color: trend.color, ml: -0.25 }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: trend.color, fontSize: '0.7rem', mr: 0.25 }}>
                  {isNeutral ? '0%' : `${latest.growthRate > 0 ? '+' : ''}${latest.growthRate}%`}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
          {/* Chart content */}
          <Box sx={{ px: 1, pb: 1, flex: 1 }}>
            <ZoomableChart containerProps={containerProps} isZoomed={isZoomed} resetZoom={resetZoom}>
              <LineChart
                series={[{
                  data: signups,
                  label: 'New Creators',
                  color: CHART_COLORS.primary,
                  area: true,
                  curve: 'linear',
                }]}
                xAxis={xAxisConfig}
                yAxis={[{ ...yDomain, tickLabelStyle: TICK_LABEL_STYLE }]}
                height={560}
                margin={CHART_MARGIN}
                grid={CHART_GRID}
                tooltip={{ trigger: 'axis' }}
                slots={{ axisContent: GrowthTooltip }}
                skipAnimation={isZoomed}
                hideLegend
                sx={CHART_SX}
              />
            </ZoomableChart>
          </Box>
        </Box>

        {/* Right: Demographics panel - starts from top of card */}
        <Stack
          sx={{
            flex: { md: 2 },
            borderLeft: { md: '1px solid #E8ECEE' },
            borderTop: { xs: '1px solid #E8ECEE', md: 'none' },
            pt: { md: 3 },
          }}
        >
          <DemographicsPanel
            chipLabel={chipLabel}
            total={latest.total}
            growthRate={latest.growthRate}
            trend={trend}
            TrendIcon={TrendIcon}
            isNeutral={isNeutral}
          />
        </Stack>
      </Stack>
    </Card>
  );
}
