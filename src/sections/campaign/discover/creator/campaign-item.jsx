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
import { Chip, Typography, CircularProgress } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

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
  const [loading, setLoading] = useState(false);

  const { socket } = useSocketContext();

  useEffect(() => {
    // Define the handler function
    const handlePitchLoading = (data) => {
      console.log(data);
      setLoading(true);

      if (upload.find((item) => item.campaignId === data.campaignId)) {
        setUpload((prev) =>
          prev.map((item) =>
            item.campaignId === data.campaignId
              ? {
                  campaignId: data.campaignId,
                  loading: true,
                  // progress: data.progress && `${Math.floor(data.progress)}%`,
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

      // setPercent((prev) => ({
      //   ...prev,
      //   data,
      // }));
      // setPercent(`${Math.floor(data.progress)}%`);
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

  const pitch = useMemo(
    () => campaign?.pitch?.filter((elem) => elem.userId.includes(user?.id))[0],
    [campaign, user]
  );

  console.log(campaign);

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
    <ListItemText
      sx={{
        p: (theme) => theme.spacing(2.5, 2.5, 2, 2.5),
      }}
      primary={
        <Link
          component="a"
          color="inherit"
          onClick={() => campaignInfo.onTrue()}
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
  );

  const renderInfo = (
    <Stack
      spacing={1.5}
      sx={{
        position: 'relative',
        p: (theme) => theme.spacing(0, 2.5, 2.5, 2.5),
      }}
    >
      {/* <IconButton onClick={popover.onOpen} sx={{ position: 'absolute', bottom: 20, right: 8 }}>
        <Iconify icon="eva:more-vertical-fill" />
      </IconButton> */}
      {pitch && pitch.status !== 'approved' && (
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
            // <LoadingButton
            //   sx={{ position: 'absolute', bottom: 10, right: 10 }}
            //   variant="contained"
            //   size="small"
            //   startIcon={<Iconify icon="eos-icons:loading" width={20} />}
            //   // loading={loading}
            //   disabled
            // >
            //   {upload.find((item) => item.campaignId === campaign.id).progress}
            // </LoadingButton>
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

      {/* {loading ? (
        <LoadingButton
          sx={{ position: 'absolute', bottom: 10, right: 10 }}
          variant="contained"
          size="small"
          startIcon={<Iconify icon="eos-icons:loading" width={20} />}
          // loading={loading}
          disabled
        >
          {percent}
        </LoadingButton>
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
      )} */}
      {/* {campaignIds?.includes(campaign.id) ? (
        !isShortlisted?.includes(campaign.id) ? (
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
        ) : (
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
        )
      ) : (
        <>
          {loading ? (
            <LoadingButton
              sx={{ position: 'absolute', bottom: 10, right: 10 }}
              variant="contained"
              size="small"
              startIcon={<Iconify icon="eos-icons:loading" width={20} />}
              // loading={loading}
              disabled
            >
              {percent}
            </LoadingButton>
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
      )} */}
      {[
        {
          label: campaign?.campaignBrief?.interests.map((e, index) => (
            <Chip key={index} label={e} variant="filled" size="small" color="primary" />
          )),
          icon: <Iconify icon="mingcute:location-fill" sx={{ color: 'error.main' }} />,
        },
        {
          label: (
            <Typography variant="caption" color="text.disabled">
              {`${dayjs(campaign?.campaignBrief?.startDate).format('LL')} - ${dayjs(campaign?.campaignBrief?.endDate).format('LL')}`}
            </Typography>
          ),
          icon: <Iconify icon="solar:clock-circle-bold" sx={{ color: 'info.main' }} />,
        },
      ].map((item, index) => (
        <Stack
          key={index}
          spacing={1}
          direction="row"
          alignItems="center"
          sx={{ typography: 'body2' }}
        >
          {item.icon}
          {item.label}
        </Stack>
      ))}
    </Stack>
  );

  return (
    <>
      <Card>
        {renderImages}

        {renderTexts}

        {renderInfo}
      </Card>

      {/* <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 140 }}
      >
        <MenuItem
          onClick={() => {
            popover.onClose();
            onView();
          }}
        >
          <Iconify icon="solar:eye-bold" />
          View
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
            onEdit();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
            onDelete();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </CustomPopover> */}
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
