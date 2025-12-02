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
  MenuItem,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useGetAgreements } from 'src/hooks/use-get-agreeements';

import axiosInstance, { endpoints } from 'src/utils/axios';

import AgreementTemplate from 'src/template/agreement';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFCheckbox, RHFTextField } from 'src/components/hook-form';

const CURRENCY_PREFIXES = {
  SGD: {
    prefix: '$',
    label: 'SGD',
  },
  MYR: {
    prefix: 'RM',
    label: 'MYR',
  },
  AUD: {
    prefix: '$',
    label: 'AUD',
  },
  JPY: {
    prefix: '¥',
    label: 'JPY',
  },
  IDR: {
    prefix: 'Rp',
    label: 'IDR',
  },
  USD: {
    prefix: '$',
    label: 'USD',
  },
};

const formatAmount = (value) => {
  if (!value || value === '') return '';

  const cleanValue = value.toString().replace(/[^\d.]/g, '');
  if (!cleanValue) return '';

  const parts = cleanValue.split('.');
  if (parts.length > 2) return `${parts[0]}.${parts.slice(1).join('')}`;

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cleanValue);
};

const CampaignAgreementEdit = ({ dialog, agreement, campaign, campaignMutate, agreementsMutate }) => {
  const settings = useSettingsContext();
  const loading = useBoolean();
  const { data: agreements } = useGetAgreements(campaign?.id);

  const schema = yup.object().shape({
    paymentAmount: yup.string().required('Payment Amount is required.'),
    currency: yup.string().required('Currency is required'),
    default: yup.boolean(),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      paymentAmount: parseInt(agreement?.shortlistedCreator?.amount, 10) || '',
      currency: agreement?.shortlistedCreator?.currency || 'MYR',
      default: false,
    },
    reValidateMode: 'onChange',
  });

  const { watch, handleSubmit, setValue, reset } = methods;

  const isDefault = watch('default');
  const selectedCurrency = watch('currency');

  useEffect(() => {
    if (isDefault) {
      setValue('paymentAmount', '200');
    } else {
      setValue('paymentAmount', agreement?.shortlistedCreator?.amount);
    }
  }, [setValue, isDefault, agreement]);

  // Removed unused handler: inline send flow is handled in onSubmit

  const extractAgremmentsInfo = useMemo(() => {
    if (campaign?.agreementTemplate) return campaign.agreementTemplate;

    return campaign?.campaignAdmin?.reduce(
      (foundTemplate, item) => foundTemplate || item?.admin?.user?.agreementTemplate[0] || null,
      null
    );
  }, [campaign]);


  const v4UsedCredits = React.useMemo(() => {
    // Unified credit calculation for all campaign types
    // Credits are only counted as utilized when agreements are sent
    if (!campaign?.campaignCredits) return null;
    if (!agreements || !campaign?.shortlisted) return 0;
    
    const sentAgreementUserIds = new Set(
      agreements
        .filter((a) => a.isSent && a.user?.creator?.isGuest !== true)
        .map((a) => a.userId)
    );
    
    return campaign.shortlisted.reduce((acc, creator) => {
      if (
        sentAgreementUserIds.has(creator.userId) &&
        creator.user?.creator?.isGuest !== true &&
        creator.ugcVideos
      ) {
        return acc + (creator.ugcVideos || 0);
      }
      return acc;
    }, 0);
  }, [campaign, agreements]);

  const onSubmit = handleSubmit(async (data) => {
    loading.onTrue();
    console.log(agreement);

    try {
      // Check if credits are fully utilized before sending agreement
      if (campaign?.campaignCredits) {
        // Check if credits are already fully utilized
        if (v4UsedCredits !== null && v4UsedCredits >= campaign.campaignCredits) {
          loading.onFalse();
          enqueueSnackbar(
            'Insufficient Credits: All campaign credits have been utilized. Cannot generate and send agreement.',
            { variant: 'error' }
          );
          return;
        }

        // For v4 campaigns, also need to assign credit on agreement send
        if (campaign?.submissionVersion === 'v4') {
          try {
            const creditAssignment = await axiosInstance.post('/api/campaign/v4/assignCreditOnAgreementSend', {
              userId: agreement?.user?.id,
              campaignId: agreement?.campaignId,
            });

            if (creditAssignment?.status !== 200 || creditAssignment?.data?.error) {
              loading.onFalse();
              enqueueSnackbar(
                creditAssignment?.data?.message || 'Insufficient Credits: All campaign credits have been utilized.',
                { variant: 'error' }
              );
              return; 
            }
          } catch (error) {
            loading.onFalse();
            if (error?.response?.status === 400) {
              enqueueSnackbar(
                error?.response?.data?.message || 'Insufficient Credits: Not enough credits available to send this agreement.',
                { variant: 'error' }
              );
            } else {
              enqueueSnackbar(
                error?.response?.data?.message || error?.message || 'Cannot send agreement - credits validation failed',
                { variant: 'error' }
              );
            }
            return;
          }
        }
      }
      console.log('Generating PDF with values:', {
        currency: data.currency,
        amount: data.paymentAmount,
        formattedPayment: `${CURRENCY_PREFIXES[data.currency]?.prefix}${data.paymentAmount}`,
      });

      const blob = await pdf(
        <AgreementTemplate
          DATE={dayjs().format('LL')}
          IC_NUMBER={agreement?.user?.paymentForm?.icNumber}
          FREELANCER_FULL_NAME={agreement?.user?.name}
          ADDRESS={agreement?.user?.creator?.address}
          ccEmail="hello@cultcreative.com"
          ccPhoneNumber="+60162678757"
          effectiveDate={dayjs().add(4, 'day').format('LL')}
          creatorPayment={`${CURRENCY_PREFIXES[data.currency]?.prefix}${data.paymentAmount}`}
          CREATOR_NAME={agreement?.user?.name}
          CREATOR_ACCOUNT_NUMBER={agreement?.user?.paymentForm?.bankAccountNumber}
          CREATOR_BANK_ACCOUNT_NAME={
            agreement?.user?.paymentForm?.bankAccountName || agreement?.user?.name || 'N/A'
          }
          CREATOR_BANK_NAME={agreement?.user?.paymentForm?.bankName}
          AGREEMENT_ENDDATE={dayjs().add(1, 'month').format('LL')}
          NOW_DATE={dayjs().format('LL')}
          VERSION_NUMBER={`V${dayjs().unix()}`}
          ADMIN_IC_NUMBER={extractAgremmentsInfo?.adminICNumber ?? 'Default'}
          ADMIN_NAME={extractAgremmentsInfo?.adminName ?? 'Default'}
          SIGNATURE={extractAgremmentsInfo?.signURL ?? 'Default'}
        />
      ).toBlob();

      const formData = new FormData();
      formData.append('agreementForm', blob);

      const requestData = {
        paymentAmount: data.paymentAmount,
        currency: data.currency,
        user: agreement?.user,
        campaignId: agreement?.campaignId,
        id: agreement?.id,
        isNew: agreement?.isNew || false, 
      };

      console.log('Sending data to backend:', requestData);
      formData.append('data', JSON.stringify(requestData));

      const res = await axiosInstance.patch(endpoints.campaign.updateAmountAgreement, formData, {
        headers: {
          Accept: 'multipart/form-data',
        },
      });

      const agreementIdToSend = res?.data?.agreement?.id || agreement?.id;

      const sendAgreementPayload = {
        ...agreement,
        id: agreementIdToSend,
        isNew: agreement?.isNew || false,
      };

      await axiosInstance.patch(endpoints.campaign.sendAgreement, sendAgreementPayload);


      if (agreementsMutate) {
        await agreementsMutate();
      } else {
        await mutate(endpoints.campaign.creatorAgreement(agreement?.campaignId));
      }

      if (campaignMutate) {
        await campaignMutate();
      }

      await mutate(endpoints.campaign.getCampaignById(agreement?.campaignId));

      // await mutate(
      //   endpoints.campaign.creatorAgreement(agreement.campaignId),
      //   (currentData) => {
      //     if (currentData) {
      //       return currentData.map((item) =>
      //         item.id === agreement.id
      //           ? {
      //               ...item,
      //               amount: data.paymentAmount,
      //               currency: data.currency,
      //               agreementUrl: res.data.agreement?.agreementUrl || item.agreementUrl,
      //               user: {
      //                 ...item.user,
      //                 shortlisted: [
      //                   {
      //                     ...item.user.shortlisted[0],
      //                     amount: data.paymentAmount,
      //                     currency: data.currency,
      //                   },
      //                 ],
      //               },
      //             }
      //           : item
      //       );
      //     }
      //     return currentData;
      //   },
      //   { revalidate: true }
      // );

      enqueueSnackbar(res?.data?.message);
      dialog.onFalse();
      reset();
    } catch (error) {
      console.error('Error updating agreement:', error);
      enqueueSnackbar('Error updating agreement', { variant: 'error' });
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

            {/* Show Insufficient Credits warning for v4 campaigns when credits are fully utilized */}
            {campaign?.submissionVersion === 'v4' && 
             campaign?.campaignCredits && 
             v4UsedCredits !== null && 
             v4UsedCredits >= campaign.campaignCredits && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'error.lighter',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'error.main',
                }}
              >
                <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>
                  ⚠️ Insufficient Credits: All campaign credits ({campaign.campaignCredits}) have been utilized. 
                </Typography>
              </Box>
            )}

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
          <Stack sx={{ mt: 2 }} spacing={2}>
            <Stack spacing={1}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(1,1fr)', sm: '0.8fr 1.2fr' },
                  gap: 2,
                }}
              >
                <RHFSelect
                  name="currency"
                  label="Currency"
                  disabled={isDefault}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                    },
                  }}
                >
                  <MenuItem disabled sx={{ fontStyle: 'italic' }}>
                    Select currency
                  </MenuItem>
                  {['SGD', 'MYR', 'AUD', 'JPY', 'IDR', 'USD'].map((curr) => (
                    <MenuItem key={curr} value={curr}>
                      {curr}
                    </MenuItem>
                  ))}
                </RHFSelect>

                <RHFTextField
                  name="paymentAmount"
                  type="text"
                  label="Payment Amount"
                  InputLabelProps={{ shrink: true }}
                  disabled={isDefault}
                  InputProps={{
                    startAdornment: (
                      <Typography sx={{ color: 'text.secondary', mr: 0.5 }}>
                        {CURRENCY_PREFIXES[selectedCurrency]?.prefix || ''}
                      </Typography>
                    ),
                  }}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[^\d.]/g, '');
                    if (rawValue === '' || !Number.isNaN(rawValue)) {
                      setValue('paymentAmount', rawValue);
                    }
                  }}
                  value={watch('paymentAmount') ? formatAmount(watch('paymentAmount')) : ''}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                    },
                  }}
                />
              </Box>
              <RHFCheckbox
                name="default"
                label="Default"
                sx={{
                  color: '#636366',
                  ml: -1,
                }}
              />
            </Stack>
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
            disabled={
              campaign?.submissionVersion === 'v4' &&
              campaign?.campaignCredits &&
              v4UsedCredits !== null &&
              v4UsedCredits >= campaign.campaignCredits
            }
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
              '&.Mui-disabled': {
                bgcolor: '#e0e0e0',
                color: '#9e9e9e',
                borderBottom: '3px solid #bdbdbd',
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
  campaignMutate: PropTypes.func,
  agreementsMutate: PropTypes.func,
};
