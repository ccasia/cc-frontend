import useSWR from 'swr';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { memo, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { DatePicker } from '@mui/x-date-pickers';
import { Box, Grid, Stack, FormLabel, Typography } from '@mui/material';

import socket from 'src/hooks/socket';

import { fetcher, endpoints } from 'src/utils/axios';

import { objectivesLists } from 'src/contants/objectives';
import { interestsLists } from 'src/contants/interestLists';

import Label from 'src/components/label';
import { RHFTextField, RHFMultiSelect } from 'src/components/hook-form';

const FormField = ({ label, children, required = true }) => (
  <Stack spacing={0.5}>
    <FormLabel
      required={required}
      sx={{
        fontWeight: 700,
        color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
        fontSize: '0.875rem',
        mb: !label ? '1.575rem' : 0.5,
        '& .MuiFormLabel-asterisk': {
          color: '#FF3500',
          display: !label ? 'none' : 'inline-flex',
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

const GeneralCampaign = () => {
  const { data, isLoading, mutate } = useSWR(endpoints.campaign.total, fetcher);
  const { setValue, watch } = useFormContext();

  const startDate = watch('campaignStartDate');
  const endDate = watch('campaignEndDate');
  const postingStartDate = watch('postingStartDate');
  const postingEndDate = watch('postingEndDate');

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
  }, [setValue, data]);

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

    if (postingStartDate) {
      const start = dayjs(postingStartDate);
      if (start.isValid()) {
        const newPostingEndDate = start.add(7, 'day');
        setValue('postingEndDate', newPostingEndDate.toDate());
      }
    }
  }, [startDate, postingStartDate, setValue]);

  return (
    <Box sx={{ maxWidth: '500px', mx: 'auto' }}>
      <Stack alignItems="self-end" spacing={0.5} mt={2}>
        <Typography variant="subtitle2">Campaign ID</Typography>
        {!isLoading && <Label color="info">C0{data + 1}</Label>}
      </Stack>

      <Stack spacing={2} mt={4}>
        <FormField label="Campaign Title">
          <RHFTextField name="campaignTitle" placeholder="Campaign Title" />
        </FormField>

        {/* Campaign Dates */}
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

        {/* Posting Dates */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box flex={1}>
            <FormField label="Campaign Posting Period">
              <DatePicker
                value={postingStartDate}
                onChange={(newValue) => {
                  setValue('postingStartDate', newValue, { shouldValidate: true });
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
          </Box>
          <Typography sx={{ mt: 3.5 }}>-</Typography>
          <Box flex={1}>
            <FormField label="">
              <DatePicker
                value={postingEndDate}
                onChange={(newValue) => {
                  setValue('postingEndDate', newValue, { shouldValidate: true });
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
          </Box>
        </Stack>

        <FormField label="Campaign Info">
          <RHFTextField
            name="campaignDescription"
            placeholder="Explain more about the campaign..."
            multiline
            rows={4}
          />
        </FormField>
        <FormField label="Brand Tone">
          <RHFTextField name="brandTone" placeholder="Brand Tone" multiline />
        </FormField>
        <FormField label="Product/Service Name">
          <RHFTextField name="productName" placeholder="Product/Service Name" multiline />
        </FormField>

        {/* Campaign Objectives - Full width */}
        <Box>
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

        <Box>
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
      </Stack>
    </Box>
  );
};

export default memo(GeneralCampaign);
