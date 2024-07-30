/* eslint-disable no-nested-ternary */
import React from 'react';
import PropTypes from 'prop-types';
import 'react-quill/dist/quill.snow.css';

import {
  Box,
  Chip,
  Dialog,
  Button,
  Typography,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import { formatText } from 'src/utils/format-test';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

const CampaignModal = ({ open, handleClose, campaign, openForm, existingCampaign }) => {
  const smUp = useResponsive('down', 'sm');
  const { user } = useAuthContext();
  console.log(user);

  const isShortlisted =
    user?.ShortListedCreator && user?.shortlistCreator.map((item) => item.campaignId);

  const campaignIds = user?.pitch && user?.pitch.map((item) => item.campaignId);

  const renderGallery = (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
      gap={1}
      p={2}
    >
      <Image
        src={campaign?.campaignBrief?.images[0]}
        alt="test"
        ratio="1/1"
        sx={{ borderRadius: 2, cursor: 'pointer' }}
      />
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={1}>
        {campaign?.campaignBrief?.images?.map((elem, index) => (
          <Image
            key={index}
            src={elem}
            alt="test"
            ratio="1/1"
            sx={{ borderRadius: 2, cursor: 'pointer' }}
          />
        ))}
      </Box>
    </Box>
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
        <Chip label={`${campaign?.percentageMatch}% Match`} color="primary" />
      </Box>
      </DialogTitle>
      <DialogContent>
        {renderGallery}
        <DialogContentText id="alert-dialog-description">{campaign?.description}</DialogContentText>
        <Box mt={2}>
          <Typography variant="h6">Campaign Requirements</Typography>
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
        {campaignIds?.includes(campaign.id) ? (
          isShortlisted?.includes(campaign.id) ? (
            <Button
              autoFocus
              variant="contained"
              startIcon={<Iconify icon="charm:circle-tick" width={20} />}
              disabled
              color="success"
            >
              Shortlisted
            </Button>
          ) : (
            <Button
              autoFocus
              variant="contained"
              startIcon={<Iconify icon="ph:paper-plane-tilt-bold" width={20} />}
              disabled
              color="warning"
            >
              In Review
            </Button>
          )
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
            Pitch
          </Button>
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
  existingCampaign: PropTypes.array,
};
