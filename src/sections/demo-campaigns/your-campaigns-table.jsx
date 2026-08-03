import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------
// "Your Campaigns" table for demo clients. Lists the demo campaigns the
// session has created; falls back to an empty state when there are none.

const COLUMNS = [
  { label: 'Campaign Name', flex: 1.6 },
  { label: 'Start Date', flex: 1 },
  { label: 'End Date', flex: 1 },
  { label: 'Status', flex: 1 },
  { label: '', flex: 1.1 },
];

const PAGE_SIZE = 5;

const HEADER_CELL_SX = {
  px: 1.75,
  py: 1,
  color: '#1340FF',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: '16px',
};

const BODY_CELL_SX = {
  px: 1.75,
  fontSize: 14,
  color: '#231F20',
  lineHeight: '18px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

// Status pill colors — ACTIVE green, everything else neutral grey.
const STATUS_PILL = {
  ACTIVE: '#1ABF66',
};
const getStatusColor = (status) => STATUS_PILL[status] || '#8E8E93';
// Non-active demo campaigns surface as "INACTIVE".
const getStatusLabel = (status) => (status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE');

const formatDate = (value) => (value ? dayjs(value).format('DD MMM YYYY') : '—');

function StatusPill({ status }) {
  const color = getStatusColor(status);
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        px: 1,
        py: '6px',
        pb: '8px',
        bgcolor: '#FFFFFF',
        border: `1px solid ${color}`,
        boxShadow: `inset 0px -3px 0px ${color}`,
        borderRadius: '6px',
        width: 'fit-content',
      }}
    >
      <Typography
        sx={{ fontSize: 12, fontWeight: 600, lineHeight: '16px', color, textTransform: 'uppercase' }}
      >
        {getStatusLabel(status)}
      </Typography>
    </Stack>
  );
}

StatusPill.propTypes = {
  status: PropTypes.string,
};

export default function YourCampaignsTable({
  campaigns = [],
  isLoading = false,
  onCreateCampaign,
}) {
  const router = useRouter();
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(campaigns.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  const pageRows = useMemo(
    () => campaigns.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [campaigns, safePage]
  );

  const hasCampaigns = campaigns.length > 0;

  return (
    <Stack sx={{ width: '100%' }} spacing={0.5}>
      <Box sx={{ minHeight: 266, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: '#F5F5F5',
            borderRadius: '8px',
          }}
        >
          {COLUMNS.map((column, index) => (
            <Typography key={index} sx={{ ...HEADER_CELL_SX, flex: column.flex }}>
              {column.label}
            </Typography>
          ))}
        </Box>

        {hasCampaigns ? (
          // Rows
          <Box sx={{ flexGrow: 1 }}>
            {pageRows.map((campaign) => (
              <Box
                key={campaign.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 1,
                  borderBottom: '1px solid #EBEBEB',
                }}
              >
                {/* Name + avatar */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.25}
                  sx={{ flex: COLUMNS[0].flex, px: 1.75, minWidth: 0 }}
                >
                  <Avatar
                    src={campaign.data?.campaignImages?.[0]}
                    alt={campaign.name}
                    sx={{ width: 32, height: 32, bgcolor: '#D4D4D4', border: '1px solid #EBEBEB' }}
                  />
                  <Typography sx={{ ...BODY_CELL_SX, px: 0 }}>{campaign.name}</Typography>
                </Stack>

                <Typography sx={{ ...BODY_CELL_SX, flex: COLUMNS[1].flex }}>
                  {formatDate(campaign.startDate)}
                </Typography>
                <Typography sx={{ ...BODY_CELL_SX, flex: COLUMNS[2].flex }}>
                  {formatDate(campaign.endDate)}
                </Typography>

                <Box sx={{ flex: COLUMNS[3].flex, px: 1.75 }}>
                  <StatusPill status={campaign.status} />
                </Box>

                {/* Action */}
                <Box
                  sx={{ flex: COLUMNS[4].flex, px: 1.75, display: 'flex', justifyContent: 'flex-end' }}
                >
                  <Button
                    disableRipple
                    onClick={() => router.push(paths.dashboard.demoCampaigns.details(campaign.id))}
                    sx={{
                      p: '8px 12px 11px',
                      bgcolor: '#FFFFFF',
                      color: '#1340FF',
                      fontWeight: 600,
                      fontSize: 14,
                      lineHeight: '18px',
                      textTransform: 'none',
                      border: '1px solid #E8E8E8',
                      boxShadow: 'inset 0px -3px 0px #E7E7E7',
                      borderRadius: '8px',
                      '&:hover': {
                        bgcolor: '#F5F5F5',
                        border: '1px solid #E8E8E8',
                        boxShadow: 'inset 0px -3px 0px #E7E7E7',
                      },
                    }}
                  >
                    View Campaign
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          // Empty state
          <Box sx={{ px: 1.75, flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 500, lineHeight: '20px' }}>
              <Box
                component={isLoading ? 'span' : 'button'}
                type={isLoading ? undefined : 'button'}
                onClick={isLoading ? undefined : onCreateCampaign}
                sx={{
                  p: 0,
                  border: 0,
                  bgcolor: 'transparent',
                  color: '#0062CD',
                  font: 'inherit',
                  fontWeight: 'inherit',
                  cursor: isLoading ? 'default' : 'pointer',
                  '&:hover': {
                    textDecoration: isLoading ? 'none' : 'underline',
                  },
                  '&:focus-visible': {
                    outline: '2px solid #1340FF',
                    outlineOffset: 2,
                    borderRadius: '2px',
                  },
                }}
              >
                {isLoading ? 'Loading campaigns' : 'Create a campaign'}
              </Box>{' '}
              <Box component="span" sx={{ color: '#636366' }}>
                to display information
              </Box>
            </Typography>
          </Box>
        )}
      </Box>

      {/* Pagination */}
      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1.25}>
        <Iconify
          icon="eva:chevron-left-fill"
          width={24}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          sx={{
            color: '#231F20',
            cursor: safePage > 0 ? 'pointer' : 'default',
            opacity: safePage > 0 ? 1 : 0.4,
          }}
        />
        {Array.from({ length: totalPages }, (_, index) => (
          <Typography
            key={index}
            onClick={() => setPage(index)}
            sx={{
              fontSize: 16,
              fontWeight: index === safePage ? 500 : 400,
              color: index === safePage ? '#000000' : '#8E8E93',
              cursor: 'pointer',
            }}
          >
            {index + 1}
          </Typography>
        ))}
        <Iconify
          icon="eva:chevron-right-fill"
          width={24}
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          sx={{
            color: '#231F20',
            cursor: safePage < totalPages - 1 ? 'pointer' : 'default',
            opacity: safePage < totalPages - 1 ? 1 : 0.4,
          }}
        />
      </Stack>
    </Stack>
  );
}

YourCampaignsTable.propTypes = {
  campaigns: PropTypes.array,
  isLoading: PropTypes.bool,
  onCreateCampaign: PropTypes.func,
};
