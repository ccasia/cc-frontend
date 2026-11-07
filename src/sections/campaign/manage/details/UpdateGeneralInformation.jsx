import dayjs from 'dayjs';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { memo, useMemo, useEffect, useCallback } from 'react';

import { DatePicker } from '@mui/x-date-pickers';
import { Box, Grid, Stack, Typography, InputAdornment } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { interestsLists } from 'src/contants/interestLists';

import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFUploadCover } from 'src/components/hook-form/rhf-upload-cover';

import ChipSelect from 'src/sections/campaign/create/components/chip-select';
import { bulletInputProps } from 'src/sections/campaign/create/components/bullet-text';
import CampaignCardPreview from 'src/sections/campaign/create/components/campaign-card-preview';
import {
  multiLineSx,
  singleLineSx,
  helperTextSx,
} from 'src/sections/campaign/create/components/field-styles';

import FormField from './components/form-field';

const NAME_MAX = 40;

const campaignInfoSx = {
  ...multiLineSx,
  '& .MuiInputBase-inputMultiline': {
    ...multiLineSx['& .MuiInputBase-inputMultiline'],
    maxHeight: 'min(176px, 30vh)',
    overflowY: 'auto !important',
  },
};

const IMAGE_ACCEPT = { 'image/jpeg': [], 'image/png': [] };

const renderCardPreview = (image) => <CampaignCardPreview image={image} />;

const formatPeriod = (start, end) => {
  if (!start || !end) return null;
  const days = dayjs(end).startOf('day').diff(dayjs(start).startOf('day'), 'day');
  if (Number.isNaN(days) || days < 0) return null;
  if (days === 0) return 'Same day';
  return days === 1 ? '1 day' : `${days} days`;
};

const datePickerSlotProps = (placeholder, error) => ({
  textField: {
    fullWidth: true,
    placeholder,
    size: 'small',
    error: !!error,
    helperText: error?.message,
    inputProps: { 'aria-label': placeholder },
    sx: singleLineSx,
  },
});

// Validation schema - only required fields are validated
const UpdateGeneralInfoSchema = Yup.object().shape({
  campaignName: Yup.string().required('Campaign name is required').max(40, 'Max 40 characters'),
  campaignDescription: Yup.string().required('Campaign info is required'),
  brandAbout: Yup.string().nullable(),
  campaignStartDate: Yup.mixed().required('Start date is required'),
  campaignEndDate: Yup.mixed().required('End date is required'),
  postingStartDate: Yup.mixed().nullable(),
  postingEndDate: Yup.mixed().nullable(),
  productName: Yup.string().required('Product Name/Service is required'),
  websiteLink: Yup.string().nullable(),
  campaignIndustries: Yup.array(),
  campaignImages: Yup.mixed(),
});

