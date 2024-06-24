import React from 'react';
import PropTypes from 'prop-types';
import 'react-quill/dist/quill.snow.css';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Dialog,
  Button,
  Typography,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';

import { formatText } from 'src/utils/format-test';
import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { RHFEditor } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const CampaignModal = ({ open, handleClose, campaign }) => {
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
    alert(JSON.stringify(data));
  });

  const pitch = async () => {
    try {
      onSubmit();
      const res = await axiosInstance.patch(endpoints.campaign.pitch, { campaignId: campaign?.id });
      enqueueSnackbar(res?.data?.message);
      handleClose();
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
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
            <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} mt={1}>
              <ListItemText
                primary="Gender"
                secondary={formatText(campaign?.campaignRequirement?.gender)}
              />
              <ListItemText
                primary="Age"
                secondary={formatText(campaign?.campaignRequirement?.age)}
              />
              <ListItemText
                primary="Geo Location"
                secondary={formatText(campaign?.campaignRequirement?.geoLocation)}
              />
              <ListItemText
                primary="Language"
                secondary={formatText(campaign?.campaignRequirement?.language)}
              />
              <ListItemText
                primary="Creator Persona"
                secondary={formatText(campaign?.campaignRequirement?.creator_persona)}
              />
              <ListItemText
                primary="User Persona"
                secondary={formatText(campaign?.campaignRequirement?.user_persona)}
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
