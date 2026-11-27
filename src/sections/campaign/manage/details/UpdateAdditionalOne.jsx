import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useEffect, useCallback } from 'react';

import { Box, Grid, Stack } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFUploadCover } from 'src/components/hook-form/rhf-upload-cover';

import ChipSelect from 'src/sections/campaign/create/components/chip-select';
import FileDropList from 'src/sections/campaign/create/components/file-drop-list';
import { multiLineSx, helperTextSx } from 'src/sections/campaign/create/components/field-styles';

import FormField from './components/form-field';

const PLATFORMS = ['Instagram', 'TikTok'];
const PLATFORM_ICONS = { Instagram: 'mdi:instagram', TikTok: 'ic:baseline-tiktok' };
const renderPlatformIcon = (platform) => (
  <Iconify icon={PLATFORM_ICONS[platform]} width={16} sx={{ flexShrink: 0 }} />
);

const CONTENT_FORMATS = ['Reels', 'Carousel'];

const BRAND_FILE_ACCEPT = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/png': ['.png'],
};

const productImageProps = {
  maxSize: 10485760,
  height: '100%',
  sx: { height: '100%' },
  iconSize: 16,
  iconBox: 28,
  placeholderPrimary: 'Add image',
  placeholderSecondary: 'JPG or PNG · Max 10 MB',
  placeholderPrimaryTypographyProps: { fontSize: 14, fontWeight: 600, color: '#231F20' },
  placeholderSecondaryTypographyProps: { fontSize: 12 },
};

// Validation schema - all fields optional
const UpdateAdditionalOneSchema = Yup.object().shape({
  socialMediaPlatform: Yup.array(),
  contentFormat: Yup.array(),
  mainMessage: Yup.string().nullable(),
  keyPoints: Yup.string().nullable(),
  toneAndStyle: Yup.string().nullable(),
  brandGuidelines: Yup.mixed().nullable(),
  referenceContent: Yup.string().nullable(),
  productImage1: Yup.mixed().nullable(),
  productImage2: Yup.mixed().nullable(),
});

