import * as Yup from 'yup';
import 'croppie/croppie.css';
import { useState, useCallback } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { formatIncompletePhoneNumber } from 'libphonenumber-js';
import { useForm, Controller, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  Button,
  Checkbox,
  TextField,
  IconButton,
  InputAdornment,
  FormControlLabel,
} from '@mui/material';

import { fData } from 'src/utils/format-number';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { countries } from 'src/assets/data';
import { useAuthContext } from 'src/auth/hooks';
import { regions } from 'src/assets/data/regions';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
  RHFUploadAvatar,
  RHFAutocomplete,
} from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function AccountGeneral() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const [image, setImage] = useState(null);

  const UpdateUserSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    photoURL: Yup.mixed().nullable(),
    photoBackgroundURL: Yup.mixed().nullable(),
    phoneNumber: Yup.string().required('Phone number is required'),
    country: Yup.string().required('Country is required'),
    address: Yup.string().required('Address is required'),
    state: Yup.string().required('State is required'),
    about: Yup.string().required('About is required'),
  });

  const defaultValues = {
    name: user?.name || '',
    email: user?.email || '',
    photoURL: user?.photoURL || null,
    photoBackgroundURL: user?.photoBackgroundURL || null,
    phoneNumber: user?.phoneNumber || '',
    country: user?.country || '',
    address: user?.creator?.address || '',
    state: user?.creator?.state || '',
    about: user?.creator?.mediaKit?.about || '',
    bodyMeasurement: user?.paymentForm?.bodyMeasurement || '',
    allergies: user?.paymentForm?.allergies?.map((allergy) => ({ name: allergy })) || [
      { name: '' },
    ],
  };

  const methods = useForm({
    resolver: yupResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    setValue,
    handleSubmit,
    watch,
    control,
    formState: { isSubmitting, isDirty },
  } = methods;

  const { fields, remove, insert } = useFieldArray({
    control,
    name: 'allergies',
  });

  const handlePhoneChange = (event, onChange) => {
    const formattedNumber = formatIncompletePhoneNumber(
      event.target.value,
      countries.find((country) => country.label === nationality).code
    ); // Replace 'MY' with your country code
    onChange(formattedNumber);
  };

  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();

    const newObj = { ...data, id: user?.id };

    formData.append('image', data?.photoURL);
    formData.append('backgroundImage', data?.photoBackgroundURL);
    formData.append('data', JSON.stringify(newObj));

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const res = await axiosInstance.patch(endpoints.auth.updateProfileCreator, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      enqueueSnackbar(res?.data.message);
    } catch (error) {
      enqueueSnackbar('Error', {
        variant: 'error',
      });
    }
  });

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      if (file) {
        setImage(file);
        setValue('photoURL', newFile, { shouldValidate: true });
      }
    },
    [setValue]
  );

  const country = watch('country');
  const nationality = watch('country');

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Card sx={{ pt: 4, pb: 5, px: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Profile Picture
            </Typography>
            <RHFUploadAvatar
              name="photoURL"
              maxSize={3145728}
              onDrop={handleDrop}
              helperText={
                <Typography
                  variant="caption"
                  sx={{
                    mt: 3,
                    mx: 'auto',
                    display: 'block',
                    textAlign: 'center',
                    color: 'text.disabled',
                  }}
                >
                  Allowed *.jpeg, *.jpg, *.png, *.gif
                  <br /> max size of {fData(3145728)}
                </Typography>
              }
            />
          </Card>
        </Grid>

        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <RHFTextField name="name" label="Name" />
              <RHFTextField name="email" label="Email Address" />
              <Stack>
                <RHFTextField name="address" label="Address" multiline />
                <FormControlLabel
                  control={<Checkbox defaultChecked size="small" />}
                  label="Same as current location"
                  onChange={(e, val) => {
                    if (val) {
                      setValue('address', user?.creator?.location);
                    } else {
                      setValue('address', '');
                    }
                  }}
                />
              </Stack>
              <RHFAutocomplete
                name="state"
                type="state"
                label="State/Region"
                placeholder="Choose a state/region"
                options={regions
                  .filter((elem) => elem.countryName === country)
                  .map((a) => a.regions)
                  .flatMap((b) => b)
                  .map((c) => c.name)}
                getOptionLabel={(option) => option}
              />
              <RHFAutocomplete
                name="country"
                type="country"
                label="Country"
                placeholder="Choose a country"
                options={countries.map((option) => option.label)}
                getOptionLabel={(option) => option}
              />

              {/* <RHFTextField
                name="phoneNumber"
                label="Phone Number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      +{countries.filter((a) => a.label === nationality).map((e) => e.phone)}
                    </InputAdornment>
                  ),
                }}
              /> */}

              <Controller
                name="phoneNumber"
                control={control}
                defaultValue=""
                rules={{ required: 'Phone number is required' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    placeholder="Phone Number"
                    variant="outlined"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error ? fieldState.error.message : ''}
                    onChange={(event) => handlePhoneChange(event, field.onChange)}
                  />
                )}
              />

              <RHFTextField
                name="bodyMeasurement"
                type="number"
                label="Body Measurement"
                InputProps={{
                  endAdornment: <InputAdornment position="start">cm</InputAdornment>,
                }}
              />
              <Stack spacing={1}>
                {fields.map((item, index) => (
                  <Stack key={item.id} direction="row" spacing={1} alignItems="center">
                    <RHFTextField
                      name={`allergies[${index}].name`}
                      label={`Allergy ${index + 1}`}
                    />
                    <IconButton onClick={() => remove(index)}>
                      <Iconify icon="material-symbols:remove" />
                    </IconButton>
                  </Stack>
                ))}
                <Button size="small" variant="contained" onClick={() => insert({ name: '' })}>
                  Add more allergy
                </Button>
              </Stack>
            </Box>

            <Stack spacing={3} alignItems="flex-end" sx={{ mt: 3 }}>
              <RHFTextField name="about" multiline rows={7} label="About" />

              <LoadingButton
                type="submit"
                variant="outlined"
                loading={isSubmitting}
                size="small"
                disabled={!isDirty && !image}
              >
                Save Changes
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}
