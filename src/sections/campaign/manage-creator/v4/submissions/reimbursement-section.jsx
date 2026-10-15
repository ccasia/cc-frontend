/* eslint-disable no-nested-ternary */
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useDropzone } from 'react-dropzone';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Button,
  Dialog,
  Divider,
  TextField,
  ButtonBase,
  IconButton,
  Typography,
  InputAdornment,
} from '@mui/material';

import {
  sumReceipts,
  isPdfReceipt,
  RECEIPT_STATUS,
  formatReceiptAmount,
  getReimbursementSummaryStatus,
} from 'src/hooks/use-get-reimbursements';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FieldLabel from 'src/components/field-label';
import { ConfirmDialog } from 'src/components/custom-dialog';

import {
  FONTS,
  COLORS,
  WHITE_INPUT_SX,
  DIALOG_PAPER_SX,
  PRIMARY_BUTTON_SX,
  DIALOG_TITLE_PROPS,
  SECONDARY_BUTTON_SX,
} from 'src/sections/campaign/reimbursement/reimbursement-styles';

// ----------------------------------------------------------------------
// Dialog follows the admin Reimbursement Review / Send Agreement modals: grey paper,
// Instrument Serif title, FieldLabel + white inputs, 3D-lipped buttons.

const MAX_SIZE = 10 * 1024 * 1024;
// Same types the server accepts (it checks the real file bytes) — no SVG
const ACCEPT = {
  'image/jpeg': [],
  'image/png': [],
  'image/webp': [],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'application/pdf': [],
};
const INPUT_SX = { mt: 0.75, ...WHITE_INPUT_SX };

