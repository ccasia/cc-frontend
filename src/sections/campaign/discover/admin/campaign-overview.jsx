import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

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

  // Credit editing state - now tracks all three fields
  const [editCredits, setEditCredits] = useState({
    campaignCredits: null,
    creditsUtilized: null,
    creditsPending: null,
  });
  const [creditErrors, setCreditErrors] = useState({
    campaignCredits: null,
    creditsUtilized: null,
    creditsPending: null,
  });

  const [animation, setCreditAnimation] = useState(undefined);
  const [, setError] = useState();
  const approveCreditModal = useBoolean();
  const { mutate } = useGetCampaignById(campaign.id);
  
  // Ref to track if credits have been synced for this campaign
  const creditsSyncedRef = useRef(false);
  const lastCampaignIdRef = useRef(null);

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

  // Sync credits on mount - runs once per campaign
  const syncCredits = useCallback(async () => {
    if (!campaign?.id || !campaign?.campaignCredits) return;
    
    // Only sync if this is a new campaign or hasn't been synced yet
    if (creditsSyncedRef.current && lastCampaignIdRef.current === campaign.id) {
      return;
    }
    
    try {
      const response = await axiosInstance.post(`/api/campaign/syncCredits/${campaign.id}`);
      console.log('Credits synced:', response.data);
      
      // Mark as synced for this campaign
      creditsSyncedRef.current = true;
      lastCampaignIdRef.current = campaign.id;
      
      // Refresh campaign data to get updated credits
      if (mutate) {
        mutate();
      }
    } catch (err) {
      console.error('Error syncing credits:', err);
      // Don't show error toast - this is a background sync
    }
  }, [campaign?.id, campaign?.campaignCredits, mutate]);

  useEffect(() => {
    // Reset sync state if campaign changes
    if (campaign?.id !== lastCampaignIdRef.current) {
      creditsSyncedRef.current = false;
    }
    
    syncCredits();
  }, [syncCredits, campaign?.id]);

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
    // Initialize edit state with current campaign values
    setEditCredits({
      campaignCredits: campaign?.campaignCredits ?? 0,
      creditsUtilized: campaign?.creditsUtilized ?? 0,
      creditsPending: campaign?.creditsPending ?? 0,
    });
    setCreditErrors({
      campaignCredits: null,
      creditsUtilized: null,
      creditsPending: null,
    });
    setCreditAnimation(campaignCreditAnimation);
    setIsEditingCredit(true);
  };

  const handleCreditFieldChange = (field, value) => {
    const numValue = Number(value) || 0;
    
    setEditCredits((prev) => {
      const newCredits = { ...prev, [field]: numValue };
      
      // Auto-calculate creditsPending if campaignCredits or creditsUtilized changes
      if (field === 'campaignCredits' || field === 'creditsUtilized') {
        const campaignCreds = field === 'campaignCredits' ? numValue : prev.campaignCredits;
        const utilizedCreds = field === 'creditsUtilized' ? numValue : prev.creditsUtilized;
        newCredits.creditsPending = Math.max(0, campaignCreds - utilizedCreds);
      }
      
      return newCredits;
    });

    // Validate the field
    let fieldError = null;
    if (numValue < 0) {
      fieldError = 'Value cannot be negative';
    }
    
    setCreditErrors((prev) => ({ ...prev, [field]: fieldError }));
  };

  const handleCreditChangesConfirmation = () => {
    // Validate all fields before confirming
    const hasErrors = Object.values(creditErrors).some((err) => err !== null);
    if (hasErrors) {
      toast.error('Please fix validation errors before saving');
      return;
    }
    
    approveCreditModal.onTrue();
  };

  const handleCancelCreditChanges = async () => {
    setError();
    setEditCredits({
      campaignCredits: null,
      creditsUtilized: null,
      creditsPending: null,
    });
    setCreditErrors({
      campaignCredits: null,
      creditsUtilized: null,
      creditsPending: null,
    });
    setCreditAnimation(closecampaignCreditAnimation);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsEditingCredit(false);
  };

  const handleCreditApproval = async () => {
    try {
      // Use the new endpoint that allows updating all credit fields
      const res = await axiosInstance.patch('/api/campaign/updateAllCredits', {
        campaignId: campaign.id,
        campaignCredits: editCredits.campaignCredits,
        creditsUtilized: editCredits.creditsUtilized,
        creditsPending: editCredits.creditsPending,
      });

      toast.success(res.data.message);

      approveCreditModal.onFalse();
      setIsEditingCredit(false);
      setEditCredits({
        campaignCredits: null,
        creditsUtilized: null,
        creditsPending: null,
      });
      mutate();
    } catch (err) {
      console.error('Credit approval error:', err);
      toast.error(err?.response?.data?.message || 'Error updating credits');
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
                        {/* Campaign Credits Row */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography
                            sx={{ mt: 1, fontSize: '16px', fontWeight: 600, color: '#636366' }}
                          >
                            Campaign Credits
                          </Typography>

                          {isEditingCredit ? (
                            <TextField
                              size="small"
                              value={editCredits.campaignCredits === 0 ? '' : editCredits.campaignCredits}
                              type="number"
                              inputProps={{ min: 0 }}
                              onChange={(e) => handleCreditFieldChange('campaignCredits', e.target.value)}
                              onKeyDown={(e) => {
                                if (['e', 'E', '+', '-'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              sx={{
                                width: 100,
                                animation: `${animation} 0.5s ease-in-out`,
                              }}
                              error={!!creditErrors.campaignCredits}
                              helperText={creditErrors.campaignCredits}
                            />
                          ) : (
                            <Typography
                              sx={{ 
                                mt: 1, 
                                fontSize: '16px', 
                                fontWeight: 600, 
                                color: '#636366',
                                cursor: (user?.role === 'superadmin' || ['god', 'advanced'].includes(user?.admin?.mode)) ? 'pointer' : 'default'
                              }}
                              onClick={(user?.role === 'superadmin' || ['god', 'advanced'].includes(user?.admin?.mode)) ? handleEditCredit : undefined}
                            >
                              {campaign?.campaignCredits ?? 0} UGC Credits
                            </Typography>
                          )}
                        </Stack>
                        <Divider />
                        
                        {/* Credits Utilized Row */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#636366' }}>
                            Credits Utilized
                          </Typography>
                          {isEditingCredit ? (
                            <TextField
                              size="small"
                              value={editCredits.creditsUtilized === 0 ? '' : editCredits.creditsUtilized}
                              type="number"
                              inputProps={{ min: 0 }}
                              onChange={(e) => handleCreditFieldChange('creditsUtilized', e.target.value)}
                              onKeyDown={(e) => {
                                if (['e', 'E', '+', '-'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              sx={{ width: 100 }}
                              error={!!creditErrors.creditsUtilized}
                              helperText={creditErrors.creditsUtilized}
                            />
                          ) : (
                            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#636366' }}>
                              {campaign?.creditsUtilized ?? 0} UGC Credits
                            </Typography>
                          )}
                        </Stack>
                        <Divider />
                        
                        {/* Credits Pending Row */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography
                            sx={{ mb: isEditingCredit ? 0 : -1, fontSize: '16px', fontWeight: 600, color: '#636366' }}
                          >
                            Credits Pending
                          </Typography>
                          {isEditingCredit ? (
                            <TextField
                              size="small"
                              value={editCredits.creditsPending === 0 ? '' : editCredits.creditsPending}
                              type="number"
                              inputProps={{ min: 0 }}
                              onChange={(e) => handleCreditFieldChange('creditsPending', e.target.value)}
                              onKeyDown={(e) => {
                                if (['e', 'E', '+', '-'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              sx={{ width: 100 }}
                              error={!!creditErrors.creditsPending}
                              helperText={creditErrors.creditsPending}
                              disabled
                            />
                          ) : (
                            <Typography
                              sx={{ mb: -1, fontSize: '16px', fontWeight: 600, color: '#636366' }}
                            >
                              {campaign?.creditsPending ?? 0} UGC Credits
                            </Typography>
                          )}
                        </Stack>
                        
                        {/* Edit Action Buttons */}
                        {isEditingCredit && (
                          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1 }}>
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
                              onClick={handleCreditChangesConfirmation}
                              disabled={Object.values(creditErrors).some((err) => err !== null)}
                            >
                              <Iconify icon="charm:tick" />
                            </IconButton>
                          </Stack>
                        )}
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
        maxWidth="sm"
      >
        <DialogTitle variant="subtitle1">Confirm Credit Changes</DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            You are about to update the campaign credits. Please review the changes:
          </Typography>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" fontWeight={600}>Campaign Credits:</Typography>
              <Typography variant="body2">
                {campaign?.campaignCredits ?? 0} → {editCredits.campaignCredits ?? 0}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" fontWeight={600}>Credits Utilized:</Typography>
              <Typography variant="body2">
                {campaign?.creditsUtilized ?? 0} → {editCredits.creditsUtilized ?? 0}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" fontWeight={600}>Credits Pending:</Typography>
              <Typography variant="body2">
                {campaign?.creditsPending ?? 0} → {editCredits.creditsPending ?? 0}
              </Typography>
            </Stack>
          </Stack>
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
