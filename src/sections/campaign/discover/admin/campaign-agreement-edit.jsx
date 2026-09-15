import dayjs from 'dayjs';
import * as yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { pdf } from '@react-pdf/renderer';
import { enqueueSnackbar } from 'notistack';
import { SyncLoader } from 'react-spinners';
import { NumericFormat } from 'react-number-format';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import InputAdornment from '@mui/material/InputAdornment';
import {
  Box,
  Tab,
  Grid,
  Tabs,
  Stack,
  Dialog,
  Avatar,
  Divider,
  MenuItem,
  Typography,
  IconButton,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetCreditTiers from 'src/hooks/use-get-credit-tiers';
import { useGetAgreements } from 'src/hooks/agreement/use-get-agreements';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import AgreementTemplate from 'src/template/agreement';

import Iconify from 'src/components/iconify';
import FieldLabel from 'src/components/field-label';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFSwitch, RHFTextField } from 'src/components/hook-form';

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

const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Insta', icon: 'ri:instagram-fill' },
  { value: 'tiktok', label: 'TikTok', icon: 'ic:baseline-tiktok' },
];

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

const toFollowerCount = (value) => {
  const parsed = parseInt(String(value ?? '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const getSnapshotFollowerCount = (record, platform) =>
  (record?.selectedPlatform || 'instagram') === platform
    ? toFollowerCount(record?.followerCount)
    : 0;

const CREDIT_STATUS_STYLES = {
  exceeded: {
    bgcolor: '#FFF1F0',
    borderColor: '#FFCCC7',
    costColor: '#CF1322',
    remainingColor: '#CF1322',
  },
  usingAll: {
    bgcolor: '#FFF8E5',
    borderColor: '#FFE58F',
    costColor: '#5F6368',
    remainingColor: '#D46B08',
  },
  normal: {
    bgcolor: '#F8F9FA',
    borderColor: '#E8EAED',
    costColor: '#5F6368',
    remainingColor: '#5F6368',
  },
};

function CreditsStatusBanner({ creatorCost, realTimeCreditsLeft, isCreditTier }) {
  const isExceeded = realTimeCreditsLeft !== null && realTimeCreditsLeft < 0;
  const isUsingAll = realTimeCreditsLeft === 0 && creatorCost > 0;
  let status = 'normal';
  if (isExceeded) status = 'exceeded';
  else if (isUsingAll) status = 'usingAll';
  const styles = CREDIT_STATUS_STYLES[status];

  return (
    <Box
      sx={{
        px: 1.5,
        py: 1.25,
        borderRadius: 1.5,
        bgcolor: styles.bgcolor,
        border: '1px solid',
        borderColor: styles.borderColor,
      }}
    >
      <Stack spacing={0.75}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" sx={{ color: styles.costColor, fontWeight: 500 }}>
            Cost: {creatorCost} credit{creatorCost !== 1 ? 's' : ''}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: styles.remainingColor }}>
            {Math.max(0, realTimeCreditsLeft ?? 0)} credits remaining
          </Typography>
        </Stack>

        {isExceeded && (
          <Typography
            variant="caption"
            sx={{ color: '#CF1322', lineHeight: 1.5, fontSize: '0.7rem' }}
          >
            Creator cost exceeds the remaining credits. Please reduce the{' '}
            {isCreditTier ? 'video amount' : 'credits'} or increase the campaign budget.
          </Typography>
        )}

        {isUsingAll && (
          <Typography
            variant="caption"
            sx={{ color: '#D46B08', lineHeight: 1.5, fontSize: '0.7rem' }}
          >
            This will use all remaining campaign credits
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

CreditsStatusBanner.propTypes = {
  creatorCost: PropTypes.number.isRequired,
  realTimeCreditsLeft: PropTypes.number,
  isCreditTier: PropTypes.bool,
};

const CampaignAgreementEdit = ({
  dialog,
  agreement,
  campaign,
  campaignMutate,
  agreementsMutate,
}) => {
  const loading = useBoolean();

  const { user } = useAuthContext();
  const { data: agreements } = useGetAgreements(campaign?.id);
  const { data: creditTierList } = useGetCreditTiers();

  const isSuperAdmin = user?.role === 'superadmin';
  const isGuestCreator = agreement?.user?.creator?.isGuest === true;

  const requiresUGCCredits = !isGuestCreator;

  const shortlistedRecord = agreement?.shortlistedCreator;

  const pitchRecord = campaign?.pitch?.find((p) => p.userId === agreement?.user?.id);

  const agreedPlatform =
    shortlistedRecord?.selectedPlatform || pitchRecord?.selectedPlatform || 'instagram';

  const [selectedPlatform, setSelectedPlatform] = useState(agreedPlatform);

  const getTierData = () => {
    const shortlisted = shortlistedRecord;

    if (shortlisted?.creditTier) {
      return {
        name: shortlisted.creditTier?.name || 'Unknown Tier',
        creditsPerVideo: shortlisted.creditPerVideo ?? shortlisted.creditTier?.creditsPerVideo ?? 1,
      };
    }

    const campaignShortlisted = campaign?.shortlisted?.find(
      (s) => s.userId === agreement?.user?.id
    );

    if (campaignShortlisted?.creditTier) {
      return {
        name: campaignShortlisted.creditTier?.name || 'Unknown Tier',
        creditsPerVideo:
          campaignShortlisted.creditPerVideo ??
          campaignShortlisted.creditTier?.creditsPerVideo ??
          1,
      };
    }

    return null;
  };

  const tierData = campaign?.isCreditTier ? getTierData() : null;

  const getFollowerCountByPlatform = useCallback(
    (platform) => {
      const agreedFollowerCount =
        getSnapshotFollowerCount(shortlistedRecord, platform) ||
        getSnapshotFollowerCount(pitchRecord, platform);

      if (agreedFollowerCount > 0) return agreedFollowerCount;

      const creatorData = agreement?.user?.creator;
      if (!creatorData) return 0;

      if (platform === 'tiktok') {
        return creatorData.tiktokUser?.follower_count || creatorData.manualTiktokFollowerCount || 0;
      }

      return (
        creatorData.instagramUser?.followers_count || creatorData.manualInstagramFollowerCount || 0
      );
    },
    [agreement?.user?.creator, pitchRecord, shortlistedRecord]
  );

  const getMediaKitFollowerCount = (platform) => {
    const creatorData = agreement?.user?.creator;

    if (platform === 'tiktok') return creatorData?.tiktokUser?.follower_count || 0;

    return creatorData?.instagramUser?.followers_count || 0;
  };

  const schema = useMemo(
    () =>
      yup.object().shape({
        isSeedingAgreement: yup.boolean(),
        product: yup.object().when('isSeedingAgreement', {
          is: true,
          then: (schem) =>
            schem.shape({
              name: yup.string().required('Product name is required.'),
              value: yup.string().required('Product value is required.'),
            }),
          otherwise: (schem) =>
            schem.shape({
              name: yup.string().notRequired(),
              value: yup.string().notRequired(),
            }),
        }),
        paymentAmount: yup.string().when('isSeedingAgreement', {
          is: false,
          then: (schem) => schem.required('Payment Amount is required.'),
          otherwise: (schem) => schem.notRequired(),
        }),
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
        platformFollowerCount: yup.string().nullable(),
      }),
    [requiresUGCCredits]
  );

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      isSeedingAgreement: agreement?.isSeeding ?? false,
      product: {
        name: '',
        value: '',
      },
      paymentAmount: parseInt(agreement?.shortlistedCreator?.amount, 10) || '',
      currency: agreement?.shortlistedCreator?.currency || 'MYR',
      default: false,
      ugcCredits:
        agreement?.shortlistedCreator?.ugcVideos !== undefined &&
        agreement?.shortlistedCreator?.ugcVideos !== null
          ? String(agreement.shortlistedCreator.ugcVideos)
          : '',
      platformFollowerCount: '',
    },
    reValidateMode: 'onChange',
  });

  const {
    watch,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { isValid },
  } = methods;

  const [
    isSeedingAgreement,
    isDefault,
    selectedCurrency,
    ugcCreditsValue,
    paymentAmountValue,
    platformFollowerValue,
  ] = watch([
    'isSeedingAgreement',
    'default',
    'currency',
    'ugcCredits',
    'paymentAmount',
    'platformFollowerCount',
  ]);

  const originalPlatform = agreedPlatform;
  const hasPlatformChanged = selectedPlatform !== originalPlatform;
  const selectedPlatformFollower = getFollowerCountByPlatform(selectedPlatform);
  const mediaKitFollower = getMediaKitFollowerCount(selectedPlatform);

  const canEditFollowerCount = isSuperAdmin || selectedPlatformFollower <= 0;

  const platformLabel = selectedPlatform === 'tiktok' ? 'TikTok' : 'Instagram';

  const effectiveFollowerCountForTier = canEditFollowerCount
    ? Number(platformFollowerValue || 0) || Number(selectedPlatformFollower || 0)
    : Number(selectedPlatformFollower || 0);

  const liveTierData = useMemo(() => {
    if (!campaign?.isCreditTier || !Array.isArray(creditTierList)) return null;
    if (!effectiveFollowerCountForTier || effectiveFollowerCountForTier <= 0) return null;

    const matched = creditTierList.filter(
      (tier) =>
        tier?.isActive &&
        tier?.minFollowers <= effectiveFollowerCountForTier &&
        (tier?.maxFollowers === null || tier?.maxFollowers >= effectiveFollowerCountForTier)
    );
    if (!matched.length) return null;
    return matched.sort((a, b) => (b?.minFollowers || 0) - (a?.minFollowers || 0))[0];
  }, [campaign?.isCreditTier, creditTierList, effectiveFollowerCountForTier]);

  let previewTierSource = tierData || null;

  if (hasPlatformChanged || effectiveFollowerCountForTier > 0) {
    previewTierSource = liveTierData;
  }

  const displayTierData = useMemo(
    () =>
      campaign?.isCreditTier && previewTierSource
        ? {
            name: previewTierSource?.name || 'Unknown Tier',
            creditsPerVideo: previewTierSource?.creditsPerVideo || 1,
          }
        : null,
    [campaign?.isCreditTier, previewTierSource]
  );

  const handleSavedValue = useCallback(() => {
    if (isDefault) {
      setValue('paymentAmount', '200');
      setValue('ugcCredits', '1');
      return;
    }

    setValue('paymentAmount', agreement?.amount);
    setValue('currency', CURRENCY_PREFIXES[agreement?.currency]?.label);
    setValue('ugcCredits', agreement?.videoCount);
    setSelectedPlatform(agreedPlatform);
    setValue('platformFollowerCount', String(getFollowerCountByPlatform(agreedPlatform) || ''));

    setValue('isSeedingAgreement', agreement?.isSeeding);
    if (agreement?.productSeeding?.length) {
      setValue('product', {
        name: agreement?.productSeeding?.[0]?.name,
        value: agreement?.productSeeding?.[0]?.value,
      });
    }
  }, [
    agreement?.currency,
    agreement?.videoCount,
    agreement?.amount,
    agreement?.isSeeding,
    agreement?.productSeeding,
    isDefault,
    setValue,
    agreedPlatform,
    getFollowerCountByPlatform,
  ]);

  useEffect(() => {
    handleSavedValue();
  }, [handleSavedValue]);

  const extractAgreementInfo = useMemo(() => {
    if (campaign?.agreementTemplate) return campaign.agreementTemplate;

    return campaign?.campaignAdmin?.reduce(
      (foundTemplate, item) => foundTemplate || item?.admin?.user?.agreementTemplate[0] || null,
      null
    );
  }, [campaign]);

  // Compute used credits by OTHER creators (excluding current creator)
  // For credit tier campaigns, multiply ugcVideos by creditPerVideo
  const usedCreditsByOthers = React.useMemo(() => {
    if (campaign?.campaignCredits == null) return null;
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
        const creditsPerVideo = campaign?.isCreditTier ? creator.creditPerVideo || 1 : 1;
        return acc + videos * creditsPerVideo;
      }
      return acc;
    }, 0);
  }, [campaign, agreements, agreement?.user?.id]);

  // Max credits user can enter = total - usedByOthers
  const maxCreditsAllowed = useMemo(() => {
    if (campaign?.campaignCredits == null) return null;
    if (usedCreditsByOthers === null) return null;

    return Math.max(0, Number(campaign.campaignCredits) - usedCreditsByOthers);
  }, [campaign, usedCreditsByOthers]);

  // Calculate total credits this creator will cost
  const creatorCost = useMemo(() => {
    if (!requiresUGCCredits) return 0;

    const numOfCredits = Number(ugcCreditsValue) || 0;

    return campaign?.isCreditTier
      ? (displayTierData?.creditsPerVideo || 1) * numOfCredits
      : numOfCredits;
  }, [campaign?.isCreditTier, ugcCreditsValue, displayTierData, requiresUGCCredits]);

  // Calculate remaining credits in real-time as user types
  const realTimeCreditsLeft = useMemo(() => {
    if (campaign?.campaignCredits == null) return null; // Unlimited campaign (no budget tracking)
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
    if (campaign?.campaignCredits != null && requiresUGCCredits) {
      if (realTimeCreditsLeft !== null && realTimeCreditsLeft < 0) return true;
    }

    // A tier campaign cannot price the agreement without a follower count from somewhere.
    if (campaign?.isCreditTier && effectiveFollowerCountForTier <= 0) {
      return true;
    }

    if (campaign?.isCreditTier && !displayTierData) {
      return true;
    }

    return false;
  }, [
    paymentAmountValue,
    requiresUGCCredits,
    ugcCreditsValue,
    campaign?.campaignCredits,
    realTimeCreditsLeft,
    effectiveFollowerCountForTier,
    campaign?.isCreditTier,
    displayTierData,
  ]);

  const onSubmit = handleSubmit(async (data) => {
    loading.onTrue();

    const creditsToAssign = requiresUGCCredits ? Number(ugcCreditsValue) : null;

    const parsedPlatformFollower = canEditFollowerCount
      ? effectiveFollowerCountForTier || undefined
      : undefined;

    try {
      if (campaign?.campaignCredits != null && requiresUGCCredits) {
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

      const blob = await pdf(
        <AgreementTemplate
          DATE={dayjs().format('LL')}
          IC_NUMBER={agreement?.user?.paymentForm?.icNumber}
          FREELANCER_FULL_NAME={
            agreement?.user?.paymentForm?.bankAccountName || agreement?.user?.name || 'N/A'
          }
          ADDRESS={agreement?.user?.creator?.address}
          ccEmail="hello@cultcreative.com"
          ccPhoneNumber="+60162678757"
          effectiveDate={dayjs().add(4, 'day').format('LL')}
          creatorPayment={`${CURRENCY_PREFIXES[data.currency]?.prefix}${parseFloat(Number(data.paymentAmount)).toFixed(2)}`}
          CREATOR_NAME={
            agreement?.user?.paymentForm?.bankAccountName || agreement?.user?.name || 'N/A'
          }
          CREATOR_ACCOUNT_NUMBER={agreement?.user?.paymentForm?.bankAccountNumber}
          CREATOR_BANK_ACCOUNT_NAME={
            agreement?.user?.paymentForm?.bankAccountName || agreement?.user?.name || 'N/A'
          }
          CREATOR_BANK_NAME={agreement?.user?.paymentForm?.bankName}
          AGREEMENT_ENDDATE={dayjs().add(1, 'month').format('LL')}
          NOW_DATE={dayjs().format('LL')}
          VERSION_NUMBER={`V${dayjs().unix()}`}
          ADMIN_IC_NUMBER={extractAgreementInfo?.adminICNumber ?? 'Default'}
          ADMIN_NAME={extractAgreementInfo?.adminName ?? 'Default'}
          SIGNATURE={extractAgreementInfo?.signURL ?? 'Default'}
          isForSurfShark={campaign?.isForSurfShark}
          isSeedingAgreement={data.isSeedingAgreement}
          productValue={`${CURRENCY_PREFIXES[data.currency]?.prefix}${parseFloat(data.product?.value).toFixed(2)}`}
        />
      ).toBlob();

      const requestData = {
        paymentAmount: data.paymentAmount,
        currency: data.currency,
        user: agreement?.user,
        campaignId: agreement?.campaignId,
        id: agreement?.id,
        isNew: agreement?.isNew || false,
        credits: creditsToAssign, // Include credits for V4 submission updates
        selectedPlatform,
        ...(!Number.isNaN(parsedPlatformFollower) && parsedPlatformFollower
          ? { followerCount: parsedPlatformFollower }
          : {}),
        isSeedingAgreement,
        product: data.product,
      };

      const formData = new FormData();
      formData.append('agreementForm', blob);
      formData.append('data', JSON.stringify(requestData));

      const res = await axiosInstance.patch(endpoints.campaign.updateAmountAgreement, formData, {
        headers: {
          Accept: 'multipart/form-data',
        },
      });

      const agreementIdToSend = res?.data?.agreement?.id || agreement?.id;

      const sendAgreementPayload = {
        user: agreement?.user,
        campaignId: agreement?.campaignId,
        id: agreementIdToSend,
        isNew: agreement?.isNew || false,
        credits: creditsToAssign,
        selectedPlatform,
        ...(!Number.isNaN(parsedPlatformFollower) && parsedPlatformFollower
          ? { followerCount: parsedPlatformFollower }
          : {}),
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
    <Dialog
      open={dialog.value}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: 'rgba(244, 244, 244, 1)',
        },
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Box position="relative">
          <IconButton
            sx={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
            onClick={() => {
              dialog.onFalse();
            }}
          >
            <Iconify icon="ci:close-md" width={20} />
          </IconButton>

          <Box sx={{ padding: '10px 16px' }}>
            <Stack direction="row" alignItems="center" flexWrap="wrap">
              <Typography
                fontFamily="Instrument Serif"
                fontSize="36px"
                fontWeight={500}
                letterSpacing={-0.5}
                flex={1}
              >
                Send Agreement
              </Typography>
            </Stack>
          </Box>

          <Divider sx={{ mb: 0 }} />

          <Box sx={{ padding: '20px 40px' }}>
            <Grid container spacing={2}>
              {/* User Info & Platform Selection */}
              <Grid item xs={12} alignSelf="center">
                <Box
                // sx={{
                //   border: 1,
                //   borderColor: (theme) => theme.palette.divider,
                //   px: 2,
                //   py: 1,
                //   borderRadius: 2,
                // }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                  >
                    <Stack direction="row" alignItems="center" gap={1.5} flex={1}>
                      <Avatar src={agreement?.user?.photoURL} />
                      <Stack>
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontFamily: 'Inter Display, sans-serif',
                            textTransform: 'capitalize',
                            fontWeight: 400,
                          }}
                        >
                          {agreement?.user?.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontFamily: 'Inter Display, sans-serif',
                            fontWeight: 400,
                          }}
                        >
                          {agreement?.user?.email}
                        </Typography>
                      </Stack>
                    </Stack>
                    <Stack
                      sx={{
                        flex: 1,
                        justifyContent: 'flex-start',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: 'center',
                      }}
                    >
                      <Tabs
                        value={selectedPlatform}
                        onChange={(_, val) => {
                          setSelectedPlatform(val);
                          setValue(
                            'platformFollowerCount',
                            String(getFollowerCountByPlatform(val) || ''),
                            { shouldValidate: true }
                          );
                        }}
                        variant="fullWidth"
                        TabIndicatorProps={{
                          children: <span />,
                          sx: {
                            height: 1,
                            py: 1,
                            zIndex: -1,
                            padding: '4px',
                            transition: 'all .3s ease-in-out',
                            bgcolor: 'transparent',
                            '&.MuiTabs-indicator > span': {
                              bgcolor: 'rgba(255, 255, 255, 1)',
                              borderColor: 'rgba(255, 255, 255, 1)',
                              width: '100%',
                              height: '100%',
                              display: 'inline-flex',
                              borderRadius: 1,
                              border: '1px solid #E8E8E8',
                            },
                          },
                        }}
                        sx={{
                          borderRadius: 1.5,
                          m: 1,
                          '&.MuiTabs-root': {
                            position: 'relative',
                            zIndex: 1,
                            minHeight: 'auto',
                            flexShrink: 0,
                            bgcolor: 'rgba(231, 231, 231, 1)',
                            flex: 1,
                            width: { xs: 1, sm: 200 },
                          },
                          '& .MuiTabs-scroller': {
                            p: '0px',
                          },
                        }}
                      >
                        {PLATFORM_OPTIONS.map((platform, index) => (
                          <Tab
                            key={index}
                            label={platform.label}
                            value={platform.value}
                            iconPosition="start"
                            icon={<Iconify icon={platform.icon} width={16} />}
                            sx={{
                              '&.Mui-selected': {
                                borderRadius: 2,
                                fontWeight: 600,
                              },
                              '&:not(.Mui-selected)': {
                                color: '#8E8E93',
                              },
                              '&:not(:last-of-type)': {
                                mr: 0,
                              },
                            }}
                          />
                        ))}
                      </Tabs>

                      {campaign?.isCreditTier && displayTierData && (
                        <Stack direction="column" ml={2}>
                          <Box
                            sx={{
                              py: 0.5,
                              flexShrink: 1,
                              borderRadius: 0.8,
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <Iconify
                              icon={
                                selectedPlatform === 'tiktok'
                                  ? 'ic:baseline-tiktok'
                                  : 'mdi:instagram'
                              }
                              width={14}
                              sx={{
                                color: selectedPlatform === 'tiktok' ? '#000000' : '#E4405F',
                                flexShrink: 0,
                              }}
                            />
                            {displayTierData.name}
                          </Box>
                          <Box
                            sx={{
                              px: 1,
                              py: 0.5,
                              border: '1px solid #EBEBEB',
                              borderRadius: 999,
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {displayTierData.creditsPerVideo} credits/video
                          </Box>
                        </Stack>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              </Grid>

              {/* Product Name */}
              {isSeedingAgreement && (
                <Grid item xs={12} sm={6}>
                  <Box>
                    <FieldLabel>Product Name</FieldLabel>
                    <RHFTextField
                      name="product.name"
                      placeholder="Eg. Philip OneBlade"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>
              )}

              {/* Product Value & Payment Amount */}
              {isSeedingAgreement ? (
                <Grid item xs={12} sm={6}>
                  <Box>
                    <FieldLabel>Product Value</FieldLabel>
                    <Controller
                      name="product.value"
                      control={control}
                      render={({ field }) => (
                        <NumericFormat
                          {...field}
                          customInput={RHFTextField}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start" sx={{ mr: 1 }}>
                                <RHFSelect
                                  name="currency"
                                  onChange={(e) =>
                                    setValue('currency', e.target.value, { shouldValidate: true })
                                  }
                                  variant="standard"
                                  InputProps={{ disableUnderline: true }}
                                  sx={{
                                    '& .MuiSelect-select': {
                                      pr: '30px !important',
                                    },
                                    '& .MuiSelect-standard': {
                                      ml: 2,
                                      fontSize: 13,
                                      fontWeight: 600,
                                    },
                                  }}
                                >
                                  {Object.keys(CURRENCY_PREFIXES).map((curr) => (
                                    <MenuItem key={curr} value={curr}>
                                      {curr}
                                    </MenuItem>
                                  ))}
                                </RHFSelect>
                                <Divider
                                  orientation="vertical"
                                  flexItem
                                  sx={{ height: 20, alignSelf: 'center' }}
                                />
                              </InputAdornment>
                            ),
                          }}
                          allowNegative={false}
                          thousandSeparator
                          decimalScale={2}
                          fixedDecimalScale
                          onChange={undefined}
                          onValueChange={(value) => {
                            setValue('product.value', value.floatValue);
                          }}
                          prefix={
                            CURRENCY_PREFIXES[selectedCurrency]?.prefix
                              ? `${CURRENCY_PREFIXES[selectedCurrency].prefix} `
                              : ''
                          }
                          placeholder={`${CURRENCY_PREFIXES[selectedCurrency]?.prefix} 350`}
                          variant="outlined"
                          isAllowed={(val) => {
                            const { value } = val;
                            if (value.length && Number(value[0]) === 0) return false;
                            return true;
                          }}
                          sx={{
                            mt: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1,
                              pl: 0,
                            },
                          }}
                        />
                      )}
                    />
                  </Box>
                </Grid>
              ) : (
                <Grid item xs={12} sm={6}>
                  <Box>
                    <FieldLabel>Payment Amount</FieldLabel>
                    <Controller
                      name="paymentAmount"
                      control={control}
                      render={({ field }) => (
                        <NumericFormat
                          {...field}
                          customInput={RHFTextField}
                          onChange={undefined}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start" sx={{ mr: 1 }}>
                                <RHFSelect
                                  name="currency"
                                  onChange={(e) =>
                                    setValue('currency', e.target.value, { shouldValidate: true })
                                  }
                                  variant="standard"
                                  InputProps={{ disableUnderline: true }}
                                  sx={{
                                    '& .MuiSelect-select': {
                                      pr: '30px !important',
                                    },
                                    '& .MuiSelect-standard': {
                                      fontSize: 13,
                                      fontWeight: 600,
                                    },
                                  }}
                                >
                                  {Object.keys(CURRENCY_PREFIXES).map((curr) => (
                                    <MenuItem key={curr} value={curr}>
                                      {curr}
                                    </MenuItem>
                                  ))}
                                </RHFSelect>
                                <Divider
                                  orientation="vertical"
                                  flexItem
                                  sx={{ height: 20, alignSelf: 'center' }}
                                />
                              </InputAdornment>
                            ),
                          }}
                          allowNegative={false}
                          thousandSeparator
                          decimalScale={2}
                          fixedDecimalScale
                          onValueChange={(value) => {
                            setValue('paymentAmount', value.floatValue);
                          }}
                          prefix={`${CURRENCY_PREFIXES[selectedCurrency]?.prefix} ` ?? ''}
                          placeholder={`${CURRENCY_PREFIXES[selectedCurrency]?.prefix} 350`}
                          variant="outlined"
                          isAllowed={(val) => {
                            const { value } = val;
                            if (value.length && Number(value[0]) === 0) return false;
                            return true;
                          }}
                          sx={{
                            mt: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1,
                            },
                          }}
                        />
                      )}
                    />
                  </Box>
                </Grid>
              )}

              {/* Follower count */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <FieldLabel>Follower Count</FieldLabel>
                  <Controller
                    name="platformFollowerCount"
                    control={control}
                    render={({ field }) => (
                      <NumericFormat
                        {...field}
                        customInput={RHFTextField}
                        allowNegative={false}
                        onValueChange={(value) => {
                          setValue('platformFollowerCount', value.floatValue);
                        }}
                        placeholder="2021"
                        variant="outlined"
                        isAllowed={(val) => {
                          const { value } = val;
                          if (value.length && Number(value[0]) === 0) return false;
                          return true;
                        }}
                        sx={{
                          mt: 1,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                          },
                        }}
                      />
                    )}
                  />
                </Box>

                <Box mt={1}>
                  {mediaKitFollower > 0 && effectiveFollowerCountForTier !== mediaKitFollower && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        color: '#637381',
                        px: 0.25,
                        wordWrap: 'break-word',
                      }}
                    >
                      Their {platformLabel} media kit says{' '}
                      <Box component="span" sx={{ fontWeight: 700 }}>
                        {mediaKitFollower.toLocaleString()}
                      </Box>{' '}
                      followers. This agreement is priced on{' '}
                      <Box component="span" sx={{ fontWeight: 700 }}>
                        {effectiveFollowerCountForTier.toLocaleString()}
                      </Box>{' '}
                      followers.
                    </Typography>
                  )}
                  {!canEditFollowerCount && (
                    <Typography variant="caption" sx={{ color: '#637381', px: 0.25 }}>
                      Using the {platformLabel} follower count already on record for this creator.
                    </Typography>
                  )}
                  {campaign?.isCreditTier && effectiveFollowerCountForTier <= 0 && (
                    <Typography variant="caption" sx={{ color: 'error.main', px: 0.25 }}>
                      Enter a {platformLabel} follower count to price this agreement.
                    </Typography>
                  )}
                  {campaign?.isCreditTier &&
                    effectiveFollowerCountForTier > 0 &&
                    !displayTierData && (
                      <Typography
                        // variant="caption"
                        sx={{
                          color: 'error.main',
                          px: 0.25,
                          wordBreak: 'break-word',
                          fontSize: 12,
                          lineHeight: 1.2,
                        }}
                      >
                        No credit tier matches the selected platform follower count.
                      </Typography>
                    )}
                </Box>
              </Grid>

              {/* Credits amount */}
              <Grid item xs={12} sm={6}>
                {requiresUGCCredits && (
                  <Box>
                    <FieldLabel>
                      {campaign?.isCreditTier ? 'Video Amount' : 'UGC Credits'}
                    </FieldLabel>

                    <Controller
                      name="ugcCredits"
                      control={control}
                      render={({ field }) => (
                        <NumericFormat
                          {...field}
                          customInput={RHFTextField}
                          allowNegative={false}
                          onValueChange={(value) => {
                            setValue('ugcCredits', value.floatValue);
                          }}
                          placeholder="2"
                          variant="outlined"
                          isAllowed={(val) => {
                            const { floatValue, value } = val;
                            if (floatValue === undefined) return true;

                            if (maxCreditsAllowed === null) return true;

                            if (value.length && Number(value[0]) === 0) return false;

                            return floatValue <= maxCreditsAllowed;
                          }}
                          sx={{
                            mt: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1,
                            },
                          }}
                        />
                      )}
                    />

                    <Box sx={{ my: 1 }} />
                    {campaign?.campaignCredits !== null && (
                      <CreditsStatusBanner
                        creatorCost={creatorCost}
                        realTimeCreditsLeft={realTimeCreditsLeft}
                        isCreditTier={campaign?.isCreditTier}
                      />
                    )}
                  </Box>
                )}
              </Grid>

              {/* Seeding toggle */}
              <Grid item xs={12}>
                <Stack
                  sx={{
                    border: 1,
                    borderRadius: 1.2,
                    borderColor: (theme) => theme.palette.divider,
                    pl: 2,
                    height: 52,
                  }}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <FieldLabel>Enable Product Seeding?</FieldLabel>
                  <RHFSwitch
                    name="isSeedingAgreement"
                    labelPlacement="start"
                    edge="end"
                    sx={{
                      width: '100%',
                      justifyContent: 'space-between',
                      ml: 0,
                      '& .Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#1340FF !important',
                      },
                    }}
                  />
                </Stack>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ mb: 0 }} />

          <Box sx={{ p: 4, pb: 2 }} textAlign="end">
            <LoadingButton
              type="submit"
              loading={loading.value}
              disabled={loading.value || (!isSeedingAgreement && isFormInvalid) || !isValid}
              loadingIndicator={<SyncLoader color="white" size={5} />}
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
              Send to 1 creator
            </LoadingButton>
          </Box>
        </Box>
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
