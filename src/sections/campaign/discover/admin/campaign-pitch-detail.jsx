import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useRef } from 'react';

import { Box, Card, Chip, Stack, Button, Typography, ListItemText } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import Markdown from 'src/components/markdown';
import { useSnackbar } from 'src/components/snackbar';

const CampaignPitchDetail = ({ pitch }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const a = useRef(null);
  const b = useRef(null);
  
  const isClient = user?.role === 'client' || user?.admin?.role?.name === 'client';

  const approve = async ({ pitchId }) => {
    try {
      let endpoint;
      if (isClient) {
        // Client approving pitch
        endpoint = endpoints.pitch.approveClient(pitchId);
      } else {
        // Admin approving pitch
        endpoint = endpoints.pitch.approve(pitchId);
      }
      
      const res = await axiosInstance.patch(endpoint);
      enqueueSnackbar(res?.data?.message);
      
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.log(error);
      enqueueSnackbar(error?.response?.data?.message || 'Failed to approve pitch', {
        variant: 'error',
      });
    }
  };

  const reject = async ({ pitchId }) => {
    try {
      let endpoint;
      if (isClient) {
        // Client rejecting pitch
        endpoint = endpoints.pitch.rejectClient(pitchId);
      } else {
        // Admin rejecting pitch
        endpoint = endpoints.pitch.reject(pitchId);
      }
      
      const res = await axiosInstance.patch(endpoint, {
        rejectionReason: `Rejected by ${  isClient ? 'client' : 'admin'}`
      });
      enqueueSnackbar(res?.data?.message);
      
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to reject pitch', {
        variant: 'error',
      });
    }
  };

  const setAgreement = async ({ pitchId, amount, agreementTemplateId }) => {
    try {
      const res = await axiosInstance.patch(endpoints.pitch.setAgreement(pitchId), {
        amount,
        agreementTemplateId,
      });
      enqueueSnackbar(res?.data?.message);
      
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to set agreement', {
        variant: 'error',
      });
    }
  };

  const renderCreatorInformation = (
    <Box
      component={Card}
      p={2}
      sx={{
        // borderStyle: 'dashed',
        borderColor: (theme) => theme.palette.text.disabled,
      }}
    >
      <Typography variant="h5">Creator Information</Typography>

      <Box
        display="grid"
        gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
        gap={2}
        mt={2}
      >
        <ListItemText
          primary="Name"
          secondary={pitch?.user?.name}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />
        <ListItemText
          primary="Email"
          secondary={pitch?.user?.email}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />
        <ListItemText
          primary="Age"
          secondary={`${dayjs().get('year') - dayjs(pitch?.user?.creator?.birthDate).get('year')} years old`}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />
        <ListItemText
          primary="Languages"
          secondary={pitch?.user?.creator?.languages.map((elem) => (
            <Chip label={elem} size="small" sx={{ mr: 1 }} />
          ))}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />
        <ListItemText
          primary="Pronounce"
          secondary={pitch?.user?.creator?.pronounce}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />

        <ListItemText
          primary="Employement Type"
          secondary={pitch?.user?.creator?.employment}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />

        <ListItemText
          primary="Industries"
          secondary={pitch?.user?.creator?.industries.map((elem) => (
            <Chip size="small" label={elem?.name} sx={{ mr: 1 }} />
          ))}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />

        <ListItemText
          primary="Interests"
          secondary={pitch?.user?.creator?.interests.map((elem) => (
            <Chip size="small" label={elem?.name} sx={{ mr: 1 }} />
          ))}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />

        <ListItemText
          primary="Instagram"
          secondary={pitch?.user?.creator?.instagram}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />

        <ListItemText
          primary="Tiktok"
          secondary={pitch?.user?.creator?.tiktok}
          primaryTypographyProps={{
            variant: 'subtitle1',
          }}
          secondaryTypographyProps={{
            variant: 'subtitle2',
          }}
        />
      </Box>

      {/* <List>
        <ListItem>
          <ListItemText
            primary="Name"
            secondary={pitch?.user?.name}
            primaryTypographyProps={{
              variant: 'subtitle1',
            }}
            secondaryTypographyProps={{
              variant: 'subtitle2',
            }}
          />
        </ListItem>
      </List> */}
    </Box>
  );

  const renderPitchContentScript = (
    <Box
      p={2}
      sx={{ border: (theme) => `dashed 1px ${theme.palette.divider}`, borderRadius: 2, mt: 2 }}
    >
      <Box component={Card} p={2} mb={2} ref={a}>
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
          <Iconify icon="streamline:script-2-solid" />
          <Typography>Pitch Script</Typography>
        </Stack>
      </Box>

      <Box component={Card} ref={b} p={2}>
        <Markdown children={pitch?.content} />
      </Box>
    </Box>
  );

  const renderPitchContentVideo = (
    <>
      <Typography>Video</Typography>
      <Typography>dwad</Typography>
    </>
  );

  const renderButton = () => {
    // Don't show buttons if pitch is already rejected
    if (pitch?.status === 'REJECTED') {
      return (
        <Box mt={2} p={2} sx={{ bgcolor: 'error.light', borderRadius: 1 }}>
          <Typography color="error.main" variant="subtitle1">
            This pitch has been rejected
          </Typography>
        </Box>
      );
    }

    // Don't show buttons if pitch is already approved
    if (pitch?.status === 'APPROVED') {
      return (
        <Stack spacing={2} mt={2}>
          <Box p={2} sx={{ bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography color="success.main" variant="subtitle1">
              This pitch has been approved
            </Typography>
          </Box>
          
          {/* Show Complete Agreement button for admin users */}
          {!isClient && (
            <Button
              fullWidth
              color="primary"
              variant="contained"
              onClick={() => {
                // TODO: Open modal to set agreement amount and template
                const amount = prompt('Enter agreement amount:');
                const agreementTemplateId = prompt('Enter agreement template ID:');
                if (amount && agreementTemplateId) {
                  setAgreement({ 
                    pitchId: pitch?.id, 
                    amount: parseInt(amount, 10), 
                    agreementTemplateId 
                  });
                }
              }}
              startIcon={<Iconify icon="material-symbols:assignment" />}
            >
              Complete Agreement
            </Button>
          )}
        </Stack>
      );
    }

    // For client users, only show buttons when status is SENT_TO_CLIENT
    if (isClient && pitch?.status !== 'SENT_TO_CLIENT') {
      return (
        <Box mt={2} p={2} sx={{ bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography color="info.main" variant="subtitle1">
            Waiting for admin review
          </Typography>
        </Box>
      );
    }

    // For admin users, show buttons when status is PENDING_REVIEW (V3) or undecided (V2)
    if (!isClient && pitch?.status !== 'PENDING_REVIEW' && pitch?.status !== 'undecided') {
      return (
        <Box mt={2} p={2} sx={{ bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography color="info.main" variant="subtitle1">
            Waiting for client review
          </Typography>
        </Box>
      );
    }

    return (
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems="center"
        justifyContent="stretch"
        mt={2}
        gap={2}
      >
        <Button
          fullWidth
          color="error"
          variant="outlined"
          onClick={() =>
            reject({ campaignId: pitch?.campaignId, creatorId: pitch?.userId, pitchId: pitch?.id })
          }
          startIcon={<Iconify icon="oui:thumbs-down" />}
        >
          Reject
        </Button>
        <Button
          fullWidth
          color="success"
          variant="contained"
          onClick={() =>
            approve({ campaignId: pitch?.campaignId, creatorId: pitch?.userId, pitchId: pitch?.id })
          }
          startIcon={<Iconify icon="oui:thumbs-up" />}
        >
          {isClient ? 'Approve' : 'Send to Client'}
        </Button>
      </Stack>
    );
  };

  return (
    <>
      {renderCreatorInformation}
      {/* {renderTabs} */}
      {pitch?.content ? renderPitchContentScript : renderPitchContentVideo}

      {/* Show action buttons for both admin and client users */}
      {renderButton()}
    </>
  );
};

export default CampaignPitchDetail;

CampaignPitchDetail.propTypes = {
  pitch: PropTypes.object,
};
