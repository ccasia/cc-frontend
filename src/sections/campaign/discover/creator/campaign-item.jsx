/* eslint-disable no-nested-ternary */
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useState, useEffect } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import { Bookmark, BookmarkBorder } from '@mui/icons-material';
import { Box, Card, Chip, Avatar, Typography, CircularProgress } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import Image from 'src/components/image';

import CampaignModal from './campaign-modal';

// ----------------------------------------------------------------------

export default function CampaignItem({ campaign, user, onOpenCreatorForm }) {
  // const [open, setOpen] = useState(false);
  const [upload, setUpload] = useState([]);
  const [, setLoading] = useState(false);
  // const dialog = useBoolean();
  // const text = useBoolean();
  // const video = useBoolean();

  const { socket } = useSocketContext();
  // const router = useRouter();
  const theme = useTheme();

  const [bookMark, setBookMark] = useState(
    campaign?.bookMarkCampaign?.some((item) => item.userId === user?.id) || false
  );

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
      mutate(endpoints.campaign.getAllActiveCampaign);
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
  }, [socket, upload]);

  const saveCampaign = async (campaignId) => {
    try {
      const res = await axiosInstance.post(endpoints.campaign.creator.saveCampaign, {
        campaignId,
        userId: user?.id,
      });
      mutate(endpoints.campaign.getMatchedCampaign);
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
      mutate(endpoints.campaign.getMatchedCampaign);
      setBookMark(false);
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Error', {
        variant: 'error',
      });
    }
  };

  // const pitch = useMemo(
  //   () => campaign?.pitch?.filter((elem) => elem.userId.includes(user?.id))[0],
  //   [campaign, user]
  // );

  // const pitch = useMemo(
  //   () => campaign?.pitch?.find((elem) => elem.userId === user?.id),
  //   [campaign, user]
  // );

  // const shortlisted = useMemo(
  //   () => campaign?.shortlisted?.filter((elem) => elem.userId.includes(user?.id))[0],
  //   [campaign, user]
  // );

  // const campaignIds = useMemo(() => user?.pitch?.map((item) => item.campaignId), [user]) || [];

  // const handleClose = () => {
  //   setOpen(false);
  // };

  const campaignInfo = useBoolean();

  const handleCardClick = () => {
    campaignInfo.onTrue();
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
            border: '1px solid #ebebeb',
            borderBottom: '3px solid #ebebeb',
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
        <Typography variant="h5" sx={{ fontWeight: 650, mb: -0.1, pb: 0.2, mt: 0.8 }}>
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
          mb: -0.5,
          height: 335,
          '&:hover': {
            borderColor: '#1340ff',
            transform: 'translateY(-2px)',
          },
        }}
        onClick={handleCardClick}
      >
        {renderImage}
        {renderCampaignInfo}
      </Card>

      <CampaignModal
        open={campaignInfo.value}
        handleClose={campaignInfo.onFalse}
        campaign={campaign}
        bookMark={bookMark}
        onSaveCampaign={saveCampaign}
        onUnsaveCampaign={unSaveCampaign}
        onOpenCreatorForm={onOpenCreatorForm}
      />
    </>
  );
}

CampaignItem.propTypes = {
  campaign: PropTypes.object,
  user: PropTypes.object,
  onOpenCreatorForm: PropTypes.func,
};
