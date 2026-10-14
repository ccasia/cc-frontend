import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { Page, pdfjs, Document } from 'react-pdf';
import { useMemo, useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Button,
  Drawer,
  Divider,
  TextField,
  IconButton,
  Typography,
  ButtonBase,
  CircularProgress,
} from '@mui/material';

import { sumReceipts, isPdfReceipt, formatReceiptAmount } from 'src/hooks/use-get-reimbursements';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

import {
  FONTS,
  COLORS,
  WHITE_INPUT_SX,
  DANGER_BUTTON_SX,
  PRIMARY_BUTTON_SX,
  SECONDARY_BUTTON_SX,
} from './reimbursement-styles';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// ----------------------------------------------------------------------
// Admin receipt review for one creator's agreement round, opened from the campaign Invoices tab.

const DRAWER_WIDTH = 440;

const STATUS = {
  DRAFT: { label: 'Draft', color: COLORS.textMuted },
  PENDING_REVIEW: { label: 'To review', color: COLORS.noteIcon, bg: COLORS.noteBg },
  APPROVED: { label: 'Approved', color: COLORS.success },
  REJECTED: { label: 'Rejected', color: COLORS.danger },
};

const formatDate = (value) => (value ? dayjs(value).format('D MMM YYYY') : '—');

const StatusTag = ({ status }) => {
  const config = STATUS[status] || STATUS.PENDING_REVIEW;
  return (
    <Typography
      variant="caption"
      sx={{
        px: 1,
        py: 0.25,
        borderRadius: 0.75,
        fontWeight: 600,
        color: config.color,
        bgcolor: config.bg || `${config.color}14`,
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </Typography>
  );
};

StatusTag.propTypes = { status: PropTypes.string };

const Field = ({ label, children }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography sx={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textMuted }}>{label}</Typography>
    <Box sx={{ mt: 0.25 }}>{children}</Box>
  </Box>
);

Field.propTypes = { label: PropTypes.string, children: PropTypes.node };

// ----------------------------------------------------------------------

export default function ReceiptReviewDrawer({ open, onClose, round, campaignId, isDisabled }) {
  const receipts = useMemo(() => round?.receipts || [], [round]);
  const currency = round?.currency || 'MYR';

  const [receiptId, setReceiptId] = useState(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [financeNote, setFinanceNote] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);
  const [pdfPages, setPdfPages] = useState(0);

  // Open on the first receipt that still needs a decision
  useEffect(() => {
    if (!open) return;
    const firstPending = receipts.find((item) => item.status === 'PENDING_REVIEW') || receipts[0];
    setReceiptId(firstPending?.id || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, round?.agreementId]);

  const index = Math.max(
    0,
    receipts.findIndex((item) => item.id === receiptId)
  );
  const receipt = receipts[index];

  // Reset per-receipt form state when switching receipts
  useEffect(() => {
    setRejectMode(false);
    setRejectReason('');
    setFinanceNote(receipt?.financeNote || '');
    setNoteOpen(Boolean(receipt?.financeNote));
    setPdfPages(0);
  }, [receipt?.id, receipt?.financeNote]);

  const isPending = receipt?.status === 'PENDING_REVIEW';
  const canReview = isPending && !isDisabled && !round?.billed;
  const isPdf = receipt ? isPdfReceipt(receipt) : false;

  // Reimbursement = what the creator stands to be paid: approved + still pending (not rejected)
  const claimedReceipts = receipts.filter((item) => item.status === 'APPROVED' || item.status === 'PENDING_REVIEW');
  const reimbursementTotal = sumReceipts(claimedReceipts);
  // Late receipts (required after the fee invoice existed) go on a separate receipts-only invoice;
  // receipts billed onto the fee invoice itself aren't separate
  const onFeeInvoice = receipts.some((item) => item.invoiceId && item.invoiceId === round?.invoice?.id);
  const billedSeparately = Boolean(round?.invoice) && !onFeeInvoice;

  const handleReview = async (action) => {
    if (action === 'reject' && !rejectReason.trim()) {
      enqueueSnackbar('Please add a reason for rejecting', { variant: 'warning' });
      return;
    }

    try {
      setLoadingAction(action);
      const res = await axiosInstance.patch(endpoints.reimbursement.review(receipt.id), {
        action,
        reason: action === 'reject' ? rejectReason.trim() : undefined,
        financeNote,
      });
      // Same key as the Invoices tab's campaign-wide useGetReimbursements(campaignId)
      await mutate(endpoints.reimbursement.list(campaignId));
      enqueueSnackbar(res?.data?.message);

      const nextPending = receipts.find((item) => item.status === 'PENDING_REVIEW' && item.id !== receipt.id);
      if (nextPending) setReceiptId(nextPending.id);
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to review receipt', { variant: 'error' });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: DRAWER_WIDTH }, bgcolor: COLORS.white } }}
    >
      {round && receipt && (
        <Stack sx={{ height: '100%' }}>
          {/* Header */}
          <Stack direction="row" alignItems="flex-start" sx={{ px: 3, pt: 3, pb: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                noWrap
                sx={{ fontFamily: FONTS.serif, fontSize: 30, fontWeight: 400, lineHeight: 1.15, color: COLORS.ink }}
              >
                {round.user?.name || 'Creator'}
              </Typography>
              <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted }}>
                {round.invoice?.invoiceNumber || 'Invoice on hold until receipts are approved'}
              </Typography>
            </Box>
            <IconButton onClick={onClose} sx={{ mt: -0.5, mr: -1 }}>
              <Iconify icon="ci:close-md" width={20} />
            </IconButton>
          </Stack>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>
            {/* Receipt n of N */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography
                sx={{
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: COLORS.textSecondary,
                }}
              >
                Receipt {index + 1} of {receipts.length}
              </Typography>
              <StatusTag status={receipt.status} />
            </Stack>

            {/* Preview */}
            <Box
              sx={{
                position: 'relative',
                height: 300,
                borderRadius: 1.5,
                bgcolor: COLORS.surfaceHover,
                overflow: 'hidden',
                display: 'flex',
                alignItems: isPdf ? 'flex-start' : 'center',
                justifyContent: 'center',
              }}
            >
              <IconButton
                size="small"
                component="a"
                href={receipt.fileUrl}
                target="_blank"
                rel="noopener"
                sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, bgcolor: COLORS.white, '&:hover': { bgcolor: COLORS.white } }}
              >
                <Iconify icon="eva:external-link-outline" width={16} />
              </IconButton>

              {isPdf ? (
                <Box sx={{ overflowY: 'auto', height: '100%', width: '100%', display: 'flex', justifyContent: 'center', pt: 2 }}>
                  <Document
                    file={receipt.fileUrl}
                    onLoadSuccess={({ numPages }) => setPdfPages(numPages)}
                    loading={<CircularProgress size={24} sx={{ mt: 12, color: COLORS.brand }} />}
                  >
                    {Array.from({ length: pdfPages }, (_, pageIndex) => (
                      <Box key={pageIndex} sx={{ mb: 1.5, boxShadow: 1 }}>
                        <Page pageNumber={pageIndex + 1} width={DRAWER_WIDTH - 96} renderTextLayer={false} />
                      </Box>
                    ))}
                  </Document>
                </Box>
              ) : (
                <Box
                  component="img"
                  src={receipt.fileUrl}
                  alt={receipt.fileName}
                  sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              )}
            </Box>

            {/* Details */}
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Field label="Amount">
                <Typography sx={{ fontFamily: FONTS.body, fontSize: 20, fontWeight: 700, color: COLORS.ink }}>
                  {formatReceiptAmount(receipt.amount, currency)}
                </Typography>
              </Field>
              <Field label="Submitted">
                <Typography sx={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.ink, pt: 0.5 }}>
                  {formatDate(receipt.submittedAt)}
                </Typography>
              </Field>
            </Stack>

            <Box sx={{ mt: 1.5 }}>
              <Field label="Description">
                <Typography
                  sx={{
                    fontFamily: FONTS.body,
                    fontSize: 14,
                    color: COLORS.ink,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {receipt.description}
                </Typography>
              </Field>
            </Box>

            {receipt.status === 'REJECTED' && receipt.rejectionReason && (
              <Box sx={{ mt: 1.5, px: 1.5, py: 1, borderRadius: 1, bgcolor: `${COLORS.danger}12` }}>
                <Typography sx={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 600, color: COLORS.danger }}>
                  Rejected
                </Typography>
                <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.ink }}>
                  {receipt.rejectionReason}
                </Typography>
              </Box>
            )}

            {/* Actions */}
            {canReview && (
              <Box sx={{ mt: 2.5 }}>
                {rejectMode ? (
                  <Stack spacing={1}>
                    <TextField
                      autoFocus
                      size="small"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejecting (sent to the creator)"
                      sx={WHITE_INPUT_SX}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        fullWidth
                        onClick={() => setRejectMode(false)}
                        disabled={!!loadingAction}
                        sx={SECONDARY_BUTTON_SX}
                      >
                        Cancel
                      </Button>
                      <LoadingButton
                        fullWidth
                        loading={loadingAction === 'reject'}
                        onClick={() => handleReview('reject')}
                        sx={DANGER_BUTTON_SX}
                      >
                        Confirm reject
                      </LoadingButton>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <Button
                      fullWidth
                      onClick={() => setRejectMode(true)}
                      disabled={!!loadingAction}
                      sx={{ ...SECONDARY_BUTTON_SX, color: COLORS.danger }}
                    >
                      Reject
                    </Button>
                    <LoadingButton
                      fullWidth
                      loading={loadingAction === 'approve'}
                      onClick={() => handleReview('approve')}
                      sx={PRIMARY_BUTTON_SX}
                    >
                      Approve
                    </LoadingButton>
                  </Stack>
                )}

                {/* Optional internal note, collapsed until needed */}
                {noteOpen ? (
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={3}
                    value={financeNote}
                    onChange={(e) => setFinanceNote(e.target.value)}
                    placeholder="Note to Finance (internal)"
                    sx={{ mt: 1.5, ...WHITE_INPUT_SX }}
                  />
                ) : (
                  <ButtonBase
                    onClick={() => setNoteOpen(true)}
                    sx={{ mt: 1.5, fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.brand }}
                  >
                    + Add note to Finance
                  </ButtonBase>
                )}
              </Box>
            )}

            {/* All receipts in this round, in order — the one being viewed is highlighted */}
            {receipts.length > 1 && (
              <>
                <Divider sx={{ my: 2.5 }} />
                <Stack spacing={0.5}>
                  {receipts.map((item, itemIndex) => {
                    const isCurrent = item.id === receipt.id;
                    return (
                      <ButtonBase
                        key={item.id}
                        onClick={() => setReceiptId(item.id)}
                        sx={{
                          py: 1,
                          px: 1,
                          mx: -1,
                          borderRadius: 1,
                          justifyContent: 'space-between',
                          bgcolor: isCurrent ? COLORS.surfaceHover : 'transparent',
                          '&:hover': { bgcolor: COLORS.surfaceHover },
                        }}
                      >
                        <Typography sx={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.ink }}>
                          <Box component="span" sx={{ fontWeight: 600 }}>
                            Receipt {itemIndex + 1}
                          </Box>{' '}
                          · {formatReceiptAmount(item.amount, currency)}
                        </Typography>
                        <StatusTag status={item.status} />
                      </ButtonBase>
                    );
                  })}
                </Stack>
              </>
            )}

            {/* Totals */}
            <Divider sx={{ my: 2.5 }} />
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontFamily: FONTS.body, fontSize: 18, fontWeight: 700, color: COLORS.ink }}>
                  Total reimbursement
                </Typography>
                <Typography sx={{ fontFamily: FONTS.body, fontSize: 18, fontWeight: 700, color: COLORS.ink }}>
                  {formatReceiptAmount(reimbursementTotal, currency)}
                </Typography>
              </Stack>
              {billedSeparately && (
                <Typography sx={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textMuted }}>
                  Approved receipts are billed on a separate receipts-only invoice.
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      )}
    </Drawer>
  );
}

ReceiptReviewDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  // One entry from useGetReimbursements(campaignId)
  round: PropTypes.object,
  campaignId: PropTypes.string,
  isDisabled: PropTypes.bool,
};
