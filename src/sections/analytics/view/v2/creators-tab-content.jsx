import { m } from 'framer-motion';

import Grid from '@mui/material/Grid';

import { varFade, varContainer } from 'src/components/animate/variants';

import PitchRateChart from './creators/pitch-rate-chart';
import CreatorNpsChart from './creators/creator-nps-chart';
import CreatorGrowthChart from './creators/creator-growth-chart';
import ResponseTimeCharts from './creators/response-time-charts';
import ActivationRateChart from './creators/activation-rate-chart';
import CreatorEarningsChart from './admins/creator-earnings-chart';
import TimeToActivationChart from './creators/time-to-activation-chart';
import CreatorCountryMapChart from './creators/creator-country-map-chart';
import MediaKitActivationChart from './creators/media-kit-activation-chart';

const containerVariants = varContainer({ staggerIn: 0.08 });
const itemVariants = varFade({ distance: 24 }).inUp;

export default function CreatorsTabContent() {
  return (
    <Grid
      container
      spacing={3}
      sx={{ mt: 1 }}
      component={m.div}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <Grid item xs={12} component={m.div} variants={itemVariants}>
        <CreatorGrowthChart />
      </Grid>
      <Grid item xs={12} component={m.div} variants={itemVariants}>
        <CreatorCountryMapChart />
      </Grid>
      <Grid item xs={12} md={6} component={m.div} variants={itemVariants}>
        <ActivationRateChart />
      </Grid>
      <Grid item xs={12} md={6} component={m.div} variants={itemVariants}>
        <TimeToActivationChart />
      </Grid>
      <Grid item xs={12} md={6} component={m.div} variants={itemVariants}>
        <MediaKitActivationChart />
      </Grid>
      <Grid item xs={12} md={6} component={m.div} variants={itemVariants}>
        <PitchRateChart />
      </Grid>
      <Grid item xs={12} md={6} component={m.div} variants={itemVariants}>
        <CreatorNpsChart />
      </Grid>
      <Grid item xs={12} md={6} component={m.div} variants={itemVariants}>
        <CreatorEarningsChart />
      </Grid>
      <Grid item xs={12} component={m.div} variants={itemVariants}>
        <ResponseTimeCharts />
      </Grid>
    </Grid>
  );
}
