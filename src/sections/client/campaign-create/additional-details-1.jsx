import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';

import { Box, Grid, Stack, FormLabel, Typography } from '@mui/material';

import { RHFUpload } from 'src/components/hook-form/rhf-upload';
import { RHFTextField, RHFMultiSelect } from 'src/components/hook-form';
import { RHFUploadCover } from 'src/components/hook-form/rhf-upload-cover';

// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------

AdditionalDetails1.propTypes = {
  // Add any props as needed when fields are defined
};

export default function AdditionalDetails1() {
  const { setValue, watch } = useFormContext();

  return (
    <Box sx={{ maxWidth: '816px', mx: 'auto', mb: 12, mt: 8 }}>
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
            <RHFTextField
              name="mainMessage"
              placeholder="Core Message"
            />
          </FormField>

          {/* Key Points to Cover */}
          <FormField label="Key Points to Cover - USP of the product/brand">
            <RHFTextField
              name="keyPoints"
              placeholder="Key Points"
              multiline
            />
          </FormField>

          {/* Tone & Style */}
          <FormField label="Tone & Style">
            <Typography variant='caption' color="#8E8E93" mt={-1} mb={0.5}>[Eg:- Educational / Entertaining / Inspirational / Authentic/Raw / Professional / Humorous / Other]</Typography>
            <RHFTextField
              name="toneAndStyle"
              placeholder="Tone & Style"
              multiline
            />
          </FormField>
        </Grid>

        {/* Column Two */}
        <Grid item xs={12} sm={6}>
          {/* Brand Guidelines Document */}
          <FormField label="Brand Guidelines Document">
            <RHFUpload
              name="brandGuidelines"
              maxSize={20971520} // 20MB
              accept={{
                'application/pdf': ['.pdf'],
                'image/jpeg': ['.jpeg', '.jpg'],
                'image/png': ['.png']
              }}
              multiple
              onDrop={(acceptedFiles) => {
                const files = watch('brandGuidelines') || [];
                const newFiles = acceptedFiles.map((file) =>
                  Object.assign(file, {
                    preview: URL.createObjectURL(file),
                  })
                );
                setValue('brandGuidelines', [...files, ...newFiles], { shouldValidate: true });
              }}
              onRemove={(inputFile) => {
                const files = watch('brandGuidelines') || [];
                setValue(
                  'brandGuidelines',
                  files.filter((file) => file !== inputFile),
                  { shouldValidate: true }
                );
              }}
              onRemoveAll={() => setValue('brandGuidelines', [], { shouldValidate: true })}
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
                />
              </FormField>
            </Grid>
          </Grid>          
        </Grid>
      </Grid>
    </Box>
  );
}
