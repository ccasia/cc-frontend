import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import { Box, Grid, Stack, MenuItem, FormLabel, Typography } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelectV2, RHFTextField } from 'src/components/hook-form';

// Form field component with consistent styling
const FormField = ({ label, children, required = false, helperText }) => (
  <Stack spacing={0.5} mb={2}>
    <FormLabel
      required={required}
      sx={{
        fontWeight: 700,
        color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
        fontSize: '0.875rem',
        mb: 0.5,
        '& .MuiFormLabel-asterisk': {
          display: required ? 'inline-block' : 'none',
          color: '#FF3500',
        },
      }}
    >
      {label}
    </FormLabel>
    {helperText && (
      <Typography variant="caption" color="text.secondary" sx={{ mt: -0.5, mb: 0.5 }}>
        {helperText}
      </Typography>
    )}
    {children}
  </Stack>
);

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
  helperText: PropTypes.string,
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

const UpdateAdditionalTwo = ({ campaign, campaignMutate }) => {
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
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ maxWidth: '850px' }}>
        <Grid container spacing={2} mb={4}>
          {/* Column One */}
          <Grid item xs={12} sm={6}>
            {/* Hashtags to Use */}
            <FormField label="Hashtags to Use">
              <RHFTextField name="hashtagsToUse" placeholder="Hashtags to Use" />
            </FormField>

            {/* Mentions/Tags Required */}
            <FormField label="Mentions/Tags Required">
              <Typography variant="caption" color="#8E8E93" sx={{ mt: -0.5, mb: 0.5 }}>
                [Eg:- @brandname]
              </Typography>
              <RHFTextField name="mentionsTagsRequired" placeholder="Mentions/Tags" />
            </FormField>

            {/* Creator Compensation - Value to Creator */}
            <FormField label="Creator Compensation - Value to Creator">
              <RHFTextField name="creatorCompensation" placeholder="Creator Compensation" />
            </FormField>

            {/* Call to Action - Desired Action */}
            <FormField label="Call to Action - Desired Action">
              <Typography variant="caption" color="#8E8E93" sx={{ mt: -0.5, mb: 0.5 }}>
                [E.g., &quot;Visit website,&quot; &quot;Use promo code,&quot; &quot;Sign up&quot;]
              </Typography>
              <RHFTextField name="ctaDesiredAction" placeholder="Desired Action" />
            </FormField>

            {/* Call to Action - Link/URL */}
            <FormField label="Call to Action - Link/URL">
              <RHFTextField name="ctaLinkUrl" placeholder="Link/URL" type="url" />
            </FormField>
          </Grid>

          {/* Column Two */}
          <Grid item xs={12} sm={6}>
            {/* Call to Action - Promo Code */}
            <FormField label="Call to Action - Promo Code">
              <RHFTextField name="ctaPromoCode" placeholder="Promo Code" />
            </FormField>

            {/* Call to Action - Link in Bio Requirements */}
            <FormField label="Call to Action - Link in Bio Requirements [Additional Charges Apply]">
              <RHFTextField
                name="ctaLinkInBioRequirements"
                placeholder="Link in Bio Requirements"
              />
            </FormField>

            {/* Special Notes/Instructions */}
            <FormField label="Special Notes/Instructions">
              <RHFTextField
                name="specialNotesInstructions"
                placeholder="Special Notes/Instructions"
              />
            </FormField>

            {/* Do you need ads? */}
            <FormField label="Do you need ads?">
              <Typography variant="caption" color="#8E8E93" sx={{ mt: -0.5, mb: 0.5 }}>
                Ads are added charges of RM300 per video for 1 month for MY and ID Market, $300 per
                video for SG
              </Typography>
              <RHFSelectV2 name="needAds" placeholder="Select an option">
                <MenuItem value="">Select an option</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </RHFSelectV2>
            </FormField>
          </Grid>
        </Grid>

        {/* Submit Button */}
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={!isDirty}
            size="large"
            sx={{
              bgcolor: '#1340ff',
              boxShadow: '0px -3px 0px 0px rgba(0,0,0,0.45) inset',
              '&:hover': { bgcolor: '#1340ff' },
              '&:disabled': {
                bgcolor: 'rgba(19, 64, 255, 0.3)',
                color: '#fff',
                boxShadow: '0px -3px 0px 0px inset rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            Save Additional Details 2
          </LoadingButton>
        </Stack>
      </Box>
    </FormProvider>
  );
};

UpdateAdditionalTwo.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
};

export default UpdateAdditionalTwo;
