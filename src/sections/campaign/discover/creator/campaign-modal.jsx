/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import 'react-quill/dist/quill.snow.css';
import { enqueueSnackbar } from 'notistack';
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
  Tooltip,
  Popover,
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

import CampaignPitchOptionsModal from './campaign-pitch-options-modal';

const ChipStyle = {
  bgcolor: '#FFF',
  border: 1,
  borderColor: '#EBEBEB',
  borderRadius: 1,
  color: '#636366',
  height: '32px',
  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
  '& .MuiChip-label': {
    fontWeight: 700,
    px: 1.5,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '-3px',
  },
  '&:hover': { bgcolor: '#FFF' },
};

const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  if (string.toLowerCase() === 'f&b') return 'F&B';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
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
  
  // New state for improved functionality
  const [linkCopiedAnchor, setLinkCopiedAnchor] = useState(null);
  const [showLinkCopied, setShowLinkCopied] = useState(false);
  const [fileDetailsAnchor, setFileDetailsAnchor] = useState(null);

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

  const totalCredits = campaign?.shortlisted?.reduce(
    (acc, shortlist) => acc + shortlist.ugcVideos,
    0
  );

  const isCreditsFinished = useMemo(
    () => campaign?.campaignCredits === totalCredits,
    [campaign, totalCredits]
  );

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

  // New handler functions for improved functionality
  const handleCopyLink = async (event) => {
    try {
      await navigator.clipboard.writeText(images[currentImageIndex]);
      setLinkCopiedAnchor(event.currentTarget);
      setShowLinkCopied(true);
      
      // Hide the indicator after 2 seconds
      setTimeout(() => {
        setShowLinkCopied(false);
        setLinkCopiedAnchor(null);
      }, 2000);
      
      enqueueSnackbar('Link copied to clipboard', { variant: 'success' });
    } catch (error) {
      console.error('Failed to copy link:', error);
      enqueueSnackbar('Failed to copy link', { variant: 'error' });
    }
  };

  const handleDownloadClick = async () => {
    try {
      const imageUrl = images[currentImageIndex];
      const fileName = getFileName();
      
      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      enqueueSnackbar('Download started', { variant: 'success' });
    } catch (error) {
      console.error('Download failed:', error);
      enqueueSnackbar('Failed to download image', { variant: 'error' });
    }
  };

  const handleFileDetailsClick = (event) => {
    setFileDetailsAnchor(event.currentTarget);
  };

  const handleFileDetailsClose = () => {
    setFileDetailsAnchor(null);
  };

  const getFileName = () => {
    const url = images[currentImageIndex];
    if (!url) return 'Campaign Image';
    
    // Extract filename from URL
    const urlParts = url.split('/');
    const fileNameWithParams = urlParts[urlParts.length - 1];
    
    // Remove query parameters (everything after ?)
    const fileNameWithoutParams = fileNameWithParams.split('?')[0];
    
    // Remove the prefix ID(s) (everything before and including the last underscore)
    const lastUnderscoreIndex = fileNameWithoutParams.lastIndexOf('_');
    
    if (lastUnderscoreIndex !== -1) {
      const actualFileName = fileNameWithoutParams.substring(lastUnderscoreIndex + 1);
      return actualFileName || 'Campaign Image';
    }
    
    return fileNameWithoutParams || 'Campaign Image';
  };

  // Dynamically adjust/resize with campaign name's length
  // if campaign name is long, the modal adjusts on its own
  useEffect(() => {
    const updateCampaignNameHeight = () => {
      const nameElement = document.querySelector('[data-campaign-name]');
      if (nameElement) {
        const height = nameElement.offsetHeight;
        document.documentElement.style.setProperty('--campaign-name-height', `${height}px`);
      }
    };

    updateCampaignNameHeight();
    window.addEventListener('resize', updateCampaignNameHeight);

    return () => {
      window.removeEventListener('resize', updateCampaignNameHeight);
    };
  }, [campaign?.name]);

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
          {/* Close Button - Updated styling */}
          <Tooltip 
            title="Close" 
            arrow 
            placement="bottom"
            PopperProps={{
              sx: {
                zIndex: 10001,
              },
            }}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  fontSize: { xs: '11px', md: '12px' },
                  fontWeight: 500,
                },
              },
              arrow: {
                sx: {
                  color: 'rgba(0, 0, 0, 0.9)',
                },
              },
            }}
          >
            <Button
              onClick={handleClose}
              sx={{
                position: 'absolute',
                top: { xs: 8, md: 12 },
                right: { xs: 8, md: 12 },
                minWidth: { xs: '36px', md: '40px' },
                width: { xs: '36px', md: '40px' },
                height: { xs: '36px', md: '40px' },
                p: 0,
                color: '#ffffff',
                border: '1px solid #28292C',
                borderRadius: '8px',
                fontWeight: 650,
                zIndex: 1000,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: { xs: '3px', md: '4px' },
                  left: { xs: '3px', md: '4px' },
                  right: { xs: '3px', md: '4px' },
                  bottom: { xs: '3px', md: '4px' },
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              <Iconify icon="eva:close-fill" width={{ xs: 18, md: 20 }} />
            </Button>
          </Tooltip>

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
                fontWeight: 600,
                fontSize: '0.875rem',
                borderRadius: '6px',
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
            alt={campaign?.brand?.name || campaign?.company?.name}
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
              <Tooltip 
                title="Previous Image" 
                arrow 
                placement="left"
                PopperProps={{
                  sx: {
                    zIndex: 10001,
                  },
                }}
                slotProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'rgba(0, 0, 0, 0.9)',
                      color: 'white',
                      fontSize: { xs: '11px', md: '12px' },
                      fontWeight: 500,
                    },
                  },
                  arrow: {
                    sx: {
                      color: 'rgba(0, 0, 0, 0.9)',
                    },
                  },
                }}
              >
                <Button
                  className="hover-controls"
                  onClick={handlePrevImage}
                  sx={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    minWidth: { xs: '36px', md: '40px' },
                    width: { xs: '36px', md: '40px' },
                    height: { xs: '36px', md: '40px' },
                    p: 0,
                    color: '#ffffff',
                    border: '1px solid #28292C',
                    borderRadius: '8px',
                    fontWeight: 650,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: { xs: '3px', md: '4px' },
                      left: { xs: '3px', md: '4px' },
                      right: { xs: '3px', md: '4px' },
                      bottom: { xs: '3px', md: '4px' },
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      transition: 'background-color 0.2s ease',
                      zIndex: -1,
                    },
                    '&:hover::before': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    },
                    '&:hover': {
                      bgcolor: 'transparent',
                    },
                  }}
                >
                  <ArrowBackIosNewIcon sx={{ fontSize: { xs: 16, md: 18 } }} />
                </Button>
              </Tooltip>
              <Tooltip 
                title="Next Image" 
                arrow 
                placement="right"
                PopperProps={{
                  sx: {
                    zIndex: 10001,
                  },
                }}
                slotProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'rgba(0, 0, 0, 0.9)',
                      color: 'white',
                      fontSize: { xs: '11px', md: '12px' },
                      fontWeight: 500,
                    },
                  },
                  arrow: {
                    sx: {
                      color: 'rgba(0, 0, 0, 0.9)',
                    },
                  },
                }}
              >
                <Button
                  className="hover-controls"
                  onClick={handleNextImage}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    minWidth: { xs: '36px', md: '40px' },
                    width: { xs: '36px', md: '40px' },
                    height: { xs: '36px', md: '40px' },
                    p: 0,
                    color: '#ffffff',
                    border: '1px solid #28292C',
                    borderRadius: '8px',
                    fontWeight: 650,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: { xs: '3px', md: '4px' },
                      left: { xs: '3px', md: '4px' },
                      right: { xs: '3px', md: '4px' },
                      bottom: { xs: '3px', md: '4px' },
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      transition: 'background-color 0.2s ease',
                      zIndex: -1,
                    },
                    '&:hover::before': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    },
                    '&:hover': {
                      bgcolor: 'transparent',
                    },
                  }}
                >
                  <ArrowForwardIosIcon sx={{ fontSize: { xs: 16, md: 18 } }} />
                </Button>
              </Tooltip>
            </>
          )}
          <Tooltip 
            title="View Full Size" 
            arrow 
            placement="top"
            PopperProps={{
              sx: {
                zIndex: 10001,
              },
            }}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  fontSize: { xs: '11px', md: '12px' },
                  fontWeight: 500,
                },
              },
              arrow: {
                sx: {
                  color: 'rgba(0, 0, 0, 0.9)',
                },
              },
            }}
          >
            <Box
              className="hover-controls"
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid #28292C',
                borderRadius: '8px',
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              <ZoomInIcon sx={{ color: 'white', fontSize: { xs: 20, md: 24 } }} />
            </Box>
          </Tooltip>
        </Box>

        {/* Campaign info */}
        <Box sx={{ px: 3, pb: 3, mt: 4 }}>
          <Grid container rowGap={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Grid item xs={12} sm={6}>
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
                  {campaign?.brand?.name || campaign?.company?.name}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack
                direction={{ xs: 'row', sm: 'row' }}
                spacing={1}
                width={{ xs: '100%', sm: 'auto' }}
                justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
                sx={{ mt: { xs: 1.5, sm: 0 } }}
              >
                {!isFormCompleted || !user?.paymentForm?.bankAccountName ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      component="div"
                      sx={{
                        position: 'relative',
                        display: 'inline-flex',
                        '&:hover .tooltip-content': {
                          opacity: 1,
                          visibility: 'visible',
                        },
                      }}
                    >
                      <Box
                        component="img"
                        src="/assets/icons/components/ic_fillpaymenterror.svg"
                        sx={{
                          width: 24,
                          height: 24,
                          cursor: 'pointer',
                        }}
                        onClick={dialog.onTrue}
                      />
                      <Box
                        className="tooltip-content"
                        sx={{
                          opacity: 0,
                          visibility: 'hidden',
                          position: 'absolute',
                          top: '-75px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#FCFCFC',
                          color: '#231F20',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          textAlign: 'center',
                          zIndex: 10,
                          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
                          width: '180px',
                          transition: 'opacity 0.2s ease, visibility 0.2s ease',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Typography
                          variant="caption"
                          sx={{ display: 'block', mb: 1, textAlign: 'left' }}
                        >
                          Please complete your payment details to access this feature.
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => {
                            router.push(paths.dashboard.user.profileTabs.payment);
                          }}
                          sx={{
                            color: '#1340FF',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            minWidth: 'auto',
                            textTransform: 'none',
                            display: 'flex',
                            justifyContent: 'flex-start',
                            '&:hover': {
                              backgroundColor: 'rgba(19, 64, 255, 0.08)',
                            },
                          }}
                        >
                          Complete Payment Details
                        </Button>
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      disabled
                      sx={{
                        backgroundColor: '#f5f5f5',
                        color: '#a1a1a1',
                        borderBottom: '4px solid #d1d1d1 !important',
                        border: 'none',
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        padding: { xs: '4px 12px', sm: '6px 18px' },
                        minWidth: '100px',
                        height: '42px',
                        boxShadow: 'none',
                        textTransform: 'none',
                        fontWeight: 650,
                        opacity: 0.7,
                      }}
                    >
                      Pitch Now
                    </Button>
                  </Stack>
                ) : hasPitched ? (
                  existingPitch.status === 'approved' ? (
                    <Tooltip 
                      title="Manage Campaign" 
                      arrow 
                      placement="bottom"
                      PopperProps={{
                        sx: {
                          zIndex: 10001,
                        },
                      }}
                      slotProps={{
                        tooltip: {
                          sx: {
                            bgcolor: 'rgba(0, 0, 0, 0.9)',
                            color: 'white',
                            fontSize: { xs: '11px', md: '12px' },
                            fontWeight: 500,
                          },
                        },
                        arrow: {
                          sx: {
                            color: 'rgba(0, 0, 0, 0.9)',
                          },
                        },
                      }}
                    >
                      <Button
                        variant="contained"
                        onClick={() => handleManageClick(campaign.id)}
                        startIcon={<Iconify icon="eva:settings-2-fill" width={16} height={16} />}
                        sx={{
                          backgroundColor: '#203ff5',
                          color: 'white',
                          border: '1px solid #203ff5',
                          borderBottom: '4px solid #102387',
                          borderRadius: '8px',
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          padding: { xs: '6px 16px', sm: '8px 20px' },
                          minWidth: '120px',
                          height: '44px',
                          boxShadow: '0 2px 4px rgba(32, 63, 245, 0.2)',
                          textTransform: 'none',
                          fontWeight: 600,
                          transition: 'all 0.2s ease-in-out',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                            transition: 'left 0.5s ease',
                          },
                          '&:hover': {
                            backgroundColor: '#1935dd',
                            borderColor: '#1935dd',
                            borderBottom: '4px solid #0f1f6b',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(32, 63, 245, 0.3)',
                            '&::before': {
                              left: '100%',
                            },
                          },
                          '&:active': {
                            transform: 'translateY(0px)',
                            boxShadow: '0 2px 4px rgba(32, 63, 245, 0.2)',
                          },
                        }}
                      >
                        Manage
                      </Button>
                    </Tooltip>
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
                      label="In Review"
                      sx={{
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        fontWeight: 600,
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        height: '42px',
                        minWidth: '100px',
                        border: '1px solid',
                        borderBottom: '4px solid',
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
                  <Tooltip 
                    title="Continue Draft" 
                    arrow 
                    placement="bottom"
                    PopperProps={{
                      sx: {
                        zIndex: 10001,
                      },
                    }}
                    slotProps={{
                      tooltip: {
                        sx: {
                          bgcolor: 'rgba(0, 0, 0, 0.9)',
                          color: 'white',
                          fontSize: { xs: '11px', md: '12px' },
                          fontWeight: 500,
                        },
                      },
                      arrow: {
                        sx: {
                          color: 'rgba(0, 0, 0, 0.9)',
                        },
                      },
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={handleDraftClick}
                      startIcon={<Iconify icon="eva:edit-2-fill" width={16} height={16} />}
                      sx={{
                        backgroundColor: '#FFD700',
                        color: '#8B4513',
                        border: '1px solid #FFD700',
                        borderBottom: '4px solid #E6C200',
                        borderRadius: '8px',
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        padding: { xs: '6px 16px', sm: '8px 20px' },
                        minWidth: '120px',
                        height: '44px',
                        boxShadow: '0 2px 4px rgba(255, 215, 0, 0.3)',
                        textTransform: 'none',
                        fontWeight: 600,
                        transition: 'all 0.2s ease-in-out',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          transition: 'left 0.5s ease',
                        },
                        '&:hover': {
                          backgroundColor: '#FFC300',
                          borderColor: '#FFC300',
                          borderBottom: '4px solid #CC9A00',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(255, 215, 0, 0.4)',
                          '&::before': {
                            left: '100%',
                          },
                        },
                        '&:active': {
                          transform: 'translateY(0px)',
                          boxShadow: '0 2px 4px rgba(255, 215, 0, 0.3)',
                        },
                      }}
                    >
                      Draft
                    </Button>
                  </Tooltip>
                ) : (
                  <Tooltip 
                    title={isCreditsFinished ? "Campaign Credits Full" : "Submit Your Pitch"} 
                    arrow 
                    placement="bottom"
                    PopperProps={{
                      sx: {
                        zIndex: 10001,
                      },
                    }}
                    slotProps={{
                      tooltip: {
                        sx: {
                          bgcolor: 'rgba(0, 0, 0, 0.9)',
                          color: 'white',
                          fontSize: { xs: '11px', md: '12px' },
                          fontWeight: 500,
                        },
                      },
                      arrow: {
                        sx: {
                          color: 'rgba(0, 0, 0, 0.9)',
                        },
                      },
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={handlePitch}
                      disabled={isCreditsFinished}
                      startIcon={<Iconify icon="eva:paper-plane-fill" width={16} height={16} />}
                      sx={{
                        backgroundColor: isCreditsFinished ? '#f5f5f5' : '#203ff5',
                        color: isCreditsFinished ? '#a1a1a1' : 'white',
                        border: isCreditsFinished ? '1px solid #d1d1d1' : '1px solid #203ff5',
                        borderBottom: isCreditsFinished ? '4px solid #d1d1d1' : '4px solid #102387',
                        borderRadius: '8px',
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        padding: { xs: '6px 16px', sm: '8px 20px' },
                        minWidth: '120px',
                        height: '44px',
                        boxShadow: isCreditsFinished ? 'none' : '0 2px 4px rgba(32, 63, 245, 0.2)',
                        textTransform: 'none',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease-in-out',
                        position: 'relative',
                        overflow: 'hidden',
                        opacity: isCreditsFinished ? 0.7 : 1,
                        cursor: isCreditsFinished ? 'not-allowed' : 'pointer',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                          transition: 'left 0.5s ease',
                        },
                        '&:hover': {
                          backgroundColor: isCreditsFinished ? '#f5f5f5' : '#1935dd',
                          borderColor: isCreditsFinished ? '#d1d1d1' : '#1935dd',
                          borderBottom: isCreditsFinished ? '4px solid #d1d1d1' : '4px solid #0f1f6b',
                          transform: isCreditsFinished ? 'none' : 'translateY(-1px)',
                          boxShadow: isCreditsFinished ? 'none' : '0 4px 12px rgba(32, 63, 245, 0.3)',
                          '&::before': {
                            left: isCreditsFinished ? '-100%' : '100%',
                          },
                        },
                        '&:active': {
                          transform: isCreditsFinished ? 'none' : 'translateY(0px)',
                          boxShadow: isCreditsFinished ? 'none' : '0 2px 4px rgba(32, 63, 245, 0.2)',
                        },
                        '&:disabled': {
                          backgroundColor: '#f5f5f5',
                          color: '#a1a1a1',
                          borderColor: '#d1d1d1',
                          borderBottom: '4px solid #d1d1d1',
                        },
                      }}
                    >
                      {isCreditsFinished ? 'Not available' : 'Pitch Now'}
                    </Button>
                  </Tooltip>
                )}
                <Tooltip 
                  title={bookMark ? "Remove Bookmark" : "Add Bookmark"} 
                  arrow 
                  placement="bottom"
                  PopperProps={{
                    sx: {
                      zIndex: 10001,
                    },
                  }}
                  slotProps={{
                    tooltip: {
                      sx: {
                        bgcolor: 'rgba(0, 0, 0, 0.9)',
                        color: 'white',
                        fontSize: { xs: '11px', md: '12px' },
                        fontWeight: 500,
                      },
                    },
                    arrow: {
                      sx: {
                        color: 'rgba(0, 0, 0, 0.9)',
                      },
                    },
                  }}
                >
                  <Button
                    onClick={handleBookmarkClick}
                    sx={{
                      minWidth: { xs: '44px', md: '48px' },
                      width: { xs: '44px', md: '48px' },
                      height: { xs: '44px', md: '48px' },
                      p: 0,
                      color: bookMark ? '#231F20' : '#636366',
                      backgroundColor: 'background.paper',
                      border: '1px solid',
                      borderColor: bookMark ? '#231F20' : 'grey.300',
                      borderBottom: bookMark ? '4px solid #1A1717' : '4px solid #e7e7e7',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease-in-out',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: bookMark ? '0 2px 4px rgba(35, 31, 32, 0.2)' : '0 1px 2px rgba(0, 0, 0, 0.1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: bookMark 
                          ? 'linear-gradient(90deg, transparent, rgba(35, 31, 32, 0.1), transparent)'
                          : 'linear-gradient(90deg, transparent, rgba(99, 99, 102, 0.1), transparent)',
                        transition: 'left 0.5s ease',
                      },
                      '&:hover': {
                        backgroundColor: bookMark ? 'rgba(35, 31, 32, 0.05)' : 'action.hover',
                        borderColor: bookMark ? '#1A1717' : 'grey.400',
                        borderBottom: bookMark ? '4px solid #0F0D0E' : '4px solid #d1d1d1',
                        color: bookMark ? '#1A1717' : '#48484a',
                        transform: 'translateY(-1px)',
                        boxShadow: bookMark 
                          ? '0 4px 8px rgba(35, 31, 32, 0.25)' 
                          : '0 2px 6px rgba(0, 0, 0, 0.15)',
                        '&::before': {
                          left: '100%',
                        },
                      },
                      '&:active': {
                        transform: 'translateY(0px)',
                        boxShadow: bookMark 
                          ? '0 2px 4px rgba(35, 31, 32, 0.2)' 
                          : '0 1px 2px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  >
                    <Iconify
                      icon={bookMark ? 'eva:bookmark-fill' : 'eva:bookmark-outline'}
                      width={20}
                      height={20}
                      sx={{
                        fontSize: 'inherit',
                        transition: 'transform 0.2s ease',
                        transform: bookMark ? 'scale(1.1)' : 'scale(1)',
                      }}
                    />
                  </Button>
                </Tooltip>
              </Stack>
            </Grid>
          </Grid>

          {campaign?.isKWSPCampaign && (
            <Box
              mt={4}
              sx={{
                border: '1.5px solid #0062CD',
                borderBottom: '4px solid #0062CD',
                borderRadius: 1,
                p: 1,
                mb: 1,
                width: 'fit-content',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#0062CD',
                      fontWeight: 600,
                    }}
                  >
                    Partnered with KWSP i-Saraan{' '}
                  </Typography>
                  <Divider />
                  <Typography variant="caption" color="black" fontWeight={400}>
                    Score an extra RM100! T&C&apos;s apply.
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          )}

          {/* Add Divider here */}
          <Divider sx={{ my: 2, mb: 3 }} />
          {/* Campaign details grid */}
          <Grid container spacing={2}>
            {/* Left column */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  pr: { md: 4 },
                  maxHeight: {
                    xs: 'auto',
                    md: 'calc(98vh - 470px - min(80px, max(0px, var(--campaign-name-height, 0px))))',
                  },
                  overflow: {
                    xs: 'visible',
                    md: 'auto',
                  },
                  pb: 3,
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
                            <Box
                              component="img"
                              src="/assets/icons/components/ic_bluesmiley.svg"
                              sx={{
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
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                            maxWidth: '100%',
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
                            <Box
                              component="img"
                              src="/assets/icons/components/ic_objectives.svg"
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
                          <Typography
                            variant="body2"
                            sx={{
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word',
                              whiteSpace: 'pre-wrap',
                              maxWidth: '100%',
                            }}
                          >
                            {campaign?.campaignBrief?.objectives}
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Campaign Deliverables */}
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
                              icon="mdi:cube-outline"
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
                              CAMPAIGN DELIVERABLES
                            </Typography>
                          </Stack>
                        </Box>
                        <Stack spacing={1} sx={{ pl: 0.5 }}>
                          {[
                            { label: 'UGC Videos', value: true },
                            { label: 'Raw Footage', value: campaign?.rawFootage },
                            { label: 'Photos', value: campaign?.photos },
                            { label: 'Ads', value: campaign?.ads },
                          ].map(
                            (deliverable) =>
                              deliverable.value && (
                                <Stack
                                  key={deliverable.label}
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                >
                                  <Iconify
                                    icon="octicon:dot-fill-16"
                                    sx={{
                                      color: '#000000',
                                      width: 12,
                                      height: 12,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Typography variant="body2">{deliverable.label}</Typography>
                                </Stack>
                              )
                          )}
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
                            <Box
                              component="img"
                              src="/assets/icons/components/ic_dos.svg"
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
                              <Typography
                                variant="body2"
                                sx={{
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                  maxWidth: '100%',
                                }}
                              >
                                {item.value}
                              </Typography>
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
                            <Box
                              component="img"
                              src="/assets/icons/components/ic_donts.svg"
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
                              <Typography
                                variant="body2"
                                sx={{
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                  maxWidth: '100%',
                                }}
                              >
                                {item.value}
                              </Typography>
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
                height: {
                  md: 'calc(98vh - 470px - min(80px, max(0px, var(--campaign-name-height, 0px))))',
                },
              }}
            />

            {/* Right column */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  pl: { md: 2 },
                  maxHeight: {
                    xs: 'auto',
                    md: 'calc(98vh - 470px - min(80px, max(0px, var(--campaign-name-height, 0px))))',
                  },
                  overflow: {
                    xs: 'visible',
                    md: 'auto',
                  },
                  pb: 3,
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
                      {
                        label: 'Gender',
                        data: campaign?.campaignRequirement?.gender?.map(capitalizeFirstLetter),
                      },
                      { label: 'Age', data: campaign?.campaignRequirement?.age },
                      {
                        label: 'Geo Location',
                        data: campaign?.campaignRequirement?.geoLocation,
                      },
                      { label: 'Language', data: campaign?.campaignRequirement?.language },
                      {
                        label: 'Creator Persona',
                        data: campaign?.campaignRequirement?.creator_persona?.map((value) =>
                          value.toLowerCase() === 'f&b' ? 'F&B' : capitalizeFirstLetter(value)
                        ),
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
                            <Chip key={idx} label={value} size="small" sx={ChipStyle} />
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
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 420,
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                          maxWidth: '100%',
                        }}
                      >
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
        fullScreen
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            overflow: 'hidden',
            position: 'relative',
          },
        }}
        sx={{
          zIndex: 9999,
          '& .MuiDialog-container': {
            alignItems: 'center',
            justifyContent: 'center',
          },
          '& .MuiDialog-paper': {
            m: 0,
            width: '100%',
            height: '100%',
          },
        }}
      >
        {/* Company Profile Info - Top Left */}
        <Box
          sx={{
            position: 'fixed',
            top: { xs: 10, md: 20 },
            left: { xs: 10, md: 20 },
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, md: 1.5 },
            borderRadius: '8px',
            p: { xs: 1.5, md: 2 },
            height: { xs: '56px', md: '64px' },
            minWidth: { xs: '180px', md: '200px' },
          }}
        >
          <Avatar
            src={campaign?.company?.logo}
            alt={campaign?.brand?.name || campaign?.company?.name}
            sx={{ width: { xs: 36, md: 40 }, height: { xs: 36, md: 40 } }}
          />
          <Stack spacing={0.5}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: '#e7e7e7',
                fontSize: { xs: '13px', md: '14px' },
                lineHeight: 1.3,
              }}
            >
              {campaign?.brand?.name || campaign?.company?.name || 'Company'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#85868E',
                fontSize: { xs: '11px', md: '12px' },
                lineHeight: 1.3,
              }}
            >
              {renderCampaignPeriod()}
            </Typography>
          </Stack>
        </Box>

        {/* Action Buttons - Top Right */}
        <Stack
          direction="row"
          spacing={{ xs: 0.5, md: 1 }}
          sx={{
            position: 'fixed',
            top: { xs: 10, md: 20 },
            right: { xs: 10, md: 20 },
            zIndex: 10000,
          }}
        >
          {/* Grouped Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              border: '1px solid #28292C',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <Tooltip 
              title="Copy Link" 
              arrow 
              placement="bottom"
              PopperProps={{
                sx: {
                  zIndex: 10001,
                },
              }}
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    fontSize: { xs: '11px', md: '12px' },
                    fontWeight: 500,
                  },
                },
                arrow: {
                  sx: {
                    color: 'rgba(0, 0, 0, 0.9)',
                  },
                },
              }}
            >
              <Button
                onClick={handleCopyLink}
                sx={{
                  minWidth: { xs: '40px', md: '44px' },
                  width: { xs: '40px', md: '44px' },
                  height: { xs: '40px', md: '44px' },
                  p: 0,
                  bgcolor: 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 650,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: { xs: '3px', md: '4px' },
                    left: { xs: '3px', md: '4px' },
                    right: { xs: '3px', md: '4px' },
                    bottom: { xs: '3px', md: '4px' },
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s ease',
                    zIndex: -1,
                  },
                  '&:hover::before': {
                    backgroundColor: '#5A5A5C',
                  },
                  '&:hover': {
                    bgcolor: 'transparent',
                  },
                }}
              >
                <Iconify icon="eva:link-2-fill" width={{ xs: 16, md: 18 }} />
              </Button>
            </Tooltip>

            <Tooltip 
              title="Download Image" 
              arrow 
              placement="bottom"
              PopperProps={{
                sx: {
                  zIndex: 10001,
                },
              }}
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    fontSize: { xs: '11px', md: '12px' },
                    fontWeight: 500,
                  },
                },
                arrow: {
                  sx: {
                    color: 'rgba(0, 0, 0, 0.9)',
                  },
                },
              }}
            >
              <Button
                onClick={handleDownloadClick}
                sx={{
                  minWidth: { xs: '40px', md: '44px' },
                  width: { xs: '40px', md: '44px' },
                  height: { xs: '40px', md: '44px' },
                  p: 0,
                  bgcolor: 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 650,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: { xs: '3px', md: '4px' },
                    left: { xs: '3px', md: '4px' },
                    right: { xs: '3px', md: '4px' },
                    bottom: { xs: '3px', md: '4px' },
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s ease',
                    zIndex: -1,
                  },
                  '&:hover::before': {
                    backgroundColor: '#5A5A5C',
                  },
                  '&:hover': {
                    bgcolor: 'transparent',
                  },
                }}
              >
                <Iconify icon="eva:download-fill" width={{ xs: 16, md: 18 }} />
              </Button>
            </Tooltip>

            <Tooltip 
              title="File Details" 
              arrow 
              placement="bottom"
              PopperProps={{
                sx: {
                  zIndex: 10001,
                },
              }}
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    fontSize: { xs: '11px', md: '12px' },
                    fontWeight: 500,
                  },
                },
                arrow: {
                  sx: {
                    color: 'rgba(0, 0, 0, 0.9)',
                  },
                },
              }}
            >
              <Button
                onClick={handleFileDetailsClick}
                sx={{
                  minWidth: { xs: '40px', md: '44px' },
                  width: { xs: '40px', md: '44px' },
                  height: { xs: '40px', md: '44px' },
                  p: 0,
                  bgcolor: 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 650,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: { xs: '3px', md: '4px' },
                    left: { xs: '3px', md: '4px' },
                    right: { xs: '3px', md: '4px' },
                    bottom: { xs: '3px', md: '4px' },
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s ease',
                    zIndex: -1,
                  },
                  '&:hover::before': {
                    backgroundColor: '#5A5A5C',
                  },
                  '&:hover': {
                    bgcolor: 'transparent',
                  },
                }}
              >
                <Iconify icon="eva:info-outline" width={{ xs: 16, md: 18 }} />
              </Button>
            </Tooltip>
          </Box>

          {/* Close Button - Separate */}
          <Tooltip 
            title="Close" 
            arrow 
            placement="bottom"
            PopperProps={{
              sx: {
                zIndex: 10001,
              },
            }}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  fontSize: { xs: '11px', md: '12px' },
                  fontWeight: 500,
                },
              },
              arrow: {
                sx: {
                  color: 'rgba(0, 0, 0, 0.9)',
                },
              },
            }}
          >
            <Button
              onClick={handleFullImageClose}
              sx={{
                minWidth: { xs: '40px', md: '44px' },
                width: { xs: '40px', md: '44px' },
                height: { xs: '40px', md: '44px' },
                p: 0,
                color: '#ffffff',
                border: '1px solid #28292C',
                borderRadius: '8px',
                fontWeight: 650,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: { xs: '3px', md: '4px' },
                  left: { xs: '3px', md: '4px' },
                  right: { xs: '3px', md: '4px' },
                  bottom: { xs: '3px', md: '4px' },
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: '#5A5A5C',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              <Iconify icon="eva:close-fill" width={{ xs: 20, md: 22 }} />
            </Button>
          </Tooltip>
        </Stack>

        {/* Link Copied Indicator */}
        <Box
          sx={{
            position: 'fixed',
            top: { xs: 56, md: 76 },
            right: { xs: 10, md: 20 },
            zIndex: 10002,
            opacity: showLinkCopied ? 1 : 0,
            transform: showLinkCopied ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 0.3s ease-in-out',
            pointerEvents: 'none',
            width: { xs: '150px', md: '172px' },
          }}
        >
          <Box
            sx={{
              bgcolor: '#4CAF50',
              border: '1px solid #45A049',
              borderBottom: '3px solid #45A049',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              p: { xs: 1, md: 1.5 },
              display: 'flex',
              alignItems: 'start',
              justifyContent: 'start',
              gap: 1,
            }}
          >
            <Iconify icon="eva:checkmark-circle-2-fill" width={{ xs: 14, md: 16 }} color="white" />
            <Typography
              sx={{
                fontFamily: 'Inter',
                fontWeight: 600,
                color: 'white',
                fontSize: { xs: '11px', md: '12px' },
              }}
            >
              Link Copied
            </Typography>
          </Box>
        </Box>

        {/* File Details Popover */}
        <Popover
          open={Boolean(fileDetailsAnchor)}
          anchorEl={fileDetailsAnchor}
          onClose={handleFileDetailsClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          sx={{
            zIndex: 10002,
            mt: 1,
          }}
          PaperProps={{
            sx: {
              bgcolor: '#FFFFFF',
              border: '1px solid #E7E7E7',
              borderBottom: '3px solid #E7E7E7',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '200px',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography
              sx={{
                fontFamily: 'Inter',
                fontWeight: 600,
                color: '#000',
                fontSize: '14px',
                mb: 1,
              }}
            >
              File Details
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            
            <Stack spacing={1}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#666',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Filename
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#000',
                    fontSize: '13px',
                    wordBreak: 'break-all',
                  }}
                >
                  {getFileName()}
                </Typography>
              </Box>
              
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#666',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Campaign
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#000',
                    fontSize: '13px',
                  }}
                >
                  {campaign?.name || 'Campaign Image'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Popover>

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
            height: '100vh',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
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
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain',
                borderRadius: 2,
                border: 'none',
                display: 'block',
                margin: 0,
                padding: 0,
              }}
            />
          </Box>
          {images.length > 1 && (
            <>
              <Tooltip 
                title="Previous Image" 
                arrow 
                placement="left"
                PopperProps={{
                  sx: {
                    zIndex: 10001,
                  },
                }}
                slotProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'rgba(0, 0, 0, 0.9)',
                      color: 'white',
                      fontSize: { xs: '11px', md: '12px' },
                      fontWeight: 500,
                    },
                  },
                  arrow: {
                    sx: {
                      color: 'rgba(0, 0, 0, 0.9)',
                    },
                  },
                }}
              >
                <Button
                  onClick={handlePrevImage}
                  sx={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    minWidth: { xs: '36px', md: '40px' },
                    width: { xs: '36px', md: '40px' },
                    height: { xs: '36px', md: '40px' },
                    p: 0,
                    color: '#ffffff',
                    border: '1px solid #28292C',
                    borderRadius: '8px',
                    fontWeight: 650,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: { xs: '3px', md: '4px' },
                      left: { xs: '3px', md: '4px' },
                      right: { xs: '3px', md: '4px' },
                      bottom: { xs: '3px', md: '4px' },
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      transition: 'background-color 0.2s ease',
                      zIndex: -1,
                    },
                    '&:hover::before': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    },
                    '&:hover': {
                      bgcolor: 'transparent',
                    },
                  }}
                >
                  <ArrowBackIosNewIcon sx={{ fontSize: { xs: 16, md: 18 } }} />
                </Button>
              </Tooltip>
              <Tooltip 
                title="Next Image" 
                arrow 
                placement="right"
                PopperProps={{
                  sx: {
                    zIndex: 10001,
                  },
                }}
                slotProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'rgba(0, 0, 0, 0.9)',
                      color: 'white',
                      fontSize: { xs: '11px', md: '12px' },
                      fontWeight: 500,
                    },
                  },
                  arrow: {
                    sx: {
                      color: 'rgba(0, 0, 0, 0.9)',
                    },
                  },
                }}
              >
                <Button
                  onClick={handleNextImage}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    minWidth: { xs: '36px', md: '40px' },
                    width: { xs: '36px', md: '40px' },
                    height: { xs: '36px', md: '40px' },
                    p: 0,
                    color: '#ffffff',
                    border: '1px solid #28292C',
                    borderRadius: '8px',
                    fontWeight: 650,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: { xs: '3px', md: '4px' },
                      left: { xs: '3px', md: '4px' },
                      right: { xs: '3px', md: '4px' },
                      bottom: { xs: '3px', md: '4px' },
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      transition: 'background-color 0.2s ease',
                      zIndex: -1,
                    },
                    '&:hover::before': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    },
                    '&:hover': {
                      bgcolor: 'transparent',
                    },
                  }}
                >
                  <ArrowForwardIosIcon sx={{ fontSize: { xs: 16, md: 18 } }} />
                </Button>
              </Tooltip>
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
