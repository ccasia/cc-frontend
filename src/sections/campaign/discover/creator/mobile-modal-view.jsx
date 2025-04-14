import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';
import { useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';

import {
  Box,
  Stack,
  Button,
  Container,
  Typography,
  Avatar,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { useSettingsContext } from 'src/components/settings';
import Iconify from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import Image from 'src/components/image';
import { useBoolean } from 'src/hooks/use-boolean';

import { fetcher, endpoints } from 'src/utils/axios';
import { useAuthContext } from 'src/auth/hooks';
import CampaignPitchOptionsModal from './campaign-pitch-options-modal';

import CampaignModalMobile from './campaign-modal-mobile';
import CreatorForm from './creator-form';

// ----------------------------------------------------------------------

const calculateMatchPercentage = (user, campaign) => {
  if (!user?.creator || !campaign?.campaignRequirement) return 0;

  const creator = user.creator;
  const requirements = campaign.campaignRequirement;

  // Calculate interest matching percentage
  const calculateInterestMatchingPercentage = () => {
    if (!requirements?.creator_persona?.length || !creator?.interests?.length) return 0;

    const creatorInterests = creator.interests
      .map((int) => (typeof int === 'string' ? int.toLowerCase() : int?.name?.toLowerCase()))
      .filter(Boolean);

    const matchingInterests = creatorInterests.filter((interest) =>
      requirements.creator_persona.map((p) => p.toLowerCase()).includes(interest)
    ).length;

    return (matchingInterests / requirements.creator_persona.length) * 100;
  };

  // Calculate requirements matching percentage
  const calculateRequirementMatchingPercentage = () => {
    let matches = 0;
    let totalCriteria = 0;

    // Age check
    if (requirements?.age?.length) {
      totalCriteria += 1;
      const creatorAge = dayjs().diff(dayjs(creator.birthDate), 'year');
      const isAgeInRange = requirements.age.some((range) => {
        const [min, max] = range.split('-').map(Number);
        return creatorAge >= min && creatorAge <= max;
      });
      if (isAgeInRange) matches += 1;
    }

    // Gender check
    if (requirements?.gender?.length) {
      totalCriteria += 1;
      let creatorGender = 'nonbinary';

      if (creator.pronounce === 'he/him') {
        creatorGender = 'male';
      } else if (creator.pronounce === 'she/her') {
        creatorGender = 'female';
      }

      if (requirements.gender.includes(creatorGender)) matches += 1;
    }

    // Language check
    if (requirements?.language?.length && creator.languages?.length) {
      totalCriteria += 1;
      const hasLanguageMatch = creator.languages.some((lang) =>
        requirements.language.map((l) => l.toLowerCase()).includes(lang.toLowerCase())
      );
      if (hasLanguageMatch) matches += 1;
    }

    return totalCriteria > 0 ? (matches / totalCriteria) * 100 : 0;
  };

  const interestMatch = calculateInterestMatchingPercentage();
  const requirementMatch = calculateRequirementMatchingPercentage();

  return Math.round(interestMatch * 0.5 + requirementMatch * 0.5);
};

const MobileModalView = () => {
  const settings = useSettingsContext();
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuthContext();
  const theme = useTheme();
  const { isFormCompleted } = user.creator;
  const dialog = useBoolean();

  const { data: campaignData, isLoading } = useSWR(
    endpoints.campaign.creator.getCampaign(id),
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnMount: true,
    }
  );

  // console.log('Campaign Data:', campaignData);
  // console.log('Campaign Data Structure:', {
  //   percentageMatch: campaignData?.percentageMatch,
  //   data: campaignData?.data?.percentageMatch,
  //   fullData: campaignData
  // });

  const existingPitch = useMemo(
    () => user?.pitch && user?.pitch.find((item) => item.campaignId === campaignData?.id),
    [campaignData, user]
  );

  const draftPitch = useMemo(
    () => user?.draftPitch && user?.draftPitch.find((item) => item.campaignId === campaignData?.id),
    [campaignData, user]
  );

  const hasPitched = useMemo(
    () => !!existingPitch && existingPitch.status !== 'draft',
    [existingPitch]
  );

  const hasDraft = useMemo(
    () => !!draftPitch || (existingPitch && existingPitch.status === 'draft'),
    [draftPitch, existingPitch]
  );

  const isShortlisted = useMemo(
    () =>
      user &&
      user?.shortlisted &&
      user?.shortlisted.some(
        (item) => item.userId === user?.id && item.campaignId === campaignData?.id
      ),
    [campaignData, user]
  );

  const calculateDaysLeft = (endDate) => {
    if (!endDate) return 'No end date';

    const end = new Date(endDate);
    const today = new Date();

    if (end < today) return 'Campaign Ended';

    const diffTime = Math.abs(end - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

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

  const handleDraftClick = () => {
    setTextPitchOpen(true);
  };

  const renderActionButton = () => {
    if (!isFormCompleted || !user?.paymentForm?.bankAccountName) {
      return (
        <>
          <Stack direction="row" spacing={1} alignItems="center" width="100%">
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
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                  Please complete your payment details to access this feature
                </Typography>
                <Button
                  size="small"
                  onClick={() => {
                    router.push(paths.dashboard.user.profile);
                  }}
                  sx={{
                    color: '#1340FF',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    minWidth: 'auto',
                    textTransform: 'none',
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
              fullWidth
              variant="contained"
              disabled
              sx={{
                backgroundColor: '#f5f5f5',
                color: '#a1a1a1',
                borderBottom: '4px solid #d1d1d1 !important',
                border: 'none',
                fontSize: '0.875rem',
                padding: '6px 18px',
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

          <CreatorForm dialog={dialog} user={user} />
        </>
      );
    }

    if (hasPitched) {
      if (existingPitch.status === 'approved') {
        return (
          <Button
            fullWidth
            variant="contained"
            onClick={() => router.push(paths.dashboard.campaign.creator.detail(campaignData.id))}
            sx={{
              backgroundColor: '#203ff5',
              color: 'white',
              borderBottom: '4px solid #102387 !important',
              border: 'none',
              '&:hover': {
                backgroundColor: '#1935dd',
                borderBottom: '4px solid #102387 !important',
              },
              fontSize: '0.875rem',
              padding: '6px 18px',
              height: '42px',
              boxShadow: 'none',
              textTransform: 'none',
            }}
          >
            Manage
          </Button>
        );
      }

      if (existingPitch.status === 'rejected') {
        return (
          <Chip
            icon={<Iconify icon="mdi:close-circle" />}
            label="Rejected"
            sx={{
              width: '100%',
              bgcolor: 'error.light',
              color: 'error.dark',
              fontWeight: 700,
              fontSize: '0.875rem',
              height: '42px',
              '& .MuiChip-icon': {
                fontSize: 20,
                color: 'error.dark',
              },
              '&:hover': { bgcolor: 'error.light' },
            }}
          />
        );
      }

      return (
        <Chip
          icon={<Iconify icon="mdi:clock" />}
          label="In Review"
          sx={{
            width: '100%',
            bgcolor: 'background.paper',
            color: 'text.primary',
            fontWeight: 600,
            fontSize: '0.875rem',
            height: '42px',
            border: '1px solid',
            borderBottom: '4px solid',
            borderColor: 'divider',
            '& .MuiChip-icon': {
              fontSize: 18,
              color: '#f7c945',
            },
            '&:hover': { bgcolor: 'action.hover' },
          }}
        />
      );
    }

    if (hasDraft) {
      return (
        <Button
          fullWidth
          variant="contained"
          onClick={handleDraftClick}
          startIcon={<Iconify icon="mdi:file-document-edit-outline" />}
          sx={{
            bgcolor: '#FFD700',
            color: '#8B4513',
            '&:hover': {
              bgcolor: '#FFC300',
            },
            fontSize: '0.875rem',
            padding: '8px 16px',
            height: '42px',
            fontWeight: 700,
          }}
        >
          Draft
        </Button>
      );
    }

    if (isShortlisted) {
      return (
        <Button
          fullWidth
          variant="contained"
          onClick={() => router.push(paths.dashboard.campaign.creator.detail(campaignData.id))}
          sx={{
            backgroundColor: '#203ff5',
            color: 'white',
            borderBottom: '4px solid #102387 !important',
            border: 'none',
            '&:hover': {
              backgroundColor: '#1935dd',
              borderBottom: '4px solid #102387 !important',
            },
            fontSize: '0.875rem',
            padding: '6px 18px',
            height: '42px',
            boxShadow: 'none',
            textTransform: 'none',
          }}
        >
          Manage
        </Button>
      );
    }

    return (
      <Button
        fullWidth
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
          fontSize: '1rem',
          padding: '8px 20px',
          height: '48px',
          boxShadow: 'none',
          textTransform: 'none',
          whiteSpace: 'nowrap',
          borderRadius: '10px',
        }}
      >
        Pitch Now
      </Button>
    );
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Stack spacing={1}>
        <Button
          color="inherit"
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
          onClick={() => router.push(paths.dashboard.campaign.view)}
          sx={{
            alignSelf: 'flex-start',
            color: '#636366',
            fontSize: { xs: '0.9rem', sm: '1rem' },
            mb: 1,
            mt: 1,
            ml: 0.5,
            fontWeight: 550,
          }}
        >
          Back
        </Button>

        <Box sx={{ position: 'relative', mb: 4 }}>
          <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 2 }}>
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
                    value={Math.min(Math.round(calculateMatchPercentage(user, campaignData)), 100)}
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
              label={`${Math.min(Math.round(calculateMatchPercentage(user, campaignData)), 100)}% MATCH FOR YOU!`}
              sx={{
                backgroundColor: theme.palette.common.white,
                color: '#48484a',
                fontWeight: 'bold',
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

          <Avatar
            src={campaignData?.company?.logo}
            sx={{
              position: 'absolute',
              top: 215,
              left: 25,
              width: 64,
              height: 64,
              border: '3px solid',
              borderColor: 'common.white',
              zIndex: 9,
            }}
          />

          <Box sx={{ height: 250, overflow: 'hidden', borderRadius: 2, mx: 1 }}>
            <Image
              alt={campaignData?.name}
              src={campaignData?.campaignBrief?.images[0]}
              sx={{
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
          </Box>
        </Box>

        <Stack spacing={0.5} sx={{ mt: 2, px: 1 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: '550',
              fontSize: '2rem',
              fontFamily: 'Instrument Serif, serif',
              mt: -3,
            }}
          >
            {campaignData?.name}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: '1.05rem',
              color: '#636366',
              fontWeight: 400,
              mt: '-4px !important',
            }}
          >
            {campaignData?.company?.name}
          </Typography>

          <Box sx={{ mt: 2 }}>{renderActionButton()}</Box>
        </Stack>
      </Stack>

      {campaignData?.isKWSPCampaign && (
        <Box
          mt={4}
          sx={{
            border: '1.5px solid #0062CD',
            borderBottom: '4px solid #0062CD',
            borderRadius: 1,
            p: 1,
            mb: 1,
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
                Score an extra RM100! T&C’s apply.
              </Typography>
            </Stack>
          </Stack>
        </Box>
      )}

      {campaignData ? <CampaignModalMobile campaign={campaignData} /> : <LoadingScreen />}
      <CampaignPitchOptionsModal
        open={pitchOptionsOpen}
        handleClose={handlePitchOptionsClose}
        campaign={campaignData}
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
    </Container>
  );
};

// MobileModalView.propTypes = {
//   campaign: PropTypes.object,
// };

export default MobileModalView;
