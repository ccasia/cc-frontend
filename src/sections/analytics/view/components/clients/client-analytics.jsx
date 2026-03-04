import React from 'react';
import PropTypes from 'prop-types'; // 1. Import PropTypes

import { Grid, Typography, Stack, Rating } from '@mui/material';
import useSWR from 'swr';
import { fetcher, endpoints } from 'src/utils/axios';
import { useDateFilter } from '../../v2/date-filter-context';

// Import all your meticulously crafted widgets
import {
  TopKPICard,
  TimeSpentChart,
  SkippedFieldsChart,
  DropOffChart,
  RenewalChart,
  ReviewEfficiencyScatter,
  TurnaroundChart,
  RejectionDonut,
  SimpleMetricCard,
} from './client-widgets';

export default function ClientsTabContent({ packageType }) {
  const { startDate, endDate } = useDateFilter();

  const params = new URLSearchParams();
  if (packageType !== 'ALL') params.append('packageType', packageType);
  if (startDate) params.append('startDate', startDate.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());

  const query = `?${params.toString()}`;

  // Data Fetching based on your Backend
  const { data: brands } = useSWR(`${endpoints.analytics.client.brands}${query}`, fetcher);
  const { data: campaign } = useSWR(`${endpoints.analytics.client.campaigns}${query}`, fetcher);
  const { data: approval } = useSWR(`${endpoints.analytics.client.approve}${query}`, fetcher);
  const { data: support } = useSWR(`${endpoints.analytics.client.support}${query}`, fetcher);
  const { data: journey } = useSWR(`${endpoints.analytics.client.journey}${query}`, fetcher);
  const { data: shortlist } = useSWR(`${endpoints.analytics.client.shortlist}${query}`, fetcher);

  return (
    <>
      {/* ROW 1: Top KPI Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <TopKPICard title="Total Brands" mainValue={brands?.totalCompanies || '-'}>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="success.main">
                ● on platform (v4) {brands?.v4Companies || '-'}
              </Typography>
              <Typography variant="caption" color="success.main">
                ● not on platform (v2) {brands?.v2Companies || '-'}
              </Typography>
              <Typography variant="caption" color="error.main">
                ● inactive {brands?.inactiveCompanies || '-'}
              </Typography>
            </Stack>
          </TopKPICard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TopKPICard title="Activation Rate" mainValue={`${brands?.activationRate || '-'}%`}>
            <Typography variant="caption" color="success.main">
              ▲ {brands?.rateUnder24h || 0}% under 24h
            </Typography>
          </TopKPICard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TopKPICard title="Retention Rate" mainValue={`${support?.retentionRate || '-'}%`}>
            <Typography variant="caption" color="success.main">
              ▲ {support?.upgradeRate || 0}% upsell rate
            </Typography>
          </TopKPICard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TopKPICard title="NPS Feedback rating" mainValue={`${support?.npsScore || '-'}`}>
            <Typography variant="caption" display="block" color="text.secondary" mb={0.5}>
              From {support?.totalNpsReports || 0} reports{' '}
            </Typography>
            {/* MUI Rating component looks exactly like the stars in your drawing */}
            <Rating value={support?.npsScore || 0} precision={0.5} readOnly size="small" />
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
    </>
  );
}

ClientsTabContent.propTypes = {
  packageType: PropTypes.string,
};
