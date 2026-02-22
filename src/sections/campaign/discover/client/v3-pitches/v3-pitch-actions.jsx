import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import React, { useMemo, useState } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Button,
  Dialog,
  Typography,
  DialogContent,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

// Statuses that indicate the creator has been approved (for showing Withdraw vs Remove)
const APPROVED_STATUSES = ['APPROVED', 'approved', 'AGREEMENT_PENDING', 'AGREEMENT_SUBMITTED'];

const V3PitchActions = ({ pitch, onViewPitch, campaignId, onRemoved, isDisabled = false }) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Determine if the pitch is in an approved state (show Withdraw) or not (show Remove)
  const isApproved = useMemo(() => {
    const status = pitch?.displayStatus || pitch?.status;
    return APPROVED_STATUSES.includes(status);
  }, [pitch]);

  const creatorName = pitch?.user?.name || 'Creator';

  const isSyntheticPitch = () => {
    const pitchId = pitch?.id;
    return pitchId && pitchId.startsWith('shortlisted-');
  };

  const getRealPitchId = () => {
    const pitchId = pitch?.id;
    if (!pitchId) return null;
    
    // Remove 'shortlisted-' prefix if present
    if (pitchId.startsWith('shortlisted-')) {
      return pitchId.replace('shortlisted-', '');
    }
    
    return pitchId;
  };

  const handleRemoveCreator = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(endpoints.campaign.removeCreator, {
        creatorId: pitch.userId,
        campaignId,
      });

      enqueueSnackbar(res?.data?.message || 'Creator removed successfully');
      setConfirmDialogOpen(false);
      if (onRemoved) {
        onRemoved();
      }
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to remove creator', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawCreator = async () => {
    try {
      setLoading(true);
      
      // If this is a synthetic pitch (shortlisted creator without a real pitch record),
      // use the removeCreator endpoint instead of the withdraw endpoint
      if (isSyntheticPitch()) {
        console.log('Handling synthetic pitch - using removeCreator endpoint');
        const res = await axiosInstance.post(endpoints.campaign.removeCreator, {
          creatorId: pitch.userId,
          campaignId,
        });
        
        enqueueSnackbar(res?.data?.message || 'Creator withdrawn successfully');
        setConfirmDialogOpen(false);
        if (onRemoved) {
          onRemoved();
        }
        return;
      }
      
      // For real pitch records, use the withdraw endpoint
      const realPitchId = getRealPitchId();
      
      if (!realPitchId) {
        throw new Error('Invalid pitch ID');
      }
      
      const res = await axiosInstance.patch(endpoints.campaign.pitch.v3.withdraw(realPitchId), {
        reason: 'Withdrawn by admin',
      });

      enqueueSnackbar(res?.data?.message || 'Creator withdrawn successfully');
      setConfirmDialogOpen(false);
      if (onRemoved) {
        onRemoved();
      }
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || error?.message || 'Failed to withdraw creator', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1}>
        {isApproved ? (
          // Withdraw button for approved creators (red/danger style)
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDialogOpen(true);
            }}
            disabled={isDisabled}
            sx={{
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              px: 2,
              py: 2,
              minWidth: '90px',
              border: '1px solid #d32f2f',
              borderBottom: '3px solid #b71c1c',
              borderRadius: 1,
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              textTransform: 'none',
              bgcolor: '#d32f2f',
              whiteSpace: 'nowrap',
              '&:hover': {
                bgcolor: '#b71c1c',
                border: '1px solid #b71c1c',
                borderBottom: '3px solid #7f0000',
              },
              '&.Mui-disabled': {
                bgcolor: '#bdbdbd',
                color: '#fff',
                border: '1px solid #bdbdbd',
                borderBottom: '3px solid #9e9e9e',
                cursor: 'not-allowed',
                pointerEvents: 'auto',
              },
            }}
          >
            Withdraw
          </Button>
        ) : (
          // Remove button for non-approved creators
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDialogOpen(true);
            }}
            disabled={isDisabled}
            sx={{
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              px: 2,
              py: 2,
              minWidth: '90px',
              border: '1px solid #3A3A3C',
              borderBottom: '3px solid #00000073',
              borderRadius: 1,
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              textTransform: 'none',
              bgcolor: '#3A3A3C',
              whiteSpace: 'nowrap',
              '&:hover': {
                bgcolor: '#3A3A3C',
                border: '1px solid #3A3A3C',
                borderBottom: '3px solid #00000073',
              },
              '&.Mui-disabled': {
                bgcolor: '#bdbdbd',
                color: '#fff',
                border: '1px solid #bdbdbd',
                borderBottom: '3px solid #9e9e9e',
                cursor: 'not-allowed',
                pointerEvents: 'auto',
              },
            }}
          >
            Remove
          </Button>
        )}
      </Stack>

      {/* Custom Styled Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={(e) => {
          if (e && e.stopPropagation) e.stopPropagation();
          setConfirmDialogOpen(false);
        }}
        onClick={(e) => e.stopPropagation()}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Icon Circle */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: isApproved ? '#D4321C' : '#2C2C2C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <Typography sx={{ fontSize: 40 }}>{isApproved ? '✋' : '🗑️'}</Typography>
          </Box>

          {/* Title */}
          <Typography
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontSize: 36,
              fontWeight: 400,
              mb: 1,
              lineHeight: 1.2,
            }}
          >
            {isApproved
              ? `Withdraw ${creatorName} from the Campaign?`
              : `Remove ${creatorName} from the Master List?`}
          </Typography>

          {/* Info Statement */}
          <Typography
            sx={{
              color: '#636366',
              fontSize: '0.875rem',
              mb: 3,
              mt: 1,
              lineHeight: 1.5,
            }}
          >
            {isApproved
              ? 'This will remove the creator from the campaign, delete their agreement, submissions, and mark their pitch as withdrawn. This action cannot be undone.'
              : 'This will remove the creator from the master list. Their pitch will be deleted and they can re-apply to the campaign.'}
          </Typography>

          {/* Buttons */}
          <Stack spacing={1.5}>
            <LoadingButton
              fullWidth
              variant="contained"
              loading={loading}
              onClick={(e) => {
                e.stopPropagation();
                isApproved ? handleWithdrawCreator() : handleRemoveCreator();
              }}
              sx={{
                bgcolor: isApproved ? '#D4321C' : '#3A3A3C',
                borderBottom: isApproved ? '3px solid #b71c1c' : '3px solid #00000073',
                color: '#fff',
                py: 1,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 1.5,
                textTransform: 'none',
                '&:hover': {
                  bgcolor: isApproved ? '#B71C1C' : '#2C2C2C',
                },
              }}
            >
              Yes
            </LoadingButton>
            <Button
              fullWidth
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDialogOpen(false);
              }}
              disabled={loading}
              sx={{
                color: '#3A3A3C',
                border: '1px solid #E7E7E7',
                borderBottom: '3px solid #e7e7e7',
                py: 1,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 1.5,
                bgcolor: 'transparent',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              Cancel
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default V3PitchActions;

V3PitchActions.propTypes = {
  pitch: PropTypes.object.isRequired,
  onViewPitch: PropTypes.func.isRequired,
  campaignId: PropTypes.string.isRequired,
  onRemoved: PropTypes.func,
  isDisabled: PropTypes.bool,
};
