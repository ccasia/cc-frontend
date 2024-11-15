/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import 'react-quill/dist/quill.snow.css';
import React, { useRef, useMemo, useState, useEffect } from 'react';

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
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';

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

const CampaignModal = ({
  open,
  handleClose,
  campaign,
  bookMark,
  onSaveCampaign,
  onUnsaveCampaign,
  dialog,
}) => {
  const [pitchOptionsOpen, setPitchOptionsOpen] = useState(false);
  const [textPitchOpen, setTextPitchOpen] = useState(false);
  const [videoPitchOpen, setVideoPitchOpen] = useState(false);
  const [fullImageOpen, setFullImageOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const dialogContentRef = useRef(null);
  const images = campaign?.campaignBrief?.images || [];

  // const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuthContext();
  const router = useRouter();
  const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const isShortlisted = useMemo(
    () =>
      user &&
      user?.shortlisted &&
      user?.shortlisted.some(
        (item) => item.userId === user?.id && item.campaignId === campaign?.id
      ),
    [campaign, user]
  );

  const existingPitch = useMemo(
    () => user?.pitch && user?.pitch.find((item) => item.campaignId === campaign?.id),
    [campaign, user]
  );

  const draftPitch = useMemo(
    () => user?.draftPitch && user?.draftPitch.find((item) => item.campaignId === campaign?.id),
    [campaign, user]
  );

  const hasPitched = useMemo(
    () => !!existingPitch && existingPitch.status !== 'draft',
    [existingPitch]
  );

  const hasDraft = useMemo(
    () => !!draftPitch || (existingPitch && existingPitch.status === 'draft'),
    [draftPitch, existingPitch]
  );

  const { isFormCompleted } = user.creator;

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
      return 'Invalid date format';
    }
  };

  const handleManageClick = (campaignId) => {
    router.push(paths.dashboard.campaign.creator.detail(campaignId));
  };

  const handleDraftClick = () => {
    setTextPitchOpen(true);
  };

  const handleBookmarkClick = () => {
    if (bookMark) {
      onUnsaveCampaign(campaign?.bookMarkCampaign?.find((item) => item.userId === user?.id)?.id);
    } else {
      onSaveCampaign(campaign?.id);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '98vh',
          position: 'relative',
          width: isSmallScreen ? '95vw' : '80vh',
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          overflow: { xs: 'auto', md: 'hidden' }, // Enable scrolling only on mobile
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
          },
        }}
      >
        {/* Campaign image */}
        <Box
          sx={{
            position: 'relative',
            height: { xs: 150, sm: 200 },
            cursor: 'pointer',
            width: '100%',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: 'visible',
            zIndex: 1,
            '& .hover-controls': {
              opacity: 0,
              transition: 'opacity 0.2s ease-in-out',
            },
            '&:hover .hover-controls': {
              opacity: 1,
            },
          }}
          onClick={handleImageClick}
        >
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>

          <Image
            src={images[currentImageIndex]}
            alt={`Campaign image ${currentImageIndex + 1}`}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              border: 'none',
              margin: 0,
              padding: 0,
            }}
          />

          {/* Add Match Percentage Chip */}
          <Box sx={{ position: 'absolute', top: 20, left: 20 }}>
            <Chip
              icon={
                <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2, ml: -0.5 }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={20}
                    thickness={7}
                    sx={{ color: 'grey.300' }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={Math.min(Math.round(campaign?.percentageMatch), 100)}
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
              label={`${Math.min(Math.round(campaign?.percentageMatch), 100)}% MATCH FOR YOU!`}
              sx={{
                backgroundColor: theme.palette.common.white,
                color: '#48484a',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                borderRadius: '10px',
                height: '35px',
                border: '1px solid #ebebeb',
                borderBottom: '3px solid #ebebeb',
                '& .MuiChip-label': {
                  padding: '0 8px 0 12px',
                },
                '&:hover': {
                  backgroundColor: theme.palette.common.white,
                },
              }}
            />
          </Box>

          {/* Company Avatar */}
          <Avatar
            src={campaign?.company?.logo}
            alt={campaign?.company?.name}
            sx={{
              position: 'absolute',
              left: 24,
              bottom: -32,
              width: 72,
              height: 72,
              border: '4px solid',
              borderColor: 'background.paper',
              zIndex: 1000,
            }}
          />

          {/* Image navigation buttons */}
          {images.length > 1 && (
            <>
              <IconButton
                className="hover-controls"
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
                className="hover-controls"
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
            className="hover-controls"
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
        <Box sx={{ px: 3, pb: 3, mt: 4 }}>
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
                  fontWeight: '550',
                  fontSize: { xs: '2rem', sm: '2.4rem' },
                  mb: 1,
                  mt: 0.5,
                  fontFamily: 'Instrument Serif, serif',
                }}
              >
                {campaign?.name}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontSize: { xs: '0.8rem', sm: '1rem' },
                  mt: -2,
                  mb: -1.5,
                  color: '#636366',
                  fontWeight: 480,
                }}
              >
                {campaign?.company?.name}
              </Typography>
            </Stack>
            <Stack
              direction={{ xs: 'row', sm: 'row' }}
              spacing={1}
              width={{ xs: '100%', sm: 'auto' }}
              justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
              sx={{ mt: { xs: 1.5, sm: 0 } }}
            >
              {!isFormCompleted ? (
                <Button
                  variant="contained"
                  onClick={dialog.onTrue}
                  sx={{
                    backgroundColor: '#273eec',
                    color: 'white',
                    borderBottom: '5px solid #152382 !important',
                    border: 'none',
                    '&:hover': {
                      backgroundColor: '#f57c00',
                      borderBottom: '5px solid #b26a00 !important',
                    },
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    padding: { xs: '4px 12px', sm: '6px 18px' },
                    minWidth: '100px',
                    height: '42px',
                    boxShadow: 'none',
                    textTransform: 'none',
                    fontWeight: 650,
                  }}
                >
                  Complete Profile
                </Button>
              ) : hasPitched ? (
                existingPitch.status === 'approved' ? (
                  <Button
                    variant="contained"
                    onClick={() => handleManageClick(campaign.id)}
                    sx={{
                      backgroundColor: '#203ff5',
                      color: 'white',
                      borderBottom: '4px solid #102387 !important',
                      border: 'none',
                      '&:hover': {
                        backgroundColor: '#1935dd',
                        borderBottom: '4px solid #102387 !important',
                      },
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      padding: { xs: '4px 12px', sm: '6px 18px' },
                      minWidth: '100px',
                      height: '42px',
                      boxShadow: 'none',
                      textTransform: 'none',
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
                      height: '42px',
                      minWidth: '100px',
                      '& .MuiChip-icon': {
                        fontSize: 20,
                        color: 'error.dark',
                      },
                      '&:hover': { bgcolor: 'error.light' },
                      px: 2,
                    }}
                  />
                ) : (
                  <Chip
                    icon={<Iconify icon="mdi:clock" />}
                    label="Under Review"
                    sx={{
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      fontWeight: 550,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      height: '40px',
                      minWidth: '100px',
                      border: '1px solid',
                      borderBottom: '3px solid',
                      borderColor: 'divider',
                      '& .MuiChip-icon': {
                        fontSize: 18,
                        color: '#f7c945',
                      },
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      px: 1,
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
              ) : isShortlisted ? (
                <Button
                  variant="contained"
                  onClick={() => handleManageClick(campaign.id)}
                  sx={{
                    backgroundColor: '#203ff5',
                    color: 'white',
                    borderBottom: '4px solid #102387 !important',
                    border: 'none',
                    '&:hover': {
                      backgroundColor: '#1935dd',
                      borderBottom: '4px solid #102387 !important',
                    },
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    padding: { xs: '4px 12px', sm: '6px 18px' },
                    minWidth: '100px',
                    height: '42px',
                    boxShadow: 'none',
                    textTransform: 'none',
                  }}
                >
                  Manage
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handlePitch}
                  sx={{
                    backgroundColor: '#203ff5',
                    color: 'white',
                    borderBottom: '4px solid #102387 !important',
                    border: 'none',
                    '&:hover': {
                      backgroundColor: '#1935dd',
                      borderBottom: '4px solid #102387 !important',
                    },
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    padding: { xs: '4px 12px', sm: '6px 18px' },
                    minWidth: '100px',
                    height: '42px',
                    boxShadow: 'none',
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Pitch Now
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={handleBookmarkClick}
                sx={{
                  minWidth: 0,
                  padding: '6px 12px',
                  border: '1px solid',
                  borderColor: 'grey.300',
                  borderBottom: '4px solid #e7e7e7',
                  borderRadius: 1,
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.5rem',
                  },
                  width: '42px',
                  height: '42px',
                }}
              >
                <Iconify
                  icon={bookMark ? 'mdi:bookmark' : 'mdi:bookmark-outline'}
                  width={28}
                  height={28}
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
                sx={{
                  pr: { md: 4 },
                  height: {
                    xs: 'auto', // Full height on mobile
                    md: 'calc(98vh - 400px)', // Fixed height with scroll on desktop
                  },
                  overflow: {
                    xs: 'visible', // No scroll on mobile
                    md: 'auto', // Enable scroll on desktop
                  },
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#555',
                  },
                }}
              >
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                      >
                        Campaign Period
                      </Typography>
                      <Typography variant="body2">{renderCampaignPeriod()}</Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                      >
                        Industry
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
                      {/* Campaign Details */}
                      <Box sx={{ mb: 3 }}>
                        <Box
                          sx={{
                            border: '1.5px solid #203ff5',
                            borderBottom: '4px solid #203ff5',
                            borderRadius: 1,
                            p: 1,
                            mb: 1,
                            width: 'fit-content',
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Iconify
                              icon="mdi:emoticon-happy"
                              sx={{
                                color: '#203ff5',
                                width: 20,
                                height: 20,
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#203ff5',
                                fontWeight: 600,
                              }}
                            >
                              CAMPAIGN DETAILS
                            </Typography>
                          </Stack>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            pl: 0.5,
                            textAlign: 'justify',
                          }}
                        >
                          {campaign?.description}
                        </Typography>
                      </Box>

                      {/* Campaign Objectives */}
                      <Box sx={{ mb: 3 }}>
                        <Box
                          sx={{
                            border: '1.5px solid #835cf5',
                            borderBottom: '4px solid #835cf5',
                            borderRadius: 1,
                            p: 1,
                            mb: 1,
                            width: 'fit-content',
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Iconify
                              icon="mdi:target-arrow"
                              sx={{
                                color: '#835cf5',
                                width: 20,
                                height: 20,
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#835cf5',
                                fontWeight: 600,
                              }}
                            >
                              CAMPAIGN OBJECTIVES
                            </Typography>
                          </Stack>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 0.5 }}>
                          <Iconify
                            icon="octicon:dot-fill-16"
                            sx={{
                              color: '#000000',
                              width: 12,
                              height: 12,
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="body2">
                            {campaign?.campaignBrief?.objectives}
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Campaign Do's */}
                      <Box sx={{ mb: 3 }}>
                        <Box
                          sx={{
                            border: '1.5px solid #2e6c56',
                            borderBottom: '4px solid #2e6c56',
                            borderRadius: 1,
                            p: 1,
                            mb: 1,
                            width: 'fit-content',
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Iconify
                              icon="material-symbols:check-box-outline"
                              sx={{
                                color: '#2e6c56',
                                width: 20,
                                height: 20,
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#2e6c56',
                                fontWeight: 600,
                              }}
                            >
                              CAMPAIGN DO&apos;S
                            </Typography>
                          </Stack>
                        </Box>
                        <Stack spacing={1} sx={{ pl: 0.5 }}>
                          {campaign?.campaignBrief?.campaigns_do?.map((item, index) => (
                            <Stack key={index} direction="row" spacing={1} alignItems="center">
                              <Iconify
                                icon="octicon:dot-fill-16"
                                sx={{
                                  color: '#000000',
                                  width: 12,
                                  height: 12,
                                  flexShrink: 0,
                                }}
                              />
                              <Typography variant="body2">{item.value}</Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>

                      {/* Campaign Don'ts */}
                      <Box>
                        <Box
                          sx={{
                            border: '1.5px solid #eb4a26',
                            borderBottom: '4px solid #eb4a26',
                            borderRadius: 1,
                            p: 1,
                            mb: 1,
                            width: 'fit-content',
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Iconify
                              icon="material-symbols:disabled-by-default-outline"
                              sx={{
                                color: '#eb4a26',
                                width: 20,
                                height: 20,
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#eb4a26',
                                fontWeight: 600,
                              }}
                            >
                              CAMPAIGN DON&apos;TS
                            </Typography>
                          </Stack>
                        </Box>
                        <Stack spacing={1} sx={{ pl: 0.5 }}>
                          {campaign?.campaignBrief?.campaigns_dont?.map((item, index) => (
                            <Stack key={index} direction="row" spacing={1} alignItems="center">
                              <Iconify
                                icon="octicon:dot-fill-16"
                                sx={{
                                  color: '#000000',
                                  width: 12,
                                  height: 12,
                                  flexShrink: 0,
                                }}
                              />
                              <Typography variant="body2">{item.value}</Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    </Box>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Vertical Divider */}
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                display: { xs: 'none', md: 'block' },
                mr: '-1px',
                mt: '-8px',
                height: { md: 'calc(98vh - 400px)' },
              }}
            />

            {/* Right column */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  pl: { md: 2 },
                  height: {
                    xs: 'auto', // Full height on mobile
                    md: 'calc(98vh - 400px)', // Fixed height with scroll on desktop
                  },
                  overflow: {
                    xs: 'visible', // No scroll on mobile
                    md: 'auto', // Enable scroll on desktop
                  },
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#555',
                  },
                }}
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
                          sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
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
                        sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                      >
                        User Persona
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {campaign?.campaignRequirement?.user_persona}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

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

      {/* Updated full-size image Dialog */}
      <Dialog
        open={fullImageOpen}
        onClose={handleFullImageClose}
        maxWidth={false}
        PaperProps={{
          sx: {
            maxWidth: { xs: '90vw', md: '32vw' },
            maxHeight: { xs: '90vh', md: '120vh' },
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
            m: 0,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
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
              py: 0,
            }}
          >
            <Image
              src={images[currentImageIndex]}
              alt={`Full size campaign image ${currentImageIndex + 1}`}
              onLoad={handleImageLoad}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 0,
                border: 'none',
                display: 'block',
                margin: 0,
                padding: 0,
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
    </Dialog>
  );
};

export default CampaignModal;

CampaignModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  campaign: PropTypes.object,
  bookMark: PropTypes.bool,
  onSaveCampaign: PropTypes.func,
  onUnsaveCampaign: PropTypes.func,
  dialog: PropTypes.object,
};
