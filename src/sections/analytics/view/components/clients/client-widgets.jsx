import React from 'react';
import { Card, Box, Typography, Stack } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { ScatterChart } from '@mui/x-charts/ScatterChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';

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
    display: 'none', // This hides the numeric values (0, 10, 20, etc.)
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
      padding: '10px',
    },
  },
};

// --- 1. Top KPI Cards (Unchanged, just layout) ---
export const TopKPICard = ({ title, mainValue, children }) => (
  <Card
    sx={{ p: 2, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', height: '100%' }}
  >
    <Typography variant="subtitle2" color="text.secondary" mb={1}>
      {title}
    </Typography>
    <Typography variant="h4" fontWeight="bold" mb={1}>
      {mainValue}
    </Typography>
    <Box sx={{ mt: 'auto' }}>{children}</Box>
  </Card>
);

// --- 2. Row 2: Time Spent (Horizontal Bar) ---
export const TimeSpentChart = ({ data }) => {
  const dataset =
    data?.map((item) => ({
      name: item.name.replace(/_/g, ' '),
      minutes: Number((item.value / 60).toFixed(1)),
    })) || [];

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
        <Typography variant="subtitle1" fontWeight="bold">
          Time Spent per Step
        </Typography>
        <Typography variant="caption" color="text.secondary">
          In Minutes
        </Typography>
      </Stack>
      <Box sx={{ flexGrow: 1 }}>
        <BarChart
          dataset={dataset}
          yAxis={[{ scaleType: 'band', dataKey: 'name', categoryGapRatio: 0.3 }]}
          xAxis={[{ ...hiddenAxisSettings }]}
          series={[{ dataKey: 'minutes', color: COLORS.blue, label: 'Minutes', borderRadius: 4 }]}
          layout="horizontal"
          margin={{ left: 100 }}
          {...cleanChartSettings}
          slotProps={{ legend: { hidden: true } }}
        />
      </Box>
    </Card>
  );
};

// --- 3. Row 2: Most Skipped Fields ---
export const SkippedFieldsChart = ({ journey, campaign }) => {
  const dataset = journey?.map((item) => ({ ...item, name: item.name.replace(/_/g, ' ') })) || [];

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
        <Typography variant="subtitle1" fontWeight="bold">
          Most skipped fields
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Client Created Campaigns: {campaign}
        </Typography>
      </Stack>
      <Box sx={{ flexGrow: 1 }}>
        <BarChart
          dataset={dataset}
          yAxis={[{ scaleType: 'band', dataKey: 'name', categoryGapRatio: 0.3 }]}
          xAxis={[{ ...hiddenAxisSettings }]}
          series={[{ dataKey: 'value', color: COLORS.purple, label: 'Skips' }]}
          layout="horizontal"
          margin={{ left: 120 }}
          {...cleanChartSettings}
          slotProps={{ legend: { hidden: true } }}
        />
      </Box>
    </Card>
  );
};

// --- 4. Row 3: Drop off Location ---
export const DropOffChart = ({ data }) => {
  const dataset = data?.map((item) => ({ ...item, name: item.name.replace(/_/g, ' ') })) || [];

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
        <Typography variant="subtitle1" fontWeight="bold">
          Drop off Location
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Abandoned setups
        </Typography>
      </Stack>
      <Box sx={{ flexGrow: 1 }}>
        <BarChart
          dataset={dataset}
          yAxis={[{ scaleType: 'band', dataKey: 'name', categoryGapRatio: 0.3 }]}
          xAxis={[{ ...hiddenAxisSettings }]}
          series={[{ dataKey: 'value', color: COLORS.purple, label: 'Drop-offs' }]}
          layout="horizontal"
          margin={{ left: 100 }}
          {...cleanChartSettings}
          slotProps={{ legend: { hidden: true } }}
        />
      </Box>
    </Card>
  );
};

