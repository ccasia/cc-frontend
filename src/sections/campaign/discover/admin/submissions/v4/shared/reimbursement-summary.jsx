import { useState } from 'react';
import PropTypes from 'prop-types';

import { Box, Stack, Typography, ButtonBase } from '@mui/material';

import { getReimbursementSummaryStatus } from 'src/hooks/use-get-reimbursements';

import Iconify from 'src/components/iconify';

import { COLORS } from 'src/sections/campaign/reimbursement/reimbursement-styles';

import ReimbursementReviewModal from './reimbursement-review-modal';

// ----------------------------------------------------------------------

// The card sits on the expanded submission panel (background.neutral); the notches use the
// same colour so they read as cut-outs.
const NOTCH = 10;
const BORDER = COLORS.border;

const Notch = ({ position, dashed }) => (
  <Box
    sx={{
      position: 'absolute',
      left: -NOTCH / 2,
      [position]: -NOTCH / 2 - (position === 'bottom' ? 1.5 : 0),
      width: NOTCH,
      height: NOTCH,
      borderRadius: '50%',
      bgcolor: 'background.neutral',
      border: `1px ${dashed ? 'dashed' : 'solid'} ${dashed ? COLORS.borderStrong : BORDER}`,
      zIndex: 1,
    }}
  />
);

Notch.propTypes = { position: PropTypes.oneOf(['top', 'bottom']), dashed: PropTypes.bool };

// ----------------------------------------------------------------------

// Slim reimbursement "ticket" inside the round's first video card (admin side): a perforated
// tear line and a stub that opens the review. No amount on purpose — a total across several
// receipts reads like one claim; per-receipt amounts live in the review modal.
export default function ReimbursementSummary({ reimbursement, creator, campaign, isDisabled }) {
  const [open, setOpen] = useState(false);

  const receipts = reimbursement?.receipts || [];
  const status = getReimbursementSummaryStatus(reimbursement);
  const canOpen = Boolean(reimbursement?.submittedAt && receipts.length);

  const countLabel = canOpen
    ? `${receipts.length} receipt${receipts.length > 1 ? 's' : ''}`
    : 'Waiting for the creator';

  return (
    <>
      <ButtonBase
        disabled={!canOpen}
        onClick={() => setOpen(true)}
        sx={{
          mt: 2,
          width: '100%',
          display: 'flex',
          alignItems: 'stretch',
          textAlign: 'left',
          borderRadius: 1.5,
          bgcolor: canOpen ? COLORS.white : 'transparent',
          border: `1.5px ${canOpen ? 'solid' : 'dashed'} ${canOpen ? BORDER : COLORS.borderStrong}`,
          borderBottom: canOpen ? `3px solid ${BORDER}` : `1.5px dashed ${COLORS.borderStrong}`,
          overflow: 'hidden',
          transition: 'transform .15s ease, box-shadow .15s ease',
          '&:hover': canOpen
            ? {
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 16px rgba(35,31,32,0.08)',
                '& .reimbursement-stub': { bgcolor: COLORS.brandTint },
              }
            : {},
        }}
      >
        {/* Main: one line — icon, title, count, status */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ flex: 1, minWidth: 0, px: 1.5, py: 1.25 }}
        >
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, color: canOpen ? COLORS.ink : COLORS.textMuted }}>
            Reimbursement
          </Typography>
          <Typography noWrap sx={{ fontSize: 12, color: COLORS.textMuted, flexShrink: 0 }}>
            · {countLabel}
          </Typography>

          <Box sx={{ flex: 1 }} />

          {canOpen && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: status.color }} />
              <Typography noWrap sx={{ fontSize: 12, fontWeight: 600, color: status.color }}>
                {status.label}
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* Stub: perforated tear line + call to action */}
        <Stack
          className="reimbursement-stub"
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={0.25}
          sx={{
            position: 'relative',
            width: 72,
            flexShrink: 0,
            borderLeft: `1.5px dashed ${canOpen ? COLORS.divider : COLORS.borderStrong}`,
            transition: 'background-color .15s ease',
          }}
        >
          <Notch position="top" dashed={!canOpen} />
          <Notch position="bottom" dashed={!canOpen} />

          <Typography
            sx={{ fontSize: 13, fontWeight: 700, color: canOpen ? COLORS.brand : COLORS.disabled }}
          >
            {canOpen ? 'View' : 'Pending'}
          </Typography>
          {canOpen && (
            <Iconify icon="eva:arrow-ios-forward-fill" width={14} sx={{ color: COLORS.brand }} />
          )}
        </Stack>
      </ButtonBase>

      {canOpen && (
        <ReimbursementReviewModal
          open={open}
          onClose={() => setOpen(false)}
          reimbursement={reimbursement}
          creator={creator}
          campaign={campaign}
          isDisabled={isDisabled}
        />
      )}
    </>
  );
}

ReimbursementSummary.propTypes = {
  reimbursement: PropTypes.object.isRequired,
  creator: PropTypes.object,
  campaign: PropTypes.object,
  isDisabled: PropTypes.bool,
};