// mode: 'add' (new draft) | 'edit' (draft, file optional) | 'replace' (rejected, new file required)
function ReceiptFormDialog({ open, onClose, mode, receipt, agreementId, currency, onSaved }) {
  const [file, setFile] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setAmount(receipt ? String(receipt.amount) : '');
    setDescription(receipt?.description || '');
  }, [open, receipt]);

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    multiple: false,
  });

  const needsFile = mode !== 'edit';
  const parsedAmount = parseFloat(amount);
  const canSave =
    (!needsFile || file) && Number.isFinite(parsedAmount) && parsedAmount > 0 && description.trim();

  const handleSave = async () => {
    const formData = new FormData();
    formData.append(
      'data',
      JSON.stringify({ agreementId, amount: parsedAmount, description: description.trim() })
    );
    if (file) formData.append('receipt', file);

    try {
      setSaving(true);
      if (mode === 'add') {
        await axiosInstance.post(endpoints.reimbursement.root, formData);
      } else {
        await axiosInstance.put(endpoints.reimbursement.receipt(receipt.id), formData);
      }
      enqueueSnackbar(mode === 'replace' ? 'Receipt resubmitted for review' : 'Receipt saved');
      await onSaved();
      onClose();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to save receipt', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const currencyLabel = currency === 'MYR' ? 'RM' : currency;
  const title = mode === 'add' ? 'Add Receipt' : mode === 'edit' ? 'Edit Receipt' : 'Replace Receipt';

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: DIALOG_PAPER_SX }}
    >
      <Box position="relative">
        <IconButton
          sx={{ position: 'absolute', top: 20, right: 10, zIndex: 10 }}
          onClick={onClose}
          disabled={saving}
        >
          <Iconify icon="ci:close-md" width={20} />
        </IconButton>

        <Box sx={{ padding: '15px 30px', pr: 7 }}>
          <Typography {...DIALOG_TITLE_PROPS}>
            {title}
          </Typography>
        </Box>

        <Divider />

        <Stack spacing={2} sx={{ padding: '20px 30px' }}>
          {mode === 'replace' && receipt?.rejectionReason && (
            <Box sx={{ px: 1.5, py: 1, borderRadius: 1, bgcolor: `${COLORS.danger}12` }}>
              <Typography sx={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 600, color: COLORS.danger }}>
                Rejected by admin
              </Typography>
              <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.ink }}>
                {receipt.rejectionReason}
              </Typography>
            </Box>
          )}

          <Box>
            <FieldLabel hint="JPG, PNG, WebP, HEIC or PDF, up to 10MB">Receipt</FieldLabel>
            <Box
              {...getRootProps()}
              sx={{
                mt: 0.75,
                px: 2,
                py: 2.5,
                borderRadius: 1,
                cursor: 'pointer',
                textAlign: 'center',
                bgcolor: isDragActive ? COLORS.brandTint : COLORS.white,
                border: '1.5px dashed',
                borderColor: isDragActive ? COLORS.brand : file ? COLORS.success : COLORS.borderStrong,
                transition: 'border-color .15s ease, background-color .15s ease',
                '&:hover': { borderColor: COLORS.brand },
              }}
            >
              <input {...getInputProps()} />
              {file ? (
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                  <Iconify icon="solar:check-circle-bold" width={20} sx={{ color: COLORS.success, flexShrink: 0 }} />
                  <Typography noWrap sx={{ fontFamily: FONTS.body, fontSize: 14, fontWeight: 500 }}>
                    {file.name}
                  </Typography>
                </Stack>
              ) : (
                <>
                  <Iconify icon="solar:upload-minimalistic-linear" width={26} sx={{ color: COLORS.textMuted, mb: 0.5 }} />
                  <Typography sx={{ fontFamily: FONTS.body, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>
                    Drop your receipt or{' '}
                    <Box component="span" sx={{ color: COLORS.brand }}>
                      browse
                    </Box>
                  </Typography>
                  {mode === 'edit' && receipt && (
                    <Typography noWrap sx={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textMuted, mt: 0.25 }}>
                      Current: {receipt.fileName}
                    </Typography>
                  )}
                </>
              )}
            </Box>
            {!!fileRejections.length && (
              <Typography sx={{ mt: 0.75, fontFamily: FONTS.body, fontSize: 12, color: COLORS.danger }}>
                {fileRejections[0].errors[0]?.code === 'file-too-large'
                  ? 'File is larger than 10MB'
                  : 'Only JPG, PNG, WebP, HEIC or PDF files are allowed'}
              </Typography>
            )}
          </Box>

          <Box>
            <FieldLabel>Amount</FieldLabel>
            <TextField
              fullWidth
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              inputProps={{ min: 0, step: '0.01' }}
              InputProps={{
                startAdornment: <InputAdornment position="start">{currencyLabel}</InputAdornment>,
              }}
              sx={INPUT_SX}
            />
          </Box>

          <Box>
            <FieldLabel>Description</FieldLabel>
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Grab rides to and from the shoot location"
              sx={INPUT_SX}
            />
          </Box>
        </Stack>

        <Divider />

        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ px: '30px', py: 2.5 }}>
          <Button onClick={onClose} disabled={saving} sx={SECONDARY_BUTTON_SX}>
            Cancel
          </Button>
          <LoadingButton loading={saving} disabled={!canSave} onClick={handleSave} sx={PRIMARY_BUTTON_SX}>
            {mode === 'replace' ? 'Resubmit' : 'Save'}
          </LoadingButton>
        </Stack>
      </Box>
    </Dialog>
  );
}

ReceiptFormDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  mode: PropTypes.oneOf(['add', 'edit', 'replace']),
  receipt: PropTypes.object,
  agreementId: PropTypes.string,
  currency: PropTypes.string,
  onSaved: PropTypes.func,
};

// ----------------------------------------------------------------------

// Status pill: tinted background + readable text (the raw yellow is too light for text)
const STATUS_PILL = {
  DRAFT: { bg: COLORS.surfaceSubtle, color: COLORS.textSecondary },
  PENDING_REVIEW: { bg: COLORS.noteBg, color: COLORS.noteText },
  APPROVED: { bg: `${COLORS.success}1A`, color: '#0E8A47' },
  REJECTED: { bg: `${COLORS.danger}14`, color: COLORS.dangerText },
};

function StatusPill({ status, label }) {
  const pill = STATUS_PILL[status] || STATUS_PILL.DRAFT;
  return (
    <Box
      component="span"
      sx={{
        px: 1,
        py: 0.25,
        borderRadius: 10,
        fontFamily: FONTS.body,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        bgcolor: pill.bg,
        color: pill.color,
      }}
    >
      {label}
    </Box>
  );
}

StatusPill.propTypes = {
  status: PropTypes.string,
  label: PropTypes.string,
};

