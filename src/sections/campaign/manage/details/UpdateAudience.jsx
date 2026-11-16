import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { useReducedMotion } from 'framer-motion';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { memo, useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Fade, Grid, Stack, Collapse, ButtonBase, Typography } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { countries } from 'src/assets/data';
import { langList } from 'src/contants/language';
import { countriesCities } from 'src/contants/countries';
import { interestsLists } from 'src/contants/interestLists';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';
import { SECONDARY_ACTION_SX } from 'src/components/campaign/action-button-styles';

import ChipSelect from 'src/sections/campaign/create/components/chip-select';
import { pressSx, EASE_OUT, pressTransition } from 'src/sections/campaign/create/components/motion';
import {
  multiLineSx,
  FIELD_HEIGHT,
  singleLineSx,
  helperTextSx,
} from 'src/sections/campaign/create/components/field-styles';

import FormField from './components/form-field';

// Both headings get this height, so the two columns stay level with the button shown
const REMOVE_HEIGHT = 28;

const SectionTitle = ({ children, action }) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    spacing={1}
    sx={{ mb: 1.5, minHeight: REMOVE_HEIGHT }}
  >
    <Typography
      sx={{
        fontWeight: 700,
        fontSize: 15,
        color: (theme) => (theme.palette.mode === 'light' ? '#000' : '#fff'),
      }}
    >
      {children}
    </Typography>
    {action}
  </Stack>
);

SectionTitle.propTypes = { children: PropTypes.node, action: PropTypes.node };

const removeButtonSx = {
  ...SECONDARY_ACTION_SX,
  height: REMOVE_HEIGHT,
  gap: 0.5,
  px: 1.25,
  pt: '5px',
  pb: '7px',
  borderRadius: '6px',
  fontSize: 13,
  lineHeight: '16px',
  color: '#3A3A3C',
};

const textButtonSx = {
  height: 22,
  px: 0.75,
  gap: 0.5,
  borderRadius: 0.75,
  fontSize: 13,
  fontWeight: 600,
  color: '#637381',
  transition: `${pressTransition}, color 150ms ease`,
  '@media (hover: hover) and (pointer: fine)': {
    '&:hover': { bgcolor: '#F4F6F8', color: '#212B36' },
  },
  ...pressSx,
};

const addButtonSx = {
  ...SECONDARY_ACTION_SX,
  width: 1,
  height: FIELD_HEIGHT,
  justifyContent: 'flex-start',
  gap: 1,
  pl: '14px',
  pr: 2,
  pb: '13px',
  fontSize: 14,
  color: '#3A3A3C',
};

// ChipSelect stores the value; the label is what the chip and the menu show
const titleFrom = (list) => {
  const labels = new Map(list.map((option) => [option.value, option.label]));
  return (value) => labels.get(value) ?? value;
};

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'nonbinary', label: 'Non-Binary' },
];
const GENDERS = GENDER_OPTIONS.map((option) => option.value);
const genderTitle = titleFrom(GENDER_OPTIONS);

const AGES = ['18-25', '26-34', '35-40', '>40'];

// Malay and English first, then the other languages A to Z
const LANGUAGES = (() => {
  const preferred = ['Malay', 'English'];
  const rest = langList
    .filter((language) => !preferred.includes(language))
    .sort((a, b) => a.localeCompare(b));
  return [...preferred, ...rest];
})();

const INTEREST_OPTIONS = interestsLists.map((item) => ({ value: item.toLowerCase(), label: item }));
const INTERESTS = INTEREST_OPTIONS.map((option) => option.value);
const interestTitle = titleFrom(INTEREST_OPTIONS);

const COUNTRIES = Object.keys(countriesCities);

const GEOGRAPHIC_FOCUS_OPTIONS = [
  { value: 'SEAregion', label: 'SEA Region' },
  { value: 'global', label: 'Global' },
  { value: 'EastMalaysia', label: 'East Malaysia', malaysiaOnly: true },
  { value: 'KualaLumpur', label: 'Kuala Lumpur', malaysiaOnly: true },
  { value: 'others', label: 'Others' },
];
const geographicTitle = titleFrom(GEOGRAPHIC_FOCUS_OPTIONS);

const SECONDARY_FIELDS = [
  'secondaryAudienceGender',
  'secondaryAudienceAge',
  'secondaryCountry',
  'secondaryAudienceLanguage',
  'secondaryAudienceCreatorPersona',
  'secondaryAudienceUserPersona',
];

const hasValue = (value) => (Array.isArray(value) ? value.length > 0 : !!value);
const emptyOf = (value) => (Array.isArray(value) ? [] : '');

