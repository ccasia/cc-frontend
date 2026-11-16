import PropTypes from 'prop-types';

import { Box, Grid, Stack, FormLabel } from '@mui/material';

import { RHFTextField } from 'src/components/hook-form';

import ChipSelect from 'src/sections/campaign/create/components/chip-select';
import {
  multiLineSx,
  singleLineSx,
  helperTextSx,
} from 'src/sections/campaign/create/components/field-styles';

// ----------------------------------------------------------------------

const greySx = { fontWeight: 400, color: '#8E8E93' };

// `prefix` and `aside` are the context parts of a long label, in light grey,
// so the field name reads first
const FormField = ({ label, prefix, aside, children, required = false, sx }) => (
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
      {prefix && (
        <Box component="span" sx={greySx}>
          {prefix}
          {' – '}
        </Box>
      )}
      {label}
      {aside && (
        <Box component="span" sx={greySx}>
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
  prefix: PropTypes.string,
  aside: PropTypes.string,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
  sx: PropTypes.object,
};

const CTA = 'Call to Action';

const AD_OPTIONS = ['yes', 'no'];
const AD_TITLES = { yes: 'Yes', no: 'No' };
const adTitle = (option) => AD_TITLES[option] ?? option;

// The textarea fills what is left of the column, so both columns end level
const fillSx = {
  ...multiLineSx,
  flex: 1,
  '& .MuiOutlinedInput-root': {
    ...multiLineSx['& .MuiOutlinedInput-root'],
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  // Grows with the box; never shorter than 3 lines
  '& .MuiInputBase-inputMultiline': {
    ...multiLineSx['& .MuiInputBase-inputMultiline'],
    flex: 1,
    height: 'auto !important',
    minHeight: 66,
    overflow: 'auto !important',
  },
};

// ----------------------------------------------------------------------

export default function AdditionalDetails2() {
  return (
    <Box sx={{ maxWidth: '816px', mx: 'auto', mb: { xs: 10, sm: 12 }, ...helperTextSx }}>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Stack spacing={2} sx={{ flex: 1 }}>
            <FormField label="Hashtags to Use">
              <RHFTextField
                name="hashtagsToUse"
                placeholder="#brandname #campaign"
                size="small"
                inputProps={{ autoCapitalize: 'none', spellCheck: false }}
                sx={singleLineSx}
              />
            </FormField>

            <FormField label="Mentions/Tags Required">
              <RHFTextField
                name="mentionsTagsRequired"
                placeholder="Accounts creators must tag"
                helperText="E.g. @brandname"
                size="small"
                inputProps={{ autoCapitalize: 'none', spellCheck: false }}
                sx={singleLineSx}
              />
            </FormField>

            <FormField label="Creator Compensation" aside="Value to Creator">
              <RHFTextField
                name="creatorCompensation"
                placeholder="What creators get, e.g. free product or a fee"
                size="small"
                multiline
                sx={multiLineSx}
              />
            </FormField>

            <FormField label="Special Notes/Instructions" sx={{ flex: 1 }}>
              <RHFTextField
                name="specialNotesInstructions"
                placeholder="Anything else creators should know"
                size="small"
                multiline
                minRows={3}
                sx={fillSx}
              />
            </FormField>
          </Stack>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Stack spacing={2}>
            <FormField prefix={CTA} label="Desired Action">
              <RHFTextField
                name="ctaDesiredAction"
                placeholder="What viewers should do"
                helperText='E.g. "Visit website", "Use promo code", "Sign up"'
                size="small"
                multiline
                sx={multiLineSx}
              />
            </FormField>

            <FormField prefix={CTA} label="Link/URL">
              <RHFTextField
                name="ctaLinkUrl"
                placeholder="https://"
                type="url"
                size="small"
                inputProps={{ inputMode: 'url', autoCapitalize: 'none', spellCheck: false }}
                sx={singleLineSx}
              />
            </FormField>

            <FormField prefix={CTA} label="Promo Code">
              <RHFTextField
                name="ctaPromoCode"
                placeholder="Promo code"
                size="small"
                inputProps={{ autoCapitalize: 'characters', spellCheck: false }}
                sx={singleLineSx}
              />
            </FormField>

            <FormField
              prefix={CTA}
              label="Link in Bio Requirements"
              aside="Additional Charges Apply"
            >
              <RHFTextField
                name="ctaLinkInBioRequirements"
                placeholder="What goes in the bio link, and for how long"
                size="small"
                multiline
                sx={multiLineSx}
              />
            </FormField>

            <FormField label="Do you need ads?">
              <Box>
                <ChipSelect
                  name="needAds"
                  options={AD_OPTIONS}
                  getTitle={adTitle}
                  placeholder="Select an option"
                  single
                  clearable
                />
                <Box
                  component="p"
                  sx={{ m: 0, mt: 0.75, fontSize: 12, lineHeight: '16px', color: '#8E8E93' }}
                >
                  Ads are added charges of RM300 per video for 1 month for MY and ID Market, $300
                  per video for SG
                </Box>
              </Box>
            </FormField>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
