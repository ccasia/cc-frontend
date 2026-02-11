import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import { Box, Grid, Stack, FormLabel, Typography } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { RHFUpload } from 'src/components/hook-form/rhf-upload';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFMultiSelect } from 'src/components/hook-form';
import { RHFUploadCover } from 'src/components/hook-form/rhf-upload-cover';

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

// Platform options
const PLATFORM_OPTIONS = [
  { value: 'Instagram', label: 'Instagram' },
  { value: 'TikTok', label: 'TikTok' },
];

// Content format options
const CONTENT_FORMAT_OPTIONS = [
  { value: 'Reels', label: 'Reels' },
  { value: 'Carousel', label: 'Carousel' },
];

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

const UpdateAdditionalOne = ({ campaign, campaignMutate }) => {
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
    setValue,
    watch,
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
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ maxWidth: '816px' }}>
        <Grid container spacing={2} mb={4}>
          {/* Column One */}
          <Grid item xs={12} sm={6}>
            {/* Preferred Platform */}
            <FormField label="Preferred Platform - Choose up to 2">
              <RHFMultiSelect
                name="socialMediaPlatform"
                placeholder="Select platforms"
                chip
                checkbox
                options={PLATFORM_OPTIONS}
              />
            </FormField>

            {/* Content Format */}
            <FormField label="Select Content Format">
              <RHFMultiSelect
                name="contentFormat"
                placeholder="Select format"
                chip
                checkbox
                options={CONTENT_FORMAT_OPTIONS}
              />
            </FormField>

            {/* Main Message/Theme */}
            <FormField label="Main Message/Theme - What's the core message?">
              <RHFTextField name="mainMessage" placeholder="Core Message" />
            </FormField>

            {/* Key Points to Cover */}
            <FormField label="Key Points to Cover - USP of the product/brand">
              <RHFTextField name="keyPoints" placeholder="Key Points" multiline />
            </FormField>

            {/* Tone & Style */}
            <FormField label="Tone & Style">
              <Typography variant="caption" color="#8E8E93" sx={{ mt: -0.5, mb: 0.5 }}>
                [Eg:- Educational / Entertaining / Inspirational / Authentic/Raw / Professional /
                Humorous / Other]
              </Typography>
              <RHFTextField name="toneAndStyle" placeholder="Tone & Style" multiline />
            </FormField>
          </Grid>

          {/* Column Two */}
          <Grid item xs={12} sm={6}>
            {/* Brand Guidelines Document */}
            <FormField label="Brand Guidelines Document">
              <RHFUpload
                name="brandGuidelines"
                maxSize={20971520}
                accept={{
                  'application/pdf': ['.pdf'],
                  'image/jpeg': ['.jpeg', '.jpg'],
                  'image/png': ['.png'],
                }}
                multiple
                onDrop={(acceptedFiles) => {
                  const files = watch('brandGuidelines') || [];
                  const newFiles = acceptedFiles.map((file) =>
                    Object.assign(file, {
                      preview: URL.createObjectURL(file),
                    })
                  );
                  setValue('brandGuidelines', [...files, ...newFiles], {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                onRemove={(inputFile) => {
                  const files = watch('brandGuidelines') || [];
                  setValue(
                    'brandGuidelines',
                    files.filter((file) => file !== inputFile),
                    { shouldValidate: true, shouldDirty: true }
                  );
                }}
                onRemoveAll={() =>
                  setValue('brandGuidelines', [], { shouldValidate: true, shouldDirty: true })
                }
                height={175}
              />
            </FormField>

            {/* Reference Content/Inspiration */}
            <FormField label="Reference Content/Inspiration">
              <RHFTextField
                name="referenceContent"
                placeholder="references.com"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { height: '50px' } }}
              />
            </FormField>

            {/* Product Images */}
            <Grid container spacing={1}>
              {/* Product Image 1 */}
              <Grid item xs={12} sm={6}>
                <FormField label="Product Image 1">
                  <RHFUploadCover
                    name="productImage1"
                    maxSize={10485760}
                    placeholderPrimaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}
                    placeholderSecondaryTypographyProps={{ fontSize: 12 }}
                    height={155}
                    iconSize={15}
                    iconBox={25}
                    onDrop={(acceptedFiles) => {
                      if (acceptedFiles.length > 0) {
                        const file = Object.assign(acceptedFiles[0], {
                          preview: URL.createObjectURL(acceptedFiles[0]),
                        });
                        setValue('productImage1', [file], {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
                    onDelete={() => {
                      setValue('productImage1', [], {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </FormField>
              </Grid>

              {/* Product Image 2 */}
              <Grid item xs={12} sm={6}>
                <FormField label="Product Image 2">
                  <RHFUploadCover
                    name="productImage2"
                    maxSize={10485760}
                    placeholderPrimaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}
                    placeholderSecondaryTypographyProps={{ fontSize: 11 }}
                    height={155}
                    iconSize={15}
                    iconBox={25}
                    onDrop={(acceptedFiles) => {
                      if (acceptedFiles.length > 0) {
                        const file = Object.assign(acceptedFiles[0], {
                          preview: URL.createObjectURL(acceptedFiles[0]),
                        });
                        setValue('productImage2', [file], {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
                    onDelete={() => {
                      setValue('productImage2', [], {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </FormField>
              </Grid>
            </Grid>
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
            Save Additional Details 1
          </LoadingButton>
        </Stack>
      </Box>
    </FormProvider>
  );
};

UpdateAdditionalOne.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
};

export default UpdateAdditionalOne;
