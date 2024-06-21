import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';

import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const EditCampaignInformation = ({ open, campaign, onClose }) => {
  const methods = useForm();

  const { setValue } = methods;

  useEffect(() => {
    setValue('name', campaign?.name);
    setValue('description', campaign?.description);
  }, [setValue, campaign]);

  return (
    <Dialog
      open={open.campaignInfo}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="md"
    >
      <DialogTitle id="alert-dialog-title">Campaign Information</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description" p={1.5}>
          <FormProvider methods={methods}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(1, 1fr)',
                  md: 'repeat(2, 1fr)',
                },
                gap: 2,
              }}
            >
              <RHFTextField name="name" label="Campaign Name" fullWidth />
              <RHFTextField name="description" label="Campaign Description" multiline />
            </Box>
          </FormProvider>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose('campaignInfo')}>Cancel</Button>
        <Button autoFocus color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditCampaignInformation;

EditCampaignInformation.propTypes = {
  open: PropTypes.bool,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
