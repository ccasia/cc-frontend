import useSWR from 'swr';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { config } from '@fullcalendar/core/internal';

import { Box, Stack, Badge, Button, Divider, Typography } from '@mui/material';

import { fetcher } from 'src/utils/axios';
import { formatReservationSlot } from 'src/utils/reservation-time';

import Iconify from 'src/components/iconify';

import LogisticsStepper from '../logistics-stepper';
import ReviewIssueDialog from '../dialogs/review-issue-dialog';
import ScheduleReservationDialog from '../dialogs/schedule-reservation-dialog';
import AdminScheduleReservationDialog from '../dialogs/admin-schedule-reservation-dialog';
import ConfirmReservationDetailsDialog from '../dialogs/confirm-reservation-details-dialog';

export default function ReservationDrawer({ logistic, onUpdate, campaignId, isAdmin, onClose }) {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openSchedule, setOpenSchedule] = useState(false);
  const [openAdminSchedule, setOpenAdminSchedule] = useState(false);
  const [openIssue, setOpenIssue] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const status = logistic?.status;
  const details = logistic?.reservationDetails;
  const isReservation = logistic?.type === 'RESERVATION';

  const confirmedSlot = details?.slots?.find((slot) => slot.status === 'SELECTED');
  const isScheduled = Boolean(confirmedSlot);
  const isDetailsConfirmed = details?.isConfirmed;
  const hasIssue = status === 'ISSUE_REPORTED';
  const isAuto = config?.mode === 'AUTO_SCHEDULE';

  const { data: reservationConfig } = useSWR(
    campaignId && isReservation ? `/api/logistics/campaign/${campaignId}/reservation-config` : null,
    fetcher
  );

  useEffect(() => {
    if (logistic?.id) {
      const storageKey = `badge_${logistic.id}`;
      const storedValue = localStorage.getItem(storageKey);

      if (storedValue === 'true') {
        setHasInteracted(true);
      } else {
        setHasInteracted(false);
      }
    }
  }, [logistic?.id]);

  const handleBadgeClick = () => {
    setHasInteracted(true);
    if (logistic?.id) {
      const storageKey = `badge_${logistic.id}`;
      localStorage.setItem(storageKey, 'true');
    }
  };

  // --- Button Logic ---
  const renderActionButtons = () => {
    if (hasIssue) {
      return (
        <Button fullWidth variant="contained" onClick={() => setOpenIssue(true)} sx={buttonSx}>
          Review Issue
        </Button>
      );
    }

    if (isAdmin) {
      if (isScheduled && !isDetailsConfirmed) {
        return (
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={2}
            width="100%"
          >
            <Badge color="error" variant="dot" invisible={hasInteracted}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  handleBadgeClick();
                  setOpenConfirm(true);
                }}
                sx={{
                  width: 'fit-content',
                  height: 44,
                  padding: { xs: '4px 8px', sm: '6px 10px' },
                  borderRadius: '8px',
                  boxShadow: '0px -4px 0px 0px #00000073 inset',
                  backgroundColor: '#3A3A3C',
                  color: '#FFFFFF',
                  fontSize: { xs: 12, sm: 14, md: 16 },
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#3a3a3ce1',
                    boxShadow: '0px -4px 0px 0px #00000073 inset',
                  },
                  '&:active': {
                    boxShadow: '0px 0px 0px 0px #00000073 inset',
                    transform: 'translateY(1px)',
                  },
                }}
              >
                Confirm Details
              </Button>
            </Badge>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setOpenAdminSchedule(true)}
              sx={buttonSx}
            >
              Reschedule
            </Button>
          </Stack>
        );
      }

      if (isDetailsConfirmed && !isScheduled) {
        return (
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={2}
            width="100%"
          >
            <Button
              fullWidth
              variant="contained"
              onClick={() => setOpenConfirm(true)}
              sx={{
                width: 'fit-content',
                height: 44,
                padding: { xs: '4px 8px', sm: '6px 10px' },
                borderRadius: '8px',
                boxShadow: '0px -4px 0px 0px #00000073 inset',
                backgroundColor: '#3A3A3C',
                color: '#FFFFFF',
                fontSize: { xs: 12, sm: 14, md: 16 },
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#3a3a3ce1',
                  boxShadow: '0px -4px 0px 0px #00000073 inset',
                },
                '&:active': {
                  boxShadow: '0px 0px 0px 0px #00000073 inset',
                  transform: 'translateY(1px)',
                },
              }}
            >
              Edit Details
            </Button>
            <Badge color="error" variant="dot" invisible={hasInteracted}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  handleBadgeClick();
                  setOpenAdminSchedule(true);
                }}
                sx={buttonSx}
              >
                Schedule
              </Button>
            </Badge>
          </Stack>
        );
      }

      if (isDetailsConfirmed && isScheduled) {
        return (
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={2}
            width="100%"
          >
            <Button
              fullWidth
              variant="contained"
              onClick={() => setOpenConfirm(true)}
              sx={{
                width: 'fit-content',
                height: 44,
                padding: { xs: '4px 8px', sm: '6px 10px' },
                borderRadius: '8px',
                boxShadow: '0px -4px 0px 0px #00000073 inset',
                backgroundColor: '#3A3A3C',
                color: '#FFFFFF',
                fontSize: { xs: 12, sm: 14, md: 16 },
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#3a3a3ce1',
                  boxShadow: '0px -4px 0px 0px #00000073 inset',
                },
                '&:active': {
                  boxShadow: '0px 0px 0px 0px #00000073 inset',
                  transform: 'translateY(1px)',
                },
              }}
            >
              Edit Details
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setOpenAdminSchedule(true)}
              sx={buttonSx}
            >
              Reschedule
            </Button>
          </Stack>
        );
      }
    }

    return (
      <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} width="100%">
        {/* 1. Confirm Details Button (If not done) */}
        {!isDetailsConfirmed && (
          <Badge color="error" variant="dot" invisible={hasInteracted}>
            <Button
              variant="contained"
              onClick={() => {
                handleBadgeClick();
                setOpenConfirm(true);
              }}
              sx={{
                width: 'fit-content',
                height: 44,
                padding: { xs: '4px 8px', sm: '6px 10px' },
                borderRadius: '8px',
                boxShadow: '0px -4px 0px 0px #00000073 inset',
                backgroundColor: '#3A3A3C',
                color: '#FFFFFF',
                fontSize: { xs: 12, sm: 14, md: 16 },
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#3a3a3ce1',
                  boxShadow: '0px -4px 0px 0px #00000073 inset',
                },
                '&:active': {
                  boxShadow: '0px 0px 0px 0px #00000073 inset',
                  transform: 'translateY(1px)',
                },
              }}
            >
              Confirm Details
            </Button>
          </Badge>
        )}

        {/* 2. Schedule Button (If not done) */}
        {!isScheduled && !isAuto && status === 'PENDING_ASSIGNMENT' && (
          <Badge color="error" variant="dot" invisible={hasInteracted}>
            <Button
              variant="contained"
              onClick={() => {
                handleBadgeClick();
                isAdmin ? setOpenAdminSchedule(true) : setOpenSchedule(true);
              }}
              sx={buttonSx} // Always Blue for Schedule
            >
              {isAdmin ? 'Schedule' : 'Confirm Slot'}
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
              {formatReservationSlot(confirmedSlot.startTime, confirmedSlot.endTime, true)}
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
          <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
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
        <LogisticsStepper logistic={logistic} onUpdate={onUpdate} isReservation />

        <Stack alignItems="center" sx={{ mt: 3 }}>
          {renderActionButtons()}
        </Stack>
      </Box>

      {renderReservationDetails}

      <ConfirmReservationDetailsDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        logistic={logistic}
        campaignId={campaignId}
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
        reservationConfig={reservationConfig}
      />
      <AdminScheduleReservationDialog
        open={openAdminSchedule}
        onClose={() => setOpenAdminSchedule(false)}
        logistic={logistic}
        campaignId={campaignId}
        onUpdate={onUpdate}
        reservationConfig={reservationConfig}
      />
    </>
  );
}

const buttonSx = {
  width: 'fit-content',
  height: 44,
  padding: { xs: '4px 8px', sm: '6px 10px' },
  borderRadius: '8px',
  boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
  backgroundColor: '#1340FF',
  color: '#FFFFFF',
  fontSize: { xs: 12, sm: 14, md: 16 },
  fontWeight: 600,
  textTransform: 'none',
  '&:hover': {
    backgroundColor: '#133effd3',
    boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
  },
  '&:active': {
    boxShadow: '0px 0px 0px 0px #0c2aa6 inset',
    transform: 'translateY(1px)',
  },
};

ReservationDrawer.propTypes = {
  logistic: PropTypes.object,
  onUpdate: PropTypes.func,
  campaignId: PropTypes.string,
  isAdmin: PropTypes.bool,
  onClose: PropTypes.func,
};
