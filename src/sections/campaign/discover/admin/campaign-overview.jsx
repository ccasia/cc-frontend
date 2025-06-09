import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Chip,
  Stack,
  Button,
  Dialog,
  Avatar,
  Container,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetInvoicesByCampId from 'src/hooks/use-get-invoices-by-campId';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

import PitchModal from './pitch-modal';

const BoxStyle = {
  border: '1px solid #e7e7e7',
  borderRadius: 1,
  p: 0,
  mb: 2,
  width: '100%',
  bgcolor: 'background.paper',
  overflow: 'hidden',
  '& .header': {
    borderBottom: '1px solid #e7e7e7',
    p: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    bgcolor: '#fafbfc',
    minHeight: '56px',
  },
  '& .content': {
    p: 2,
  },
};

const cardStyle = {
  border: '1px solid #e7e7e7',
  borderRadius: 1,
  bgcolor: 'background.paper',
  mb: 2,
  transition: 'all 0.2s ease',
  overflow: 'hidden',
  '& .iconBox': {
    width: 48,
    height: 48,
    minWidth: 48,
    minHeight: 48,
    display: 'flex',
    borderRadius: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  '& .iconImage': {
    width: 24,
    height: 24,
    minWidth: 24,
    minHeight: 24,
  },
};

const findLatestPackage = (packages) => {
  if (packages.length === 0) {
    return null; // Return null if the array is empty
  }

  const latestPackage = packages.reduce((latest, current) => {
    const latestDate = new Date(latest.createdAt);
    const currentDate = new Date(current.createdAt);

    return currentDate > latestDate ? current : latest;
  });

  return latestPackage;
};

const CampaignOverview = ({ campaign, onUpdate }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const { campaigns: campaignInvoices } = useGetInvoicesByCampId(campaign?.id);
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [openPitchModal, setOpenPitchModal] = useState(false);
  const dialog = useBoolean();
  const [localCampaign, setLocalCampaign] = useState(campaign);
  const client = campaign?.company || campaign?.brand?.company;

  const latestPackageItem = useMemo(() => {
    if (client && client?.subscriptions?.length) {
      let packageItem = findLatestPackage(client?.subscriptions);
      packageItem = {
        ...packageItem,
        totalCredits:
          packageItem.totalCredits ||
          packageItem.package.credits ||
          packageItem.customPackage.customCredits,
        availableCredits:
          (packageItem.totalCredits ||
            packageItem.package.credits ||
            packageItem.customPackage.customCredits) - packageItem.creditsUsed,
      };
      return packageItem;
    }

    return null;
  }, [client]);

  useEffect(() => {
    setLocalCampaign(campaign);
  }, [campaign]);

  const handleChatClick = async (data) => {
    try {
      const response = await axiosInstance.get(endpoints.threads.getAll);

      const existingThread = response.data.find((thread) => {
        const userIdsInThread = thread.UserThread.map((userThread) => userThread.userId);
        return (
          userIdsInThread.includes(user.id) &&
          userIdsInThread.includes(data.user.id) &&
          !thread.isGroup
        );
      });

      if (existingThread) {
        navigate(`/dashboard/chat/thread/${existingThread.id}`);
      } else {
        const newThreadResponse = await axiosInstance.post(endpoints.threads.create, {
          title: `Chat between ${user.name} & ${data.user.name}`,
          description: '',
          userIds: [user.id, data.user.id],
          isGroup: false,
        });
        navigate(`/dashboard/chat/thread/${newThreadResponse.data.id}`);
      }
    } catch (error) {
      console.log(error);
      console.error('Error creating or finding chat thread:', error);
    }
  };

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
    <Container maxWidth={false} disableGutters>
      {/* Stats Cards Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={cardStyle}>
            <Box sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  className="iconBox"
                  sx={{
                    backgroundColor: '#1340ff',
                  }}
                >
                  <Box
                    component="img"
                    src="/assets/icons/overview/light_bulb.svg"
                    className="iconImage"
                  />
                </Box>
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#8e8e93',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    CREATOR PITCHES
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '1.75rem' }}
                  >
                    {localCampaign?.pitch?.filter((pitch) => pitch.status === 'undecided')
                      ?.length || 0}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Box sx={cardStyle}>
            <Box sx={{ p: 2.5 }}>
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
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#8e8e93',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    SHORTLISTED CREATORS
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '1.75rem' }}
                  >
                    {localCampaign?.shortlisted?.length || 0}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Box sx={cardStyle}>
            <Box sx={{ p: 2.5 }}>
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
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#8e8e93',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    PENDING AGREEMENTS
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '1.75rem' }}
                  >
                    {localCampaign?.creatorAgreement?.filter((a) => !a.isSent)?.length || 0}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Box sx={cardStyle}>
            <Box sx={{ p: 2.5 }}>
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
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#8e8e93',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    INVOICES
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '1.75rem' }}
                  >
                    {campaignInvoices?.length || 0}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            {/* Credits Tracking */}
            <Box sx={BoxStyle}>
              <Box className="header">
                <Iconify
                  icon="solar:wallet-money-bold"
                  sx={{
                    color: '#1340ff',
                    width: 20,
                    height: 20,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#1a1a1a',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    letterSpacing: '0.25px',
                    textTransform: 'uppercase',
                  }}
                >
                  CREDITS TRACKING
                </Typography>
              </Box>

              <Box className="content">
                {campaign?.campaignCredits && latestPackageItem ? (
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        py: 1.5,
                        px: 2,
                        bgcolor: '#f8f9fa',
                        borderRadius: 0.75,
                        border: '1px solid #e9ecef',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#495057' }}>
                        Campaign Credits
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#1340ff' }}>
                        {campaign?.campaignCredits || 0}
                      </Typography>
                    </Stack>

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        py: 1.5,
                        px: 2,
                        bgcolor: '#f8f9fa',
                        borderRadius: 0.75,
                        border: '1px solid #e9ecef',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#495057' }}>
                        Credits Utilized
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#dc3545' }}>
                        {campaign?.creditsUtilized || 0}
                      </Typography>
                    </Stack>

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        py: 1.5,
                        px: 2,
                        bgcolor: '#f8f9fa',
                        borderRadius: 0.75,
                        border: '1px solid #e9ecef',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#495057' }}>
                        Credits Pending
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#fd7e14' }}>
                        {campaign?.creditsPending ?? 0}
                      </Typography>
                    </Stack>
                  </Stack>
                ) : (
                  <Box
                    sx={{
                      py: 3,
                      textAlign: 'center',
                      bgcolor: '#f8f9fa',
                      borderRadius: 0.75,
                      border: '1px dashed #dee2e6',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                      Not connected to any package
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Creator Pitches */}
            <Box sx={BoxStyle}>
              <Box className="header">
                <Iconify
                  icon="solar:lightbulb-bolt-bold"
                  sx={{
                    color: '#1340ff',
                    width: 20,
                    height: 20,
                  }}
                />
                <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#1a1a1a',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      letterSpacing: '0.25px',
                      textTransform: 'uppercase',
                    }}
                  >
                    CREATOR PITCHES
                  </Typography>
                  {(localCampaign?.pitch?.filter((pitch) => pitch.status === 'undecided')?.length ||
                    0) > 0 && (
                    <Box
                      sx={{
                        bgcolor: '#1340ff',
                        color: 'white',
                        borderRadius: '12px',
                        px: 1.5,
                        py: 0.25,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        minWidth: '24px',
                        textAlign: 'center',
                      }}
                    >
                      {localCampaign?.pitch?.filter((pitch) => pitch.status === 'undecided')
                        ?.length || 0}
                    </Box>
                  )}
                </Stack>
              </Box>

              <Box className="content">
                {localCampaign?.pitch?.length > 0 ? (
                  <Stack spacing={0}>
                    {localCampaign?.pitch
                      ?.filter((pitch) => pitch.status === 'undecided')
                      ?.map((pitch, index) => (
                        <Stack
                          key={pitch.id}
                          direction="row"
                          alignItems="center"
                          spacing={2}
                          sx={{
                            py: 1.5,
                            borderBottom:
                              index !==
                              localCampaign.pitch.filter((p) => p.status === 'undecided').length - 1
                                ? '1px solid #e9ecef'
                                : 'none',
                            '&:hover': {
                              bgcolor: '#f8f9fa',
                              borderRadius: 0.75,
                              mx: -1,
                              px: 1,
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Avatar
                            src={pitch.user?.photoURL}
                            sx={{
                              width: 40,
                              height: 40,
                              border: '2px solid #e9ecef',
                            }}
                          />
                          <Stack sx={{ flex: 1 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 600,
                                color: '#1a1a1a',
                                fontSize: '0.875rem',
                              }}
                            >
                              {pitch.user?.name}
                            </Typography>
                          </Stack>
                          <Button
                            size="small"
                            onClick={() => handleViewPitch(pitch)}
                            sx={{
                              bgcolor: '#ffffff',
                              color: '#1340ff',
                              border: '1px solid #1340ff',
                              borderBottom: '3px solid #1340ff',
                              borderRadius: 0.75,
                              px: 2,
                              py: 0.5,
                              height: '32px',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              textTransform: 'none',
                              minWidth: '80px',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: '#f8f9ff',
                                borderColor: '#0f2db8',
                                borderBottomColor: '#0f2db8',
                              },
                            }}
                          >
                            View
                          </Button>
                        </Stack>
                      ))}
                  </Stack>
                ) : (
                  <Box
                    sx={{
                      py: 3,
                      textAlign: 'center',
                      bgcolor: '#f8f9fa',
                      borderRadius: 0.75,
                      border: '1px dashed #dee2e6',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                      No pitches received yet
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            {/* Deliverables */}
            <Box sx={BoxStyle}>
              <Box className="header">
                <Iconify
                  icon="solar:box-bold"
                  sx={{
                    color: '#1340ff',
                    width: 20,
                    height: 20,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#1a1a1a',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    letterSpacing: '0.25px',
                    textTransform: 'uppercase',
                  }}
                >
                  DELIVERABLES
                </Typography>
              </Box>

              <Box className="content">
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {[
                    { label: 'UGC Videos', value: true },
                    { label: 'Raw Footage', value: campaign?.rawFootage },
                    { label: 'Photos', value: campaign?.photos },
                    { label: 'Ads', value: campaign?.ads },
                    { label: 'Cross Posting', value: campaign?.crossPosting },
                  ].map(
                    (deliverable) =>
                      deliverable.value && (
                        <Chip
                          key={deliverable.label}
                          label={deliverable.label}
                          sx={{
                            bgcolor: '#e3f2fd',
                            color: '#1565c0',
                            border: '1px solid #bbdefb',
                            borderRadius: 0.75,
                            height: '28px',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            '&:hover': {
                              bgcolor: '#bbdefb',
                              transform: 'translateY(-1px)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        />
                      )
                  )}
                </Box>
              </Box>
            </Box>

            {/* Shortlisted Creators */}
            <Box sx={BoxStyle}>
              <Box className="header">
                <Iconify
                  icon="solar:users-group-two-rounded-bold"
                  sx={{
                    color: '#1340ff',
                    width: 20,
                    height: 20,
                  }}
                />
                <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#1a1a1a',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      letterSpacing: '0.25px',
                      textTransform: 'uppercase',
                    }}
                  >
                    SHORTLISTED CREATORS
                  </Typography>
                  {(localCampaign?.shortlisted?.length || 0) > 0 && (
                    <Box
                      sx={{
                        bgcolor: '#eb4a26',
                        color: 'white',
                        borderRadius: '12px',
                        px: 1.5,
                        py: 0.25,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        minWidth: '24px',
                        textAlign: 'center',
                      }}
                    >
                      {localCampaign?.shortlisted?.length || 0}
                    </Box>
                  )}
                </Stack>
              </Box>

              <Box className="content">
                {localCampaign?.shortlisted?.length > 0 ? (
                  <Stack spacing={0}>
                    {localCampaign?.shortlisted?.map((creator, index) => (
                      <Stack
                        key={creator.id}
                        direction="row"
                        alignItems="center"
                        spacing={2}
                        sx={{
                          py: 1.5,
                          borderBottom:
                            index !== localCampaign.shortlisted.length - 1
                              ? '1px solid #e9ecef'
                              : 'none',
                          '&:hover': {
                            bgcolor: '#f8f9fa',
                            borderRadius: 0.75,
                            mx: -1,
                            px: 1,
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Avatar
                          src={creator.user?.photoURL}
                          sx={{
                            width: 40,
                            height: 40,
                            border: '2px solid #e9ecef',
                          }}
                        />
                        <Stack sx={{ flex: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: '#1a1a1a',
                              fontSize: '0.875rem',
                            }}
                          >
                            {creator.user?.name}
                          </Typography>
                        </Stack>
                        <Button
                          size="small"
                          onClick={() => navigate(`/dashboard/creator/${creator.user.id}`)}

                          sx={{
                            bgcolor: '#ffffff',
                            color: '#1340ff',
                            border: '1px solid #1340ff',
                            borderBottom: '3px solid #1340ff',
                            borderRadius: 0.75,
                            px: 2,
                            py: 0.5,
                            height: '32px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            minWidth: '80px',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: '#f8f9ff',
                              borderColor: '#0f2db8',
                              borderBottomColor: '#0f2db8',
                            },
                          }}
                        >
                          View Profile
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Box
                    sx={{
                      py: 3,
                      textAlign: 'center',
                      bgcolor: '#f8f9fa',
                      borderRadius: 0.75,
                      border: '1px dashed #dee2e6',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                      No creators shortlisted yet
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Stack>
        </Grid>
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
    </Container>
  );
};

export default CampaignOverview;

CampaignOverview.propTypes = {
  campaign: PropTypes.oneOfType([PropTypes.object, PropTypes.any]),
  onUpdate: PropTypes.func,
};