// --- 5. Row 3: Package Renewal (Stacked Bar) ---
export const RenewalChart = ({ data }) => {
  const chartData =
    data?.monthlyRenewals?.length > 0
      ? data.monthlyRenewals
      : [
          {
            name: 'Total Cohort',
            Upgrades: data?.upgrades || 0,
            Renewals: data?.renewals || 0,
            Downgrades: data?.downgrades || 0,
          },
        ];

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
      <Typography variant="subtitle1" fontWeight="bold" mb={2}>
        Package Renewal Mix
      </Typography>
      <Box sx={{ flexGrow: 1 }}>
        <BarChart
          dataset={chartData}
          xAxis={[{ scaleType: 'band', dataKey: 'name' }]}
          series={[
            { dataKey: 'Upgrades', stack: 'A', color: COLORS.green, label: 'Upgrades' },
            { dataKey: 'Renewals', stack: 'A', color: COLORS.blue, label: 'Renewals' },
            { dataKey: 'Downgrades', stack: 'A', color: COLORS.orange, label: 'Downgrades' },
          ]}
          {...cleanChartSettings}
        />
      </Box>
    </Card>
  );
};

// --- 6. Row 4: Submission Review Efficiency (Scatter Plot) ---
export const ReviewEfficiencyScatter = ({ data }) => {
  // MUI X Charts handles coloring differently. We split data into 2 series to get Red/Blue dots.
  const allPoints = data?.scatterPoints || [
    { x: data?.avgReviewTimeHours || 0, y: data?.avgRoundsToApproval || 0, id: 1 },
  ];

  const healthyPoints = allPoints
    .filter((p) => p.x <= 24 && p.y <= 2)
    .map((p, i) => ({ ...p, id: `h-${i}` }));
  const riskPoints = allPoints
    .filter((p) => p.x > 24 || p.y > 2)
    .map((p, i) => ({ ...p, id: `r-${i}` }));

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
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Typography variant="subtitle1" fontWeight="bold">
          Review Efficiency
        </Typography>
        <Stack alignItems="flex-end">
          <Typography variant="caption" color="text.secondary">
            Avg Time: {data?.avgReviewTimeHours}h
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Avg Rounds: {data?.avgRoundsToApproval}
          </Typography>
        </Stack>
      </Stack>

      <Box sx={{ flexGrow: 1 }}>
        <ScatterChart
          series={[
            { data: healthyPoints, color: COLORS.blue, label: 'Healthy', id: 'healthy' },
            { data: riskPoints, color: COLORS.red, label: 'High Friction', id: 'risk' },
          ]}
          xAxis={[{ label: 'Hours', min: 0 }]}
          yAxis={[{ label: 'Rounds', min: 0 }]}
          {...cleanChartSettings}
        />
      </Box>
    </Card>
  );
};

// --- 7. Row 5: Turnaround Trend (Line Chart) ---
export const TurnaroundChart = ({ data }) => {
  const trendData = data?.trendData || [{ name: 'Current', hours: data?.avgTurnaroundHours || 0 }];

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
      <Typography variant="subtitle1" fontWeight="bold" mb={2}>
        Turnaround Trend
      </Typography>
      <Box sx={{ flexGrow: 1 }}>
        <LineChart
          dataset={trendData}
          xAxis={[{ scaleType: 'point', dataKey: 'name' }]}
          series={[
            {
              dataKey: 'hours',
              color: COLORS.blue,
              label: 'Turnaround (Hrs)',
              area: true, // Makes it an area chart which looks nice
              showMark: true,
              curve: 'natural', // Smooth lines
            },
          ]}
          {...cleanChartSettings}
        />
      </Box>
    </Card>
  );
};

// --- 8. Row 5: Rejection Donut ---
export const RejectionDonut = ({ data }) => {
  const pieData =
    data?.map((item, index) => ({
      id: index,
      value: item.value,
      label: item.name,
      color: Object.values(COLORS)[index % 5],
    })) || [];

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
      <Typography variant="subtitle1" fontWeight="bold" mb={2}>
        Shortlist Rejection Reasons
      </Typography>
      <Box sx={{ flexGrow: 1 }}>
        <PieChart
          series={[
            {
              data: pieData,
              innerRadius: 60,
              outerRadius: 90,
              paddingAngle: 2,
              cornerRadius: 4,
              highlightScope: { faded: 'global', highlighted: 'item' },
            },
          ]}
          slotProps={{ legend: { hidden: true } }} // Hiding legend to look like your drawing
        />
      </Box>
    </Card>
  );
};

// --- 9. Simple Metrics ---
export const SimpleMetricCard = ({ title, value }) => (
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