const UpdateGeneralInformation = ({ campaign, campaignMutate, formId, onFormStateChange }) => {
  // Get existing values from campaign
  const defaultValues = useMemo(
    () => ({
      campaignName: campaign?.name || '',
      campaignDescription: campaign?.description || '',
      brandAbout: campaign?.brandAbout || '',
      // Store dates as ISO strings for proper dirty state detection
      campaignStartDate: campaign?.campaignBrief?.startDate
        ? new Date(campaign.campaignBrief.startDate).toISOString()
        : '',
      campaignEndDate: campaign?.campaignBrief?.endDate
        ? new Date(campaign.campaignBrief.endDate).toISOString()
        : '',
      postingStartDate: campaign?.campaignBrief?.postingStartDate
        ? new Date(campaign.campaignBrief.postingStartDate).toISOString()
        : null,
      postingEndDate: campaign?.campaignBrief?.postingEndDate
        ? new Date(campaign.campaignBrief.postingEndDate).toISOString()
        : null,
      productName: campaign?.productName || '',
      websiteLink: campaign?.websiteLink || '',
      campaignIndustries: (() => {
        if (Array.isArray(campaign?.campaignBrief?.industries)) {
          return campaign.campaignBrief.industries;
        }
        if (
          campaign?.campaignBrief?.industries &&
          typeof campaign.campaignBrief.industries === 'string'
        ) {
          return campaign.campaignBrief.industries.split(', ').filter((i) => i.trim() !== '');
        }
        return [];
      })(),
      campaignImages: campaign?.campaignBrief?.images || [],
    }),
    [campaign]
  );

  const methods = useForm({
    resolver: yupResolver(UpdateGeneralInfoSchema),
    defaultValues,
    mode: 'onChange', // Enable onChange mode for better dirty state detection
  });

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting, isDirty, errors },
  } = methods;

  // Reset form when campaign data changes
  useEffect(() => {
    if (campaign) {
      reset(defaultValues);
    }
  }, [campaign, defaultValues, reset]);

  useEffect(() => {
    onFormStateChange?.({ isDirty, isSubmitting });
  }, [isDirty, isSubmitting, onFormStateChange]);

  const campaignName = watch('campaignName') ?? '';
  const startDate = watch('campaignStartDate');
  const endDate = watch('campaignEndDate');
  const postingStartDate = watch('postingStartDate');
  const postingEndDate = watch('postingEndDate');

  const startDateDayjs = startDate ? dayjs(startDate) : null;
  const endDateDayjs = endDate ? dayjs(endDate) : null;
  const postingStartDateDayjs = postingStartDate ? dayjs(postingStartDate) : null;
  const postingEndDateDayjs = postingEndDate ? dayjs(postingEndDate) : null;

  const onSubmit = useCallback(
    async (data) => {
      try {
        const formData = new FormData();
        formData.append('id', campaign?.id);
        formData.append('name', data.campaignName);
        formData.append('description', data.campaignDescription);
        formData.append(
          'campaignIndustries',
          data.campaignIndustries && data.campaignIndustries.length > 0
            ? data.campaignIndustries.join(', ')
            : ''
        );
        formData.append('brandAbout', data.brandAbout || '');
        formData.append('productName', data.productName);
        formData.append('websiteLink', data.websiteLink || '');
        formData.append('campaignStartDate', data.campaignStartDate || null);
        formData.append('campaignEndDate', data.campaignEndDate || null);
        formData.append('postingStartDate', data.postingStartDate || '');
        formData.append('postingEndDate', data.postingEndDate || '');

        // Only append new image files
        if (data.campaignImages && data.campaignImages.length > 0) {
          data.campaignImages.forEach((image) => {
            if (image instanceof File) {
              formData.append('campaignImages', image);
            } else if (image?.file instanceof File) {
              formData.append('campaignImages', image.file);
            }
          });
        }

        await axiosInstance.patch(endpoints.campaign.editCampaignInfo, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        enqueueSnackbar('Campaign updated successfully!', { variant: 'success' });
        if (campaignMutate) campaignMutate();
      } catch (error) {
        enqueueSnackbar(
          error?.response?.data?.message || error?.message || 'Failed to update campaign',
          { variant: 'error' }
        );
      }
    },
    [campaign?.id, campaignMutate]
  );

  return (
    <FormProvider id={formId} methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ maxWidth: { xs: '100%', sm: '80%' }, ...helperTextSx }}>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={6}>
            <FormField label="Campaign Name" required>
              <RHFTextField
                name="campaignName"
                placeholder="Campaign name"
                size="small"
                inputProps={{ maxLength: NAME_MAX }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography
                        variant="caption"
                        sx={{
                          color: campaignName.length >= NAME_MAX ? '#FF3500' : '#8E8E93',
                          fontVariantNumeric: 'tabular-nums',
                          opacity: 0,
                          transition: 'opacity 150ms ease',
                          '.Mui-focused &': { opacity: 1 },
                        }}
                      >
                        {campaignName.length}/{NAME_MAX}
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                sx={singleLineSx}
              />
            </FormField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormField label="Industry">
              <ChipSelect
                name="campaignIndustries"
                noOptionsText="No matching industry"
                options={interestsLists}
                placeholder="Select industry"
              />
            </FormField>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Stack spacing={2}>
              <FormField label="Campaign Info" required>
                <RHFTextField
                  name="campaignDescription"
                  placeholder="What is the campaign about, and what should creators do?"
                  multiline
                  minRows={4}
                  maxRows={8}
                  size="small"
                  inputProps={bulletInputProps}
                  sx={campaignInfoSx}
                />
              </FormField>

              <FormField label="About the Brand" hint="Let us know a bit more about the brand!">
                <RHFTextField
                  name="brandAbout"
                  placeholder="What the brand does, its values and its audience"
                  multiline
                  minRows={1}
                  maxRows={8}
                  size="small"
                  inputProps={bulletInputProps}
                  sx={multiLineSx}
                />
              </FormField>

              <FormField label="Campaign Period" aside={formatPeriod(startDate, endDate)} required>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <DatePicker
                      value={startDateDayjs?.toDate() ?? null}
                      onChange={(newValue) => {
                        setValue('campaignStartDate', newValue ? newValue.toISOString() : '', {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                      slotProps={datePickerSlotProps('Start date', errors.campaignStartDate)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <DatePicker
                      value={endDateDayjs?.toDate() ?? null}
                      onChange={(newValue) => {
                        setValue('campaignEndDate', newValue ? newValue.toISOString() : '', {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                      slotProps={datePickerSlotProps('End date', errors.campaignEndDate)}
                    />
                  </Grid>
                </Grid>
              </FormField>

              <FormField
                label="Posting Period"
                aside={formatPeriod(postingStartDate, postingEndDate)}
                required
              >
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <DatePicker
                      value={postingStartDateDayjs?.toDate() ?? null}
                      onChange={(newValue) => {
                        setValue('postingStartDate', newValue ? newValue.toISOString() : null, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        // Auto-set postingEndDate to +7 days if not manually set
                        if (newValue) {
                          const newEndDate = dayjs(newValue).add(7, 'day');
                          if (
                            !postingEndDateDayjs ||
                            postingEndDateDayjs.isSame(dayjs(postingStartDate).add(7, 'day'))
                          ) {
                            setValue('postingEndDate', newEndDate.toISOString(), {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }
                        }
                      }}
                      slotProps={datePickerSlotProps('Start date', errors.postingStartDate)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <DatePicker
                      value={postingEndDateDayjs?.toDate() ?? null}
                      onChange={(newValue) => {
                        setValue('postingEndDate', newValue ? newValue.toISOString() : null, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                      slotProps={datePickerSlotProps('End date', errors.postingEndDate)}
                    />
                  </Grid>
                </Grid>
              </FormField>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Stack spacing={2}>
              <FormField label="Product/Service Name" required>
                <RHFTextField
                  name="productName"
                  placeholder="Product or service name"
                  size="small"
                  sx={singleLineSx}
                />
              </FormField>

              <FormField label="Website Link">
                <RHFTextField
                  name="websiteLink"
                  placeholder="https://www.cultcreativeasia.com"
                  size="small"
                  inputProps={{ inputMode: 'url', autoCapitalize: 'none', spellCheck: false }}
                  sx={singleLineSx}
                />
              </FormField>

              <FormField label="Campaign Image" required>
                <RHFUploadCover
                  name="campaignImages"
                  maxSize={10485760}
                  accept={IMAGE_ACCEPT}
                  renderPreview={renderCardPreview}
                  placeholderPrimaryTypographyProps={{ fontSize: 18, fontWeight: 600 }}
                  placeholderSecondaryTypographyProps={{ fontSize: 14, fontWeight: 400 }}
                />
              </FormField>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </FormProvider>
  );
};

UpdateGeneralInformation.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
  formId: PropTypes.string,
  onFormStateChange: PropTypes.func,
};

export default memo(UpdateGeneralInformation);
