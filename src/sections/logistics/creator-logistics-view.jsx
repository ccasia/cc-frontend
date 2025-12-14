import PropTypes from 'prop-types';
import { useState } from 'react';
import useSWR from 'swr';

import { Box, Stack, Button, Divider, Typography, Link, Badge } from '@mui/material';

import axiosInstance, { fetcher } from 'src/utils/axios';
import Iconify from 'src/components/iconify';
import { fDate } from 'src/utils/format-time';
import { useSnackbar } from 'src/components/snackbar';

import { CreatorLogisticsStepper } from './logistics-stepper';
import ReportIssueDialog from './dialogs/report-issue-dialog';
import ConfirmDeliveryDetailsDialog from './dialogs/confirm-details-dialog';

export default function CreatorLogisticsView({ campaign }) {
  const { enqueueSnackbar } = useSnackbar();

  // Dialog States
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openIssue, setOpenIssue] = useState(false);

  // Data Fetching
  const {
    data: logistic,
    mutate,
    isLoading,
  } = useSWR(campaign?.id ? `/api/logistics/creator/campaign/${campaign.id}` : null, fetcher);

  const status = logistic?.status;
  const deliveryDetails = logistic?.deliveryDetails;
  const creator = logistic?.creator;
  const isConfirmed = logistic?.deliveryDetails?.isConfirmed;
  const isReservation = campaign?.logisticsType === 'RESERVATION';

  const handleMarkReceived = async () => {
    try {
      // setIsLoading(true);
      await axiosInstance.patch(`/api/logistics/creator/${logistic.id}/received`);
      mutate();
      enqueueSnackbar('Products marked as received!', { variant: 'success' });
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Failed to update status', { variant: 'error' });
    }
  };

  if (isLoading) return <Typography>Loading...</Typography>;
  if (!logistic) return <Typography>No logistics found.</Typography>;

  // --- Renders ---

  const renderYourDetails = (
    <Stack spacing={1} sx={{ height: '100%' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 3 }}>
        <Iconify icon="eva:person-outline" sx={{ color: '#1340FF' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
          Your Details
        </Typography>
      </Stack>
      <Divider />
      {/* Details List */}
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

      {/* Action Button: Confirm Details */}
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

  const renderDeliveryDetails = (
    <Stack spacing={1} sx={{ height: '100%' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 3 }}>
        <Iconify icon="eva:car-outline" sx={{ color: '#1340FF' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
          Delivery Details
        </Typography>
      </Stack>
      <Divider />
      {/* Content Area */}
      {status === 'PENDING_ASSIGNMENT' ? (
        // Empty State (Waiting for client)
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
            <Typography vvariant="body1" fontFamily="inter" sx={{ fontWeight: 700 }}>
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
          <Box sx={{ width: { xs: '100%', md: '50%' }, py: 1, pb: 4 }}>{renderYourDetails}</Box>

          {/* Horizontal Divider for Mobile Only */}
          <Divider sx={{ display: { xs: 'block', md: 'none' } }} />

          {/* Right Column: Delivery Details */}
          <Box sx={{ width: { xs: '100%', md: '50%' }, py: 1, pb: 4 }}>{renderDeliveryDetails}</Box>
        </Stack>
      </Box>

      {/* Dialogs */}
      <ConfirmDeliveryDetailsDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        logistic={logistic}
        onUpdate={mutate}
      />

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
