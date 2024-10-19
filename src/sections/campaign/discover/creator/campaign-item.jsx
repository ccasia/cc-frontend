/* eslint-disable no-nested-ternary */
import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useMemo, useState, useEffect } from 'react';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import ListItemText from '@mui/material/ListItemText';
import {
  Grid,
  Card,
  Tooltip,
  Typography,
  IconButton,
  CircularProgress, Avatar, Box, Chip, Button,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import Image from 'src/components/image';
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import CreatorForm from './creator-form';
import CampaignModal from './campaign-modal';
import CampaignPitchOptionsModal from './campaign-pitch-options-modal';

import { alpha } from '@mui/material/styles';
import { Divider } from '@mui/material';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

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
    <Box sx={{ position: 'relative', p: 1.5 }}>
      <Box sx={{ position: 'relative', height: 180, overflow: 'hidden', borderRadius: 1 }}>
        {campaign?.campaignBrief?.images.length > 1 ? (
          <Grid container spacing={1} sx={{ height: '100%' }}>
            <Grid item xs={8} sx={{ height: '100%' }}>
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
            </Grid>
            <Grid item xs={4} sx={{ height: '100%' }}>
              <Stack spacing={1} sx={{ height: '100%' }}>
                {campaign?.campaignBrief?.images.slice(1, 3).map((image, index) => (
                  <Box
                    key={index}
                    sx={{
                      height: 'calc(50% - 4px)',
                      overflow: 'hidden',
                      borderRadius: 1,
                      position: 'relative',
                    }}
                  >
                    <Image
                      alt={`${campaign?.name} ${index + 2}`}
                      src={image}
                      sx={{
                        height: '100%',
                        width: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                      }}
                    />
                    {campaign?.campaignBrief?.images.length > 3 && index === 1 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      >
                        +{campaign?.campaignBrief?.images.length - 3}
                      </Box>
                    )}
                  </Box>
                ))}
              </Stack>
            </Grid>
          </Grid>
        ) : (
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
        )}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '16px',
            padding: '4px 12px 4px 4px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Box position="relative" display="inline-flex" sx={{ mr: 1.5 }}>
            <CircularProgress
              variant="determinate"
              value={Math.min(Math.round(campaign?.percentageMatch), 100)}
              size={32}
              thickness={4}
              sx={{ color: 'success.main' }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" component="div" color="success.main" fontWeight="bold" fontSize={10}>
                {`${Math.min(Math.round(campaign?.percentageMatch), 100)}%`}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="success.main" fontWeight="bold">
            Match
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  const renderCampaignInfo = (
    <Stack 
      direction="row" 
      justifyContent="space-between" 
      alignItems="flex-start" 
      sx={{ p: 2, pb: 1.5 }}
    >
      <Stack spacing={0.5} sx={{ flexGrow: 1, mr: 1 }}>
        <Box
          onClick={(e) => {
            e.stopPropagation();
            campaignInfo.onTrue();
          }}
          sx={{
            cursor: 'pointer',
            '&:hover': { 
              '& > .campaign-title': {
                color: 'primary.main',
                textDecoration: 'underline',
              },
            },
            zIndex: 2,
            position: 'relative',
          }}
        >
          <Typography
            variant="h6"
            className="campaign-title"
            sx={{
              fontWeight: 'bold',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {campaign?.name}
          </Typography>
        </Box>
        <Stack spacing={0.8}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Iconify icon="mdi:office-building" width={14} height={14} sx={{ color: 'text.primary' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'medium' }} noWrap>
                {campaign?.brand?.name ?? campaign?.company?.name}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Iconify icon="streamline:industry-innovation-and-infrastructure-solid" width={14} sx={{ color: 'text.primary' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                {campaign?.campaignBrief?.industries}
              </Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Iconify icon="mdi:clock" width={14} sx={{ color: 'info.main' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {`${dayjs(campaign?.campaignBrief?.startDate).format('MMM D')} - ${dayjs(campaign?.campaignBrief?.endDate).format('MMM D, YYYY')}`}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
      <Tooltip title={campaign?.bookMarkCampaign ? "Unsave" : "Save"}>
        <IconButton 
          onClick={(e) => {
            e.stopPropagation();
            campaign?.bookMarkCampaign ? unSaveCampaign(campaign.bookMarkCampaign.id) : saveCampaign(campaign.id);
          }}
          sx={{ 
            p: 0.5, 
            zIndex: 3,
            color: campaign?.bookMarkCampaign ? 'primary.main' : 'text.secondary',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          <Iconify icon={campaign?.bookMarkCampaign ? "mdi:bookmark" : "mdi:bookmark-outline"} width={20} />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  const renderAction = (
    <Box sx={{ px: 2, pb: 2, position: 'relative', zIndex: 2 }}>
      {pitch && pitch.status === 'pending' && (
        <Chip label="Pending" color="warning" size="small" sx={{ width: '100%', height: 36 }} />
      )}
      {pitch && pitch.status !== 'approved' && pitch.status !== 'pending' && (
        <Chip 
          icon={<Iconify icon="mdi:clock" />}
          label="In Review" 
          color="warning" 
          size="small" 
          sx={{ 
            width: '100%', 
            height: 36,
            '& .MuiChip-label': {
              fontWeight: 'bold',
              color: 'white'
            },
            '& .MuiChip-icon': {
              color: 'white'
            }
          }} 
        />
      )}
      {shortlisted && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip 
            icon={<Iconify icon="mdi:check-circle" />}
            label="Approved" 
            color="success" 
            size="small" 
            sx={{ 
              flexGrow: 1,
              height: 36,
              '& .MuiChip-label': {
                fontWeight: 'bold'
              }
            }} 
          />
          <Button
            variant="contained"
            size="small"
            onClick={() => router.push(paths.dashboard.campaign.creator.detail(campaign.id))}
            sx={{ height: 36 }}
          >
            Manage
          </Button>
        </Stack>
      )}
      {!shortlisted && !pitch && (
        <>
          {upload.find((item) => item.campaignId === campaign.id)?.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress
                variant="determinate"
                value={upload.find((item) => item.campaignId === campaign.id).progress}
                size={24}
              />
            </Box>
          ) : (
            <Button
              variant="contained"
              size="small"
              startIcon={<Iconify icon="mdi:send" width={18} />}
              onClick={() => setOpen(true)}
              disabled={!user?.creator?.isFormCompleted}
              fullWidth
              sx={{ height: 36 }}
            >
              Pitch
            </Button>
          )}
        </>
      )}
    </Box>
  );

  return (
    <>
      <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
        {renderImage}
        {renderCampaignInfo}
        <Divider sx={{ my: 1 }} />
        {renderAction}
    
        <Box
          onClick={handleCardClick}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            cursor: 'pointer',
            zIndex: 1,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        />
      </Card>

      <CampaignModal
        open={campaignInfo.value}
        handleClose={campaignInfo.onFalse}
        openForm={() => setOpen(true)}
        campaign={campaign}
        existingPitch={campaignIds}
        dialog={dialog}
      />
      <CampaignPitchOptionsModal
        open={open}
        handleClose={handleClose}
        campaign={campaign}
        text={text}
        video={video}
      />
      <CreatorForm dialog={dialog} user={user} />
    </>
  );
}

CampaignItem.propTypes = {
  campaign: PropTypes.object,
  user: PropTypes.object,
};
