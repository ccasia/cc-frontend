/* eslint-disable no-nested-ternary */
import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import 'react-quill/dist/quill.snow.css';
import { enqueueSnackbar } from 'notistack';
import React, { useRef, useState, useEffect } from 'react';

import Dialog from '@mui/material/Dialog';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import {
  Box,
  Chip,
  Grid,
  Stack,
  Paper,
  Button,
  Avatar,
  Divider,
  Typography,
  IconButton,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

import CampaignPitchOptionsModal from './campaign-pitch-options-modal'; // Import an appropriate icon

const ChipStyle = {
  bgcolor: '#e4e4e4',
  color: '#636366',
  borderRadius: 16,
  '& .MuiChip-label': {
    fontWeight: 700,
    px: 1.5,
    py: 0.5,
  },
  '&:hover': { bgcolor: '#e4e4e4' },
};

function calculateDaysLeft(endDate) {
  const today = dayjs();
  const end = dayjs(endDate);
  const daysLeft = end.diff(today, 'day');

  if (daysLeft > 0) {
    return `ENDING IN ${daysLeft} DAYS`;
  }
  return 'Campaign Ended';
}

const CampaignModal = ({ open, handleClose, campaign, openForm, dialog }) => {
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuthContext();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const isShortlisted = user?.shortlisted && user?.shortlisted.map((item) => item.campaignId);

  const existingPitch = user?.pitch && user?.pitch.find((item) => item.campaignId === campaign?.id);
  const draftPitch =
    user?.draftPitch && user?.draftPitch.find((item) => item.campaignId === campaign?.id);

  const hasPitched = !!existingPitch && existingPitch.status !== 'draft';
  const hasDraft = !!draftPitch || (existingPitch && existingPitch.status === 'draft');

  const saveCampaign = async (campaignId) => {
    try {
      const res = await axiosInstance.post(endpoints.campaign.creator.saveCampaign, {
        campaignId,
      });
      mutate(endpoints.campaign.getMatchedCampaign);
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Error', {
        variant: 'error',
      });
    }
  };

  const unSaveCampaign = async (saveCampaignId) => {
    try {
      const res = await axiosInstance.delete(
        endpoints.campaign.creator.unsaveCampaign(saveCampaignId)
      );
      mutate(endpoints.campaign.getMatchedCampaign);
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Error', {
        variant: 'error',
      });
    }
  };

  const [fullImageOpen, setFullImageOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const dialogContentRef = useRef(null);
  const images = campaign?.campaignBrief?.images || [];

  const handleImageClick = (event) => {
    // Prevent expansion if clicking on navigation buttons
    if (!event.target.closest('button')) {
      setFullImageOpen(true);
      setImageLoaded(false);
    }
  };

  const handleFullImageClose = () => {
    setFullImageOpen(false);
  };

  const handlePrevImage = (event) => {
    event.stopPropagation(); // Prevent image expansion
    setCurrentImageIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : images.length - 1));
    setImageLoaded(false);
  };

  const handleNextImage = (event) => {
    event.stopPropagation(); // Prevent image expansion
    setCurrentImageIndex((prevIndex) => (prevIndex < images.length - 1 ? prevIndex + 1 : 0));
    setImageLoaded(false);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  useEffect(() => {
    if (imageLoaded && dialogContentRef.current) {
      dialogContentRef.current.scrollTop = 0;
    }
  }, [imageLoaded]);

  const [pitchOptionsOpen, setPitchOptionsOpen] = useState(false);
  const [textPitchOpen, setTextPitchOpen] = useState(false);
  const [videoPitchOpen, setVideoPitchOpen] = useState(false);

  const handlePitch = () => {
    setPitchOptionsOpen(true);
  };

  const handlePitchOptionsClose = () => {
    setPitchOptionsOpen(false);
  };

  const handleOpenTextPitch = () => {
    setTextPitchOpen(true);
    setPitchOptionsOpen(false);
  };

  const handleOpenVideoPitch = () => {
    setVideoPitchOpen(true);
    setPitchOptionsOpen(false);
  };

  const handleCloseTextPitch = () => {
    setTextPitchOpen(false);
  };

  const handleCloseVideoPitch = () => {
    setVideoPitchOpen(false);
  };

  const renderCampaignPeriod = () => {
    const startDate = campaign?.campaignBrief?.startDate;
    const endDate = campaign?.campaignBrief?.endDate;

    if (!startDate || !endDate) {
      return 'Date not available';
    }

    try {
      return `${fDate(startDate)} - ${fDate(endDate)}`;
    } catch (error) {
      console.error('Error formatting dates:', error);
      return 'Invalid date format';
    }
  };

  const daysLeftMessage = calculateDaysLeft(campaign?.campaignBrief?.endDate);
  const isCampaignEnded = daysLeftMessage === 'Campaign Ended';

  const handleManageClick = (campaignId) => {
    router.push(paths.dashboard.campaign.creator.detail(campaignId));
  };

  const handleDraftClick = () => {
    setTextPitchOpen(true);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'visible',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            position: 'relative',
            width: isSmallScreen ? '90vw' : '75vh',
          },
        }}
      >
        {/* DialogContent for the Avatar */}
        <DialogContent
          sx={{
            p: 0.55,
            height: 0,
            boxShadow: 'none',
          }}
        >
          <Avatar
            src={campaign?.company?.logo}
            alt={campaign?.company?.name}
            sx={{
              position: 'absolute',
              left: '50%',
              top: -32,
              transform: 'translateX(-50%)',
              width: 72,
              height: 72,
              border: '4px solid',
              borderColor: 'background.paper',
              zIndex: 2,
            }}
          />
        </DialogContent>

        {/* DialogContent for the main white box */}
        <DialogContent sx={{ p: 2, pt: 4, overflow: 'auto', flexGrow: 1 }}>
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              overflow: 'hidden',
              mt: -4,
              mx: -1,
            }}
          >
            {/* Campaign image */}
            <Box
              sx={{
                position: 'relative',
                height: { xs: 200, sm: 250 },
                mb: 2,
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={handleImageClick}
            >
              <Image
                src={images[currentImageIndex]}
                alt={`Campaign image ${currentImageIndex + 1}`}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              />
              {images.length > 1 && (
                <>
                  <IconButton
                    onClick={handlePrevImage}
                    sx={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                      },
                    }}
                  >
                    <ArrowBackIosNewIcon />
                  </IconButton>
                  <IconButton
                    onClick={handleNextImage}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                      },
                    }}
                  >
                    <ArrowForwardIosIcon />
                  </IconButton>
                </>
              )}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '50%',
                  p: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ZoomInIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
            </Box>

            {/* Campaign info */}
            <Box sx={{ px: 3, pb: 3 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
                sx={{ mb: 2 }}
              >
                <Stack spacing={0.5} width={{ xs: '100%', sm: 'auto' }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '1.2rem', sm: '1.5rem' },
                      mb: 1,
                    }}
                  >
                    {campaign?.name}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.8rem', sm: '1rem' },
                      mt: -1.5,
                      mb: 1,
                    }}
                  >
                    {campaign?.company?.name}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: -1 }}>
                    <Iconify
                      icon={isCampaignEnded ? 'mdi:calendar-remove' : 'mdi:clock-outline'}
                      width={18}
                      sx={{ color: isCampaignEnded ? 'red' : '#b0b0b0' }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        fontWeight: 700,
                        color: isCampaignEnded ? 'red' : '#b0b0b0',
                      }}
                    >
                      {daysLeftMessage}
                    </Typography>
                  </Stack>
                </Stack>
                <Stack
                  direction={{ xs: 'row', sm: 'row' }}
                  spacing={1}
                  width={{ xs: '100%', sm: 'auto' }}
                  justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
                >
                  {hasPitched ? (
                    existingPitch.status === 'approved' ? (
                      <Button
                        variant="contained"
                        onClick={() => handleManageClick(campaign.id)}
                        sx={{
                          background: 'linear-gradient(to bottom, #7d54fe, #5131ff)',
                          color: 'white',
                          border: '1px solid #3300c3',
                          '&:hover': {
                            background: 'linear-gradient(to bottom, #6a46e5, #4628e6)',
                          },
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          padding: { xs: '6px 12px', sm: '8px 16px' },
                        }}
                      >
                        Manage
                      </Button>
                    ) : existingPitch.status === 'rejected' ? (
                      <Chip
                        icon={<Iconify icon="mdi:close-circle" />}
                        label="Rejected"
                        sx={{
                          bgcolor: 'error.light',
                          color: 'error.dark',
                          fontWeight: 700,
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          height: 36,
                          '& .MuiChip-icon': {
                            fontSize: 20,
                            color: 'error.dark',
                          },
                          '&:hover': { bgcolor: 'error.light' },
                          px: 0.5,
                        }}
                      />
                    ) : (
                      <Chip
                        icon={<Iconify icon="mdi:clock-outline" />}
                        label="In Review"
                        sx={{
                          bgcolor: 'warning.light',
                          color: 'warning.dark',
                          fontWeight: 700,
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          height: 36,
                          '& .MuiChip-icon': {
                            fontSize: 20,
                            color: 'warning.dark',
                          },
                          '&:hover': { bgcolor: 'warning.light' },
                          px: 0.5,
                        }}
                      />
                    )
                  ) : hasDraft ? (
                    <Button
                      variant="contained"
                      onClick={handleDraftClick}
                      startIcon={<Iconify icon="mdi:file-document-edit-outline" />}
                      sx={{
                        bgcolor: '#FFD700',
                        color: '#8B4513',
                        '&:hover': {
                          bgcolor: '#FFC300',
                        },
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        padding: { xs: '6px 12px', sm: '8px 16px' },
                        fontWeight: 700,
                      }}
                    >
                      Draft
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handlePitch}
                      sx={{
                        background: 'linear-gradient(to bottom, #7d54fe, #5131ff)',
                        color: 'white',
                        border: '1px solid #3300c3',
                        '&:hover': {
                          background: 'linear-gradient(to bottom, #6a46e5, #4628e6)',
                        },
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        padding: { xs: '6px 12px', sm: '8px 16px' },
                      }}
                    >
                      Pitch Yourself
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    onClick={() =>
                      campaign?.bookMarkCampaign
                        ? unSaveCampaign(campaign?.bookMarkCampaign.id)
                        : saveCampaign(campaign?.id)
                    }
                    sx={{
                      minWidth: 0,
                      padding: '6px 12px',
                      border: '1px solid',
                      borderColor: 'grey.300',
                      borderRadius: 1,
                    }}
                  >
                    <Iconify
                      icon={campaign?.bookMarkCampaign ? 'mdi:bookmark' : 'mdi:bookmark-outline'}
                      width={20}
                      height={20}
                    />
                  </Button>
                </Stack>
              </Stack>

              {/* Add Divider here */}
              <Divider sx={{ my: 2, mb: 3, mt: 4 }} />

              {/* Campaign details grid */}
              <Grid container spacing={2}>
                {/* Left column */}
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, p: 2 }}
                  >
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: 'text.primary', mb: 0.5, fontWeight: 800 }}
                          >
                            Category
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            <Chip
                              label={campaign?.campaignBrief?.industries || 'Not specified'}
                              size="small"
                              sx={ChipStyle}
                            />
                          </Box>
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: 'text.primary', mb: 0.5, fontWeight: 800 }}
                          >
                            Campaign Period
                          </Typography>
                          <Typography variant="body2">{renderCampaignPeriod()}</Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: 'text.primary', mb: 0.5, fontWeight: 800 }}
                          >
                            Details
                          </Typography>
                          <Typography variant="body2">{campaign?.description}</Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
                {/* Right column */}
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, p: 2 }}
                  >
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {[
                          { label: 'Gender', data: campaign?.campaignRequirement?.gender },
                          { label: 'Age', data: campaign?.campaignRequirement?.age },
                          {
                            label: 'Geo Location',
                            data: campaign?.campaignRequirement?.geoLocation,
                          },
                          { label: 'Language', data: campaign?.campaignRequirement?.language },
                          {
                            label: 'Creator Persona',
                            data: campaign?.campaignRequirement?.creator_persona,
                          },
                        ].map((item, index) => (
                          <Box key={index}>
                            <Typography
                              variant="body2"
                              sx={{ color: 'text.primary', mb: 0.5, fontWeight: 800 }}
                            >
                              {item.label}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {item.data?.map((value, idx) => (
                                <Chip
                                  key={idx}
                                  label={
                                    item.label === 'Creator Persona'
                                      ? value.charAt(0).toUpperCase() + value.slice(1)
                                      : value
                                  }
                                  size="small"
                                  sx={ChipStyle}
                                />
                              ))}
                            </Box>
                          </Box>
                        ))}
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: 'text.primary', mb: 0.5, fontWeight: 800 }}
                          >
                            User Persona
                          </Typography>
                          <Typography variant="body2">
                            {campaign?.campaignRequirement?.user_persona}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        {/* DialogContent for the bottom padding */}
        <DialogContent
          sx={{
            p: 0.55,
            height: 16,
            boxShadow: 'none',
          }}
        />
        <CampaignPitchOptionsModal
          open={pitchOptionsOpen}
          handleClose={handlePitchOptionsClose}
          campaign={campaign}
          text={{
            onTrue: handleOpenTextPitch,
            value: textPitchOpen,
            onFalse: handleCloseTextPitch,
          }}
          video={{
            onTrue: handleOpenVideoPitch,
            value: videoPitchOpen,
            onFalse: handleCloseVideoPitch,
          }}
        />
      </Dialog>

      {/* Updated full-size image Dialog */}
      <Dialog
        open={fullImageOpen}
        onClose={handleFullImageClose}
        maxWidth={false}
        PaperProps={{
          sx: {
            maxWidth: '90vw',
            maxHeight: '90vh',
            m: 'auto',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'background.paper',
          },
        }}
      >
        <DialogContent
          ref={dialogContentRef}
          sx={{
            p: 0,
            position: 'relative',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            '&::-webkit-scrollbar': {
              width: '0.4em',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,.3)',
              borderRadius: '4px',
            },
          }}
        >
          <IconButton
            onClick={handleFullImageClose}
            sx={{
              position: 'fixed',
              right: 16,
              top: 16,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              minHeight: '100%',
              width: '100%',
              py: 2,
            }}
          >
            <Image
              src={images[currentImageIndex]}
              alt={`Full size campaign image ${currentImageIndex + 1}`}
              onLoad={handleImageLoad}
              sx={{
                maxWidth: '100%',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          </Box>
          {images.length > 1 && (
            <>
              <IconButton
                onClick={handlePrevImage}
                sx={{
                  position: 'fixed',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                }}
              >
                <ArrowBackIosNewIcon />
              </IconButton>
              <IconButton
                onClick={handleNextImage}
                sx={{
                  position: 'fixed',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                }}
              >
                <ArrowForwardIosIcon />
              </IconButton>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CampaignModal;

CampaignModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  campaign: PropTypes.object,
  openForm: PropTypes.func,
  dialog: PropTypes.object,
};
