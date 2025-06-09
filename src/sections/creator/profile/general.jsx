import dayjs from 'dayjs';
import * as Yup from 'yup';
import 'croppie/croppie.css';
import { useForm } from 'react-hook-form';
import { useState, useCallback } from 'react';
import { formatIncompletePhoneNumber } from 'libphonenumber-js';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Button,
  Dialog,
  Avatar,
  Select,
  MenuItem,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { countries } from 'src/assets/data';
import { useAuthContext } from 'src/auth/hooks';
import { typography } from 'src/theme/typography';
import { countriesCities } from 'src/contants/countries';

import Image from 'src/components/image';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFSelect,
  RHFTextField,
  RHFDatePicker,
  RHFAutocomplete,
} from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function AccountGeneral() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const [image, setImage] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const mdDown = useResponsive('down', 'lg');
  const [countryCode, setCountryCode] = useState(user?.phoneNumber?.split(' ')[0] || null);

  const UpdateUserSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    photoURL: Yup.mixed().nullable(),
    photoBackgroundURL: Yup.mixed().nullable(),
    phoneNumber: Yup.string().required('Phone number is required'),
    country: Yup.string().required('Country is required'),
    address: Yup.string().required('Address is required'),
    state: Yup.string().required('State is required'),
    about: Yup.string(),
    pronounce: Yup.string(),
    interests: Yup.array().min(1, 'Please select at least one interest'),
  });

  const defaultValues = {
    name: user?.name || '',
    email: user?.email || '',
    photoURL: user?.photoURL || null,
    photoBackgroundURL: user?.photoBackgroundURL || null,
    employment: user?.creator?.employment || '',
    phoneNumber: user?.phoneNumber?.split(' ')[1] || '',
    birthDate: dayjs(user?.creator?.birthDate) || '',
    country: user?.country || '',
    address: user?.creator?.address || '',
    state: user?.creator?.state || '',
    about: user?.creator?.mediaKit?.about || '',
    pronounce: user?.creator?.pronounce || '',
    interests: user?.creator?.interests?.map((interest) => interest.name) || [],
    bodyMeasurement: user?.paymentForm?.bodyMeasurement || '',
    allergies: user?.paymentForm?.allergies?.map((allergy) => ({ name: allergy })) || [
      { name: '' },
    ],
    city: user?.city || '',
  };

  const methods = useForm({
    // resolver: yupResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    setValue,
    handleSubmit,
    watch,
    formState: { isSubmitting, isDirty },
  } = methods;

  // const { fields, remove, insert } = useFieldArray({
  //   control,
  //   name: 'allergies',
  // });

  const countrySelected = watch('country');

  const handleChangeCountryCode = (val) => {
    setCountryCode(val);
  };

  const handlePhoneChange = (event, onChange) => {
    const formattedNumber = formatIncompletePhoneNumber(
      event.target.value,
      countries.find((country) => country.phone === countryCode).code
    ); // Replace 'MY' with your country code
    onChange(formattedNumber);
  };

  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();

    const newObj = {
      ...data,
      id: user?.id,
      interests: Array.isArray(data.interests)
        ? data.interests.map((interest) => ({ name: interest }))
        : [],
      pronounce: data.pronounce || '',
      phoneNumber: `${countryCode} ${data.phoneNumber}`,
    };

    formData.append('image', data?.photoURL);
    formData.append('backgroundImage', data?.photoBackgroundURL);
    formData.append('data', JSON.stringify(newObj));

    try {
      const res = await axiosInstance.patch(endpoints.auth.updateProfileCreator, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      enqueueSnackbar(res?.data.message);
    } catch (error) {
      console.error('Error updating profile:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error updating profile', {
        variant: 'error',
      });
    }
  });

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      if (file) {
        const preview = URL.createObjectURL(file);
        setPreviewImage(preview);
        setImage(file);
        setValue('photoURL', file, { shouldValidate: true });
      }
    },
    [setValue]
  );

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  const handleRemoveAvatar = () => {
    const formData = new FormData();
    const currentValues = methods.getValues();
    const newObj = {
      ...currentValues,
      id: user?.id,
      removePhoto: true,
      interests: Array.isArray(currentValues.interests)
        ? currentValues.interests.map((interest) => ({ name: interest }))
        : [],
      pronounce: currentValues.pronounce || '',
    };

    formData.append('data', JSON.stringify(newObj));

    axiosInstance
      .patch(endpoints.auth.updateProfileCreator, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((res) => {
        setValue('photoURL', null);
        setImage(null);
        setPreviewImage(null);
        handleCloseModal();
        enqueueSnackbar(res?.data.message);
      })
      .catch((error) => {
        enqueueSnackbar(error?.response?.data?.message || 'Error removing photo', {
          variant: 'error',
        });
      });
  };

  const handleOpenImage = () => setOpenImageDialog(true);
  const handleCloseImage = () => setOpenImageDialog(false);

  const theme = useTheme();

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Stack spacing={1} alignItems="flex-start" direction={{ xs: 'column', md: 'row' }}>
            {/* Profile Picture Section */}
            <Stack
              spacing={2}
              alignItems="center"
              bgcolor={!mdDown ? '#F4F4F4' : 'white'}
              // bgcolor="#F4F4F4"
              borderRadius={2}
              p={2}
              width={mdDown ? 1 : 443}
            >
              <Box
                onClick={handleOpenImage}
                sx={{
                  width: 240,
                  height: 240,
                  cursor: 'pointer',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                {previewImage || watch('photoURL') ? (
                  <Image
                    src={previewImage || watch('photoURL')}
                    alt="profile"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: '100%',
                      height: '100%',
                      fontSize: '2rem',
                      fontWeight: 'medium',
                      color: theme.palette.text.secondary,
                      backgroundColor: alpha(theme.palette.grey[500], 0.24),
                    }}
                  >
                    {user?.name?.[0] || 'U'}
                  </Avatar>
                )}
              </Box>

              <Stack spacing={1}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: '#636366',
                    fontSize: '0.75rem',
                    fontWeight: typography.fontWeightMedium,
                  }}
                >
                  Display Photo
                  <span style={{ color: '#FF3500', fontSize: '0.75rem' }}> *</span>
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    component="label"
                    variant="contained"
                    sx={{
                      width: '78px',
                      height: '38px',
                      bgcolor: '#FFFFFF',
                      color: '#000000',
                      border: '1.25px solid #E7E7E7',
                      borderBottom: '3px solid #E7E7E7',
                      borderRadius: '8px',
                      fontWeight: typography.fontWeightSemiBold,
                      '&:hover': {
                        bgcolor: '#F5F5F5',
                        color: '#000000',
                      },
                    }}
                  >
                    Change
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleDrop([e.target.files[0]]);
                        }
                      }}
                      hidden
                      accept="image/*"
                    />
                  </Button>

                  <Button
                    sx={{
                      width: '78px',
                      height: '38px',
                      bgcolor: '#FFFFFF',
                      color: '#FF3500',
                      border: '1.25px solid #E7E7E7',
                      borderBottom: '3px solid #E7E7E7',
                      borderRadius: '8px',
                      fontWeight: typography.fontWeightSemiBold,
                      '&:hover': {
                        bgcolor: '#F5F5F5',
                        color: '#FF3500',
                      },
                    }}
                    variant="contained"
                    onClick={handleOpenModal}
                    disabled={!watch('photoURL')}
                  >
                    Remove
                  </Button>
                </Stack>
              </Stack>
            </Stack>
            {/* Form Fields Section */}
            <Box
              spacing={2}
              alignItems="center"
              bgcolor={!mdDown ? '#F4F4F4' : 'white'}
              // bgcolor="#F4F4F4"
              borderRadius={2}
              p={2}
              width={mdDown ? 1 : 600}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(1,1fr)', md: 'repeat(2,1fr)' },
                  gap: 1,
                }}
              >
                {/* Name field */}
                <Box>
                  <Typography
                    variant="body2"
                    color="#636366"
                    fontWeight={typography.fontWeightMedium}
                    sx={{
                      fontSize: { xs: '12px', sm: '13px' },
                      mb: 1,
                      color: '#636366',
                    }}
                  >
                    Name{' '}
                    <Box component="span" sx={{ color: 'error.main' }}>
                      *
                    </Box>
                  </Typography>
                  <RHFTextField
                    name="name"
                    placeholder="Name"
                    InputLabelProps={{ shrink: false }}
                    sx={{
                      width: '100%',
                      // maxWidth: { xs: '100%', sm: 500 },
                      '&.MuiTextField-root': {
                        bgcolor: 'white',
                        borderRadius: 1,
                        '& .MuiInputLabel-root': {
                          display: 'none',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#B0B0B0',
                          fontSize: { xs: '14px', sm: '16px' },
                          opacity: 1,
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        },
                      },
                    }}
                  />
                </Box>

                {/* Pronouns field */}
                <Box>
                  <Typography
                    variant="body2"
                    color="#636366"
                    fontWeight={typography.fontWeightMedium}
                    sx={{
                      fontSize: { xs: '12px', sm: '13px' },
                      mb: 1,
                      color: '#636366',
                    }}
                  >
                    Pronouns{' '}
                    <Box component="span" sx={{ color: 'error.main' }}>
                      *
                    </Box>
                  </Typography>
                  <RHFSelect
                    name="pronounce"
                    placeholder="Select pronouns"
                    InputLabelProps={{ shrink: false }}
                    sx={{
                      width: '100%',
                      // maxWidth: { xs: '100%', sm: 500 },
                      height: { xs: 40, sm: 48 },
                      '& .MuiSelect-select': {
                        bgcolor: 'white',
                        borderRadius: 1,
                        fontSize: '0.875rem',
                        color: '#231F20',
                        textTransform: 'lowercase',
                      },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                      },
                    }}
                  >
                    <MenuItem value="he/him">he/him</MenuItem>
                    <MenuItem value="she/her">she/her</MenuItem>
                    <MenuItem value="they/them">they/them</MenuItem>
                  </RHFSelect>
                </Box>

                {/* Phone number */}
                <Box>
                  <Typography
                    variant="body2"
                    color="#636366"
                    fontWeight={typography.fontWeightMedium}
                    sx={{
                      fontSize: { xs: '12px', sm: '13px' },
                      mb: 1,
                      color: '#636366',
                    }}
                  >
                    Phone Number{' '}
                    <Box component="span" sx={{ color: 'error.main' }}>
                      *
                    </Box>
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Select
                      sx={{
                        bgcolor: 'white',
                        borderRadius: 1,
                        width: 80,
                      }}
                      value={countryCode}
                      onChange={(e) => handleChangeCountryCode(e.target.value)}
                    >
                      {countries
                        .filter((item) => item.phone)
                        .sort((a, b) => {
                          const phoneA = parseInt(a.phone.replace(/-/g, ''), 10);
                          const phoneB = parseInt(b.phone.replace(/-/g, ''), 10);
                          return phoneA - phoneB;
                        })
                        .map((item, index) => (
                          <MenuItem key={index} value={item.phone}>
                            + {item.phone}
                          </MenuItem>
                        ))}
                    </Select>

                    {/* <Controller
                      name="phone"
                      control={control}
                      defaultValue=""
                      rules={{ required: 'Phone number is required' }}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          sx={{
                            width: '100%',
                            '&.MuiTextField-root': {
                              bgcolor: 'white',
                              borderRadius: 1,
                              '& .MuiInputLabel-root': {
                                display: 'none',
                              },
                              '& .MuiInputBase-input::placeholder': {
                                color: '#B0B0B0',
                                fontSize: { xs: '14px', sm: '16px' },
                                opacity: 1,
                              },
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1,
                              },
                            },
                          }}
                          placeholder="Phone Number"
                          variant="outlined"
                          fullWidth
                          error={!!fieldState.error}
                          helperText={fieldState.error ? fieldState.error.message : ''}
                          onChange={(event) => handlePhoneChange(event, field.onChange)}
                        />
                      )}
                    /> */}

                    <RHFTextField
                      name="phoneNumber"
                      placeholder="Phone Number"
                      InputLabelProps={{ shrink: false }}
                      type="number"
                      sx={{
                        width: '100%',
                        // maxWidth: { xs: '100%', sm: 500 },
                        '&.MuiTextField-root': {
                          bgcolor: 'white',
                          borderRadius: 1,
                          '& .MuiInputLabel-root': {
                            display: 'none',
                          },
                          '& .MuiInputBase-input::placeholder': {
                            color: '#B0B0B0',
                            fontSize: { xs: '14px', sm: '16px' },
                            opacity: 1,
                          },
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                          },
                        },
                      }}
                    />
                  </Stack>
                </Box>

                {/* Email address */}
                <Box>
                  <Typography
                    variant="body2"
                    color="#636366"
                    fontWeight={typography.fontWeightMedium}
                    sx={{
                      fontSize: { xs: '12px', sm: '13px' },
                      mb: 1,
                      color: '#636366',
                    }}
                  >
                    Email Address{' '}
                    <Box component="span" sx={{ color: 'error.main' }}>
                      *
                    </Box>
                  </Typography>
                  <RHFTextField
                    name="email"
                    placeholder="Email"
                    InputLabelProps={{ shrink: false }}
                    sx={{
                      width: '100%',
                      // maxWidth: { xs: '100%', sm: 500 },
                      '&.MuiTextField-root': {
                        bgcolor: 'white',
                        borderRadius: 1,
                        '& .MuiInputLabel-root': {
                          display: 'none',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#B0B0B0',
                          fontSize: { xs: '14px', sm: '16px' },
                          opacity: 1,
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        },
                      },
                    }}
                  />
                </Box>

                {/* COR */}
                <Box>
                  <Typography
                    variant="body2"
                    color="#636366"
                    fontWeight={typography.fontWeightMedium}
                    sx={{
                      fontSize: { xs: '12px', sm: '13px' },
                      mb: 1,
                      color: '#636366',
                    }}
                  >
                    Country Of Residence{' '}
                    <Box component="span" sx={{ color: 'error.main' }}>
                      *
                    </Box>
                  </Typography>
                  <RHFAutocomplete
                    name="country"
                    placeholder="Country"
                    options={Object.keys(countriesCities)}
                    InputLabelProps={{ shrink: false }}
                    sx={{
                      width: '100%',
                      '& .MuiTextField-root': {
                        bgcolor: 'white',
                        borderRadius: 1,
                        '& .MuiInputLabel-root': {
                          display: 'none',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#B0B0B0',
                          fontSize: { xs: '14px', sm: '16px' },
                          opacity: 1,
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        },
                      },
                    }}
                  />
                </Box>

                {/* City */}
                <Box>
                  <Typography
                    variant="body2"
                    color="#636366"
                    fontWeight={typography.fontWeightMedium}
                    sx={{
                      fontSize: { xs: '12px', sm: '13px' },
                      mb: 1,
                      color: '#636366',
                    }}
                  >
                    City{' '}
                    <Box component="span" sx={{ color: 'error.main' }}>
                      *
                    </Box>
                  </Typography>
                  <RHFAutocomplete
                    name="city"
                    placeholder="City"
                    options={[...new Set(countriesCities[countrySelected])]}
                    InputLabelProps={{ shrink: false }}
                    sx={{
                      width: '100%',
                      '& .MuiTextField-root': {
                        bgcolor: 'white',
                        borderRadius: 1,
                        '& .MuiInputLabel-root': {
                          display: 'none',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#B0B0B0',
                          fontSize: { xs: '14px', sm: '16px' },
                          opacity: 1,
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        },
                      },
                    }}
                  />
                </Box>

                {/* Bio field */}
                <Box gridColumn={{ md: 'span 2' }}>
                  <Typography
                    variant="body2"
                    color="#636366"
                    fontWeight={typography.fontWeightMedium}
                    sx={{
                      fontSize: { xs: '12px', sm: '13px' },
                      mb: 1,
                      color: '#636366',
                    }}
                  >
                    Full Address
                  </Typography>
                  <RHFTextField
                    name="address"
                    multiline
                    rows={4}
                    placeholder="Your address"
                    InputLabelProps={{ shrink: false }}
                    sx={{
                      width: 1,
                      '&.MuiTextField-root': {
                        bgcolor: 'white',
                        borderRadius: 1,
                        '& .MuiInputLabel-root': {
                          display: 'none',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#B0B0B0',
                          fontSize: { xs: '14px', sm: '16px' },
                          opacity: 1,
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        },
                      },
                    }}
                  />
                </Box>

                {/* Employment status */}
                <Box>
                  <Typography
                    variant="body2"
                    color="#636366"
                    fontWeight={typography.fontWeightMedium}
                    sx={{
                      fontSize: { xs: '12px', sm: '13px' },
                      mb: 1,
                      color: '#636366',
                    }}
                  >
                    Employment Status{' '}
                  </Typography>

                  <RHFSelect
                    name="employment"
                    multiple={false}
                    sx={{
                      width: '100%',
                      // maxWidth: { xs: '100%', sm: 500 },
                      '&.MuiTextField-root': {
                        bgcolor: 'white',
                        borderRadius: 1,
                        '& .MuiInputLabel-root': {
                          display: 'none',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#B0B0B0',
                          fontSize: { xs: '14px', sm: '16px' },
                          opacity: 1,
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        },
                      },
                    }}
                  >
                    <MenuItem value="fulltime">I have a full-time job</MenuItem>
                    <MenuItem value="freelance">I&apos;m a freelancer</MenuItem>
                    <MenuItem value="part_time">I only work part-time</MenuItem>
                    <MenuItem value="student">I&apos;m a student</MenuItem>
                    <MenuItem value="in_between">I&apos;m in between jobs/transitioning </MenuItem>
                    <MenuItem value="unemployed">I&apos;m unemployed</MenuItem>
                    <MenuItem value="others">Others </MenuItem>
                  </RHFSelect>
                </Box>

                {/* Birth date */}
                <Box>
                  <Typography
                    variant="body2"
                    color="#636366"
                    fontWeight={typography.fontWeightMedium}
                    sx={{
                      fontSize: { xs: '12px', sm: '13px' },
                      mb: 1,
                      color: '#636366',
                    }}
                  >
                    Birth Date{' '}
                    <Box component="span" sx={{ color: 'error.main' }}>
                      *
                    </Box>
                  </Typography>
                  <RHFDatePicker
                    name="birthDate"
                    sx={{
                      bgcolor: 'white',
                      borderRadius: 1,
                    }}
                  />
                </Box>

                {/* Bio field */}
                <Box gridColumn={{ md: 'span 2' }}>
                  <Typography
                    variant="body2"
                    color="#636366"
                    fontWeight={typography.fontWeightMedium}
                    sx={{
                      fontSize: { xs: '12px', sm: '13px' },
                      mb: 1,
                      color: '#636366',
                    }}
                  >
                    About Me
                  </Typography>
                  <RHFTextField
                    name="about"
                    multiline
                    rows={4}
                    placeholder="Tell us about yourself"
                    InputLabelProps={{ shrink: false }}
                    sx={{
                      width: 1,
                      '&.MuiTextField-root': {
                        bgcolor: 'white',
                        borderRadius: 1,
                        '& .MuiInputLabel-root': {
                          display: 'none',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#B0B0B0',
                          fontSize: { xs: '14px', sm: '16px' },
                          opacity: 1,
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        },
                      },
                    }}
                  />
                </Box>
              </Box>

              <Stack spacing={3} alignItems={{ xs: 'center', sm: 'flex-end' }} sx={{ mt: 3 }}>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={isSubmitting}
                  sx={{
                    background:
                      isDirty || image
                        ? '#1340FF'
                        : 'linear-gradient(0deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.60) 100%), #1340FF',
                    pointerEvents: !isDirty && !image && 'none',
                    fontSize: '16px',
                    fontWeight: 600,
                    borderRadius: '10px',
                    borderBottom: isDirty || image ? '3px solid #0c2aa6' : '3px solid #91a2e5',
                    transition: 'none',
                    width: { xs: '100%', sm: '90px' },
                    height: '44px',
                  }}
                >
                  Update
                </LoadingButton>
              </Stack>
            </Box>
          </Stack>
        </Grid>
      </Grid>

      {/* Dialogs */}
      <Dialog
        open={openImageDialog}
        onClose={handleCloseImage}
        PaperProps={{
          sx: {
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            overflow: 'visible',
            backgroundColor: 'transparent',
            boxShadow: 'none',
            position: 'relative',
          },
        }}
        sx={{
          '& .MuiDialog-container': {
            position: 'relative',
          },
        }}
      >
        <Button
          onClick={handleCloseImage}
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            minWidth: '38px',
            width: '38px',
            height: '38px',
            p: 0,
            bgcolor: '#FFFFFF',
            color: '#000000',
            border: '1px solid #E7E7E7',
            borderBottom: '3px solid #E7E7E7',
            borderRadius: '8px',
            fontWeight: 650,
            zIndex: 9999,
            '&:hover': {
              bgcolor: '#F5F5F5',
            },
          }}
        >
          X
        </Button>
        <Box
          sx={{
            width: '400px',
            height: '400px',
            position: 'relative',
            backgroundColor: 'background.paper',
            borderRadius: '50%',
            overflow: 'hidden',
          }}
        >
          {previewImage || watch('photoURL') ? (
            <Image
              src={previewImage || watch('photoURL')}
              alt="profile"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: '100%',
                height: '100%',
                fontSize: '2rem',
                fontWeight: 'medium',
                color: theme.palette.text.secondary,
                backgroundColor: alpha(theme.palette.grey[500], 0.24),
              }}
            >
              {user?.name?.[0] || 'U'}
            </Avatar>
          )}
        </Box>
      </Dialog>

      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>Remove Profile Picture</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove your profile picture?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={handleRemoveAvatar} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </FormProvider>
  );
}
