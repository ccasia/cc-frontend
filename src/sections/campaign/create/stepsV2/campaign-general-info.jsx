import useSWR from 'swr';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import React, { memo, useRef, useState, useEffect } from 'react';

import { DatePicker } from '@mui/x-date-pickers';
import { Box, Grid, Stack, FormLabel, Typography, InputAdornment } from '@mui/material';

import socket from 'src/hooks/socket';

import { fetcher, endpoints } from 'src/utils/axios';

import { interestsLists } from 'src/contants/interestLists';

import Label from 'src/components/label';
import { RHFTextField } from 'src/components/hook-form';
import { RHFUploadCover } from 'src/components/hook-form/rhf-upload-cover';

import ChipSelect from '../components/chip-select';
import { bulletInputProps } from '../components/bullet-text';
import CampaignCardPreview from '../components/campaign-card-preview';
import useScrollToFirstError from '../components/use-scroll-to-first-error';
import { multiLineSx, singleLineSx, helperTextSx } from '../components/field-styles';

const NAME_MAX = 40;

// On short or zoomed-in screens the box stops growing sooner, so the fields below stay in reach
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

const formatCampaignId = (n) => `C${String(n).padStart(2, '0')}`;

const formatPeriod = (start, end) => {
  if (!start || !end) return null;
  const days = dayjs(end).startOf('day').diff(dayjs(start).startOf('day'), 'day');
  if (Number.isNaN(days) || days < 0) return null;
  if (days === 0) return 'Same day';
  return days === 1 ? '1 day' : `${days} days`;
};

// Builds on singleLineSx, so the tint keeps the field's height: the two share the
// '& .MuiOutlinedInput-root' key, and a plain spread would drop the height
const autoFillSx = {
  ...singleLineSx,
  '@keyframes autoFillTint': {
    from: { backgroundColor: 'rgba(19, 64, 255, 0.1)' },
    to: { backgroundColor: 'rgba(19, 64, 255, 0)' },
  },
  '& .MuiOutlinedInput-root': {
    ...singleLineSx['& .MuiOutlinedInput-root'],
    animation: 'autoFillTint 700ms cubic-bezier(0.23, 1, 0.32, 1)',
  },
};

const FormField = ({ label, hint, aside, children, required = true }) => (
  <Stack spacing={0.75}>
    <Stack spacing={0.25}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
        <FormLabel
          required={required}
          sx={{
            fontWeight: 700,
            color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
            fontSize: '0.875rem',
            '& .MuiFormLabel-asterisk': {
              display: required ? 'inline-block' : 'none',
              color: '#FF3500',
            },
          }}
        >
          {label}
        </FormLabel>
        {aside && (
          <Typography
            variant="caption"
            color="#8E8E93"
            sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
          >
            {aside}
          </Typography>
        )}
      </Stack>
      {hint && (
        <Typography variant="caption" color="#8E8E93">
          {hint}
        </Typography>
      )}
    </Stack>
    {children}
  </Stack>
);

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  aside: PropTypes.string,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
};

const datePickerSlotProps = (placeholder, error, autoFilled = false) => ({
  textField: {
    fullWidth: true,
    placeholder,
    size: 'small',
    error: !!error,
    helperText: error?.message,
    inputProps: { 'aria-label': placeholder },
    sx: autoFilled ? autoFillSx : singleLineSx,
  },
});

