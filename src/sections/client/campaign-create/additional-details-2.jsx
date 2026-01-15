import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';

import { Box, Grid, Stack, MenuItem, FormLabel, Typography } from '@mui/material';

import { RHFSelectV2, RHFTextField } from 'src/components/hook-form';

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

// ----------------------------------------------------------------------

AdditionalDetails2.propTypes = {
  // Add any props as needed when fields are defined
};

export default function AdditionalDetails2() {
  useFormContext();

  return (
    <Box sx={{ maxWidth: '850px', mx: 'auto', mb: 12, mt: 8 }}>
      <Grid container spacing={2} mb={4}>
        {/* Column One */}
        <Grid item xs={12} sm={6}>
          {/* Hashtags to Use */}
          <FormField label="Hashtags to Use">
            <RHFTextField
              name="hashtagsToUse"
              placeholder="Hashtags to Use"
            />
          </FormField>

          {/* Mentions/Tags Required */}
          <FormField label="Mentions/Tags Required">
            <Typography variant='caption' color="#8E8E93" mt={-1} mb={0.5}>[Eg:- @brandname]</Typography>
            <RHFTextField
              name="mentionsTagsRequired"
              placeholder="Mentions/Tags"
            />
          </FormField>

          {/* Creator Compensation - Value to Creator */}
          <FormField label="Creator Compensation - Value to Creator">
            <RHFTextField
              name="creatorCompensation"
              placeholder="Creator Compensation"
            />
          </FormField>

          {/* Call to Action - Desired Action */}
          <FormField label="Call to Action - Desired Action">
            <Typography variant='caption' color="#8E8E93" mt={-1} mb={0.5}>[E.g., &quot;Visit website,&quot; &quot;Use promo code,&quot; &quot;Sign up&quot;]</Typography>
            <RHFTextField
              name="ctaDesiredAction"
              placeholder="Desired Action"
            />
          </FormField>

          {/* Call to Action - Link/URL */}
          <FormField label="Call to Action - Link/URL">
            <RHFTextField
              name="ctaLinkUrl"
              placeholder="Link/URL"
              type="url"
            />
          </FormField>
        </Grid>

        {/* Column Two */}
        <Grid item xs={12} sm={6}>
          {/* Call to Action - Promo Code */}
          <FormField label="Call to Action - Promo Code">
            <RHFTextField
              name="ctaPromoCode"
              placeholder="Promo Code"
            />
          </FormField>

          {/* Call to Action - Link in Bio Requirements */}
          <FormField label="Call to Action - Link in Bio Requirements [Additional Charges Apply]">
            <RHFTextField
              name="ctaLinkInBioRequirements"
              placeholder="Link in Bio Requirements"
            />
          </FormField>

          {/* Special Notes/Instructions */}
          <FormField label="Special Notes/Instructions">
            <RHFTextField
              name="specialNotesInstructions"
              placeholder="Special Notes/Instructions"
            />
          </FormField>

          {/* Do you need ads? */}
          <FormField label="Do you need ads?">
            <Typography variant='caption' color="#8E8E93" mt={-1} mb={0.5}>Ads are added charges of RM300 per video for 1 month for MY and ID Market, $300 per video for SG</Typography>
            <RHFSelectV2
              name="needAds"
              placeholder="Select an option"
            >
              <MenuItem value="yes">Yes</MenuItem>
              <MenuItem value="no">No</MenuItem>
            </RHFSelectV2>
          </FormField>
        </Grid>
      </Grid>
    </Box>
  );
}
