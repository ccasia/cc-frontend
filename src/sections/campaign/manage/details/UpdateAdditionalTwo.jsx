import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useEffect, useCallback } from 'react';

import { Box, Grid, Stack } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

import ChipSelect from 'src/sections/campaign/create/components/chip-select';
import {
  multiLineSx,
  singleLineSx,
  helperTextSx,
} from 'src/sections/campaign/create/components/field-styles';

import FormField from './components/form-field';

const CTA = 'Call to Action';

const AD_OPTIONS = ['yes', 'no'];
const AD_TITLES = { yes: 'Yes', no: 'No' };
const adTitle = (option) => AD_TITLES[option] ?? option;

// The textarea fills what is left of the column, so both columns end level
const fillSx = {
  ...multiLineSx,
  flex: 1,
  '& .MuiOutlinedInput-root': {
    ...multiLineSx['& .MuiOutlinedInput-root'],
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  '& .MuiInputBase-inputMultiline': {
    ...multiLineSx['& .MuiInputBase-inputMultiline'],
    flex: 1,
    height: 'auto !important',
    minHeight: 66,
    overflow: 'auto !important',
  },
};

// Validation schema - all fields optional
const UpdateAdditionalTwoSchema = Yup.object().shape({
  hashtagsToUse: Yup.string().nullable(),
  mentionsTagsRequired: Yup.string().nullable(),
  creatorCompensation: Yup.string().nullable(),
  ctaDesiredAction: Yup.string().nullable(),
  ctaLinkUrl: Yup.string().nullable(),
  ctaPromoCode: Yup.string().nullable(),
  ctaLinkInBioRequirements: Yup.string().nullable(),
  specialNotesInstructions: Yup.string().nullable(),
  needAds: Yup.string().nullable(),
});

const UpdateAdditionalTwo = ({ campaign, campaignMutate, formId, onFormStateChange }) => {
  const additionalDetails = campaign?.campaignAdditionalDetails;

  // Get existing values from campaign
  const defaultValues = useMemo(
    () => ({
      hashtagsToUse: additionalDetails?.hashtagsToUse || '',
      mentionsTagsRequired: additionalDetails?.mentionsTagsRequired || '',
      creatorCompensation: additionalDetails?.creatorCompensation || '',
      ctaDesiredAction: additionalDetails?.ctaDesiredAction || '',
      ctaLinkUrl: additionalDetails?.ctaLinkUrl || '',
      ctaPromoCode: additionalDetails?.ctaPromoCode || '',
      ctaLinkInBioRequirements: additionalDetails?.ctaLinkInBioRequirements || '',
      specialNotesInstructions: additionalDetails?.specialNotesInstructions || '',
      needAds: additionalDetails?.needAds || '',
    }),
    [additionalDetails]
  );

  const methods = useForm({
    resolver: yupResolver(UpdateAdditionalTwoSchema),
    defaultValues,
    mode: 'onChange',
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = methods;

  useEffect(() => {
    onFormStateChange?.({ isDirty, isSubmitting });
  }, [isDirty, isSubmitting, onFormStateChange]);

  // Reset form when campaign data changes
  useEffect(() => {
    if (campaign) {
      reset(defaultValues);
    }
  }, [campaign, defaultValues, reset]);

  const onSubmit = useCallback(
    async (data) => {
      try {
        await axiosInstance.patch(endpoints.campaign.editCampaignAdditionalDetails, {
          campaignId: campaign?.id,
          // Additional Details 2 fields
          hashtagsToUse: data.hashtagsToUse || '',
          mentionsTagsRequired: data.mentionsTagsRequired || '',
          creatorCompensation: data.creatorCompensation || '',
          ctaDesiredAction: data.ctaDesiredAction || '',
          ctaLinkUrl: data.ctaLinkUrl || '',
          ctaPromoCode: data.ctaPromoCode || '',
          ctaLinkInBioRequirements: data.ctaLinkInBioRequirements || '',
          specialNotesInstructions: data.specialNotesInstructions || '',
          needAds: data.needAds || '',
        });

        enqueueSnackbar('Additional Details 2 updated successfully!', { variant: 'success' });
        if (campaignMutate) campaignMutate();
      } catch (error) {
        enqueueSnackbar(
          error?.response?.data?.message || error?.message || 'Failed to update additional details',
          { variant: 'error' }
        );
      }
    },
    [campaign?.id, campaignMutate]
  );

  return (
    <FormProvider id={formId} methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ maxWidth: '816px', ...helperTextSx }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Stack spacing={2} sx={{ flex: 1 }}>
              <FormField label="Hashtags to Use">
                <RHFTextField
                  name="hashtagsToUse"
                  placeholder="#brandname #campaign"
                  size="small"
                  inputProps={{ autoCapitalize: 'none', spellCheck: false }}
                  sx={singleLineSx}
                />
              </FormField>

              <FormField label="Mentions/Tags Required">
                <RHFTextField
                  name="mentionsTagsRequired"
                  placeholder="Accounts creators must tag"
                  helperText="E.g. @brandname"
                  size="small"
                  inputProps={{ autoCapitalize: 'none', spellCheck: false }}
                  sx={singleLineSx}
                />
              </FormField>

              <FormField label="Creator Compensation" asideInline aside="Value to Creator">
                <RHFTextField
                  name="creatorCompensation"
                  placeholder="What creators get, e.g. free product or a fee"
                  size="small"
                  multiline
                  sx={multiLineSx}
                />
              </FormField>

              <FormField label="Special Notes/Instructions" sx={{ flex: 1 }}>
                <RHFTextField
                  name="specialNotesInstructions"
                  placeholder="Anything else creators should know"
                  size="small"
                  multiline
                  minRows={3}
                  sx={fillSx}
                />
              </FormField>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Stack spacing={2}>
              <FormField prefix={CTA} label="Desired Action">
                <RHFTextField
                  name="ctaDesiredAction"
                  placeholder="What viewers should do"
                  helperText='E.g. "Visit website", "Use promo code", "Sign up"'
                  size="small"
                  multiline
                  sx={multiLineSx}
                />
              </FormField>

              <FormField prefix={CTA} label="Link/URL">
                <RHFTextField
                  name="ctaLinkUrl"
                  placeholder="https://"
                  type="url"
                  size="small"
                  inputProps={{ inputMode: 'url', autoCapitalize: 'none', spellCheck: false }}
                  sx={singleLineSx}
                />
              </FormField>

              <FormField prefix={CTA} label="Promo Code">
                <RHFTextField
                  name="ctaPromoCode"
                  placeholder="Promo code"
                  size="small"
                  inputProps={{ autoCapitalize: 'characters', spellCheck: false }}
                  sx={singleLineSx}
                />
              </FormField>

              <FormField
                prefix={CTA}
                label="Link in Bio Requirements"
                asideInline aside="Additional Charges Apply"
              >
                <RHFTextField
                  name="ctaLinkInBioRequirements"
                  placeholder="What goes in the bio link, and for how long"
                  size="small"
                  multiline
                  sx={multiLineSx}
                />
              </FormField>

              <FormField label="Do you need ads?">
                <Box>
                  <ChipSelect
                    name="needAds"
                    options={AD_OPTIONS}
                    getTitle={adTitle}
                    placeholder="Select an option"
                    single
                    clearable
                  />
                  <Box
                    component="p"
                    sx={{ m: 0, mt: 0.75, fontSize: 12, lineHeight: '16px', color: '#8E8E93' }}
                  >
                    Ads are added charges of RM300 per video for 1 month for MY and ID Market, $300
                    per video for SG
                  </Box>
                </Box>
              </FormField>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </FormProvider>
  );
};

UpdateAdditionalTwo.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
  formId: PropTypes.string,
  onFormStateChange: PropTypes.func,
};

export default UpdateAdditionalTwo;
