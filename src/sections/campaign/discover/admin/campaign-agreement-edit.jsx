import dayjs from 'dayjs';
import * as yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { pdf } from '@react-pdf/renderer';
import { enqueueSnackbar } from 'notistack';
import { SyncLoader } from 'react-spinners';
import React, { useMemo, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import AgreementTemplate from 'src/template/agreement';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFCheckbox, RHFTextField } from 'src/components/hook-form';

const CampaignAgreementEdit = ({ dialog, agreement, campaign }) => {
  const settings = useSettingsContext();
  const loading = useBoolean();

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
    } catch (error) {
      enqueueSnackbar('Error', { variant: 'error' });
    }
  };

  const extractAgremmentsInfo = useMemo(() => {
    if (campaign?.agreementTemplate) return campaign.agreementTemplate;

    return campaign?.campaignAdmin?.reduce(
      (foundTemplate, item) => foundTemplate || item?.admin?.user?.agreementTemplate[0] || null,
      null
    );
  }, [campaign]);

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
          ccPhoneNumber="+60162678757"
          effectiveDate={dayjs().add(4, 'day').format('LL')}
          creatorPayment={data.paymentAmount.toString()}
          CREATOR_NAME={agreement?.user?.name}
          CREATOR_ACCOUNT_NUMBER={agreement?.user?.paymentForm?.bankAccountNumber}
          CREATOR_BANK_NAME={agreement?.user?.paymentForm?.bankName}
          AGREEMENT_ENDDATE={dayjs().add(1, 'month').format('LL')}
          NOW_DATE={dayjs().format('LL')}
          VERSION_NUMBER="V1"
          ADMIN_IC_NUMBER={extractAgremmentsInfo?.adminICNumber ?? 'Default'}
          ADMIN_NAME={extractAgremmentsInfo?.adminName ?? 'Default'}
          SIGNATURE={extractAgremmentsInfo?.signURL ?? 'Default'}
        />
      ).toBlob();

      const formData = new FormData();

      formData.append('agreementForm', blob);
      formData.append('data', JSON.stringify({ ...data, ...agreement }));

      const res = await axiosInstance.patch(endpoints.campaign.updateAmountAgreement, formData, {
        headers: {
          Accept: 'multipart/form-data',
        },
      });

      await handleSendAgreement();
      enqueueSnackbar(res?.data?.message);
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
        <DialogTitle sx={{ pb: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify
                icon="bx:send"
                sx={{
                  width: 24,
                  height: 24,
                  color: '#835cf5',
                }}
              />
              <Typography variant="h6">Issue a Payment Amount</Typography>
            </Stack>

            <Box sx={{ borderBottom: '1px solid #e7e7e7' }} />

            <Stack spacing={1}>
              <Typography variant="body2" sx={{ color: '#637381', fontWeight: 600 }}>
                Recipient
              </Typography>

              <Stack direction="row" alignItems="center" spacing={2}>
                {agreement?.user?.photoURL ? (
                  <Box
                    component="img"
                    src={agreement.user.photoURL}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: '#f5f5f7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#3a3a3c',
                      fontWeight: 600,
                    }}
                  >
                    {agreement?.user?.name?.charAt(0).toUpperCase()}
                  </Box>
                )}
                <Stack>
                  <Typography variant="subtitle1">{agreement?.user?.name}</Typography>
                  <Typography variant="body2" sx={{ color: '#637381' }}>
                    {agreement?.user?.email}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={1} sx={{ mt: 2 }}>
            <RHFTextField
              name="paymentAmount"
              type="number"
              label="Payment Amount"
              InputLabelProps={{ shrink: true }}
              disabled={isDefault}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                },
              }}
            />
            <RHFCheckbox
              name="default"
              label="Default"
              sx={{
                color: '#636366',
                ml: -1,
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={dialog.onFalse}
            variant="outlined"
            disabled={loading.value}
            sx={{
              minHeight: 48,
              minWidth: 100,
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1.15,
              color: '#3a3a3c',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#f5f5f7',
                border: '1px solid #e7e7e7',
                borderBottom: '3px solid #e7e7e7',
              },
            }}
          >
            Cancel
          </Button>

          <LoadingButton
            type="submit"
            variant="contained"
            loading={loading.value}
            loadingIndicator={
              <SyncLoader color={settings.themeMode === 'light' ? 'black' : 'white'} size={5} />
            }
            sx={{
              minHeight: 48,
              minWidth: 100,
              bgcolor: '#3a3a3c',
              borderBottom: '3px solid #202021',
              borderRadius: 1.15,
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#3a3a3c',
                opacity: 0.9,
              },
            }}
          >
            Generate and Send
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
