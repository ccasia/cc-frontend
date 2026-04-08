import dayjs from 'dayjs';
import { m } from 'framer-motion';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Tab,
  Chip,
  Tabs,
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

import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';

import BoxMotion from '../components/BoxMotion';
import useGetWhatsappMessage from '../hooks/use-get-messages';

const HEADERS = {
  inbound: ['FROM', 'MESSAGE', 'TYPE', 'SENT AT'],
  outbound: ['RECIPENT', 'STATUS', 'SENT AT'],
};

const STATUS_CONFIG = {
  read: { label: 'Read', color: 'success', icon: 'solar:check-read-linear' },
  delivered: { label: 'Delivered', color: 'info', icon: 'solar:check-read-linear' },
  sent: { label: 'Sent', color: 'warning', icon: 'hugeicons:sent-02' },
  failed: { label: 'Failed', color: 'error', icon: 'solar:close-circle-linear' },
};

const TableRowMotion = m(TableRow);

// eslint-disable-next-line react/prop-types
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
  const { inboundMessages, outboundMessages, isLoading, mutate } = useGetWhatsappMessage();
  const { socket } = useSocketContext();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState('inbound');

  const filtered = useMemo(() => {
    const messages = activeTab === 'inbound' ? inboundMessages : outboundMessages;
    const field = activeTab === 'inbound' ? 'from' : 'to';
    const query = search.toLowerCase();

    if (!query) return messages; // ✅ skip filter if search is empty

    return messages.filter((msg) => msg?.[field]?.toLowerCase().includes(query));
  }, [activeTab, inboundMessages, outboundMessages, search]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdateData = (newMessage) => {
      mutate(
        (current) => {
          const currentInbound = current?.message?.inbound ?? [];
          const currentOutbound = current?.message?.outbound ?? [];

          if (newMessage.direction === 'inbound') {
            return {
              ...current,
              message: {
                ...current?.message,
                inbound: [newMessage, ...currentInbound],
              },
            };
          }

          if (newMessage.direction === 'outbound') {
            const exists = currentOutbound.some((item) => item.messageId === newMessage.messageId);

            const updatedOutbound = exists
              ? currentOutbound.map(
                  (
                    item // ✅ update if exists
                  ) => (item.messageId === newMessage.messageId ? { ...item, ...newMessage } : item)
                )
              : [newMessage, ...currentOutbound]; // ✅ add if new

            return {
              ...current,
              message: {
                ...current?.message,
                outbound: updatedOutbound,
              },
            };
          }

          return current; // ✅ unknown direction — return unchanged
        },
        { revalidate: false }
      );
    };

    socket.on('whatsapp-message', handleUpdateData);

    // eslint-disable-next-line consistent-return
    return () => {
      socket.off('whatsapp-message', handleUpdateData);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  if (isLoading) return 'Loading...';

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
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ borderBottom: 1, borderBottomColor: colors.grey[200], px: 5 }}
        >
          <Tab value="inbound" label="Inbound Message" />
          <Tab value="outbound" label="Outbound Message" />
        </Tabs>

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
              {activeTab === 'outbound'
                ? 'All OTP messages sent through WhatsApp'
                : 'All messages received from users'}
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
                {HEADERS[activeTab].map((label, index) => (
                  <TableCell
                    key={index}
                    sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}
                  >
                    {label}
                  </TableCell>
                ))}
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
                  <TableRowMotion
                    key={msg.id}
                    hover
                    sx={{ '&:last-child td': { border: 0 } }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Iconify
                          icon="solar:phone-linear"
                          width={15}
                          sx={{ color: 'text.disabled', flexShrink: 0 }}
                        />
                        <Typography variant="body2">{msg?.from || msg?.to}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {msg?.message ?? msg?.status}
                      </Typography>
                    </TableCell>
                    {msg?.type && (
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {msg.type}
                        </Typography>
                      </TableCell>
                    )}

                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {dayjs(msg.createdAt).format('LL')}
                      </Typography>
                    </TableCell>
                  </TableRowMotion>
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
