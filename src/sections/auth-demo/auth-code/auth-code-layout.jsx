import useSWR from 'swr';
import { m } from 'framer-motion';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState, useEffect, useCallback, createContext } from 'react';

import { Box, Link, Step, Stepper, StepLabel, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useCreator } from 'src/hooks/zustands/useCreator';

import { fetcher } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import CreatorForm from 'src/sections/creator/form/creatorForm';

import CodeInput from './code-input';
import CredentialsInput from './credentials-input';

const MotionBox = m(Box);

const steps = [{ label: 'Enter Verification code' }, { label: 'Create account' }];

export const AuthCodeProvider = createContext(null);

const AuthCodeLayout = () => {
  const { data, mutate } = useSWR('/api/auth/session-status', fetcher);

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  const creatorForm = useBoolean();
  const router = useRouter();

  const { register } = useAuthContext();
  const { setEmail } = useCreator();

  useEffect(() => {
    if (!data) return;
    if (data.pendingRegistration?.verified) setActiveStep(1);
    if (data.pendingRegistration?.phone) setPhoneNumber(data.pendingRegistration?.phone);
    if (!data.otp && !data.pendingRegistration) {
      router.replace(paths.auth.jwt.register);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleOpenTerms = () => {
    window.open('https://cultcreativeasia.com/my/terms-and-conditions', '_blank');
  };

  const handleOpenPrivacy = () => {
    window.open('https://cultcreativeasia.com/my/privacy-policy', '_blank');
  };

  const onChangeStep = useCallback((step) => setActiveStep(step), []);

  const joinNow = useCallback(() => creatorForm.onTrue(), [creatorForm]);

  const handleRegister = useCallback(
    async (creatorData) => {
      try {
        if (!creatorData.recaptcha) {
          enqueueSnackbar('reCAPTCHA verification is required', { variant: 'error' });
          return;
        }

        const registerPayload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          recaptcha: creatorData.recaptcha,
          creatorData: {
            phone: creatorData.phone || '',
            tiktok: creatorData.tiktok || '',
            pronounce: creatorData.otherPronounce || creatorData.pronounce || '',
            location: creatorData.location || '',
            interests: creatorData.interests || [],
            languages: creatorData.languages || [],
            instagram: creatorData.instagram || '',
            employment: creatorData.employment || 'fulltime',
            birthDate: creatorData.birthDate || null,
            Nationality: creatorData.Nationality || '',
            city: creatorData.city || '',
            referralCode: creatorData.referralCode || '',
            instagramProfileLink: creatorData.instagramProfileLink || '',
            tiktokProfileLink: creatorData.tiktokProfileLink || '',
          },
        };

        const user = await register(registerPayload);
        setEmail(user);
        router.push(paths.dashboard.root);
        enqueueSnackbar('Hi and welcome!');
      } catch (err) {
        console.error('Registration error:', err.message);

        creatorForm.onFalse();
      }
    },
    [creatorForm, formData, register, router, setEmail]
  );

  const value = useMemo(
    () => ({ onChangeStep, handleRegister, joinNow, setFormData, mutate }),
    [onChangeStep, handleRegister, joinNow, mutate]
  );

  const renderTerms = (
    <Typography
      component="div"
      sx={{
        mt: 2.5,
        textAlign: 'center',
        typography: 'caption',
        color: '#8E8E93',
        fontSize: '13px',
      }}
    >
      By signing up, I agree to
      <Link
        component="button"
        underline="always"
        onClick={handleOpenTerms}
        type="button"
        sx={{
          verticalAlign: 'baseline',
          fontSize: '13px',
          lineHeight: 1,
          p: 0,
          color: '#231F20',
          mx: 0.5,
        }}
      >
        Terms of Service
      </Link>
      and
      <Link
        component="button"
        underline="always"
        onClick={handleOpenPrivacy}
        type="button"
        sx={{
          verticalAlign: 'baseline',
          fontSize: '13px',
          lineHeight: 1,
          p: 0,
          color: '#231F20',
          mx: 0.5,
        }}
      >
        Privacy Policy.
      </Link>
    </Typography>
  );

  return (
    <AuthCodeProvider.Provider value={value}>
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4 } }}
        sx={{
          py: 3,
          bgcolor: '#F4F4F4',
          borderRadius: 2,
          width: { xs: 350, md: 600 },
          overflow: 'hidden',
        }}
      >
        <Typography
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            fontSize: '40px',
            fontWeight: 400,
            mb: -0.5,
            textAlign: 'center',
          }}
        >
          Join The Cult 👽
        </Typography>

        <Box sx={{ mt: 5 }}>
          <Stepper alternativeLabel activeStep={activeStep}>
            {steps.map((step) => (
              <Step
                key={step.label}
                sx={{
                  '& .MuiStepIcon-root.Mui-completed': { color: 'black' },
                  '& .MuiStepIcon-root.Mui-active': { color: 'black' },
                }}
              >
                <StepLabel sx={{ '& .MuiStepLabel-labelContainer': { mt: -1 } }}>
                  <Typography variant="subtitle2">{step.label}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && <CodeInput />}
          {activeStep === 1 && <CredentialsInput />}
        </Box>

        {renderTerms}
      </MotionBox>
      <CreatorForm
        open={creatorForm.value}
        onClose={creatorForm.onFalse}
        onSubmit={handleRegister}
        phoneNumber={phoneNumber}
      />
    </AuthCodeProvider.Provider>
  );
};

export default AuthCodeLayout;
