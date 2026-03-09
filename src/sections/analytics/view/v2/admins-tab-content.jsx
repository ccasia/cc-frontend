import { m } from 'framer-motion';

import Grid from '@mui/material/Grid';

import { varFade, varContainer } from 'src/components/animate/variants';

import RejectionRateCard from './admins/rejection-rate-card';
import RequireChangesChart from './admins/require-changes-chart';
import RejectionReasonsChart from './admins/rejection-reasons-chart';
import CreditsPerCSChart from './admins/credits-per-cs-chart';
import TopShortlistedCreatorsChart from './admins/top-shortlisted-creators-chart';

const containerVariants = varContainer({ staggerIn: 0.08 });
const itemVariants = varFade({ distance: 24 }).inUp;

export default function AdminsTabContent() {
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
        <RejectionRateCard />
      </Grid>
      <Grid item xs={12} md={6} component={m.div} variants={itemVariants}>
        <RequireChangesChart />
      </Grid>
      <Grid item xs={12} md={6} component={m.div} variants={itemVariants}>
        <RejectionReasonsChart />
      </Grid>
      <Grid item xs={12} md={6} component={m.div} variants={itemVariants}>
        <CreditsPerCSChart />
      </Grid>
      <Grid item xs={12} md={6} component={m.div} variants={itemVariants}>
        <TopShortlistedCreatorsChart />
      </Grid>
    </Grid>
  );
}
