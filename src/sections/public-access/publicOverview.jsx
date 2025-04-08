/* eslint-disable no-unused-vars */

import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Grid,
  Zoom,
  Stack,
  Dialog,
  Avatar,
  Button,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetInvoicesByCampId from 'src/hooks/use-get-invoices-by-campId';

import axiosInstance, { endpoints } from 'src/utils/axios';

//  import { useAuthContext } from 'src/auth/hooks';

import PitchModal from '../campaign/discover/admin/pitch-modal';

const BoxStyle = {
  border: '1px solid #e0e0e0',
  borderRadius: 2,
  p: 3,
  mt: -1,
  mb: 3,
  width: '100%',
  '& .header': {
    borderBottom: '1px solid #e0e0e0',
    mx: -3,
    mb: 1,
    mt: -1.5,
    pb: 1.5,
    px: 1.8,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
};

const cardStyle = {
  boxShadow: 'none',
  bgcolor: 'transparent',
  mb: { xs: 1, sm: 2 },
  '& .iconBox': {
    width: { xs: 40, sm: 52 },
    height: { xs: 40, sm: 52 },
    minWidth: { xs: 40, sm: 52 },
    minHeight: { xs: 40, sm: 52 },
    display: 'flex',
    borderRadius: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '& .iconImage': {
    width: { xs: 24, sm: 32 },
    height: { xs: 24, sm: 32 },
    minWidth: { xs: 24, sm: 32 },
    minHeight: { xs: 24, sm: 32 },
  },
};

const PublicCampaignOverview = ({ campaign, onUpdate }) => {
  const navigate = useNavigate();
  //    const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const { campaigns: campaignInvoices } = useGetInvoicesByCampId(campaign?.id);
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [openPitchModal, setOpenPitchModal] = useState(false);
  const dialog = useBoolean();
  const [localCampaign, setLocalCampaign] = useState(campaign);

  useEffect(() => {
    setLocalCampaign(campaign);
  }, [campaign]);

  const handleDecline = async (pitch) => {
    try {
      const response = await axiosInstance.patch(endpoints.campaign.pitch.changeStatus, {
        pitchId: pitch.id,
        status: 'rejected',
      });

      enqueueSnackbar(response?.data?.message || 'Pitch declined successfully');

      // Call onUpdate to refresh the data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error declining pitch:', error);
      enqueueSnackbar('error', { variant: 'error' });
    }
  };

  // const handleDeclineClick = (pitch) => {
  //   setSelectedPitch(pitch);
  //   dialog.onTrue();
  // };

  const handleConfirmDecline = async () => {
    if (selectedPitch) {
      await handleDecline(selectedPitch);
      dialog.onFalse();
      setSelectedPitch(null);
    }
  };

  const handleViewPitch = (pitch) => {
    const updatedPitch = localCampaign.pitch.find((p) => p.id === pitch.id);
    setSelectedPitch(updatedPitch);
    setOpenPitchModal(true);
  };

  // const refreshData = async () => {
  //   try {
  //     const response = await axiosInstance.get(endpoints.campaign.get(campaignId));
  //     setCampaign(response.data);
  //     // If you have a separate pitches state, update that too
  //     setPitches(response.data.pitches); // adjust according to your data structure
  //   } catch (error) {
  //     console.error('Error refreshing data:', error);
  //   }
  // };

  const handlePitchUpdate = (updatedPitch) => {
    if (onUpdate) {
      onUpdate();
    }

    setLocalCampaign((prev) => ({
      ...prev,
      pitch: prev.pitch.map((p) =>
        p.id === updatedPitch.id ? { ...p, status: updatedPitch.status } : p
      ),
    }));
  };

  return (
    <Grid container spacing={{ xs: 1, sm: 2 }}>
      <Grid item xs={12} sm={6} md={6}>
        <Zoom in>
          <Box component={Card} p={3} flexGrow={1} sx={cardStyle}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  className="iconBox"
                  sx={{
                    backgroundColor: '#203ff5',
                  }}
                >
                  <Box
                    component="img"
                    src="/assets/icons/overview/light_bulb.svg"
                    className="iconImage"
                  />
                </Box>
                <Stack gap={-1}>
                  <Typography variant="subtitle2" sx={{ color: '#8E8E93' }}>
                    CREATOR PITCHES
                  </Typography>
                  <Typography variant="h4">
                    {localCampaign?.pitch?.filter((pitch) => pitch.status === 'undecided')
                      ?.length || 0}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Zoom>
      </Grid>
      <Grid item xs={12} sm={6} md={6}>
        <Zoom in>
          <Box component={Card} p={3} flexGrow={1} sx={cardStyle}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  className="iconBox"
                  sx={{
                    backgroundColor: '#eb4a26',
                  }}
                >
                  <Box
                    component="img"
                    src="/assets/icons/overview/shortlisted_creators.svg"
                    className="iconImage"
                  />
                </Box>
                <Stack gap={-1}>
                  <Typography variant="subtitle2" sx={{ color: '#8E8E93' }}>
                    SHORTLISTED CREATORS
                  </Typography>
                  <Typography variant="h4">{localCampaign?.shortlisted?.length}</Typography>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Zoom>
      </Grid>
      {/* <Grid item xs={12} sm={6} md={3}>
        <Zoom in>
          <Box component={Card} p={3} sx={cardStyle}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  className="iconBox"
                  sx={{
                    backgroundColor: '#f7c945',
                  }}
                >
                  <Box
                    component="img"
                    src="/assets/icons/overview/pending_agreements.svg"
                    className="iconImage"
                  />
                </Box>
                <Stack gap={-1}>
                  <Typography variant="subtitle2" sx={{ color: '#8E8E93' }}>
                    PENDING AGREEMENTS
                  </Typography>
                  <Typography variant="h4">
                    {localCampaign?.creatorAgreement?.filter((a) => !a.isSent)?.length || 0}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Zoom>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Zoom in>
          <Box component={Card} p={3} sx={cardStyle}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  className="iconBox"
                  sx={{
                    backgroundColor: '#2e6c56',
                  }}
                >
                  <Box
                    component="img"
                    src="/assets/icons/overview/invoices.svg"
                    className="iconImage"
                  />
                </Box>
                <Stack gap={-1}>
                  <Typography variant="subtitle2" sx={{ color: '#8E8E93' }}>
                    INVOICES
                  </Typography>
                  <Typography variant="h4">{campaignInvoices?.length || 0}</Typography>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Zoom>
      </Grid> */}
      <Grid item xs={12} md={6}>
        <Zoom in>
          <Box sx={BoxStyle}>
            <Box className="header">
              <Box
                component="img"
                src="/assets/icons/overview/lightBulb.svg"
                sx={{
                  width: 20,
                  height: 20,
                  color: '#203ff5',
                }}
              />
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#221f20',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  CREATOR PITCHES
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#221f20',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  (
                  {localCampaign?.pitch?.filter((pitch) => pitch.status === 'undecided')?.length ||
                    0}
                  )
                </Typography>
              </Stack>
            </Box>

            <Stack spacing={[1]}>
              {localCampaign?.pitch?.length > 0 ? (
                localCampaign?.pitch
                  ?.filter((pitch) => pitch.status === 'undecided')
                  ?.map((pitch, index) => (
                    <Stack
                      key={pitch.id}
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{
                        pt: 2,
                        pb:
                          index !==
                          localCampaign.pitch.filter((p) => p.status === 'undecided').length - 1
                            ? 2
                            : 1,
                        borderBottom:
                          index !==
                          localCampaign.pitch.filter((p) => p.status === 'undecided').length - 1
                            ? '1px solid #e7e7e7'
                            : 'none',
                      }}
                    >
                      <Avatar
                        src={pitch.user?.photoURL}
                        sx={{
                          width: 40,
                          height: 40,
                          border: '2px solid',
                          borderColor: 'background.paper',
                        }}
                      />
                      <Stack sx={{ flex: 1 }}>
                        <Typography variant="subtitle3" sx={{ fontWeight: 500 }}>
                          {pitch.user?.name}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleViewPitch(pitch)}
                          sx={{
                            textTransform: 'none',
                            minHeight: 42,
                            minWidth: 100,
                            bgcolor: '#3a3a3c',
                            color: '#fff',
                            borderBottom: '3px solid',
                            borderBottomColor: '#202021',
                            borderRadius: 1.15,
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            '&:hover': {
                              bgcolor: '#3a3a3c',
                            },
                          }}
                        >
                          View Pitch
                        </Button>
                      </Stack>
                    </Stack>
                  ))
              ) : (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}
                >
                  No pitches received yet
                </Typography>
              )}
            </Stack>
          </Box>
        </Zoom>
      </Grid>
      <Grid item xs={12} md={6}>
        <Zoom in>
          <Box sx={BoxStyle}>
            <Box className="header">
              <Box
                component="img"
                src="/assets/icons/overview/group2People.svg"
                sx={{
                  width: 20,
                  height: 20,
                  color: '#203ff5',
                }}
              />
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#221f20',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  SHORTLISTED CREATORS
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#221f20',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  ({localCampaign?.shortlisted?.length || 0})
                </Typography>
              </Stack>
            </Box>

            <Stack spacing={[1]}>
              {localCampaign?.shortlisted?.length > 0 ? (
                localCampaign?.shortlisted?.map((creator, index) => (
                  <Stack
                    key={creator.id}
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{
                      pt: 2,
                      pb: index !== localCampaign.shortlisted.length - 1 ? 2 : 1,
                      borderBottom:
                        index !== localCampaign.shortlisted.length - 1
                          ? '1px solid #e7e7e7'
                          : 'none',
                    }}
                  >
                    <Avatar
                      src={creator.user?.photoURL}
                      sx={{
                        width: 40,
                        height: 40,
                        border: '2px solid',
                        borderColor: 'background.paper',
                      }}
                    />
                    <Stack sx={{ flex: 1 }}>
                      <Typography variant="subtitle3" sx={{ fontWeight: 500 }}>
                        {creator.user?.name}
                      </Typography>
                    </Stack>
                    {/* <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleChatClick(creator)}
                      sx={{
                        textTransform: 'none',
                        minHeight: 42,
                        minWidth: 100,
                        bgcolor: '#ffffff',
                        color: '#203ff5',
                        border: '1.5px solid',
                        borderColor: '#e7e7e7',
                        borderBottom: '3px solid',
                        borderBottomColor: '#e7e7e7',
                        borderRadius: 1.15,
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        '&:hover': {
                          bgcolor: '#e7e7e7',
                        },
                      }}
                    >
                      Message
                    </Button> */}
                  </Stack>
                ))
              ) : (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}
                >
                  No creators shortlisted yet
                </Typography>
              )}
            </Stack>
          </Box>
        </Zoom>
      </Grid>
      <Dialog open={dialog.value} onClose={dialog.onFalse}>
        <DialogTitle>Decline Pitch</DialogTitle>
        <DialogContent>
          Are you sure you want to decline this pitch? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleConfirmDecline} variant="contained" color="error">
            Decline
          </Button>
        </DialogActions>
      </Dialog>
      <PitchModal
        pitch={selectedPitch}
        open={openPitchModal}
        onClose={() => {
          setOpenPitchModal(false);
          setSelectedPitch(null);
        }}
        campaign={localCampaign}
        onUpdate={handlePitchUpdate}
      />
    </Grid>
  );
};

export default PublicCampaignOverview;

PublicCampaignOverview.propTypes = {
  campaign: PropTypes.oneOfType([PropTypes.object, PropTypes.any]),
  onUpdate: PropTypes.func,
};
