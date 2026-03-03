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
  CircularProgress,
} from '@mui/material';
import {
  PieChart,
  BarChart,
  axisClasses,
  ScatterChart,
  ChartsReferenceLine,
  legendClasses,
} from '@mui/x-charts';

import {
  ClientItemTooltipSlot,
  MatrixTooltipSlot,
  RenewalTooltipSlot,
  TurnaroundTooltipSlot,
  PieTooltipSlot,
} from './client-tooltip-wrappers';

import Iconify from 'src/components/iconify';

// Your Brand Colors
const COLORS = {
  blue: '#1340FF',
  green: '#1ABF66',
  orange: '#FFC702',
  red: '#FF6B6B',
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
    [`.${legendClasses.root}`]: { display: 'none' },
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

function EmptyState({ message = 'No data found for the selected period.' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        flexGrow: 1,
      }}
    >
      <Typography variant="body2" sx={{ color: '#919EAB', fontStyle: 'italic' }}>
        {message}
      </Typography>
    </Box>
  );
}

// --- 1. Top KPI Cards (Unchanged, just layout) ---
export function TopKPICard({ title, mainValue, children }) {
  return (
    <Card
      sx={{ p: 3, borderRadius: 2, border: '1px solid #E5E7EB', boxShadow: 'none', height: '100%' }}
    >
      <Typography variant="subtitle2" color="text.secondary" mb={0}>
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
  if (!data) {
    return (
      <Card
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid #E5E7EB',
          height: 350,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={25} />
      </Card>
    );
  }

  const dataset = STEP_CONFIG.map((config) => {
    const dbMatch = data?.find((item) => item.name === config.key);

    return {
      name: config.title,
      minutes: dbMatch ? Number((dbMatch.value / 60).toFixed(1)) : 0,
    };
  });

  const totalMinutes = dataset.reduce((sum, d) => sum + d.minutes, 0);
  const hasData = dataset.some((d) => d.minutes > 0);

  return (
    <Card
      sx={{
        p: 3,
        pb: 1,
        borderRadius: 2,
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        height: 350,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <Iconify icon="mdi:access-time" width={20} color="grey.500" />
          <Typography variant="subtitle1" fontWeight="bold">
            Time Spent per Step
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          In Minutes
        </Typography>
      </Stack>
      {hasData ? (
        <Box sx={{ flexGrow: 1, minWidth: 0, minHeight: 0, width: '100%' }}>
          <BarChart
            dataset={dataset}
            yAxis={[
              {
                scaleType: 'band',
                dataKey: 'name',
                categoryGapRatio: 0.35,
                tickLabelStyle: { fontSize: 12 },
              },
            ]}
            xAxis={[
              { ...hiddenAxisSettings, max: Math.max(...dataset.map((d) => d.minutes)) * 1.2 },
            ]}
            series={[
              {
                dataKey: 'minutes',
                label: 'Time Spent',
                color: COLORS.green,
                barLabelPlacement: 'outside',
                valueFormatter: (value) => {
                  const pct = totalMinutes > 0 ? ((value / totalMinutes) * 100).toFixed(0) : 0;
                  return `${value} (${pct}%)`;
                },
              },
            ]}
            barLabel={(item) => {
              const value = item.value ?? 0;
              if (value === 0) return '';
              const percentage = totalMinutes > 0 ? ((value / totalMinutes) * 100).toFixed(0) : 0;
              return `${value} (${percentage}%)`;
            }}
            borderRadius={4}
            layout="horizontal"
            margin={{ left: 80, right: 0, top: 10, bottom: 0 }}
            sx={{
              ...cleanChartSettings.sx,
              '& .MuiBarLabel-root': {
                fill: '#637381',
                fontSize: 11,
                fontWeight: 600,
              },
            }}
            slots={{ tooltip: () => null }}
            // slots={{ tooltip: ClientItemTooltipSlot }}
          />
        </Box>
      ) : (
        <EmptyState />
      )}
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

  const totalSkips = dataset.reduce((sum, d) => sum + d.value, 0);
  const hasData = dataset.length > 0 && dataset.some((d) => d.value > 0);

  return (
    <Card
      sx={{
        p: 3,
        pb: 1,
        borderRadius: 2,
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        height: 350,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <Iconify icon="raphael:no" width={20} color="grey.500" />
          <Typography variant="subtitle1" fontWeight="bold">
            Most skipped fields (Top 5)
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Campaigns Analyzed: {campaign || 0}
        </Typography>
      </Stack>

      {hasData ? (
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
                tickLabelStyle: { fontSize: 12 },
              },
            ]}
            xAxis={[{ ...hiddenAxisSettings, max: Math.max(...dataset.map((d) => d.value)) * 1.2 }]}
            series={[
              {
                dataKey: 'value',
                color: COLORS.purple,
                label: 'Total Skips',
                barLabelPlacement: 'outside',
                valueFormatter: (value) => {
                  const percentage = totalSkips > 0 ? ((value / totalSkips) * 100).toFixed(0) : 0;
                  return `${value} (${percentage}%)`;
                },
              },
            ]}
            barLabel={(item) => {
              const value = item.value ?? 0;
              if (value === 0) return '';
              const percentage = totalSkips > 0 ? ((value / totalSkips) * 100).toFixed(0) : 0;
              return `${value} (${percentage}%)`;
            }}
            borderRadius={4}
            layout="horizontal"
            margin={{ left: 80, right: 20, top: 10, bottom: 0 }}
            sx={{
              ...cleanChartSettings.sx,
              '& .MuiBarElement-root': {
                pointerEvents: 'none',
              },
              '& .MuiBarLabel-root': {
                fill: '#637381',
                fontSize: 11,
                fontWeight: 600,
              },
            }}
            // slots={{ tooltip: ClientItemTooltipSlot }}
            slots={{ tooltip: () => null }}
          />
        </Box>
      ) : (
        <EmptyState />
      )}
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

  const totalDropoffs = dataset.reduce((sum, d) => sum + d.value, 0);
  const hasData = dataset.some((d) => d.value > 0);

  return (
    <Card
      sx={{
        p: 3,
        pb: 1,
        borderRadius: 2,
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        height: 350,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <Iconify icon="mdi:location-remove-outline" width={20} color="grey.500" />
          <Typography variant="subtitle1" fontWeight="bold">
            Drop off Location
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Abandoned setups
        </Typography>
      </Stack>

      {hasData ? (
        <Box sx={{ flexGrow: 1, minWidth: 0, minHeight: 0, width: '100%' }}>
          <BarChart
            dataset={dataset}
            yAxis={[
              {
                scaleType: 'band',
                dataKey: 'name',
                categoryGapRatio: 0.35,
                tickLabelStyle: { fontSize: 12 },
              },
            ]}
            xAxis={[{ ...hiddenAxisSettings, max: Math.max(...dataset.map((d) => d.value)) * 1.2 }]}
            series={[
              {
                dataKey: 'value',
                label: 'Drop Off',
                dataset,
                color: COLORS.blue,
                barLabelPlacement: 'outside',
                valueFormatter: (value) => {
                  const percentage =
                    totalDropoffs > 0 ? ((value / totalDropoffs) * 100).toFixed(0) : 0;
                  return `${value} (${percentage}%)`;
                },
              },
            ]}
            barLabel={(item) => {
              const value = item.value ?? 0;
              if (value === 0) return '';
              const percentage = totalDropoffs > 0 ? ((value / totalDropoffs) * 100).toFixed(0) : 0;
              return `${value} (${percentage}%)`;
            }}
            borderRadius={4}
            layout="horizontal"
            margin={{ left: 80, right: 40, top: 10, bottom: 0 }}
            sx={{
              ...cleanChartSettings.sx,
              '& .MuiBarLabel-root': {
                fill: '#637381',
                fontSize: 11,
                fontWeight: 600,
              },
            }}
            slots={{ tooltip: () => null }}
            // slots={{ tooltip: ClientItemTooltipSlot }}
          />
        </Box>
      ) : (
        <EmptyState />
      )}
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

  const hasData =
    chartData.length > 0 &&
    chartData.some((d) => (d.Upgrades || 0) + (d.Renewals || 0) + (d.Downgrades || 0) > 0);

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        height: 350,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <Iconify icon="material-symbols:package-2-outline" width={20} color="grey.500" />
        <Typography variant="subtitle1" fontWeight="bold">
          Package Renewal
        </Typography>
      </Stack>

      {hasData ? (
        <Box sx={{ flexGrow: 1, minWidth: 0, minHeight: 0, width: '100%' }}>
          <BarChart
            dataset={chartData}
            xAxis={[
              {
                scaleType: 'band',
                dataKey: 'name',
                valueFormatter: (value) =>
                  typeof value === 'string' ? value.split(' ')[0] : value,
              },
            ]}
            series={[
              { dataKey: 'Downgrades', stack: 'A', color: COLORS.orange, label: 'Downgrades' },
              { dataKey: 'Renewals', stack: 'A', color: COLORS.blue, label: 'Renewals' },
              { dataKey: 'Upgrades', stack: 'A', color: COLORS.green, label: 'Upgrades' },
            ]}
            borderRadius={4}
            {...cleanChartSettings}
            slots={{ tooltip: RenewalTooltipSlot }}
          />
        </Box>
      ) : (
        <EmptyState />
      )}
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

  const hasData = allPoints && allPoints.length > 0 && allPoints.some((p) => p.x > 0 || p.y > 0);

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
        borderRadius: 2,
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
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

      {hasData ? (
        <Box sx={{ flexGrow: 1, minWidth: 0, minHeight: 0, width: '100%' }}>
          <ScatterChart
            key={`scatter-${allPoints.length}`}
            series={[
              {
                data: healthyPoints,
                color: COLORS.blue,
                label: 'Within 2 rounds',
                id: 'healthy',
                markerSize: 6,
              },
              {
                data: riskPoints,
                color: COLORS.red,
                label: 'High Friction',
                id: 'risk',
                markerSize: 6,
              },
              {
                data: warningPoints,
                color: COLORS.orange,
                label: 'Warning',
                id: 'warning',
                markerSize: 6,
              },
            ].filter((s) => s.data.length > 0)}
            voronoiMaxRadius="item"
            margin={{ left: 10, bottom: 0, right: 60 }}
            xAxis={[{ label: 'Hours', min: 0 }]}
            yAxis={[{ label: 'Rounds', min: 0 }]}
            grid={{ horizontal: true, vertical: true }}
            sx={{
              ...cleanChartSettings.sx,
              '& .MuiChartsGrid-line': {
                strokeDasharray: '5 5',
                stroke: '#E5E7EB',
              },
            }}
            slots={{ tooltip: MatrixTooltipSlot }}
          >
            {typeof data?.avgReviewTimeHours === 'number' && (
              <ChartsReferenceLine
                x={data.avgReviewTimeHours}
                lineStyle={{
                  stroke: COLORS.red,
                  strokeDasharray: '4 4',
                  strokeWidth: 1.5,
                  opacity: 0.4,
                }}
              />
            )}

            {typeof data?.avgRoundsToApproval === 'number' && (
              <ChartsReferenceLine
                y={data.avgRoundsToApproval}
                lineStyle={{
                  stroke: COLORS.red,
                  strokeDasharray: '4 4',
                  strokeWidth: 1.5,
                  opacity: 0.4,
                }}
              />
            )}
          </ScatterChart>
        </Box>
      ) : (
        <EmptyState />
      )}
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

  const hasData =
    trendData.length > 0 &&
    trendData.some((d) => (d.slowestAvg || 0) + (d.average || 0) + (d.fastestAvg || 0) > 0);

  const seriesData = {
    slowest: trendData.map((d, i) => ({ x: i, y: d.slowestAvg, id: i, payload: d })),
    average: trendData.map((d, i) => ({ x: i, y: d.average, id: i, payload: d })),
    fastest: trendData.map((d, i) => ({ x: i, y: d.fastestAvg, id: i, payload: d })),
  };

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        height: 360,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <Iconify icon="mdi:timer-outline" width={20} color="grey.500" />
        <Typography variant="subtitle1" fontWeight="bold">
          Shortlist Turnaround Time
        </Typography>
      </Stack>

      {hasData ? (
        <Box sx={{ flexGrow: 1, minWidth: 0, minHeight: 0, width: '100%' }}>
          <ScatterChart
            xAxis={[{ valueFormatter: (v) => trendData[v]?.name?.split(' ')[0] || '' }]}
            yAxis={[{ label: 'Avg Hours', min: 0 }]}
            series={[
              {
                id: 'slowest',
                data: seriesData.slowest,
                color: '#FF6B6B',
                label: 'Slowest',
                markerSize: 6,
              },
              {
                id: 'average',
                data: seriesData.average,
                color: '#FFC702',
                label: 'Average',
                markerSize: 6,
              },
              {
                id: 'fastest',
                data: seriesData.fastest,
                color: '#1ABF66',
                label: 'Fastest',
                markerSize: 6,
              },
            ]}
            margin={{ left: 10, bottom: 0, right: 60 }}
            voronoiMaxRadius="item"
            grid={{ horizontal: true, vertical: true }}
            sx={{
              ...cleanChartSettings.sx,
              '& .MuiChartsGrid-line': {
                strokeDasharray: '5 5',
                stroke: '#E5E7EB',
              },
            }}
            slots={{ tooltip: TurnaroundTooltipSlot }}
          />
        </Box>
      ) : (
        <EmptyState />
      )}
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

  const hasData = total > 0;

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        height: '100%',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <Iconify icon="fluent:text-change-reject-24-filled" width={20} color="grey.500" />
        <Typography variant="subtitle1" fontWeight="bold">
          Shortlist Rejection Reasons
        </Typography>
      </Stack>

      {hasData ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          alignItems="center"
          sx={{ py: 1 }}
        >
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
                {...cleanChartSettings}
                slots={{ tooltip: PieTooltipSlot }}
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
                      borderRadius: 2,
                      bgcolor: '#F4F6F8',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 2,
                        bgcolor: barColor,
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        </Stack>
      ) : (
        <EmptyState />
      )}
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
        borderRadius: 2,
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        height: '100%',
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" mb={1}>
        {title}
      </Typography>
      <Typography variant="h5" fontWeight="bold">
        {value}
      </Typography>
    </Card>
  );
}

SimpleMetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
