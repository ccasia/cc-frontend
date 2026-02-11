import dayjs from 'dayjs';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { memo, useMemo, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { Box, Grid, Stack, FormLabel, Typography } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { interestsLists } from 'src/contants/interestLists';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFMultiSelect } from 'src/components/hook-form';
import { RHFUploadCover } from 'src/components/hook-form/rhf-upload-cover';

// Form field component with consistent styling
const FormField = ({ label, children, required = true }) => (
  <Stack spacing={0.5}>
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
    {children}
  </Stack>
);

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
};

// Validation schema - only required fields are validated
const UpdateGeneralInfoSchema = Yup.object().shape({
  campaignName: Yup.string().required('Campaign name is required').max(40, 'Max 40 characters'),
  campaignDescription: Yup.string().required('Campaign info is required'),
  brandAbout: Yup.string().nullable(),
  campaignStartDate: Yup.mixed().required('Start date is required'),
  campaignEndDate: Yup.mixed().required('End date is required'),
  postingStartDate: Yup.mixed().nullable(),
  postingEndDate: Yup.mixed().nullable(),
  productName: Yup.string().nullable(),
  websiteLink: Yup.string().nullable(),
  campaignIndustries: Yup.array(),
  campaignImages: Yup.mixed(),
});

const UpdateGeneralInformation = ({ campaign, campaignMutate }) => {
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
        if (campaign?.campaignBrief?.industries && typeof campaign.campaignBrief.industries === 'string') {
          return campaign.campaignBrief.industries.split(', ').filter(i => i.trim() !== '');
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
    formState: { isSubmitting, isDirty },
  } = methods;

  // Reset form when campaign data changes
  useEffect(() => {
    if (campaign) {
      reset(defaultValues);
    }
  }, [campaign, defaultValues, reset]);

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
        formData.append('campaignIndustries', data.campaignIndustries && data.campaignIndustries.length > 0
          ? data.campaignIndustries.join(', ')
          : '');
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
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ maxWidth: { xs: '100%', sm: '80%' } }}>
        {/* Campaign Title & Industry - Two Columns */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={6}>
            <FormField label="Campaign Name">
              <RHFTextField
                name="campaignName"
                placeholder="Campaign Name (max 40 characters)"
                size="small"
                inputProps={{
                  maxLength: 40,
                }}
                sx={{ '& .MuiOutlinedInput-root': { height: '57px' } }}
              />
            </FormField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormField label="Industry" required={false}>
              <RHFMultiSelect
                name="campaignIndustries"
                placeholder="Select Industry"
                chip
                checkbox
                options={interestsLists.map((item) => ({ value: item, label: item }))}
              />
            </FormField>
          </Grid>
        </Grid>

        {/* Campaign General Info - Two Columns */}
        <Grid container spacing={2}>
          {/* Column one */}
          <Grid item xs={12} sm={6}>
            {/* Campaign Info - Full width */}
            <Box mb={2}>
              <FormField label="Campaign Info">
                <RHFTextField
                  name="campaignDescription"
                  placeholder="Explain more about the campaign..."
                  multiline
                  rows={3}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { padding: '12px' } }}
                />
              </FormField>
            </Box>

            {/* About Brand - Full width */}
            <Box mb={2}>
              <FormField label="About the Brand" required={false}>
                <Typography mt={-1} mb={0.5} variant="caption" color="#8E8E93">
                  Let us know a bit more about you!
                </Typography>
                <RHFTextField
                  name="brandAbout"
                  placeholder="About"
                  multiline
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { padding: '12px' } }}
                />
              </FormField>
            </Box>

            {/* Campaign start/end date - Two columns */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormField label="Campaign Start Date">
                    <DatePicker
                      value={startDateDayjs}
                      format='DD/MM/YY'
                      onChange={(newValue) => {
                        setValue('campaignStartDate', newValue ? newValue.toISOString() : '', { shouldValidate: true, shouldDirty: true });
                      }}
                      slots={{
                        openPickerIcon: () => (
                          <Iconify icon="meteor-icons:calendar" width={22} />
                        ),
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          placeholder: 'Select date',
                          error: false,
                          size: 'small',
                          sx: { '& .MuiOutlinedInput-root': { height: '50px' } },
                        },
                      }}
                    />
                  </FormField>
                </Grid>
                <Grid item xs={6}>
                  <FormField label="Campaign End Date">
                    <DatePicker
                      value={endDateDayjs}
                      format='DD/MM/YY'
                      onChange={(newValue) => {
                        setValue('campaignEndDate', newValue ? newValue.toISOString() : '', { shouldValidate: true, shouldDirty: true });
                      }}
                      slots={{
                        openPickerIcon: () => (
                          <Iconify icon="meteor-icons:calendar" width={22} />
                        ),
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          placeholder: 'Select date',
                          error: false,
                          size: 'small',
                          sx: { '& .MuiOutlinedInput-root': { height: '50px' } },
                        },
                      }}
                    />
                  </FormField>
                </Grid>
              </Grid>
            </LocalizationProvider>

            {/* Posting start/end date - Two columns */}
            <Box sx={{ mt: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormField label="Posting Start Date">
                      <DatePicker
                        value={postingStartDateDayjs}
                        format="DD/MM/YY"
                        onChange={(newValue) => {
                          setValue('postingStartDate', newValue ? newValue.toISOString() : null, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                          // Auto-set postingEndDate to +5 days if not manually set
                          if (newValue) {
                            const newEndDate = dayjs(newValue).add(7, 'day');
                            // Only auto-set if postingEndDate is empty or was previously auto-set
                            if (!postingEndDateDayjs || postingEndDateDayjs.isSame(dayjs(postingStartDate).add(7, 'day'))) {
                              setValue('postingEndDate', newEndDate.toISOString(), {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }
                          }
                        }}
                        slots={{
                          openPickerIcon: () => (
                            <Iconify icon="meteor-icons:calendar" width={22} />
                          ),
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            placeholder: 'Start Date',
                            error: false,
                            size: 'small',
                            sx: { '& .MuiOutlinedInput-root': { height: '50px' } },
                          },
                        }}
                      />
                    </FormField>
                  </Grid>
                  <Grid item xs={6}>
                    <FormField label="Posting End Date">
                      <DatePicker
                        value={postingEndDateDayjs}
                        format="DD/MM/YY"
                        onChange={(newValue) => {
                          setValue('postingEndDate', newValue ? newValue.toISOString() : null, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                        slots={{
                          openPickerIcon: () => (
                            <Iconify icon="meteor-icons:calendar" width={22} />
                          ),
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            placeholder: 'End Date',
                            error: false,
                            size: 'small',
                            sx: { '& .MuiOutlinedInput-root': { height: '50px' } },
                          },
                        }}
                      />
                    </FormField>
                  </Grid>
                </Grid>
              </LocalizationProvider>
            </Box>
          </Grid>

          {/* Column two */}
          <Grid item xs={12} sm={6}>
            {/* Product/Service Name - Full width */}
            <Box mb={2}>
              <FormField label="Product/Service Name" required={false}>
                <RHFTextField
                  name="productName"
                  placeholder="Product/Service Name"
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { height: '50px' } }}
                />
              </FormField>
            </Box>

            <Box mb={2}>
              <FormField label="Website Link" required={false}>
                <RHFTextField
                  name="websiteLink"
                  placeholder="cultcreativeasia.com"
                  multiline
                  rows={1}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { padding: '12px' } }}
                />
              </FormField>
            </Box>

            {/* Campaign Photo - Full width */}
            <Box sx={{ mb: 4 }}>
              <FormField label="Campaign Image">
                <RHFUploadCover
                  name="campaignImages"
                  maxSize={10485760}
                  height={200}
                  placeholderPrimaryTypographyProps={{ fontSize: 18, fontWeight: 600 }}
                  placeholderSecondaryTypographyProps={{ fontSize: 14, fontWeight: 400 }}
                />
              </FormField>
            </Box>
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
              '&:hover': {
                bgcolor: '#1340ff',
              },
              '&:disabled': {
                bgcolor: 'rgba(19, 64, 255, 0.3)',
                color: '#fff',
                boxShadow: '0px -3px 0px 0px inset rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            Save General Information
          </LoadingButton>
        </Stack>
      </Box>
    </FormProvider>
  );
};

UpdateGeneralInformation.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
};

export default memo(UpdateGeneralInformation);
