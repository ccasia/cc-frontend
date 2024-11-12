/* eslint-disable no-unused-vars */
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { useTheme } from '@emotion/react';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import { LoadingButton } from '@mui/lab';
import Dialog from '@mui/material/Dialog';
import { Stack, Avatar, Button, InputAdornment, LinearProgress } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

import LastStep from './steps/lastStep';
import FirstStep from './steps/firstStep';
import ThirdStep from './steps/thirdStep';
import FourthStep from './steps/fourtStep';
import SecondStep from './steps/secondStep';

// const steps = ['Fill in your details', 'Provide your social media information'];
const steps = [
  {
    title: 'Welcome to the Cult, Cipta! 👋',
    description: 'Before we get started, let’s get to know more about you.',
  },
  {
    title: 'Tell us where you’re from 🌏',
    description: 'We’ll use this to make tailored recommendations.',
  },
  {
    title: 'Fill up your personal details ✏️',
    description: 'We’ll use this to make tailored recommendations.',
  },
  {
    title: 'Fill up some extra details 😉',
    description: 'We’ll use this to make tailored recommendations.',
  },
  {
    title: 'Lastly, what are your socials 🤳',
    description: 'This will help add further content to your profile!',
  },
];

export const interestsList = [
  'Art',
  'Beauty',
  'Business',
  'Fashion',
  'Fitness',
  'Food',
  'Gaming',
  'Health',
  'Lifestyle',
  'Music',
  'Sports',
  'Technology',
  'Travel',
  'Entertainment',
];

const stepSchemas = [
  null,
  Yup.object({
    location: Yup.string().required('City/Area is required'),
    Nationality: Yup.string().required('Nationality is required'),
  }),
  Yup.object({
    phone: Yup.string().required('Phone number is required'),
    pronounce: Yup.string().required('Pronouns are required'),
    employment: Yup.string().required('Employment status is required'),
    birthDate: Yup.mixed().nullable().required('Please enter your birth date'),
  }),
  Yup.object({
    interests: Yup.array().min(3, 'Choose at least three option'),
    languages: Yup.array().min(1, 'Choose at least one option'),
  }),
  Yup.object({
    instagram: Yup.string().required('Please enter your instagram username'),
  }),
];

