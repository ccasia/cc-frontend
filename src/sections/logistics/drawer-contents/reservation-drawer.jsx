import PropTypes from 'prop-types';
import { useState } from 'react';
import { format } from 'date-fns';

import { Box, Stack, Button, Divider, Typography, Badge, Chip } from '@mui/material';
import Iconify from 'src/components/iconify';

import LogisticsStepper from '../logistics-stepper';

// DIALOGS (To be implemented next)
import ConfirmReservationDetailsDialog from '../dialogs/confirm-reservation-details-dialog';
import ScheduleReservationDialog from '../dialogs/schedule-reservation-dialog';
import ReviewIssueDialog from '../dialogs/review-issue-dialog';

export default function ReservationDrawer({ logistic, onUpdate, campaignId, isAdmin, onClose }) {
  // Dialog States
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openSchedule, setOpenSchedule] = useState(false);
  const [openIssue, setOpenIssue] = useState(false);

  const status = logistic?.status;
  const details = logistic?.reservationDetails;

  // Identify slots
  const confirmedSlot = details?.slots?.find((slot) => slot.status === 'SELECTED');
  const isScheduled = Boolean(confirmedSlot);
  const proposedSlots = details?.slots?.filter((slot) => slot.status === 'PROPOSED') || [];
  const isDetailsConfirmed = details?.isConfirmed;
  const hasIssue = status === 'ISSUE_REPORTED';

  // --- Button Logic ---
  const renderActionButtons = () => {
    if (hasIssue) {
      return (
        <Button
          fullWidth
          variant="contained"
          onClick={() => setOpenIssue(true)}
          sx={{ ...buttonSx, bgcolor: '#FF3500', boxShadow: 'none' }}
        >
          Review Issue
        </Button>
      );
    }

    // Both done?
    if (isDetailsConfirmed && isScheduled) {
      if (isAdmin) {
        return (
          <Button variant="outlined" onClick={() => setOpenSchedule(true)} sx={outlineButtonSx}>
            Edit Schedule
          </Button>
        );
      }
      return null; // Client has nothing left to do here
    }

    return (
      <Stack spacing={1.5} width="100%">
        {/* 1. Confirm Details Button (If not done) */}
        {!isDetailsConfirmed && (
          <Badge color="error" variant="dot" sx={{ width: '100%' }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setOpenConfirm(true)}
              // Use Dark Grey if it's the "secondary" action, or Blue if it's the only action
              sx={{ ...buttonSx, bgcolor: !isScheduled ? '#3A3A3C' : '#1340FF' }}
            >
              Confirm Details
            </Button>
          </Badge>
        )}

        {/* 2. Schedule Button (If not done) */}
        {!isScheduled && (
          <Badge color="error" variant="dot" sx={{ width: '100%' }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setOpenSchedule(true)}
              sx={buttonSx} // Always Blue for Schedule
            >
              Schedule
            </Button>
          </Badge>
        )}
      </Stack>
    );
  };

  const renderReservationDetails = (
    <Box
      sx={{
        p: 2.5,
        border: '1px solid #919EAB3D',
        bgcolor: '#F4F6F8',
        borderRadius: 2,
        mx: 3,
        mb: 3,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Iconify icon="material-symbols:calendar-month-outline" sx={{ color: '#1340FF' }} />
        <Typography variant="subtitle2">RESERVATION DETAILS</Typography>
      </Stack>
      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2.5}>
        {/* 1. Allocated Slot (Always Show) */}
        <Box>
          <Typography variant="caption" color="text.secondary">
            Allocated Slot
          </Typography>
          {confirmedSlot ? (
            <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
              {format(new Date(confirmedSlot.startTime), 'd MMM yyyy (h:mm a - ')}
              {format(new Date(confirmedSlot.endTime), 'h:mm a)')}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              -
            </Typography>
          )}
        </Box>

        {/* 2. Location (Always Show) */}
        <Box>
          <Typography variant="caption" color="text.secondary">
            Location
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {details?.outlet || '-'}
          </Typography>
        </Box>

        {/* --- CONDITIONAL FIELDS (Only show if filled by Client) --- */}

        {/* Budget */}
        {details?.budget && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Budget
            </Typography>
            <Typography variant="body2">{details.budget}</Typography>
          </Box>
        )}

        {/* PIC */}
        {(details?.picName || details?.picContact) && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              PIC
            </Typography>
            <Typography variant="body2">
              {details.picName || ''} {details.picContact ? `(${details.picContact})` : ''}
            </Typography>
          </Box>
        )}

        {/* Promo */}
        {details?.promoCode && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Promo
            </Typography>
            <Typography variant="body2">{details.promoCode}</Typography>
          </Box>
        )}

        {/* Client Remarks */}
        {details?.clientRemarks && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Remarks for Creator
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {details.clientRemarks}
            </Typography>
          </Box>
        )}

        {/* 3. Creator Remarks (Always Show) */}
        <Box>
          <Typography variant="caption" color="text.secondary">
            Creator Remarks
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {details?.creatorRemarks || '-'}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          p: 2.5,
          border: '1px solid #919EAB3D',
          bgcolor: '#F4F6F8',
          borderRadius: 2,
          mx: 3,
          mb: 3,
        }}
      >
      {/* Uses the Shared Stepper */}
        <LogisticsStepper logistic={logistic} onUpdate={onUpdate} isReservation={true} />

        <Stack alignItems="center" sx={{ mt: 3 }}>
          {renderActionButtons()}
        </Stack>
      </Box>

      {renderReservationDetails}

      <ConfirmReservationDetailsDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        logistic={logistic}
        onUpdate={onUpdate}
      />

      <ReviewIssueDialog
        open={openIssue}
        onClose={() => setOpenIssue(false)}
        logistic={logistic}
        campaignId={campaignId}
        onUpdate={onUpdate}
      />

      <ScheduleReservationDialog
        open={openSchedule}
        onClose={() => setOpenSchedule(false)}
        logistic={logistic}
        campaignId={campaignId}
        onUpdate={onUpdate}
      />
    </>
  );
}

const buttonSx = {
  height: 44,
  px: 3,
  borderRadius: '8px',
  boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
  backgroundColor: '#1340FF',
  color: '#FFFFFF',
  fontWeight: 600,
  '&:hover': { backgroundColor: '#133effd3', boxShadow: '0px -4px 0px 0px #0c2aa6 inset' },
};

const outlineButtonSx = {
  borderRadius: '8px',
  color: '#231F20',
  border: '1px solid #E0E0E0',
  '&:hover': { backgroundColor: '#F4F6F8' },
};

ReservationDrawer.propTypes = {
  logistic: PropTypes.object,
  onUpdate: PropTypes.func,
  campaignId: PropTypes.string,
  isAdmin: PropTypes.bool,
  onClose: PropTypes.func,
};
