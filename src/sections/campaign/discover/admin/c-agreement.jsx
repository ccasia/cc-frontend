import dayjs from 'dayjs';
import * as yup from 'yup';
import PropTypes from 'prop-types';
import { pdf } from '@react-pdf/renderer';
import { NumericFormat } from 'react-number-format';
import { Controller, useFormContext } from 'react-hook-form';
import React, { useMemo, useEffect, useCallback } from 'react';

import InputAdornment from '@mui/material/InputAdornment';
import {
  Box,
  Tab,
  Grid,
  Tabs,
  Stack,
  Avatar,
  Button,
  Divider,
  MenuItem,
  TextField,
  Typography,
  FormHelperText,
} from '@mui/material';

import useGetCreditTiers from 'src/hooks/use-get-credit-tiers';
import { useGetAgreements } from 'src/hooks/agreement/use-get-agreements';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import AgreementTemplate from 'src/template/agreement';

import Iconify from 'src/components/iconify';
import FieldLabel from 'src/components/field-label';
import { RHFSelect, RHFSwitch, RHFTextField } from 'src/components/hook-form';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

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
  { value: 'instagram', label: 'Insta', icon: 'mdi:instagram' },
  { value: 'tiktok', label: 'TikTok', icon: 'ic:baseline-tiktok' },
];

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

// -----------------------------------------------------------------------------
// Pure helpers (no hooks). The parent form uses these too.
// -----------------------------------------------------------------------------

