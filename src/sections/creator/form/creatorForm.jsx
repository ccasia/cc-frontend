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
import { Stack, Avatar, Button, IconButton, InputAdornment, LinearProgress } from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

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
    instagram: Yup.string(),
    tiktok: Yup.string(),
  }),
];

export default function CreatorForm({ creator, open, onClose }) {
  const [activeStep, setActiveStep] = useState(0);
  const [newCreator, setNewCreator] = useState({});
  const [ratingInterst, setRatingInterst] = useState([]);
  const [ratingIndustries, setRatingIndustries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = useTheme();
  const router = useRouter();
  const { logout } = useAuthContext();
  const smDown = useResponsive('down', 'sm');

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
      open={open}
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

      <Box
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
      </Box>
    </Dialog>
  );
}

CreatorForm.propTypes = {
  creator: PropTypes.object,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
