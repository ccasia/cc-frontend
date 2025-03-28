/* eslint-disable no-unused-vars */
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import { LoadingButton } from '@mui/lab';
import Dialog from '@mui/material/Dialog';
import { Stack, Avatar, Button, IconButton, InputAdornment } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import ReCAPTCHA from 'react-google-recaptcha';
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
    title: 'Tell us where you\'re from 🌏',
    description: 'We\'ll use this to connect you with brands in your area.',
  },
  {
    title: 'Fill up your personal details ✏️',
    description: 'This will help us set up your profile!',
  },
  {
    title: 'Now add some extra details 😉',
    description: 'We\'ll use this to make tailored recommendations.',
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

const stepSchemas = [
  // null,
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
    recaptcha: Yup.string().required('Please complete the reCAPTCHA'),
  // }),
  // Yup.object({
  //   instagram: Yup.string(),
  //   tiktok: Yup.string(),

  }),
];

export default function CreatorForm({ mutate, open, onClose, onSubmit: registerUser }) {
  const [activeStep, setActiveStep] = useState(0);
  const [newCreator, setNewCreator] = useState({});
  const [ratingInterst, setRatingInterst] = useState([]);
  const [ratingIndustries, setRatingIndustries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState({});

  const { logout, initialize } = useAuthContext();
  const smDown = useResponsive('down', 'sm');

  const resolver = yupResolver(stepSchemas[activeStep] || null);

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
    setCompletedSteps((prev) => ({
      ...prev,
      [activeStep]: true,
    }));
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);

    try {
      console.log('CreatorForm data being submitted:', data);
      
      // Verify recaptcha token exists
      if (!data.recaptcha) {
        enqueueSnackbar('Please complete the reCAPTCHA verification', { variant: 'error' });
        setIsSubmitting(false);
        return;
      }
      
      // Pass raw data to the parent handler
      if (registerUser) {
        await registerUser(data);
      } else {
        try {
          const res = await axiosInstance.put(endpoints.auth.updateCreator, {
            ...data,
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
          return <ThirdStep item={info} />;
        case 2:
          return <FourthStep item={info} />;
        default:
          return <SecondStep item={info} />;
      }
    },
    [activeStep]
  );

  const isNextButtonEnabled = useMemo(() => {
    if (completedSteps[activeStep]) {
      return true;
    }
    return isValid;
  }, [activeStep, completedSteps, isValid]);

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
          p: 4,
          m: 2,
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
          top: 55,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 500,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
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
              width: 120,
              py: 1,
              textAlign: 'center',
              borderRadius: 1.5,
              fontWeight: activeStep === 0 || (completedSteps[0] && activeStep > 0) ? 600 : 400,
              bgcolor: activeStep === 0 || (completedSteps[0] && activeStep > 0) ? '#1340FF' : '#fff',
              color: activeStep === 0 || (completedSteps[0] && activeStep > 0) ? '#fff' : '#636366',
              border: '1px solid',
              borderColor: activeStep >= 0 ? '#1340FF' : '#636366',
              cursor: activeStep > 0 ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              '&:hover': {
                opacity: activeStep > 0 ? 0.85 : 1,
              },
            }}
          >
            Location
          </Box>
          
          {/* Connector Line */}
          <Box
            sx={{
              height: 2, 
              flexGrow: 1,
              maxWidth: 40, 
              bgcolor: activeStep >= 1 ? '#1340FF' : '#636366',
            }}
          />
          
          {/* Personal Step */}
          <Box
            onClick={() => activeStep > 1 && setActiveStep(1)}
            sx={{
              width: 120,
              py: 1,
              textAlign: 'center',
              borderRadius: 1.5,
              fontWeight: activeStep === 1 || (completedSteps[1] && activeStep > 1) ? 600 : 400,
              bgcolor: activeStep === 1 || (completedSteps[1] && activeStep > 1) ? '#1340FF' : '#fff',
              color: activeStep === 1 || (completedSteps[1] && activeStep > 1) ? '#fff' : '#636366',
              border: '1px solid',
              borderColor: activeStep >= 1 ? '#1340FF' : '#636366',
              cursor: activeStep > 1 ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              '&:hover': {
                opacity: activeStep > 1 ? 0.85 : 1,
              },
            }}
          >
            Personal
          </Box>
          
          {/* Connector Line */}
          <Box
            sx={{
              height: 2, 
              flexGrow: 1,
              maxWidth: 40, 
              bgcolor: activeStep >= 2 ? '#1340FF' : '#636366',
            }}
          />
          
          {/* Additional Step */}
          <Box
            sx={{
              width: 120,
              py: 1,
              textAlign: 'center',
              borderRadius: 1.5,
              fontWeight: activeStep === 2 || (completedSteps[2] && activeStep > 2) ? 600 : 400,
              bgcolor: activeStep === 2 || (completedSteps[2] && activeStep > 2) ? '#1340FF' : '#fff',
              color: activeStep === 2 || (completedSteps[2] && activeStep > 2) ? '#fff' : '#636366',
              border: '1px solid',
              borderColor: activeStep >= 2 ? '#1340FF' : '#636366',
            }}
          >
            Additional
          </Box>
        </Stack>
      </Box>

      <Stack
        alignItems="center"
        sx={{
          mt: 5,
          height: 1,
          overflow: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <FormProvider methods={methods}>
          <Box>{renderForm(steps[activeStep])}</Box>

          <Box
            sx={{
              width: 1,
              px: 4,
              zIndex: 999,
              textAlign: 'center',
              ...(smDown && {
                position: 'fixed',
                bottom: 30,
                left: '50%',
                transform: 'translateX(-50%)',
              }),
            }}
          >
            {activeStep < steps.length - 1 && (
              <Stack direction="row" spacing={2} justifyContent="center">
                {activeStep > 0 && (
                  <Button
                    onClick={handleBack}
                    fullWidth={smDown}
                    sx={{
                      bgcolor: '#fff',
                      border: '1px solid #1340FF',
                      color: '#1340FF',
                      px: 6,
                      py: 1,
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
                  disabled={!isNextButtonEnabled}
                  fullWidth={smDown}
                  sx={{
                    bgcolor: '#1340FF',
                    borderBottom: '3px solid #10248c',
                    color: '#FFF',
                    px: 6,
                    py: 1,
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
                <Box sx={{ 
                  mb: 5, 
                  mt: -2,
                  display: 'flex', 
                  justifyContent: 'flex-start',
                  width: { sm: 400 },
                  mx: 'auto'
                }}>
                  <ReCAPTCHA
                    sitekey={RECAPTCHA_SITEKEY}
                    onChange={(token) => {
                      console.log('reCAPTCHA token received:', token ? 'valid token' : 'no token');
                      setValue('recaptcha', token, { shouldValidate: true });
                    }}
                    onExpired={() => {
                      console.log('reCAPTCHA token expired');
                      setValue('recaptcha', '', { shouldValidate: true });
                      enqueueSnackbar('reCAPTCHA verification expired. Please verify again.', {
                        variant: 'warning',
                      });
                    }}
                    onErrored={(err) => {
                      console.error('reCAPTCHA error:', err);
                      enqueueSnackbar('Error with reCAPTCHA verification. Please try again.', {
                        variant: 'error',
                      });
                    }}
                  />
                </Box>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                    onClick={handleBack}
                    fullWidth={smDown}
                    sx={{
                      bgcolor: '#fff',
                      border: '1px solid #1340FF',
                      color: '#1340FF',
                      px: 6,
                      py: 1,
                      '&:hover': {
                        bgcolor: 'rgba(19, 64, 255, 0.04)',
                      },
                    }}
                  >
                    Back
                  </Button>
                  <LoadingButton
                    fullWidth={smDown}
                    sx={{
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

      {/* <Box
        sx={{
          ...(smDown
            ? {
                position: 'absolute',
                top: 20,
                right: 20,
              }
            : {
                position: 'absolute',
                bottom: 20,
                left: 20,
              }),
        }}
      >
        {smDown ? (
          <IconButton
            variant="outlined"
            onClick={async () => {
              await logout();
            }}
          >
            <Iconify icon="tabler:logout-2" width={20} />
          </IconButton>
        ) : (
          <Button
            variant="outlined"
            onClick={async () => {
              await logout();
            }}
            startIcon={<Iconify icon="tabler:logout-2" width={20} />}
          >
            Logout
          </Button>
        )}
      </Box> */}
      
    </Dialog>
  );
}

CreatorForm.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
};
