/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import 'react-quill/dist/quill.snow.css';
import React, { useRef, useMemo, useState, useEffect } from 'react';

import Dialog from '@mui/material/Dialog';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import DialogContent from '@mui/material/DialogContent';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import {
  Box,
  Chip,
  Grid,
  Stack,
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

import MediaKitPopup from './media-kit-popup';
import CampaignPitchOptionsModal from './campaign-pitch-options-modal';

const ChipStyle = {
  bgcolor: '#FFF',
  border: 1,
  borderColor: '#EBEBEB',
  borderRadius: 0.8,
  color: '#636366',
  py: 2,
  boxShadow: '0px -1.5px 0px 0px #E7E7E7 inset',
  '& .MuiChip-label': {
    fontWeight: 700,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '&:hover': { bgcolor: '#FFF' },
};

// Reusable box styles for campaign info sections
const SectionBoxStyles = {
  borderRadius: 1,
  px: 1,
  py: 0.8,
  mb: 1,
  mt: 2.5,
};

// Reusable text styles for section titles
const SectionTitleStyles = {
  fontSize: 14,
  fontWeight: 600,
};

const SubSectionBoxStyles = {
  display: 'flex',
  flexDirection: 'column',
};

const SubSectionTitleStyles = { color: '#8e8e93', mb: 0.5, fontWeight: 600 };

const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const getProperCase = (value) => {
  if (!value) return '';
  const lower = value.toLowerCase();
  if (lower === 'f&b') return 'F&B';
  if (lower === 'fmcg') return 'FMCG';
  return value
    .split(' ')
    .map((word) =>
      word.length > 2 && word.toLowerCase() !== 'and'
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
};

const CampaignModal = ({
  open,
  handleClose,
  campaign,
  bookMark,
  onSaveCampaign,
  onUnsaveCampaign,
  dialog,
  mutate,
}) => {
  const [pitchOptionsOpen, setPitchOptionsOpen] = useState(false);
  const [textPitchOpen, setTextPitchOpen] = useState(false);
  const [videoPitchOpen, setVideoPitchOpen] = useState(false);
  const [fullImageOpen, setFullImageOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showMediaKitPopup, setShowMediaKitPopup] = useState(false);

  const dialogContentRef = useRef(null);
  const images = campaign?.campaignBrief?.images || [];

  // const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuthContext();
  const router = useRouter();
  const theme = useTheme();

  const existingPitch = useMemo(
    () => campaign?.pitch?.find((item) => item.userId === user?.id && item.status !== 'draft'),
    [campaign, user]
  );

  const draftPitch = useMemo(
    () => campaign?.pitch?.find((item) => item.userId === user?.id && item.status === 'draft'),
    [campaign, user]
  );

  const hasPitched = useMemo(() => !!existingPitch, [existingPitch]);

  const hasDraft = useMemo(() => !!draftPitch, [draftPitch]);

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
    // Check if user is marked as Media Kit Mandatory
    const isMKM = user?.mediaKitMandatory === true;

    // Check if media kit is connected
    const hasMediaKit =
      user?.creator && (user.creator.isFacebookConnected || user.creator.isTiktokConnected);

    const hasPaymentDetails = isFormCompleted && user?.paymentForm?.bankAccountName;

    // For MKM users, enforce media kit connection
    if (isMKM && !hasMediaKit) {
      setShowMediaKitPopup(true);
      return;
    }

    // Check payment details for all users
    if (!isFormCompleted || !user?.paymentForm?.bankAccountName) {
      return;
    }

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

  const renderCampaignPostingPeriod = () => {
    const startDate = campaign?.campaignBrief?.postingStartDate;
    const endDate = campaign?.campaignBrief?.postingEndDate;

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

  const requirement = campaign?.campaignRequirement;

  const hasSecondaryAudience =
    requirement?.secondary_gender?.length > 0 ||
    requirement?.secondary_age?.length > 0 ||
    requirement?.secondary_country ||
    requirement?.secondary_language?.length > 0 ||
    requirement?.secondary_creator_persona?.length > 0 ||
    requirement?.secondary_user_persona;

  // Helper to render Geographic Focus without nested ternary
  const getGeographicFocus = () => {
    if (!requirement?.geographic_focus) return 'Not specified';
    if (requirement.geographic_focus === 'SEAregion') return 'SEA Region';
    if (requirement.geographic_focus === 'KualaLumpur') return 'Kuala Lumpur';
    if (requirement.geographic_focus === 'EastMalaysia') return 'East Malaysia';
    if (requirement.geographic_focus === 'others') return requirement.geographicFocusOthers;
    return capitalizeFirstLetter(requirement.geographic_focus);
  };

  const getlogisticsTypeLabel = (type) => {
    if (!type) return '';
    if (type === 'PRODUCT_DELIVERY') return 'Product Delivery';
    if (type === 'RESERVATION') return 'Reservation';
    return capitalizeFirstLetter(type);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" scroll="body">
      <DialogContent sx={{ p: 0 }}>
        {/* Campaign image */}
        <Box
          sx={{
            position: 'relative',
            height: { xs: 150, sm: 180 },
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
        <Box
          sx={{
            px: 3,
            mt: 4,
          }}
        >
          <Grid container rowGap={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Grid item xs={12} sm={8}>
              <Stack width="100%">
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: '550',
                    fontSize: { xs: '2rem', sm: '2.4rem' },
                    fontFamily: 'Instrument Serif, serif',
                  }}
                >
                  {campaign?.name}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontSize: { xs: '0.8rem', sm: '1rem' },
                    color: '#636366',
                    fontWeight: 480,
                  }}
                >
                  {campaign?.company?.name || campaign?.brand?.name}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={4}>
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
                          variant="body2"
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
                  existingPitch.status === 'APPROVED' ? (
                    (() => {
                      // Check if user is marked as Media Kit Mandatory
                      const isMKM = user?.mediaKitMandatory === true;
                      const hasMediaKit = user?.creator && 
                        (user.creator.isFacebookConnected || user.creator.isTiktokConnected);
                      const isDisabled = isMKM && !hasMediaKit;

                      return (
                        <Button
                          variant="contained"
                          onClick={() => !isDisabled && handleManageClick(campaign.id)}
                          disabled={isDisabled}
                          sx={{
                            backgroundColor: isDisabled ? '#f5f5f5' : '#203ff5',
                            color: isDisabled ? '#a1a1a1' : 'white',
                            borderBottom: isDisabled ? '4px solid #d1d1d1 !important' : '4px solid #102387 !important',
                            border: 'none',
                            '&:hover': {
                              backgroundColor: isDisabled ? '#f5f5f5' : '#1935dd',
                              borderBottom: isDisabled ? '4px solid #d1d1d1 !important' : '4px solid #102387 !important',
                            },
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            padding: { xs: '4px 12px', sm: '6px 18px' },
                            minWidth: '100px',
                            height: '42px',
                            boxShadow: 'none',
                            textTransform: 'none',
                            opacity: isDisabled ? 0.7 : 1,
                          }}
                        >
                          Manage
                        </Button>
                      );
                    })()
                  ) : existingPitch.status === 'REJECTED' ? (
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
                    disabled={(() => {
                      // Check if campaign credits are finished
                      if (isCreditsFinished) return true;

                      // Check if user is marked as Media Kit Mandatory
                      const isMKM = user?.mediaKitMandatory === true;

                      // Check if media kit is connected
                      const hasMediaKit =
                        user?.creator &&
                        (user.creator.isFacebookConnected || user.creator.isTiktokConnected);

                      // Check if payment details are completed
                      const hasPaymentDetails =
                        isFormCompleted && user?.paymentForm?.bankAccountName;

                      // For MKM users, require media kit connection
                      if (isMKM && !hasMediaKit) {
                        return true;
                      }

                      // All users need payment details
                      return !hasPaymentDetails;
                    })()}
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
                    {isCreditsFinished ? 'Not available' : 'Pitch Now'}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={handleBookmarkClick}
                  sx={{
                    minWidth: 0,
                    padding: '6px',
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderBottom: '4px solid #e7e7e7',
                    borderRadius: 1,
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify
                    icon={bookMark ? 'mdi:bookmark' : 'mdi:bookmark-outline'}
                    width={18}
                    height={18}
                    sx={{
                      fontSize: 'inherit',
                      transform: 'scale(1.5)',
                    }}
                  />
                </Button>
              </Stack>
            </Grid>

            {/* Warning message for incomplete profile */}
            {(() => {
              // Check if user is marked as Media Kit Mandatory
              const isMKM = user?.mediaKitMandatory === true;

              // Check if media kit is connected
              const hasMediaKit =
                user?.creator &&
                (user.creator.isFacebookConnected || user.creator.isTiktokConnected);

              // Check if payment details are completed
              const hasPaymentDetails = isFormCompleted && user?.paymentForm?.bankAccountName;

              if (isMKM) {
                // For target users, check both media kit and payment details
                if (!hasMediaKit && !hasPaymentDetails) {
                  return (
                    <Typography
                      sx={{
                        flex: 1,
                        textAlign: 'center',
                        p: 1,
                        mt: 1,
                        borderRadius: 1,
                        color: '#FF3500',
                        backgroundColor: '#FFF2F0',
                        fontWeight: 600,
                        fontSize: 12,
                        alignSelf: 'center',
                      }}
                    >
                      <span role="img" aria-label="warning">
                        😮
                      </span>{' '}
                      Oops! You need to{' '}
                      <Link
                        to={paths.dashboard.user.profileTabs.payment}
                        style={{
                          color: '#FF3500',
                          fontWeight: 'inherit',
                        }}
                      >
                        add your payment details
                      </Link>{' '}
                      and{' '}
                      <Link
                        to={paths.dashboard.user.profileTabs.socials}
                        style={{
                          color: '#FF3500',
                          fontWeight: 'inherit',
                        }}
                      >
                        link your media kit
                      </Link>{' '}
                      before you can pitch for campaigns.
                    </Typography>
                  );
                }
                if (!hasMediaKit) {
                  return (
                    <Typography
                      sx={{
                        flex: 1,
                        textAlign: 'center',
                        p: 1,
                        mt: 1,
                        borderRadius: 1,
                        color: '#FF3500',
                        backgroundColor: '#FFF2F0',
                        fontWeight: 600,
                        fontSize: 12,
                        alignSelf: 'center',
                      }}
                    >
                      <span role="img" aria-label="warning">
                        😮
                      </span>{' '}
                      Oops! You need to{' '}
                      <Link
                        to={paths.dashboard.user.profileTabs.socials}
                        style={{
                          color: '#FF3500',
                          fontWeight: 'inherit',
                        }}
                      >
                        link your media kit
                      </Link>{' '}
                      before you can pitch for campaigns.
                    </Typography>
                  );
                }
                if (!hasPaymentDetails) {
                  return (
                    <Typography
                      sx={{
                        flex: 1,
                        textAlign: 'center',
                        p: 1,
                        mt: 2,
                        borderRadius: 1,
                        color: '#FF3500',
                        backgroundColor: '#FFF2F0',
                        fontWeight: 600,
                        fontSize: 12,
                        alignSelf: 'center',
                      }}
                    >
                      Please complete your{' '}
                      <Link
                        to={paths.dashboard.user.profileTabs.payment}
                        style={{
                          color: '#FF3500',
                          fontWeight: 'inherit',
                        }}
                      >
                        payment details
                      </Link>{' '}
                      to access this feature. ☝️
                    </Typography>
                  );
                }
              } else if (!hasPaymentDetails) {
                // For non-target users, only check payment details (original behavior)
                return (
                  <Typography
                    sx={{
                      flex: 1,
                      textAlign: 'center',
                      p: 1,
                      mt: 1,
                      borderRadius: 1,
                      color: '#FF3500',
                      backgroundColor: '#FFF2F0',
                      fontWeight: 600,
                      fontSize: 12,
                      alignSelf: 'center',
                    }}
                  >
                    Please complete your{' '}
                    <Link
                      to={paths.dashboard.user.profileTabs.payment}
                      style={{
                        color: '#FF3500',
                        fontWeight: 'inherit',
                      }}
                    >
                      payment details
                    </Link>{' '}
                    to access this feature. ☝️
                  </Typography>
                );
              }

              return null;
            })()}
          </Grid>

          <Divider sx={{ mt: 2 }} />

          {/* Campaign details */}
          <Box display="flex" flexDirection="row" pb={2.5}>
            {/* Left column */}
            <Stack flex={1}>
              {/* Posting Period */}
              <Box sx={{ ...SubSectionBoxStyles, pt: 2 }}>
                <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                  Posting Period
                </Typography>
                <Typography variant="body2">{renderCampaignPostingPeriod()}</Typography>
              </Box>

              {/* Campaign General Info */}
              <Box>
                <Box
                  sx={{
                    ...SectionBoxStyles,
                    border: '1px solid #0067D5',
                    borderBottom: '3px solid #0067D5',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Iconify icon="material-symbols:info-outline" width={20} color="#0067D5" />
                    <Typography
                      sx={{
                        ...SectionTitleStyles,
                        color: '#0067D5',
                      }}
                    >
                      GENERAL INFORMATION
                    </Typography>
                  </Stack>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ ...SubSectionBoxStyles }}>
                    <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                      Product / Service Name
                    </Typography>
                    <Typography variant="body2">
                      {campaign?.productName || 'Not specified'}
                    </Typography>
                  </Box>
                  <Box sx={{ ...SubSectionBoxStyles }}>
                    <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                      Campaign Info
                    </Typography>
                    <Typography variant="body2">{campaign?.description}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Campaign Target Audience */}
              <Box>
                <Box
                  sx={{
                    ...SectionBoxStyles,
                    border: '1px solid #FF3500',
                    borderBottom: '3px solid #FF3500',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Iconify
                      icon="material-symbols-light:groups-outline"
                      sx={{
                        color: '#FF3500',
                        width: 25,
                        height: 25,
                        mt: -0.5,
                        ml: 0.5,
                      }}
                    />
                    <Typography
                      sx={{
                        ...SectionTitleStyles,
                        color: '#FF3500',
                      }}
                    >
                      {hasSecondaryAudience ? 'PRIMARY AUDIENCE' : 'TARGET AUDIENCE'}
                    </Typography>
                  </Stack>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                  <Box sx={{ ...SubSectionBoxStyles, flex: 1, gap: 1 }}>
                    {[
                      {
                        label: 'Gender',
                        data: campaign?.campaignRequirement?.gender?.map(capitalizeFirstLetter),
                      },
                      { label: 'Age', data: campaign?.campaignRequirement?.age },
                      {
                        label: 'Country',
                        data: campaign?.campaignRequirement?.country
                          ? [campaign.campaignRequirement.country]
                          : [],
                      },
                      { label: 'Language', data: campaign?.campaignRequirement?.language },
                    ].map((item, index) => (
                      <Box sx={{ ...SubSectionBoxStyles }} key={index}>
                        <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                          {item.label}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                          {item.data?.map((value, idx) => (
                            <Chip key={idx} label={value} size="small" sx={ChipStyle} />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ ...SubSectionBoxStyles, flex: 1, gap: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                        Creator&apos;s Interest
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                        {requirement?.creator_persona.map((value, idx) => (
                          <Chip
                            key={idx}
                            label={getProperCase(value)}
                            size="small"
                            sx={ChipStyle}
                          />
                        ))}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                        User Persona
                      </Typography>
                      <Typography variant="body2">{requirement?.user_persona}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                        Geographic Focus
                      </Typography>
                      <Typography variant="body2">{getGeographicFocus()}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Stack>

            {/* Vertical Divider */}
            <Divider orientation="vertical" flexItem sx={{ mx: 3 }} />

            {/* Right column */}
            <Stack flex={1}>
              {/* Campaign Deliverables */}
              <Box>
                <Box
                  sx={{
                    ...SectionBoxStyles,
                    border: '1px solid #1340FF',
                    borderBottom: '3px solid #1340FF',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Iconify
                      icon="material-symbols:unarchive-outline"
                      sx={{
                        color: '#203ff5',
                        width: 20,
                        height: 20,
                      }}
                    />
                    <Typography
                      sx={{
                        ...SectionTitleStyles,
                        color: '#1340FF',
                      }}
                    >
                      DELIVERABLES
                    </Typography>
                  </Stack>
                </Box>
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
                        size="medium"
                        sx={{
                          bgcolor: '#F5F5F5',
                          borderRadius: 1,
                          color: '#231F20',
                          mr: 1,
                          px: 0.8,
                          py: 2,
                          '& .MuiChip-label': {
                            fontWeight: 700,
                            fontSize: 14,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          },
                          '&:hover': { bgcolor: '#F5F5F5' },
                        }}
                      />
                    )
                )}
              </Box>

              {/* Campaign Logistics */}
              {campaign?.logisticsType && (
                <Box>
                  <Box
                    sx={{
                      ...SectionBoxStyles,
                      border: '1px solid #CFB5F6',
                      borderBottom: '3px solid #CFB5F6',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Iconify
                        icon="material-symbols:inventory-2-outline-sharp"
                        sx={{
                          color: '#CFB5F6',
                          width: 20,
                          height: 20,
                        }}
                      />
                      <Typography
                        sx={{
                          ...SectionTitleStyles,
                          color: '#CFB5F6',
                        }}
                      >
                        LOGISTICS
                      </Typography>
                    </Stack>
                  </Box>
                  <Chip
                    label={getlogisticsTypeLabel(campaign?.logisticsType)}
                    size="medium"
                    sx={{
                      bgcolor: '#F5F5F5',
                      borderRadius: 1,
                      color: '#231F20',
                      mr: 1,
                      px: 0.8,
                      py: 2,
                      '& .MuiChip-label': {
                        fontWeight: 700,
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                      '&:hover': { bgcolor: '#F5F5F5' },
                    }}
                  />
                </Box>
              )}

              {/* Client Info */}
              <Box>
                <Box
                  sx={{
                    ...SectionBoxStyles,
                    border: '1px solid #FF9FBD',
                    borderBottom: '3px solid #FF9FBD',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Iconify
                      icon="material-symbols:loyalty-outline"
                      sx={{
                        color: '#FF9FBD',
                        width: 18,
                        height: 18,
                      }}
                    />
                    <Typography
                      sx={{
                        ...SectionTitleStyles,
                        color: '#FF9FBD',
                      }}
                    >
                      CLIENT INFO
                    </Typography>
                  </Stack>
                </Box>
                <Box sx={{ ...SubSectionBoxStyles, gap: 1.5 }}>
                  <Box sx={{ ...SubSectionBoxStyles }}>
                    <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                      Client
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        src={campaign?.company?.logo ?? campaign?.brand?.logo}
                        alt={campaign?.company?.name ?? campaign?.brand?.name}
                        sx={{
                          width: 36,
                          height: 36,
                          border: '2px solid',
                          borderColor: 'background.paper',
                        }}
                      />
                      <Typography variant="body2">
                        {(campaign?.company?.name ?? campaign?.brand?.name) || 'Company Name'}
                      </Typography>
                    </Stack>
                  </Box>
                  {[
                    {
                      label: 'About',
                      value:
                        campaign?.brandAbout ||
                        campaign?.brand?.company?.about ||
                        campaign?.company?.about ||
                        'None',
                    },
                    {
                      label: 'Industry',
                      value: (() => {
                        // company.brand can be an array of brands, each with industries (array)
                        const brands = campaign?.company?.brand || campaign?.brand;
                        if (Array.isArray(brands)) {
                          // Flatten all industries from all brands, remove duplicates, and join
                          const allIndustries = brands
                            .flatMap((b) => (Array.isArray(b.industries) ? b.industries : []))
                            .filter(Boolean);
                          const uniqueIndustries = [...new Set(allIndustries)];
                          return uniqueIndustries.length > 0
                            ? uniqueIndustries.join(', ')
                            : 'Not specified';
                        }
                        return campaign?.campaignBrief.industries;
                      })(),
                    },
                  ].map((item) => (
                    <Box sx={{ ...SubSectionBoxStyles }} key={item.label}>
                      <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2">{item.value || 'Not specified'}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Campaign Secondary Audience */}
              {hasSecondaryAudience && (
                <Box>
                  <Box
                    sx={{
                      ...SectionBoxStyles,
                      border: '1px solid #FF3500',
                      borderBottom: '3px solid #FF3500',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Iconify
                        icon="material-symbols-light:groups-outline"
                        sx={{
                          color: '#FF3500',
                          width: 25,
                          height: 25,
                          mt: -0.5,
                          ml: 0.5,
                        }}
                      />
                      <Typography
                        sx={{
                          ...SectionTitleStyles,
                          color: '#FF3500',
                        }}
                      >
                        SECONDARY AUDIENCE
                      </Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                    <Box sx={{ ...SubSectionBoxStyles, flex: 1, gap: 1 }}>
                      {[
                        {
                          label: 'Gender',
                          data: campaign?.campaignRequirement?.secondary_gender?.map(
                            capitalizeFirstLetter
                          ),
                        },
                        { label: 'Age', data: campaign?.campaignRequirement?.secondary_age },
                        {
                          label: 'Country',
                          data: campaign?.campaignRequirement?.secondary_country
                            ? [campaign.campaignRequirement.secondary_country]
                            : [],
                        },
                        {
                          label: 'Language',
                          data: campaign?.campaignRequirement?.secondary_language,
                        },
                      ]
                        .filter((item) => item.data && item.data.length > 0)
                        .map((item, index) => (
                          <Box sx={{ ...SubSectionBoxStyles }} key={index}>
                            <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                              {item.label}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                              {item.data?.map((value, idx) => (
                                <Chip key={idx} label={value} size="small" sx={ChipStyle} />
                              ))}
                            </Box>
                          </Box>
                        ))}
                    </Box>
                    <Box sx={{ ...SubSectionBoxStyles, flex: 1, gap: 1 }}>
                      {requirement?.secondary_creator_persona &&
                        requirement.secondary_creator_persona.length > 0 && (
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                              Creator&apos;s Interest
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                              {requirement?.secondary_creator_persona.map((value, idx) => (
                                <Chip
                                  key={idx}
                                  label={getProperCase(value)}
                                  size="small"
                                  sx={ChipStyle}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      {requirement?.secondary_user_persona && (
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                            User Persona
                          </Typography>
                          <Typography variant="body2">
                            {requirement?.secondary_user_persona}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>
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
        mutate={mutate}
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

      <MediaKitPopup
        open={showMediaKitPopup}
        onClose={() => setShowMediaKitPopup(false)}
        userId={user?.id || ''}
        showPitchError
      />
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
  mutate: PropTypes.func,
};
