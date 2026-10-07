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

// Flat section in the video card's right column — same label style and white surfaces as
// the "Post Caption" field above it, so it reads as part of the card rather than a box in a box.
export default function ReimbursementSection({ reimbursement, campaign }) {
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
  const summary = getReimbursementSummaryStatus(reimbursement);

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

  const renderReceipt = (receipt, index) => {
    const status = RECEIPT_STATUS[receipt.status] || RECEIPT_STATUS.DRAFT;
    const canEditDraft = !isLocked && receipt.status === 'DRAFT';
    const canFixRejected = !isLocked && receipt.status === 'REJECTED';

    return (
      <Box key={receipt.id} sx={{ px: 1.25, py: 1, borderRadius: 1, bgcolor: COLORS.white }}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            component="a"
            href={receipt.fileUrl}
            target="_blank"
            rel="noopener"
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: 0.75,
              overflow: 'hidden',
              bgcolor: COLORS.surfaceSubtle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPdfReceipt(receipt) ? (
              <Iconify icon="solar:document-text-bold" width={18} sx={{ color: COLORS.danger }} />
            ) : (
              <Box
                component="img"
                src={receipt.fileUrl}
                alt=""
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>
              {receipt.description}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Typography sx={{ fontSize: 12, color: COLORS.textSecondary }}>
                {formatReceiptAmount(receipt.amount, currency)}
              </Typography>
              <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: COLORS.idle }} />
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: status.color }}>
                {status.label}
              </Typography>
            </Stack>
          </Box>

          {canEditDraft && (
            <Stack direction="row" sx={{ flexShrink: 0 }}>
              <IconButton size="small" onClick={() => openForm('edit', receipt)}>
                <Iconify icon="solar:pen-linear" width={16} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleRemove(receipt)}
                disabled={removingId === receipt.id}
              >
                <Iconify icon="solar:trash-bin-trash-linear" width={16} />
              </IconButton>
            </Stack>
          )}
        </Stack>

        {receipt.status === 'REJECTED' && (
          <Box sx={{ mt: 1, pl: 6 }}>
            <Typography sx={{ fontSize: 12, color: COLORS.dangerText }}>{receipt.rejectionReason}</Typography>
            {canFixRejected && (
              <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                <Typography
                  component="button"
                  onClick={() => openForm('replace', receipt)}
                  sx={{ p: 0, border: 0, bgcolor: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: COLORS.brand }}
                >
                  Replace
                </Typography>
                <Typography
                  component="button"
                  onClick={() => handleRemove(receipt)}
                  disabled={removingId === receipt.id}
                  sx={{ p: 0, border: 0, bgcolor: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: COLORS.textMuted }}
                >
                  Remove
                </Typography>
              </Stack>
            )}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ mb: 2 }}>
      {/* Label row — same style as "Post Caption" */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="body2" fontWeight="bold" color={COLORS.textSecondary}>
          Reimbursement Receipts
        </Typography>
        {receipts.length > 0 && (
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: summary.color }} />
            <Typography variant="caption" fontWeight={600} sx={{ color: summary.color }}>
              {summary.label}
            </Typography>
          </Stack>
        )}
      </Stack>
      <Typography variant="caption" color={COLORS.textMuted} display="block" sx={{ mt: 0.25, mb: 1 }}>
        {helperText}
      </Typography>

      {receipts.length > 0 && (
        <Stack spacing={0.75}>
          {receipts.map(renderReceipt)}
          {receipts.length > 1 && (
            <Stack direction="row" justifyContent="space-between" sx={{ px: 0.5, pt: 0.25 }}>
              <Typography variant="caption" color={COLORS.textSecondary}>
                Total
              </Typography>
              <Typography variant="caption" fontWeight={700}>
                {formatReceiptAmount(sumReceipts(receipts), currency)}
              </Typography>
            </Stack>
          )}
        </Stack>
      )}

      {!isSubmitted && !isLocked && (
        <Stack direction="row" spacing={1} sx={{ mt: receipts.length ? 1.25 : 0 }}>
          <Button
            fullWidth
            startIcon={<Iconify icon="mingcute:add-line" width={16} />}
            onClick={() => openForm('add')}
            sx={{ ...SECONDARY_BUTTON_SX, height: 40 }}
          >
            Add Receipt
          </Button>
          <Button
            fullWidth
            disabled={!receipts.length}
            onClick={() => setConfirmSubmit(true)}
            sx={{ ...PRIMARY_BUTTON_SX, height: 40 }}
          >
            Submit{receipts.length ? ` (${receipts.length})` : ''}
          </Button>
        </Stack>
      )}

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
};