const UpdateAdditionalOne = ({ campaign, campaignMutate, formId, onFormStateChange }) => {
  const additionalDetails = campaign?.campaignAdditionalDetails;

  // Get existing values from campaign
  const defaultValues = useMemo(
    () => ({
      socialMediaPlatform: campaign?.campaignBrief?.socialMediaPlatform || [],
      contentFormat: additionalDetails?.contentFormat || [],
      mainMessage: additionalDetails?.mainMessage || '',
      keyPoints: additionalDetails?.keyPoints || '',
      toneAndStyle: additionalDetails?.toneAndStyle || '',
      brandGuidelines: additionalDetails?.brandGuidelinesUrl
        ? additionalDetails.brandGuidelinesUrl.split(',').map((url) => url.trim())
        : [],
      referenceContent: additionalDetails?.referenceContent || '',
      productImage1: additionalDetails?.productImage1Url ? [additionalDetails.productImage1Url] : [],
      productImage2: additionalDetails?.productImage2Url ? [additionalDetails.productImage2Url] : [],
    }),
    [campaign, additionalDetails]
  );

  const methods = useForm({
    resolver: yupResolver(UpdateAdditionalOneSchema),
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
        const formData = new FormData();
        formData.append('campaignId', campaign?.id);

        // Additional Details 1 fields
        formData.append('socialMediaPlatform', JSON.stringify(data.socialMediaPlatform || []));
        formData.append('contentFormat', JSON.stringify(data.contentFormat || []));
        formData.append('mainMessage', data.mainMessage || '');
        formData.append('keyPoints', data.keyPoints || '');
        formData.append('toneAndStyle', data.toneAndStyle || '');
        formData.append('referenceContent', data.referenceContent || '');

        // Handle brand guidelines files
        if (data.brandGuidelines && Array.isArray(data.brandGuidelines) && data.brandGuidelines.length > 0) {
          data.brandGuidelines.forEach((file) => {
            if (file instanceof File) {
              formData.append('brandGuidelines', file);
            }
          });
          // Keep existing URLs that aren't files
          const existingUrls = data.brandGuidelines
            .filter((item) => typeof item === 'string')
            .join(',');
          formData.append('existingBrandGuidelinesUrls', existingUrls);
        } else {
          // Explicitly mark as cleared
          formData.append('existingBrandGuidelinesUrls', '');
          formData.append('clearBrandGuidelines', 'true');
        }

        // Handle product image 1
        if (data.productImage1 && Array.isArray(data.productImage1) && data.productImage1.length > 0) {
          data.productImage1.forEach((file) => {
            if (file instanceof File) {
              formData.append('productImage1', file);
            }
          });
          // Keep existing URL if not a file
          const existingUrl = data.productImage1.find((item) => typeof item === 'string');
          if (existingUrl) {
            formData.append('existingProductImage1Url', existingUrl);
          }
        } else {
          // Explicitly mark as cleared
          formData.append('existingProductImage1Url', '');
          formData.append('clearProductImage1', 'true');
        }

        // Handle product image 2
        if (data.productImage2 && Array.isArray(data.productImage2) && data.productImage2.length > 0) {
          data.productImage2.forEach((file) => {
            if (file instanceof File) {
              formData.append('productImage2', file);
            }
          });
          // Keep existing URL if not a file
          const existingUrl = data.productImage2.find((item) => typeof item === 'string');
          if (existingUrl) {
            formData.append('existingProductImage2Url', existingUrl);
          }
        } else {
          // Explicitly mark as cleared
          formData.append('existingProductImage2Url', '');
          formData.append('clearProductImage2', 'true');
        }

        await axiosInstance.patch(endpoints.campaign.editCampaignAdditionalDetails, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        enqueueSnackbar('Additional Details 1 updated successfully!', { variant: 'success' });
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
          <Grid item xs={12} sm={6}>
            <Stack spacing={2}>
              <FormField label="Preferred Platform" asideInline aside="Choose up to 2">
                <ChipSelect
                  name="socialMediaPlatform"
                  options={PLATFORMS}
                  getIcon={renderPlatformIcon}
                  placeholder="Select platforms"
                />
              </FormField>

              <FormField label="Select Content Format">
                <ChipSelect
                  name="contentFormat"
                  options={CONTENT_FORMATS}
                  placeholder="Select formats"
                />
              </FormField>

              <FormField label="Main Message/Theme" asideInline aside="What's the core message?">
                <RHFTextField
                  name="mainMessage"
                  placeholder="The one idea creators should get across"
                  size="small"
                  multiline
                  sx={multiLineSx}
                />
              </FormField>

              <FormField label="Key Points to Cover" asideInline aside="USP of the product/brand">
                <RHFTextField
                  name="keyPoints"
                  placeholder="Product USPs creators should mention"
                  size="small"
                  multiline
                  sx={multiLineSx}
                />
              </FormField>

              <FormField label="Tone & Style">
                <RHFTextField
                  name="toneAndStyle"
                  placeholder="Describe the tone and style"
                  helperText="E.g. Educational, Entertaining, Inspirational, Authentic/Raw, Professional, Humorous or Other"
                  size="small"
                  multiline
                  sx={multiLineSx}
                />
              </FormField>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Stack spacing={2} sx={{ flex: 1 }}>
              <FormField label="Brand Guidelines Document">
                <FileDropList
                  name="brandGuidelines"
                  accept={BRAND_FILE_ACCEPT}
                  maxSize={20971520}
                  typesLabel="PDF, JPG or PNG"
                />
              </FormField>

              <FormField label="Reference Content/Inspiration">
                <RHFTextField
                  name="referenceContent"
                  placeholder="Links to posts or videos you like"
                  size="small"
                  multiline
                  inputProps={{ inputMode: 'url', autoCapitalize: 'none', spellCheck: false }}
                  sx={multiLineSx}
                />
              </FormField>

              <Grid container spacing={1} sx={{ flex: 1 }}>
                {[1, 2].map((n) => (
                  <Grid item xs={6} key={n} sx={{ display: 'flex' }}>
                    <FormField label={`Product Image ${n}`} sx={{ flex: 1 }}>
                      <Box sx={{ flex: 1, minHeight: 155 }}>
                        <RHFUploadCover name={`productImage${n}`} {...productImageProps} />
                      </Box>
                    </FormField>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </FormProvider>
  );
};

UpdateAdditionalOne.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
  formId: PropTypes.string,
  onFormStateChange: PropTypes.func,
};

export default UpdateAdditionalOne;
