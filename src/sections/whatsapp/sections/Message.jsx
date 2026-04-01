import React, { useState } from 'react';

import {
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  colors,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  InputAdornment,
  TableContainer,
  TablePagination,
} from '@mui/material';

import Iconify from 'src/components/iconify';

import BoxMotion from '../components/BoxMotion';

// Placeholder rows — replace with real API data
const MOCK_MESSAGES = [
  {
    id: 1,
    recipient: '+60 12-345 6789',
    template: 'otp_verification',
    status: 'read',
    sentAt: '2026-04-01 09:14',
  },
  {
    id: 2,
    recipient: '+60 19-876 5432',
    template: 'otp_verification',
    status: 'delivered',
    sentAt: '2026-04-01 08:50',
  },
  {
    id: 3,
    recipient: '+60 11-222 3344',
    template: 'otp_verification',
    status: 'sent',
    sentAt: '2026-03-31 22:30',
  },
  {
    id: 4,
    recipient: '+60 16-999 0011',
    template: 'otp_verification',
    status: 'failed',
    sentAt: '2026-03-31 20:05',
  },
];

const STATUS_CONFIG = {
  read: { label: 'Read', color: 'success', icon: 'solar:check-read-linear' },
  delivered: { label: 'Delivered', color: 'info', icon: 'solar:check-read-linear' },
  sent: { label: 'Sent', color: 'warning', icon: 'hugeicons:sent-02' },
  failed: { label: 'Failed', color: 'error', icon: 'solar:close-circle-linear' },
};

const StatusChip = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.sent;
  return (
    <Chip
      size="small"
      label={config.label}
      color={config.color}
      variant="soft"
      icon={<Iconify icon={config.icon} width={14} />}
      sx={{ fontWeight: 500, fontSize: '0.75rem' }}
    />
  );
};

const EmptyState = () => (
  <Stack alignItems="center" justifyContent="center" gap={1.5} sx={{ py: 8 }}>
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: 1.5,
        bgcolor: '#25D36615',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Iconify icon="hugeicons:sent-02" width={28} sx={{ color: '#25D366' }} />
    </Box>
    <Box textAlign="center">
      <Typography variant="subtitle2" fontWeight={600}>
        No messages yet
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Messages sent via WhatsApp OTP will appear here.
      </Typography>
    </Box>
  </Stack>
);

const Message = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = MOCK_MESSAGES.filter((msg) =>
    msg.recipient.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <BoxMotion
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      sx={{ mt: 2 }}
    >
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 1.5,
          border: `1px solid ${colors.grey[200]}`,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          gap={2}
          sx={{ p: 3 }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Message Logs
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              All OTP messages sent through WhatsApp
            </Typography>
          </Box>

          <TextField
            size="small"
            placeholder="Search by phone number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: '100%', sm: 260 } }}
            InputProps={{
              sx: { borderRadius: 1 },
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify
                    icon="solar:magnifer-linear"
                    width={16}
                    sx={{ color: 'text.disabled' }}
                  />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: colors.grey[50] }}>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>
                  RECIPIENT
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>
                  TEMPLATE
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>
                  STATUS
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>
                  SENT AT
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ border: 0 }}>
                    <EmptyState />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((msg) => (
                  <TableRow key={msg.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Iconify
                          icon="solar:phone-linear"
                          width={15}
                          sx={{ color: 'text.disabled', flexShrink: 0 }}
                        />
                        <Typography variant="body2">{msg.recipient}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {msg.template}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={msg.status} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {msg.sentAt}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {filtered.length > 0 && (
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        )}
      </Paper>
    </BoxMotion>
  );
};

export default Message;
