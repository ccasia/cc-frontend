import useSWR from 'swr';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Stack,
  Avatar,
  Button,
  Dialog,
  Divider,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

dayjs.extend(relativeTime);

const PAGE_SIZE = 8;

export default function AgreementsPendingModal({ open, onClose }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState(null);

  const { data, isLoading, mutate } = useSWR(
    open ? endpoints.dashboard.agreementsPending : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const submissions = Array.isArray(data) ? data : [];

  // Group by campaign
  const grouped = useMemo(() => {
    const map = {};
    submissions.forEach((s) => {
      if (!map[s.campaignId]) {
        map[s.campaignId] = { campaign: s.campaign, items: [] };
      }
      map[s.campaignId].items.push(s);
    });
    return Object.values(map);
  }, [submissions]);

  // Flatten for pagination
  const totalPages = Math.ceil(submissions.length / PAGE_SIZE);
  const pagedIds = new Set(
    submissions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((s) => s.id)
  );

  const handleAction = async (submission, status) => {
    setLoadingId(`${submission.id}-${status}`);
    try {
      await axiosInstance.patch(endpoints.submission.admin.agreement, {
        submissionId: submission.id,
        campaignId: submission.campaignId,
        userId: submission.userId,
        status,
        submission: { dependencies: submission.dependencies },
      });
      mutate();
    } catch (e) {
      console.error(`Failed to ${status} agreement`, e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleGoToCampaign = (campaignId) => {
    router.push(paths.dashboard.campaign.adminCampaignDetail(campaignId));
    onClose();
  };

  const handleView = (url) => {
    window.open(url, '_blank');
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
            Agreements with pending review
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
                {submissions.length} total
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

      {!isLoading && submissions.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography sx={{ color: '#9ca3af', fontSize: '0.9rem' }}>
            No pending agreements right now.
          </Typography>
        </Box>
      )}

      {!isLoading && grouped.length > 0 && (
        <Box sx={{ overflowY: 'auto', maxHeight: '60vh', pr: 0.5 }}>
          <Stack spacing={3}>
            {grouped.map(({ campaign, items }) => {
              const visibleItems = items.filter((a) => pagedIds.has(a.id));
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
                          bgcolor: '#f59e0b',
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
                    <Button
                      size="small"
                      endIcon={<Iconify icon="mingcute:external-link-line" width={14} />}
                      onClick={() => handleGoToCampaign(campaign.id)}
                      sx={{
                        height: 34,
                        borderRadius: '8px',
                        border: '1px solid #E7E7E7',
                        bgcolor: '#FFFFFF',
                        boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                        px: '16px',
                        py: '6px',
                        gap: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#374151',
                        textTransform: 'uppercase',
                        '&:hover': { bgcolor: '#f9fafb' },
                      }}
                    >
                      Go to campaign
                    </Button>
                  </Stack>

                  {/* Creator rows */}
                  <Stack spacing={1}>
                    {visibleItems.map((submission) => (
                      <Box
                        key={submission.id}
                        sx={{
                          border: '1px solid #f3f4f6',
                          borderRadius: '12px',
                          p: 1.5,
                          bgcolor: '#fafafa',
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar
                            src={submission.user?.photoURL}
                            sx={{ width: 40, height: 40, bgcolor: '#e5e7eb', fontSize: '0.9rem' }}
                          >
                            {submission.user?.name?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>
                              {submission.user?.name || 'Unknown'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                              Submitted {dayjs(submission.updatedAt).fromNow()}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {submission.content && (
                              <Button
                                size="small"
                                startIcon={<Iconify icon="hugeicons:file-01" width={14} />}
                                onClick={() => handleView(submission.content)}
                                sx={{
                                  width: 87,
                                  height: 34,
                                  borderRadius: '8px',
                                  border: '1px solid #E7E7E7',
                                  bgcolor: '#FFFFFF',
                                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                  px: '16px',
                                  py: '6px',
                                  gap: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  color: '#374151',
                                  textTransform: 'uppercase',
                                  '&:hover': { bgcolor: '#f9fafb' },
                                }}
                              >
                                View
                              </Button>
                            )}
                            <Button
                              size="small"
                              disabled={!!loadingId}
                              onClick={() => handleAction(submission, 'reject')}
                              sx={{
                                width: 87,
                                height: 34,
                                borderRadius: '8px',
                                border: '1px solid #D4321C',
                                bgcolor: '#FFFFFF',
                                boxShadow: '0px -3px 0px 0px #D4321C inset',
                                px: '16px',
                                py: '6px',
                                gap: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: '#D4321C',
                                textTransform: 'uppercase',
                                '&:hover': { bgcolor: '#fff5f5' },
                              }}
                            >
                              {loadingId === `${submission.id}-reject` ? '...' : 'Reject'}
                            </Button>
                            <Button
                              size="small"
                              disabled={!!loadingId}
                              onClick={() => handleAction(submission, 'approve')}
                              sx={{
                                width: 87,
                                height: 34,
                                borderRadius: '8px',
                                border: '1px solid #1ABF66',
                                bgcolor: '#FFFFFF',
                                boxShadow: '0px -3px 0px 0px #1ABF66 inset',
                                px: '16px',
                                py: '6px',
                                gap: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: '#1ABF66',
                                textTransform: 'uppercase',
                                '&:hover': { bgcolor: '#f0fdf4' },
                              }}
                            >
                              {loadingId === `${submission.id}-approve` ? '...' : 'Approve'}
                            </Button>
                          </Stack>
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
