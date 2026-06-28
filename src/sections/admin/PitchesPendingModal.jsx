import useSWR from 'swr';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Stack,
  Avatar,
  Dialog,
  Divider,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

dayjs.extend(relativeTime);

const PAGE_SIZE = 8;

export default function PitchesPendingModal({ open, onClose }) {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSWR(
    open ? endpoints.dashboard.pitchesPending : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const pitches = Array.isArray(data) ? data : [];

  const grouped = useMemo(() => {
    const map = {};
    pitches.forEach((p) => {
      if (!map[p.campaignId]) {
        map[p.campaignId] = { campaign: p.campaign, items: [] };
      }
      map[p.campaignId].items.push(p);
    });
    return Object.values(map);
  }, [pitches]);

  const totalPages = Math.ceil(pitches.length / PAGE_SIZE);
  const pagedIds = new Set(
    pitches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p) => p.id)
  );

  const handleGoToCampaign = (campaignId) => {
    router.push(paths.dashboard.campaign.adminCampaignDetail(campaignId));
    onClose();
  };

  const handleGoToPitch = (campaignId) => {
    router.push(`${paths.dashboard.campaign.adminCampaignDetail(campaignId)}?tab=pitch`);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          p: 3,
          maxHeight: '85vh',
        },
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography
            sx={{
              fontSize: '1.75rem',
              fontWeight: 400,
              color: '#111827',
              fontFamily: '"Instrument Serif", serif',
            }}
          >
            Pitches with pending review
          </Typography>
          {!isLoading && (
            <Box
              sx={{
                bgcolor: '#f3f4f6',
                borderRadius: '20px',
                px: 1.2,
                py: 0.3,
              }}
            >
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#6b7280' }}>
                {pitches.length} total
              </Typography>
            </Box>
          )}
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: '#6b7280' }}>
          <Iconify icon="mingcute:close-line" width={20} />
        </IconButton>
      </Stack>

      {/* Body */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={24} sx={{ color: '#1340FF' }} />
        </Box>
      )}

      {!isLoading && pitches.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography sx={{ color: '#9ca3af', fontSize: '0.9rem' }}>
            No pitches pending review right now.
          </Typography>
        </Box>
      )}

      {!isLoading && grouped.length > 0 && (
        <Box sx={{ overflowY: 'auto', maxHeight: '60vh', pr: 0.5 }}>
          <Stack spacing={3}>
            {grouped.map(({ campaign, items }) => {
              const visibleItems = items.filter((p) => pagedIds.has(p.id));
              if (visibleItems.length === 0) return null;

              return (
                <Box key={campaign.id}>
                  {/* Campaign header row */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 1.5 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '10px',
                          bgcolor: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Iconify icon="hugeicons:megaphone-01" width={18} sx={{ color: '#6b7280' }} />
                      </Box>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: '#111827',
                          fontFamily: "'Inter Display', Inter, sans-serif",
                        }}
                      >
                        {campaign.name}
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: '#1340FF',
                          borderRadius: '50%',
                          width: 22,
                          height: 22,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                          {items.length}
                        </Typography>
                      </Box>
                    </Stack>
                    <Box
                      onClick={() => handleGoToCampaign(campaign.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        height: 34,
                        borderRadius: '8px',
                        border: '1px solid #E7E7E7',
                        bgcolor: '#FFFFFF',
                        boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                        px: '14px',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#f9fafb' },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#374151',
                          textTransform: 'uppercase',
                        }}
                      >
                        Go to campaign
                      </Typography>
                      <Iconify icon="mingcute:external-link-line" width={14} sx={{ color: '#374151' }} />
                    </Box>
                  </Stack>

                  {/* Pitch rows */}
                  <Stack spacing={1}>
                    {visibleItems.map((pitch) => (
                      <Box
                        key={pitch.id}
                        onClick={() => handleGoToPitch(pitch.campaignId)}
                        sx={{
                          border: '1px solid #f3f4f6',
                          borderRadius: '12px',
                          p: 1.5,
                          bgcolor: '#fafafa',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#f3f4f6' },
                          transition: 'background 0.15s',
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar
                            src={pitch.user?.photoURL}
                            sx={{ width: 40, height: 40, bgcolor: '#e5e7eb', fontSize: '0.9rem' }}
                          >
                            {pitch.user?.name?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>
                              {pitch.user?.name || 'Unknown'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                              {dayjs(pitch.createdAt).fromNow()}
                            </Typography>
                          </Box>
                          <Iconify
                            icon="mingcute:arrow-right-line"
                            width={20}
                            sx={{ color: '#9ca3af', flexShrink: 0 }}
                          />
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                  <Divider sx={{ mt: 2 }} />
                </Box>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2.5 }}>
          <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            Page {page} of {totalPages}
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              sx={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                width: 32,
                height: 32,
                '&:disabled': { opacity: 0.4 },
              }}
            >
              <Iconify icon="mingcute:left-line" width={16} />
            </IconButton>
            <IconButton
              size="small"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              sx={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                width: 32,
                height: 32,
                '&:disabled': { opacity: 0.4 },
              }}
            >
              <Iconify icon="mingcute:right-line" width={16} />
            </IconButton>
          </Stack>
        </Stack>
      )}
    </Dialog>
  );
}
