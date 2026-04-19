import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import {
  Box,
  Stack,
  Avatar,
  Drawer,
  InputBase,
  IconButton,
  Typography,
  InputAdornment,
} from '@mui/material';

import Iconify from 'src/components/iconify';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDate = (d) => (d ? dayjs(d).format('MMM D, YYYY') : '—');

const getStatusStyle = (status) => {
  switch (status) {
    case 'EXPIRED':
      return { label: 'Expired', color: '#EF4444', bg: '#FEF2F2' };
    case 'CANCELLED':
      return { label: 'Cancelled', color: '#F59E0B', bg: '#FFFBEB' };
    default:
      return { label: 'No Subscription', color: '#919EAB', bg: '#F4F6F8' };
  }
};

// ---------------------------------------------------------------------------
// CompanyRow
// ---------------------------------------------------------------------------

function CompanyRow({ company }) {
  const statusStyle = getStatusStyle(company.lastSubStatus);

  return (
    <Box sx={{ px: 2.5, py: 0.75 }}>
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          border: '1px solid #E8ECEE',
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'border-color 0.15s',
          '&:hover': { borderColor: '#C4CDD5' },
        }}
      >
        <Stack direction="row" alignItems="stretch">
          <Stack sx={{ flex: 1, py: 1.75, pl: 2, pr: 1.5, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Avatar
                src={company.logo}
                sx={{
                  width: 34,
                  height: 34,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  bgcolor: '#F4F6F8',
                  color: '#637381',
                  borderRadius: '8px',
                }}
              >
                {company.name?.[0]}
              </Avatar>
              <Stack sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#1A1A2E',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {company.name}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#919EAB', lineHeight: 1.3 }}>
                  {company.lastPackage}
                </Typography>
              </Stack>
            </Stack>

            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={2.5}
              sx={{ mt: 1.25, pl: 0.5 }}
            >
              <Stack spacing={0.25}>
                <Typography
                  sx={{
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    color: '#919EAB',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    lineHeight: 1,
                  }}
                >
                  Registered
                </Typography>
                <Typography
                  sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#637381', lineHeight: 1.3 }}
                >
                  {formatDate(company.createdAt)}
                </Typography>
              </Stack>

              <Stack spacing={0.25}>
                <Typography
                  sx={{
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    color: '#EF4444',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    lineHeight: 1,
                  }}
                >
                  Expired On
                </Typography>
                <Typography
                  sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#333', lineHeight: 1.3 }}
                >
                  {formatDate(company.expiredAt)}
                </Typography>
              </Stack>

              <Stack spacing={0.25}>
                <Typography
                  sx={{
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    color: '#919EAB',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    lineHeight: 1,
                  }}
                >
                  Campaigns
                </Typography>
                <Typography
                  sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#637381', lineHeight: 1.3 }}
                >
                  {company.totalCampaigns}
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={0.5}
            sx={{
              width: 90,
              flexShrink: 0,
              bgcolor: statusStyle.bg,
              borderLeft: `1px solid ${statusStyle.color}30`,
              py: 1.5,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.5625rem',
                fontWeight: 700,
                color: statusStyle.color,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                lineHeight: 1.2,
                textAlign: 'center',
                px: 0.5,
              }}
            >
              {statusStyle.label}
            </Typography>
            <Typography sx={{ fontSize: '0.625rem', color: '#919EAB', lineHeight: 1 }}>
              {company.totalClients} user{company.totalClients !== 1 ? 's' : ''}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

CompanyRow.propTypes = {
  company: PropTypes.object.isRequired,
};

// ---------------------------------------------------------------------------
// HeroStats
// ---------------------------------------------------------------------------

function HeroStats({ total, v4, v2, inactive }) {
  const items = [
    { label: 'Total', value: total, color: '#1A1A2E' },
    { label: 'V4', value: v4, color: '#10B981' },
    { label: 'V2', value: v2, color: '#10B981' },
    { label: 'Inactive', value: inactive, color: '#EF4444' },
  ];

  return (
    <Stack
      direction="row"
      spacing={0}
      sx={{
        mt: 1.5,
        mx: 2.5,
        mb: 2,
        borderRadius: '10px',
        border: '1px solid #E8ECEE',
        overflow: 'hidden',
      }}
    >
      {items.map((item, idx) => (
        <Box key={item.label} sx={{ display: 'contents' }}>
          {idx > 0 && <Box sx={{ width: '1px', bgcolor: '#E8ECEE', my: 1 }} />}
          <Stack alignItems="center" sx={{ flex: 1, py: 1.5 }}>
            <Typography
              sx={{
                fontSize: '1.375rem',
                fontWeight: 700,
                color: item.color,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {item.value ?? '—'}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.625rem',
                fontWeight: 600,
                color: '#919EAB',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mt: 0.5,
              }}
            >
              {item.label}
            </Typography>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

HeroStats.propTypes = {
  total: PropTypes.number,
  v4: PropTypes.number,
  v2: PropTypes.number,
  inactive: PropTypes.number,
};

// ---------------------------------------------------------------------------
// Main Drawer
// ---------------------------------------------------------------------------

export default function InactiveBrandsDrawer({ open, onClose, brands }) {
  const [search, setSearch] = useState('');

  const companies = useMemo(
    () => brands?.inactiveCompaniesDetail || [],
    [brands?.inactiveCompaniesDetail]
  );

  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.trim().toLowerCase();
    return companies.filter((c) => c.name?.toLowerCase().includes(q));
  }, [companies, search]);

  return (
    <Drawer
      open={open}
      onClose={() => {
        setSearch('');
        onClose();
      }}
      anchor="right"
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{
        sx: {
          width: { xs: 1, sm: 480 },
          borderTopLeftRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#F4F4F4',
          boxShadow: '-12px 0 40px -4px rgba(145, 158, 171, 0.24)',
          borderLeft: '1px solid #919EAB3D',
        },
      }}
    >
      {/* Sticky Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ pt: 2.5, px: 2.5 }}
        >
          <Stack>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Inactive Brands
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#919EAB', mt: 0.5, lineHeight: 1.5 }}>
              Brands with{' '}
              <Typography
                component="span"
                sx={{ fontWeight: 700, color: '#637381', fontSize: 'inherit' }}
              >
                no active subscription
              </Typography>
            </Typography>
          </Stack>
          <IconButton
            onClick={() => {
              setSearch('');
              onClose();
            }}
            sx={{ mt: -1 }}
          >
            <Iconify icon="eva:close-fill" sx={{ height: 22, width: 22 }} />
          </IconButton>
        </Stack>

        <HeroStats
          total={brands?.totalCompanies}
          v4={brands?.v4Companies}
          v2={brands?.v2Companies}
          inactive={brands?.inactiveCompanies}
        />

        {companies.length > 0 && (
          <Box sx={{ px: 2.5, pb: 2 }}>
            <InputBase
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand..."
              startAdornment={
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} sx={{ color: '#C4CDD5' }} />
                </InputAdornment>
              }
              sx={{
                width: 1,
                height: 38,
                px: 1.5,
                fontSize: '0.8125rem',
                bgcolor: '#F9FAFB',
                borderRadius: '10px',
                border: '1px solid #E8ECEE',
                transition: 'border-color 0.15s',
                '&.Mui-focused': { borderColor: '#C4CDD5' },
              }}
            />
          </Box>
        )}
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#F4F4F4' }}>
        {companies.length === 0 && (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 10, px: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                bgcolor: '#F4F6F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
              }}
            >
              <Iconify icon="solar:buildings-2-linear" width={24} sx={{ color: '#C4CDD5' }} />
            </Box>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#637381' }}>
              No inactive brands
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#919EAB', mt: 0.25 }}>
              All brands have active subscriptions
            </Typography>
          </Stack>
        )}

        {companies.length > 0 && (
          <Box sx={{ pt: 0.75, pb: 1 }}>
            {filteredCompanies.length === 0 ? (
              <Stack alignItems="center" sx={{ py: 5 }}>
                <Typography sx={{ fontSize: '0.8125rem', color: '#919EAB' }}>
                  No brands matching &ldquo;{search}&rdquo;
                </Typography>
              </Stack>
            ) : (
              filteredCompanies.map((company) => <CompanyRow key={company.id} company={company} />)
            )}
          </Box>
        )}
      </Box>

      {/* Sticky Footer */}
      <Box
        sx={{
          flexShrink: 0,
          px: 2.5,
          py: 1.25,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: '#FFFFFF',
        }}
      >
        <Stack direction="row" justifyContent="center">
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#637381' }}>
            {companies.length} inactive brand{companies.length !== 1 ? 's' : ''}
          </Typography>
        </Stack>
      </Box>
    </Drawer>
  );
}

InactiveBrandsDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  brands: PropTypes.object,
};
