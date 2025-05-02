/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-plusplus */
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
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
} from '@mui/material';

import { useGetCampaignById } from 'src/hooks/use-get-campaign-by-id';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import AvatarIcon from 'src/components/avatar-icon/avatar-icon';

const PitchModal = ({ pitch, open, onClose, campaign, onUpdate }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(pitch);
  const { user } = useAuthContext();
  const [totalUGCVideos, setTotalUGCVideos] = useState(null);
  const { mutate } = useGetCampaignById(campaign.id);

  useEffect(() => {
    setCurrentPitch(pitch);
  }, [pitch]);

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
      const response = await axiosInstance.patch(endpoints.campaign.pitch.changeStatus, {
        pitchId: pitch.id,
        status: 'approved',
        totalUGCVideos,
      });

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
      const response = await axiosInstance.patch(endpoints.campaign.pitch.changeStatus, {
        pitchId: pitch.id,
        status: 'rejected',
      });

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

  // Adds a delay before fully closing the dialog
  const handleCloseConfirmDialog = () => {
    // First just close the dialog
    setConfirmDialog((prev) => ({ ...prev, open: false }));

    setTimeout(() => {
      setConfirmDialog({ open: false, type: null });
    }, 300);
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
            right: 16,
            top: 16,
            zIndex: 9,
            padding: 1,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Iconify icon="eva:close-fill" width={24} height={24} />
        </IconButton>

        {/* Fixed User Info Section */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            bgcolor: 'background.paper',
            zIndex: 8,
            borderBottom: '1px solid',
            borderColor: 'divider',
            pt: 3,
            px: 3,
          }}
        >
          <Stack spacing={3}>
            {/* Creator Info and Social Media */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              sx={{ pr: 4 }}
            >
              {/* Creator Info */}
              <Stack direction="row" spacing={2} alignItems="center">
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
                  <Typography variant="h6">{currentPitch?.user?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentPitch?.user?.email}
                  </Typography>

                  {/* Social Media Icons Chip - Mobile */}
                  <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 1 }}>
                    <Chip
                      icon={
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          {currentPitch?.user?.creator?.instagram && (
                            <Tooltip title="Instagram Profile">
                              <IconButton
                                href={`https://instagram.com/${currentPitch.user.creator.instagram}`}
                                target="_blank"
                                size="small"
                                sx={{
                                  p: 0.8,
                                  color: '#E1306C',
                                  '&:hover': {
                                    bgcolor: 'rgba(225, 48, 108, 0.08)',
                                  },
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Iconify icon="mdi:instagram" width={24} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {currentPitch?.user?.creator?.tiktok && (
                            <Tooltip title="TikTok Profile">
                              <IconButton
                                href={`https://tiktok.com/@${currentPitch.user.creator.tiktok}`}
                                target="_blank"
                                size="small"
                                sx={{
                                  p: 0.8,
                                  color: '#000000',
                                  '&:hover': {
                                    bgcolor: 'rgba(0, 0, 0, 0.08)',
                                  },
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Iconify icon="ic:baseline-tiktok" width={24} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      }
                      sx={{
                        backgroundColor: (theme) => theme.palette.common.white,
                        height: '42px',
                        borderRadius: '10px',
                        border: '1px solid #ebebeb',
                        borderBottom: '3px solid #ebebeb',
                        '& .MuiChip-icon': {
                          margin: '0 8px',
                        },
                        '& .MuiChip-label': {
                          display: 'none',
                        },
                        '&:hover': {
                          backgroundColor: (theme) => theme.palette.common.white,
                        },
                      }}
                    />
                  </Box>
                </Stack>
              </Stack>

              {/* Social Media Icons Chip - Desktop */}
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Chip
                  icon={
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {currentPitch?.user?.creator?.instagram && (
                        <Tooltip title="Instagram Profile">
                          <IconButton
                            href={`https://instagram.com/${currentPitch.user.creator.instagram}`}
                            target="_blank"
                            size="small"
                            sx={{
                              p: 0.8,
                              color: '#E1306C',
                              '&:hover': {
                                bgcolor: 'rgba(225, 48, 108, 0.08)',
                              },
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Iconify icon="mdi:instagram" width={24} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {currentPitch?.user?.creator?.tiktok && (
                        <Tooltip title="TikTok Profile">
                          <IconButton
                            href={`https://tiktok.com/@${currentPitch.user.creator.tiktok}`}
                            target="_blank"
                            size="small"
                            sx={{
                              p: 0.8,
                              color: '#000000',
                              '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.08)',
                              },
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Iconify icon="ic:baseline-tiktok" width={24} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  }
                  sx={{
                    backgroundColor: (theme) => theme.palette.common.white,
                    height: '42px',
                    borderRadius: '10px',
                    border: '1px solid #ebebeb',
                    borderBottom: '3px solid #ebebeb',
                    mr: 2,
                    '& .MuiChip-icon': {
                      margin: '0 8px',
                    },
                    '& .MuiChip-label': {
                      display: 'none',
                    },
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.common.white,
                    },
                  }}
                />
              </Box>
            </Stack>

            {/* Languages and Interests Grid */}
            <Grid container spacing={2} sx={{ pb: 2 }}>
              {/* Languages Section */}
              {currentPitch?.user?.creator?.languages?.length > 0 && (
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Languages
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {currentPitch.user.creator.languages.map((language, index) => (
                        <Chip
                          key={index}
                          label={language}
                          size="small"
                          sx={{
                            bgcolor: 'background.neutral',
                            color: 'text.primary',
                            cursor: 'default',
                            '& .MuiChip-label': {
                              fontWeight: 500,
                            },
                            '&:hover': {
                              bgcolor: 'background.neutral',
                            },
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Grid>
              )}

              {/* Country Section */}
              {currentPitch?.user?.country && (
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Country
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      <Chip
                        label={currentPitch.user.country}
                        size="small"
                        sx={{
                          bgcolor: 'background.neutral',
                          color: 'text.primary',
                          cursor: 'default',
                          '& .MuiChip-label': {
                            fontWeight: 500,
                          },
                          '&:hover': {
                            bgcolor: 'background.neutral',
                          },
                        }}
                      />
                    </Stack>
                  </Box>
                </Grid>
              )}

              {/* Interests Section */}
              {currentPitch?.user?.creator?.interests?.length > 0 && (
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Interests
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {currentPitch.user.creator.interests.map((interest, index) => (
                        <Chip
                          key={index}
                          label={typeof interest === 'string' ? interest : interest.name}
                          size="small"
                          sx={{
                            bgcolor: 'background.neutral',
                            color: 'text.primary',
                            cursor: 'default',
                            '& .MuiChip-label': {
                              fontWeight: 500,
                            },
                            '&:hover': {
                              bgcolor: 'background.neutral',
                            },
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Grid>
              )}
            </Grid>
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
                    <AvatarIcon
                      icon={
                        currentPitch?.type === 'video' ? 'akar-icons:video' : 'solar:document-bold'
                      }
                    />
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
                    spacing={3}
                    alignItems="center"
                    justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                    sx={{ width: '100%' }}
                  >
                    <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                      <Typography variant="caption" color="text.secondary">
                        SUBMITTED ON
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
                                : 'warning.main',
                        }}
                      >
                        {currentPitch?.status?.charAt(0).toUpperCase() +
                          currentPitch?.status?.slice(1)}
                      </Typography>
                    </Stack>
                  </Stack>
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
                    borderBottom: '3px solid #203ff5',
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
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                    }}
                    dangerouslySetInnerHTML={{ __html: currentPitch.content }}
                  />
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>

        {/* Action Buttons */}
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="contained"
            onClick={() => setConfirmDialog({ open: true, type: 'decline' })}
            disabled={isDisabled || isSubmitting || currentPitch?.status === 'rejected'}
            sx={{
              textTransform: 'none',
              minHeight: 42,
              minWidth: 100,
              bgcolor: '#ffffff',
              color: '#ff3b30',
              border: '1.5px solid',
              borderColor: '#e7e7e7',
              borderBottom: '3px solid',
              borderBottomColor: '#e7e7e7',
              borderRadius: 1.15,
              fontWeight: 600,
              fontSize: '0.875rem',
              '&:hover': {
                bgcolor: '#e7e7e7',
              },
            }}
          >
            Decline
          </Button>
          <Button
            variant="contained"
            onClick={() => setConfirmDialog({ open: true, type: 'approve' })}
            disabled={isDisabled || isSubmitting || currentPitch?.status === 'approved'}
            sx={{
              textTransform: 'none',
              minHeight: 42,
              minWidth: 100,
              bgcolor: '#2e6c56',
              color: '#fff',
              borderBottom: '3px solid',
              borderBottomColor: '#202021',
              borderRadius: 1.15,
              fontWeight: 600,
              fontSize: '0.875rem',
              '&:hover': {
                bgcolor: '#1e4a3a',
              },
            }}
          >
            <Iconify icon="eva:checkmark-fill" width={20} sx={{ mr: 0.5 }} />
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCloseConfirmDialog} maxWidth="xs" fullWidth>
        <DialogContent>
          {campaign?.campaignCredits && (
            <Box mt={2} textAlign="end">
              <Label color="info">{ugcLeft} Credits left</Label>
            </Box>
          )}
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
              <Typography
                variant="body1"
                sx={{
                  color: '#636366',
                  mt: -0.5,
                  mb: -3,
                }}
              >
                {confirmDialog.type === 'approve'
                  ? 'Are you sure you want to approve this pitch?'
                  : 'Are you sure you want to decline this pitch?'}
              </Typography>
            </Stack>
            {campaign?.campaignCredits && confirmDialog.type === 'approve' && (
              <Box mt={2} width={1}>
                <TextField
                  value={totalUGCVideos}
                  size="small"
                  placeholder="UGC Videos"
                  type="number"
                  fullWidth
                  onKeyDown={(e) => {
                    if (e.key === '0' && totalUGCVideos.length === 0) e.preventDefault();
                  }}
                  onChange={(e) => {
                    setTotalUGCVideos(e.currentTarget.value);
                  }}
                  error={totalUGCVideos > ugcLeft}
                  helperText={totalUGCVideos > ugcLeft && `Maximum of ${ugcLeft} UGC Videos`}
                />
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button
            onClick={handleCloseConfirmDialog}
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
              '&:hover': {
                bgcolor: '#e7e7e7',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDialog.type === 'approve' ? handleApprove : handleDecline}
            disabled={
              isSubmitting ||
              (campaign?.campaignCredits &&
                confirmDialog.type === 'approve' &&
                (!totalUGCVideos || totalUGCVideos > ugcLeft))
            }
            sx={{
              bgcolor: confirmDialog.type === 'approve' ? '#2e6c56' : '#ffffff',
              color: confirmDialog.type === 'approve' ? '#fff' : '#ff3b30',
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
                {`Yes, ${confirmDialog.type === 'approve' ? 'approve!' : 'decline!'}`}
              </>
            )}
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
