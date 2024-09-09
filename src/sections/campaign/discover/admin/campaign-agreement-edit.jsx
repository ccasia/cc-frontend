import * as yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { SyncLoader } from 'react-spinners';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import { Stack, Button, Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useSettingsContext } from 'src/components/settings';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFCheckbox, RHFTextField } from 'src/components/hook-form';

const CampaignAgreementEdit = ({ dialog, agreement }) => {
  const settings = useSettingsContext();
  const loading = useBoolean();

  const schema = yup.object().shape({
    paymentAmount: yup.string().required('Payment Amount is required.'),
    //   .moreThan(0, 'Payment Amount must be greater than 0'),
    default: yup.boolean(),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      paymentAmount: '',
      default: false,
    },
    reValidateMode: 'onChange',
  });

  const { watch, handleSubmit, setValue, reset } = methods;

  const isDefault = watch('default');

  useEffect(() => {
    if (isDefault) {
      setValue('paymentAmount', '200');
    } else {
      setValue('paymentAmount', '');
    }
  }, [setValue, isDefault]);

  const onSubmit = handleSubmit(async (data) => {
    loading.onTrue();
    try {
      await axiosInstance.patch(endpoints.campaign.updateAmountAgreement, {
        ...data,
        ...agreement,
      });
      enqueueSnackbar('Success');
      mutate(endpoints.campaign.creatorAgreement(agreement?.campaignId));
      reset();
      dialog.onFalse();
    } catch (error) {
      enqueueSnackbar('Error', {
        variant: 'error',
      });
    } finally {
      loading.onFalse();
    }
  });

  return (
    <Dialog open={dialog.value} onClose={dialog.onFalse} fullWidth maxWidth="sm">
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Payment Amount for {agreement?.user?.name}</DialogTitle>
        <DialogContent>
          <Stack mt={2}>
            <RHFTextField
              name="paymentAmount"
              type="number"
              label="Payment Amount"
              disabled={isDefault}
            />
            <RHFCheckbox name="default" label="Default" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} variant="outlined" size="small" disabled={loading.value}>
            Cancel
          </Button>

          <LoadingButton
            type="submit"
            variant="contained"
            size="small"
            loading={loading.value}
            loadingIndicator={
              <SyncLoader color={settings.themeMode === 'light' ? 'black' : 'white'} size={5} />
            }
          >
            Generate
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default CampaignAgreementEdit;

CampaignAgreementEdit.propTypes = {
  dialog: PropTypes.object,
  agreement: PropTypes.object,
};