// The country list uses its own names; these differ from the ISO list
const FLAG_ALIASES = {
  Brunei: 'BN',
  Congo: 'CG',
  'Hashemite Kingdom of Jordan': 'JO',
  Iran: 'IR',
  Macedonia: 'MK',
  'Myanmar [Burma]': 'MM',
  Palestine: 'PS',
  'Republic of Korea': 'KR',
  'Republic of Lithuania': 'LT',
  'Republic of Moldova': 'MD',
  Russia: 'RU',
  Taiwan: 'TW',
  Tanzania: 'TZ',
  'U.S. Virgin Islands': 'VI',
};
const ISO_CODES = new Map(countries.map((c) => [c.label.toLowerCase(), c.code]));
const flagIcon = (name) => {
  const code = name && (FLAG_ALIASES[name] ?? ISO_CODES.get(name.toLowerCase()));
  return code ? `circle-flags:${code.toLowerCase()}` : null;
};

const Flag = ({ name, size = 20, sx, ...other }) => {
  const icon = flagIcon(name);
  return icon ? (
    <Iconify icon={icon} width={size} sx={{ flexShrink: 0, ...sx }} {...other} />
  ) : (
    <Box sx={{ width: size, flexShrink: 0, ...sx }} {...other} />
  );
};

Flag.propTypes = { name: PropTypes.string, size: PropTypes.number, sx: PropTypes.object };

const renderFlag = (name) => <Flag name={name} size={16} />;

const AudienceFields = ({ prefix, required, country }) => {
  const name = (field) => (prefix ? `${prefix}${field}` : `audience${field}`);
  return (
    <>
      <FormField label="Gender" required={required}>
        <ChipSelect
          name={name('Gender')}
          options={GENDERS}
          getTitle={genderTitle}
          placeholder="Select gender"
        />
      </FormField>
      <FormField label="Age" required={required}>
        <ChipSelect name={name('Age')} options={AGES} placeholder="Select age range" />
      </FormField>
      {country}
      <FormField label="Language" required={required}>
        <ChipSelect
          name={name('Language')}
          options={LANGUAGES}
          placeholder="Select language"
          noOptionsText="No matching language"
        />
      </FormField>
      <FormField label="Creator Interests" required={required}>
        <ChipSelect
          name={name('CreatorPersona')}
          options={INTERESTS}
          getTitle={interestTitle}
          placeholder="Select interests"
          noOptionsText="No matching interest"
        />
      </FormField>
      <FormField label="User Persona" required={required}>
        <RHFTextField
          name={name('UserPersona')}
          placeholder="Who is this audience? e.g. new mums who shop online"
          size="small"
          multiline
          sx={multiLineSx}
        />
      </FormField>
    </>
  );
};

AudienceFields.propTypes = {
  prefix: PropTypes.string,
  required: PropTypes.bool,
  country: PropTypes.node,
};

// Validation schema
const UpdateAudienceSchema = Yup.object().shape({
  // Primary Audience
  audienceGender: Yup.array().min(1, 'At least one gender is required'),
  audienceAge: Yup.array().min(1, 'At least one age group is required'),
  country: Yup.string().required('Country is required'),
  audienceLanguage: Yup.array().min(1, 'At least one language is required'),
  audienceCreatorPersona: Yup.array().min(1, "At least one creator's interest is required"),
  audienceUserPersona: Yup.string().required('User persona is required'),
  // Secondary Audience (optional)
  secondaryAudienceGender: Yup.array(),
  secondaryAudienceAge: Yup.array(),
  secondaryCountry: Yup.string().nullable(),
  secondaryAudienceLanguage: Yup.array(),
  secondaryAudienceCreatorPersona: Yup.array(),
  secondaryAudienceUserPersona: Yup.string().nullable(),
  // Geographic Focus
  geographicFocus: Yup.string().required('Geographic focus is required'),
  geographicFocusOthers: Yup.string().when('geographicFocus', {
    is: 'others',
    then: (schema) => schema.required('Please specify the geographic focus'),
    otherwise: (schema) => schema.nullable(),
  }),
});