// Receipts tab layout: receipt list on the left, sticky summary (total, breakdown, submit) on the right.
// `title` is the round name when the creator has more than one round with receipts.
export default function ReimbursementSection({ reimbursement, campaign, title }) {
  const [formState, setFormState] = useState({ open: false, mode: 'add', receipt: null });
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const receipts = reimbursement?.receipts || [];
  const currency = reimbursement?.currency || 'MYR';
  const isSubmitted = Boolean(reimbursement?.submittedAt);
  // Locked once the receipts are on an invoice. The round's own invoice may already exist
  // (receipts required late) — then they're paid on a separate reimbursement invoice.
  const isLocked = Boolean(reimbursement?.billed);
  const paidSeparately = Boolean(reimbursement?.invoice || reimbursement?.reimbursementInvoice);
  const summaryStatus = getReimbursementSummaryStatus(reimbursement);
  // Same pill colours as the receipt rows, picked from the round-level status colour
  const summary = {
    label: summaryStatus.label,
    status:
      {
        [COLORS.success]: 'APPROVED',
        [COLORS.danger]: 'REJECTED',
        [COLORS.pending]: 'PENDING_REVIEW',
      }[summaryStatus.color] || 'DRAFT',
  };

  // Same key as useGetReimbursements(campaign.id) on the activity page
  const refresh = () => mutate(endpoints.reimbursement.list(campaign?.id));

  const openForm = (mode, receipt = null) => setFormState({ open: true, mode, receipt });

  const handleRemove = async (receipt) => {
    try {
      setRemovingId(receipt.id);
      await axiosInstance.delete(endpoints.reimbursement.receipt(receipt.id));
      await refresh();
      enqueueSnackbar('Receipt removed');
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to remove receipt', { variant: 'error' });
    } finally {
      setRemovingId(null);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await axiosInstance.post(endpoints.reimbursement.submit(reimbursement.agreementId));
      await refresh();
      enqueueSnackbar('Receipts submitted for review');
      setConfirmSubmit(false);
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to submit receipts', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const helperText = isLocked
    ? paidSeparately
      ? 'Your approved receipts were billed on a separate reimbursement invoice.'
      : 'Your approved receipts were added to your invoice.'
    : isSubmitted
      ? paidSeparately
        ? 'Submitted for review. Approved receipts are paid on a separate reimbursement invoice.'
        : 'Submitted for review. Each approved receipt is paid on the same invoice as your video.'
      : 'Add each receipt with its amount, then submit them all for review.';

  const canAdd = !isSubmitted && !isLocked;
  // What the creator stands to be paid — rejected receipts don't count
  const claimedTotal = sumReceipts(receipts.filter((receipt) => receipt.status !== 'REJECTED'));
  const breakdown = ['APPROVED', 'PENDING_REVIEW', 'REJECTED', 'DRAFT']
    .map((status) => {
      const items = receipts.filter((receipt) => receipt.status === status);
      return { status, count: items.length, amount: sumReceipts(items) };
    })
    .filter((row) => row.count > 0);

  // The invoice the receipts were billed on, once they are
  const billedInvoiceId = receipts.find((receipt) => receipt.invoiceId)?.invoiceId;
  const billedInvoice = [reimbursement?.invoice, reimbursement?.reimbursementInvoice].find(
    (invoice) => invoice && invoice.id === billedInvoiceId
  );

  const renderReceipt = (receipt, index) => {
    const status = RECEIPT_STATUS[receipt.status] || RECEIPT_STATUS.DRAFT;
    const canEditDraft = !isLocked && receipt.status === 'DRAFT';
    const canFixRejected = !isLocked && receipt.status === 'REJECTED';

    const isRejected = receipt.status === 'REJECTED';

    return (
      <Box
        key={receipt.id}
        sx={{
          p: 1.5,
          borderRadius: 1.5,
          bgcolor: COLORS.white,
          border: `1px solid ${isRejected ? `${COLORS.danger}40` : COLORS.border}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          {/* Thumbnail — opens the file */}
          <Box
            component="a"
            href={receipt.fileUrl}
            target="_blank"
            rel="noopener"
            sx={{
              width: 56,
              height: 56,
              flexShrink: 0,
              borderRadius: 1,
              overflow: 'hidden',
              bgcolor: COLORS.surfaceSubtle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity .15s ease',
              '&:hover': { opacity: 0.8 },
            }}
          >
            {isPdfReceipt(receipt) ? (
              <Stack alignItems="center" spacing={0.25}>
                <Iconify icon="solar:document-text-bold" width={22} sx={{ color: COLORS.danger }} />
                <Typography sx={{ fontFamily: FONTS.body, fontSize: 9, fontWeight: 700, color: COLORS.textMuted }}>
                  PDF
                </Typography>
              </Stack>
            ) : (
              <Box
                component="img"
                src={receipt.fileUrl}
                alt=""
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </Box>

          {/* Description wraps in full; receipt number + file name underneath */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{ fontFamily: FONTS.body, fontSize: 15, fontWeight: 600, color: COLORS.ink, wordBreak: 'break-word' }}
            >
              {receipt.description}
            </Typography>
            <Typography noWrap sx={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textMuted, mt: 0.25 }}>
              Receipt {index + 1} · {receipt.fileName}
            </Typography>
          </Box>

          <Stack alignItems="flex-end" spacing={0.75} sx={{ flexShrink: 0 }}>
            <Typography
              sx={{
                fontFamily: FONTS.body,
                fontSize: 15,
                fontWeight: 600,
                color: isRejected ? COLORS.textMuted : COLORS.ink,
                textDecoration: isRejected ? 'line-through' : 'none',
              }}
            >
              {formatReceiptAmount(receipt.amount, currency)}
            </Typography>
            <StatusPill status={receipt.status} label={status.label} />
          </Stack>

          {canEditDraft && (
            <Stack direction="row" sx={{ flexShrink: 0 }}>
              <IconButton size="small" onClick={() => openForm('edit', receipt)}>
                <Iconify icon="solar:pen-linear" width={18} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleRemove(receipt)}
                disabled={removingId === receipt.id}
              >
                <Iconify icon="solar:trash-bin-trash-linear" width={18} />
              </IconButton>
            </Stack>
          )}
        </Stack>

        {/* Rejection reason + fix actions, inside the same card */}
        {isRejected && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ sm: 'center' }}
            spacing={1.5}
            sx={{ mt: 1.5, px: 1.5, py: 1.25, borderRadius: 1, bgcolor: `${COLORS.danger}0D` }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 700, color: COLORS.dangerText }}>
                Rejected by admin
              </Typography>
              <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.ink, wordBreak: 'break-word' }}>
                {receipt.rejectionReason}
              </Typography>
            </Box>
            {canFixRejected && (
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Button
                  onClick={() => handleRemove(receipt)}
                  disabled={removingId === receipt.id}
                  sx={{ ...SECONDARY_BUTTON_SX, height: 36, minWidth: 0 }}
                >
                  Remove
                </Button>
                <Button onClick={() => openForm('replace', receipt)} sx={{ ...PRIMARY_BUTTON_SX, height: 36, minWidth: 0 }}>
                  Replace
                </Button>
              </Stack>
            )}
          </Stack>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 320px' },
        }}
      >
        {/* ---------------- Left: heading + receipts */}
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography sx={{ fontFamily: FONTS.serif, fontSize: 32, fontWeight: 400, lineHeight: 1.1, color: COLORS.ink }}>
              {title || 'Your receipts'}
            </Typography>
            {receipts.length > 0 && <StatusPill status={summary.status} label={summary.label} />}
          </Stack>
          <Typography sx={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.textSecondary, mt: 0.5, mb: 2.5 }}>
            {helperText}
          </Typography>

          {receipts.length > 0 ? (
            <Stack spacing={1.25}>
              {receipts.map(renderReceipt)}

              {canAdd && (
                <ButtonBase
                  onClick={() => openForm('add')}
                  sx={{
                    py: 1.75,
                    borderRadius: 1.5,
                    border: `1.5px dashed ${COLORS.borderStrong}`,
                    fontFamily: FONTS.body,
                    fontSize: 14,
                    fontWeight: 600,
                    color: COLORS.brand,
                    gap: 0.75,
                    transition: 'border-color .15s ease, background-color .15s ease',
                    '&:hover': { borderColor: COLORS.brand, bgcolor: COLORS.brandTint },
                  }}
                >
                  <Iconify icon="mingcute:add-line" width={18} />
                  Add another receipt
                </ButtonBase>
              )}
            </Stack>
          ) : (
            // Empty state — the whole tile opens the upload dialog
            <ButtonBase
              disabled={!canAdd}
              onClick={() => openForm('add')}
              sx={{
                width: '100%',
                py: 6,
                px: 3,
                borderRadius: 2,
                flexDirection: 'column',
                border: `1.5px dashed ${COLORS.borderStrong}`,
                bgcolor: COLORS.white,
                transition: 'border-color .15s ease, background-color .15s ease',
                '&:hover': { borderColor: COLORS.brand, bgcolor: COLORS.brandTint },
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  mb: 1.5,
                  borderRadius: '50%',
                  bgcolor: COLORS.brandTint,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="solar:bill-list-linear" width={28} sx={{ color: COLORS.brand }} />
              </Box>
              <Typography sx={{ fontFamily: FONTS.body, fontSize: 16, fontWeight: 600, color: COLORS.ink }}>
                Add your first receipt
              </Typography>
              <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, mt: 0.5 }}>
                A photo or PDF of each receipt, up to 10MB
              </Typography>
            </ButtonBase>
          )}
        </Box>

        {/* ---------------- Right: summary */}
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: COLORS.paper,
            position: { md: 'sticky' },
            top: { md: 24 },
          }}
        >
          <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary }}>
            Total claimed
          </Typography>
          <Typography sx={{ fontFamily: FONTS.serif, fontSize: 44, lineHeight: 1.1, color: COLORS.ink, mt: 0.5 }}>
            {formatReceiptAmount(claimedTotal, currency)}
          </Typography>
          <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, mt: 0.5 }}>
            {receipts.length} receipt{receipts.length === 1 ? '' : 's'}
          </Typography>

          {breakdown.length > 0 && (
            <>
              <Divider sx={{ my: 2, borderStyle: 'dashed', borderColor: COLORS.divider }} />
              <Stack spacing={1}>
                {breakdown.map((row) => (
                  <Stack key={row.status} direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        flexShrink: 0,
                        bgcolor: (RECEIPT_STATUS[row.status] || RECEIPT_STATUS.DRAFT).color,
                      }}
                    />
                    <Typography sx={{ flex: 1, fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary }}>
                      {(RECEIPT_STATUS[row.status] || RECEIPT_STATUS.DRAFT).label} ({row.count})
                    </Typography>
                    <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                      {formatReceiptAmount(row.amount, currency)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </>
          )}

          {billedInvoice && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mt: 2, px: 1.5, py: 1, borderRadius: 1, bgcolor: COLORS.white }}
            >
              <Iconify icon="solar:check-circle-bold" width={18} sx={{ color: COLORS.success, flexShrink: 0 }} />
              <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.ink }}>
                Billed on <b>{billedInvoice.invoiceNumber}</b>
              </Typography>
            </Stack>
          )}

          {canAdd && (
            <>
              <Button
                fullWidth
                disabled={!receipts.length}
                onClick={() => setConfirmSubmit(true)}
                sx={{ ...PRIMARY_BUTTON_SX, mt: 2.5 }}
              >
                {receipts.length
                  ? `Submit ${receipts.length} receipt${receipts.length > 1 ? 's' : ''}`
                  : 'Submit receipts'}
              </Button>
              <Typography sx={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textMuted, mt: 1, textAlign: 'center' }}>
                You can&apos;t add more receipts after submitting.
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <ReceiptFormDialog
        open={formState.open}
        mode={formState.mode}
        receipt={formState.receipt}
        onClose={() => setFormState((prev) => ({ ...prev, open: false }))}
        agreementId={reimbursement?.agreementId}
        currency={currency}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        title="Submit receipts?"
        content={`You're submitting ${receipts.length} receipt${
          receipts.length > 1 ? 's' : ''
        } totalling ${formatReceiptAmount(
          sumReceipts(receipts),
          currency
        )}. You won't be able to add more after this.`}
        action={
          <LoadingButton loading={submitting} onClick={handleSubmit} sx={{ ...PRIMARY_BUTTON_SX, height: 40 }}>
            Submit
          </LoadingButton>
        }
      />
    </Box>
  );
}

ReimbursementSection.propTypes = {
  reimbursement: PropTypes.object.isRequired,
  campaign: PropTypes.object,
  title: PropTypes.string,
};
