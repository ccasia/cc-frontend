import PropTypes from 'prop-types';
import React, { useState } from 'react'; // 1. Import PropTypes

import useSWR from 'swr';

import { Grid, Stack, Rating, Typography } from '@mui/material';

import { fetcher, endpoints } from 'src/utils/axios';

import InactiveBrandsDrawer from './client-inactive-company-drawer';
import { useDateFilter, useTrendLabel } from '../../v2/date-filter-context';
// Import all your meticulously crafted widgets
import {
  TopKPICard,
  DropOffChart,
  RenewalChart,
  TimeSpentChart,
  RejectionDonut,
  TurnaroundChart,
  SimpleMetricCard,
  SkippedFieldsChart,
  ReviewEfficiencyScatter,
} from './client-widgets';

export default function ClientsTabContent({ packageTypes }) {
  const { startDate, endDate } = useDateFilter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const trendLabel = useTrendLabel();

  const noPackagesSelected = !packageTypes || packageTypes.length === 0;

  const params = new URLSearchParams();
  if (packageTypes && packageTypes.length > 0) {
    packageTypes.forEach((pt) => params.append('packageTypes', pt));
  }
  if (startDate) params.append('startDate', startDate.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());

  const query = `?${params.toString()}`;

  // Data Fetching based on your Backend
  const { data: brands } = useSWR(
    noPackagesSelected ? null : `${endpoints.analytics.client.brands}${query}`,
    fetcher
  );
  const { data: campaign } = useSWR(
    noPackagesSelected ? null : `${endpoints.analytics.client.campaigns}${query}`,
    fetcher
  );
  const { data: approval } = useSWR(
    noPackagesSelected ? null : `${endpoints.analytics.client.approve}${query}`,
    fetcher
  );
  const { data: support } = useSWR(
    noPackagesSelected ? null : `${endpoints.analytics.client.support}${query}`,
    fetcher
  );
  const { data: journey } = useSWR(
    noPackagesSelected ? null : `${endpoints.analytics.client.journey}${query}`,
    fetcher
  );
  const { data: shortlist } = useSWR(
    noPackagesSelected ? null : `${endpoints.analytics.client.shortlist}${query}`,
    fetcher
  );

  return (
    <>
      {/* ROW 1: Top KPI Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <TopKPICard
            title="Total Brands"
            mainValue={brands?.totalCompanies ?? '–'}
            trend={brands?.totalCompaniesTrend}
            trendLabel={trendLabel}
            onClick={() => setDrawerOpen(true)}
            clickable
          >
            <Stack spacing={0.2}>
              <Typography variant="caption" color="error.main">
                ● inactive {brands?.inactiveCompanies || '–'}
              </Typography>
            </Stack>
          </TopKPICard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TopKPICard
            title="Activation Rate"
            mainValue={`${brands?.activationRate ?? '–'} %`}
            trend={brands?.activationRateTrend}
            trendLabel={trendLabel}
          >
            <Typography variant="caption" color="success.main">
              ▲ {brands?.rateUnder24h || '–'} % under 24h
            </Typography>
          </TopKPICard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TopKPICard
            title="Retention Rate"
            mainValue={`${support?.retentionRate ?? '–'} %`}
            trend={support?.retentionRateTrend}
            trendLabel={trendLabel}
          >
            <Typography variant="caption" color="success.main">
              ▲ {support?.upgradeRate || '–'} % upsell rate
            </Typography>
          </TopKPICard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TopKPICard
            title="NPS Feedback Rating"
            mainValue={`${support?.npsScore ?? '–'}`}
            trend={support?.npsScoreTrend}
            trendLabel={trendLabel}
          >
            <Stack direction="row" justifyContent="space-between">
              <Rating value={support?.npsScore || 0} precision={0.5} readOnly size="small" />
              <Typography variant="caption" display="block" color="text.secondary" mb={0.5}>
                From {support?.totalNpsReports || 0} reports{' '}
              </Typography>
            </Stack>
          </TopKPICard>
        </Grid>
      </Grid>

      {/* ROW 2: Time Spent vs Most Skipped Fields */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <TimeSpentChart data={journey?.avgTimes} />
        </Grid>
        <Grid item xs={12} md={6}>
          <SkippedFieldsChart
            journey={journey?.skippedFields}
            campaign={campaign?.totalCampaigns}
          />
        </Grid>
      </Grid>

      {/* ROW 3: Drop off Location vs Package Renewal */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <DropOffChart data={journey?.dropoffs} />
        </Grid>
        <Grid item xs={12} md={6}>
          <RenewalChart data={support} />
        </Grid>
      </Grid>

      {/* ROW 4: Submission Review Efficiency (Full Width) */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={2.5}>
          <Grid direction="column" container spacing={2}>
            <Grid item xs={12} md={3}>
              <SimpleMetricCard
                title="Campaign creation rate"
                value={`${campaign?.campaignCreationRate || 0}%`}
                icon="mi:megaphone"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <SimpleMetricCard
                title="Average campaigns"
                value={`${campaign?.avgCampaignsPerBrand || 0} campaigns`}
                icon="streamline-ultimate:align-middle"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <SimpleMetricCard
                title="Time to first campaign"
                value={`${campaign?.avgTimeToFirstCampaign || 0} days`}
                icon="material-symbols:looks-one-outline-rounded"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <SimpleMetricCard
                title="Bugs Reported"
                value={`${support?.totalTickets || 0}`}
                icon="solar:bug-linear"
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={9.5}>
          <ReviewEfficiencyScatter data={approval} />
        </Grid>
      </Grid>

      {/* ROW 5: Shortlist Turnaround vs Shortlist Rejection */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <TurnaroundChart data={shortlist} />
        </Grid>
        <Grid item xs={12} md={6}>
          <RejectionDonut data={shortlist?.rejectionReasons} />
        </Grid>
      </Grid>

      <InactiveBrandsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        brands={brands}
        query={query}
      />
    </>
  );
}

ClientsTabContent.propTypes = {
  packageTypes: PropTypes.arrayOf(PropTypes.string),
};