export default function CreatorForm({ creator, open, onClose }) {
  const [activeStep, setActiveStep] = useState(0);
  const [newCreator, setNewCreator] = useState({});
  const [ratingInterst, setRatingInterst] = useState([]);
  const [ratingIndustries, setRatingIndustries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = useTheme();

  const resolver = yupResolver(stepSchemas[activeStep > 0 && activeStep]);

  const logo = (
    <Avatar
      sx={{
        width: 45,
        height: 45,
        borderRadius: 1,
        bgcolor: 'rgba(19, 64, 255, 1)',
      }}
    >
      <Image
        src="/logo/newlogo.svg"
        alt="Background Image"
        style={{
          width: 25,
          height: 25,
          borderRadius: 'inherit',
        }}
      />
    </Avatar>
  );

  // const testSchema = Yup.object().shape({
  //   phone: Yup.string().required('Phone number is required'),
  //   pronounce: Yup.string().required('Pronouns are required'),
  //   location: Yup.string().required('City/Area is required'),
  //   interests: Yup.array().min(3, 'Choose at least three option'),
  //   languages: Yup.array().min(1, 'Choose at least one option'),
  //   employment: Yup.string().required('Employment status is required'),
  //   birthDate: Yup.mixed().nullable().required('Please enter your birth date'),
  //   Nationality: Yup.string().required('Nationality is required'),
  //   instagram: Yup.string().required('Please enter your instagram username'),
  // });

  const defaultValues = useMemo(
    () => ({
      phone: '',
      tiktok: '',
      pronounce: '',
      location: '',
      interests: [],
      languages: [],
      instagram: '',
      employment: '',
      birthDate: null,
      Nationality: '',
      otherPronounce: '',
    }),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { isValid },
  } = methods;

  const nationality = watch('Nationality');
  const languages = watch('languages');
  const pronounce = watch('pronounce');
  const otherPronounce = watch('otherPronounce');

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);

    try {
      // const socialMediaData = await fetchSocialMediaData(data.instagram, data.tiktok);
      // console.log(socialMediaData);
      const newData = {
        ...data,
        // socialMediaData,
        pronounce: otherPronounce || pronounce,
      };
      const res = await axiosInstance.put(endpoints.auth.updateCreator, newData);
      enqueueSnackbar(`Welcome ${res.data.name}!`);

      onClose();
    } catch (error) {
      enqueueSnackbar('Something went wrong', {
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  // const creatorLocation = useCallback(() => {
  //   if ('geolocation' in navigator) {
  //     navigator.geolocation.getCurrentPosition(
  //       async (position) => {
  //         const { latitude, longitude } = position.coords;
  //         loading.onTrue();
  //         try {
  //           const address = await axios.get(
  //             `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
  //           );
  //           setValue('location', address.data.display_name);
  //         } catch (error) {
  //           console.log(error);
  //           enqueueSnackbar('Error fetch location', {
  //             variant: 'error',
  //           });
  //         } finally {
  //           loading.onFalse();
  //         }
  //       },
  //       (error) => {
  //         console.error(`Error Code = ${error.code} - ${error.message}`);
  //         enqueueSnackbar('Error fetch location', {
  //           variant: 'error',
  //         });
  //         loading.onFalse();
  //       }
  //     );
  //   } else {
  //     console.log('Geolocation is not supported by this browser.');
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [setValue]);

  // function getStepContent(step) {
  //   switch (step) {
  //     case 0:
  //       return formComponent();
  //     case 1:
  //       return socialMediaForm;
  //     default:
  //       return 'Unknown step';
  //   }
  // }

  // useEffect(() => {
  //   creatorLocation();
  // }, [creatorLocation]);

  useEffect(() => {
    if (languages.includes('All of the above')) {
      setValue('languages', ['English', 'Malay', 'Chinese', 'Tamil']);
    }
  }, [languages, setValue]);

  // function formComponent() {
  //   return (
  //     <DialogContent>
  //       <Box
  //         rowGap={3}
  //         columnGap={2}
  //         display="grid"
  //         mt={2}
  //         gridTemplateColumns={{
  //           xs: 'repeat(1, 1fr)',
  //           sm: 'repeat(2, 1fr)',
  //         }}
  //       >
  //         <RHFAutocomplete
  //           name="Nationality"
  //           type="country"
  //           placeholder="Nationality"
  //           fullWidth
  //           options={countries.map((option) => option.label)}
  //           getOptionLabel={(option) => option}
  //         />

  //         <RHFTextField
  //           name="location"
  //           label="City/Area"
  //           multiline
  //           InputProps={{
  //             endAdornment: (
  //               <InputAdornment position="end">
  //                 <Tooltip title="Get current location">
  //                   {!loading.value ? (
  //                     <IconButton
  //                       onClick={() => {
  //                         creatorLocation();
  //                       }}
  //                     >
  //                       <Iconify icon="mdi:location" />
  //                     </IconButton>
  //                   ) : (
  //                     <Iconify icon="eos-icons:bubble-loading" />
  //                   )}
  //                 </Tooltip>
  //               </InputAdornment>
  //             ),
  //           }}
  //         />

  // <RHFSelect name="employment" label="Employment Status" multiple={false}>
  //   <MenuItem value="fulltime">I have a full-time job</MenuItem>
  //   <MenuItem value="freelance">I&apos;m a freelancer</MenuItem>
  //   <MenuItem value="part_time">I only work part-time</MenuItem>
  //   <MenuItem value="student">I&apos;m a student</MenuItem>
  //   <MenuItem value="in_between">I&apos;m in between jobs/transitioning </MenuItem>
  //   <MenuItem value="unemployed">I&apos;m unemployed</MenuItem>
  //   <MenuItem value="others">Others </MenuItem>
  // </RHFSelect>

  // <RHFTextField
  //   name="phone"
  //   label="Phone Number"
  //   InputProps={{
  //     startAdornment: (
  //       <InputAdornment position="start">
  //         +
  //         {countries.filter((country) => country.label === nationality).map((e) => e.phone)}
  //       </InputAdornment>
  //     ),
  //   }}
  // />

  // <RHFSelect name="pronounce" label="Pronouns" multiple={false}>
  //   <MenuItem value="he/him">He/Him</MenuItem>
  //   <MenuItem value="she/her">She/Her</MenuItem>
  //   <MenuItem value="they/them">They/Them</MenuItem>
  //   <MenuItem value="others">Others</MenuItem>
  // </RHFSelect>

  //         {pronounce === 'others' && <RHFTextField name="otherPronounce" label="Pronounce" />}

  //         <RHFDatePicker name="birthDate" label="Birth Date" />

  // <RHFAutocomplete
  //   name="languages"
  //   placeholder="Languages"
  //   multiple
  //   freeSolo={false}
  //   disableCloseOnSelect
  //   options={langList.sort((a, b) => a.localeCompare(b)).map((option) => option)}
  //   getOptionLabel={(option) => option}
  //   renderOption={(props, option) => (
  //     <li {...props} key={option}>
  //       {option}
  //     </li>
  //   )}
  //   renderTags={(selected, getTagProps) =>
  //     selected.map((option, index) => (
  //       <Chip
  //         {...getTagProps({ index })}
  //         key={option}
  //         label={option}
  //         size="small"
  //         color="info"
  //         variant="soft"
  //       />
  //     ))
  //   }
  // />

  // <RHFAutocomplete
  //   name="interests"
  //   placeholder="+ Your interests"
  //   multiple
  //   freeSolo
  //   disableCloseOnSelect
  //   options={interestsList.map((option) => option)}
  //   getOptionLabel={(option) => option}
  //   renderOption={(props, option) => (
  //     <li {...props} key={option}>
  //       {option}
  //     </li>
  //   )}
  //   renderTags={(selected, getTagProps) =>
  //     selected.map((option, index) => (
  //       <Chip
  //         {...getTagProps({ index })}
  //         key={option}
  //         label={option}
  //         size="small"
  //         color="info"
  //         variant="soft"
  //       />
  //     ))
  //   }
  // />
  //       </Box>
  //     </DialogContent>
  //   );
  // }

  const socialMediaForm = (
    <Box
      rowGap={3}
      columnGap={2}
      display="grid"
      mt={2}
      gridTemplateColumns={{
        xs: 'repeat(1, 1fr)',
        sm: 'repeat(2, 1fr)',
      }}
    >
      <Stack gap={1}>
        <RHFTextField
          name="instagram"
          label="Instagram Username"
          placeholder="Eg: cristiano"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="mdi:instagram" width={20} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>
      <Stack gap={1}>
        <RHFTextField
          name="tiktok"
          label="Tiktok Username"
          placeholder="Eg: cristiano"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="ic:baseline-tiktok" width={20} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>
    </Box>
  );

  const finalSubmit = async () => {
    onSubmit();
    if (!methods.formState.isValid) {
      toast.error('Please fill all the required fields');
      setActiveStep((prevActiveStep) => prevActiveStep - 2);
    } else {
      const data = {
        ...newCreator,
        Interests: ratingInterst,
        industries: ratingIndustries,
      };
    }
  };

  const renderForm = useCallback(
    (info) => {
      switch (activeStep) {
        case 1:
          return <SecondStep item={info} />;
        case 2:
          return <ThirdStep item={info} />;
        case 3:
          return <FourthStep item={info} />;
        case 4:
          return <LastStep item={info} />;
        default:
          return <FirstStep item={info} onNext={handleNext} />;
      }
    },
    [activeStep]
  );

  return (
    <Dialog
      fullWidth
      fullScreen
      // open={open}
      open
      scroll="paper"
      PaperProps={{
        sx: {
          bgcolor: '#FFF',
          borderRadius: 2,
          p: 4,
          m: 2,
          height: '97vh',
        },
      }}
    >
      {logo}
      <Box
        sx={{
          position: 'absolute',
          top: 55,
          left: '50%',
          bgcolor: 'wheat',
          transform: 'translateX(-50%)',
        }}
      >
        <LinearProgress
          variant="determinate"
          value={Math.floor(((activeStep + 1) / steps.length) * 100)}
          sx={{
            width: 150,
            bgcolor: '#E7E7E7',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#1340FF', // Custom color
            },
          }}
        />
      </Box>

      <FormProvider methods={methods}>
        <Stack
          alignItems="center"
          sx={{
            mt: 5,
          }}
        >
          <Box sx={{ flexGrow: 3 }}>{renderForm(steps[activeStep])}</Box>

          {activeStep > 0 && activeStep < steps.length - 1 && (
            <Button
              onClick={handleNext}
              disabled={!isValid}
              sx={{
                // position: 'absolute',
                // bottom: 20,
                // left: '50%',
                // transform: 'translate(-50%)',
                bgcolor: '#1340FF',
                boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                color: '#FFF',
                px: 6,
                py: 1,
                '&:hover': {
                  bgcolor: '#1340FF',
                },
              }}
            >
              Next
            </Button>
          )}
          {activeStep === steps.length - 1 && (
            <LoadingButton
              sx={{
                // position: 'absolute',
                // bottom: 20,
                // left: '50%',
                // transform: 'translate(-50%)',
                bgcolor: '#1340FF',
                boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                color: '#FFF',
                px: 6,
                py: 1,
                '&:hover': {
                  bgcolor: '#1340FF',
                },
              }}
              variant="contained"
              onClick={onSubmit}
              loading={isSubmitting}
            >
              Get Started
            </LoadingButton>
          )}
        </Stack>
      </FormProvider>

      {/* <Box sx={{ display: 'flex', m: 2 }}>
        <Button color="inherit" disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
          Back
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        {activeStep === steps.length - 1 ? (
          <Button variant="contained" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        )}
      </Box> */}

      {/* <Stepper
        sx={{
          pt: 2,
          m: 1,
        }}
        activeStep={activeStep}
        alternativeLabel
      >
        {steps.map((label, index) => {
          const stepProps = {};
          const labelProps = {};
          return (
            <Step key={index} {...stepProps}>
              <StepLabel {...labelProps}>{label.title}</StepLabel>
            </Step>
          );
        })}
      </Stepper> */}

      {/* <>
        <Stepper
          sx={{
            pt: 2,
            m: 1,
          }}
          activeStep={activeStep}
          alternativeLabel
        >
          {steps.map((label, index) => {
            const stepProps = {};
            const labelProps = {};
            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>

        {activeStep === steps.length ? (
          <>
            <Paper
              sx={{
                p: 3,
                my: 3,
                minHeight: 120,
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
              }}
            >
              <Typography sx={{ my: 1 }}>All steps completed - you&apos;re finished</Typography>
            </Paper>

            <Box sx={{ display: 'flex', m: 2 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>

              <Box sx={{ flexGrow: 1 }} />
              <Button
                onClick={() => {
                  reset();
                  setActiveStep((prevActiveStep) => prevActiveStep - 2);
                }}
              >
                Reset
              </Button>
              <Button onClick={finalSubmit} color="inherit">
                Submit
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Paper
              sx={{
                p: 1,
                my: 1,

                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
              }}
            >
              <Box sx={{ my: 3 }}>
                <FormProvider methods={methods} onSubmit={onSubmit}>
                  {getStepContent(activeStep)}
                </FormProvider>
              </Box>
            </Paper>
            <Box sx={{ display: 'flex', m: 2 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Box sx={{ flexGrow: 1 }} />
              {activeStep === steps.length - 1 ? (
                <Button variant="contained" onClick={onSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              )}
            </Box>
          </>
        )}
      </> */}
    </Dialog>
  );
}

CreatorForm.propTypes = {
  creator: PropTypes.object,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
