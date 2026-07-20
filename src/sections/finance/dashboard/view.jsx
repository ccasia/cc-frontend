import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useAuthContext } from 'src/auth/hooks';
import { useGetFinanceDashboard } from 'src/api/finance';

import { useSettingsContext } from 'src/components/settings';

import { formatAmount } from './utils';
import StatCard from './components/stat-card';
import AgingChips from './components/aging-chips';
import NewClientsDialog from './components/new-clients-dialog';
import DashboardSkeleton from './components/dashboard-skeleton';
import InvoiceStatusDialog from './components/invoice-status-dialog';
import ActivePackagesDrawer from './components/active-packages-drawer';
import PeriodFilter, { getPeriodLabel, getPresetRange } from './components/period-filter';
import CampaignBreakdownDrawer from './components/campaign-breakdown-drawer';
import ClientUtilisationSection from './components/client-utilisation-section';

// ----------------------------------------------------------------------

export default function FinanceDashboardView() {
  const settings = useSettingsContext();
  const { user } = useAuthContext();

  const [filter, setFilter] = useState(() => ({ preset: 'month', ...getPresetRange('month') }));
  const [invoiceDialogStatus, setInvoiceDialogStatus] = useState(null);
  const [newClientsOpen, setNewClientsOpen] = useState(false);
  const [packagesDrawerOpen, setPackagesDrawerOpen] = useState(false);
  const [breakdownClient, setBreakdownClient] = useState(null);

  const { stats, activePackagesList, clients, isLoading, error, mutate } = useGetFinanceDashboard({
    startDate: filter.startDate?.toISOString(),
    endDate: filter.endDate?.toISOString(),
  });

  const handleFilterChange = useCallback((next) => setFilter(next), []);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const packageValue = stats?.packageRevenue || [];
  const myrPackageValue = packageValue.find((entry) => entry.currency === 'MYR');
  const periodLabel = getPeriodLabel(filter.preset, filter.startDate, filter.endDate);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ pb: 6 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'flex-end' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontWeight: 400,
              fontSize: { xs: 36, md: 46 },
              lineHeight: 1.15,
            }}
          >
            Hi, {firstName}.
          </Typography>
          <Typography variant="body1" sx={{ color: '#637381', mt: 1 }}>
            Review invoices and monitor client credits.
          </Typography>
        </Box>

        <PeriodFilter
          value={filter.preset}
          startDate={filter.startDate}
          endDate={filter.endDate}
          onChange={handleFilterChange}
        />
      </Stack>

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => mutate()}>
              Retry
            </Button>
          }
          sx={{ mb: 3 }}
        >
          Failed to load the finance dashboard. Please try again.
        </Alert>
      )}

      {isLoading && <DashboardSkeleton />}

      {!isLoading && stats && (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard
                icon="mdi:file-document-edit-outline"
                iconColor="#4F46E5"
                iconBg="#EEF2FF"
                label="Draft invoices"
                value={stats.draftInvoices}
                subtitle="Awaiting approval"
                onClick={() => setInvoiceDialogStatus('draft')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard
                icon="mdi:progress-clock"
                iconColor="#7C3AED"
                iconBg="#F5F3FF"
                label="Processing"
                value={stats.processing.total}
                extra={<AgingChips aging={stats.processing.aging} />}
                onClick={() => setInvoiceDialogStatus('processing')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard
                icon="mdi:alert-circle-outline"
                iconColor="#DC2626"
                iconBg="#FEF2F2"
                label="Overdue"
                value={stats.overdue}
                subtitle="Past due date"
                onClick={() => setInvoiceDialogStatus('overdue')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard
                icon="mdi:account-plus-outline"
                iconColor="#16A34A"
                iconBg="#F0FDF4"
                label="New clients"
                value={stats.newClients}
                subtitle="In selected range"
                onClick={() => setNewClientsOpen(true)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard
                icon="mdi:package-variant-closed"
                iconColor="#D97706"
                iconBg="#FFFBEB"
                label="Active packages"
                value={stats.activePackages}
                subtitle="Currently active"
                onClick={() => setPackagesDrawerOpen(true)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard
                icon="mdi:cash-multiple"
                iconColor="#0D9488"
                iconBg="#F0FDFA"
                label="Package revenue"
                value={`MYR ${formatAmount(myrPackageValue?.amount || 0)}`}
                subtitle="Active packages value"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <ClientUtilisationSection clients={clients} onViewBreakdown={setBreakdownClient} />
          </Box>
        </>
      )}

      <ActivePackagesDrawer
        open={packagesDrawerOpen}
        onClose={() => setPackagesDrawerOpen(false)}
        packages={activePackagesList}
      />

      <InvoiceStatusDialog
        open={Boolean(invoiceDialogStatus)}
        onClose={() => setInvoiceDialogStatus(null)}
        status={invoiceDialogStatus || 'draft'}
        count={
          invoiceDialogStatus === 'processing'
            ? stats?.processing.total || 0
            : stats?.[invoiceDialogStatus === 'overdue' ? 'overdue' : 'draftInvoices'] || 0
        }
        startDate={filter.startDate?.toISOString()}
        endDate={filter.endDate?.toISOString()}
        periodLabel={periodLabel}
      />

      <NewClientsDialog
        open={newClientsOpen}
        onClose={() => setNewClientsOpen(false)}
        count={stats?.newClients || 0}
        startDate={filter.startDate?.toISOString()}
        endDate={filter.endDate?.toISOString()}
        periodLabel={periodLabel}
      />

      <CampaignBreakdownDrawer client={breakdownClient} onClose={() => setBreakdownClient(null)} />
    </Container>
  );
}