const CampaignGeneralInfo = () => {
  const { data, mutate } = useSWR(endpoints.campaign.total, fetcher);
  const {
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useFormContext();
  const containerRef = useRef(null);
  const [autoFilledField, setAutoFilledField] = useState(null);

  const campaignName = watch('campaignName') ?? '';

  // Campaign timeline
  const startDate = watch('campaignStartDate');
  const endDate = watch('campaignEndDate');

  // Posting timeline
  const postingStartDate = watch('postingStartDate');
  const postingEndDate = watch('postingEndDate');

  const campaignId = typeof data === 'number' ? formatCampaignId(data + 1) : null;

  useEffect(() => {
    if (!socket) return undefined;
    const handleCampaign = () => mutate();
    socket.on('campaign', handleCampaign);
    return () => socket.off('campaign', handleCampaign);
  }, [mutate]);

  useEffect(() => {
    if (campaignId) setValue('campaignId', campaignId);

    // Initialize multi-select fields with empty arrays if they're undefined
    if (!watch('campaignObjectives')) {
      setValue('campaignObjectives', []);
    }
    if (!watch('campaignIndustries')) {
      setValue('campaignIndustries', []);
    }
  }, [setValue, campaignId, watch]);

  useEffect(() => {
    if (startDate && !endDate) {
      const start = dayjs(startDate);
      if (start.isValid()) {
        setValue('campaignEndDate', start.add(14, 'day').toDate());
        setAutoFilledField('campaignEndDate');
      }
    }
  }, [startDate, endDate, setValue]);

  useEffect(() => {
    if (postingStartDate && !postingEndDate) {
      const start = dayjs(postingStartDate);
      if (start.isValid()) {
        setValue('postingEndDate', start.add(7, 'day').toDate());
        setAutoFilledField('postingEndDate');
      }
    }
  }, [postingStartDate, postingEndDate, setValue]);

  useScrollToFirstError(containerRef);

  useEffect(() => {
    if (!autoFilledField) return undefined;
    const timer = setTimeout(() => setAutoFilledField(null), 700);
    return () => clearTimeout(timer);
  }, [autoFilledField]);

  const handleDateChange = (name) => (value) => setValue(name, value, { shouldValidate: true });

  // Spaces at the ends are invisible, so remove them before they get saved
  const tidyOnBlur = (name, tidy) => () => {
    const value = getValues(name);
    if (typeof value !== 'string') return;
    const next = tidy(value);
    if (next !== value) setValue(name, next, { shouldDirty: true, shouldValidate: !!errors[name] });
  };
  const trimText = (value) => value.trim();
  const addProtocol = (value) => {
    const trimmed = value.trim();
    return trimmed && !/^https?:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed;
  };

  return (
    <Box ref={containerRef} sx={{ maxWidth: '816px', mx: 'auto', mb: 8, ...helperTextSx }}>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={3}>
        <Typography variant="caption" color="#8E8E93">
          Campaign ID
        </Typography>
        <Label
          color="info"
          aria-hidden={!campaignId}
          sx={{ minWidth: 48, opacity: campaignId ? 1 : 0, transition: 'opacity 150ms ease' }}
        >
          {campaignId ?? 'C00'}
        </Label>
      </Stack>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={6}>
          <FormField label="Campaign Name">
            <RHFTextField
              name="campaignName"
              placeholder="Campaign name"
              size="small"
              inputProps={{ maxLength: NAME_MAX, onBlur: tidyOnBlur('campaignName', trimText) }}
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
            <FormField label="Campaign Info">
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

            <FormField
              label="About the Brand"
              hint="Let us know a bit more about the brand!"
              required={false}
            >
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

            <FormField label="Campaign Period" aside={formatPeriod(startDate, endDate)}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DatePicker
                    value={startDate ? dayjs(startDate).toDate() : null}
                    onChange={handleDateChange('campaignStartDate')}
                    slotProps={datePickerSlotProps('Start date', errors.campaignStartDate)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DatePicker
                    value={endDate ? dayjs(endDate).toDate() : null}
                    minDate={startDate ? dayjs(startDate).toDate() : undefined}
                    onChange={handleDateChange('campaignEndDate')}
                    slotProps={datePickerSlotProps(
                      'End date',
                      errors.campaignEndDate,
                      autoFilledField === 'campaignEndDate'
                    )}
                  />
                </Grid>
              </Grid>
            </FormField>

            <FormField
              label="Posting Period"
              aside={formatPeriod(postingStartDate, postingEndDate)}
            >
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DatePicker
                    value={postingStartDate ? dayjs(postingStartDate).toDate() : null}
                    onChange={handleDateChange('postingStartDate')}
                    slotProps={datePickerSlotProps('Start date', errors.postingStartDate)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DatePicker
                    value={postingEndDate ? dayjs(postingEndDate).toDate() : null}
                    minDate={postingStartDate ? dayjs(postingStartDate).toDate() : undefined}
                    onChange={handleDateChange('postingEndDate')}
                    slotProps={datePickerSlotProps(
                      'End date',
                      errors.postingEndDate,
                      autoFilledField === 'postingEndDate'
                    )}
                  />
                </Grid>
              </Grid>
            </FormField>
          </Stack>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Stack spacing={2}>
            <FormField label="Product/Service Name">
              <RHFTextField
                name="productName"
                placeholder="Product or service name"
                size="small"
                inputProps={{ onBlur: tidyOnBlur('productName', trimText) }}
                sx={singleLineSx}
              />
            </FormField>

            <FormField label="Website Link" required={false}>
              <RHFTextField
                name="websiteLink"
                placeholder="https://www.cultcreativeasia.com"
                size="small"
                inputProps={{
                  inputMode: 'url',
                  autoCapitalize: 'none',
                  spellCheck: false,
                  onBlur: tidyOnBlur('websiteLink', addProtocol),
                }}
                sx={singleLineSx}
              />
            </FormField>

            <FormField label="Campaign Image">
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
  );
};

export default memo(CampaignGeneralInfo);
