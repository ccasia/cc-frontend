import React from 'react';
import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import {
  Stack,
  Dialog,
  Button,
  Avatar,
  MenuItem,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { couriers } from 'src/contants/courier';
import { createLogistics } from 'src/api/logistic';

import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFTextField } from 'src/components/hook-form';

const CreateLogistic = ({ form, campaign, creator }) => {
  const schema = Yup.object().shape({
    itemName: Yup.string().required('Item name is required.'),
    trackingNumber: Yup.string().required('Tracking Number is required'),
    courier: Yup.string().required('Courier is required'),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      itemName: '',
      trackingNumber: '',
      courier: '',
      otherCourier: '',
    },
  });

  const { handleSubmit, reset, watch } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createLogistics({ data, campaignId: campaign.id, creatorId: creator.user.id });
      mutate(endpoints.campaign.getCampaignById(campaign.id));
      reset();
      form.onFalse();
      enqueueSnackbar('Success');
    } catch (error) {
      enqueueSnackbar('error', {
        variant: 'error',
      });
    }
  });

  const val = watch('courier');

  return (
    <Dialog open={form.value} onClose={form.onFalse} maxWidth="xs" fullWidth>
      <FormProvider onSubmit={onSubmit} methods={methods}>
        <DialogTitle>Logistic</DialogTitle>
        <DialogContent>
          <Stack spacing={1} my={1.5}>
            <RHFTextField name="itemName" label="Item Name" />
            <RHFTextField name="trackingNumber" label="Tracking Number" />
            <RHFSelect name="courier" label="Courier">
              {couriers.map((courier, index) => (
                <MenuItem key={index} value={courier.name}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                      alt={courier?.name}
                      src={courier?.logo_url}
                      sx={{ width: 30, height: 30 }}
                    />
                    {courier?.name}
                  </Stack>
                </MenuItem>
              ))}
            </RHFSelect>
            {val === 'Other' && <RHFTextField name="otherCourier" label="Courier" />}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button size="small" variant="outlined" onClick={form.onFalse}>
            Cancel
          </Button>
          <Button size="small" variant="contained" type="submit">
            Save
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default CreateLogistic;

CreateLogistic.propTypes = {
  form: PropTypes.object,
  campaign: PropTypes.object,
  creator: PropTypes.object,
};
