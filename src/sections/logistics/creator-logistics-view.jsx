import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';

import { Box, Stack, Button, Divider, Typography, Link, Badge } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import axiosInstance, { fetcher } from 'src/utils/axios';
import Iconify from 'src/components/iconify';
import { fDate } from 'src/utils/format-time';
import { useSnackbar } from 'src/components/snackbar';
import { useAuthContext } from 'src/auth/hooks';

import { CreatorLogisticsStepper } from './logistics-stepper';
import ReportIssueDialog from './dialogs/report-issue-dialog';
import ConfirmDeliveryDetailsDialog from './dialogs/confirm-details-dialog';
import CreatorReservationDialog from './dialogs/creator-reservation-dialog';

export default function CreatorLogisticsView({ campaign }) {
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();

  // Dialog States
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openIssue, setOpenIssue] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Data Fetching
  const {
    data: logistic,
    mutate,
    isLoading,
  } = useSWR(campaign?.id ? `/api/logistics/creator/campaign/${campaign.id}` : null, fetcher, {
    revalidateOnFocus: false, 
    revalidateOnReconnect: false,
  });

  const { data: config } = useSWR(
    campaign?.id && campaign?.logisticsType === 'RESERVATION'
      ? `/api/logistics/campaign/${campaign.id}/reservation-config`
      : null,
    fetcher
  );

  const isReservation = campaign?.logisticsType === 'RESERVATION';
  const isAutoSchedule = config?.mode === 'AUTO_SCHEDULE';

  const status = logistic?.status || 'NOT_STARTED';
  const deliveryDetails = logistic?.deliveryDetails;
  const reservationDetails = logistic?.reservationDetails;
  const creator = logistic?.creator || user;
  const isConfirmed = isReservation
    ? logistic?.reservationDetails?.isConfirmed
    : logistic?.deliveryDetails?.isConfirmed;

  const { confirmedSlot, proposedSlots } = useMemo(() => {
    const slots = logistic?.reservationDetails?.slots || [];
    return {
      confirmedSlot: slots.find((slot) => slot.status === 'SELECTED'),
      proposedSlots: slots.filter((slot) => slot.status === 'PROPOSED'),
    };
  }, [logistic]);

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      if (isReservation) {
        await axiosInstance.patch(`/api/logistics/creator/${logistic.id}/complete`);
        enqueueSnackbar('Visit marked as completed!', { variant: 'success' });
      } else {
        await axiosInstance.patch(`/api/logistics/creator/${logistic.id}/received`);
        enqueueSnackbar('Products marked as received!', { variant: 'success' });
      }
      mutate();
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Failed to update status', { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // TODO - reschedule dialog
  const handleReschedule = async () => {
    // if (!confirm('Are you sure you want to reschedule? This will cancel your current booking.'))
    // return;
    setIsProcessing(true);
    try {
      await axiosInstance.post(`/api/logistics/campaign/${campaign.id}/${logistic.id}/reschedule`);
      mutate();
      enqueueSnackbar('Booking reset. Please select a new time.');
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Failed to reschedule', { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkReceived = async () => {
    handleComplete();
  };

  if (isLoading) return <Typography>Loading...</Typography>;

  const renderProductLeft = (
    <Stack spacing={1} sx={{ height: '100%' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 3 }}>
        <Iconify icon="eva:person-outline" sx={{ color: '#1340FF' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
          Your Details
        </Typography>
      </Stack>
      <Divider />
      <Stack spacing={2} sx={{ flexGrow: 1, px: 4 }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1.5 }}>
            Delivery Address
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {deliveryDetails?.address || '-'}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Contact Number
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {creator?.phoneNumber || '-'}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Remarks
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {deliveryDetails?.dietaryRestrictions || 'No remarks provided.'}
          </Typography>
        </Box>
      </Stack>

      {(status === 'PENDING_ASSIGNMENT' || status === 'SCHEDULED') && !isConfirmed && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Badge color="error" variant="dot" invisible={status !== 'PENDING_ASSIGNMENT'}>
            <Button
              variant="contained"
              size="large"
              onClick={() => setOpenConfirm(true)}
              sx={{
                padding: { xs: '4px 8px', sm: '6px 10px' },
                height: 44,
                bgcolor: '#1340FF',
                px: 4,
                py: 1,
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
                '&:hover': {
                  backgroundColor: '#133effd3',
                  boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
                },
                '&:active': {
                  boxShadow: '0px 0px 0px 0px #0c2aa6 inset',
                  transform: 'translateY(1px)',
                },
              }}
            >
              Confirm Details
            </Button>
          </Badge>
        </Box>
      )}
    </Stack>
  );

  const renderReservationLeft = () => {
    let availabilityDisplay = null;

    if (confirmedSlot) {
      availabilityDisplay = (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {format(new Date(confirmedSlot.startTime), 'd MMMM yyyy (h:mm a - ')}
          {format(new Date(confirmedSlot.endTime), 'h:mm a)')}
        </Typography>
      );
    } else {
      availabilityDisplay = (
        <Stack spacing={0.5}>
          {proposedSlots.map((slot, idx) => (
            <Typography key={idx} variant="body2" sx={{ fontWeight: 500 }}>
              {format(new Date(slot.startTime), 'd MMMM yyyy (h:mm a)')}
            </Typography>
          ))}
        </Stack>
      );
    }

    return (
      <Stack spacing={1} sx={{ height: '100%' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 3 }}>
          <Iconify icon="eva:person-outline" sx={{ color: '#1340FF' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
            Your Details
          </Typography>
        </Stack>
        <Divider />
        <Stack spacing={2} sx={{ flexGrow: 1, px: 4 }}>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 1.5 }}
            >
              Preferred Outlet
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {reservationDetails?.outlet || '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Availability
            </Typography>
            {availabilityDisplay}
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Contact Number
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {creator?.phoneNumber || '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              My Remarks
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {reservationDetails?.creatorRemarks || '-'}
            </Typography>
          </Box>
        </Stack>

        {status === 'NOT_STARTED' && !isConfirmed && (
          <Box sx={{ px: 4, mt: 4, pb: 2 }}>
            <Badge color="error" variant="dot" sx={{ width: '100%' }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setOpenConfirm(true)}
                sx={{
                  height: 44,
                  bgcolor: '#1340FF',
                  boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
                  '&:hover': { bgcolor: '#133effd3' },
                }}
              >
                Confirm Details
              </Button>
            </Badge>
          </Box>
        )}

        {status === 'SCHEDULED' && isAutoSchedule && (
          <Box sx={{ px: 4, mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleReschedule}
              disabled={isProcessing}
              fullWidth
              sx={{ borderColor: '#E0E0E0', color: 'text.secondary' }}
            >
              Reschedule
            </Button>
          </Box>
        )}
      </Stack>
    );
  };

  const renderProductRight = (
    <Stack spacing={1} sx={{ height: '100%' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 3 }}>
        <Iconify icon="eva:car-outline" sx={{ color: '#1340FF' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
          Delivery Details
        </Typography>
      </Stack>
      <Divider />
      {status === 'PENDING_ASSIGNMENT' ? (
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 250,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#F4F6F8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h3">😶‍🌫️</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Waiting for Client to update...
          </Typography>
        </Box>
      ) : (
        // Populated State
        <Stack spacing={2} sx={{ px: 4 }}>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 1.5 }}
            >
              Products Assigned
            </Typography>
            <Typography variant="body1" fontFamily="inter" sx={{ fontWeight: 700 }}>
              {deliveryDetails?.items?.map((i) => i.product.productName).join(', ') || '-'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Tracking Link
            </Typography>
            {deliveryDetails?.trackingLink ? (
              <Link
                href={deliveryDetails.trackingLink}
                target="_blank"
                rel="noopener"
                variant="caption"
                sx={{ color: '#1340FF' }}
              >
                {deliveryDetails.trackingLink}
              </Link>
            ) : (
              <Typography variant="body2">-</Typography>
            )}
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Expected Delivery Date
            </Typography>
            <Typography variant="body1" fontFamily="inter" sx={{ fontWeight: 700 }}>
              {deliveryDetails?.expectedDeliveryDate
                ? fDate(deliveryDetails.expectedDeliveryDate)
                : '-'}
            </Typography>
          </Box>

          {status === 'SHIPPED' && (
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Badge color="error" variant="dot" invisible={status !== 'SHIPPED'}>
                <Button
                  // fullWidth
                  variant="contained"
                  onClick={handleMarkReceived}
                  sx={{
                    padding: { xs: '4px 8px', sm: '6px 10px' },
                    height: 44,
                    bgcolor: '#1340FF',
                    px: 4,
                    py: 1,
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
                    '&:hover': {
                      backgroundColor: '#133effd3',
                      boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
                    },
                    '&:active': {
                      boxShadow: '0px 0px 0px 0px #0c2aa6 inset',
                      transform: 'translateY(1px)',
                    },
                  }}
                >
                  Products Received
                </Button>
              </Badge>
              <Button
                // fullWidth
                variant="outlined"
                onClick={() => setOpenIssue(true)}
                sx={{
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  boxShadow: '0px -4px 0px 0px #00000073 inset',
                  bgcolor: '#3A3A3C',
                  '&:hover': { bgcolor: '#3a3a3cd1', boxShadow: '0px -4px 0px 0px #000000 inset' },
                  '&:active': {
                    boxShadow: '0px 0px 0px 0px #000000 inset',
                    transform: 'translateY(1px)',
                  },
                }}
              >
                Report Issue
              </Button>
            </Stack>
          )}

          {status === 'ISSUE_REPORTED' && (
            <Box sx={{ p: 2, bgcolor: '#FFEFD6', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#231F20' }}>
                Issue Reported
              </Typography>
              <Typography variant="caption" sx={{ color: '#1340FF' }}>
                We are reviewing your issue.
              </Typography>
            </Box>
          )}
        </Stack>
      )}
    </Stack>
  );

  const renderReservationRight = () => {
    if (status === 'NOT_STARTED' || status === 'PENDING_ASSIGNMENT') {
      return (
        <Stack spacing={1} sx={{ height: '100%' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 3 }}>
            <Iconify icon="solar:calendar-date-bold" sx={{ color: '#1340FF' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
              Reservation Details
            </Typography>
          </Stack>
          <Divider />
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 250,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: '#F4F6F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h3">{status === 'NOT_STARTED' ? '📝' : '😶‍🌫️'}</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {status === 'NOT_STARTED'
                ? 'Please confirm your details to start.'
                : 'Waiting for Client to update...'}{' '}
            </Typography>
          </Box>
        </Stack>
      );
    }

    return (
      <Stack spacing={1} sx={{ height: '100%' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 3 }}>
          <Iconify icon="solar:calendar-date-bold" sx={{ color: '#1340FF' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
            Reservation Details
          </Typography>
        </Stack>
        <Divider />
        <Stack spacing={2} sx={{ px: 4, flexGrow: 1 }}>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 1.5 }}
            >
              Booked Slot
            </Typography>
            {confirmedSlot ? (
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {format(new Date(confirmedSlot.startTime), 'd MMMM yyyy (h:mm a - ')}
                {format(new Date(confirmedSlot.endTime), 'h:mm a)')}
              </Typography>
            ) : (
              <Typography variant="body2">-</Typography>
            )}
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Location
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {reservationDetails?.outlet}
            </Typography>
          </Box>
          {/* Display Client-Entered info (Budget, PIC, Promo) */}
          {reservationDetails?.promoCode && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Promo
              </Typography>
              <Typography variant="body2">{reservationDetails.promoCode}</Typography>
            </Box>
          )}
          {reservationDetails?.picName && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Person In Charge
              </Typography>
              <Typography variant="body2">
                {reservationDetails.picName} ({reservationDetails.picContact})
              </Typography>
            </Box>
          )}
          {reservationDetails?.budget && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Budget
              </Typography>
              <Typography variant="body2">{reservationDetails.budget}</Typography>
            </Box>
          )}

          {reservationDetails?.clientRemarks && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Client Remarks
              </Typography>
              <Typography variant="body2">{reservationDetails.clientRemarks}</Typography>
            </Box>
          )}
        </Stack>

        {/* Buttons for Scheduled State */}
        {status !== 'COMPLETED' && (
          <Stack direction="row" spacing={2} sx={{ px: 4, mt: 4 }}>
            <LoadingButton
              variant="contained"
              fullWidth
              onClick={handleComplete}
              loading={isProcessing}
              sx={{ bgcolor: '#1340FF' }}
            >
              Complete Visit
            </LoadingButton>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setOpenIssue(true)}
              sx={{ color: '#fff', bgcolor: '#3A3A3C', '&:hover': { bgcolor: '#000' } }}
            >
              Report Issue
            </Button>
          </Stack>
        )}

        {status === 'ISSUE_REPORTED' && (
          <Box sx={{ p: 2, mx: 4, bgcolor: '#FFEFD6', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#231F20' }}>
              Issue Reported
            </Typography>
            <Typography variant="caption" sx={{ color: '#FF3500' }}>
              We are reviewing your issue.
            </Typography>
          </Box>
        )}
      </Stack>
    );
  };

  return (
    <>
      {/* Main Wrapper Box (Replaces Card) */}
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          borderRadius: 2, // ~16px
          border: '1px solid',
          borderColor: '#EDEFF2', // Light grey border
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {/* Top Section: Stepper */}
        <Box sx={{ py: 6, px: { xs: 3, md: 14 }, borderBottom: '1px solid #EDEFF2' }}>
          <CreatorLogisticsStepper
            status={status}
            updatedDates={logistic}
            isReservation={isReservation}
          />
        </Box>

        {/* Bottom Section: Split Columns */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          // sx={{ pb: 2 }}
          divider={
            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderRightWidth: '1px', borderColor: '#EDEFF2' }}
            />
          }
        >
          {/* Left Column: Your Details */}
          <Box sx={{ width: { xs: '100%', md: '50%' }, py: 1, pb: 4 }}>
            {isReservation ? renderReservationLeft() : renderProductLeft}
          </Box>

          {/* Horizontal Divider for Mobile Only */}
          <Divider sx={{ display: { xs: 'block', md: 'none' } }} />

          {/* Right Column: Delivery Details */}
          <Box sx={{ width: { xs: '100%', md: '50%' }, py: 1, pb: 4 }}>
            {isReservation ? renderReservationRight() : renderProductRight}
          </Box>
        </Stack>
      </Box>

      {/* Dialogs */}
      {isReservation ? (
        <CreatorReservationDialog
          open={openConfirm}
          onClose={() => setOpenConfirm(false)}
          campaign={campaign}
          onUpdate={mutate}
        />
      ) : (
        <ConfirmDeliveryDetailsDialog
          open={openConfirm}
          onClose={() => setOpenConfirm(false)}
          logistic={logistic}
          onUpdate={mutate}
        />
      )}

      <ReportIssueDialog
        open={openIssue}
        onClose={() => setOpenIssue(false)}
        logistic={logistic}
        onUpdate={mutate}
      />
    </>
  );
}

CreatorLogisticsView.propTypes = {
  campaign: PropTypes.shape({
    id: PropTypes.string,
    logisticsType: PropTypes.string,
  }),
};
