/* eslint-disable no-unused-vars */
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import ReCAPTCHA from 'react-google-recaptcha';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import { LoadingButton } from '@mui/lab';
import Dialog from '@mui/material/Dialog';
import { Stack, Avatar, Button, useTheme, InputAdornment } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { countries } from 'src/assets/data';
import { useAuthContext } from 'src/auth/hooks';
import { RECAPTCHA_SITEKEY } from 'src/config-global';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

// import LastStep from './steps/lastStep';
// import FirstStep from './steps/firstStep';
import ThirdStep from './steps/thirdStep';
import FourthStep from './steps/fourtStep';
import SecondStep from './steps/secondStep';

// const steps = ['Fill in your details', 'Provide your social media information'];
const steps = [
  // {
  //   title: 'Welcome to the Cult, Cipta! 👋',
  //   description: 'Before we get started, let's get to know more about you.',
  // },
  {
    title: "Tell us where you're from 🌏",
    description: "We'll use this to connect you with brands in your area.",
  },
  {
    title: 'Fill up your personal details ✏️',
    description: 'This will help us set up your profile!',
  },
  {
    title: 'Now add some extra details 😉',
    description: "We'll use this to make tailored recommendations.",
  },
  // {
  //   title: 'Lastly, what are your socials 🤳',
  //   description: 'This will help add further content to your profile!',
  // },
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

// const stepSchemas = [
//   // null,
//   Yup.object({
//     location: Yup.string().required('City/Area is required'),
//     Nationality: Yup.string().required('Nationality is required'),
//   }),
//   Yup.object({
//     phone: Yup.string().required('Phone number is required'),
//     pronounce: Yup.string().required('Pronouns are required'),
//     employment: Yup.string().required('Employment status is required'),
//     birthDate: Yup.mixed().nullable().required('Please enter your birth date'),
//   }),
//   Yup.object({
//     interests: Yup.array().min(3, 'Choose at least three option'),
//     languages: Yup.array().min(1, 'Choose at least one option'),
//     recaptcha: Yup.string().required('Please complete the reCAPTCHA'),
//     // }),
//     // Yup.object({
//     //   instagram: Yup.string(),
//     //   tiktok: Yup.string(),
//   }),
// ];

const stepSchemas = Yup.object({
  // location: Yup.string().required('City/Area is required'),
  Nationality: Yup.string().required('Nationality is required'),
  city: Yup.string().required('City is required'),
  phone: Yup.string().required('Phone number is required'),
  pronounce: Yup.string().required('Pronouns are required'),
  // employment: Yup.string().required('Employment status is required'),
  birthDate: Yup.mixed().nullable().required('Please enter your birth date'),
  interests: Yup.array().min(3, 'Choose at least three option'),
  languages: Yup.array().min(1, 'Choose at least one option'),
  recaptcha: Yup.string().required('Please complete the reCAPTCHA'),
});

// Add error icon component
const ErrorIcon = () => (
  <Box
    component="img"
    src="/assets/icons/components/ic_fillpaymenterror.svg"
    sx={{
      width: 20,
      height: 20,
      ml: 1,
    }}
  />
);

export default function CreatorForm({ open, onClose, onSubmit: registerUser }) {
  const [activeStep, setActiveStep] = useState(0);
  const [newCreator, setNewCreator] = useState({});
  const [ratingInterst, setRatingInterst] = useState([]);
  const [ratingIndustries, setRatingIndustries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState({});
  const [countryCode, setCountryCode] = useState('');
  const [stepErrors, setStepErrors] = useState({});

  const { logout, initialize } = useAuthContext();
  const smDown = useResponsive('down', 'sm');
  const theme = useTheme();

  // const resolver = yupResolver(stepSchemas[activeStep] || null);
  const resolver = yupResolver(stepSchemas || null);

  const logo = (
    <Avatar
      sx={{
        width: { xs: 40, sm: 45 },
        height: { xs: 40, sm: 45 },
        borderRadius: 1,
        bgcolor: 'rgba(19, 64, 255, 1)',
      }}
    >
      <Image
        src="/logo/newlogo.svg"
        alt="Background Image"
        style={{
          width: smDown ? 20 : 25,
          height: smDown ? 20 : 25,
          borderRadius: 'inherit',
        }}
      />
    </Avatar>
  );

  const defaultValues = useMemo(
    () => ({
      phone: '',
      tiktok: '',
      pronounce: '',
      // location: '',
      interests: [],
      languages: [],
      instagram: '',
      // employment: '',
      birthDate: null,
      Nationality: '',
      city: '',
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
    formState: { isValid, errors },
  } = methods;

  const nationality = watch('Nationality');
  const languages = watch('languages');
  const pronounce = watch('pronounce');
  const otherPronounce = watch('otherPronounce');

  // Auto-select country code based on nationality
  useEffect(() => {
    if (nationality) {
      // First try exact match
      let selectedCountry = countries.find(country => country.label === nationality);
      
      // If no exact match, try some common variations
      if (!selectedCountry) {
        const countryMappings = {
          'Republic of Korea': 'Korea, Republic of',
          'South Korea': 'Korea, Republic of',
          'North Korea': "Korea, Democratic People's Republic of",
          'United States': 'United States',
          'United Kingdom': 'United Kingdom',
          'Russia': 'Russian Federation',
          'Iran': 'Iran, Islamic Republic of',
          'Syria': 'Syrian Arab Republic',
          'Venezuela': 'Venezuela, Bolivarian Republic of',
          'Bolivia': 'Bolivia, Plurinational State of',
          'Moldova': 'Moldova, Republic of',
          'Macedonia': 'Macedonia, the Former Yugoslav Republic of',
          'Congo': 'Congo, Republic of the',
          'Democratic Republic of the Congo': 'Congo, Democratic Republic of the',
          'Tanzania': 'United Republic of Tanzania',
          'Vietnam': 'Viet Nam',
          'Laos': "Lao People's Democratic Republic",
          'Brunei': 'Brunei Darussalam',
          'Cape Verde': 'Cape Verde',
          'Ivory Coast': "Cote d'Ivoire",
          'Swaziland': 'Swaziland',
          'East Timor': 'Timor-Leste',
          'Palestine': 'Palestine, State of',
          'Vatican City': 'Holy See (Vatican City State)',
          'Micronesia': 'Micronesia, Federated States of',
        };
        
        const mappedName = countryMappings[nationality];
        if (mappedName) {
          selectedCountry = countries.find(country => country.label === mappedName);
        }
      }
      
      if (selectedCountry && selectedCountry.phone) {
        setCountryCode(selectedCountry.phone);
      } else {
        // If no matching country found, keep the current country code
        console.warn(`No phone code found for country: ${nationality}`);
      }
    } else {
      // Clear country code if no nationality is selected
      setCountryCode('');
    }
  }, [nationality]);

  const handleNext = () => {
    const currentValues = getValues();
    const newStepErrors = { ...stepErrors };

    // Check all steps for errors to show proper indicators
    // Location step validation
    if (!currentValues.Nationality || !currentValues.city) {
      newStepErrors[0] = true;
    } else {
      delete newStepErrors[0];
    }

    // Personal step validation
    if (!currentValues.phone || !currentValues.pronounce || !currentValues.birthDate) {
      newStepErrors[1] = true;
    } else {
      delete newStepErrors[1];
    }

    // Additional step validation
    if (!currentValues.languages?.length || currentValues.languages.length < 1 || 
        !currentValues.interests?.length || currentValues.interests.length < 3) {
      newStepErrors[2] = true;
    } else {
      delete newStepErrors[2];
    }

    setStepErrors(newStepErrors);

    // Always allow navigation to next step
    setCompletedSteps((prev) => ({
      ...prev,
      [activeStep]: true,
    }));
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    const currentValues = getValues();
    const newStepErrors = { ...stepErrors };

    // Check all steps for errors to show proper indicators
    // Location step validation
    if (!currentValues.Nationality || !currentValues.city) {
      newStepErrors[0] = true;
    } else {
      delete newStepErrors[0];
    }

    // Personal step validation
    if (!currentValues.phone || !currentValues.pronounce || !currentValues.birthDate) {
      newStepErrors[1] = true;
    } else {
      delete newStepErrors[1];
    }

    // Additional step validation
    if (!currentValues.languages?.length || currentValues.languages.length < 1 || 
        !currentValues.interests?.length || currentValues.interests.length < 3) {
      newStepErrors[2] = true;
    } else {
      delete newStepErrors[2];
    }

    setStepErrors(newStepErrors);

    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);

    try {
      console.log('CreatorForm data being submitted:', data);

      if (registerUser) {
        await registerUser({ ...data, phone: `${countryCode} ${data.phone}` });
      } else {
        try {
          const res = await axiosInstance.put(endpoints.auth.updateCreator, {
            ...data,
            phone: `${countryCode} ${data.phone}`,
            pronounce: data.otherPronounce || data.pronounce,
          });
          enqueueSnackbar(`Welcome ${res.data.name}!`);
          initialize();
        } catch (error) {
          console.error('Error saving creator data:', error);
          enqueueSnackbar('Error saving your profile data. Please try again.', {
            variant: 'error',
          });
        }
      }

      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Something went wrong', {
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  useEffect(() => {
    if (languages.includes('All of the above')) {
      setValue('languages', ['English', 'Malay', 'Chinese', 'Tamil']);
    }
  }, [languages, setValue]);

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
        case 0:
          return <SecondStep item={info} />;
        case 1:
          return (
            <ThirdStep item={info} setCountryCode={setCountryCode} countryCode={countryCode} />
          );
        case 2:
          return <FourthStep item={info} />;
        default:
          return <SecondStep item={info} />;
      }
    },
    [activeStep, countryCode]
  );

  const isNextButtonEnabled = useMemo(() => {
    if (completedSteps[activeStep]) {
      return true;
    }
    return isValid;
  }, [activeStep, completedSteps, isValid]);

  // Adjusted step indicator dimensions for mobile
  const stepWidth = smDown ? 90 : 120;
  const connectorWidth = smDown ? 20 : 40;

  return (
    <Dialog
      fullWidth
      fullScreen
      open={open}
      scroll="paper"
      PaperProps={{
        sx: {
          bgcolor: '#FFF',
          borderRadius: 2,
          p: { xs: 2, sm: 4 },
          m: { xs: 1, sm: 2 },
          height: '97vh',
          position: 'relative',
          overflow: 'hidden',
        },
      }}
    >
      {logo}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 60, sm: 55 },
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: { xs: 350, sm: 500 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          px: { xs: 2, sm: 0 },
          mt: { xs: 2, sm: 0 }
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{ width: '100%' }}
        >
          {/* Location Step */}
          <Box
            onClick={() => activeStep > 0 && setActiveStep(0)}
            sx={{
              width: stepWidth,
              py: 1,
              textAlign: 'center',
              borderRadius: 1.5,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: activeStep === 0 || (completedSteps[0] && activeStep > 0) ? 600 : 400,
              bgcolor: (() => {
                if (activeStep === 0) return '#1340FF';
                if (stepErrors[0]) return '#fff';
                if (completedSteps[0] && activeStep > 0) return '#1340FF';
                return '#fff';
              })(),
              color: (() => {
                if (activeStep === 0) return '#fff';
                if (stepErrors[0]) return '#636366';
                if (completedSteps[0] && activeStep > 0) return '#fff';
                return '#636366';
              })(),
              border: '1px solid',
              borderColor: (() => {
                if (activeStep === 0) return '#1340FF';
                if (stepErrors[0]) return '#D4321C';
                if (activeStep >= 0) return '#1340FF';
                return '#636366';
              })(),
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                opacity: activeStep > 0 ? 0.85 : 1,
              },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box component="span">Location</Box>
            {stepErrors[0] && activeStep !== 0 && <ErrorIcon />}
          </Box>

          {/* Connector Line */}
          <Box
            sx={{
              height: 2,
              flexGrow: 1,
              maxWidth: connectorWidth,
              bgcolor: activeStep >= 1 ? '#1340FF' : '#636366',
            }}
          />

          {/* Personal Step */}
          <Box
            component="div"
            onClick={() => setActiveStep(1)}
            sx={{
              width: stepWidth,
              py: 1,
              textAlign: 'center',
              borderRadius: 1.5,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: activeStep === 1 || (completedSteps[1] && activeStep > 1) ? 600 : 400,
              bgcolor: (() => {
                if (activeStep === 1) return '#1340FF';
                if (stepErrors[1]) return '#fff';
                if (completedSteps[1] && activeStep > 1) return '#1340FF';
                return '#fff';
              })(),
              color: (() => {
                if (activeStep === 1) return '#fff';
                if (stepErrors[1]) return '#636366';
                if (completedSteps[1] && activeStep > 1) return '#fff';
                return '#636366';
              })(),
              border: '1px solid',
              borderColor: (() => {
                if (activeStep === 1) return '#1340FF';
                if (stepErrors[1]) return '#D4321C';
                if (activeStep >= 1) return '#1340FF';
                return '#636366';
              })(),
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                opacity: activeStep > 1 ? 0.85 : 1,
              },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box component="span">Personal</Box>
            {stepErrors[1] && activeStep !== 1 && <ErrorIcon />}
          </Box>

          {/* Connector Line */}
          <Box
            sx={{
              height: 2,
              flexGrow: 1,
              maxWidth: connectorWidth,
              bgcolor: activeStep >= 2 ? '#1340FF' : '#636366',
            }}
          />

          {/* Additional Step */}
          <Box
            onClick={() => setActiveStep(2)}
            sx={{
              width: stepWidth,
              py: 1,
              textAlign: 'center',
              borderRadius: 1.5,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: activeStep === 2 || (completedSteps[2] && activeStep > 2) ? 600 : 400,
              bgcolor: (() => {
                if (activeStep === 2) return '#1340FF';
                if (stepErrors[2]) return '#fff';
                if (completedSteps[2] && activeStep > 2) return '#1340FF';
                return '#fff';
              })(),
              color: (() => {
                if (activeStep === 2) return '#fff';
                if (stepErrors[2]) return '#636366';
                if (completedSteps[2] && activeStep > 2) return '#fff';
                return '#636366';
              })(),
              border: '1px solid',
              borderColor: (() => {
                if (activeStep === 2) return '#1340FF';
                if (stepErrors[2]) return '#D4321C';
                if (activeStep >= 2) return '#1340FF';
                return '#636366';
              })(),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box component="span">Additional</Box>
            {stepErrors[2] && activeStep !== 2 && <ErrorIcon />}
          </Box>
        </Stack>
      </Box>

      <Stack
        alignItems="center"
        sx={{
          mt: { xs: 10, sm: 5 },
          height: 1,
          overflow: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
      >
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Box sx={{ width: '100%', px: { xs: 2, sm: 0 } }}>{renderForm(steps[activeStep])}</Box>

          <Box
            sx={{
              width: 1,
              px: { xs: 2, sm: 4 },
              zIndex: 999,
              textAlign: 'center',
              pb: { xs: 6, sm: 4 },
              ...(smDown && {
                position: 'sticky',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: '#fff',
                pt: 2,
              }),
            }}
          >
            {activeStep < steps.length - 1 && (
              <Stack 
                direction="row" 
                spacing={2} 
                justifyContent="center"
                sx={{ 
                  width: '100%', 
                  maxWidth: { xs: '100%', sm: 400 }, 
                  mx: 'auto',
                  '& .MuiButton-root': {
                    flex: 1,
                    minHeight: { xs: 44, sm: 48 },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }
                }}
              >
                {activeStep > 0 && (
                  <Button
                    onClick={handleBack}
                    sx={{
                      bgcolor: '#fff',
                      border: '1px solid #1340FF',
                      color: '#1340FF',
                      '&:hover': {
                        bgcolor: 'rgba(19, 64, 255, 0.04)',
                      },
                    }}
                  >
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  // disabled={!isNextButtonEnabled}
                  fullWidth={smDown}
                  sx={{
                    bgcolor: '#1340FF',
                    borderBottom: '3px solid #10248c',
                    color: '#FFF',
                    '&:hover': {
                      bgcolor: '#2c55ff',
                      borderBottom: '3px solid #10248c',
                    },
                  }}
                >
                  Next
                </Button>
              </Stack>
            )}

            {activeStep === steps.length - 1 && (
              <>
                <Box
                  sx={{
                    mb: { xs: 3, sm: 5 },
                    mt: { xs: 0, sm: -2 },
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                    transform: smDown ? 'scale(0.85)' : 'none',
                    transformOrigin: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <ReCAPTCHA
                    sitekey={RECAPTCHA_SITEKEY}
                    onChange={(token) => {
                      setValue('recaptcha', token);
                    }}
                  />
                </Box>
                <Stack 
                  direction="row" 
                  spacing={2} 
                  justifyContent="center"
                  sx={{ 
                    width: '100%', 
                    maxWidth: { xs: '100%', sm: 400 }, 
                    mx: 'auto',
                    '& .MuiButton-root': {
                      flex: 1,
                      minHeight: { xs: 44, sm: 48 },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }
                  }}
                >
                  <Button
                    onClick={handleBack}
                    sx={{
                      bgcolor: '#fff',
                      border: '1px solid #1340FF',
                      color: '#1340FF',
                      '&:hover': {
                        bgcolor: 'rgba(19, 64, 255, 0.04)',
                      },
                    }}
                  >
                    Back
                  </Button>
                  <LoadingButton
                    sx={{
                      bgcolor: '#1340FF',
                      boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                      color: '#FFF',
                      '&:hover': {
                        bgcolor: '#1340FF',
                      },
                    }}
                    variant="contained"
                    type="submit"
                    loading={isSubmitting}
                    disabled={!watch('recaptcha')}
                  >
                    Get Started
                  </LoadingButton>
                </Stack>
              </>
            )}
          </Box>
        </FormProvider>
      </Stack>
    </Dialog>
  );
}

CreatorForm.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
};
