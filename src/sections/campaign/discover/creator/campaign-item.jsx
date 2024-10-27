/* eslint-disable no-nested-ternary */
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useMemo, useState, useEffect } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import { Box, Card, Chip, Avatar, Typography, CircularProgress } from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import Image from 'src/components/image';

import CampaignModal from './campaign-modal';

// ----------------------------------------------------------------------

export default function CampaignItem({ campaign, user }) {
  const [open, setOpen] = useState(false);
  const [upload, setUpload] = useState([]);
  const [, setLoading] = useState(false);
  const dialog = useBoolean();
  const text = useBoolean();
  const video = useBoolean();

  const { socket } = useSocketContext();
  const router = useRouter();
  const theme = useTheme();

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

  // const pitch = useMemo(
  //   () => campaign?.pitch?.filter((elem) => elem.userId.includes(user?.id))[0],
  //   [campaign, user]
  // );

  const pitch = useMemo(
    () => campaign?.pitch?.find((elem) => elem.userId === user?.id),
    [campaign, user]
  );

  const shortlisted = useMemo(
    () => campaign?.shortlisted?.filter((elem) => elem.userId.includes(user?.id))[0],
    [campaign, user]
  );

  const campaignIds = useMemo(() => user?.pitch?.map((item) => item.campaignId), [user]) || [];

  const handleClose = () => {
    setOpen(false);
  };

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
      <Chip
        label={campaign?.campaignBrief?.industries}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          backgroundColor: alpha(theme.palette.grey[800], 0.6),
          backdropFilter: 'blur(10px)',
          color: theme.palette.common.white,
          fontWeight: 'bold',
          fontSize: '0.875rem',
          borderRadius: '20px',
          height: '32px',
          '& .MuiChip-label': {
            padding: '0 12px',
          },
          '&:hover': {
            backgroundColor: alpha(theme.palette.grey[800], 0.6),
          },
        }}
      />
    </Box>
  );

  const renderCampaignInfo = (
    <Box sx={{ position: 'relative', pt: 3, px: 3, pb: 2.5 }}>
      <Avatar
        src={campaign?.brand?.logo || campaign?.company?.logo}
        alt={campaign?.brand?.name || campaign?.company?.name}
        sx={{
          width: 56,
          height: 56,
          border: '2px solid #ebebeb',
          borderRadius: '50%',
          position: 'absolute',
          top: -30,
          left: 17,
        }}
      />
      <Box sx={{ mt: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: -0.5 }}>
          {campaign?.name}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            mb: 2,
            color: '#8e8e93',
          }}
        >
          {campaign?.brand?.name || campaign?.company?.name}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
        <Box sx={{ position: 'relative', display: 'inline-flex', mr: 1 }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={25}
            thickness={7}
            sx={{ color: 'grey.300' }}
          />
          <CircularProgress
            variant="determinate"
            value={Math.min(Math.round(campaign?.percentageMatch), 100)}
            size={25}
            thickness={7}
            sx={{
              color: 'success.main',
              position: 'absolute',
              left: 0,
              strokeLinecap: 'round',
            }}
          />
        </Box>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
          {`${Math.min(Math.round(campaign?.percentageMatch), 100)}% Match for you!`}
        </Typography>
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
          borderRadius: '25px',
          border: '1px solid transparent',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          mb: -0.5,
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
        // openForm={() => setOpen(true)}
        campaign={campaign}
        // existingPitch={campaignIds}
        // dialog={dialog}
      />
    </>
  );
}

CampaignItem.propTypes = {
  campaign: PropTypes.object,
  user: PropTypes.object,
};
