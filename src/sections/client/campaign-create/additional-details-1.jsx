import PropTypes from 'prop-types';

import { Box, Grid, Stack, FormLabel } from '@mui/material';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import { RHFUploadCover } from 'src/components/hook-form/rhf-upload-cover';

import ChipSelect from 'src/sections/campaign/create/components/chip-select';
import FileDropList from 'src/sections/campaign/create/components/file-drop-list';
import { multiLineSx, helperTextSx } from 'src/sections/campaign/create/components/field-styles';

// ----------------------------------------------------------------------

// `aside` is the second half of a long label, in light grey so the field name reads first
const FormField = ({ label, aside, children, required = false, sx }) => (
  <Stack spacing={0.75} sx={sx}>
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
      {aside && (
        <Box component="span" sx={{ fontWeight: 400, color: '#8E8E93' }}>
          {' – '}
          {aside}
        </Box>
      )}
    </FormLabel>
    {children}
  </Stack>
);

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  aside: PropTypes.string,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
  sx: PropTypes.object,
};

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

// ----------------------------------------------------------------------

export default function AdditionalDetails1() {
  return (
    <Box sx={{ maxWidth: '816px', mx: 'auto', mb: { xs: 10, sm: 12 }, ...helperTextSx }}>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6}>
          <Stack spacing={2}>
            <FormField label="Preferred Platform" aside="Choose up to 2">
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

            <FormField label="Main Message/Theme" aside="What's the core message?">
              <RHFTextField
                name="mainMessage"
                placeholder="The one idea creators should get across"
                size="small"
                multiline
                sx={multiLineSx}
              />
            </FormField>

            <FormField label="Key Points to Cover" aside="USP of the product/brand">
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

            {/* Grows to the left column's height, so both columns end level */}
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
  );
}
