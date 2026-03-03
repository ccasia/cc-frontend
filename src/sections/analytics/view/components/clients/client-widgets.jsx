import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  Box,
  Typography,
  Stack,
  useTheme,
  useMediaQuery,
  LinearProgress,
} from '@mui/material';
import { PieChart, BarChart, axisClasses, ScatterChart, ChartsReferenceLine } from '@mui/x-charts';

import {
  ClientTooltip,
  MatrixTooltip,
  PieTooltip,
  RenewalTooltip,
  TurnaroundTooltip,
} from './client-tooltips';
import Iconify from 'src/components/iconify';

// Your Brand Colors
const COLORS = {
  blue: '#1340FF',
  green: '#1ABF66',
  orange: '#FFC702',
  red: '#D4321C',
  purple: '#8A5AFE',
  lightGreen: '#A7F3D0',
};

const hiddenAxisSettings = {
  disableLine: true,
  disableTicks: true,
  tickLabelStyle: {
    display: 'none',
  },
};

// Common Chart Settings to remove grid lines and match your clean style
const cleanChartSettings = {
  sx: {
    [`.${axisClasses.left} .${axisClasses.line}`]: { stroke: 'transparent' },
    [`.${axisClasses.bottom} .${axisClasses.line}`]: { stroke: 'transparent' },
    [`.${axisClasses.left} .${axisClasses.tick}`]: { display: 'none' },
    [`.${axisClasses.bottom} .${axisClasses.tick}`]: { display: 'none' },
    [`.${axisClasses.root}`]: {
      padding: '5px',
    },
  },
};

const STEP_CONFIG = [
  { key: 'GENERAL_CAMPAIGN_INFORMATION', title: 'General Info', color: '#8A5AFE' },
  { key: 'CAMPAIGN_OBJECTIVES', title: 'Objectives', color: '#026D54' },
  { key: 'TARGET_AUDIENCE', title: 'Target Audience', color: '#FFF0E5' },
  { key: 'LOGISTICS__OPTIONAL_', title: 'Logistics', color: '#D8FF01' },
  { key: 'RESERVATION_SLOTS', title: 'Reservation Slots', color: '#D8FF01' },
  { key: 'ADDITIONAL_LOGISTIC_REMARKS', title: 'Logistic Remarks', color: '#D8FF01' },
  { key: 'NEXT_STEPS', title: 'Next Steps', color: '#D8FF01' },
  { key: 'ADDITIONAL_DETAILS_1', title: 'Additional Details 1', color: '#FF3500' },
  { key: 'ADDITIONAL_DETAILS_2', title: 'Additional Details 2', color: '#D8FF01' },
];

// --- 1. Top KPI Cards (Unchanged, just layout) ---
export function TopKPICard({ title, mainValue, children }) {
  return (
    <Card
      sx={{ p: 2, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', height: '100%' }}
    >
      <Typography variant="subtitle2" color="text.secondary" mb={1}>
        {title}
      </Typography>
      <Typography
        variant="h3"
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          lineHeight: 1.2,
          fontSize: { xs: '1.75rem', sm: '2rem' },
        }}
      >
        {mainValue}
      </Typography>
      <Box sx={{ mt: 'auto' }}>{children}</Box>
    </Card>
  );
}

TopKPICard.propTypes = {
  title: PropTypes.string.isRequired,
  mainValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  children: PropTypes.node,
};

// --- 2. Row 2: Time Spent (Horizontal Bar) ---
export function TimeSpentChart({ data }) {
  const dataset = STEP_CONFIG.map((config) => {
    const dbMatch = data?.find((item) => item.name === config.key);

    return {
      name: config.title,
      minutes: dbMatch ? Number((dbMatch.value / 60).toFixed(1)) : 0,
    };
  });

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        height: 350,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" justifyContent="space-between" mb={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="mdi:access-time" width={20} color="grey.500" />
          <Typography variant="subtitle1" fontWeight="bold">
            Time Spent per Step
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          In Minutes
        </Typography>
      </Stack>
      <Box sx={{ flexGrow: 1, minWidth: 0, minHeight: 0, width: '100%' }}>
        <BarChart
          dataset={dataset}
          yAxis={[{ scaleType: 'band', dataKey: 'name', categoryGapRatio: 0.5 }]}
          xAxis={[{ ...hiddenAxisSettings }]}
          series={[
            {
              dataKey: 'minutes',
              label: 'Time Spent',
              borderRadius: 6,
            },
          ]}
          layout="horizontal"
          margin={{ left: 110, right: 40, top: 10, bottom: 10 }}
          {...cleanChartSettings}
          slots={{ axisContent: ClientTooltip }}
          slotProps={{ legend: { hidden: true }, tooltip: { trigger: 'item' } }}
        />
      </Box>
    </Card>
  );
}

TimeSpentChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.number,
    })
  ),
};

// --- 3. Row 2: Most Skipped Fields ---
export function SkippedFieldsChart({ journey, campaign }) {
  const dataArray = Array.isArray(journey) ? journey : journey?.skippedFields || [];

  const dataset = dataArray.map((item) => ({
    ...item,
    name: item.name
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
  }));

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        height: 350,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" justifyContent="space-between" mb={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="raphael:no" width={20} color="grey.500" />
          <Typography variant="subtitle1" fontWeight="bold">
            Most skipped fields (Top 5)
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Campaigns Analyzed: {campaign || 0}
        </Typography>
      </Stack>

      <Box sx={{ flexGrow: 1, minWidth: 0, minHeight: 0, width: '100%' }}>
        <BarChart
          dataset={dataset}
          yAxis={[
            {
              scaleType: 'band',
              dataKey: 'name',
              categoryGapRatio: 0.4,
              disableLine: true,
              disableTicks: true,
              tickLabelStyle: { fontSize: 11 },
            },
          ]}
          xAxis={[{ ...hiddenAxisSettings }]}
          series={[
            {
              dataKey: 'value',
              color: COLORS.purple,
              label: 'Total Skips',
              borderRadius: 6,
            },
          ]}
          layout="horizontal"
          margin={{ left: 120, right: 40, top: 10, bottom: 10 }}
          {...cleanChartSettings}
          slots={{ axisContent: ClientTooltip }}
          slotProps={{
            legend: { hidden: true },
            tooltip: {
              slotProps: {
                root: {
                  style: {
                    padding: 0,
                    background: 'transparent',
                    border: 'none',
                    boxShadow: 'none',
                  },
                },
              },
            },
          }}
        />
      </Box>
    </Card>
  );
}

SkippedFieldsChart.propTypes = {
  journey: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  campaign: PropTypes.number,
};

// --- 4. Row 3: Drop off Location ---
export function DropOffChart({ data }) {
  const dataset = STEP_CONFIG.map((config) => {
    const dbMatch = data?.find((item) => item.name === config.key);

    return {
      name: config.title,
      value: dbMatch ? dbMatch.value : 0,
      color: config.color,
    };
  }).filter((item) => item.value >= 0);

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        height: 350,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" justifyContent="space-between" mb={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="mdi:location-remove-outline" width={20} color="grey.500" />
          <Typography variant="subtitle1" fontWeight="bold">
            Drop off Location
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Abandoned setups
        </Typography>
      </Stack>
      <Box sx={{ flexGrow: 1, minWidth: 0, minHeight: 0, width: '100%' }}>
        <BarChart
          dataset={dataset}
          yAxis={[{ scaleType: 'band', dataKey: 'name', categoryGapRatio: 0.5 }]}
          xAxis={[{ ...hiddenAxisSettings }]}
          series={[
            {
              dataKey: 'value',
              label: 'Drop Off',
              dataset,
              borderRadius: 6,
              color: '#1340FF',
            },
          ]}
          layout="horizontal"
          margin={{ left: 110, right: 40, top: 10, bottom: 10 }}
          {...cleanChartSettings}
          slotProps={{ legend: { hidden: true }, tooltip: { trigger: 'item' } }}
          slots={{ axisContent: ClientTooltip }}
        />
      </Box>
    </Card>
  );
}

DropOffChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.number,
    })
  ),
};

// --- 5. Row 3: Package Renewal (Stacked Bar) ---
export function RenewalChart({ data }) {
  const chartData = data?.monthlyRenewals || [];

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        height: 350,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Iconify icon="material-symbols:package-2-outline" width={20} color="grey.500" />
        <Typography variant="subtitle1" fontWeight="bold">
          Package Renewal
        </Typography>
      </Stack>
      <Box sx={{ flexGrow: 1, minWidth: 0, minHeight: 0, width: '100%' }}>
        <BarChart
          dataset={chartData}
          xAxis={[
            {
              scaleType: 'band',
              dataKey: 'name',
              valueFormatter: (value) => (typeof value === 'string' ? value.split(' ')[0] : value),
            },
          ]}
          series={[
            { dataKey: 'Upgrades', stack: 'A', color: COLORS.green, label: 'Upgrades' },
            { dataKey: 'Renewals', stack: 'A', color: COLORS.blue, label: 'Renewals' },
            { dataKey: 'Downgrades', stack: 'A', color: COLORS.orange, label: 'Downgrades' },
          ]}
          {...cleanChartSettings}
          slots={{ axisContent: RenewalTooltip }}
          slotProps={{ legend: { hidden: true } }}
        />
      </Box>
    </Card>
  );
}

