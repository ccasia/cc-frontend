import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import ReCAPTCHA from 'react-google-recaptcha';
import { Page, pdfjs, Document } from 'react-pdf';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Link from '@mui/material/Link';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Fade,
  Stack,
  Paper,
  Dialog,
  Button,
  Popper,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  useMediaQuery,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useCreator } from 'src/hooks/zustands/useCreator';

import { useAuthContext } from 'src/auth/hooks';
import { RECAPTCHA_SITEKEY } from 'src/config-global';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const PdfModal = ({ open, onClose, pdfFile, title }) => {
  const [numPages, setNumPages] = useState(null);
  // const [pageNumber, setPageNumber] = useState(1);
  const isSmallScreen = useMediaQuery('(max-width: 600px)');

  // eslint-disable-next-line no-shadow
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullScreen={isSmallScreen}>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <Box sx={{ flexGrow: 1, mt: 1, borderRadius: 2, overflow: 'scroll' }}>
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            // options={{ cMapUrl: 'cmaps/', cMapPacked: true }}
            options={{ cMapUrl: 'cmaps/', cMapPacked: true }}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <div key={index} style={{ marginBottom: '0px' }}>
                <Page
                  key={`${index}-${isSmallScreen ? '1' : '1.5'}`}
                  pageNumber={index + 1}
                  scale={isSmallScreen ? 0.7 : 1.5}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  style={{ overflow: 'scroll' }}
                  // style={{ margin: 0, padding: 0, position: 'relative' }}
                />
              </div>
            ))}
          </Document>
        </Box>
      </DialogContent>

      {/* </DialogContent> */}
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const Register = () => {
  const password = useBoolean();

  const mdDown = useResponsive('down', 'lg');

  const { register } = useAuthContext();

  const router = useRouter();

  const { setEmail } = useCreator();

  const [openTermsModal, setOpenTermsModal] = useState(false);

  const [openPrivacyModal, setOpenPrivacyModal] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenTerms = () => {
    setOpenTermsModal(true);
  };

  const handleOpenPrivacy = () => {
    setOpenPrivacyModal(true);
  };

  const handleCloseTerms = () => {
    setOpenTermsModal(false);
  };

  const handleClosePrivacy = () => {
    setOpenPrivacyModal(false);
  };

  const RegisterSchema = Yup.object().shape({
    name: Yup.string().required('First name required'),
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    password: Yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters long')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
      .matches(/[0-9]/, 'Password must contain at least one number')
      .matches(/[@$!%*?&#]/, 'Password must contain at least one special character'),
    confirmPassword: Yup.string()
      .required('Confirm password is required')
      .oneOf([Yup.ref('password')], 'Passwords must match'),
    recaptcha: Yup.string().required('Please complete the reCAPTCHA'),
  });

  const defaultValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    recaptcha: '',
  };

  const methods = useForm({
    // reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: yupResolver(RegisterSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors, isValid },
    setValue,
    watch,
  } = methods;

  // To check isValid in realtime
  useEffect(() => {
    watch();
  }, [watch]);

  const errorRecaptcha = errors?.recaptcha;

  const curPassword = watch('password');

  const open = Boolean(anchorEl);

  const id = open ? 'popper' : undefined;

  useEffect(() => {
    const handleClose = (event) => {
      if (anchorEl && !anchorEl.contains(event.target)) {
        setAnchorEl(null);
      }
    };

    window.addEventListener('click', handleClose);

    return () => {
      window.removeEventListener('click', handleClose);
    };
  }, [anchorEl]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const user = await register(data);
      // set an email
      setEmail(user);

      router.push(paths.auth.verify);
    } catch (err) {
      enqueueSnackbar(err?.message, {
        variant: 'error',
      });
    } finally {
      setValue('recaptcha', '', { shouldValidate: true });
    }
  });

  const criteria = [
    { label: 'At least 8 characters', test: curPassword.length >= 8 },
    { label: 'an uppercase letter', test: /[A-Z]/.test(curPassword) },
    { label: 'a lowercase letter', test: /[a-z]/.test(curPassword) },
    { label: 'a number', test: /[0-9]/.test(curPassword) },
    {
      label: 'a special character (@, $, !, %, *, ?, &, #)',
      test: /[@$!%*?&#]/.test(curPassword),
    },
  ];

  const renderPasswordValidations = (
    <Stack>
      <Typography variant="caption" gutterBottom color="text.secondary">
        It&apos;s better to have:
      </Typography>
      {criteria.map((rule, index) => (
        <Stack key={index} direction="row" alignItems="center" spacing={0.5}>
          {rule.test ? (
            <Iconify icon="ic:round-check" color={rule.test && 'success.main'} />
          ) : (
            <Iconify icon="mdi:dot" />
          )}
          <Typography
            variant="caption"
            sx={{
              ...(curPassword &&
                rule.test && {
                  color: 'success.main',
                  textDecoration: 'line-through',
                }),
            }}
          >
            {rule.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );

  const renderHead = (
    <Stack direction="row" spacing={0.5} my={1.5}>
      <Typography variant="body2">Already have an account?</Typography>
      <Link
        href={paths.auth.jwt.login}
        component={RouterLink}
        variant="subtitle2"
        color="rgba(19, 64, 255, 1)"
      >
        Login
      </Link>
    </Stack>
  );

  const renderForm = (
    <Stack spacing={2.5}>
      <RHFTextField name="name" label="Full Name" />

      <RHFTextField name="email" label="Email address" />

      <Controller
        name="password"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <TextField
            onClick={(e) => {
              setAnchorEl(e.currentTarget);
            }}
            aria-describedby={id}
            {...field}
            label="Password"
            type={password.value ? 'text' : 'password'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={password.onToggle} edge="end">
                    <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            error={!!error}
          />
        )}
      />

      <Popper
        id={id}
        open={open}
        anchorEl={anchorEl}
        placement={mdDown ? 'top' : 'right'}
        transition
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper
              sx={{
                position: 'relative',
                borderRadius: 2,
                boxShadow: 10,
                border: 1,
                borderColor: '#EBEBEB',
                ml: 2,
                p: 2,
                ...(mdDown && {
                  mb: 2,
                  ml: 0,
                }),
              }}
            >
              <Iconify
                icon="ic:round-arrow-left"
                width={30}
                color="white"
                sx={{
                  position: 'absolute',
                  left: -17,
                  top: !mdDown && '50%',
                  transform: 'translateY(-50%)',
                  ...(mdDown && {
                    position: 'absolute',
                    bottom: -17,
                    left: '50%',
                    transform: 'translateX(-50%) rotate(-90deg)',
                  }),
                }}
              />
              {renderPasswordValidations}
            </Paper>
          </Fade>
        )}
      </Popper>

      <RHFTextField
        name="confirmPassword"
        label="Confirm Password"
        type={password.value ? 'text' : 'password'}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        sx={{
          background: isValid
            ? '#1340FF'
            : 'linear-gradient(0deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.60) 100%), #1340FF',
          pointerEvents: !isValid && 'none',
        }}
      >
        Join Now
      </LoadingButton>
    </Stack>
  );

  const renderTerms = (
    <Typography
      component="div"
      sx={{
        mt: 2.5,
        textAlign: 'center',
        typography: 'caption',
        color: 'text.secondary',
      }}
    >
      {'By signing up, I agree to '}
      <Link
        component="button"
        underline="always"
        color="text.primary"
        onClick={handleOpenTerms}
        type="button"
      >
        Terms of Service
      </Link>
      {' and '}
      <Link
        component="button"
        underline="always"
        color="text.primary"
        onClick={handleOpenPrivacy}
        type="button"
      >
        Privacy Policy
      </Link>
      .
    </Typography>
  );

  useEffect(() => {
    if (errorRecaptcha) {
      enqueueSnackbar(errorRecaptcha?.message, {
        variant: 'error',
      });
    }
  }, [errorRecaptcha]);

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Box
        sx={{
          p: 3,
          bgcolor: '#F4F4F4',
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            fontWeight: 400,
          }}
        >
          Join The Cult 👽
        </Typography>

        {renderHead}

        <Box
          sx={{
            mt: 3,
            textAlign: 'center',
          }}
        >
          {renderForm}

          <Box sx={{ mt: 2, display: 'inline-flex' }}>
            <ReCAPTCHA
              sitekey={RECAPTCHA_SITEKEY}
              onChange={(token) => {
                setValue('recaptcha', token, { shouldValidate: true });
              }}
            />
          </Box>

          {renderTerms}
        </Box>
      </Box>

      <PdfModal
        open={openTermsModal}
        onClose={handleCloseTerms}
        pdfFile="https://storage.googleapis.com/cult_production/pdf/tnc%20copy.pdf"
        title="Terms and Conditions"
      />

      <PdfModal
        open={openPrivacyModal}
        onClose={handleClosePrivacy}
        pdfFile="https://storage.googleapis.com/cult_production/pdf/privacy-policy%20copy.pdf"
        title="Privacy Policy"
      />
    </FormProvider>
  );
};

export default Register;

PdfModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pdfFile: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};
