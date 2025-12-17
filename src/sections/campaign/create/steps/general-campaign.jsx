import useSWR from 'swr';
import React, { memo, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { Box, Stack, MenuItem, FormLabel, Typography } from '@mui/material';

import socket from 'src/hooks/socket';

import { fetcher, endpoints } from 'src/utils/axios';

import { interestsLists } from 'src/contants/interestLists';

import Label from 'src/components/label';
import { RHFSelect, RHFTextField } from 'src/components/hook-form';

// eslint-disable-next-line react/prop-types
const FormField = ({ label, children }) => (
  <Stack spacing={1}>
    <FormLabel
      required
      sx={{
        fontWeight: 600,
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

  return (
    <>
      <Stack alignItems="self-end" spacing={0.5}>
        <Typography variant="subtitle2">Campaign ID</Typography>
        {!isLoading && <Label color="info">C0{data + 1}</Label>}
      </Stack>

      <Box
        gap={2}
        display="grid"
        mt={4}
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
        }}
      >
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
        <FormField label="Campaign Objectives">
          <RHFSelect name="campaignObjectives">
            <MenuItem value="New Product Launch">New Product Launch</MenuItem>
            <MenuItem value="New Service Launch">New Service Launch</MenuItem>
            <MenuItem value="Increase Brand Awareness">Increase Brand Awareness</MenuItem>
            <MenuItem value="Drive Product Awareness">Drive Product Awareness</MenuItem>
            <MenuItem value="Drive Service Awareness">Drive Service Awareness</MenuItem>
            <MenuItem value="Increase Purchase Intent">Increase Purchase Intent</MenuItem>
            <MenuItem value="Increase Reach of Audience">Increase Reach of Audience</MenuItem>
          </RHFSelect>
        </FormField>
        <FormField label="Industry">
          <RHFSelect name="campaignIndustries">
            {interestsLists.map((item, index) => (
              <MenuItem key={index} value={item}>
                {item}
              </MenuItem>
            ))}
          </RHFSelect>
        </FormField>
      </Box>
    </>
  );
};

export default memo(GeneralCampaign);
