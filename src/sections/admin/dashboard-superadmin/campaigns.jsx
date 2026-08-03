import useSWR from 'swr';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Card,
  Stack,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  OutlinedInput,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import { fetcher, endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

const SWR_OPTS = { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 60000 };

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const nf = (n) => Math.round(n || 0).toLocaleString('en-US');
const fmtMYR = (n) => `MYR ${nf(n)}`;

// Rounds to a whole percent, but keeps a decimal for small non-zero values so
// e.g. 35/10,000 shows as "0.4%" instead of misleadingly rounding down to "0%".
const formatPct = (rawPct) => {
  if (rawPct <= 0) return '0%';
  if (rawPct < 1) return `${rawPct.toFixed(1)}%`;
  return `${Math.round(rawPct)}%`;
};

const TABLE_HEAD = ['#', 'Campaign', 'CSM', 'Campaign credits', 'Campaign budget'];

function ProgressCell({ used, total, pct, formatValue }) {
  return (
    <Box sx={{ minWidth: 180 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography sx={{ fontSize: '0.78rem', color: '#374151' }}>
          {formatValue(used)} / {formatValue(total)}
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
    </Box>
  );
}

ProgressCell.propTypes = {
  used: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  pct: PropTypes.number.isRequired,
  formatValue: PropTypes.func.isRequired,
};

const CampaignsTab = ({ dateRange }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const query = dateRange
    ? `${endpoints.analytics.campaignsOverview}?startDate=${encodeURIComponent(dateRange.startDate)}&endDate=${encodeURIComponent(dateRange.endDate)}`
    : endpoints.analytics.campaignsOverview;

  const { data, isLoading } = useSWR(query, fetcher, SWR_OPTS);
  const campaigns = useMemo(() => data?.data?.campaigns || [], [data]);
  const counts = data?.data?.counts || { total: 0, active: 0, completed: 0 };

  const filtered = useMemo(() => {
    let rows = campaigns;
    if (filter === 'active') rows = rows.filter((c) => c.status === 'ACTIVE');
    else if (filter === 'completed') rows = rows.filter((c) => c.status === 'COMPLETED');

    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.companyName?.toLowerCase().includes(term) ||
        c.csmName?.toLowerCase().includes(term)
    );
  }, [campaigns, filter, search]);

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
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" spacing={1}>
          {FILTERS.map((f) => {
            const active = filter === f.value;
            const countByFilter = { all: counts.total, active: counts.active, completed: counts.completed };
            const count = countByFilter[f.value];
            return (
              <Box
                key={f.value}
                component="button"
                type="button"
                onClick={() => setFilter(f.value)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.5,
                  py: 0.7,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: '1px solid',
                  borderColor: active ? '#111827' : '#e5e7eb',
                  bgcolor: active ? '#111827' : '#fff',
                  color: active ? '#fff' : '#374151',
                }}
              >
                {f.label}
                <Box
                  component="span"
                  sx={{
                    px: 0.9,
                    py: 0.05,
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    bgcolor: active ? 'rgba(255,255,255,0.16)' : '#F3F4F6',
                    color: active ? '#fff' : '#374151',
                  }}
                >
                  {count}
                </Box>
              </Box>
            );
          })}
        </Stack>

        <OutlinedInput
          size="small"
          placeholder="Search campaigns, brands, clients, CSMs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startAdornment={
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" width={18} sx={{ color: '#9ca3af' }} />
            </InputAdornment>
          }
          sx={{
            width: { xs: '100%', sm: 320 },
            borderRadius: '10px',
            bgcolor: '#fff',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
          }}
        />
      </Stack>

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
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={TABLE_HEAD.length} align="center" sx={{ py: 6, color: '#9ca3af', border: 0 }}>
                    No campaigns found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c, idx) => {
                  const creditsPct = c.credits > 0 ? Math.min(100, (c.creditsUtilized / c.credits) * 100) : 0;
                  const budgetPct =
                    c.creatorBudget != null && c.creatorBudget > 0
                      ? Math.min(100, ((c.creatorBudgetSpent || 0) / c.creatorBudget) * 100)
                      : 0;
                  return (
                    <TableRow
                      key={c.campaignId}
                      hover
                      sx={{ cursor: 'pointer', '&:last-of-type td': { border: 0 } }}
                      onClick={() => window.open(`/dashboard/campaign/discover/detail/${c.campaignId}`, '_blank')}
                    >
                      <TableCell sx={{ borderBottom: '1px solid #f3f4f6', color: '#9ca3af' }}>{idx + 1}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f3f4f6', maxWidth: 220 }}>
                        <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }} title={c.name}>
                          {c.name || 'Untitled'}
                        </Typography>
                        <Typography noWrap variant="caption" sx={{ color: '#9ca3af' }}>
                          {c.companyName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f3f4f6', color: c.csmName ? '#374151' : '#9ca3af' }}>
                        {c.csmName || '—'}
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                        <ProgressCell used={c.creditsUtilized} total={c.credits} pct={creditsPct} formatValue={nf} />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                        {c.creatorBudget != null ? (
                          <ProgressCell
                            used={c.creatorBudgetSpent || 0}
                            total={c.creatorBudget}
                            pct={budgetPct}
                            formatValue={fmtMYR}
                          />
                        ) : (
                          <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
};

CampaignsTab.propTypes = {
  dateRange: PropTypes.object,
};

export default CampaignsTab;
