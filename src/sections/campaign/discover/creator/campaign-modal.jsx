import React from 'react';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import 'react-quill/dist/quill.snow.css';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

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
import axiosInstance, { endpoints } from 'src/utils/axios';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import { RHFEditor } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const CampaignModal = ({ open, handleClose, campaign }) => {
  const smUp = useResponsive('down', 'sm');
  const schema = Yup.object().shape({
    content: Yup.string().required('Pitch Script is required'),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      content: '',
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.campaign.pitch.root, {
        campaignId: campaign?.id,
        ...data,
      });
      enqueueSnackbar(res?.data?.message);
      handleClose();
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  });

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
        {campaign?.campaignBrief?.images.map((elem) => (
          <Image src={elem} alt="test" ratio="1/1" sx={{ borderRadius: 2, cursor: 'pointer' }} />
        ))}
      </Box>
    </Box>
  );

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" fullScreen={smUp}>
      {renderGallery}
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>
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
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {campaign?.description}
          </DialogContentText>
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
        <Box p={2}>
          <RHFEditor simple name="content" />
        </Box>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button
            autoFocus
            variant="contained"
            startIcon={<Iconify icon="ph:paper-plane-tilt-bold" width={20} />}
            type="submit"
          >
            Pitch
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default CampaignModal;

CampaignModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  campaign: PropTypes.object,
};
