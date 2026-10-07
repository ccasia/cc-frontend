import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { keyframes } from '@emotion/react';
import { enqueueSnackbar } from 'notistack';
import { Page, pdfjs, Document } from 'react-pdf';
import { useMemo, useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Avatar,
  Button,
  Dialog,
  Divider,
  Tooltip,
  TextField,
  IconButton,
  Typography,
  ButtonBase,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';

import {
  sumReceipts,
  isPdfReceipt,
  PENDING_COLOR,
  RECEIPT_STATUS,
  formatReceiptAmount,
} from 'src/hooks/use-get-reimbursements';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FieldLabel from 'src/components/field-label';

import {
  FONTS,
  COLORS,
  WHITE_INPUT_SX,
  DIALOG_PAPER_SX,
  DANGER_BUTTON_SX,
  PRIMARY_BUTTON_SX,
  SECONDARY_BUTTON_SX,
} from 'src/sections/campaign/reimbursement/reimbursement-styles';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// Descriptions longer than this (≈4 lines in the details column) get a "Show more" toggle
const LONG_DESCRIPTION = 140;

const formatDateTime = (value) => (value ? dayjs(value).format('D MMM YYYY, h:mm A') : '—');

const StatusChip = ({ status }) => {
  const config = RECEIPT_STATUS[status] || RECEIPT_STATUS.PENDING_REVIEW;

  // Same outlined + bottom-lip chip as the Agreements table status column
  return (
    <Typography
      variant="caption"
      sx={{
        px: 1,
        py: 0.5,
        fontWeight: 600,
        borderRadius: 0.8,
        bgcolor: 'white',
        whiteSpace: 'nowrap',
        color: config.color,
        border: `1px solid ${config.color}`,
        borderBottom: `3px solid ${config.color}`,
      }}
    >
      {config.label.toUpperCase()}
    </Typography>
  );
};

StatusChip.propTypes = { status: PropTypes.string };

// ---------------------------------------------------------------- activity stepper

const DONE_COLOR = COLORS.success;
const REJECTED_COLOR = COLORS.danger;
const IDLE_COLOR = COLORS.idle;

// Dashes slide right by exactly one period (12px) per loop, so the motion is seamless.
const DASH_PERIOD = 12;
const flowRight = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(${DASH_PERIOD}px); }
`;

// Line between two steps: solid when the next step is reached, animated "flowing" dashes when
// the next step is in progress, grey when it hasn't started.
const StepConnector = ({ variant }) => (
  <Box
    sx={{
      position: 'relative',
      flex: 1,
      height: 2,
      mx: 0.75,
      borderRadius: 1,
      overflow: 'hidden',
      bgcolor: {
        done: DONE_COLOR,
        flowing: `${PENDING_COLOR}2E`, 
        idle: COLORS.border,
      }[variant],
    }}
  >
    {variant === 'flowing' && (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: -DASH_PERIOD,
          right: 0,
          backgroundImage: `repeating-linear-gradient(90deg, ${PENDING_COLOR} 0 6px, transparent 6px ${DASH_PERIOD}px)`,
          animation: `${flowRight} 0.8s linear infinite`,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      />
    )}
  </Box>
);

StepConnector.propTypes = { variant: PropTypes.oneOf(['done', 'flowing', 'idle']) };

// state: done | active | rejected | idle
const STEP_DOT = {
  done: { bgcolor: DONE_COLOR },
  active: { bgcolor: PENDING_COLOR },
  rejected: { bgcolor: REJECTED_COLOR },
  idle: { bgcolor: 'transparent', border: `2px solid ${IDLE_COLOR}` },
};

const ActivityStepper = ({ steps }) => (
  <Stack direction="row" alignItems="center">
    {steps.map((step, stepIndex) => {
      const next = steps[stepIndex + 1];
      let connector = null;
      if (next) {
        if (next.state === 'active') connector = 'flowing';
        else if (next.state === 'done' || next.state === 'rejected') connector = 'done';
        else connector = 'idle';
      }

      return (
        <Stack
          key={step.key}
          direction="row"
          alignItems="center"
          sx={{ flex: next ? 1 : '0 0 auto', minWidth: 0 }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              flexShrink: 0,
              boxSizing: 'border-box',
              ...STEP_DOT[step.state],
            }}
          />
          <Typography
            noWrap
            sx={{
              ml: 0.75,
              flexShrink: 0,
              fontFamily: FONTS.body,
              fontSize: 13,
              fontWeight: 600,
              color: step.state === 'idle' ? COLORS.textMuted : COLORS.ink,
            }}
          >
            {step.label}
          </Typography>
          {connector && (
            <Box sx={{ flex: 1, mx: 1.25, display: 'flex' }}>
              <StepConnector variant={connector} />
            </Box>
          )}
        </Stack>
      );
    })}
  </Stack>
);

ActivityStepper.propTypes = { steps: PropTypes.array.isRequired };

const formatShortDateTime = (value) => (value ? dayjs(value).format('D MMM, h:mm A') : '—');

// Submitted Review Finance, derived from the receipt and whether the round is invoiced.
const getActivitySteps = (receipt, isInvoiced) => {
  const review = {
    APPROVED: { label: 'Approved', state: 'done' },
    REJECTED: { label: 'Rejected', state: 'rejected' },
  }[receipt.status] || { label: 'In review', state: 'active' };

  let financeState = 'idle';
  if (isInvoiced) financeState = 'done';
  else if (receipt.status === 'APPROVED') financeState = 'active'; // waiting on the video

  return [
    { key: 'submitted', label: 'Submitted', state: 'done' },
    { key: 'review', ...review },
    { key: 'finance', label: 'Finance', state: financeState },
  ];
};

// ----------------------------------------------------------------------

export default function ReimbursementReviewModal({
  open,
  onClose,
  reimbursement,
  creator,
  campaign,
  isDisabled,
}) {
  const smUp = useMediaQuery((theme) => theme.breakpoints.up('sm'));

  const receipts = useMemo(() => reimbursement?.receipts || [], [reimbursement]);
  const currency = reimbursement?.currency || 'MYR';

  const [index, setIndex] = useState(0);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [financeNote, setFinanceNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false); // note box collapses behind "+ Add note"
  const [descExpanded, setDescExpanded] = useState(false); // long description "Show more"
  const [loadingAction, setLoadingAction] = useState(null);
  const [pdfPages, setPdfPages] = useState(0);
  const [imageStatus, setImageStatus] = useState('loading');

  const [previewEl, setPreviewEl] = useState(null);
  const [previewWidth, setPreviewWidth] = useState(0);

  useEffect(() => {
    if (!previewEl) return undefined;
    const observer = new ResizeObserver(([entry]) => setPreviewWidth(entry.contentRect.width));
    observer.observe(previewEl);
    return () => observer.disconnect();
  }, [previewEl]);

  const receipt = receipts[index];

  // Land on the first receipt that still needs a decision.
  useEffect(() => {
    if (!open) return;
    const firstPending = receipts.findIndex((item) => item.status === 'PENDING_REVIEW');
    setIndex(firstPending >= 0 ? firstPending : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset per-receipt form state whenever the admin pages to another receipt.
  useEffect(() => {
    setRejectMode(false);
    setRejectReason('');
    setFinanceNote(receipt?.financeNote || '');
    setNoteOpen(Boolean(receipt?.financeNote));
    setDescExpanded(false);
    setPdfPages(0);
    setImageStatus('loading');
  }, [receipt?.id, receipt?.financeNote]);

  if (!receipt) return null;

  const pendingCount = receipts.filter((item) => item.status === 'PENDING_REVIEW').length;
  const approvedCount = receipts.filter((item) => item.status === 'APPROVED').length;
  const isPending = receipt.status === 'PENDING_REVIEW';
  const isLastPending = isPending && pendingCount === 1;
  // An existing round invoice doesn't block review (late receipts); billed receipts do
  const canReview = isPending && !isDisabled && !reimbursement?.billed;
  const isPdf = isPdfReceipt(receipt);

  const goTo = (nextIndex) => setIndex((nextIndex + receipts.length) % receipts.length);

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

      // Same key the accordion's useGetReimbursements uses, so every view refreshes.
      await mutate(endpoints.reimbursement.list(campaign?.id, creator?.userId));
      enqueueSnackbar(res?.data?.message);

      const nextPending = receipts.findIndex(
        (item) => item.status === 'PENDING_REVIEW' && item.id !== receipt.id
      );
      if (nextPending >= 0) setIndex(nextPending);
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to review receipt', { variant: 'error' });
    } finally {
      setLoadingAction(null);
    }
  };

  const creatorName = creator?.user?.name || 'Creator';
  const creatorEmail = creator?.user?.email?.endsWith('@tempmail.com') ? '' : creator?.user?.email;

  // ---------------------------------------------------------------- header

  const renderHeader = (
    <>
      <IconButton
        sx={{ position: 'absolute', top: 20, right: 10, zIndex: 10 }}
        onClick={onClose}
      >
        <Iconify icon="ci:close-md" width={20} />
      </IconButton>

      <Box sx={{ padding: '15px 30px', pr: 7 }}>
        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1.5}>
          <Typography
            fontFamily={FONTS.serif}
            fontSize="30px"
            fontWeight={500}
            letterSpacing={-0.5}
          >
            Reimbursement Review
          </Typography>
          <StatusChip status={receipt.status} />
        </Stack>
        <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted }}>
          {receipt.reference}
          {receipts.length > 1 && ` · ${approvedCount} of ${receipts.length} approved`}
        </Typography>
      </Box>

      <Divider sx={{ mb: 0 }} />
    </>
  );

  // ---------------------------------------------------------------- preview (left)

  const pdfPageWidth = Math.min(Math.max(previewWidth - 48, 240), 560);

  const renderLoading = (
    <Stack alignItems="center" spacing={1.5} sx={{ m: 'auto', color: COLORS.textMuted }}>
      <CircularProgress size={28} thickness={4} sx={{ color: COLORS.brand }} />
      <Typography sx={{ fontFamily: FONTS.body, fontSize: 13 }}>Loading receipt…</Typography>
    </Stack>
  );

  const renderLoadError = (
    <Stack alignItems="center" spacing={1} sx={{ m: 'auto', textAlign: 'center', px: 3 }}>
      <Iconify icon="solar:document-text-broken" width={36} sx={{ color: COLORS.disabled }} />
      <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary }}>
        Couldn&apos;t preview this file.
      </Typography>
      <Button
        size="small"
        href={receipt.fileUrl}
        target="_blank"
        rel="noopener"
        sx={{ textTransform: 'none', color: COLORS.brand, fontWeight: 600 }}
      >
        Open in new tab
      </Button>
    </Stack>
  );

  // Floating pill over the preview — replaces the old header bar
  const renderToolbar = (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 2,
        px: 0.5,
        py: 0.25,
        borderRadius: 999,
        bgcolor: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      {receipts.length > 1 && (
        <>
          <IconButton size="small" onClick={() => goTo(index - 1)}>
            <Iconify icon="eva:arrow-ios-back-fill" width={18} />
          </IconButton>
          <Typography
            sx={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, minWidth: 36, textAlign: 'center' }}
          >
            {index + 1} / {receipts.length}
          </Typography>
          <IconButton size="small" onClick={() => goTo(index + 1)}>
            <Iconify icon="eva:arrow-ios-forward-fill" width={18} />
          </IconButton>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.75 }} />
        </>
      )}
      <Tooltip title="Open in new tab">
        <IconButton size="small" component="a" href={receipt.fileUrl} target="_blank" rel="noopener">
          <Iconify icon="eva:external-link-outline" width={18} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Download">
        <IconButton size="small" component="a" href={receipt.fileUrl} download={receipt.fileName}>
          <Iconify icon="eva:download-outline" width={18} />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  const renderPreview = (
    <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
      {/* Progress: Submitted → Review → Finance */}
      <ActivityStepper steps={getActivitySteps(receipt, Boolean(reimbursement?.billed))} />

      {/* Viewer: a soft neutral stage so white documents stand out; scrolls internally for long PDFs */}
      <Box
        ref={setPreviewEl}
        sx={{
          position: 'relative',
          flex: 1,
          minHeight: { xs: 380, md: 'min(560px, calc(100vh - 240px))' },
          borderRadius: 1.5,
          bgcolor: COLORS.stage,
          overflow: 'hidden',
        }}
      >
        {renderToolbar}

        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: isPdf ? 'flex-start' : 'center',
            p: 3,
            pt: isPdf ? 7 : 3,
          }}
        >
          {isPdf ? (
            <Document
              file={receipt.fileUrl}
              onLoadSuccess={({ numPages }) => setPdfPages(numPages)}
              loading={renderLoading}
              error={renderLoadError}
            >
              {previewWidth > 0 &&
                Array.from({ length: pdfPages }, (_, pageIndex) => (
                  <Box
                    key={pageIndex}
                    sx={{ mb: 2, borderRadius: 0.5, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                  >
                    <Page pageNumber={pageIndex + 1} width={pdfPageWidth} renderTextLayer={false} />
                  </Box>
                ))}
            </Document>
          ) : (
            <>
              {imageStatus === 'loading' && renderLoading}
              {imageStatus === 'error' && renderLoadError}
              <Box
                component="img"
                src={receipt.fileUrl}
                alt={receipt.fileName}
                onLoad={() => setImageStatus('loaded')}
                onError={() => setImageStatus('error')}
                sx={{
                  display: imageStatus === 'loaded' ? 'block' : 'none',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: 0.5,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                }}
              />
            </>
          )}
        </Box>
      </Box>

      {/* Thumbnails to jump between receipts — only when there's more than one */}
      {receipts.length > 1 && (
        <Stack direction="row" alignItems="center" sx={{ minHeight: 40 }}>
          <Stack direction="row" spacing={0.75} sx={{ overflowX: 'auto' }}>
            {receipts.map((item, itemIndex) => (
              <ButtonBase
                key={item.id}
                onClick={() => setIndex(itemIndex)}
                sx={{
                  position: 'relative',
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: 1,
                  overflow: 'hidden',
                  bgcolor: '#FFF',
                  border: itemIndex === index ? `2px solid ${COLORS.brand}` : `1px solid ${COLORS.border}`,
                  opacity: itemIndex === index ? 1 : 0.75,
                  '&:hover': { opacity: 1 },
                }}
              >
                {isPdfReceipt(item) ? (
                  <Iconify icon="solar:document-text-bold" width={18} sx={{ color: COLORS.textSecondary }} />
                ) : (
                  <Box
                    component="img"
                    src={item.fileUrl}
                    alt=""
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 3,
                    right: 3,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    border: '1.5px solid #fff',
                    bgcolor: (RECEIPT_STATUS[item.status] || RECEIPT_STATUS.PENDING_REVIEW).color,
                  }}
                />
              </ButtonBase>
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  );

  // ---------------------------------------------------------------- details (right)

  const renderDetails = (
    <Stack spacing={1.75} sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0 }}>
      {/* Creator — same layout as Send Agreement's user row */}
      <Stack direction="row" alignItems="center" gap={1.5}>
        <Avatar src={creator?.user?.photoURL}>{creatorName.charAt(0).toUpperCase()}</Avatar>
        <Stack sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            sx={{ fontSize: '14px', fontFamily: FONTS.body, textTransform: 'capitalize', fontWeight: 400 }}
          >
            {creatorName}
          </Typography>
          <Typography noWrap sx={{ fontSize: '14px', fontFamily: FONTS.body, fontWeight: 400, color: COLORS.textMuted }}>
            {creatorEmail || campaign?.name}
          </Typography>
        </Stack>
      </Stack>

      {/* Single receipt: serif amount + detail rows. Several receipts: the list below carries it. */}
      {receipts.length === 1 && (
      <Box>
        <FieldLabel>Amount claimed</FieldLabel>
        <Typography
          fontFamily={FONTS.serif}
          sx={{ fontSize: 36, lineHeight: 1.1, letterSpacing: -0.5, mt: 0.5 }}
        >
          {formatReceiptAmount(receipt.amount, currency)}
        </Typography>

        <Box sx={{ mt: 1.5 }}>
          {[
            { label: 'Description', value: receipt.description },
            { label: 'Submitted', value: formatDateTime(receipt.submittedAt) },
          ].map((row) => (
            <Stack
              key={row.label}
              direction="row"
              spacing={2}
              sx={{ py: 1, borderTop: `1px dashed ${COLORS.divider}` }}
            >
              <Typography sx={{ width: 84, flexShrink: 0, fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted }}>
                {row.label}
              </Typography>
              <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.ink, wordBreak: 'break-word' }}>
                {row.value}
              </Typography>
            </Stack>
          ))}
        </Box>
      </Box>
      )}

      {/* All receipts (only when there's more than one) — the selected row expands with its details */}
      {receipts.length > 1 && (
        <Box>
          <Box sx={{ mb: 0.5 }}>
            <FieldLabel hint={`${approvedCount} of ${receipts.length} approved`}>All receipts</FieldLabel>
          </Box>
          {receipts.map((item, itemIndex) => {
            const isSelected = itemIndex === index;
            const isLong = (item.description || '').length > LONG_DESCRIPTION;

            return (
              // div (not <button>) so the "Show more" toggle can live inside the row
              <ButtonBase
                key={item.id}
                component="div"
                onClick={() => setIndex(itemIndex)}
                sx={{
                  width: '100%',
                  display: 'block',
                  textAlign: 'left',
                  px: 1,
                  py: 0.75,
                  borderRadius: 1,
                  // Selected receipt lifts off the grey as a white pill
                  bgcolor: isSelected ? COLORS.white : 'transparent',
                  boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  '&:hover': { bgcolor: isSelected ? COLORS.white : 'rgba(255,255,255,0.6)' },
                }}
              >
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                  <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        mt: '6px', // centre on the first line of text
                        borderRadius: '50%',
                        flexShrink: 0,
                        bgcolor: (RECEIPT_STATUS[item.status] || RECEIPT_STATUS.PENDING_REVIEW).color,
                      }}
                    />
                    {/* Other rows: one line for scanning. Selected row: full text, wrapped
                        (break-word also splits long unspaced strings), clamped at 4 lines
                        until "Show more". */}
                    <Typography
                      noWrap={!isSelected}
                      sx={{
                        fontFamily: FONTS.body,
                        fontSize: 13,
                        lineHeight: '20px',
                        ...(isSelected && {
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          ...(!descExpanded && {
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }),
                        }),
                      }}
                    >
                      {itemIndex + 1}. {item.description}
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      lineHeight: '20px',
                      fontWeight: 400,
                      color: COLORS.textSecondary,
                      flexShrink: 0,
                      ml: 1.5,
                    }}
                  >
                    {formatReceiptAmount(item.amount, currency)}
                  </Typography>
                </Stack>

                {isSelected && (
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ pl: 2, mt: 0.5 }}>
                    <Typography sx={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textMuted }}>
                      Submitted {formatShortDateTime(item.submittedAt)}
                    </Typography>
                    {isLong && (
                      <Typography
                        component="span"
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation(); // don't re-select the row
                          setDescExpanded((value) => !value);
                        }}
                        sx={{
                          fontFamily: FONTS.body,
                          fontSize: 12,
                          fontWeight: 600,
                          color: COLORS.brand,
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {descExpanded ? 'Show less' : 'Show more'}
                      </Typography>
                    )}
                  </Stack>
                )}
              </ButtonBase>
            );
          })}
          <Divider sx={{ my: 0.75 }} />
          {/* Total is the headline figure — same serif as the single-receipt "Amount claimed" */}
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ px: 1 }}>
            <Typography
              fontFamily={FONTS.serif}
              sx={{ fontSize: 28, lineHeight: 1.1, letterSpacing: -0.3, color: COLORS.textMuted }}
            >
              Total
            </Typography>
            <Typography
              fontFamily={FONTS.serif}
              sx={{ fontSize: 28, lineHeight: 1.1, letterSpacing: -0.3, color: COLORS.ink }}
            >
              {formatReceiptAmount(sumReceipts(receipts), currency)}
            </Typography>
          </Stack>
        </Box>
      )}

      {/* The progress stepper lives above the preview; only the rejection reason stays here */}
      {receipt.status === 'REJECTED' && receipt.rejectionReason && (
        <Box sx={{ px: 1.5, py: 1, borderRadius: 1, bgcolor: `${REJECTED_COLOR}12` }}>
          <Typography sx={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 600, color: REJECTED_COLOR }}>
            Rejected
          </Typography>
          <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.ink }}>
            {receipt.rejectionReason}
          </Typography>
        </Box>
      )}

      {/* Note to Finance — collapsed behind a link while reviewing; read-only once decided */}
      {canReview &&
        (noteOpen ? (
          <Box>
            <FieldLabel hint="internal, only Finance and admins see it">Note to Finance</FieldLabel>
            <TextField
              fullWidth
              multiline
              autoFocus={!financeNote}
              minRows={2}
              maxRows={3}
              value={financeNote}
              onChange={(e) => setFinanceNote(e.target.value)}
              placeholder="e.g. Pre-approved by brand for studio rental"
              sx={{ mt: 0.75, '& .MuiOutlinedInput-root': { borderRadius: 1, bgcolor: '#FFF' } }}
            />
          </Box>
        ) : (
          <ButtonBase
            onClick={() => setNoteOpen(true)}
            sx={{
              alignSelf: 'flex-start',
              fontFamily: FONTS.body,
              fontSize: 13,
              fontWeight: 600,
              color: COLORS.brand,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            + Add note to Finance
          </ButtonBase>
        ))}
      {!canReview && receipt.financeNote && (
        <Typography sx={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary }}>
          <Box component="span" sx={{ fontWeight: 600, color: COLORS.label }}>
            Note to Finance:{' '}
          </Box>
          {receipt.financeNote}
        </Typography>
      )}

      {/* Actions — pinned to the bottom of the column (mt: auto), level with the preview */}
      {canReview && (
        <Box sx={{ mt: 'auto !important', pt: 1 }}>
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
                onClick={() => setRejectMode(true)}
                disabled={!!loadingAction}
                sx={{ ...SECONDARY_BUTTON_SX, color: REJECTED_COLOR }}
              >
                Reject
              </Button>
              <LoadingButton
                fullWidth
                loading={loadingAction === 'approve'}
                onClick={() => handleReview('approve')}
                sx={PRIMARY_BUTTON_SX}
              >
                {isLastPending ? 'Approve & send to Finance' : 'Approve receipt'}
              </LoadingButton>
            </Stack>
          )}
        </Box>
      )}
    </Stack>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={!smUp}
      PaperProps={{
        sx: {
          ...DIALOG_PAPER_SX,
          // Never taller than the viewport: if space runs short the preview shrinks (and scrolls
          // inside itself) instead of the modal scrolling.
          maxHeight: { sm: 'calc(100vh - 64px)' },
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box position="relative" sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
        {renderHeader}

        {/* Same 30px side padding as the header, so the preview lines up with the title */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            overflow: { xs: 'auto', md: 'hidden' },
            padding: { xs: '20px', sm: '20px 30px 24px' },
          }}
        >
          {/* The details column sets the height; the preview stretches to match it */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            alignItems="stretch"
            sx={{ flex: 1, minHeight: 0 }}
          >
            {renderPreview}
            {renderDetails}
          </Stack>
        </Box>
      </Box>
    </Dialog>
  );
}

ReimbursementReviewModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  reimbursement: PropTypes.object,
  creator: PropTypes.object,
  campaign: PropTypes.object,
  isDisabled: PropTypes.bool,
};
