/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import 'react-quill/dist/quill.snow.css';
import { enqueueSnackbar } from 'notistack';
import React, { useRef, useMemo, useState, useEffect } from 'react';

import Dialog from '@mui/material/Dialog';
import { useTheme } from '@mui/material/styles';
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
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

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
}) => {
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

  // const handlePitch = () => {
  //   setPitchOptionsOpen(true);
  // };

  // const handlePitchOptionsClose = () => {
  //   setPitchOptionsOpen(false);
  // };

  // const handleOpenTextPitch = () => {
  //   setTextPitchOpen(true);
  //   setPitchOptionsOpen(false);
  // };

  // const handleOpenVideoPitch = () => {
  //   setVideoPitchOpen(true);
  //   setPitchOptionsOpen(false);
  // };

  // const handleCloseTextPitch = () => {
  //   setTextPitchOpen(false);
  // };

  // const handleCloseVideoPitch = () => {
  //   setVideoPitchOpen(false);
  // };

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

  // const handleDraftClick = () => {
  //   setTextPitchOpen(true);
  // };

  const handleBookmarkClick = () => {
    if (campaign?.bookMarkCampaign?.userId === user?.id) {
      onUnsaveCampaign(campaign?.bookMarkCampaign.id);
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
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          />

          {/* Add Match Percentage Chip */}
          {/* <Box sx={{ position: 'absolute', top: 20, left: 20 }}>
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
          </Box> */}

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
              zIndex: 2,
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
              {campaign?.shortlisted && (
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
              )}
              {campaign?.pitch && !campaign?.shortlisted && (
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
              )}

              {/* {hasPitched ? (
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
                    icon={<Iconify icon="mdi:clock-outline" />}
                    label="In Review"
                    sx={{
                      bgcolor: 'warning.light',
                      color: 'warning.dark',
                      fontWeight: 700,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      height: '42px',
                      minWidth: '100px',
                      '& .MuiChip-icon': {
                        fontSize: 20,
                        color: 'warning.dark',
                      },
                      '&:hover': { bgcolor: 'warning.light' },
                      px: 2,
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
                  }}
                >
                  Pitch Now
                </Button>
              )} */}
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
                          ].map((deliverable) => (
                            deliverable.value && (
                              <Stack key={deliverable.label} direction="row" spacing={1} alignItems="center">
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
                          ))}
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
                      { label: 'Gender', data: campaign?.campaignRequirement?.gender?.map(capitalizeFirstLetter) },
                      { label: 'Age', data: campaign?.campaignRequirement?.age },
                      {
                        label: 'Geo Location',
                        data: campaign?.campaignRequirement?.geoLocation,
                      },
                      { label: 'Language', data: campaign?.campaignRequirement?.language },
                      {
                        label: 'Creator Persona',
                        data: campaign?.campaignRequirement?.creator_persona?.map(value => 
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
                            <Chip
                              key={idx}
                              label={value}
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

      {/* <CampaignPitchOptionsModal
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
      /> */}

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
            alt={campaign?.company?.name}
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
              {campaign?.company?.name || 'Company'}
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
  // openForm: PropTypes.func,
  // dialog: PropTypes.object,
};
