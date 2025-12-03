import React from 'react';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';

import { Box, Chip, Stack, FormLabel, ListItemText } from '@mui/material';

import { langList } from 'src/contants/language';
import { primaryFont } from 'src/theme/typography';
import { interestsLists } from 'src/contants/interestLists';

import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

// import { interestsList } from '../creatorForm';

// const interestsList = [
//   'Art',
//   'Beauty',
//   'Business',
//   'Fashion',
//   'Fitness',
//   'Food',
//   'Gaming',
//   'Health',
//   'Lifestyle',
//   'Music',
//   'Sports',
//   'Technology',
//   'Travel',
//   'Entertainment',
// ];

// Add error icon component
const ErrorIcon = () => (
  <Box
    component="img"
    src="/assets/icons/components/ic_fillpaymenterror.svg"
    sx={{
      width: 20,
      height: 20,
      ml: 1,
      flexShrink: 0,
    }}
  />
);

// Prefer Malay and English at the top, then list remaining languages alphabetically
const LANGUAGE_OPTIONS = (() => {
  const preferredLanguages = ['Malay', 'English'];
  const remainingLanguages = [...langList]
    .filter((language) => !preferredLanguages.includes(language))
    .sort((a, b) => a.localeCompare(b));

  return [...preferredLanguages, ...remainingLanguages];
})();

const FourthStep = ({ item }) => {
  const {
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <ListItemText
        sx={{
          mt: 4,
          textAlign: 'center',
        }}
        primary={item.title}
        secondary={item.description}
        primaryTypographyProps={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: { xs: '28px', sm: '40px' },
          fontWeight: 400,
          color: '#231F20',
        }}
        secondaryTypographyProps={{
          fontFamily: 'InterDisplay',
          fontSize: { xs: '14px', sm: '16px' },
          fontWeight: 400,
          color: '#636366',
          mt: 1,
        }}
      />

      <Stack
        gap={4}
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 900 },
          mx: 'auto',
          my: { xs: 4, sm: 5 },
          px: { xs: 1, sm: 0 },
        }}
      >
        <Stack spacing={1}>
          <FormLabel
            required
            sx={{ fontWeight: 600, color: 'black', fontFamily: primaryFont, fontSize: '14px' }}
          >
            Languages
          </FormLabel>
          <Stack direction="row" alignItems="center">
            <RHFAutocomplete
              name="languages"
              placeholder="Choose at least 1 option"
              multiple
              freeSolo={false}
              disableCloseOnSelect
              options={LANGUAGE_OPTIONS}
              getOptionLabel={(option) => option}
              renderOption={(props, option) => (
                <li {...props} key={option}>
                  {option}
                </li>
              )}
              renderTags={(selected, getTagProps) =>
                selected.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    size="small"
                    color="info"
                    variant="soft"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                      height: { xs: 24, sm: 32 },
                      '& .MuiChip-label': {
                        px: { xs: 1, sm: 1.5 },
                      },
                    }}
                  />
                ))
              }
              sx={{
                flex: 1,
                '& .MuiInputBase-root': {
                  p: { xs: '5px 5px 5px 8px', sm: '7px 9px' },
                },
                '& .MuiAutocomplete-endAdornment': {
                  right: { xs: 6, sm: 9 },
                },
              }}
            />
            {errors.languages && <ErrorIcon />}
          </Stack>
        </Stack>

        <Stack spacing={1}>
          <FormLabel
            required
            sx={{ fontWeight: 600, color: 'black', fontFamily: primaryFont, fontSize: '14px' }}
          >
            Your interests
          </FormLabel>
          <Stack direction="row" alignItems="center">
            <RHFAutocomplete
              name="interests"
              placeholder="Choose at least 3 options"
              multiple
              freeSolo
              disableCloseOnSelect
              options={interestsLists.map((option) => option)}
              getOptionLabel={(option) => option}
              renderOption={(props, option) => (
                <li {...props} key={option}>
                  {option}
                </li>
              )}
              renderTags={(selected, getTagProps) =>
                selected.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    size="small"
                    color="info"
                    variant="soft"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                      height: { xs: 24, sm: 32 },
                      '& .MuiChip-label': {
                        px: { xs: 1, sm: 1.5 },
                      },
                    }}
                  />
                ))
              }
              sx={{
                flex: 1,
                '& .MuiInputBase-root': {
                  p: { xs: '5px 5px 5px 8px', sm: '7px 9px' },
                },
                '& .MuiAutocomplete-endAdornment': {
                  right: { xs: 6, sm: 9 },
                },
              }}
            />
            {errors.interests && <ErrorIcon />}
          </Stack>
        </Stack>
        <Stack spacing={1}>
          <FormLabel sx={{ fontWeight: 600, color: 'black', fontFamily: primaryFont, fontSize: '14px' }}>
            Referral Code
          </FormLabel>
          <Stack direction="row" alignItems="center">
            <RHFTextField
              name="referralCode"
              placeholder="Enter referral code if you have one"
              sx={{
                flex: 1,
                '& .MuiInputBase-root': {
                  height: '48px',
                  borderRadius: '8px',
                },
                '& .MuiInputBase-input': {
                  padding: '12px 14px',
                },
              }}
            />
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Stack spacing={1} flex={1} width="100%">
            <FormLabel
              required
              sx={{
                fontWeight: 600,
                color: 'black',
                fontFamily: primaryFont,
                fontSize: '14px',
                '& .MuiFormLabel-asterisk': {
                  color: 'red',
                },
              }}
            >
              Instagram profile link
            </FormLabel>
            <Stack direction="row" alignItems="center">
              <RHFTextField
                name="instagramProfileLink"
                placeholder="www.instagram.com/username"
                sx={{
                  flex: 1,
                  '& .MuiInputBase-root': {
                    height: '48px',
                    borderRadius: '8px',
                  },
                  '& .MuiInputBase-input': {
                    padding: '12px 14px',
                  },
                }}
              />
              {errors.instagramProfileLink && <ErrorIcon />}
            </Stack>
          </Stack>

          <Box
            sx={{
              fontFamily: primaryFont,
              fontSize: '14px',
              color: '#636366',
              fontWeight: 500,
              mt: { xs: 0, sm: 3 },
              px: { xs: 0, sm: 1 },
            }}
          >
            or
          </Box>

          <Stack spacing={1} flex={1} width="100%">
            <FormLabel
              required
              sx={{
                fontWeight: 600,
                color: 'black',
                fontFamily: primaryFont,
                fontSize: '14px',
                '& .MuiFormLabel-asterisk': {
                  color: 'red',
                },
              }}
            >
              TikTok profile link
            </FormLabel>
            <Stack direction="row" alignItems="center">
              <RHFTextField
                name="tiktokProfileLink"
                placeholder="www.tiktok.com/username"
                sx={{
                  flex: 1,
                  '& .MuiInputBase-root': {
                    height: '48px',
                    borderRadius: '8px',
                  },
                  '& .MuiInputBase-input': {
                    padding: '12px 14px',
                  },
                }}
              />
              {errors.tiktokProfileLink && <ErrorIcon />}
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </>
  );
};

export default FourthStep;

FourthStep.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
  }),
};
