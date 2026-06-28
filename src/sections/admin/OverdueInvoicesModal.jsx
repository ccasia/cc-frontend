import useSWR from 'swr';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Chip,
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

function overdueDays(dueDate) {
  return Math.max(0, dayjs().diff(dayjs(dueDate), 'day'));
}

export default function OverdueInvoicesModal({ open, onClose }) {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSWR(
    open ? endpoints.dashboard.overdueInvoices : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const invoices = Array.isArray(data) ? data : [];

  const grouped = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => {
      if (!map[inv.campaignId]) {
        map[inv.campaignId] = { campaign: inv.campaign, items: [] };
      }
      map[inv.campaignId].items.push(inv);
    });
    return Object.values(map);
  }, [invoices]);

  const totalPages = Math.ceil(invoices.length / PAGE_SIZE);
  const pagedIds = new Set(
    invoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((inv) => inv.id)
  );

  const handleGoToCampaign = (campaignId) => {
    router.push(paths.dashboard.campaign.adminCampaignDetail(campaignId));
    onClose();
  };

  const handleGoToInvoice = (invoiceId) => {
    router.push(paths.dashboard.finance.invoiceDetail(invoiceId));
    onClose();
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
            Overdue invoices
          </Typography>
          {!isLoading && (
            <Box sx={{ bgcolor: '#f3f4f6', borderRadius: '20px', px: 1.2, py: 0.3 }}>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#6b7280' }}>
                {invoices.length} total
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

      {!isLoading && invoices.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography sx={{ color: '#9ca3af', fontSize: '0.9rem' }}>
            No overdue invoices right now.
          </Typography>
        </Box>
      )}

      {!isLoading && grouped.length > 0 && (
        <Box sx={{ overflowY: 'auto', maxHeight: '60vh', pr: 0.5 }}>
          <Stack spacing={3}>
            {grouped.map(({ campaign, items }) => {
              const visibleItems = items.filter((inv) => pagedIds.has(inv.id));
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
                          bgcolor: '#9b1c1c',
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

                  {/* Invoice rows */}
                  <Stack spacing={1}>
                    {visibleItems.map((invoice) => {
                      const days = overdueDays(invoice.dueDate);
                      const creatorUser = invoice.creator?.user;

                      return (
                        <Box
                          key={invoice.id}
                          onClick={() => handleGoToInvoice(invoice.id)}
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
                              src={creatorUser?.photoURL}
                              sx={{ width: 40, height: 40, bgcolor: '#e5e7eb', fontSize: '0.9rem', flexShrink: 0 }}
                            >
                              {creatorUser?.name?.charAt(0)?.toUpperCase()}
                            </Avatar>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>
                                  {creatorUser?.name || 'Unknown'}
                                </Typography>
                                <Chip
                                  label={`${invoice.invoiceNumber} · MYR ${Number(invoice.amount).toLocaleString()}`}
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
                              </Stack>
                              <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                {dayjs(invoice.createdAt).fromNow()}
                              </Typography>
                            </Box>

                            <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                              <Box
                                sx={{
                                  border: '1px solid #dc2626',
                                  borderRadius: '20px',
                                  px: 1.2,
                                  py: 0.3,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: '#dc2626',
                                    flexShrink: 0,
                                  }}
                                />
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#dc2626' }}>
                                  {days}d overdue
                                </Typography>
                              </Box>
                              <Iconify
                                icon="mingcute:arrow-right-line"
                                width={20}
                                sx={{ color: '#9ca3af' }}
                              />
                            </Stack>
                          </Stack>
                        </Box>
                      );
                    })}
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
              onClick={(e) => { e.stopPropagation(); setPage((p) => p - 1); }}
              sx={{ border: '1px solid #e5e7eb', borderRadius: '8px', width: 32, height: 32, '&:disabled': { opacity: 0.4 } }}
            >
              <Iconify icon="mingcute:left-line" width={16} />
            </IconButton>
            <IconButton
              size="small"
              disabled={page === totalPages}
              onClick={(e) => { e.stopPropagation(); setPage((p) => p + 1); }}
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
