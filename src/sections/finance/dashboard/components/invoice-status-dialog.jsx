import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { PDFViewer } from '@react-pdf/renderer';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import useGetInvoiceById from 'src/hooks/use-get-invoice';

import { useGetFinanceInvoices } from 'src/api/finance';

import Iconify from 'src/components/iconify';

import { CARD_BORDER, formatAmount } from '../utils';
import InvoicePDF from '../../../invoice/invoice-pdf';
import { STATUS_COLORS } from '../../invoice-constants';

// ----------------------------------------------------------------------

const statusBadgeSx = {
  textTransform: 'uppercase',
  fontWeight: 700,
  display: 'inline-flex',
  px: 1.25,
  py: 0.375,
  fontSize: '0.6875rem',
  border: '1px solid',
  borderBottom: '3px solid',
  borderRadius: 0.8,
  bgcolor: 'common.white',
};

const STATUS_CONFIG = {
  draft: {
    title: 'Draft Invoices',
    summary: 'awaiting approval',
    empty: 'There are no draft invoices awaiting review',
    icon: 'mdi:file-document-edit-outline',
    color: '#4F46E5',
    background: '#EEF2FF',
    action: 'Approve',
    emptyTitle: 'Review queue is clear',
    emptyIcon: 'solar:document-add-bold-duotone',
    emptyAccentIcon: 'mdi:pencil-outline',
  },
  processing: {
    title: 'Processing Invoices',
    summary: 'currently processing',
    empty: 'There are no invoices being processed',
    icon: 'mdi:progress-clock',
    color: '#7C3AED',
    background: '#F5F3FF',
    action: 'Open invoice',
    emptyTitle: 'No invoices in progress',
    emptyIcon: 'solar:clock-circle-bold-duotone',
    emptyAccentIcon: 'mdi:progress-clock',
  },
  overdue: {
    title: 'Overdue Invoices',
    summary: 'past due date',
    empty: 'Every invoice is within its due date',
    icon: 'mdi:alert-circle-outline',
    color: '#DC2626',
    background: '#FEF2F2',
    action: 'Open invoice',
    emptyTitle: 'All caught up',
    emptyIcon: 'solar:calendar-mark-bold-duotone',
    emptyAccentIcon: 'mdi:alert-outline',
  },
};

// ----------------------------------------------------------------------

