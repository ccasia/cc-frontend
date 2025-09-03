/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-plusplus */
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router';
import { useMemo, useState, useEffect } from 'react';

import CircularProgress from '@mui/material/CircularProgress';
import {
  Box,
  Chip,
  Grid,
  Stack,
  Dialog,
  Avatar,
  Button,
  Divider,
  Tooltip,
  TextField,
  IconButton,
  Typography,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

import { useGetCampaignById } from 'src/hooks/use-get-campaign-by-id';

import axiosInstance, { endpoints } from 'src/utils/axios';
import dayjs from 'dayjs';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

const PitchModal = ({ pitch, open, onClose, campaign, onUpdate }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(pitch);
  const { user } = useAuthContext();
  const [totalUGCVideos, setTotalUGCVideos] = useState(null);
  const { mutate } = useGetCampaignById(campaign.id);
  const navigate = useNavigate();

  const [maybeOpen, setMaybeOpen] = useState(false);
  const [maybeReason, setMaybeReason] = useState('');
  const [maybeNote, setMaybeNote] = useState('');
  const [creatorProfileFull, setCreatorProfileFull] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram'); // 'instagram', 'tiktok', or 'both'
  const MAYBE_REASONS = [
    { value: 'engagement_low', label: 'Engagement Rate Too Low' },
    { value: 'not_fit_brief', label: 'Does Not Fit Criteria in Campaign Brief' },
    { value: 'not_fit_campaign', label: 'Content is Not Fit for the Campaign' },
    { value: 'others', label: 'Others' },
  ];

  useEffect(() => {
    setCurrentPitch(pitch);
  }, [pitch]);

  // Set default platform when modal opens
  useEffect(() => {
    if (open && currentPitch?.user?.creator) {
      if (currentPitch.user.creator.instagram && currentPitch.user.creator.tiktok) {
        setSelectedPlatform('both'); // Show both if both platforms exist
      } else if (currentPitch.user.creator.instagram) {
        setSelectedPlatform('instagram');
      } else if (currentPitch.user.creator.tiktok) {
        setSelectedPlatform('tiktok');
      }
    }
  }, [open, currentPitch?.user?.creator]);

  // Fetch full creator profile to hydrate Languages/Age/Pronouns when modal opens
  useEffect(() => {
    const userId = currentPitch?.user?.id;
    if (open && userId) {
      axiosInstance
        .get(endpoints.creators.getCreatorFullInfo(userId))
        .then((res) => {
          // API may return { user } or the user directly
          const payload = res?.data?.user || res?.data || null;
          if (payload) setCreatorProfileFull(payload);
        })
        .catch(() => {
          // non-blocking; keep UI as-is on error
        });
    }
  }, [open, currentPitch?.user?.id]);

  // Derive creator profile data from multiple possible sources
  const creatorProfile = creatorProfileFull?.creator || currentPitch?.user?.creator || {};
  const accountUser = creatorProfileFull || currentPitch?.user || {};
  const derivedLanguages = (Array.isArray(creatorProfile.languages) && creatorProfile.languages.length
    ? creatorProfile.languages
    : Array.isArray(accountUser.languages)
      ? accountUser.languages
      : [])
    .filter(Boolean);
  const derivedBirthDate = creatorProfile.birthDate || accountUser.birthDate || null;
  const derivedPronouns = creatorProfile.pronounce || accountUser.pronounce || accountUser.pronouns || null;

  // Normalized CS Comments text (for client view rendering)
  const adminCommentsText = ((currentPitch?.adminComments ?? pitch?.adminComments ?? '') || '')
    .toString()
    .trim();

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  const ugcLeft = useMemo(() => {
    if (!campaign?.campaignCredits) return null;
    const totalUGCs = campaign?.shortlisted?.reduce((acc, sum) => acc + (sum?.ugcVideos ?? 0), 0);
    return campaign?.campaignCredits - totalUGCs;
  }, [campaign]);

  // Calculate match percentage
  // const matchPercentage = useMemo(() => {
  //   // if (!pitch?.user?.creator || !campaign?.campaignRequirement) return 0;

  //   // const { creator } = pitch.user;
  //   const creator = pitch?.user?.creator;

  //   const requirements = campaign?.campaignRequirement;

  //   // Calculate interest matching percentage (80% weight)
  // const calculateInterestMatchingPercentage = () => {
  //   if (!requirements?.creator_persona?.length || !creator?.interests?.length) return 0;

  //   // Convert creator interests to lowercase names
  //   const creatorInterests = creator.interests
  //     .map((int) => (typeof int === 'string' ? int.toLowerCase() : int?.name?.toLowerCase()))
  //     .filter(Boolean);

  //   // Count matching interests
  //   const matchingInterests = creatorInterests.filter((interest) =>
  //     requirements.creator_persona.map((p) => p.toLowerCase()).includes(interest)
  //   ).length;

  //   return (matchingInterests / requirements.creator_persona.length) * 100;
  // };

  //   // Calculate requirements matching percentage (20% weight)
  // const calculateRequirementMatchingPercentage = () => {
  //   let matches = 0;
  //   let totalCriteria = 0;

  //   // Age check
  //   if (requirements.age?.length) {
  //     totalCriteria++;
  //     const creatorAge = dayjs().diff(dayjs(creator.birthDate), 'year');
  //     const isAgeInRange = requirements.age.some((range) => {
  //       const [min, max] = range.split('-').map(Number);
  //       return creatorAge >= min && creatorAge <= max;
  //     });
  //     if (isAgeInRange) matches++;
  //   }

  //   // Gender check
  //   if (requirements.gender?.length) {
  //     totalCriteria++;
  //     const creatorGender =
  //       creator.pronounce === 'he/him'
  //         ? 'male'
  //         : creator.pronounce === 'she/her'
  //           ? 'female'
  //           : 'nonbinary';
  //     if (requirements.gender.includes(creatorGender)) matches++;
  //   }

  //   // Language check
  //   if (requirements.language?.length && creator.languages?.length) {
  //     totalCriteria++;
  //     const hasLanguageMatch = creator.languages.some((lang) =>
  //       requirements.language.map((l) => l.toLowerCase()).includes(lang.toLowerCase())
  //     );
  //     if (hasLanguageMatch) matches++;
  //   }

  //   return totalCriteria > 0 ? (matches / totalCriteria) * 100 : 0;
  // };

  // const interestMatch = calculateInterestMatchingPercentage();
  // const requirementMatch = calculateRequirementMatchingPercentage();

  //   // Calculate overall percentage (80% interests, 20% requirements)
  // return Math.round(interestMatch * 0.8 + requirementMatch * 0.2);
  // }, [campaign?.campaignRequirement, pitch]);

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);

      let response;

      // Check if this is a V3 pitch (client-created campaign)
      if (campaign?.origin === 'CLIENT') {
        // Debug: Check what endpoints are available
        console.log('Available endpoints:', endpoints);
        console.log('Pitch endpoints:', endpoints?.pitch);
        console.log('Campaign endpoints:', endpoints?.campaign);

        // Use V3 endpoint for client-created campaigns
        const v3PitchId = pitch.pitchId || pitch.id; // Use pitchId as it seems to be the correct identifier
        console.log('Using V3 endpoint with pitch ID:', v3PitchId);

        // Check user role to call the correct endpoint
        if (user?.role === 'client') {
          // Client approves pitch
          console.log('Client approving pitch with ID:', v3PitchId);
          response = await axiosInstance.patch(
            endpoints.campaign.pitch.v3.approveClient(v3PitchId)
          );
        } else {
          // Admin approves pitch
          console.log('Admin approving pitch with ID:', v3PitchId);
          response = await axiosInstance.patch(endpoints.campaign.pitch.v3.approve(v3PitchId));
        }
      } else {
        // Use V2 endpoint for admin-created campaigns
        // Only send totalUGCVideos for admin-created campaigns, not client-created ones
        const requestData = {
          pitchId: pitch.id,
          status: 'approved',
        };

        // Add UGC videos only for admin-created campaigns
        if (campaign?.origin !== 'CLIENT') {
          requestData.totalUGCVideos = totalUGCVideos;
        }

        response = await axiosInstance.patch(endpoints.campaign.pitch.changeStatus, requestData);
      }

      const updatedPitch = { ...pitch, status: 'approved' };
      setCurrentPitch(updatedPitch);

      if (onUpdate) {
        onUpdate(updatedPitch);
      }

      mutate();
      enqueueSnackbar(response?.data?.message || 'Pitch approved successfully');
      setConfirmDialog({ open: false, type: null });
    } catch (error) {
      console.error('Error approving pitch:', error);
      enqueueSnackbar('Error approving pitch', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    try {
      setIsSubmitting(true);

      let response;

      // Check if this is a V3 pitch (client-created campaign)
      if (campaign?.origin === 'CLIENT') {
        // Use V3 endpoint for client-created campaigns
        const v3PitchId = pitch.pitchId || pitch.id; // Use pitchId as it seems to be the correct identifier

        // Check user role to call the correct endpoint
        if (user?.role === 'client') {
          // Client rejects pitch
          response = await axiosInstance.patch(
            endpoints.campaign.pitch.v3.rejectClient(v3PitchId),
            {
              rejectionReason: 'Rejected by client',
            }
          );
        } else {
          // Admin rejects pitch
          response = await axiosInstance.patch(endpoints.campaign.pitch.v3.reject(v3PitchId), {
            rejectionReason: 'Rejected by admin',
          });
        }
     } else {
  // Use V2 endpoint for admin-created campaigns
  response = await axiosInstance.patch(endpoints.campaign.pitch.changeStatus, {
    pitchId: pitch.id,
    status: 'rejected',
  });
}

const updatedPitch = { ...pitch, status: 'rejected' };
setCurrentPitch(updatedPitch);

if (onUpdate) {
  onUpdate(updatedPitch);
}
      enqueueSnackbar(response?.data?.message || 'Pitch declined successfully');
      setConfirmDialog({ open: false, type: null });
    } catch (error) {
      console.error('Error declining pitch:', error);
      enqueueSnackbar('Error declining pitch', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseMaybe = () => {
    setMaybeOpen(false);
    setMaybeReason('');
    setMaybeNote('');
  };

  const handleMaybeSubmit = async () => {
    try {
      setIsSubmitting(true);

      let response;

      if (campaign?.origin === 'CLIENT' && user?.role === 'client') {
        const v3PitchId = pitch.pitchId || pitch.id;

        // Build request body
        let body;
        if (maybeReason === 'others') {
          body = { customRejectionText: maybeNote.trim() };
        } else {
          const reasonLabel =
            MAYBE_REASONS.find((r) => r.value === maybeReason)?.label || 'Unspecified';
          body = { rejectionReason: reasonLabel };
        }

        // Call your endpoint
        response = await axiosInstance.patch(
          endpoints.campaign.pitch.v3.maybeClient(v3PitchId),
          body
        );

        // Update pitch status
        const updatedPitch = { ...pitch, status: 'MAYBE' };
        setCurrentPitch(updatedPitch);
        onUpdate?.(updatedPitch);

        enqueueSnackbar(response?.data?.message || 'Pitch marked as Maybe');
        setMaybeOpen(false);
        setMaybeReason('');
        setMaybeNote('');
      } else {
        console.warn('Maybe action is only available for client-created campaigns by clients');
        return;
      }
    } catch (error) {
      console.error('Error setting maybe:', error);
      enqueueSnackbar('Error setting Maybe', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adds a delay before fully closing the dialog
  const handleCloseConfirmDialog = () => {
    // First just close the dialog
    setConfirmDialog((prev) => ({ ...prev, open: false }));

    setTimeout(() => {
      setConfirmDialog({ open: false, type: null });
    }, 300);
  };

  const handleShortlistedProfileClick = (e) => {
    e.stopPropagation();
    navigate(
      `/dashboard/campaign/discover/detail/${campaign.id}/creator/${currentPitch?.user?.id}`
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: (theme) => theme.customShadows.dialog,
          },
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 18,
            top: 16,
            zIndex: 9,
            padding: 1,
            color: '#636366',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Iconify icon="eva:close-fill" width={32} height={32} />
        </IconButton>

        {/* Social links under close button (desktop) */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            position: 'absolute',
            right: 14,
            top: 60,
            zIndex: 9,
            flexDirection: 'row',
            gap: 1,
          }}
        >
          <Tooltip title="Instagram Stats">
            <IconButton
              onClick={() => setSelectedPlatform('instagram')}
              size="small"
              disabled={selectedPlatform === 'instagram'}
              sx={{
                p: 0.8,
                color: selectedPlatform === 'instagram' ? '#8E8E93' : '#231F20',
                bgcolor: selectedPlatform === 'instagram' ? '#F2F2F7' : '#FFF',
                border: '1px solid #ebebeb',
                borderBottom: '3px solid #ebebeb',
                borderRadius: '10px',
                height: '42px',
                width: '42px',
                '&:hover': { 
                  bgcolor: selectedPlatform === 'instagram' ? '#F2F2F7' : '#f5f5f5' 
                },
                '&.Mui-disabled': {
                  bgcolor: '#F2F2F7',
                  color: '#8E8E93',
                },
              }}
            >
              <Iconify icon="mdi:instagram" width={22} />
            </IconButton>
          </Tooltip>
          <Tooltip title="TikTok Stats">
            <IconButton
              onClick={() => setSelectedPlatform('tiktok')}
              size="small"
              disabled={selectedPlatform === 'tiktok'}
              sx={{
                p: 0.8,
                color: selectedPlatform === 'tiktok' ? '#8E8E93' : '#000000',
                bgcolor: selectedPlatform === 'tiktok' ? '#F2F2F7' : '#FFF',
                border: '1px solid #ebebeb',
                borderBottom: '3px solid #ebebeb',
                borderRadius: '10px',
                height: '42px',
                width: '42px',
                '&:hover': { 
                  bgcolor: selectedPlatform === 'tiktok' ? '#F2F2F7' : '#f5f5f5' 
                },
                '&.Mui-disabled': {
                  bgcolor: '#F2F2F7',
                  color: '#8E8E93',
                },
              }}
            >
              <Iconify icon="ic:baseline-tiktok" width={22} />
            </IconButton>
          </Tooltip>

        </Box>

        {/* Fixed User Info Section */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            bgcolor: 'background.paper',
            zIndex: 8,
            pt: 7,
            px: 4,
          }}
        >
          <Stack spacing={3}>
            {/* Creator Info and Social Media - Horizontal Layout */}
            <Box sx={{ position: 'relative' }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
                sx={{ pr: { xs: 0, sm: 8 } }}
              >
                {/* Creator Info */}
                <Avatar
                  src={currentPitch?.user?.photoURL}
                  sx={{
                    width: 64,
                    height: 64,
                    border: '2px solid',
                    borderColor: 'background.paper',
                    boxShadow: (theme) => theme.customShadows.z8,
                  }}
                />
                <Stack spacing={0.5}>
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 700, lineHeight: '18px', color: '#231F20' }}
                  >
                    {currentPitch?.user?.name}
                  </Typography>
                  <Typography
                    sx={{ fontSize: '14px', fontWeight: 400, lineHeight: '16px', color: '#8E8E93' }}
                  >
                    {currentPitch?.user?.email}
                  </Typography>

                  {/* Social Media Icons - Mobile */}
                  <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 1 }}>
                    <Stack direction="row" spacing={1.5}>
                      <Tooltip title="Instagram Stats">
                          <IconButton
                            onClick={() => setSelectedPlatform('instagram')}
                            size="small"
                            disabled={selectedPlatform === 'instagram'}
                            sx={{
                              p: 0.8,
                              color: selectedPlatform === 'instagram' ? '#8E8E93' : '#231F20',
                              bgcolor: selectedPlatform === 'instagram' ? '#F2F2F7' : '#FFF',
                              border: '1px solid #ebebeb',
                              borderBottom: '3px solid #ebebeb',
                              borderRadius: '10px',
                              height: '42px',
                              width: '42px',
                              '&:hover': {
                                bgcolor: selectedPlatform === 'instagram' ? '#F2F2F7' : '#f5f5f5' 
                              },
                              '&.Mui-disabled': {
                                bgcolor: '#F2F2F7',
                                color: '#8E8E93',
                              },
                            }}
                          >
                            <Iconify icon="mdi:instagram" width={24} />
                          </IconButton>
                        </Tooltip>
                      <Tooltip title="TikTok Stats">
                          <IconButton
                            onClick={() => setSelectedPlatform('tiktok')}
                            size="small"
                            disabled={selectedPlatform === 'tiktok'}
                            sx={{
                              p: 0.8,
                              color: selectedPlatform === 'tiktok' ? '#8E8E93' : '#000000',
                              bgcolor: selectedPlatform === 'tiktok' ? '#F2F2F7' : '#FFF',
                              border: '1px solid #ebebeb',
                              borderBottom: '3px solid #ebebeb',
                              borderRadius: '10px',
                              height: '42px',
                              width: '42px',
                              '&:hover': {
                                bgcolor: selectedPlatform === 'tiktok' ? '#F2F2F7' : '#f5f5f5' 
                              },
                              '&.Mui-disabled': {
                                bgcolor: '#F2F2F7',
                                color: '#8E8E93',
                              },
                            }}
                          >
                            <Iconify icon="ic:baseline-tiktok" width={24} />
                          </IconButton>
                        </Tooltip>
                      {/* Both Platforms Button */}
                      <Tooltip title="Both Platforms">
                      <IconButton
                            onClick={() => setSelectedPlatform('both')}
                        size="small"
                            disabled={selectedPlatform === 'both'}
                        sx={{
                          p: 0.8,
                              color: selectedPlatform === 'both' ? '#8E8E93' : '#636366',
                              bgcolor: selectedPlatform === 'both' ? '#F2F2F7' : '#FFF',
                          border: '1px solid #ebebeb',
                          borderBottom: '3px solid #ebebeb',
                          borderRadius: '10px',
                              height: '42px',
                              width: '42px',
                          '&:hover': {
                                bgcolor: selectedPlatform === 'both' ? '#F2F2F7' : '#f5f5f5' 
                              },
                              '&.Mui-disabled': {
                                bgcolor: '#F2F2F7',
                                color: '#8E8E93',
                              },
                            }}
                          >
                            <Iconify icon="eva:layers-fill" width={24} />
                      </IconButton>
                    </Tooltip>
                  {currentPitch?.status === 'approved' && (
                    <Tooltip title="View Shortlisted Profile">
                      <Button
                        size="small"
                        sx={{
                          p: 2,
                          color: '#FFFFFF',
                          bgcolor: '#3A3A3C',
                              border: '1px solid #282424',
                          borderBottom: '3px solid #282424',
                          borderRadius: '10px',
                              height: '42px',
                          fontWeight: 600,
                              fontSize: '12px',
                          textTransform: 'none',
                          '&:hover': {
                            bgcolor: '#4a4a4c',
                          },
                        }}
                        onClick={handleShortlistedProfileClick}
                      >
                            Profile
                      </Button>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
                </Stack>
              </Stack>


            </Box>

            {/* Stats Section */}
            <Grid container spacing={2} sx={{ pb: 2 }}>
              <Grid item xs={12} md={12}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    minWidth: 0,
                    ml: 'auto',
                    width: '100%',
                    mb: -1.5,
                    pr: 0,
                  }}
                >
                  <Stack direction="row" spacing={0} width="100%" justifyContent="space-between">
                    {/* Left side: Languages, Age, Pronouns */}
                    <Stack direction="row" spacing={3} alignItems="center">
                      {/* Languages Section */}
                      <Box>
                        <Stack spacing={0.5} alignItems="flex-start">
                          <Typography
                            variant="caption"
                            color="#8e8e93"
                            sx={{ fontWeight: 700, fontSize: '12px' }}
                          >
                            Languages
                          </Typography>
                          {derivedLanguages.length > 0 ? (
                            <Stack direction="row" flexWrap="nowrap" gap={0.5} alignItems="center" sx={{ mt: 1.80 }}>
                              {derivedLanguages
                                  .slice(0, 2)
                                  .map((language, index) => (
                                    <Chip
                                      key={index}
                                      label={
                                        typeof language === 'string'
                                          ? language.toUpperCase()
                                          : String(language).toUpperCase()
                                      }
                                      size="small"
                                      sx={{
                                        bgcolor: '#FFF',
                                        border: '1px solid #EBEBEB',
                                        borderRadius: 0.5,
                                        color: '#8E8E93',
                                      height: '30px',
                                        boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                                        cursor: 'default',
                                        '& .MuiChip-label': {
                                          fontWeight: 600,
                                        px: 1.25,
                                          height: '100%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          marginTop: '-2px',
                                        fontSize: '0.8rem',
                                        },
                                        '&:hover': {
                                          bgcolor: '#FFF',
                                        },
                                      }}
                                    />
                                  ))}
                              {derivedLanguages.length > 2 && (
                                <Typography
                                  variant="caption"
                                  color="#8E8E93"
                                  sx={{ fontSize: '0.7rem', alignSelf: 'center' }}
                                >
                                  +{derivedLanguages.length - 2}
                                </Typography>
                              )}
                            </Stack>
                          ) : (
                            <Typography
                              variant="caption"
                              color="#8E8E93"
                              sx={{ fontStyle: 'italic', fontSize: '11px' }}
                            >
                              —
                            </Typography>
                          )}
                        </Stack>
                      </Box>

                      {/* Age Section */}
                      <Box>
                        <Stack spacing={0.5} alignItems="flex-start">
                          <Typography
                            variant="caption"
                            color="#8e8e93"
                            sx={{ fontWeight: 700, fontSize: '12px', position: 'relative', top: 25 }}
                          >
                            Age
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 400, fontSize: '14px', mt: 2.8 }}>
                            {derivedBirthDate ? dayjs().diff(dayjs(derivedBirthDate), 'year') : '—'}
                            </Typography>
                        </Stack>
                      </Box>

                      {/* Pronouns Section */}
                      <Box>
                        <Stack spacing={0.5} alignItems="flex-start">
                            <Typography
                              variant="caption"
                            color="#8e8e93"
                            sx={{ fontWeight: 700, fontSize: '12px', position: 'relative', top: 25 }}
                            >
                            Pronouns
                            </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 400, fontSize: '14px', mt: 2.8 }}>
                            {derivedPronouns || '—'}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>

                                      {/* Right side: Stats with gap */}
                  <Stack direction="row" spacing={0} sx={{ ml: 4 }}>
                                          {/* Instagram Stats */}
                      {selectedPlatform === 'instagram' && (
                        <>
                          <Box
                            sx={{
                              flex: 0,
                              display: 'flex',
                              justifyContent: 'flex-end',
                              minWidth: '80px',
                            }}
                          >
                            <Stack spacing={0.5} alignItems="flex-end" sx={{ minWidth: 0 }}>
                              <Box
                                component="img"
                                src="/assets/icons/overview/purpleGroup.svg"
                                sx={{ width: 20, height: 20 }}
                              />
                              <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '14px' }}>
                                {(() => {
                                // Try multiple possible sources for media kit data
                                const followers = currentPitch?.user?.creator?.instagramFollowers || 
                                               creatorProfileFull?.creator?.instagramFollowers ||
                                               creatorProfileFull?.instagramFollowers ||
                                               currentPitch?.user?.mediaKit?.instagram?.followers;
                                if (!followers) return 'N/A';
                                if (followers >= 1000) {
                                  const k = followers / 1000;
                                  return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
                                }
                                return followers.toLocaleString();
                              })()}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="#8e8e93"
                                sx={{
                                  whiteSpace: 'nowrap',
                                  fontWeight: 500,
                                  overflow: 'visible',
                                  width: '100%',
                                  fontSize: '12px',
                                  textAlign: 'right',
                                }}
                              >
                                Followers
                              </Typography>
                            </Stack>
                          </Box>

                          {/* Divider */}
                          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                          <Box
                            sx={{
                              flex: 0,
                              display: 'flex',
                              justifyContent: 'flex-end',
                              minWidth: '120px',
                            }}
                          >
                            <Stack spacing={0.5} alignItems="flex-end" sx={{ minWidth: 0 }}>
                              <Box
                                component="img"
                                src="/assets/icons/overview/greenChart.svg"
                                sx={{ width: 20, height: 20 }}
                              />
                              <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '14px' }}>
                                {(() => {
                                  // Try multiple possible sources for media kit data
                                  const engagementRate = currentPitch?.user?.creator?.instagramEngagementRate ||
                                                       creatorProfileFull?.creator?.instagramEngagementRate ||
                                                       creatorProfileFull?.instagramEngagementRate ||
                                                       currentPitch?.user?.mediaKit?.instagram?.engagementRate;
                                  if (!engagementRate) return 'N/A';
                                  return `${(engagementRate * 100).toFixed(2)}%`;
                                })()}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="#8e8e93"
                                sx={{
                                  whiteSpace: 'nowrap',
                                  fontWeight: 500,
                                  overflow: 'visible',
                                  width: '100%',
                                  fontSize: '12px',
                                  textAlign: 'right',
                                }}
                              >
                                Engagement Rate
                              </Typography>
                            </Stack>
                          </Box>

                          {/* Divider */}
                          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                          <Box
                            sx={{
                              flex: 0,
                              display: 'flex',
                              justifyContent: 'flex-end',
                              minWidth: '105px',
                            }}
                          >
                            <Stack spacing={0.5} alignItems="flex-end" sx={{ minWidth: 0 }}>
                              <Box
                                component="img"
                                src="/assets/icons/overview/bubbleHeart.svg"
                                sx={{ width: 20, height: 20 }}
                              />
                              <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '14px' }}>
                                {(() => {
                                // Try multiple possible sources for media kit data
                                const likes = currentPitch?.user?.creator?.instagramAverageLikes ||
                                            creatorProfileFull?.creator?.instagramAverageLikes ||
                                            creatorProfileFull?.instagramAverageLikes ||
                                            currentPitch?.user?.mediaKit?.instagram?.averageLikes;
                                if (!likes) return 'N/A';
                                if (likes >= 1000) {
                                  const k = likes / 1000;
                                  return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
                                }
                                return likes.toLocaleString();
                              })()}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="#8e8e93"
                                sx={{
                                  whiteSpace: 'nowrap',
                                  fontWeight: 500,
                                  overflow: 'visible',
                                  width: '100%',
                                  fontSize: '12px',
                                  textAlign: 'right',
                                }}
                              >
                                Average Likes
                              </Typography>
                            </Stack>
                          </Box>
                        </>
                      )}

                                        {/* TikTok Stats */}
                    {selectedPlatform === 'tiktok' && (
                      <>
                        <Box
                          sx={{
                            flex: 0,
                            display: 'flex',
                            justifyContent: 'flex-end',
                            minWidth: '80px',
                          }}
                        >
                          <Stack spacing={0.5} alignItems="flex-end" sx={{ minWidth: 0 }}>
                            <Box
                              component="img"
                              src="/assets/icons/overview/purpleGroup.svg"
                              sx={{ width: 20, height: 20 }}
                            />
                            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '14px' }}>
                              {(() => {
                                // Try multiple possible sources for media kit data
                                const followers = currentPitch?.user?.creator?.tiktokFollowers || 
                                               creatorProfileFull?.creator?.tiktokFollowers ||
                                               creatorProfileFull?.tiktokFollowers ||
                                               currentPitch?.user?.mediaKit?.tiktok?.followers;
                                if (!followers) return 'N/A';
                                if (followers >= 1000) {
                                  const k = followers / 1000;
                                  return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
                                }
                                return followers.toLocaleString();
                              })()}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="#8e8e93"
                              sx={{
                                whiteSpace: 'nowrap',
                                fontWeight: 500,
                                overflow: 'visible',
                                width: '100%',
                                fontSize: '12px',
                                textAlign: 'right',
                              }}
                            >
                              Followers
                            </Typography>
                        </Stack>
                      </Box>

                        {/* Divider */}
                        <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                        <Box
                          sx={{
                            flex: 0,
                            display: 'flex',
                            justifyContent: 'flex-end',
                            minWidth: '120px',
                          }}
                        >
                          <Stack spacing={0.5} alignItems="flex-end" sx={{ minWidth: 0 }}>
                            <Box
                              component="img"
                              src="/assets/icons/overview/greenChart.svg"
                              sx={{ width: 20, height: 20 }}
                            />
                            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '14px' }}>
                              {(() => {
                                // Try multiple possible sources for media kit data
                                const engagementRate = currentPitch?.user?.creator?.tiktokEngagementRate ||
                                                     creatorProfileFull?.creator?.tiktokEngagementRate ||
                                                     creatorProfileFull?.tiktokEngagementRate ||
                                                     currentPitch?.user?.mediaKit?.tiktok?.engagementRate;
                                if (!engagementRate) return 'N/A';
                                return `${(engagementRate * 100).toFixed(2)}%`;
                              })()}
                            </Typography>
                          <Typography
                            variant="caption"
                            color="#8e8e93"
                              sx={{
                                whiteSpace: 'nowrap',
                                fontWeight: 500,
                                overflow: 'visible',
                                width: '100%',
                                fontSize: '12px',
                                textAlign: 'right',
                              }}
                            >
                              Engagement Rate
                          </Typography>
                          </Stack>
                        </Box>

                        {/* Divider */}
                        <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                        <Box
                              sx={{
                            flex: 0,
                                  display: 'flex',
                            justifyContent: 'flex-end',
                            minWidth: '105px',
                          }}
                        >
                          <Stack spacing={0.5} alignItems="flex-end" sx={{ minWidth: 0 }}>
                            <Box
                              component="img"
                              src="/assets/icons/overview/bubbleHeart.svg"
                              sx={{ width: 20, height: 20 }}
                            />
                            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '14px' }}>
                              {(() => {
                                // Try multiple possible sources for media kit data
                                const likes = currentPitch?.user?.creator?.tiktokAverageLikes ||
                                            creatorProfileFull?.creator?.tiktokAverageLikes ||
                                            creatorProfileFull?.tiktokAverageLikes ||
                                            currentPitch?.user?.mediaKit?.tiktok?.averageLikes;
                                if (!likes) return 'N/A';
                                if (likes >= 1000) {
                                  const k = likes / 1000;
                                  return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
                                }
                                return likes.toLocaleString();
                              })()}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="#8e8e93"
                              sx={{
                                whiteSpace: 'nowrap',
                                fontWeight: 500,
                                overflow: 'visible',
                                width: '100%',
                                fontSize: '12px',
                                textAlign: 'right',
                              }}
                            >
                              Average Likes
                            </Typography>
                          </Stack>
                        </Box>
                      </>
                    )}




                    </Stack>
                  </Stack>
                </Box>
              </Grid>
            </Grid>

            <Divider />
          </Stack>
        </Box>

        {/* Scrollable Content */}
        <DialogContent
          sx={{
            p: 3,
            pt: 2,
            '&::-webkit-scrollbar': {
              width: 8,
            },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: 4,
              bgcolor: 'rgba(0,0,0,0.2)',
            },
          }}
        >
          <Stack spacing={3}>
            {/* Pitch Info Box */}
            <Box
              sx={{
                borderRadius: 2,
                p: 2.5,
                mb: -2,
                mt: -2,
              }}
            >
              <Grid container spacing={2} alignItems="center">
                {/* Pitch Type Section */}
                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    {currentPitch?.type === 'video' ? (
                      <Box
                        component="img"
                        src="/assets/icons/components/ic_videopitch.svg"
                        sx={{ width: 64, height: 64 }}
                      />
                    ) : (
                      <Box
                        component="img"
                        src="/assets/icons/components/ic_letterpitch.svg"
                        sx={{ width: 64, height: 64 }}
                      />
                    )}
                    <Stack>
                      <Typography variant="h6">
                        {currentPitch?.type === 'video' ? 'Video Pitch' : 'Letter Pitch'}
                      </Typography>

                      {/* Match Percentage Chip */}

                      <Chip
                        icon={
                          <Box
                            sx={{ position: 'relative', display: 'inline-flex', mr: 2, ml: -0.5 }}
                          >
                            <CircularProgress
                              variant="determinate"
                              value={100}
                              size={20}
                              thickness={7}
                              sx={{ color: 'grey.300' }}
                            />

                            <CircularProgress
                              variant="determinate"
                              value={Math.min(pitch?.matchingPercentage, 100)}
                              size={20}
                              thickness={7}
                              sx={{
                                color: '#5abc6f',
                                position: 'absolute',
                                left: 0,
                                strokeLinecap: 'round',
                              }}
                            />
                          </Box>
                        }
                        label={`${Math.min(pitch?.matchingPercentage, 100)}% MATCH WITH CAMPAIGN`}
                        sx={{
                          backgroundColor: (theme) => theme.palette.common.white,
                          color: '#48484a',
                          fontWeight: 'bold',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          borderRadius: '10px',
                          height: { xs: '32px', sm: '35px' },
                          border: '1px solid #ebebeb',
                          borderBottom: '3px solid #ebebeb',
                          mt: 1,
                          maxWidth: { xs: '100%', sm: 'auto' },
                          '& .MuiChip-label': {
                            padding: { xs: '0 6px 0 8px', sm: '0 8px 0 12px' },
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          },
                          '&:hover': {
                            backgroundColor: (theme) => theme.palette.common.white,
                          },
                        }}
                      />
                    </Stack>
                  </Stack>
                </Grid>

                {/* Submission Info Section */}
                <Grid item xs={12} md={6}>
                  <Stack
                    direction={{ xs: 'row', sm: 'row' }}
                    spacing={0}
                    alignItems="center"
                    justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                    sx={{ width: '100%' }}
                  >
                    <Stack alignItems={{ xs: 'flex-start', md: 'flex-start' }} sx={{ mr: { md: 11 } }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right', width: '100%' }}>
                        SUBMITTED ON
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'left', width: '100%' }}>
                        {new Date(currentPitch?.createdAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Typography>
                    </Stack>
                    <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                      <Typography variant="caption" color="text.secondary">
                        STATUS
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color:
                            currentPitch?.status === 'approved'
                              ? 'success.main'
                              : currentPitch?.status === 'rejected'
                                ? 'error.main'
                                : '#FFC702',
                        }}
                      >
                        {currentPitch?.status?.charAt(0).toUpperCase() +
                          currentPitch?.status?.slice(1)}
                      </Typography>
                    </Stack>
                  </Stack>
                  
                  {/* CLIENT REASON Display for V3 pitches */}
                  {(currentPitch?.customRejectionText || currentPitch?.rejectionReason || 
                    (currentPitch?.status || '').toUpperCase() === 'MAYBE' || 
                    (currentPitch?.displayStatus || '').toUpperCase() === 'MAYBE') && (
                    <Box sx={{ mt: 1.5, width: { xs: '100%', md: 220 }, ml: { md: 'auto' } }}>
                      <Stack spacing={0.25} alignItems="flex-start">
                        <Typography
                          variant="caption"
                          sx={{ color: '#FFC702', fontWeight: 700, letterSpacing: 0.5, textAlign: 'left' }}
                        >
                          CLIENT REASON
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#000',
                            fontWeight: 400,
                            fontFamily: 'Inter Display, Inter, sans-serif',
                            lineHeight: 1.35,
                            textAlign: 'left',
                            wordBreak: 'break-word',
                            fontSize: { xs: '0.75rem', md: '0.75rem' },
                          }}
                        >
                          {currentPitch?.customRejectionText || currentPitch?.rejectionReason || '—'}
                        </Typography>
                      </Stack>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Pitch Content Section */}
            <Box>
              {currentPitch?.type === 'video' &&
                currentPitch?.content &&
                currentPitch.status !== 'pending' && (
                  <Box
                    sx={{
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: (theme) => theme.customShadows.z8,
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      aspectRatio: '16/9',
                    }}
                  >
                    <Box
                      component="video"
                      controls
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        objectFit: 'contain',
                      }}
                      src={currentPitch.content}
                    />
                  </Box>
                )}

              {currentPitch?.type === 'text' && currentPitch?.content && (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: '#ffffff',
                    border: '1px solid #203ff5',
                    // borderBottom: '3px solid #203ff5',
                    '& p': {
                      margin: 0,
                      '& + p': {
                        mt: 0.5,
                      },
                    },
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#000000',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {currentPitch.content?.replace(/<[^>]*>/g, '') || ''}
                  </Typography>
                </Box>
              )}
            </Box>
            {/* CS Comments for client */}
            {user?.role === 'client' && adminCommentsText.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                  CS Comments
                </Typography>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: '#ffffff',
                    border: '1px solid #e7e7e7',
                    '& p': { margin: 0, '& + p': { mt: 0.5 } },
                  }}
                >
                  <Typography variant="body1" sx={{ color: '#000000', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {adminCommentsText}
                  </Typography>
                </Box>
              </Box>
            )}
          </Stack>
        </DialogContent>

                {/* Action Buttons - Only show if pitch hasn't been acted upon */}
        {currentPitch?.status === 'PENDING_REVIEW' && (
        <DialogActions sx={{ px: 3, pb: 3, gap: -1, mt: -3 }}>
          <Button
            variant="contained"
            onClick={() => setConfirmDialog({ open: true, type: 'decline' })}
              disabled={isDisabled || isSubmitting}
            sx={{
              textTransform: 'none',
              minHeight: 42,
              minWidth: 100,
              bgcolor: '#ffffff',
              color: '#D4321C',
              border: '1.5px solid',
              borderColor: '#e7e7e7',
              borderBottom: '3px solid',
              borderBottomColor: '#e7e7e7',
              borderRadius: 1.15,
              fontWeight: 600,
              fontSize: '16px',
              '&:hover': {
                bgcolor: '#f5f5f5',
                border: '1.5px solid',
                borderColor: '#D4321C',
                borderBottom: '3px solid',
                borderBottomColor: '#D4321C',
              },
            }}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            onClick={() => setConfirmDialog({ open: true, type: 'approve' })}
              disabled={isDisabled || isSubmitting}
            sx={{
              textTransform: 'none',
              minHeight: 42,
              minWidth: 100,
              bgcolor: '#FFFFFF',
              color: '#1ABF66',
              border: '1.5px solid',
              borderColor: '#E7E7E7',
              borderBottom: '3px solid',
              borderBottomColor: '#E7E7E7',
              borderRadius: 1.15,
              fontWeight: 600,
              fontSize: '16px',
              '&:hover': {
                bgcolor: '#f5f5f5',
                border: '1.5px solid',
                borderColor: '#1ABF66',
                borderBottom: '3px solid',
                borderBottomColor: '#1ABF66',
              },
            }}
          >
            Approve
          </Button>
          {user?.role === 'client' && (
            <Button
              variant="contained"
              onClick={() => setMaybeOpen(true)}
                disabled={isDisabled || isSubmitting}
              sx={{
                textTransform: 'none',
                minHeight: 42,
                minWidth: 100,
                bgcolor: '#ffffff',
                color: '#FFC702',
                border: '1.5px solid',
                borderColor: '#e7e7e7',
                borderBottom: '3px solid',
                borderBottomColor: '#e7e7e7',
                borderRadius: 1.15,
                fontWeight: 600,
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                  border: '1.5px solid',
                  borderColor: '#FFC702',
                  borderBottom: '3px solid',
                  borderBottomColor: '#FFC702',
                },
              }}
            >
              Maybe
            </Button>
          )}
        </DialogActions>
        )}
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCloseConfirmDialog} maxWidth="xs" fullWidth>
        <DialogContent>
          {/* Credits badge (only useful for approve view) */}
          {campaign?.campaignCredits && confirmDialog.type === 'approve' && (
            <Box mt={2} textAlign="end">
              <Label color="info">{ugcLeft} Credits left</Label>
            </Box>
          )}

          {/* CONDITIONAL BODY */}
          {confirmDialog.type === 'decline' && user?.role === 'client' ? (
            // --- Client Decline: reason UI (reusing the dialog) ---
            <Stack spacing={2} sx={{ pt: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Instrument Serif, serif',
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  fontWeight: 550,
                }}
              >
                Reason for Rejection
              </Typography>

              {/* Title above field (no InputLabel) */}
              <Typography variant="caption" sx={{ fontWeight: 400 }}>
                Selection Reason
              </Typography>
              <Box>
                <Select
                  fullWidth
                  value={maybeReason}
                  onChange={(e) => setMaybeReason(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select Reason
                  </MenuItem>
                  {MAYBE_REASONS.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      {r.label}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              {maybeReason === 'others' && (
                <Stack spacing={1}>
                  <Typography variant="caption" sx={{ fontWeight: 400 }}>
                    Selection Description
                  </Typography>
                  <TextField
                    placeholder="Type your reason…"
                    multiline
                    minRows={3}
                    value={maybeNote}
                    onChange={(e) => setMaybeNote(e.target.value)}
                    fullWidth
                    required
                    error={!maybeNote.trim() && isSubmitting}
                    helperText={!maybeNote.trim() && isSubmitting ? 'This field is required' : ''}
                  />
                </Stack>
              )}
            </Stack>
          ) : (
            // --- Approve OR Admin Decline: original look ---
            <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: confirmDialog.type === 'approve' ? '#5abc6f' : '#ff3b30',
                  fontSize: '50px',
                  mb: -2,
                }}
              >

                {confirmDialog.type === 'approve' ? '🫣' : '🥹'}
              </Box>
              <Stack spacing={1} alignItems="center">
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'Instrument Serif, serif',
                    fontSize: { xs: '1.5rem', sm: '2.5rem' },
                    fontWeight: 550,
                  }}
                >
                  {confirmDialog.type === 'approve' ? 'Approve Pitch?' : 'Decline Pitch?'}
                </Typography>
                <Typography variant="body1" sx={{ color: '#636366', mt: -0.5, mb: -3 }}>
                  {confirmDialog.type === 'approve'
                    ? 'Are you sure you want to approve this pitch?'
                    : 'Are you sure you want to decline this pitch?'}
                </Typography>
              </Stack>

              {/* UGC input (approve, admin-created only) */}
              {campaign?.campaignCredits &&
                confirmDialog.type === 'approve' &&
                campaign?.origin !== 'CLIENT' && (
                  <Box mt={2} width={1}>
                    <TextField
                      value={totalUGCVideos}
                      size="small"
                      placeholder="UGC Videos"
                      type="number"
                      fullWidth
                      onKeyDown={(e) => {
                        if (e.key === '0' && totalUGCVideos?.length === 0) e.preventDefault();
                      }}
                      onChange={(e) => setTotalUGCVideos(e.currentTarget.value)}
                      error={totalUGCVideos > ugcLeft}
                      helperText={totalUGCVideos > ugcLeft && `Maximum of ${ugcLeft} UGC Videos`}
                    />
                  </Box>
                )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button
            onClick={() => {
              setMaybeReason('');
              setMaybeNote('');
              handleCloseConfirmDialog();
            }}
            disabled={isSubmitting}
            sx={{
              bgcolor: '#ffffff',
              color: '#636366',
              border: '1.5px solid',
              borderColor: '#e7e7e7',
              borderBottom: '3px solid',
              borderBottomColor: '#e7e7e7',
              borderRadius: 1.15,
              px: 2.5,
              py: 1.2,
              flex: 1,
              mr: 1,
              fontWeight: 600,
              '&:hover': { bgcolor: '#e7e7e7' },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={
              confirmDialog.type === 'decline' && user?.role === 'client'
                ? handleMaybeSubmit
                : confirmDialog.type === 'approve'
                  ? handleApprove
                  : handleDecline
            }
            disabled={
              isSubmitting ||
              // approve guard (unchanged)
              (confirmDialog.type === 'approve' &&
                campaign?.campaignCredits &&
                campaign?.origin !== 'CLIENT' &&
                (!totalUGCVideos || totalUGCVideos > ugcLeft)) ||
              // client-decline guard: require reason & if others then note
              (confirmDialog.type === 'decline' &&
                user?.role === 'client' &&
                (!maybeReason || (maybeReason === 'others' && !maybeNote.trim())))
            }
            sx={{
              bgcolor: confirmDialog.type === 'approve' ? '#2e6c56' : '#ffffff',
              color:
                confirmDialog.type === 'approve'
                  ? '#fff'
                  : user?.role === 'client' && confirmDialog.type === 'decline'
                    ? '#D4321C'
                    : '#ff3b30',
              border: confirmDialog.type === 'approve' ? 'none' : '1.5px solid #e7e7e7',
              borderBottom: '3px solid',
              borderBottomColor: confirmDialog.type === 'approve' ? '#202021' : '#e7e7e7',
              borderRadius: 1.15,
              px: 2.5,
              py: 1.2,
              flex: 1,
              ml: 1,
              fontWeight: 600,
              '&:hover': {
                bgcolor: confirmDialog.type === 'approve' ? '#1e4a3a' : '#e7e7e7',
              },
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <>
                {confirmDialog.type === 'approve' && (
                  <Iconify icon="eva:checkmark-fill" width={20} sx={{ mr: 0.5 }} />
                )}
                {confirmDialog.type === 'approve'
                  ? 'Yes, approve!'
                  : user?.role === 'client' && confirmDialog.type === 'decline'
                    ? 'Submit Reason' // 🔥 client-side decline
                    : 'Yes, decline!'}
              </>
            )}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={maybeOpen} onClose={handleCloseMaybe} maxWidth="sm" fullWidth>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={1}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: { xs: '1.5rem', sm: '2.5rem' },
                fontWeight: 550,
              }}
            >
              Reason for Maybe
            </Typography>

            <Typography variant="caption" sx={{ fontWeight: 400 }}>
              Selection Reason
            </Typography>

            <FormControl fullWidth>
              <Select
                value={maybeReason}
                onChange={(e) => setMaybeReason(e.target.value)}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Select Reason
                </MenuItem>
                {MAYBE_REASONS.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {maybeReason === 'others' && (
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ fontWeight: 400 }}>
                  Selection Description
                </Typography>

                <TextField
                  placeholder="Please describe the reason for your selection, so we can provide more creators more suited to your needs"
                  multiline
                  minRows={3}
                  value={maybeNote}
                  onChange={(e) => setMaybeNote(e.target.value)}
                  fullWidth
                  required
                  error={!maybeNote.trim() && isSubmitting}
                  helperText={!maybeNote.trim() && isSubmitting ? 'This field is required' : ''}
                />
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button
            onClick={handleMaybeSubmit}
            disabled={
              isSubmitting || !maybeReason || (maybeReason === 'others' && !maybeNote.trim())
            }
          >
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Submit Reason'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

PitchModal.propTypes = {
  pitch: PropTypes.object,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
};

export default PitchModal;