RenewalChart.propTypes = {
  data: PropTypes.shape({
    monthlyRenewals: PropTypes.array,
  }),
};

// --- 6. Row 4: Submission Review Efficiency (Scatter Plot) ---
export function ReviewEfficiencyScatter({ data }) {
  const allPoints = data?.scatterPoints || [
    { x: data?.avgReviewTimeHours || 0, y: data?.avgRoundsToApproval || 0, id: 1 },
  ];

  const healthyPoints = allPoints
    .filter((p) => p.x <= 24 && p.y <= 2)
    .map((p, i) => ({ ...p, id: `h-${i}` }));
  const riskPoints = allPoints
    .filter((p) => p.x > 24 && p.y > 2)
    .map((p, i) => ({ ...p, id: `r-${i}` }));
  const warningPoints = allPoints
    .filter((p) => (p.x > 24 && p.y <= 2) || (p.x <= 24 && p.y > 2))
    .map((p, i) => ({ ...p, id: `w-${i}` }));

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        height: 400,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" justifyContent="space-between" mb={-2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify
            icon="material-symbols:rate-review-outline-rounded"
            width={20}
            color="grey.500"
          />
          <Typography variant="subtitle1" fontWeight="bold">
            Submission Review Efficiency
          </Typography>
        </Stack>
        <Stack alignItems="flex-end">
          <Typography variant="caption" color="text.secondary">
            Avg Review Time: {data?.avgReviewTimeHours}h
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Avg Rounds: {data?.avgRoundsToApproval}
          </Typography>
        </Stack>
      </Stack>

      <Box sx={{ flexGrow: 1, minWidth: 0, minHeight: 0, width: '100%' }}>
        <ScatterChart
          series={[
            { data: healthyPoints, color: COLORS.blue, label: 'Within 2 rounds', id: 'healthy' },
            { data: riskPoints, color: COLORS.red, label: 'High Friction', id: 'risk' },
            { data: warningPoints, color: COLORS.orange, label: 'Warning', id: 'warning' },
          ]}
          voronoiMaxRadius={40}
          margin={{ left: 40, bottom: 40, right: 60 }}
          xAxis={[{ label: 'Hours', min: 0 }]}
          yAxis={[{ label: 'Rounds', min: 0 }]}
          grid={{ horizontal: true, vertical: true }}
          sx={{
            ...cleanChartSettings,
            '& .MuiChartsGrid-line': {
              strokeDasharray: '5 5',
              stroke: '#E5E7EB',
            },
          }}
          slots={{ itemContent: MatrixTooltip }}
          slotProps={{ legend: { hidden: true } }}
        >
          {typeof data?.avgReviewTimeHours === 'number' && (
            <ChartsReferenceLine
              x={data.avgReviewTimeHours}
              lineStyle={{ stroke: COLORS.red, strokeDasharray: '4 4', strokeWidth: 2 }}
            />
          )}

          {typeof data?.avgRoundsToApproval === 'number' && (
            <ChartsReferenceLine
              y={data.avgRoundsToApproval}
              lineStyle={{ stroke: COLORS.red, strokeDasharray: '4 4', strokeWidth: 2 }}
            />
          )}
        </ScatterChart>
      </Box>
    </Card>
  );
}

ReviewEfficiencyScatter.propTypes = {
  data: PropTypes.shape({
    scatterPoints: PropTypes.array,
    avgReviewTimeHours: PropTypes.number,
    avgRoundsToApproval: PropTypes.number,
  }),
};

