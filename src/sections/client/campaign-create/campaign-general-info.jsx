import useSWR from 'swr';
import dayjs from 'dayjs';
import React, { memo, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { DatePicker } from '@mui/x-date-pickers';
import { Box, Grid, Stack, FormLabel, TextField, Typography } from '@mui/material';

import socket from 'src/hooks/socket';
import useGetClientCredits from 'src/hooks/use-get-client-credits';

import { fetcher, endpoints } from 'src/utils/axios';

import { objectivesLists } from 'src/contants/objectives';
import { interestsLists } from 'src/contants/interestLists';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
// import CustomRHFSelect from './custom-rhf-select'; // Will reuse RHFMultiSelect hook instead
// import CustomRHFMultiSelect from './custom-rhf-multi-select'; // Will reuse RHFMultiSelect hook instead
import { RHFMultiSelect } from 'src/components/hook-form';
import { fontSize } from '@mui/system';

// Form field component with consistent styling
const FormField = ({ label, children, required = true }) => (
  <Stack spacing={0.5}>
    <FormLabel
      required={required}
      sx={{
        fontWeight: 700,
        color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
        fontSize: '0.875rem', // Smaller font size for labels
        mb: 0.5,
        '& .MuiFormLabel-asterisk': {
          color: '#FF3500', // Change this to your desired color
        },
      }}
    >
      {label}
    </FormLabel>
    {children}
  </Stack>
);

const ClientCampaignGeneralInfo = () => {
  const { data, isLoading, mutate } = useSWR(endpoints.campaign.total, fetcher);
  const { setValue, watch } = useFormContext();
  const { availableCredits, isLoading: isLoadingCredits } = useGetClientCredits();

  // For date handling
  const startDate = watch('campaignStartDate');
  const endDate = watch('campaignEndDate');
  const credits = watch('campaignCredits');

  // Persist available credits for parent validation
  useEffect(() => {
    try {
      localStorage.setItem('clientAvailableCredits', String(availableCredits || 0));
    } catch (e) {}
  }, [availableCredits]);

  // Compute exceed state and notify parent
  const numericAvailable = Number(availableCredits) || 0;
  const requestedCredits = Number(credits ?? 0);
  const exceedOnly = (numericAvailable <= 0 && requestedCredits > 0) || (numericAvailable > 0 && requestedCredits > numericAvailable);
  const blockInvalid = numericAvailable <= 0 || requestedCredits <= 0 || exceedOnly;

  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent('client-campaign-credits-error', { detail: blockInvalid }));
    } catch (e) {}
  }, [blockInvalid]);

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
      // Ensure startDate is a valid dayjs object
      const start = dayjs(startDate);
      if (start.isValid()) {
        // Calculate end date as 14 days after start date
        const newEndDate = start.add(14, 'day');
        setValue('campaignEndDate', newEndDate.toDate());
      }
    }
  }, [startDate, setValue]);

  return (
    <>
      {/* Container to limit width */}
      <Box sx={{ maxWidth: '650px', mx: 'auto', mb: 8 }}>
        <Stack alignItems="self-end" spacing={0.5} mb={2}>
          <Typography variant="subtitle2">Campaign ID</Typography>
          {!isLoading && <Label color="info">C0{data + 1}</Label>}
        </Stack>
        {/* Campaign Title - Full width */}
        <FormField label="Campaign Title">
          <RHFTextField
            name="campaignTitle"
            placeholder="Enter campaign title (max 40 characters)"
            size="small"
            inputProps={{
              maxLength: 40,
            }}
            sx={{ '& .MuiOutlinedInput-root': { height: '50px' } }}
          />
        </FormField>

        {/* Date Range - Two columns */}
        <Box sx={{ mt: 2 }}>
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
                      placeholder: 'Select start date',
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
                      placeholder: 'Select end date',
                      error: false,
                      size: 'small',
                      sx: { '& .MuiOutlinedInput-root': { height: '50px' } },
                    },
                  }}
                />
              </FormField>
            </Grid>
          </Grid>
        </Box>

        {/* Credits - Two columns */}
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormField label="Available Credits">
                <TextField
                  fullWidth
                  disabled
                  size="small"
                  value={isLoadingCredits ? 'Loading...' : availableCredits.toString()}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { height: '50px' } }}
                />
              </FormField>
            </Grid>
            <Grid item xs={6}>
              <FormField label="Number Of Credits">
                <RHFTextField
                  name="campaignCredits"
                  placeholder="Enter number of credits"
                  type="number"
                  InputProps={{
                    inputProps: {
                      min: 1,
                      max: numericAvailable > 0 ? numericAvailable : 0,
                    },
                  }}
                  helperText={exceedOnly ? (numericAvailable <= 0 ? 'No credits available' : `Exceeds limits: available ${numericAvailable}`) : ''}
                  error={exceedOnly}
                  sx={{ '& .MuiOutlinedInput-root': { height: '50px' } }}
                />
              </FormField>
            </Grid>
          </Grid>
        </Box>

        {/* Campaign Info - Full width */}
        <Box sx={{ mt: 2 }}>
          <FormField label="Campaign Info">
            <RHFTextField
              name="campaignDescription"
              placeholder="Explain more about the campaign..."
              multiline
              rows={4}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { padding: '8px' } }}
            />
          </FormField>
        </Box>

        {/* Brand Tone - Full width */}
        <Box sx={{ mt: 2 }}>
          <FormField label="Brand Tone">
            <RHFTextField
              name="brandTone"
              placeholder="Describe the brand tone"
              multiline
              rows={2}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { padding: '8px' } }}
            />
          </FormField>
        </Box>

        {/* Product/Service Name - Full width */}
        <Box sx={{ mt: 2 }}>
          <FormField label="Product/Service Name">
            <RHFTextField
              name="productName"
              placeholder="Enter product or service name"
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { height: '50px' } }}
            />
          </FormField>
        </Box>

        {/* Campaign Objectives - Full width */}
        <Box sx={{ mt: 2 }}>
          <FormField label="Campaign Objectives">
            <RHFMultiSelect
              name="campaignObjectives"
              placeholder="Select Campaign Objectives"
              options={objectivesLists.map((item) => ({
                value: item,
                label: item,
              }))}
              chip
              checkbox
              // size="small"
              // sx={{
              //   '& .MuiOutlinedInput-root': { minHeight: '50px' },
              // }}
            />
          </FormField>
        </Box>

        {/* Industries - Full width */}
        {/* <Box sx={{ mt: 2 }}>
          <FormField label="Industries">
            <CustomRHFMultiSelect
              name="campaignIndustries"
              options={industriesOptions}
              chip={true}
              checkbox={false}
              chipColor="#8E8E93"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': { minHeight: '50px' },
              }}
            /> */}
        {/* {interestsLists.map((item, index) => (
                <MenuItem key={index} value={item}>
                  {item}
                </MenuItem>
              ))}
            </CustomRHFMultiSelect> */}
        {/* </FormField>
        </Box> */}
        <Box sx={{ mt: 2 }}>
          <FormField label="Industries">
            <RHFMultiSelect
              name="campaignIndustries"
              placeholder="Select Industries"
              chip
              checkbox
              options={interestsLists.map((item) => ({ value: item, label: item }))}
            />
          </FormField>
        </Box>

        {/* Submission Version Toggle */}
        {/* <Box sx={{ mt: 2 }}>
          <FormField label="Submission Version" required={false}>
            <FormControlLabel
              control={
                <Switch
                  checked={watch('submissionVersion') === 'v4'}
                  onChange={(e) => {
                    setValue('submissionVersion', e.target.checked ? 'v4' : 'v3', { shouldValidate: true });
                  }}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Enable v4 submission flow
                </Typography>
              }
            />
          </FormField>
        </Box> */}
      </Box>
    </>
  );
};

export default memo(ClientCampaignGeneralInfo);
