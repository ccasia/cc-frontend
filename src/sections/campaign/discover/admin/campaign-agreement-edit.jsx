import dayjs from 'dayjs';
import * as yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { pdf } from '@react-pdf/renderer';
import { enqueueSnackbar } from 'notistack';
import { SyncLoader } from 'react-spinners';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import { Stack, Button, Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import AgreementTemplate from 'src/template/agreement';

import { useSettingsContext } from 'src/components/settings';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFCheckbox, RHFTextField } from 'src/components/hook-form';

const CampaignAgreementEdit = ({ dialog, agreement, campaign }) => {
  const settings = useSettingsContext();
  const loading = useBoolean();
  const { user } = useAuthContext();
  // const { data: agreements, isLoading } = useGetAgreements(campaign?.id);

  const schema = yup.object().shape({
    paymentAmount: yup.string().required('Payment Amount is required.'),
    default: yup.boolean(),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      paymentAmount: parseInt(agreement?.amount, 10) || '',
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
      setValue('paymentAmount', agreement?.amount);
    }
  }, [setValue, isDefault, agreement]);

  const handleSendAgreement = async () => {
    try {
      await axiosInstance.patch(endpoints.campaign.sendAgreement, agreement);
      mutate(endpoints.campaign.creatorAgreement(agreement.campaignId));
      // enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Error', { variant: error?.message });
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    loading.onTrue();

    try {
      const blob = await pdf(
        <AgreementTemplate
          DATE={dayjs().format('LL')}
          IC_NUMBER={agreement?.user?.paymentForm?.icNumber}
          FREELANCER_FULL_NAME={agreement?.user?.name}
          ADDRESS={agreement?.user?.creator?.address}
          ccEmail="hello@cultcreative.com"
          ccPhoneNumber="123123123"
          effectiveDate={dayjs(campaign?.campaignBrief?.startDate).format('LL')}
          creatorPayment={data.paymentAmount.toString()}
          CREATOR_NAME={agreement?.user?.name}
          CREATOR_ACCOUNT_NUMBER={agreement?.user?.paymentForm?.bankAccountNumber}
          CREATOR_BANK_NAME={agreement?.user?.paymentForm?.bankName}
          AGREEMENT_ENDDATE={dayjs(campaign?.campaignBrief?.endDate).format('LL')}
          NOW_DATE={dayjs().format('LL')}
          VERSION_NUMBER="V1"
          ADMIN_IC_NUMBER={user?.agreementTemplate?.adminICNumber}
          ADMIN_NAME={user?.agreementTemplate?.adminName}
          SIGNATURE={user?.agreementTemplate?.signURL}
        />
      ).toBlob();

      const formData = new FormData();

      formData.append('agreementForm', blob);
      formData.append('data', JSON.stringify({ ...data, ...agreement }));

      await axiosInstance.patch(endpoints.campaign.updateAmountAgreement, formData, {
        headers: {
          Accept: 'multipart/form-data',
        },
      });

      await handleSendAgreement();
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
            Generate and send
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
  campaign: PropTypes.object,
};