// --- 7. Row 5: Turnaround Trend (Line Chart) ---
export function TurnaroundChart({ data }) {
  const trendData = data?.trendData || [];

  const seriesData = {
    slowest: trendData.map((d, i) => ({ x: i, y: d.slowestAvg, id: i, payload: d })),
    average: trendData.map((d, i) => ({ x: i, y: d.average, id: i, payload: d })),
    fastest: trendData.map((d, i) => ({ x: i, y: d.fastestAvg, id: i, payload: d })),
  };

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        height: 400,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Iconify icon="mdi:timer-outline" width={20} color="grey.500" />
        <Typography variant="subtitle1" fontWeight="bold">
          Shortlist Turnaround Time
        </Typography>
      </Stack>
      <Box sx={{ flexGrow: 1, minWidth: 0, minHeight: 0, width: '100%' }}>
        <ScatterChart
          xAxis={[{ valueFormatter: (v) => trendData[v]?.name?.split(' ')[0] || '' }]}
          series={[
            {
              id: 'slowest',
              data: seriesData.slowest,
              color: '#D4321C',
              label: 'Slowest',
            },
            {
              id: 'average',
              data: seriesData.average,
              color: '#FFC702',
              label: 'Average',
            },
            {
              id: 'fastest',
              data: seriesData.fastest,
              color: '#1ABF66',
              label: 'Fastest',
            },
          ]}
          voronoiMaxRadius={50}
          slots={{
            itemContent: TurnaroundTooltip,
          }}
          slotProps={{
            legend: { hidden: true },
            popper: {
              sx: {
                pointerEvents: 'none',
                zIndex: 1300,
              },
            },
          }}
          {...cleanChartSettings}
        ></ScatterChart>
      </Box>
    </Card>
  );
}

// --- 8. Row 5: Rejection Donut ---

const DONUT_COLORS = ['#EF4444', '#F59E0B', '#1340FF', '#8E33FF', '#10B981', '#00B8D9', '#919EAB'];

export function RejectionDonut({ data }) {
  const safeData = Array.isArray(data) ? data : [];

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const donutSize = isSmall ? 180 : 220;

  const total = safeData.reduce((sum, d) => sum + (d?.value || 0), 0);
  const maxCount = safeData.length > 0 ? Math.max(...safeData.map((d) => d?.value || 0)) : 1;

  const pieData = safeData.map((d, i) => ({
    id: i,
    value: d?.value || 0,
    label: d?.name || 'Unknown',
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        height: '100%',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Iconify icon="fluent:text-change-reject-24-filled" width={20} color="grey.500" />
        <Typography variant="subtitle1" fontWeight="bold">
          Shortlist Rejection Reasons
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center" sx={{ py: 1 }}>
        <Box sx={{ position: 'relative', flexShrink: 0, width: donutSize, height: donutSize }}>
          {total > 0 ? (
            <PieChart
              series={[
                {
                  data: pieData,
                  innerRadius: '55%',
                  outerRadius: '90%',
                  paddingAngle: 2,
                  cornerRadius: 3,
                  valueFormatter: (item) => `${item.value} rejections`,
                  highlightScope: { faded: 'global', highlighted: 'item' },
                },
              ]}
              height={donutSize}
              width={donutSize}
              margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
              slotProps={{ legend: { hidden: true } }}
              slots={{ itemContent: PieTooltip }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '8px solid #F4F6F8',
              }}
            />
          )}

          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: '#919EAB', fontSize: '0.7rem', lineHeight: 1 }}
            >
              Total
            </Typography>
            <Typography
              sx={{ fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.2, color: '#333' }}
            >
              {total}
            </Typography>
          </Box>
        </Box>

        <Stack spacing={2} sx={{ flex: 1, width: '100%', pr: { sm: 1 } }}>
          {safeData.map((d, i) => {
            const percentage = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0;
            const barColor = DONUT_COLORS[i % DONUT_COLORS.length];

            return (
              <Box key={d?.name || i}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 0.75 }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: barColor,
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: '#333', fontWeight: 500, fontSize: '0.85rem' }}
                    >
                      {d?.name}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap',
                      ml: 1,
                    }}
                  >
                    {d?.value}
                    <Typography
                      component="span"
                      sx={{ color: '#919EAB', fontWeight: 500, fontSize: '0.75rem', ml: 0.5 }}
                    >
                      ({percentage}%)
                    </Typography>
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={((d?.value || 0) / maxCount) * 100}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: '#F4F6F8',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      bgcolor: barColor,
                    },
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
}

RejectionDonut.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.number,
    })
  ),
};

// --- 9. Simple Metrics ---
export function SimpleMetricCard({ title, value }) {
  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        height: '100%',
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" mb={1}>
        {title}
      </Typography>
      <Typography variant="h4" fontWeight="bold">
        {value}
      </Typography>
    </Card>
  );
}

SimpleMetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
