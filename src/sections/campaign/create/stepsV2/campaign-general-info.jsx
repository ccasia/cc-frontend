import useSWR from 'swr';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { memo, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { DatePicker } from '@mui/x-date-pickers';
import { Box, Grid, Stack, FormLabel, Typography } from '@mui/material';

import socket from 'src/hooks/socket';

import { fetcher, endpoints } from 'src/utils/axios';

import { interestsLists } from 'src/contants/interestLists';

import Label from 'src/components/label';
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

const CampaignGeneralInfo = () => {
  const { data, isLoading, mutate } = useSWR(endpoints.campaign.total, fetcher);
  const { setValue, watch } = useFormContext();

  // For date handling
  const startDate = watch('campaignStartDate');
  const endDate = watch('campaignEndDate');

  useEffect(() => {
    if (socket) {
      socket.on('campaign', () => {
        mutate();
      });
    }

    return () => socket.off('campaign');
  }, [mutate]);

  useEffect(() => {
    setValue('campaignId', `C${data + 1 < 10 ? `0${data + 1}` : data + 1}`);

    // Initialize multi-select fields with empty arrays if they're undefined
    if (!watch('campaignObjectives')) {
      setValue('campaignObjectives', []);
    }
    if (!watch('campaignIndustries')) {
      setValue('campaignIndustries', []);
    }
  }, [setValue, data, watch]);

  // Auto-set end date 14 days after start date
  useEffect(() => {
    if (startDate) {
      const start = dayjs(startDate);
      if (start.isValid()) {
        const newEndDate = start.add(14, 'day');
        setValue('campaignEndDate', newEndDate.toDate());
      }
    }
  }, [startDate, setValue]);

  return (
    <>
      {/* Container to limit width */}
      <Box sx={{ maxWidth: '816px', mx: 'auto', mb: 8, mt: 4 }}>
        <Stack alignItems="self-end" spacing={0.5} mb={2}>
          <Typography variant="subtitle2">Campaign ID</Typography>
          {!isLoading && <Label color="info">C0{data + 1}</Label>}
        </Stack>

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
            <FormField label="Industry">
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
                  rows={4}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { padding: '12px' } }}
                />
              </FormField>
            </Box>
            {/* About Brand - Full width */}
            <Box mb={2}>
              <FormField label="About the Brand" required={false}>
                <Typography mt={-1} mb={0.5} variant='caption' color="#8E8E93">Let us know a bit more about the brand!</Typography>
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
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormField label="Campaign Start Date">
                  <DatePicker
                    value={startDate}
                    onChange={(newValue) => {
                      setValue('campaignStartDate', newValue, { shouldValidate: true });
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
                <FormField label="Campaign End Date">
                  <DatePicker
                    value={endDate}
                    onChange={(newValue) => {
                      setValue('campaignEndDate', newValue, { shouldValidate: true });
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
            {/* Product/Service Name - Full width */}
            <Box sx={{ mt: 2 }}>
              <FormField label="Product/Service Name" required={false}>
                <RHFTextField
                  name="productName"
                  placeholder="Product/Service Name"
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { height: '50px' } }}
                />
              </FormField>
            </Box>
          </Grid>
          {/* Column two */}
          <Grid item xs={12} sm={6}>
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
            <Box sx={{ mt: 2, mb: 4 }}>
              <FormField label="Campaign Image">
                <RHFUploadCover
                  name="campaignImages"
                  maxSize={10485760}
                  placeholderPrimaryTypographyProps={{ fontSize: 18, fontWeight: 600 }}
                  placeholderSecondaryTypographyProps={{ fontSize: 14, fontWeight: 400 }}
                />
              </FormField>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default memo(CampaignGeneralInfo);
