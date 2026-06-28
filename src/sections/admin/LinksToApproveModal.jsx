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

const BTN = {
  height: 34,
  borderRadius: '8px',
  px: '16px',
  py: '6px',
  fontSize: '0.72rem',
  fontWeight: 600,
  textTransform: 'uppercase',
};

export default function LinksToApproveModal({ open, onClose }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState(null);

  const { data, isLoading, mutate } = useSWR(
    open ? endpoints.dashboard.linksPending : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const submissions = Array.isArray(data) ? data : [];

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

  const totalPages = Math.ceil(submissions.length / PAGE_SIZE);
  const pagedIds = new Set(
    submissions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((s) => s.id)
  );

  const handleGoToCampaign = (campaignId) => {
    router.push(paths.dashboard.campaign.adminCampaignDetail(campaignId));
    onClose();
  };

  const handleAction = async (submission, action) => {
    const key = `${submission.id}-${action}`;
    setLoadingId(key);
    try {
      if (submission.campaign?.submissionVersion === 'v4') {
        await axiosInstance.post(endpoints.submission.admin.approvePostingLink, {
          submissionId: submission.id,
          action,
        });
      } else {
        await axiosInstance.patch(endpoints.submission.admin.posting, {
          submissionId: submission.id,
          status: action,
        });
      }
      mutate();
    } catch (e) {
      console.error(`Failed to ${action} posting link`, e);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '20px', p: 3, maxHeight: '85vh' },
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
            Links to approve
          </Typography>
          {!isLoading && (
            <Box sx={{ bgcolor: '#f3f4f6', borderRadius: '20px', px: 1.2, py: 0.3 }}>
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
            No links pending approval right now.
          </Typography>
        </Box>
      )}

      {!isLoading && grouped.length > 0 && (
        <Box sx={{ overflowY: 'auto', maxHeight: '60vh', pr: 0.5 }}>
          <Stack spacing={3}>
            {grouped.map(({ campaign, items }) => {
              const visibleItems = items.filter((s) => pagedIds.has(s.id));
              if (visibleItems.length === 0) return null;

              return (
                <Box key={campaign.id}>
                  {/* Campaign header */}
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
                          bgcolor: '#1ABF66',
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
                        sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase' }}
                      >
                        Go to campaign
                      </Typography>
                      <Iconify icon="mingcute:external-link-line" width={14} sx={{ color: '#374151' }} />
                    </Box>
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
                            sx={{ width: 40, height: 40, bgcolor: '#e5e7eb', fontSize: '0.9rem', flexShrink: 0 }}
                          >
                            {submission.user?.name?.charAt(0)?.toUpperCase()}
                          </Avatar>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>
                              {submission.user?.name || 'Unknown'}
                            </Typography>
                            {submission.content && (
                              <Typography
                                component="a"
                                href={submission.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                  fontSize: '0.73rem',
                                  color: '#1340FF',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '180px',
                                  display: 'block',
                                  textDecoration: 'none',
                                  '&:hover': { textDecoration: 'underline' },
                                }}
                              >
                                {submission.content}
                              </Typography>
                            )}
                            <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                              {dayjs(submission.updatedAt).fromNow()}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                            {/* Reject */}
                            <Button
                              size="small"
                              disabled={!!loadingId}
                              onClick={() => handleAction(submission, 'reject')}
                              sx={{
                                ...BTN,
                                border: '1px solid #D4321C',
                                bgcolor: '#FFFFFF',
                                boxShadow: '0px -3px 0px 0px #D4321C inset',
                                color: '#D4321C',
                                '&:hover': { bgcolor: '#fff5f5' },
                              }}
                            >
                              {loadingId === `${submission.id}-reject` ? '...' : 'Reject'}
                            </Button>

                            {/* Approve */}
                            <Button
                              size="small"
                              disabled={!!loadingId}
                              onClick={() => handleAction(submission, 'approve')}
                              sx={{
                                ...BTN,
                                border: '1px solid #1ABF66',
                                bgcolor: '#1ABF66',
                                boxShadow: '0px -3px 0px 0px #158f4d inset',
                                color: '#FFFFFF',
                                '&:hover': { bgcolor: '#18b05e' },
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
              sx={{ border: '1px solid #e5e7eb', borderRadius: '8px', width: 32, height: 32, '&:disabled': { opacity: 0.4 } }}
            >
              <Iconify icon="mingcute:left-line" width={16} />
            </IconButton>
            <IconButton
              size="small"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              sx={{ border: '1px solid #e5e7eb', borderRadius: '8px', width: 32, height: 32, '&:disabled': { opacity: 0.4 } }}
            >
              <Iconify icon="mingcute:right-line" width={16} />
            </IconButton>
          </Stack>
        </Stack>
      )}
    </Dialog>
  );
}
