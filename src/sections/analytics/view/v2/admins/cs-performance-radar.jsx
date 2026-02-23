import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { RadarChart } from '@mui/x-charts/RadarChart';

import ChartCard from '../components/chart-card';
import { MOCK_CS_RADAR } from '../mock-data';
import { CHART_COLORS } from '../chart-config';

const RADAR_COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.success, CHART_COLORS.warning];

const METRICS = [
  { name: 'Credits', min: 0, max: 100 },
  { name: 'Speed', min: 0, max: 100 },
  { name: 'Quality', min: 0, max: 100 },
  { name: 'Volume', min: 0, max: 100 },
  { name: 'Retention', min: 0, max: 100 },
];

export default function CSPerformanceRadar() {
  return (
    <ChartCard title="CS Performance Overview" icon={EmojiEventsIcon} subtitle="Multi-metric comparison across CS admins">
      <RadarChart
        series={MOCK_CS_RADAR.map((admin, i) => ({
          data: admin.scores,
          label: admin.name,
          color: RADAR_COLORS[i % RADAR_COLORS.length],
          fillArea: true,
        }))}
        radar={{ metrics: METRICS }}
        height={350}
        hideLegend={false}
      />
    </ChartCard>
  );
}
