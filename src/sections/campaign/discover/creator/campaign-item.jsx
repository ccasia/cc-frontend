/* eslint-disable no-nested-ternary */
import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useMemo, useState, useEffect } from 'react';

import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import ListItemText from '@mui/material/ListItemText';
import { Grid, Chip, Tooltip, Typography, IconButton, CircularProgress } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import Image from 'src/components/image';
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import CampaignModal from './campaign-modal';
import CampaignPitchOptionsModal from './campaign-pitch-options-modal';

// ----------------------------------------------------------------------

export default function CampaignItem({ campaign, user }) {
  const [open, setOpen] = useState(false);
  const [upload, setUpload] = useState([]);
  const [, setLoading] = useState(false);

  const { socket } = useSocketContext();

  useEffect(() => {
    // Define the handler function
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

    // Attach the event listener
    socket.on('pitch-loading', handlePitchLoading);
    socket.on('pitch-uploaded', handlePitchSuccess);

    // Clean-up function
    return () => {
      socket.off('pitch-loading', handlePitchLoading);
      socket.off('pitch-uploaded', handlePitchSuccess);
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

  const pitch = useMemo(
    () => campaign?.pitch?.filter((elem) => elem.userId.includes(user?.id))[0],
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

  const renderImages = (
    <Stack
      spacing={0.5}
      direction="row"
      sx={{
        p: (theme) => theme.spacing(1, 1, 0, 1),
      }}
    >
      <Stack flexGrow={1} sx={{ position: 'relative' }}>
        <Image
          alt={campaign?.name}
          src={campaign?.campaignBrief?.images[0]}
          sx={{ borderRadius: 1, height: 164, width: 1 }}
        />
      </Stack>
      <Stack spacing={0.5}>
        <Image
          alt={campaign?.name}
          src={campaign?.campaignBrief?.images[1]}
          ratio="1/1"
          sx={{ borderRadius: 1, width: 80 }}
        />
        <Image
          alt={campaign?.name}
          src={campaign?.campaignBrief?.images[2]}
          ratio="1/1"
          sx={{ borderRadius: 1, width: 80 }}
        />
      </Stack>
    </Stack>
  );

  const renderTexts = (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        p: (theme) => theme.spacing(2.5, 2.5, 2, 2.5),
      }}
    >
      <ListItemText
        primary={
          <Link
            component="a"
            color="inherit"
            onClick={() => campaignInfo?.onTrue()}
            sx={{
              cursor: 'pointer',
            }}
          >
            {campaign?.name}
          </Link>
        }
        secondary={`by ${campaign?.brand?.name ?? campaign?.company?.name}`}
        primaryTypographyProps={{
          noWrap: true,
          component: 'span',
          color: 'text.primary',
          typography: 'subtitle1',
        }}
        secondaryTypographyProps={{
          noWrap: true,
          color: 'text.disabled',
          typography: 'caption',
        }}
      />

      {campaign?.bookMarkCampaign ? (
        <Tooltip title="Saved">
          <IconButton
            onClick={() => {
              unSaveCampaign(campaign.bookMarkCampaign.id);
            }}
          >
            <Iconify icon="flowbite:bookmark-solid" width={25} />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Save">
          <IconButton
            onClick={() => {
              saveCampaign(campaign.id);
            }}
          >
            <Iconify icon="mynaui:bookmark" width={25} />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );

  const renderInfo = (
    <Stack
      spacing={1.5}
      sx={{
        p: (theme) => theme.spacing(0, 2.5, 2.5, 2.5),
      }}
    >
      {pitch && pitch.status === 'pending' && (
        <Label
          color="warning"
          sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
          }}
        >
          Pending
        </Label>
      )}
      {pitch && pitch.status !== 'approved' && pitch.status !== 'pending' && (
        <Label
          sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            color: (theme) => theme.palette.text.secondary,
          }}
        >
          In Review
        </Label>
      )}
      {shortlisted && (
        <Label
          sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
          }}
          color="success"
        >
          Approved
        </Label>
      )}
      {!shortlisted && !pitch && (
        <>
          {upload.find((item) => item.campaignId === campaign.id)?.loading ? (
            <CircularProgress
              sx={{ position: 'absolute', bottom: 10, right: 10 }}
              variant="determinate"
              value={upload.find((item) => item.campaignId === campaign.id).progress}
            />
          ) : (
            <LoadingButton
              sx={{ position: 'absolute', bottom: 10, right: 10 }}
              variant="contained"
              size="small"
              startIcon={<Iconify icon="ph:paper-plane-tilt-bold" width={20} />}
              onClick={() => setOpen(true)}
            >
              Pitch
            </LoadingButton>
          )}
        </>
      )}

      <Grid container>
        <Grid item xs={1}>
          <Iconify icon="mingcute:location-fill" sx={{ color: 'error.main' }} />
        </Grid>
        <Grid item xs={11}>
          <Stack gap={1.5} direction="row" alignItems="center" flexWrap="wrap">
            {campaign?.campaignBrief?.industries.map((e, index) => (
              <Stack key={index} direction="row" spacing={1} flexWrap="wrap">
                <Label color="primary">{e}</Label>
              </Stack>
            ))}
          </Stack>
        </Grid>
      </Grid>

      <Grid container>
        <Grid item xs={1}>
          <Iconify icon="solar:clock-circle-bold" sx={{ color: 'info.main' }} />
        </Grid>
        <Grid item xs={11}>
          <Typography variant="caption" color="text.disabled">
            {`${dayjs(campaign?.campaignBrief?.startDate).format('LL')} - ${dayjs(campaign?.campaignBrief?.endDate).format('LL')}`}
          </Typography>
        </Grid>
      </Grid>
    </Stack>
  );

  return (
    <>
      <Card sx={{ position: 'relative' }}>
        {renderImages}

        {renderTexts}

        {renderInfo}

        <Chip
          sx={{ position: 'absolute', top: 10, left: 10 }}
          variant="filled"
          color="success"
          size="small"
          label={`${Math.ceil(campaign?.percentageMatch)} % Match`}
        />
      </Card>

      <CampaignModal
        open={campaignInfo.value}
        handleClose={campaignInfo.onFalse}
        openForm={() => setOpen(true)}
        campaign={campaign}
        existingPitch={campaignIds}
      />
      <CampaignPitchOptionsModal open={open} handleClose={handleClose} campaign={campaign} />
    </>
  );
}

CampaignItem.propTypes = {
  campaign: PropTypes.object,
  user: PropTypes.object,
};
