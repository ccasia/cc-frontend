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

const CampaignAgreementEdit = ({
  dialog,
  agreement,
  campaign,
  campaignMutate,
  agreementsMutate,
}) => {
  const settings = useSettingsContext();
  const loading = useBoolean();
  const { data: agreements } = useGetAgreements(campaign?.id);

  const isGuestCreator = agreement?.user?.creator?.isGuest === true;
  const requiresUGCCredits = !isGuestCreator;

  // Get credit tier data for display (only for credit tier campaigns)
  const getTierData = () => {
    // Try multiple sources for tier data
    const shortlisted = agreement?.user?.shortlisted?.[0] || agreement?.shortlistedCreator;

    // First try: creditTier from shortlisted record
    if (shortlisted?.creditTier) {
      return {
        name: shortlisted.creditTier?.name || 'Unknown Tier',
        creditsPerVideo: shortlisted.creditPerVideo ?? shortlisted.creditTier?.creditsPerVideo ?? 1,
      };
    }

    // Second try: creditTier from creator record (current tier)
    const creatorTier = agreement?.user?.creator?.creditTier;
    if (creatorTier) {
      return {
        name: creatorTier.name || 'Unknown Tier',
        creditsPerVideo: creatorTier.creditsPerVideo ?? 1,
      };
    }

    // Third try: look in campaign.shortlisted for this user
    const campaignShortlisted = campaign?.shortlisted?.find(
      (s) => s.userId === agreement?.user?.id
    );
    if (campaignShortlisted?.creditTier) {
      return {
        name: campaignShortlisted.creditTier?.name || 'Unknown Tier',
        creditsPerVideo: campaignShortlisted.creditPerVideo ?? campaignShortlisted.creditTier?.creditsPerVideo ?? 1,
      };
    }

    return null;
  };
  const tierData = campaign?.isCreditTier ? getTierData() : null;

  const schema = useMemo(
    () =>
      yup.object().shape({
        paymentAmount: yup.string().required('Payment Amount is required.'),
        currency: yup.string().required('Currency is required'),
        default: yup.boolean(),
        ugcCredits: requiresUGCCredits
          ? yup
              .number()
              .typeError('UGC credits are required.')
              .integer('UGC credits must be a whole number.')
              .min(1, 'At least 1 credit is required.')
              .required('UGC credits are required.')
          : yup.number().nullable(),
      }),
    [requiresUGCCredits]
  );

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      paymentAmount: parseInt(agreement?.shortlistedCreator?.amount, 10) || '',
      currency: agreement?.shortlistedCreator?.currency || 'MYR',
      default: false,
      ugcCredits:
        agreement?.shortlistedCreator?.ugcVideos !== undefined &&
        agreement?.shortlistedCreator?.ugcVideos !== null
          ? String(agreement.shortlistedCreator.ugcVideos)
          : '',
    },
    reValidateMode: 'onChange',
  });

  const { watch, handleSubmit, setValue, reset } = methods;

  const isDefault = watch('default');
  const selectedCurrency = watch('currency');
  const ugcCreditsValue = watch('ugcCredits');
  const paymentAmountValue = watch('paymentAmount');

  useEffect(() => {
    const currentCredits =
      agreement?.shortlistedCreator?.ugcVideos !== undefined &&
      agreement?.shortlistedCreator?.ugcVideos !== null
        ? String(agreement.shortlistedCreator.ugcVideos)
        : '';

    if (isDefault) {
      setValue('paymentAmount', '200');
      setValue('ugcCredits', '1');
      return;
    }

    setValue('paymentAmount', agreement?.shortlistedCreator?.amount);
    setValue('ugcCredits', currentCredits);
  }, [setValue, isDefault, agreement]);

  // Removed unused handler: inline send flow is handled in onSubmit

  const extractAgremmentsInfo = useMemo(() => {
    if (campaign?.agreementTemplate) return campaign.agreementTemplate;

    return campaign?.campaignAdmin?.reduce(
      (foundTemplate, item) => foundTemplate || item?.admin?.user?.agreementTemplate[0] || null,
      null
    );
  }, [campaign]);

  // Calculate used credits by OTHER creators (excluding current creator)
  // For credit tier campaigns, multiply ugcVideos by creditPerVideo
  const usedCreditsByOthers = React.useMemo(() => {
    if (!campaign?.campaignCredits) return null;
    if (!agreements || !campaign?.shortlisted) return 0;

    const sentAgreementUserIds = new Set(
      agreements.filter((a) => a.isSent && a.user?.creator?.isGuest !== true).map((a) => a.userId)
    );

    return campaign.shortlisted.reduce((acc, creator) => {
      // Exclude the current creator from the calculation
      if (creator.userId === agreement?.user?.id) return acc;

      if (
        sentAgreementUserIds.has(creator.userId) &&
        creator.user?.creator?.isGuest !== true &&
        creator.ugcVideos
      ) {
        // For credit tier campaigns, use creditPerVideo multiplier
        const videos = creator.ugcVideos || 0;
        const creditsPerVideo = campaign?.isCreditTier ? (creator.creditPerVideo || 1) : 1;
        return acc + (videos * creditsPerVideo);
      }
      return acc;
    }, 0);
  }, [campaign, agreements, agreement?.user?.id]);

  // Max credits user can enter = total - usedByOthers
  const maxCreditsAllowed = useMemo(() => {
    if (!campaign?.campaignCredits) return null;
    if (usedCreditsByOthers === null) return null;

    return Math.max(0, Number(campaign.campaignCredits) - usedCreditsByOthers);
  }, [campaign, usedCreditsByOthers]);

  // Calculate total credits this creator will cost
  const creatorCost = useMemo(() => {
    if (!requiresUGCCredits) return 0;
    const videos = Number(ugcCreditsValue) || 0;
    return campaign?.isCreditTier
      ? (tierData?.creditsPerVideo || 1) * videos
      : videos;
  }, [campaign?.isCreditTier, ugcCreditsValue, tierData, requiresUGCCredits]);

  // Calculate remaining credits in real-time as user types
  const realTimeCreditsLeft = useMemo(() => {
    if (!campaign?.campaignCredits) return null; // Unlimited campaign
    if (maxCreditsAllowed === null) return null;
    return maxCreditsAllowed - creatorCost;
  }, [campaign?.campaignCredits, maxCreditsAllowed, creatorCost]);

  // Determine if form is invalid for button state
  const isFormInvalid = useMemo(() => {
    // Payment must be filled
    if (!paymentAmountValue || paymentAmountValue === '') return true;

    // For non-guest creators, credits must be filled
    if (requiresUGCCredits && (!ugcCreditsValue || ugcCreditsValue === '')) return true;

    // For campaigns with credit limits, check if exceeded
    if (campaign?.campaignCredits && requiresUGCCredits) {
      if (realTimeCreditsLeft !== null && realTimeCreditsLeft < 0) return true;
    }

    return false;
  }, [paymentAmountValue, requiresUGCCredits, ugcCreditsValue, campaign?.campaignCredits, realTimeCreditsLeft]);

  const onSubmit = handleSubmit(async (data) => {
    loading.onTrue();
    const creditsToAssign = requiresUGCCredits ? Number(ugcCreditsValue) : null;

    try {
      // Validate credits against max allowed
      if (campaign?.campaignCredits && requiresUGCCredits) {
        if (!Number.isFinite(creditsToAssign) || creditsToAssign <= 0) {
          loading.onFalse();
          enqueueSnackbar('UGC credits must be a positive number.', { variant: 'error' });
          return;
        }

        if (maxCreditsAllowed !== null && creditsToAssign > maxCreditsAllowed) {
          loading.onFalse();
          enqueueSnackbar(
            `Insufficient Credits: Maximum ${maxCreditsAllowed} credits can be assigned.`,
            { variant: 'error' }
          );
          return;
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
          isForSurfShark={campaign?.isForSurfShark}
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
        credits: creditsToAssign, // Include credits for V4 submission updates
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
        credits: creditsToAssign,
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
              <Typography variant="h6">{campaign?.isCreditTier ? 'Assign Video Amount and Set Agreement' : 'Assign Credits and Set Agreement'}</Typography>
            </Stack>

            <Box sx={{ borderBottom: '1px solid #e7e7e7' }} />

            {/* Show Insufficient Credits warning when no credits available for this creator */}
            {campaign?.campaignCredits && maxCreditsAllowed === 0 && (
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
                  ⚠️ Insufficient Credits: All campaign credits ({campaign.campaignCredits}) have
                  been utilized by other creators.
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
                <Stack direction="row" justifyContent="space-between" alignItems="center" flex={1}>
                  <Stack>
                    <Typography variant="subtitle1">{agreement?.user?.name}</Typography>
                    <Typography variant="body2" sx={{ color: '#637381' }}>
                      {agreement?.user?.email}
                    </Typography>
                  </Stack>
                  {campaign?.isCreditTier && tierData && (
                    <Stack direction="row" spacing={1}>
                      <Box
                        sx={{
                          px: 1,
                          py: 0.5,
                          border: '1px solid #EBEBEB',
                          borderRadius: 0.8,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {tierData.name}
                      </Box>
                      <Box
                        sx={{
                          px: 1,
                          py: 0.5,
                          border: '1px solid #EBEBEB',
                          borderRadius: 0.8,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {tierData.creditsPerVideo} credits/video
                      </Box>
                    </Stack>
                  )}
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

              {/* UGC Credits / Video Amount Section */}
              {requiresUGCCredits && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <RHFTextField
                    name="ugcCredits"
                    type="number"
                    label={campaign?.isCreditTier ? "Video Amount" : "UGC Credits"}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: 1,
                      ...(maxCreditsAllowed !== null && { max: maxCreditsAllowed }),
                    }}
                    disabled={maxCreditsAllowed === 0}
                    onChange={(e) => {
                      const {value} = e.target;
                      if (value === '') {
                        setValue('ugcCredits', '');
                        return;
                      }
                      if (maxCreditsAllowed !== null && Number(value) > maxCreditsAllowed) {
                        setValue('ugcCredits', String(maxCreditsAllowed));
                      } else {
                        setValue('ugcCredits', value);
                      }
                    }}
                    value={ugcCreditsValue}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                      },
                    }}
                  />

                  {/* Credit Summary */}
                  {campaign?.campaignCredits && (() => {
                    const isExceeded = realTimeCreditsLeft !== null && realTimeCreditsLeft < 0;
                    const isUsingAll = realTimeCreditsLeft === 0 && creatorCost > 0;

                    const getBgColor = () => {
                      if (isExceeded) return '#FFF1F0';
                      if (isUsingAll) return '#FFF8E5';
                      return '#F8F9FA';
                    };

                    const getBorderColor = () => {
                      if (isExceeded) return '#FFCCC7';
                      if (isUsingAll) return '#FFE58F';
                      return '#E8EAED';
                    };

                    const getRemainingColor = () => {
                      if (isExceeded) return '#CF1322';
                      if (isUsingAll) return '#D46B08';
                      return '#5F6368';
                    };

                    return (
                      <Box
                        sx={{
                          px: 1.5,
                          py: 1.25,
                          borderRadius: 1.5,
                          bgcolor: getBgColor(),
                          border: '1px solid',
                          borderColor: getBorderColor(),
                        }}
                      >
                        <Stack spacing={0.75}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography
                              variant="caption"
                              sx={{
                                color: isExceeded ? '#CF1322' : '#5F6368',
                                fontWeight: 500,
                              }}
                            >
                              Cost: {creatorCost} credit{creatorCost !== 1 ? 's' : ''}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                color: getRemainingColor(),
                              }}
                            >
                              {Math.max(0, realTimeCreditsLeft ?? 0)} credits remaining
                            </Typography>
                          </Stack>

                          {/* Error message when credits exceeded */}
                          {isExceeded && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#CF1322',
                                lineHeight: 1.5,
                                fontSize: '0.7rem',
                              }}
                            >
                              Creator cost exceeds the remaining credits. Please reduce the {campaign?.isCreditTier ? 'video amount' : 'credits'} or increase the campaign budget.
                            </Typography>
                          )}

                          {/* Warning message when using all remaining */}
                          {isUsingAll && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#D46B08',
                                lineHeight: 1.5,
                                fontSize: '0.7rem',
                              }}
                            >
                              This will use all remaining campaign credits
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    );
                  })()}
                </Stack>
              )}
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
            disabled={loading.value}
            sx={{
              bgcolor: '#FFFFFF',
              border: '1.5px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1.15,
              color: '#1340FF',
              height: 44,
              minWidth: 100,
              px: 2.5,
              fontWeight: 600,
              fontSize: '1rem',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgba(19, 64, 255, 0.08)',
                border: '1.5px solid #1340FF',
                borderBottom: '3px solid #1340FF',
                color: '#1340FF',
              },
            }}
          >
            Cancel
          </Button>

          <LoadingButton
            type="submit"
            loading={loading.value}
            disabled={loading.value || isFormInvalid}
            loadingIndicator={
              <SyncLoader color="white" size={5} />
            }
            sx={{
              bgcolor: '#1340FF',
              border: '1.5px solid #1340FF',
              borderBottom: '3px solid #0D2BA8',
              borderRadius: 1.15,
              color: '#FFFFFF',
              height: 44,
              minWidth: 100,
              px: 2.5,
              fontWeight: 600,
              fontSize: '1rem',
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#0D2BA8',
                color: '#FFFFFF',
              },
              '&.Mui-disabled': {
                bgcolor: '#B0B0B1',
                border: '1.5px solid #B0B0B1',
                borderBottom: '3px solid #9E9E9F',
                color: '#FFFFFF',
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