export default function InvoiceStatusDialog({
  open,
  onClose,
  status,
  count,
  startDate,
  endDate,
  periodLabel,
}) {
  const router = useRouter();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const config = STATUS_CONFIG[status];

  const { invoices, isLoading, error, mutate } = useGetFinanceInvoices({
    status,
    startDate,
    endDate,
    enabled: open,
  });
  const {
    invoice,
    isLoading: isInvoiceLoading,
    error: invoiceError,
  } = useGetInvoiceById(selectedInvoiceId);

  const handleClose = useCallback(() => {
    setSelectedInvoiceId(null);
    onClose();
  }, [onClose]);

  const handleOpenInvoice = useCallback(() => {
    handleClose();
    router.push(paths.dashboard.finance.invoice);
  }, [handleClose, router]);

  const displayedCount = isLoading || error ? count : invoices.length;
  const selectedInvoice = invoices.find((item) => item.id === selectedInvoiceId);
  const badgeColor = STATUS_COLORS[status];

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="xl"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            maxWidth: 1360,
            height: { xs: '82vh', sm: '88vh' },
            borderRadius: 2.5,
            maxHeight: '88vh',
            bgcolor: 'common.white',
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ px: { xs: 2, sm: 4 }, py: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1.5,
              bgcolor: config.background,
              color: config.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Iconify icon={config.icon} width={25} />
          </Box>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
              {config.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#637381', mt: 0.25 }}>
              {displayedCount} {config.summary}
            </Typography>
          </Box>

          <IconButton aria-label={`Close ${config.title.toLowerCase()}`} onClick={handleClose}>
            <Iconify icon="eva:close-fill" width={24} />
          </IconButton>
        </Stack>

        <Divider />

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: { xs: 2, sm: 4 } }}>
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {!isLoading && error && (
            <Stack alignItems="center" spacing={2} sx={{ py: 8, textAlign: 'center' }}>
              <Typography color="error">Failed to load {config.title.toLowerCase()}.</Typography>
              <Button variant="outlined" color="inherit" onClick={() => mutate()}>
                Retry
              </Button>
            </Stack>
          )}

          {!isLoading && !error && invoices.length === 0 && (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={2}
              sx={{ height: 1, minHeight: 360, py: 6, textAlign: 'center' }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: 152,
                  height: 132,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    width: 128,
                    height: 128,
                    borderRadius: '50%',
                    bgcolor: config.background,
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    right: 3,
                    top: 17,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    bgcolor: config.color,
                    opacity: 0.16,
                  },
                }}
              >
                <Iconify
                  icon={config.emptyIcon}
                  width={76}
                  sx={{ position: 'relative', color: config.color }}
                />
                <Iconify
                  icon={config.emptyAccentIcon}
                  width={34}
                  sx={{
                    position: 'absolute',
                    right: 22,
                    bottom: 10,
                    color: config.color,
                    bgcolor: 'common.white',
                    borderRadius: '50%',
                    p: 0.5,
                    boxShadow: '0 4px 12px rgba(33, 43, 54, 0.12)',
                  }}
                />
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {config.emptyTitle}
                </Typography>
                <Typography variant="body2" sx={{ color: '#637381', mt: 0.75 }}>
                  {config.empty}{' '}
                  <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {periodLabel}
                  </Box>
                  .
                </Typography>
              </Box>
            </Stack>
          )}

          {!isLoading && !error && invoices.length > 0 && (
            <Stack spacing={1.25}>
              {invoices.map((item) => (
                <Card
                  key={item.id}
                  variant="outlined"
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderColor: CARD_BORDER,
                    borderRadius: 1.5,
                    boxShadow: 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    '&:hover': {
                      borderColor: '#4F46E5',
                      boxShadow: '0 2px 8px rgba(79, 70, 229, 0.08)',
                    },
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {item.invoiceNumber}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ ...statusBadgeSx, color: badgeColor, borderColor: badgeColor }}
                        >
                          {status}
                        </Typography>
                      </Stack>

                      <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>
                        {item.campaignName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#637381', mt: 1 }}>
                        {item.adminName} ·{' '}
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </Typography>
                    </Box>

                    <Stack alignItems={{ xs: 'stretch', sm: 'flex-end' }} spacing={2} sx={{ flexShrink: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {item.currency} {formatAmount(item.amount)}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          color="inherit"
                          onClick={() => setSelectedInvoiceId(item.id)}
                          sx={{ borderColor: CARD_BORDER, borderRadius: 1, minWidth: 88 }}
                        >
                          View
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleOpenInvoice}
                          endIcon={<Iconify icon="eva:diagonal-arrow-right-up-fill" width={16} />}
                          sx={{
                            bgcolor: '#1340FF',
                            borderRadius: 1,
                            minWidth: 112,
                            '&:hover': { bgcolor: '#0C2AA6' },
                          }}
                        >
                          {config.action}
                        </Button>
                      </Stack>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="md"
        open={Boolean(selectedInvoiceId)}
        onClose={() => setSelectedInvoiceId(null)}
        PaperProps={{
          sx: {
            height: { xs: '82vh', sm: '78vh' },
            maxHeight: 820,
            borderRadius: 2.5,
            overflow: 'hidden',
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2, py: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.25,
              bgcolor: config.background,
              color: config.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Iconify icon={config.icon} width={21} />
          </Box>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {selectedInvoice?.invoiceNumber || 'Invoice preview'}
              </Typography>
              {selectedInvoice && (
                <Typography
                  variant="body2"
                  sx={{ ...statusBadgeSx, color: badgeColor, borderColor: badgeColor }}
                >
                  {status}
                </Typography>
              )}
            </Stack>
            {selectedInvoice && (
              <Typography variant="body2" sx={{ color: '#637381' }} noWrap>
                {selectedInvoice.campaignName} · {selectedInvoice.adminName} ·{' '}
                {formatDistanceToNow(new Date(selectedInvoice.createdAt), { addSuffix: true })}
              </Typography>
            )}
          </Box>

          {selectedInvoice && (
            <Typography variant="subtitle1" sx={{ fontWeight: 700, flexShrink: 0 }}>
              {selectedInvoice.currency} {formatAmount(selectedInvoice.amount)}
            </Typography>
          )}

          <IconButton aria-label="Close invoice preview" onClick={() => setSelectedInvoiceId(null)}>
            <Iconify icon="eva:close-fill" width={24} />
          </IconButton>
        </Stack>
        <Divider />

        <Box
          sx={{
            flexGrow: 1,
            minHeight: 0,
            overflow: 'hidden',
            px: { xs: 1, sm: 2 },
            pb: { xs: 1, sm: 2 },
          }}
        >
          {isInvoiceLoading && (
            <Box sx={{ height: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {!isInvoiceLoading && invoiceError && (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography color="error">Failed to load the invoice preview.</Typography>
            </Box>
          )}

          {!isInvoiceLoading && !invoiceError && invoice && (
            <Box sx={{ width: 1, height: 1, overflow: 'hidden', borderRadius: 1.5 }}>
              <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                <InvoicePDF invoice={invoice} currentStatus={invoice.status} />
              </PDFViewer>
            </Box>
          )}
        </Box>
      </Dialog>
    </>
  );
}

InvoiceStatusDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  status: PropTypes.oneOf(['draft', 'processing', 'overdue']).isRequired,
  count: PropTypes.number.isRequired,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  periodLabel: PropTypes.string.isRequired,
};
