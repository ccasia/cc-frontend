/* eslint-disable no-nested-ternary */
import React from 'react';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import 'react-quill/dist/quill.snow.css';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Chip,
  Stack,
  Dialog,
  Button,
  Tooltip,
  Typography,
  IconButton,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import { formatText } from 'src/utils/format-test';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

import CreatorForm from './creator-form';

const CampaignModal = ({ open, handleClose, campaign, openForm }) => {
  const smUp = useResponsive('down', 'sm');
  const { user } = useAuthContext();
  const router = useRouter();
  const dialog = useBoolean();

  const isShortlisted = user?.shortlisted && user?.shortlisted.map((item) => item.campaignId);

  const existingPitch = user?.pitch && user?.pitch.find((item) => item.campaignId);

  // const campaignIds = user?.pitch && user?.pitch.map((item) => item.campaignId);

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

  const renderGallery = (
    <Stack direction="row" gap={2}>
      {campaign?.campaignBrief?.images?.map((image) => (
        <Image src={image} alt="test" ratio="16/9" sx={{ borderRadius: 2, cursor: 'pointer' }} />
      ))}
    </Stack>
    // <Box
    //   display="grid"
    //   gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
    //   gap={1}
    //   p={2}
    // >
    //   <Image
    //     src={campaign?.campaignBrief?.images[0]}
    //     alt="test"
    //     ratio="1/1"
    //     sx={{ borderRadius: 2, cursor: 'pointer' }}
    //   />
    //   <Box display="grid" gridTemplateColumns="repeat(1, 1fr)" gap={1}>
    //     {campaign?.campaignBrief?.images?.slice(1)?.map((elem, index) => (
    //       <Image
    //         key={index}
    //         src={elem}
    //         alt="test"
    //         ratio="1/1"
    //         sx={{ borderRadius: 2, cursor: 'pointer' }}
    //       />
    //     ))}
    //   </Box>
    // </Box>
  );

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" fullScreen={smUp}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <ListItemText
              primary={campaign?.name}
              secondary={`by ${campaign?.company?.name || campaign?.brand?.name}`}
              primaryTypographyProps={{
                mt: 1,
                noWrap: true,
                component: 'span',
                color: 'text.primary',
                typography: 'h5',
              }}
            />
            <Stack direction="row" spacing={1.5} alignItems="center">
              {campaign?.bookMarkCampaign ? (
                <Tooltip title="Saved">
                  <IconButton
                    onClick={() => {
                      unSaveCampaign(campaign?.bookMarkCampaign.id);
                    }}
                  >
                    <Iconify icon="flowbite:bookmark-solid" width={25} />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Save">
                  <IconButton
                    onClick={() => {
                      saveCampaign(campaign?.id);
                    }}
                  >
                    <Iconify icon="mynaui:bookmark" width={25} />
                  </IconButton>
                </Tooltip>
              )}
              <Chip label={`${Math.ceil(campaign?.percentageMatch)}% Match`} color="primary" />
            </Stack>
          </Box>
        </DialogTitle>
        <DialogContent>
          {renderGallery}
          <DialogContentText id="alert-dialog-description">
            {campaign?.description}
          </DialogContentText>
          <Box mt={2}>
            <Typography variant="h6">Campaign Details</Typography>
            {/* <List> */}
            <Box
              display="grid"
              gridTemplateColumns={{ xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }}
              gap={2}
              mt={1}
            >
              <ListItemText
                primary="Gender"
                secondary={campaign?.campaignRequirement?.gender.map((gender) => (
                  <Chip label={formatText(gender)} size="small" sx={{ mr: 1 }} />
                ))}
              />
              <ListItemText
                primary="Age"
                secondary={campaign?.campaignRequirement?.age.map((age) => (
                  <Chip label={formatText(age)} size="small" sx={{ mr: 1 }} />
                ))}
              />
              <ListItemText
                primary="Geo Location"
                secondary={campaign?.campaignRequirement?.geoLocation.map((location) => (
                  <Chip label={formatText(location)} size="small" sx={{ mr: 1 }} />
                ))}
              />
              <ListItemText
                primary="Language"
                secondary={campaign?.campaignRequirement?.language.map((language) => (
                  <Chip label={formatText(language)} size="small" sx={{ mr: 1 }} />
                ))}
              />
              <ListItemText
                primary="Creator Persona"
                secondary={campaign?.campaignRequirement?.creator_persona.map((creatorPersona) => (
                  <Chip label={formatText(creatorPersona)} size="small" sx={{ mr: 1 }} />
                ))}
              />
              <ListItemText
                primary="User Persona"
                secondary={
                  <Chip
                    label={formatText(campaign?.campaignRequirement?.user_persona)}
                    size="small"
                  />
                }
              />
            </Box>
            {/* </List> */}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          {isShortlisted?.includes(campaign.id) ? (
            <Button
              autoFocus
              variant="contained"
              onClick={() => router.push(paths.dashboard.campaign.creator.detail(campaign.id))}
              size="small"
            >
              Manage
            </Button>
          ) : (
            <>
              {existingPitch?.status === 'Pending' && (
                <Button
                  autoFocus
                  variant="contained"
                  startIcon={<Iconify icon="ph:paper-plane-tilt-bold" width={20} />}
                  disabled
                  color="warning"
                >
                  In Review
                </Button>
              )}
              {!existingPitch && user?.creator?.isFormCompleted ? (
                <Button
                  autoFocus
                  variant="contained"
                  startIcon={<Iconify icon="ph:paper-plane-tilt-bold" width={20} />}
                  onClick={() => {
                    handleClose();
                    openForm();
                  }}
                >
                  Pitch
                </Button>
              ) : (
                <Button
                  autoFocus
                  variant="contained"
                  startIcon={<Iconify icon="ph:paper-plane-tilt-bold" width={20} />}
                  onClick={() => {
                    handleClose();
                    openForm();
                  }}
                >
                  Complete Form
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
      <CreatorForm dialog={dialog} />
    </>
  );
};

export default CampaignModal;

CampaignModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  campaign: PropTypes.object,
  openForm: PropTypes.func,
};
