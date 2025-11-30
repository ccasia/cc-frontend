import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Card,
  Grid,
  Zoom,
  Chip,
  Stack,
  Dialog,
  Avatar,
  Button,
  Divider,
  TextField,
  keyframes,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useGetCampaignById } from 'src/hooks/use-get-campaign-by-id';
import useGetInvoicesByCampId from 'src/hooks/use-get-invoices-by-campId';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

import PitchModal from './pitch-modal';

const BoxStyle = {
  border: '1px solid #e0e0e0',
  borderRadius: 2,
  p: 3,
  mt: -1,
  mb: 1,
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

const campaignCreditAnimation = keyframes`
  from { width: 0 }
  to { width: 80 }
`;

const closecampaignCreditAnimation = keyframes`
  from { width: 80 }
  to { width: 0 }
`;

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
  const [isEditingCredit, setIsEditingCredit] = useState(false);

  const [currentCredit, setCurrentCredit] = useState(null);
  const [errorCredit, setErrorCredit] = useState(null);

  const [animation, setCreditAnimation] = useState(undefined);
  const [error, setError] = useState();
  const approveCreditModal = useBoolean();
  const { mutate } = useGetCampaignById(campaign.id);

  // const creditAssignModal = useBoolean();
  // const [campaigns, setCampaigns] = useState(null);

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
    } catch (err) {
      console.error('Error declining pitch:', err);
      enqueueSnackbar('error', { variant: 'error' });
    }
  };

  const handleEditCredit = () => {
    setCurrentCredit(campaign?.campaignCredits);
    setCreditAnimation(campaignCreditAnimation);
    setIsEditingCredit(true);
  };

  const handleCreditChangesConfirmation = () => {
    // if (currentCredit < campaign?.campaignCredits) {
    //   setError('Cannot be less than current credits');
    //   return;
    // }

    approveCreditModal.onTrue();
  };

  const handleCancelCreditChanges = async () => {
    setError();
    setCurrentCredit(0);
    setCreditAnimation(closecampaignCreditAnimation);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsEditingCredit(false);
  };

  const handleCreditApproval = async () => {
    try {
      // Use V4-specific endpoint for V4 campaigns, fallback to general endpoint
      const endpoint = campaign?.submissionVersion === 'v4' 
        ? '/api/campaign/v4/changeCredits' 
        : '/api/campaign/changeCredits';
        
      const res = await axiosInstance.patch(endpoint, {
        campaignId: campaign.id,
        newCredit: currentCredit - campaign.campaignCredits,
      });

      toast.success(res.data.message);

      approveCreditModal.onFalse();
      setIsEditingCredit(false);
      setCurrentCredit(0);
      mutate();
    } catch (err) {
      console.error('Credit approval error:', err);
      toast.error('Error updating credits', err?.response?.data?.message || err.message);
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

  const handleProfileClick = (creator) => {
    navigate(`/dashboard/creator/profile/${creator.userId}`);
  };

  useEffect(() => {
    let val = currentCredit || 0;
    const utilizedCredits = campaign?.creditsUtilized;

    // Remove leading zeros (e.g., "012" -> "12")
    if (val.length > 1 && val.startsWith('0')) {
      val = val.replace(/^0+/, '');
    }

    if (val && val < utilizedCredits) {
      setErrorCredit('Value cannot be less than the utilized credits.');
    } else {
      setErrorCredit(null);
    }

    setCurrentCredit(Number(val));
  }, [currentCredit, campaign]);

  return (
    <Grid container spacing={{ xs: 1, sm: 2 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Zoom in>
          <Box component={Card} p={3} flexGrow={1} sx={cardStyle}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  className="iconBox"
                  alignSelf="self-start"
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
                    {localCampaign?.pitch?.filter((pitch) => pitch.type === 'text' || pitch.type === 'video')
                      ?.length || 0}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Zoom>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Zoom in>
          <Box component={Card} py={3} flexGrow={1} sx={cardStyle}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  className="iconBox"
                  alignSelf="self-start"
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

      <Grid item xs={12} sm={6} md={3}>
        <Zoom in>
          <Box component={Card} py={3} sx={cardStyle}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  className="iconBox"
                  alignSelf="self-start"
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
                    {(localCampaign?.creatorAgreement?.filter((a) => !a.isSent)?.length || 0) ||
                    (localCampaign?.pitch?.filter((p) => p.status === 'AGREEMENT_PENDING')?.length || 0)}
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
                  alignSelf="self-start"
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
                <Stack>
                  <Typography variant="subtitle2" sx={{ color: '#8E8E93' }}>
                    INVOICES
                  </Typography>
                  <Typography variant="h4">{campaignInvoices?.length || 0}</Typography>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Zoom>
      </Grid>

      <Grid container spacing={{ xs: 1, sm: 2 }}>
        <Grid item xs={12} md={6}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
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
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                      sx={{ flex: 1 }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#221f20',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                        }}
                      >
                        CREDITS TRACKING
                      </Typography>
                      {campaign?.campaignCredits && latestPackageItem && !isEditingCredit && (user?.role === 'superadmin' || ['god', 'advanced'].includes(user?.admin?.mode)) && (
                        <Button
                          variant="outlined"
                          size="small"
                          // color="primary"
                          onClick={handleEditCredit}
                        >
                          Edit Credits
                        </Button>
                      )}
                    </Stack>
                  </Box>

                  <Stack spacing={[1]}>
                    {campaign?.campaignCredits && latestPackageItem ? (
                      <Stack spacing={1.5} color="text.secondary">
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography
                            sx={{ mt: 1, fontSize: '16px', fontWeight: 600, color: '#636366' }}
                          >
                            Campaign Credits
                          </Typography>

                          {/* <Collapse in={isEditingCredit}> */}
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ display: isEditingCredit ? 'flex' : 'none' }}
                          >
                            <TextField
                              size="small"
                              value={currentCredit === 0 ? '' : currentCredit}
                              type="number"
                              inputProps={{ min: 1 }}
                              onChange={(e) => {
                                setCurrentCredit(Number(e.target.value));
                              }}
                              onKeyDown={(e) => {
                                // Block keys that can cause invalid numbers
                                if (['e', 'E', '+', '-'].includes(e.key)) {
                                  e.preventDefault();
                                }

                                // Prevent starting with '0'
                                const { value } = e.currentTarget;

                                if (e.key === '0' && value === '') {
                                  e.preventDefault();
                                }
                              }}
                              sx={{
                                width: 100,
                                animation: `${animation} 0.5s ease-in-out`,
                              }}
                              error={!!error || !!errorCredit}
                              helperText={error || errorCredit}
                            />

                            <Stack direction="row" alignItems="center" spacing={1}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={handleCancelCreditChanges}
                              >
                                <Iconify icon="charm:cross" />
                              </IconButton>

                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => {
                                  handleCreditChangesConfirmation();
                                }}
                                disabled={!!error || !!errorCredit}
                              >
                                <Iconify icon="charm:tick" />
                              </IconButton>
                            </Stack>
                          </Stack>
                          {/* </Collapse> */}

                          <Typography
                            sx={{ 
                              mt: 1, 
                              fontSize: '16px', 
                              fontWeight: 600, 
                              color: '#636366',
                              cursor: (user?.role === 'superadmin' || ['god', 'advanced'].includes(user?.admin?.mode)) ? 'pointer' : 'default'
                            }}
                            style={{ display: isEditingCredit ? 'none' : 'block' }} // hide when editing
                            onClick={(user?.role === 'superadmin' || ['god', 'advanced'].includes(user?.admin?.mode)) ? () => setIsEditingCredit(true) : undefined} // only allow click for superadmin
                          >
                            {campaign?.campaignCredits ?? 0} UGC Credits
                          </Typography>
                        </Stack>
                        <Divider />
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#636366' }}>
                            Credits Utilized
                          </Typography>
                          <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#636366' }}>
                            {campaign?.submissionVersion === 'v4' ? (() => {
                                
                                const approvedAgreements = (campaign?.submission || []).filter(sub => {
                                  const isAgreementForm = sub.content && typeof sub.content === 'string' && 
                                    sub.content.toLowerCase().includes('agreement');
                                  const isApproved = sub.status === 'APPROVED';
                                  return isAgreementForm && isApproved;
                                });
                                
                                if (approvedAgreements.length === 0) {
                                  return '0 UGC Credits';
                                }

                                const utilizedCredits = approvedAgreements.reduce((total, agreement) => {
                                  let creator = campaign?.shortlisted?.find(c => c.userId === agreement.userId);
                                  
                                  if (!creator && typeof agreement.userId === 'string') {
                                    creator = campaign?.shortlisted?.find(c => 
                                      typeof c.userId === 'string' && c.userId.toLowerCase() === agreement.userId.toLowerCase()
                                    );
                                  }
                                  
                                  if (creator) {
                                    return total + (creator.ugcVideos || 0);
                                  }
                                  
                                  return total;
                                }, 0);
                                
                                return `${utilizedCredits} UGC Credits`;
                              })() : 
                              `${campaign?.creditsUtilized || 0} UGC Credits`}
                          </Typography>
                        </Stack>
                        <Divider />
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography
                            sx={{ mb: -1, fontSize: '16px', fontWeight: 600, color: '#636366' }}
                          >
                            Credits Pending
                          </Typography>
                          <Typography
                            sx={{ mb: -1, fontSize: '16px', fontWeight: 600, color: '#636366' }}
                          >
                            {campaign?.submissionVersion === 'v4' ? (() => {
                               
                                const approvedAgreements = (campaign?.submission || []).filter(sub => 
                                  (sub.content && typeof sub.content === 'string' && 
                                   sub.content.toLowerCase().includes('agreement')) &&
                                  (sub.status === 'APPROVED')
                                );
                                
                                const utilizedCredits = approvedAgreements.reduce((total, agreement) => {
                                  const creator = campaign?.shortlisted?.find(c => c.userId === agreement.userId);
                                  return total + (creator?.ugcVideos || 0);
                                }, 0);
                                
                                return `${Math.max(0, (campaign?.campaignCredits || 0) - utilizedCredits)} UGC Credits`;
                              })() : 
                              `${campaign?.creditsPending ?? 0} UGC Credits`}
                          </Typography>
                        </Stack>
                      </Stack>
                    ) : (
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}
                      >
                        Not connected to any package
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Zoom>
            </Grid>
            <Grid item>
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
                          fontSize: '0.8rem',
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
                        {localCampaign?.pitch?.filter((pitch) => pitch.type === 'text' || pitch.type === 'video')
                          ?.length || 0}
                        )
                      </Typography>
                    </Stack>
                  </Box>

                  <Stack spacing={[1]}>
                    {localCampaign?.pitch?.length > 0 ? (
                      localCampaign?.pitch
                        ?.filter((pitch) => pitch.type === 'text' || pitch.type === 'video')
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
                                localCampaign.pitch.filter((p) => p.type === 'text' || p.type === 'video').length -
                                  1
                                  ? 2
                                  : 1,
                              borderBottom:
                                index !==
                                localCampaign.pitch.filter((p) => p.type === 'text' || p.type === 'video').length -
                                  1
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
                                    bgcolor: '#4a4a4c',
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
          </Grid>
        </Grid>

        <Grid item xs={12} md={6}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <Zoom in>
                <Box sx={BoxStyle}>
                  <Box className="header">
                    <Iconify
                      icon="mdi:cube-outline"
                      sx={{
                        color: '#203ff5',
                        width: 18,
                        height: 18,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#221f20',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                      }}
                    >
                      DELIVERABLES
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 2, mb: -0.4 }}>
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
                            size="small"
                            sx={{
                              bgcolor: '#F5F5F5',
                              borderRadius: 1,
                              color: '#231F20',
                              height: '36px',
                              '& .MuiChip-label': {
                                fontWeight: 700,
                                px: 2,
                                height: '100%',
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: '-3px',
                              },
                              '&:hover': { bgcolor: '#F5F5F5' },
                            }}
                          />
                        )
                    )}
                  </Box>
                </Box>
              </Zoom>
            </Grid>
            <Grid item>
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
                          fontSize: '0.8rem',
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
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleProfileClick(creator)}
                            sx={{
                              textTransform: 'none',
                              minHeight: 38,
                              minWidth: 150,
                              bgcolor: '#ffffff',
                              color: '#231F20',
                              border: '1.5px solid',
                              borderColor: '#e7e7e7',
                              borderBottom: '3px solid',
                              borderBottomColor: '#e7e7e7',
                              borderRadius: 1.15,
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              '&:hover': {
                                bgcolor: '#f0f0f0',
                              },
                            }}
                          >
                            Shortlisted Profile
                          </Button>
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
          </Grid>
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

      <Dialog
        open={approveCreditModal.value}
        onClose={approveCreditModal.onFalse}
        PaperProps={{
          sx: {
            borderRadius: 1,
          },
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle variant="subtitle1">Confirm Credit Change</DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            You’re about to update the credit allocation from {campaign?.campaignCredits} to{' '}
            {currentCredit}. Do you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={approveCreditModal.onFalse}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 0.5 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreditApproval}
            variant="contained"
            size="small"
            sx={{ borderRadius: 0.5 }}
          >
            Confirm
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

export default CampaignOverview;

CampaignOverview.propTypes = {
  campaign: PropTypes.oneOfType([PropTypes.object, PropTypes.any]),
  onUpdate: PropTypes.func,
};
