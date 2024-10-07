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

import { useResponsive } from 'src/hooks/use-responsive';

import { formatText } from 'src/utils/format-test';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

const CampaignModal = ({ open, handleClose, campaign, openForm, dialog }) => {
  const smUp = useResponsive('down', 'sm');
  const { user } = useAuthContext();
  const router = useRouter();

  const isShortlisted = user?.shortlisted && user?.shortlisted.map((item) => item.campaignId);

  const existingPitch = user?.pitch && user?.pitch.find((item) => item.campaignId === campaign?.id);

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
      {campaign?.campaignBrief?.images?.map((image, index) => (
        <Image
          key={index}
          src={image}
          alt="test"
          ratio="16/9"
          sx={{ borderRadius: 2, cursor: 'pointer' }}
        />
      ))}
    </Stack>
  );

  return (
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

        <Box mt={2}>
          <DialogContentText id="alert-dialog-description">
            <ListItemText
              primary="Campaign Description"
              secondary={campaign?.description}
              primaryTypographyProps={{
                variant: 'h6',
                color: 'white',
              }}
            />
          </DialogContentText>
        </Box>
        <Box mt={2}>
          <Typography variant="h6">Campaign Details</Typography>

          <Box
            display="grid"
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }}
            gap={2}
            mt={1}
          >
            <ListItemText
              primary="Gender"
              secondary={
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {campaign?.campaignRequirement?.gender.map((gender, index) => (
                    <Label key={index}>{formatText(gender)}</Label>
                  ))}
                </Stack>
              }
            />
            <ListItemText
              primary="Age"
              secondary={
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {campaign?.campaignRequirement?.age.map((age, index) => (
                    <Label key={index}>{formatText(age)}</Label>
                  ))}
                </Stack>
              }
            />
            <ListItemText
              primary="Geo Location"
              secondary={
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {campaign?.campaignRequirement?.geoLocation.map((location, index) => (
                    <Label key={index}>{formatText(location)}</Label>
                  ))}
                </Stack>
              }
            />
            <ListItemText
              primary="Language"
              secondary={
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {campaign?.campaignRequirement?.language.map((language, index) => (
                    <Label key={index}>{formatText(language)}</Label>
                  ))}
                </Stack>
              }
            />
            <ListItemText
              primary="Creator Persona"
              secondary={
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {campaign?.campaignRequirement?.creator_persona.map((creatorPersona, index) => (
                    <Label key={index}>{formatText(creatorPersona)}</Label>
                  ))}
                </Stack>
              }
            />
            <ListItemText
              primary="User Persona"
              secondary={
                <Typography variant="subtitle2" color="text.secondary">
                  {formatText(campaign?.campaignRequirement?.user_persona)}
                </Typography>
              }
            />
          </Box>
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
            {existingPitch?.status === 'undecided' && (
              <Button
                autoFocus
                variant="contained"
                startIcon={<Iconify icon="ph:paper-plane-tilt-bold" width={20} />}
                disabled
                color="warning"
                size="small"
              >
                In Review
              </Button>
            )}

            {!user?.creator?.isFormCompleted && (
              <Button
                autoFocus
                variant="contained"
                startIcon={<Iconify icon="fluent:form-20-regular" width={20} />}
                onClick={() => {
                  dialog.onTrue();
                }}
                size="small"
              >
                Complete Form
              </Button>
            )}

            {!existingPitch && user?.creator?.isFormCompleted && (
              <Button
                autoFocus
                variant="contained"
                startIcon={<Iconify icon="ph:paper-plane-tilt-bold" width={20} />}
                onClick={() => {
                  handleClose();
                  openForm();
                }}
                size="small"
              >
                Pitch
              </Button>
            )}
            {/* 
            {!existingPitch && user?.creator?.isFormCompleted ? (
              <Button
                autoFocus
                variant="contained"
                startIcon={<Iconify icon="ph:paper-plane-tilt-bold" width={20} />}
                onClick={() => {
                  handleClose();
                  openForm();
                }}
                size="small"
              >
                Pitch
              </Button>
            ) : (
              <Button
                autoFocus
                variant="contained"
                startIcon={<Iconify icon="fluent:form-20-regular" width={20} />}
                onClick={() => {
                  dialog.onTrue();
                }}
                size="small"
              >
                Complete Form
              </Button>
            )} */}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CampaignModal;

CampaignModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  campaign: PropTypes.object,
  openForm: PropTypes.func,
  dialog: PropTypes.object,
};