const UpdateAudience = ({ campaign, campaignMutate, formId, onFormStateChange }) => {
  // Get existing values from campaign
  const defaultValues = useMemo(
    () => ({
      // Primary Audience
      audienceGender: campaign?.campaignRequirement?.gender || [],
      audienceAge: campaign?.campaignRequirement?.age || [],
      country: campaign?.campaignRequirement?.country || '',
      audienceLanguage: campaign?.campaignRequirement?.language || [],
      audienceCreatorPersona: campaign?.campaignRequirement?.creator_persona || [],
      audienceUserPersona: campaign?.campaignRequirement?.user_persona || '',
      // Secondary Audience
      secondaryAudienceGender: campaign?.campaignRequirement?.secondary_gender || [],
      secondaryAudienceAge: campaign?.campaignRequirement?.secondary_age || [],
      secondaryCountry: campaign?.campaignRequirement?.secondary_country || '',
      secondaryAudienceLanguage: campaign?.campaignRequirement?.secondary_language || [],
      secondaryAudienceCreatorPersona: campaign?.campaignRequirement?.secondary_creator_persona || [],
      secondaryAudienceUserPersona: campaign?.campaignRequirement?.secondary_user_persona || '',
      // Geographic Focus
      geographicFocus: campaign?.campaignRequirement?.geographic_focus || '',
      geographicFocusOthers: campaign?.campaignRequirement?.geographicFocusOthers || '',
    }),
    [campaign]
  );

  const methods = useForm({
    resolver: yupResolver(UpdateAudienceSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
    formState: { isSubmitting, isDirty },
  } = methods;

  // Reset form when campaign data changes
  useEffect(() => {
    if (campaign) {
      reset(defaultValues);
    }
  }, [campaign, defaultValues, reset]);

  useEffect(() => {
    onFormStateChange?.({ isDirty, isSubmitting });
  }, [isDirty, isSubmitting, onFormStateChange]);

  const country = watch('country');
  const geographicFocus = watch('geographicFocus');
  const secondaryFilled = watch(SECONDARY_FIELDS).some(hasValue);

  // Determine which Geographic Focus options to show
  const showMalaysiaOptions = country === 'Malaysia';
  const geographicOptions = GEOGRAPHIC_FOCUS_OPTIONS.filter(
    (o) => showMalaysiaOptions || !o.malaysiaOnly
  ).map((o) => o.value);

  const reduceMotion = useReducedMotion();
  const secondaryRef = useRef(null);
  const othersRef = useRef(null);
  const focusSecondary = useRef(false);
  const addButtonRef = useRef(null);
  const removing = useRef(false);

  // Saved secondary data opens the section by itself; it never closes while in use
  const [showSecondary, setShowSecondary] = useState(secondaryFilled);
  useEffect(() => {
    if (secondaryFilled && !removing.current) setShowSecondary(true);
  }, [secondaryFilled]);

  // What a Remove took away, so Undo can put it back; null when there is nothing to undo
  const [removed, setRemoved] = useState(null);

  const addSecondary = () => {
    removing.current = false;
    focusSecondary.current = true;
    setRemoved(null);
    setShowSecondary(true);
  };

  // The fields empty only after the section has closed, so they do not blank out mid-motion
  const removeSecondary = () => {
    removing.current = true;
    const values = getValues(SECONDARY_FIELDS);
    setRemoved(values.some(hasValue) ? values : null);
    setShowSecondary(false);
  };

  const clearRemoved = () => {
    if (!removing.current) return;
    removing.current = false;
    SECONDARY_FIELDS.forEach((field, i) => {
      const value = removed ? removed[i] : getValues(field);
      setValue(field, emptyOf(value), { shouldDirty: true });
    });
    addButtonRef.current?.focus();
  };

  const undoRemove = () => {
    removing.current = false;
    SECONDARY_FIELDS.forEach((field, i) => setValue(field, removed[i], { shouldDirty: true }));
    setRemoved(null);
    setShowSecondary(true);
  };

  const othersTimeout = reduceMotion ? 0 : { enter: 250, exit: 150 };
  const sectionTimeout = reduceMotion ? 0 : { enter: 250, exit: 200 };
  const removeFadeTimeout = reduceMotion ? 0 : { enter: 150, exit: 100 };
  const showOthers = geographicFocus === 'others';
  const othersFadeMs = showOthers ? othersTimeout.enter : othersTimeout.exit;

  const onSubmit = useCallback(
    async (data) => {
      try {
        // Payload matching editCampaignRequirements controller
        const payload = {
          campaignId: campaign?.id,
          // Primary Audience
          audienceGender: data.audienceGender,
          audienceAge: data.audienceAge,
          audienceLanguage: data.audienceLanguage,
          audienceCreatorPersona: data.audienceCreatorPersona,
          audienceUserPersona: data.audienceUserPersona,
          country: data.country,
          // Secondary Audience
          secondaryAudienceGender: data.secondaryAudienceGender,
          secondaryAudienceAge: data.secondaryAudienceAge,
          secondaryAudienceLanguage: data.secondaryAudienceLanguage,
          secondaryAudienceCreatorPersona: data.secondaryAudienceCreatorPersona,
          secondaryAudienceUserPersona: data.secondaryAudienceUserPersona,
          secondaryCountry: data.secondaryCountry,
          // Geographic Focus
          geographicFocus: data.geographicFocus,
          geographicFocusOthers: data.geographicFocus === 'others' ? data.geographicFocusOthers : null,
        };

        await axiosInstance.patch(endpoints.campaign.editCampaignRequirements, payload);

        enqueueSnackbar('Target audience updated successfully!', { variant: 'success' });

        if (campaignMutate) {
          campaignMutate();
        }
      } catch (error) {
        console.error('Error updating requirements:', error);
        enqueueSnackbar(error?.message || 'Failed to update requirements', { variant: 'error' });
      }
    },
    [campaign?.id, campaignMutate]
  );

  return (
    <FormProvider id={formId} methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ maxWidth: '816px', ...helperTextSx }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SectionTitle>Primary Audience</SectionTitle>
            <Stack spacing={2}>
              <AudienceFields
                required
                country={
                  <>
                    <FormField label="Country" required>
                      <ChipSelect
                        single
                        name="country"
                        options={COUNTRIES}
                        placeholder="Select country"
                        noOptionsText="No matching country"
                        getIcon={renderFlag}
                      />
                    </FormField>
                    <FormField label="Geographic Focus" required>
                      <ChipSelect
                        single
                        name="geographicFocus"
                        options={geographicOptions}
                        getTitle={geographicTitle}
                        placeholder="Select geographic focus"
                      />
                      <Collapse
                        in={showOthers}
                        timeout={othersTimeout}
                        easing={EASE_OUT}
                        onEntered={() => othersRef.current?.focus()}
                        onExited={() => setValue('geographicFocusOthers', '', { shouldDirty: true })}
                      >
                        <Box
                          sx={{
                            pt: 1,
                            opacity: showOthers ? 1 : 0,
                            transition: `opacity ${othersFadeMs ?? 0}ms ${EASE_OUT}`,
                          }}
                        >
                          <RHFTextField
                            name="geographicFocusOthers"
                            placeholder="Type the geographic focus"
                            size="small"
                            inputRef={othersRef}
                            sx={singleLineSx}
                          />
                        </Box>
                      </Collapse>
                    </FormField>
                  </>
                }
              />
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <SectionTitle
              action={
                <Fade in={showSecondary} timeout={removeFadeTimeout} easing={EASE_OUT} unmountOnExit>
                  <ButtonBase sx={removeButtonSx} onClick={removeSecondary}>
                    <Iconify icon="mingcute:close-line" width={14} />
                    Remove
                  </ButtonBase>
                </Fade>
              }
            >
              Secondary Audience (optional)
            </SectionTitle>
            <Collapse in={!showSecondary} timeout={sectionTimeout} easing={EASE_OUT}>
              <Stack spacing={0.75}>
                {removed ? (
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ height: '20.125px' }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#8E8E93' }}>
                      Secondary audience removed.
                    </Typography>
                    <ButtonBase sx={{ ...textButtonSx, color: '#1340FF' }} onClick={undoRemove}>
                      Undo
                    </ButtonBase>
                  </Stack>
                ) : (
                  <Typography sx={{ fontSize: '0.875rem', lineHeight: '1.4375em', color: '#8E8E93' }}>
                    Reach a second group, like another age range or country.
                  </Typography>
                )}
                <ButtonBase ref={addButtonRef} sx={addButtonSx} onClick={addSecondary}>
                  <Iconify icon="mingcute:add-line" width={18} />
                  Add secondary audience
                </ButtonBase>
              </Stack>
            </Collapse>
            <Collapse
              in={showSecondary}
              timeout={sectionTimeout}
              easing={EASE_OUT}
              onEntered={() => {
                if (!focusSecondary.current) return;
                focusSecondary.current = false;
                secondaryRef.current?.querySelector('[role="combobox"]')?.focus();
              }}
              onExited={clearRemoved}
            >
              <Stack ref={secondaryRef} spacing={2}>
                <AudienceFields
                  prefix="secondaryAudience"
                  required={false}
                  country={
                    <FormField label="Country">
                      <ChipSelect
                        single
                        name="secondaryCountry"
                        options={COUNTRIES}
                        placeholder="Select country"
                        noOptionsText="No matching country"
                        getIcon={renderFlag}
                      />
                    </FormField>
                  }
                />
              </Stack>
            </Collapse>
          </Grid>
        </Grid>
      </Box>
    </FormProvider>
  );
};

UpdateAudience.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
  formId: PropTypes.string,
  onFormStateChange: PropTypes.func,
};

export default memo(UpdateAudience);
