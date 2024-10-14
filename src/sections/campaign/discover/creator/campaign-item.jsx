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
import { Grid, Card, Tooltip, Typography, IconButton, CircularProgress } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import Image from 'src/components/image';
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import CreatorForm from './creator-form';
import CampaignModal from './campaign-modal';
import CampaignPitchOptionsModal from './campaign-pitch-options-modal';
import Carousel from 'src/components/carousel/carousel';

// ----------------------------------------------------------------------

export default function CampaignItem({ campaign, user }) {
  const [open, setOpen] = useState(false);
  const [upload, setUpload] = useState([]);
  const [, setLoading] = useState(false);
  const dialog = useBoolean();

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
    socket?.on('pitch-loading', handlePitchLoading);
    socket?.on('pitch-uploaded', handlePitchSuccess);

    // Clean-up function
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

  // const renderImages = (
  //   <Stack
  //     spacing={0.5}
  //     direction="row"
  //     sx={{
  //       p: (theme) => theme.spacing(1, 1, 0, 1),
  //     }}
  //   >
  //     <Stack flexGrow={1} sx={{ position: 'relative' }}>
  //       <Image
  //         alt={campaign?.name}
  //         src={campaign?.campaignBrief?.images[0]}
  //         sx={{ borderRadius: 1, height: 164, width: 1 }}
  //       />
  //     </Stack>
  //     {campaign?.campaignBrief?.images.length > 1 && (
  //       <Stack spacing={0.5}>
  //         {campaign?.campaignBrief?.images?.slice(1).map((image) => (
  //           <Image
  //             alt={campaign?.name}
  //             src={image}
  //             ratio="1/1"
  //             sx={{ borderRadius: 1, width: 80 }}
  //           />
  //         ))}
  //       </Stack>
  //     )}
  //   </Stack>
  // );

  const renderImages = (
    <Stack
      spacing={0.5}
      direction="row"
      sx={{
        p: (theme) => theme.spacing(1, 1, 0, 1),
      }}
    >
      <Stack flexGrow={1} direction="row" gap={1}>
        <Image
          alt={campaign?.name}
          src={campaign?.campaignBrief?.images[0]}
          sx={{ borderRadius: 1, height: 164, width: 1 }}
        />
        {campaign?.campaignBrief?.images.length === 2 && (
          <Image
            alt={campaign?.name}
            src={campaign?.campaignBrief?.images[1]}
            ratio="1/1"
            sx={{ borderRadius: 1, width: 1, height: 164 }}
          />
        )}
      </Stack>
      {campaign?.campaignBrief?.images.length === 3 && (
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
      )}
    </Stack>
  );

  // const renderImages = <Carousel images={campaign?.campaignBrief?.images} />;

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

      <Stack direction="row" alignItems="center">
        <Label color="info">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption">Match</Typography>
            <Typography variant="caption" sx={{ fontWeight: 'bolder', fontSize: 10 }}>
              {`${Math.round(campaign?.percentageMatch)}%`}
            </Typography>
            {/* <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={Math.round(campaign?.percentageMatch)}
                size="20px"
                sx={{
                  ' .MuiCircularProgress-circle': {
                    stroke: (theme) =>
                      theme.palette.mode === 'dark'
                        ? theme.palette.common.white
                        : theme.palette.common.black,
                    strokeLinecap: 'round',
                  },
                }}
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
                <Typography variant="caption" sx={{ fontWeight: 'bolder', fontSize: 10 }}>
                  {`${Math.round(campaign?.percentageMatch)}%`}
                </Typography>
              </Box>
            </Box> */}
          </Stack>
        </Label>

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
              disabled={!user?.creator?.isFormCompleted}
            >
              Pitch
            </LoadingButton>
          )}
        </>
      )}

      <Grid container>
        <Grid item xs={1}>
          <Iconify icon="streamline:industry-innovation-and-infrastructure-solid" />
        </Grid>
        <Grid item xs={11}>
          <Stack gap={1.5} direction="row" alignItems="center" flexWrap="wrap">
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Label color="primary">{campaign?.campaignBrief?.industries}</Label>
            </Stack>
          </Stack>
        </Grid>
      </Grid>

      <Grid container>
        <Grid item xs={1}>
          <Iconify icon="solar:clock-circle-bold" />
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

        {/* <Chip
          sx={{ position: 'absolute', top: 10, left: 10 }}
          variant="filled"
          color="success"
          size="small"
          label={`${Math.ceil(campaign?.percentageMatch)} % Match`}
        /> */}
      </Card>

      <CampaignModal
        open={campaignInfo.value}
        handleClose={campaignInfo.onFalse}
        openForm={() => setOpen(true)}
        campaign={campaign}
        existingPitch={campaignIds}
        dialog={dialog}
      />
      <CampaignPitchOptionsModal open={open} handleClose={handleClose} campaign={campaign} />
      <CreatorForm dialog={dialog} user={user} />
    </>
  );
}

CampaignItem.propTypes = {
  campaign: PropTypes.object,
  user: PropTypes.object,
};
