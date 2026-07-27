import useSWR from 'swr';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Card,
  Grid,
  Stack,
  Table,
  Avatar,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  OutlinedInput,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import { fetcher, endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

const SWR_OPTS = { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 60000 };

const nf = (n) => Math.round(n || 0).toLocaleString('en-US');
const fmtMYR = (n) => `MYR ${nf(n)}`;

// Rounds to a whole percent, but keeps a decimal for small non-zero values so
// e.g. 35/10,000 shows as "0.4%" instead of misleadingly rounding down to "0%".
const formatPct = (rawPct) => {
  if (rawPct <= 0) return '0%';
  if (rawPct < 1) return `${rawPct.toFixed(1)}%`;
  return `${Math.round(rawPct)}%`;
};

const TABLE_HEAD = ['#', 'Client', 'UGC credits', 'Creator budget'];

function formatValidity(dateValue) {
  if (!dateValue) return null;
  const date = dayjs(dateValue);
  const diffDays = date.startOf('day').diff(dayjs().startOf('day'), 'day');
  const diffYears = Math.abs(Math.round(diffDays / 365));

  let relative;
  if (diffDays < 0) {
    if (diffDays < -365) relative = `Expired ${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
    else if (diffDays < -60) relative = `Expired ${Math.round(Math.abs(diffDays) / 30)} months ago`;
    else relative = `Expired ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago`;
  } else if (diffDays === 0) relative = 'Expires today';
  else if (diffDays === 1) relative = 'Expires tomorrow';
  else if (diffDays < 30) relative = `Expires in ${diffDays} days`;
  else if (diffDays < 60) relative = 'Expires in a month';
  else if (diffDays < 365) relative = `Expires in ${Math.round(diffDays / 30)} months`;
  else relative = `Expires in ${diffYears} year${diffYears === 1 ? '' : 's'}`;

  return { relative };
}

function ProgressBlock({ label, used, total, pct, formatValue }) {
  return (
    <Box sx={{ minWidth: 170 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#111827' }}>{formatPct(pct)}</Typography>
      </Stack>
      <Box sx={{ height: 5, borderRadius: '999px', bgcolor: '#f3f4f6', overflow: 'hidden' }}>
        <Box
          sx={{
            height: '100%',
            width: `${Math.min(100, pct)}%`,
            minWidth: pct > 0 ? 6 : 0,
            borderRadius: '999px',
            background: 'linear-gradient(90deg, #111827 0%, #1340FF 100%)',
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ color: '#9ca3af' }}>
        {formatValue(used)} / {formatValue(total)}
      </Typography>
    </Box>
  );
}

ProgressBlock.propTypes = {
  label: PropTypes.string.isRequired,
  used: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  pct: PropTypes.number.isRequired,
  formatValue: PropTypes.func.isRequired,
};

function ClientLogo({ client }) {
  return (
    <Avatar
      src={client.logo || undefined}
      variant="rounded"
      sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#F3F4F6', flexShrink: 0 }}
    >
      <Iconify icon="hugeicons:building-06" width={20} sx={{ color: '#6b7280' }} />
    </Avatar>
  );
}

ClientLogo.propTypes = { client: PropTypes.object.isRequired };

function ClientNameCell({ client }) {
  const validity = formatValidity(client.expiredAt);
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <ClientLogo client={client} />
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Typography noWrap sx={{ fontWeight: 700, color: '#111827', fontSize: '0.88rem' }} title={client.name}>
            {client.name}
          </Typography>
          {client.isDemo && (
            <Box
              component="span"
              sx={{
                px: 0.8,
                py: 0.05,
                borderRadius: '999px',
                fontSize: '0.62rem',
                fontWeight: 700,
                bgcolor: '#F3F4F6',
                color: '#9ca3af',
              }}
            >
              demo
            </Box>
          )}
        </Stack>
        <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
          {client.packageName || 'No package'}
        </Typography>
        {validity && (
          <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
            {validity.relative}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

ClientNameCell.propTypes = { client: PropTypes.object.isRequired };

function ClientCard({ client }) {
  const ugcPct = client.ugcCredits.total > 0 ? Math.min(100, (client.ugcCredits.used / client.ugcCredits.total) * 100) : 0;
  const budgetPct =
    client.creatorBudget.total > 0 ? Math.min(100, (client.creatorBudget.spent / client.creatorBudget.total) * 100) : 0;

  return (
    <Card sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
      <Box sx={{ mb: 2 }}>
        <ClientNameCell client={client} />
      </Box>
      <Stack spacing={1.5}>
        <ProgressBlock label="UGC Credits" used={client.ugcCredits.used} total={client.ugcCredits.total} pct={ugcPct} formatValue={nf} />
        <ProgressBlock
          label="Creator Budget"
          used={client.creatorBudget.spent}
          total={client.creatorBudget.total}
          pct={budgetPct}
          formatValue={fmtMYR}
        />
      </Stack>
    </Card>
  );
}

ClientCard.propTypes = { client: PropTypes.object.isRequired };

function ClientsTable({ clients }) {
  return (
    <Card sx={{ borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: 'none', overflow: 'hidden' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f9fafb' }}>
              {TABLE_HEAD.map((h) => (
                <TableCell
                  key={h}
                  sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', py: 1.25, whiteSpace: 'nowrap' }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client, idx) => {
              const ugcPct =
                client.ugcCredits.total > 0
                  ? Math.min(100, (client.ugcCredits.used / client.ugcCredits.total) * 100)
                  : 0;
              const budgetPct =
                client.creatorBudget.total > 0
                  ? Math.min(100, (client.creatorBudget.spent / client.creatorBudget.total) * 100)
                  : 0;
              return (
                <TableRow key={client.companyId} sx={{ '&:last-of-type td': { border: 0 } }}>
                  <TableCell sx={{ borderBottom: '1px solid #f3f4f6', color: '#9ca3af', verticalAlign: 'top', pt: 2 }}>
                    {idx + 1}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f3f4f6', py: 1.5, maxWidth: 260 }}>
                    <ClientNameCell client={client} />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f3f4f6', verticalAlign: 'top', pt: 2 }}>
                    <ProgressBlock
                      // label="UGC Credits"
                      used={client.ugcCredits.used}
                      total={client.ugcCredits.total}
                      pct={ugcPct}
                      formatValue={nf}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f3f4f6', verticalAlign: 'top', pt: 2 }}>
                    <ProgressBlock
                      // label="Creator Budget"
                      used={client.creatorBudget.spent}
                      total={client.creatorBudget.total}
                      pct={budgetPct}
                      formatValue={fmtMYR}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}

ClientsTable.propTypes = { clients: PropTypes.array.isRequired };

const ClientsTab = () => {
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list');

  const { data, isLoading } = useSWR(endpoints.analytics.clientsOverview, fetcher, SWR_OPTS);
  const clients = useMemo(() => data?.data?.clients || [], [data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (c) => c.name?.toLowerCase().includes(term) || c.packageName?.toLowerCase().includes(term)
    );
  }, [clients, search]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={20} sx={{ color: '#1340FF' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="flex-end"
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Stack direction="row" sx={{ p: 0.4, borderRadius: '10px', bgcolor: '#f3f4f6' }}>
            <IconButton
              size="small"
              onClick={() => setView('list')}
              sx={{ borderRadius: '8px', bgcolor: view === 'list' ? '#111827' : 'transparent', color: view === 'list' ? '#fff' : '#9ca3af' }}
            >
              <Iconify icon="solar:list-bold" width={16} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setView('grid')}
              sx={{ borderRadius: '8px', bgcolor: view === 'grid' ? '#111827' : 'transparent', color: view === 'grid' ? '#fff' : '#9ca3af' }}
            >
              <Iconify icon="solar:widget-2-bold" width={16} />
            </IconButton>
          </Stack>

          <OutlinedInput
            size="small"
            placeholder="Search clients by company or package"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" width={18} sx={{ color: '#9ca3af' }} />
              </InputAdornment>
            }
            sx={{
              width: { xs: '100%', sm: 300 },
              borderRadius: '10px',
              bgcolor: '#fff',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
            }}
          />
        </Stack>
      </Stack>

      {filtered.length === 0 && (
        <Card sx={{ p: 4, borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: 'none', textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
            No clients found
          </Typography>
        </Card>
      )}

      {filtered.length > 0 && view === 'grid' && (
        <Grid container spacing={2}>
          {filtered.map((client) => (
            <Grid item xs={12} sm={6} md={4} key={client.companyId}>
              <ClientCard client={client} />
            </Grid>
          ))}
        </Grid>
      )}

      {filtered.length > 0 && view === 'list' && <ClientsTable clients={filtered} />}
    </Box>
  );
};

export default ClientsTab;
