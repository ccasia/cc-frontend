/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router';
import { enqueueSnackbar } from 'notistack';
import { useState, useEffect } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Bookmark, BookmarkBorder } from '@mui/icons-material';
import { Box, Card, Chip, Avatar, Typography, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import Image from 'src/components/image';

import CreatorForm from './creator-form';
import CampaignModal from './campaign-modal';

// ----------------------------------------------------------------------

export default function CampaignItem({ campaign, user, onOpenCreatorForm, mutate }) {
  const [upload, setUpload] = useState([]);
  const [, setLoading] = useState(false);
  const dialog = useBoolean();
  const campaignID = localStorage.getItem('campaign');
  const campaignInfo = useBoolean(campaignID === campaign.id);

  const navigation = useNavigate();

  const { socket } = useSocketContext();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [bookMark, setBookMark] = useState(
    campaign?.bookMarkCampaign?.some((item) => item.userId === user?.id) || false
  );

  const router = useRouter();

  useEffect(() => {
    const handlePitchLoading = (data) => {
      setLoading(true);

      if (upload.find((item) => item.campaignId === data.campaignId)) {
        setUpload((prev) =>
          prev.map((item) =>
            item.campaignId === data.campaignId
              ? {
                  campaignId: data.campaignId,
                  loading: true,
                  progress: Math.floor(data.progress),
                }
              : item
          )
        );
      } else {
        setUpload((item) => [
          ...item,
          { loading: true, campaignId: data.campaignId, progress: Math.floor(data.progress) },
        ]);
      }
    };

    const handlePitchSuccess = (data) => {
      mutate();
      enqueueSnackbar(data.name);
      setUpload((prevItems) => prevItems.filter((item) => item.campaignId !== data.campaignId));
      setLoading(false);
    };

    socket?.on('pitch-loading', handlePitchLoading);
    socket?.on('pitch-uploaded', handlePitchSuccess);

    return () => {
      socket?.off('pitch-loading', handlePitchLoading);
      socket?.off('pitch-uploaded', handlePitchSuccess);
    };
  }, [socket, upload, mutate]);

  const saveCampaign = async (campaignId) => {
    try {
      const res = await axiosInstance.post(endpoints.campaign.creator.saveCampaign, {
        campaignId,
        userId: user?.id,
      });
      mutate();
      // mutate(endpoints.campaign.creator.getSavedCampaigns);
      setBookMark(true);
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
      mutate();
      setBookMark(false);
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Error', {
        variant: 'error',
      });
    }
  };

  const handleCardClick = () => {
    if (isMobile) {
      router.push(paths.dashboard.campaign.creator.discover(campaign.id));
    } else {
      localStorage.setItem('campaign', campaign.id);
      campaignInfo.onTrue();
    }
  };

  const renderImage = (
    <Box sx={{ position: 'relative', height: 180, overflow: 'hidden' }}>
      <Image
        alt={campaign?.name}
        src={campaign?.campaignBrief?.images[0]}
        sx={{
          height: '100%',
          width: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
      <Box sx={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 1 }}>
        <Chip
          label={campaign?.campaignBrief?.industries}
          sx={{
            backgroundColor: theme.palette.common.white,
            color: '#48484a',
            fontWeight: 600,
            fontSize: '0.875rem',
            borderRadius: '5px',
            height: '32px',
            border: '1.2px solid #e7e7e7',
            borderBottom: '3px solid #e7e7e7',
            '& .MuiChip-label': {
              padding: '0 8px',
            },
            '&:hover': {
              backgroundColor: theme.palette.common.white,
            },
          }}
        />
      </Box>
    </Box>
  );

  const renderCampaignInfo = (
    <Box sx={{ position: 'relative', pt: 2, px: 3, pb: 2.5 }}>
      <Avatar
        src={campaign?.brand?.logo || campaign?.company?.logo}
        alt={campaign?.brand?.name || campaign?.company?.name}
        sx={{
          width: 56,
          height: 56,
          border: '2px solid #ebebeb',
          borderRadius: '50%',
          position: 'absolute',
          top: -40,
          left: 17,
        }}
      />
      <Box sx={{ mt: 0.5 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 650,
            mb: -0.1,
            pb: 0.2,
            mt: 0.8,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {campaign?.name}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            color: '#8e8e93',
            fontSize: '0.95rem',
            fontWeight: 550,
          }}
        >
          {campaign?.brand?.name || campaign?.company?.name}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          label={`${Math.min(Math.round(campaign?.percentageMatch), 100)}% MATCH`} // totalCompletion
          sx={{
            backgroundColor: theme.palette.common.white,
            color: '#48484a',
            fontWeight: 'bold',
            fontSize: '0.875rem',
            borderRadius: '6px',
            height: '35px',
            border: '1.2px solid #e7e7e7',
            borderBottom: '3px solid #e7e7e7',
            '& .MuiChip-label': {
              padding: '0 8px 0 12px',
            },
            '&:hover': {
              backgroundColor: theme.palette.common.white,
            },
          }}
        />
        <Chip
          icon={
            bookMark ? <Bookmark sx={{ fontSize: 24 }} /> : <BookmarkBorder sx={{ fontSize: 24 }} />
          }
          onClick={(e) => {
            e.stopPropagation();
            if (bookMark) {
              unSaveCampaign(
                campaign?.bookMarkCampaign?.find((item) => item.userId === user?.id)?.id
              );
            } else {
              saveCampaign(campaign?.id);
            }
          }}
          sx={{
            backgroundColor: theme.palette.common.white,
            color: '#48484a',
            fontWeight: 'bold',
            fontSize: '0.875rem',
            borderRadius: '8px',
            height: '40px',
            border: '1px solid #ebebeb',
            borderBottom: '3px solid #ebebeb',
            '& .MuiChip-label': {
              display: 'none',
            },
            '& .MuiChip-icon': {
              marginRight: 0,
              marginLeft: 0,
              color: bookMark ? '#232b35' : '#48484a',
              fontSize: 24,
            },
            '&:hover': {
              backgroundColor: alpha('#232b35', 0.08),
            },
            width: '40px',
            padding: 0,
            transition: 'background-color 0.2s ease-in-out',
          }}
        />
      </Box>
    </Box>
  );

  return (
    <>
      <Card
        sx={{
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s',
          bgcolor: 'background.paper',
          borderRadius: '15px',
          border: '1.2px solid',
          borderColor: '#ebebeb',
          position: 'relative',
          mb: -0.5,
          height: 335,
          '&:hover': {
            borderColor: '#1340ff',
            transform: 'translateY(-2px)',
          },
        }}
        onClick={handleCardClick}
      >
        {false && (
          <Box
            mt={4}
            sx={{
              border: '1.5px solid #0062CD',
              borderBottom: '4px solid #0062CD',
              borderRadius: 1,
              p: 0.5,
              px: 1,
              mb: 1,
              position: 'absolute',
              right: 15,
              top: '38%',
              zIndex: 10000,
              bgcolor: 'white',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#0062CD',
                fontWeight: 600,
              }}
            >
              Partnered with KWSP i-Saraan{' '}
            </Typography>
          </Box>
        )}
        {renderImage}
        {renderCampaignInfo}
      </Card>

      <CreatorForm dialog={dialog} user={user} />

      {!isMobile && (
        <CampaignModal
          dialog={dialog}
          open={campaignInfo.value}
          // handleClose={() => {
          //   const url = new URLSearchParams(window.location.href);
          //   if (url.has('campaign')) {
          //     url.delete('campaign');
          //   }
          //   localStorage.removeItem('campaign');
          //   campaignInfo.onFalse();
          //   window.location.href = url.toString();
          // }}
          handleClose={() => {
            const url = new URL(window.location.href);

            if (url.searchParams.has('campaign')) {
              url.searchParams.delete('campaign');
            }

            localStorage.removeItem('campaign');
            campaignInfo.onFalse();

            navigation(url.pathname + url.search, { replace: true });
          }}
          campaign={campaign}
          bookMark={bookMark}
          onSaveCampaign={saveCampaign}
          onUnsaveCampaign={unSaveCampaign}
          onOpenCreatorForm={onOpenCreatorForm}
        />
      )}
    </>
  );
}

CampaignItem.propTypes = {
  campaign: PropTypes.object,
  user: PropTypes.object,
  onOpenCreatorForm: PropTypes.func,
  mutate: PropTypes.func,
};
