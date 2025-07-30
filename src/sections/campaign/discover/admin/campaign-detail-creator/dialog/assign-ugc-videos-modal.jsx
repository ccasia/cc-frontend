import * as yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  List,
  alpha,
  Stack,
  Button,
  Dialog,
  ListItem,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Label from 'src/components/label';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

import { useShortlistedCreators } from '../hooks/shortlisted-creator';

const schema = yup.object().shape({
  shortlistedCreators: yup.array().of(
    yup.object().shape({
      credits: yup.number().min(1, 'Minumum credit is 1'),
    })
  ),
});

const AssignUGCVideoModal = ({ dialog, onClose, credits, campaignId, modalClose, creditsLeft, campaign }) => {
  const shortlistedCreators = useShortlistedCreators((state) => state.shortlistedCreators);
  const resetState = useShortlistedCreators((state) => state.reset);

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      shortlistedCreators: [],
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const {
    control,
    setValue,
    handleSubmit,
    reset,
    formState: { isValid },
  } = methods;

  const { fields } = useFieldArray({
    control,
    name: 'shortlistedCreators',
  });

  const onSubmit = handleSubmit(async ({ shortlistedCreators: data }) => {
    const totalCredits = data.reduce((acc, sum) => acc + sum.credits, 0);

    // Only check credit limits for admin-created campaigns
    if (campaign?.origin !== 'CLIENT' && totalCredits > credits) {
      enqueueSnackbar('Error - Credits exceeded', {
        variant: 'error',
      });
      return;
    }

    try {
      // Debug logging
      console.log('Campaign data:', campaign);
      console.log('Campaign origin:', campaign?.origin);
      
      // Use different endpoint based on campaign origin
      const endpoint = campaign?.origin === 'CLIENT' 
        ? '/api/campaign/v2/shortlistCreator/client'
        : '/api/campaign/v2/shortlistCreator';
        
      console.log('Using endpoint:', endpoint);
        
      await axiosInstance.post(endpoint, {
        creators: data,
        campaignId,
      });
      mutate(endpoints.campaign.getCampaignById(campaignId));
      mutate(endpoints.campaign.creatorAgreement(campaignId));
      reset();
      onClose();
      modalClose();
      resetState();
    } catch (error) {
      enqueueSnackbar(error, {
        variant: 'error',
      });
    }
  });

  useEffect(() => {
    if (shortlistedCreators.length > 0) {
      setValue(
        'shortlistedCreators',
        shortlistedCreators.map((item) => ({ ...item, credits: 0 }))
      );
    }
  }, [setValue, shortlistedCreators]);

  return (
    <Dialog
      open={dialog}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0.5,
        },
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            '&.MuiTypography-root': {
              fontSize: 25,
            },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            Assign UGC Credits
            <Label
              sx={{
                fontFamily: (theme) => theme.typography.fontFamily,
              }}
            >
              UGC Credits: {creditsLeft ?? 0} left
            </Label>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <List>
            {fields.map((field, index) => (
              <ListItem key={field.id}>
                <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle1" color="text.secondary">
                      {field?.name}
                    </Typography>
                  </Stack>

                  <RHFTextField
                    name={`shortlistedCreators.${index}.credits`}
                    size="small"
                    placeholder="Number of UGC Videos"
                    type="number"
                    // onChange={(e) => {
                    //   handleInputChange(
                    //     e.currentTarget.value,
                    //     `shortlistedCreators.${index}.credits`
                    //   );
                    // }}
                  />
                </Box>
              </ListItem>
            ))}
          </List>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              onClose();
            }}
            sx={{
              bgcolor: '#ffffff',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              height: 44,
              color: '#203ff5',
              fontSize: '0.875rem',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                bgcolor: alpha('#636366', 0.08),
                opacity: 0.9,
              },
            }}
          >
            Back
          </Button>

          <LoadingButton
            type="submit"
            disabled={!isValid}
            sx={{
              bgcolor: '#203ff5',
              border: '1px solid #203ff5',
              borderBottom: '3px solid #1933cc',
              height: 44,
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                bgcolor: '#1933cc',
                opacity: 0.9,
              },
              '&:disabled': {
                bgcolor: '#e7e7e7',
                color: '#999999',
                border: '1px solid #e7e7e7',
                borderBottom: '3px solid #d1d1d1',
              },
            }}
          >
            Confirm
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default AssignUGCVideoModal;

AssignUGCVideoModal.propTypes = {
  dialog: PropTypes.bool,
  onClose: PropTypes.func,
  credits: PropTypes.number,
  campaignId: PropTypes.string,
  modalClose: PropTypes.func,
  creditsLeft: PropTypes.number,
  campaign: PropTypes.object,
};