const toFollowerCount = (value) => {
  const parsed = parseInt(String(value ?? '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const getSnapshotFollowerCount = (record, platform) =>
  (record?.selectedPlatform || 'instagram') === platform
    ? toFollowerCount(record?.followerCount)
    : 0;

const getPitchRecord = (campaign, agreement) =>
  campaign?.pitch?.find((p) => p.userId === agreement?.user?.id);

export const getAgreedPlatform = (campaign, agreement) =>
  agreement?.shortlistedCreator?.selectedPlatform ||
  getPitchRecord(campaign, agreement)?.selectedPlatform ||
  'instagram';

export const getFollowerCountByPlatform = (campaign, agreement, platform) => {
  const agreedFollowerCount =
    getSnapshotFollowerCount(agreement?.shortlistedCreator, platform) ||
    getSnapshotFollowerCount(getPitchRecord(campaign, agreement), platform);

  if (agreedFollowerCount > 0) return agreedFollowerCount;

  const creatorData = agreement?.user?.creator;
  if (!creatorData) return 0;

  if (platform === 'tiktok') {
    return creatorData.tiktokUser?.follower_count || creatorData.manualTiktokFollowerCount || 0;
  }

  return (
    creatorData.instagramUser?.followers_count || creatorData.manualInstagramFollowerCount || 0
  );
};

// Same minFollowers/maxFollowers tier resolution as the backend creditTierService.ts
export const resolveTierForFollowerCount = (creditTierList, followerCount) => {
  if (!Array.isArray(creditTierList) || !followerCount || followerCount <= 0) return null;

  const matched = creditTierList.filter(
    (tier) =>
      tier?.isActive &&
      tier?.minFollowers <= followerCount &&
      (tier?.maxFollowers === null || tier?.maxFollowers >= followerCount)
  );
  if (!matched.length) return null;
  return matched.sort((a, b) => (b?.minFollowers || 0) - (a?.minFollowers || 0))[0];
};

const getMediaKitFollowerCount = (agreement, platform) => {
  const creatorData = agreement?.user?.creator;

  if (platform === 'tiktok') return creatorData?.tiktokUser?.follower_count || 0;

  return creatorData?.instagramUser?.followers_count || 0;
};

const getAgreementTemplateInfo = (campaign) => {
  if (campaign?.agreementTemplate) return campaign.agreementTemplate;

  return campaign?.campaignAdmin?.reduce(
    (foundTemplate, item) => foundTemplate || item?.admin?.user?.agreementTemplate[0] || null,
    null
  );
};

// -----------------------------------------------------------------------------
// Form helpers: use these in the PARENT
// -----------------------------------------------------------------------------

/**
 * Turns one saved agreement into one row of the form.
 * Use it in the parent: replace(savedAgreements.map((a) => buildAgreementFormValues(campaign, a)))
 */
export const buildAgreementFormValues = (campaign, agreement) => {
  const platform = getAgreedPlatform(campaign, agreement);
  const product = agreement?.productSeeding?.[0];
  const isGuest = agreement?.user?.creator?.isGuest === true;

  return {
    // ids (not shown in the UI, only used by the parent)
    agreementId: agreement?.id,
    userId: agreement?.user?.id ?? agreement?.userId,
    isGuest,

    // real form fields
    selectedPlatform: platform,
    paymentAmount: agreement?.amount ?? '',
    currency: CURRENCY_PREFIXES[agreement?.currency]?.label ?? 'MYR',
    ugcCredits: agreement?.videoCount ?? (isGuest ? null : ''),
    platformFollowerCount: String(getFollowerCountByPlatform(campaign, agreement, platform) || ''),
    isSeedingAgreement: Boolean(agreement?.isSeeding),
    product: { name: product?.name ?? '', value: product?.value ?? '' },

    // filled in by each row while the user types
    creditCost: 0,
    hasBlockingIssue: false,
  };
};

const rowSchema = yup.object().shape({
  isGuest: yup.boolean(),
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
  ugcCredits: yup.number().when('isGuest', {
    is: true,
    then: (schem) =>
      schem.transform((value, original) => (original === '' ? null : value)).nullable(),
    otherwise: (schem) =>
      schem
        .typeError('UGC credits are required.')
        .integer('UGC credits must be a whole number.')
        .min(1, 'At least 1 credit is required.')
        .required('UGC credits are required.'),
  }),
  platformFollowerCount: yup.string().nullable(),
});

// Use this in the parent: resolver: yupResolver(agreementsSchema)
export const agreementsSchema = yup.object().shape({
  agreements: yup.array().of(rowSchema),
});

/**
 * Creates the PDF and sends ONE agreement. Call it from the parent submit handler.
 * It throws on error, so the parent can catch it and show a snackbar.
 *   data = one row from the form (values.agreements[i])
 */
export const submitAgreement = async ({ agreement, campaign, data, isSuperAdmin }) => {
  const isGuest = data.isGuest === true;
  const creditsToAssign = isGuest ? null : Number(data.ugcCredits);
  const { selectedPlatform } = data;

  if (campaign?.campaignCredits != null && !isGuest) {
    if (!Number.isFinite(creditsToAssign) || creditsToAssign <= 0) {
      throw new Error('UGC credits must be a positive number.');
    }
  }

  // Same rule as the UI: only send a follower count if the admin is allowed to edit it
  const recordFollower = getFollowerCountByPlatform(campaign, agreement, selectedPlatform);
  const canEditFollowerCount = isSuperAdmin || recordFollower <= 0;
  const parsedPlatformFollower = canEditFollowerCount
    ? Number(data.platformFollowerCount || 0) || recordFollower || undefined
    : undefined;

  const templateInfo = getAgreementTemplateInfo(campaign);
  const prefix = CURRENCY_PREFIXES[data.currency]?.prefix;
  const creatorName =
    agreement?.user?.paymentForm?.bankAccountName || agreement?.user?.name || 'N/A';

  const blob = await pdf(
    <AgreementTemplate
      DATE={dayjs().format('LL')}
      IC_NUMBER={agreement?.user?.paymentForm?.icNumber}
      FREELANCER_FULL_NAME={creatorName}
      ADDRESS={agreement?.user?.creator?.address}
      ccEmail="hello@cultcreative.com"
      ccPhoneNumber="+60162678757"
      effectiveDate={dayjs().add(4, 'day').format('LL')}
      creatorPayment={`${prefix}${parseFloat(Number(data.paymentAmount)).toFixed(2)}`}
      CREATOR_NAME={creatorName}
      CREATOR_ACCOUNT_NUMBER={agreement?.user?.paymentForm?.bankAccountNumber}
      CREATOR_BANK_ACCOUNT_NAME={creatorName}
      CREATOR_BANK_NAME={agreement?.user?.paymentForm?.bankName}
      AGREEMENT_ENDDATE={dayjs().add(1, 'month').format('LL')}
      NOW_DATE={dayjs().format('LL')}
      VERSION_NUMBER={`V${dayjs().unix()}`}
      ADMIN_IC_NUMBER={templateInfo?.adminICNumber ?? 'Default'}
      ADMIN_NAME={templateInfo?.adminName ?? 'Default'}
      SIGNATURE={templateInfo?.signURL ?? 'Default'}
      isForSurfShark={campaign?.isForSurfShark}
      isSeedingAgreement={data.isSeedingAgreement}
      productValue={`${prefix}${parseFloat(data.product?.value).toFixed(2)}`}
    />
  ).toBlob();

  const followerPart =
    !Number.isNaN(parsedPlatformFollower) && parsedPlatformFollower
      ? { followerCount: parsedPlatformFollower }
      : {};

  const requestData = {
    paymentAmount: data.paymentAmount,
    currency: data.currency,
    user: agreement?.user,
    campaignId: agreement?.campaignId,
    id: agreement?.id,
    isNew: agreement?.isNew || false,
    credits: creditsToAssign,
    selectedPlatform,
    ...followerPart,
    isSeedingAgreement: data.isSeedingAgreement,
    product: data.product,
  };

  const formData = new FormData();
  formData.append('agreementForm', blob);
  formData.append('data', JSON.stringify(requestData));

  const res = await axiosInstance.patch(endpoints.campaign.updateAmountAgreement, formData, {
    headers: { Accept: 'multipart/form-data' },
  });

  await axiosInstance.patch(endpoints.campaign.sendAgreement, {
    user: agreement?.user,
    campaignId: agreement?.campaignId,
    id: res?.data?.agreement?.id || agreement?.id,
    isNew: agreement?.isNew || false,
    credits: creditsToAssign,
    selectedPlatform,
    ...followerPart,
  });

  return res?.data;
};

// -----------------------------------------------------------------------------
// Small UI piece
// -----------------------------------------------------------------------------

function CreditsStatusBanner({ creatorCost, realTimeCreditsLeft, isCreditTier, sx }) {
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
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        bgcolor: styles.bgcolor,
        borderLeft: 1,
        borderRight: 1,
        borderBottom: 1,
        borderColor: (theme) => theme.palette.divider,
        ...sx,
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
  sx: PropTypes.object,
};

// -----------------------------------------------------------------------------
// Row component
// -----------------------------------------------------------------------------

/**
 * availableCredits: pass it when the parent already knows the credits left for this whole form
 * (e.g. additional rounds, where these creators already used credits in earlier rounds).
 * Leave it undefined to work it out from the saved agreements (first agreements).
 */
const CAgreement = ({ agreement, campaign, index, exclude, availableCredits, errorMessage }) => {
  const { user } = useAuthContext();
  const { data: savedAgreements } = useGetAgreements(campaign?.id); // saved agreements from the server
  const { data: creditTierList } = useGetCreditTiers();

  const { control, setValue, watch, trigger } = useFormContext();

  // "product.name" -> "agreements.2.product.name"
  const fieldName = useCallback((key) => `agreements.${index}.${key}`, [index]);

  const isSuperAdmin = user?.role === 'superadmin';
  const isGuestCreator = agreement?.user?.creator?.isGuest === true;
  const requiresUGCCredits = !isGuestCreator;

  const shortlistedRecord = agreement?.shortlistedCreator;
  const agreedPlatform = getAgreedPlatform(campaign, agreement);

  // ---- Values from the form (one watch call for all rows) ----
  const rows = watch('agreements') || [];
  const row = rows[index] || {};

  const {
    isSeedingAgreement,
    currency: selectedCurrency,
    ugcCredits: ugcCreditsValue,
    platformFollowerCount: platformFollowerValue,
  } = row;

  const selectedPlatform = row.selectedPlatform || agreedPlatform;

  // ---- Tier data ----
  const getTierData = () => {
    if (shortlistedRecord?.creditTier) {
      return {
        name: shortlistedRecord.creditTier?.name || 'Unknown Tier',
        creditsPerVideo:
          shortlistedRecord.creditPerVideo ?? shortlistedRecord.creditTier?.creditsPerVideo ?? 1,
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

  const hasPlatformChanged = selectedPlatform !== agreedPlatform;

  const selectedPlatformFollower = getFollowerCountByPlatform(
    campaign,
    agreement,
    selectedPlatform
  );
  const mediaKitFollower = getMediaKitFollowerCount(agreement, selectedPlatform);

  const canEditFollowerCount = isSuperAdmin || selectedPlatformFollower <= 0;

  const platformLabel = selectedPlatform === 'tiktok' ? 'TikTok' : 'Instagram';

  const effectiveFollowerCountForTier = canEditFollowerCount
    ? Number(platformFollowerValue || 0) || Number(selectedPlatformFollower || 0)
    : Number(selectedPlatformFollower || 0);

  const liveTierData = useMemo(() => {
    if (!campaign?.isCreditTier) return null;
    return resolveTierForFollowerCount(creditTierList, effectiveFollowerCountForTier);
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

  // ---- Credits ----
  // A short string of all user ids in this form. It is a string so useMemo can compare it easily.
  const userIdsInForm = rows.map((r) => r?.userId).join(',');

  // Credits already used by creators who are NOT part of this bulk form
  const usedCreditsByOthers = useMemo(() => {
    if (campaign?.campaignCredits == null) return null;

    if (!savedAgreements || !campaign?.shortlisted) return 0;

    const idsInForm = new Set(userIdsInForm.split(','));

    const sentAgreementUserIds = new Set(
      savedAgreements
        .filter((a) => a.isSent && a.user?.creator?.isGuest !== true)
        .map((a) => a.userId)
    );

    return campaign.shortlisted.reduce((acc, creator) => {
      // Creators in this form are counted by their own row (see otherRowsCost)
      if (idsInForm.has(String(creator.userId))) return acc;

      if (
        sentAgreementUserIds.has(creator.userId) &&
        creator.user?.creator?.isGuest !== true &&
        creator.ugcVideos
      ) {
        const videos = creator.ugcVideos || 0;
        const creditsPerVideo = campaign?.isCreditTier ? creator.creditPerVideo || 1 : 1;
        return acc + videos * creditsPerVideo;
      }
      return acc;
    }, 0);
  }, [campaign, savedAgreements, userIdsInForm]);

  // Credits the OTHER rows in this form want to use (each row writes its own creditCost)
  const otherRowsCost = rows.reduce(
    (sum, r, i) => (i === index ? sum : sum + (Number(r?.ugcCredits) || 0)),
    0
  );

  // Max credits this row can use = total - used by others - wanted by other rows
  const maxCreditsAllowed = useMemo(() => {
    if (campaign?.campaignCredits == null) return null;

    if (availableCredits !== undefined) {
      if (availableCredits === null) return null;
      return Math.max(0, Number(availableCredits) - otherRowsCost);
    }

    if (usedCreditsByOthers === null) return null;

    return Math.max(0, Number(campaign.campaignCredits) - usedCreditsByOthers - otherRowsCost);
  }, [campaign, usedCreditsByOthers, otherRowsCost, availableCredits]);

  const creatorCost = useMemo(() => {
    if (!requiresUGCCredits) return 0;

    const numOfCredits = Number(ugcCreditsValue) || 0;

    return campaign?.isCreditTier
      ? (displayTierData?.creditsPerVideo || 1) * numOfCredits
      : numOfCredits;
  }, [campaign?.isCreditTier, ugcCreditsValue, displayTierData, requiresUGCCredits]);

  const realTimeCreditsLeft = useMemo(() => {
    if (campaign?.campaignCredits == null) return null;
    if (maxCreditsAllowed === null) return null;
    return maxCreditsAllowed - creatorCost;
  }, [campaign?.campaignCredits, maxCreditsAllowed, creatorCost]);

  useEffect(() => {
    trigger([fieldName('paymentAmount'), fieldName('product')]);
  }, [isSeedingAgreement, trigger, fieldName]);

  return (
    <Box position="relative">
      <Box>
        <Grid container spacing={2}>
          {/* User Info & Platform Selection */}
          <Grid item xs={12} alignSelf="center">
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                flexDirection={{ xs: 'column', sm: 'row' }}
                spacing={1}
              >
                <Stack direction="row" alignItems="center" gap={1.5} flex={1}>
                  <Avatar src={agreement?.user?.photoURL} />
                  <Stack width={150}>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontFamily: 'Inter Tight, sans-serif',
                        textTransform: 'capitalize',
                        fontWeight: 400,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {agreement?.user?.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontFamily: 'Inter Tight, sans-serif',
                        fontWeight: 400,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
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
                      setValue(fieldName('selectedPlatform'), val);
                      setValue(
                        fieldName('platformFollowerCount'),
                        String(getFollowerCountByPlatform(campaign, agreement, val) || ''),
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
                    {PLATFORM_OPTIONS.map((platform) => (
                      <Tab
                        key={platform.value}
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
                            selectedPlatform === 'tiktok' ? 'ic:baseline-tiktok' : 'mdi:instagram'
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
                {rows.length > 1 && (
                  <Button
                    size="small"
                    sx={{ alignSelf: 'center' }}
                    startIcon={<Iconify icon="ci:close-md" />}
                    color="error"
                    onClick={exclude}
                  >
                    Exclude
                  </Button>
                )}
              </Stack>
            </Box>
          </Grid>

          {/* Product Name */}
          {isSeedingAgreement && (
            <Grid item xs={12} sm={6}>
              <Stack>
                <FieldLabel>Product Name</FieldLabel>
                <RHFTextField
                  name={fieldName('product.name')}

                  placeholder="Eg. Philip OneBlade"
                  sx={{ mt: 1 }}
                  InputProps={{
                    sx: {
                      bgcolor: '#FFF',
                    },
                  }}
                />
              </Stack>
            </Grid>
          )}

          {/* Product Value & Payment Amount */}
          {isSeedingAgreement ? (
            <Grid item xs={12} sm={6}>
              <Stack>
                <FieldLabel>Product Value</FieldLabel>
                <Controller
                  name={fieldName('product.value')}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <NumericFormat
                      {...field}
                      customInput={TextField}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ mr: 1 }}>
                            <RHFSelect
                              name={fieldName('currency')}
                              onChange={(e) =>
                                setValue(fieldName('currency'), e.target.value, {
                                  shouldValidate: true,
                                })
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
                        setValue(fieldName('product.value'), value.floatValue, {
                          shouldValidate: true,
                        });
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
                      error={!!error}
                      helperText={!!error && error?.message}
                      sx={{
                        mt: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          pl: 0,
                          bgcolor: '#FFF',
                        },
                      }}
                    />
                  )}
                />
              </Stack>
            </Grid>
          ) : (
            <Grid item xs={12} sm={6}>
              <Stack>
                <FieldLabel>Payment Amount</FieldLabel>
                <Controller
                  name={fieldName('paymentAmount')}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <NumericFormat
                      {...field}
                      customInput={TextField}
                      onChange={undefined}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ mr: 1 }}>
                            <RHFSelect
                              name={fieldName('currency')}
                              onChange={(e) =>
                                setValue(fieldName('currency'), e.target.value, {
                                  shouldValidate: true,
                                })
                              }
                              variant="standard"
                              InputProps={{ disableUnderline: true }}
                              PaperPropsSx={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                '&::-webkit-scrollbar': {
                                  display: 'none',
                                },
                              }}
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
                                <MenuItem
                                  key={curr}
                                  value={curr}
                                  sx={{
                                    width: 80,
                                    justifyContent: 'center',
                                  }}
                                >
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
                        setValue(fieldName('paymentAmount'), value.floatValue, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                      prefix={
                        CURRENCY_PREFIXES[selectedCurrency]?.prefix
                          ? `${CURRENCY_PREFIXES[selectedCurrency].prefix} `
                          : ''
                      }
                      placeholder={`${CURRENCY_PREFIXES[selectedCurrency]?.prefix} 350`}
                      variant="outlined"
                      error={!!error}
                      helperText={error && error?.message}
                      isAllowed={(val) => {
                        const { value } = val;
                        if (value.length && Number(value[0]) === 0) return false;
                        return true;
                      }}
                      sx={{
                        mt: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          bgcolor: '#FFF',
                        },
                      }}
                    />
                  )}
                />
              </Stack>
            </Grid>
          )}

          {/* Follower count */}
          <Grid item xs={12} sm={6}>
            <Stack>
              <FieldLabel>Follower Count</FieldLabel>
              <Controller
                name={fieldName('platformFollowerCount')}
                control={control}
                render={({ field }) => (
                  <NumericFormat
                    {...field}
                    customInput={TextField}
                    allowNegative={false}
                    onValueChange={(value) => {
                      setValue(fieldName('platformFollowerCount'), value.floatValue, {
                        shouldValidate: true,
                      });
                    }}
                    placeholder="2021"
                    variant="outlined"
                    isAllowed={(val) => {
                      const { value } = val;
                      if (value.length && Number(value[0]) === 0) return false;
                      return true;
                    }}
                    fullWidth
                    sx={{
                      mt: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        bgcolor: '#FFF',
                      },
                    }}
                  />
                )}
              />
            </Stack>

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
              {campaign?.isCreditTier && effectiveFollowerCountForTier > 0 && !displayTierData && (
                <Typography
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
              <Stack>
                <FieldLabel>{campaign?.isCreditTier ? 'Video Amount' : 'UGC Credits'}</FieldLabel>

                <Controller
                  name={fieldName('ugcCredits')}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <NumericFormat
                        {...field}
                        customInput={TextField}
                        allowNegative={false}
                        onValueChange={(value) => {
                          setValue(fieldName('ugcCredits'), value.floatValue, {
                            shouldValidate: true,
                          });
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
                        fullWidth
                        error={!!error}
                        sx={{
                          mt: 1,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 0,
                            bgcolor: '#FFF',
                            borderTopLeftRadius: 10,
                            borderTopRightRadius: 10,
                          },
                        }}
                      />

                      {campaign?.campaignCredits !== null && (
                        <CreditsStatusBanner
                          creatorCost={creatorCost}
                          realTimeCreditsLeft={realTimeCreditsLeft}
                          isCreditTier={campaign?.isCreditTier}
                        />
                      )}

                      {error && (
                        <FormHelperText error sx={{ mx: 1.75, mt: 0.5 }}>
                          {error.message}
                        </FormHelperText>
                      )}
                    </>
                  )}
                />
              </Stack>
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
                bgcolor: '#FFF',
              }}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <FieldLabel>Enable Product Seeding?</FieldLabel>
              <RHFSwitch
                name={fieldName('isSeedingAgreement')}
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

          {errorMessage && (
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: 'error.main' }}>
                {errorMessage}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default CAgreement;

CAgreement.propTypes = {
  agreement: PropTypes.object,
  campaign: PropTypes.object,
  index: PropTypes.number.isRequired,
  exclude: PropTypes.func,
  availableCredits: PropTypes.number,
  errorMessage: PropTypes.string,
};
