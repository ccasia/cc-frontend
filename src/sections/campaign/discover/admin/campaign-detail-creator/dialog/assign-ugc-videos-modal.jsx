import * as yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useEffect, useMemo } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useWatch, useFieldArray, Controller } from 'react-hook-form';

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

const AssignUGCVideoModal = ({ dialog, onClose, credits, campaignId, modalClose }) => {
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

  // const creators = watch('shortlistedCreators');

  const { fields } = useFieldArray({
    control,
    name: 'shortlistedCreators',
  });

  // const handleInputChange = (val, name) => {
  //   const value = Number(val) || 0;
  //   setValue(name, value);

  //   const totalCredits = creators.reduce((acc, sum) => acc + sum.credits, 0);

  //   if (totalCredits > credits) {
  //     let runningSum = 0;

  //     // eslint-disable-next-line no-plusplus
  //     for (let i = 0; i < creators.length; i++) {
  //       runningSum += creators[i].credits || 0;

  //       if (runningSum > credits) {
  //         setError(name, {
  //           type: 'manual',
  //           message: `Credits exceeded`,
  //         });
  //         return;
  //       }
  //     }
  //   } else {
  //     clearErrors(name);
  //   }
  // };

  const onSubmit = handleSubmit(async ({ shortlistedCreators: data }) => {
    const totalCredits = data.reduce((acc, sum) => acc + sum.credits, 0);

    if (totalCredits > credits) {
      enqueueSnackbar('Error - Credits exceeded', {
        variant: 'error',
      });
      return;
    }

    try {
      await axiosInstance.post('/api/campaign/v2/shortlistCreator', {
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
              Total UGC Credits: {credits ?? 0}
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
};
