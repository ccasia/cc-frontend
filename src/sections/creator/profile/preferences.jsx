import React from 'react';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import { Box, Chip, Stack, FormLabel } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { langList } from 'src/contants/language';
import { primaryFont } from 'src/theme/typography';
import { interestsLists } from 'src/contants/interestLists';

import FormProvider, { RHFAutocomplete } from 'src/components/hook-form';

const schema = Yup.object({
  interests: Yup.array().min(3, 'Choose at least three option'),
  languages: Yup.array().min(1, 'Choose at least one option'),
});

const Preference = () => {
  const { user } = useAuthContext();
  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      languages: user?.creator?.languages || [],
      interests: user?.creator?.interests?.map((interest) => interest.name) || [],
    },
    mode: 'all',
    reValidateMode: 'onChange',
  });

  const mdDown = useResponsive('down', 'lg');

  const {
    formState: { isSubmitting, isDirty },
    handleSubmit,
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.creators.updatePreference(user?.id), data);
      enqueueSnackbar(res?.data.message);
    } catch (error) {
      console.error('Error updating profile:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error updating profile', {
        variant: 'error',
      });
    }
  });

  return (
    <Box sx={{ bgcolor: '#F4F4F4', p: 2, borderRadius: 2 }} width={mdDown ? 1 : 752}>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Stack direction={{ md: 'row' }} spacing={1}>
          <Stack spacing={1} width={1}>
            <FormLabel
              required
              sx={{
                fontWeight: 400,
                color: 'grey',
                fontFamily: primaryFont,
                fontSize: '14px',
                '& .MuiFormLabel-asterisk': {
                  color: 'red',
                },
              }}
            >
              Languages
            </FormLabel>
            <RHFAutocomplete
              name="languages"
              placeholder="Choose at least 1 option"
              multiple
              freeSolo={false}
              disableCloseOnSelect
              options={langList.sort((a, b) => a.localeCompare(b)).map((option) => option)}
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
                  />
                ))
              }
              sx={{
                bgcolor: 'white',
                borderRadius: 1,
              }}
            />
          </Stack>

          <Stack spacing={1} width={1}>
            <FormLabel
              required
              sx={{
                fontWeight: 400,
                color: 'grey',
                fontFamily: primaryFont,
                fontSize: '14px',
                '& .MuiFormLabel-asterisk': {
                  color: 'red',
                },
              }}
            >
              Interests
            </FormLabel>
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
                  />
                ))
              }
              sx={{
                bgcolor: 'white',
                borderRadius: 1,
              }}
            />
          </Stack>
        </Stack>

        <Stack spacing={3} alignItems={{ xs: 'center', sm: 'flex-end' }} sx={{ mt: 3 }}>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            sx={{
              background: '#1340FF',
              //    isDirty
              //     ? '#1340FF'
              //     : 'linear-gradient(0deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.60) 100%), #1340FF',
              //   pointerEvents: !isDirty && 'none',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '10px',
              borderBottom: isDirty ? '3px solid #0c2aa6' : '3px solid #91a2e5',
              transition: 'none',
              width: { xs: '100%', sm: '90px' },
              height: '44px',
            }}
          >
            Update
          </LoadingButton>
        </Stack>
      </FormProvider>
    </Box>
  );
};

export default Preference;
