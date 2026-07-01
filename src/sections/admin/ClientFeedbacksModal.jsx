import useSWR from 'swr';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Chip,
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

import { fetcher, endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

dayjs.extend(relativeTime);

const PAGE_SIZE = 3;

const TYPE_LABEL = {
  FIRST_DRAFT: 'First Draft',
  FINAL_DRAFT: 'Final Draft',
  POSTING: 'Posting Link',
  VIDEO: 'Video',
  PHOTO: 'Photo',
  RAW_FOOTAGE: 'Raw Footage',
};

export default function ClientFeedbacksModal({ open, onClose }) {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSWR(
    open ? endpoints.dashboard.clientFeedbacks : null,
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

  const totalPages = Math.ceil(grouped.length / PAGE_SIZE);
  const pagedGroups = grouped.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleGoToCampaign = (campaignId) => {
    router.push(paths.dashboard.campaign.adminCampaignDetail(campaignId));
    onClose();
  };

  const handleViewFeedback = (submission) => {
    const creatorName = encodeURIComponent(submission.user?.name || '');
    router.push(
      `${paths.dashboard.campaign.adminCampaignDetail(submission.campaignId)}?tab=submissions-v4&creator=${creatorName}`
    );
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '20px', p: 3, maxHeight: '85vh', display: 'flex', flexDirection: 'column' },
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
            Client feedbacks
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
            No client feedbacks right now.
          </Typography>
        </Box>
      )}

      {!isLoading && grouped.length > 0 && (
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, pr: 0.5 }}>
          <Stack spacing={3}>
            {pagedGroups.map(({ campaign, items }) => (
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
                          bgcolor: '#ef4444',
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
                        border: '1px solid #3A3A3C',
                        bgcolor: '#3A3A3C',
                        boxShadow: '0px -3px 0px 0px #00000073 inset',
                        px: '16px',
                        py: '6px',
                        gap: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#FFFFFF',
                        textTransform: 'uppercase',
                        '&:hover': { bgcolor: '#2a2a2c' },
                      }}
                    >
                      Go to campaign
                    </Button>
                  </Stack>

                  {/* Submission rows */}
                  <Stack spacing={1}>
                    {items.map((submission) => (
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
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>
                                {submission.user?.name || 'Unknown'}
                              </Typography>
                              {submission.submissionType?.type && (
                                <Chip
                                  label={TYPE_LABEL[submission.submissionType.type] || submission.submissionType.type}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.68rem',
                                    fontWeight: 500,
                                    bgcolor: '#f3f4f6',
                                    color: '#374151',
                                    borderRadius: '6px',
                                  }}
                                />
                              )}
                            </Stack>
                            <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                              {dayjs(submission.updatedAt).fromNow()}
                            </Typography>
                          </Box>

                          <Button
                            size="small"
                            onClick={() => handleViewFeedback(submission)}
                            sx={{
                              height: 34,
                              borderRadius: '8px',
                              border: '1px solid #eb4a26',
                              bgcolor: '#eb4a26',
                              boxShadow: '0px -3px 0px 0px #c23a1d inset',
                              px: '16px',
                              py: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: '#FFFFFF',
                              textTransform: 'uppercase',
                              flexShrink: 0,
                              '&:hover': { bgcolor: '#d94420' },
                            }}
                          >
                            View Feedback
                          </Button>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                  <Divider sx={{ mt: 2 }} />
                </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Pagination */}
      {submissions.length > 0 && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2.5 }}>
          <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            Page {page} of {totalPages || 1}
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
              disabled={page >= (totalPages || 1)}
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
