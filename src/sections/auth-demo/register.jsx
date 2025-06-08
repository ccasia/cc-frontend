import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { Page, pdfjs, Document } from 'react-pdf';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Link from '@mui/material/Link';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Dialog,
  Button,
  Divider,
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
import { useCreator } from 'src/hooks/zustands/useCreator';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

import CreatorForm from 'src/sections/creator/form/creatorForm';

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

const socialLogins = [
  {
    platform: 'google',
    icon: 'mingcute:google-fill',
  },
  {
    platform: 'facebook',
    icon: 'ic:baseline-facebook',
  },
];

const Register = () => {
  const password = useBoolean();

  const { register } = useAuthContext();

  const router = useRouter();

  const { setEmail } = useCreator();

  const [openTermsModal, setOpenTermsModal] = useState(false);

  const [openPrivacyModal, setOpenPrivacyModal] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [openCreatorForm, setOpenCreatorForm] = useState(false);
  const [formData, setFormData] = useState(null);

  const handleOpenTerms = () => {
    const a = document.createElement('a');
    a.href = `https://cultcreativeasia.com/my/terms-and-conditions`;
    a.target = '_blank';
    a.click();
    document.body.removeChild(a);
    // setOpenTermsModal(true);
  };

  const handleOpenPrivacy = () => {
    const a = document.createElement('a');
    a.href = `https://cultcreativeasia.com/my/privacy-policy`;
    a.target = '_blank';
    a.click();
    document.body.removeChild(a);
    // setOpenPrivacyModal(true);
  };

  const handleCloseTerms = () => {
    setOpenTermsModal(false);
  };

  const handleClosePrivacy = () => {
    setOpenPrivacyModal(false);
  };

  const RegisterSchema = Yup.object().shape({
    name: Yup.string().required('Name is required.'),
    email: Yup.string()
      .required('Email is required')
      .email('Invalid email entered. Please try again.'),
    password: Yup.string()
      .required('Password is required.')
      .min(8, 'Password must be at least 8 characters long.')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .matches(/[a-z]/, 'Password must contain at least one lowercase letter.')
      .matches(/[0-9]/, 'Password must contain at least one number.')
      .matches(/[@$!%*?&#]/, 'Password must contain at least one special character.'),
    // confirmPassword: Yup.string()
    //   .required('Confirm password is required.')
    //   .oneOf([Yup.ref('password')], 'Passwords do not match. Please try again.'),
    // recaptcha: Yup.string().required('Please complete the reCAPTCHA'),
  });

  const defaultValues = {
    name: '',
    email: '',
    password: '',
    // confirmPassword: '',
    // recaptcha: '',
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
    formState: { isSubmitting, isValid },
    watch,
  } = methods;

  // To check isValid in realtime
  useEffect(() => {
    watch();
  }, [watch]);

  // const errorRecaptcha = errors?.recaptcha;

  const curPassword = watch('password');

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
      setFormData(data);
      setOpenCreatorForm(true);
    } catch (err) {
      if (err.message === 'Email already exists') {
        methods.setError('email', {
          type: 'manual',
          message: 'Email already registered. Please try again.',
        });
      } else if (err.message === 'Invalid name format') {
        methods.setError('name', {
          type: 'manual',
          message: 'Invalid name format. Please try again.',
        });
      } else if (err.message === 'Password requirements not met') {
        methods.setError('password', {
          type: 'manual',
          message: 'Password does not meet requirements. Please try again.',
        });
      } else if (err.message === 'Passwords do not match') {
        // methods.setError('confirmPassword', {
        //   type: 'manual',
        //   message: 'Passwords do not match. Please try again.'
        // });
      } else {
        methods.setError('password', {
          type: 'manual',
          message: 'An error occurred. Please try again.',
        });
      }
    }
  });

  const handleRegister = async (creatorData) => {
    try {
      if (formData) {
        console.log('Creator data from form:', creatorData);

        // Get reCAPTCHA token from creatorData
        if (!creatorData.recaptcha) {
          enqueueSnackbar('reCAPTCHA verification is required', { variant: 'error' });
          return;
        }

        // registration payload
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
          },
        };

        // console.log('Sending registration payload with token from creatorForm');
        const user = await register(registerPayload);
        setEmail(user);

        // if (user) {
        //   localStorage.setItem('pendingCreatorData', JSON.stringify(registerPayload.creatorData));
        // }

        router.push(paths.auth.verify);
      }
    } catch (err) {
      console.error('Registration error:', err.message);

      if (err.message === 'Token is missing.') {
        enqueueSnackbar('reCAPTCHA verification failed. Please try again.', {
          variant: 'error',
        });
      } else if (err.message === 'Email already exists') {
        methods.setError('email', {
          type: 'manual',
          message: 'Email already registered. Please try again.',
        });
      } else if (err.message === 'Invalid name format') {
        methods.setError('name', {
          type: 'manual',
          message: 'Invalid name format. Please try again.',
        });
      } else if (err.message === 'Password requirements not met') {
        methods.setError('password', {
          type: 'manual',
          message: 'Password does not meet requirements. Please try again.',
        });
      } else {
        methods.setError('password', {
          type: 'manual',
          message: 'An error occurred. Please try again.',
        });
      }
      setOpenCreatorForm(false);
    }
  };

  const criteria = [
    { label: 'At least 8 characters', test: curPassword.length >= 8 },
    { label: 'At least 1 number (0 - 9)', test: /[0-9]/.test(curPassword) },
    { label: 'At least 1 special character (! - $)', test: /[@$!%*?&#]/.test(curPassword) },
    {
      label: 'At least 1 upper case and 1 lower case letter',
      test: /[A-Z]/.test(curPassword) && /[a-z]/.test(curPassword),
    },
  ];

  const renderPasswordValidations = (
    <Stack sx={{ ml: 2 }}>
      {criteria.map((rule, index) => {
        const hasValue = {
          'At least 8 characters': curPassword.length > 0,
          'At least 1 number (0 - 9)': /[0-9]/.test(curPassword),
          'At least 1 special character (! - $)': /[@$!%*?&#]/.test(curPassword),
          'At least 1 upper case and 1 lower case letter':
            /[A-Z]/.test(curPassword) || /[a-z]/.test(curPassword),
        };

        const textColor = '#636366';
        let dotColor = '#919191';
        // let textColor = '#636366';

        if (rule.test) {
          dotColor = 'success.main';
          // textColor = 'success.main';
        } else if (hasValue[rule.label]) {
          dotColor = '#F4A931';
          // textColor = '#F4A931';
        }

        return (
          <Stack key={index} direction="row" alignItems="center" spacing={0.5}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: dotColor,
                ml: 0.5,
                mr: 1,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontSize: '12px',
                fontWeight: 400,
                color: textColor,
              }}
            >
              {rule.label}
            </Typography>
          </Stack>
        );
      })}
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
      <Typography
        variant="body2"
        color="#636366"
        fontWeight={500}
        sx={{ fontSize: '13px', mb: -2, textAlign: 'left' }}
      >
        Name{' '}
        <Box component="span" sx={{ color: 'error.main' }}>
          *
        </Box>
      </Typography>
      <Box>
        <RHFTextField
          name="name"
          placeholder="Name"
          InputLabelProps={{ shrink: false }}
          FormHelperTextProps={{ sx: { display: 'none' } }}
          sx={{
            '&.MuiTextField-root': {
              bgcolor: 'white',
              borderRadius: 1,
              '& .MuiInputLabel-root': {
                display: 'none',
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#B0B0B0',
                fontSize: '16px',
                opacity: 1,
              },
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: '#F04438',
            mt: 0.5,
            ml: 0.5,
            display: 'block',
            fontSize: '12px',
            textAlign: 'left',
          }}
        >
          {methods.formState.errors.name?.message}
        </Typography>
      </Box>

      <Typography
        variant="body2"
        color="#636366"
        fontWeight={500}
        sx={{ fontSize: '13px', mb: -2, textAlign: 'left' }}
      >
        Email{' '}
        <Box component="span" sx={{ color: 'error.main' }}>
          *
        </Box>
      </Typography>
      <Box>
        <RHFTextField
          name="email"
          placeholder="Email"
          InputLabelProps={{ shrink: false }}
          FormHelperTextProps={{ sx: { display: 'none' } }}
          sx={{
            '&.MuiTextField-root': {
              bgcolor: 'white',
              borderRadius: 1,
              '& .MuiInputLabel-root': {
                display: 'none',
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#B0B0B0',
                fontSize: '16px',
                opacity: 1,
              },
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: '#F04438',
            mt: 0.5,
            ml: 0.5,
            display: 'block',
            fontSize: '12px',
            textAlign: 'left',
          }}
        >
          {methods.formState.errors.email?.message}
        </Typography>
      </Box>

      {/* Password field */}
      <Typography
        variant="body2"
        color="#636366"
        fontWeight={500}
        sx={{ fontSize: '13px', mb: -2, textAlign: 'left' }}
      >
        Password{' '}
        <Box component="span" sx={{ color: 'error.main' }}>
          *
        </Box>
      </Typography>
      <Box>
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState: { error } }) => (
            // <TextField
            // onClick={(e) => {
            //   setAnchorEl(e.currentTarget);
            // }}
            // aria-describedby={id}
            // {...field}
            // placeholder="Password"
            // type={password.value ? 'text' : 'password'}
            // InputProps={{
            //   endAdornment: (
            //     <InputAdornment position="end">
            //       <IconButton onClick={password.onToggle} edge="end">
            //         <Box component="img" src={`/assets/icons/components/${password.value ? 'ic_open_passwordeye.svg'
            //         : 'ic_closed_passwordeye.svg'}`} sx={{ width: 24, height: 24 }} />
            //       </IconButton>
            //     </InputAdornment>
            //   ),
            // }}

            // error={!!error}
            <RHFTextField
              name="password"
              placeholder="Password"
              InputLabelProps={{ shrink: false }}
              FormHelperTextProps={{ sx: { display: 'none' } }}
              sx={{
                '&.MuiTextField-root': {
                  bgcolor: 'white',
                  borderRadius: 1,
                  '& .MuiInputLabel-root': {
                    display: 'none',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#B0B0B0',
                    fontSize: '16px',
                    opacity: 1,
                  },
                },
              }}
              {...field}
              type={password.value ? 'text' : 'password'}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={(e) => {
                field.onBlur(e);
                if (!field.value) {
                  setIsPasswordFocused(false);
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ mr: 1 }}>
                    <IconButton onClick={password.onToggle} edge="end">
                      <Box
                        component="img"
                        src={`/assets/icons/components/${
                          password.value ? 'ic_open_passwordeye.svg' : 'ic_closed_passwordeye.svg'
                        }`}
                        sx={{ width: 24, height: 24 }}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              error={!!error}
            />
          )}
        />

        <Typography
          variant="caption"
          sx={{
            color: '#F04438',
            mt: 0.5,
            ml: 0.5,
            display: 'block',
            textAlign: 'left',
          }}
        >
          {methods.formState.errors.password?.message}
        </Typography>

        {/* <Popper
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
      </Popper> */}

        {/* <Typography variant="body2" color="#636366" fontWeight={500} sx={{ fontSize: '13px', mb: -2, textAlign: 'left' }}>
        Confirm Password <Box component="span" sx={{ color: 'error.main' }}>*</Box>
      </Typography>
      <Box>
      <RHFTextField
        name="confirmPassword"
        placeholder="Confirm Password"    
        InputLabelProps={{ shrink: false }}
        FormHelperTextProps={{ sx: { display: 'none' } }}
        sx={{
          '&.MuiTextField-root': {
            bgcolor: 'white',
            borderRadius: 1,
          },
        }}
        type={password.value ? 'text' : 'password'}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                  <Box component="img" src={`/assets/icons/components/${password.value ? 'ic_open_passwordeye.svg' 
                  : 'ic_closed_passwordeye.svg'}`} sx={{ width: 24, height: 24 }} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Typography   
          variant="caption" 
          sx={{ 
            color: '#F04438',
            mt: 0.5,
            ml: 0.5,
            display: 'block',
            textAlign: 'left',
          }}
        >
          {methods.formState.errors.confirmPassword?.message}
        </Typography>
      </Box> */}

        {isPasswordFocused && <Box sx={{ mt: 1, ml: 0.5 }}>{renderPasswordValidations}</Box>}
      </Box>

      {/* <Box>
          <ReCAPTCHA
            sitekey={RECAPTCHA_SITEKEY}
            onChange={(token) => {
              setValue('recaptcha', token, { shouldValidate: true });
            }}
          />
      </Box> */}

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
          fontSize: '17px',
          fontWeight: 600,
          borderRadius: '12px',
          borderBottom: isValid ? '3px solid #0c2aa6' : '3px solid #91a2e5',
          transition: 'none',
        }}
      >
        Join Now
      </LoadingButton>

      <Divider textAlign="center" sx={{ color: 'text.secondary', fontSize: 14 }}>
        More login options
      </Divider>

      <Stack direction="row" justifyContent="center" spacing={2}>
        {socialLogins.map((item) => (
          // const handleAuth = item.platform === 'google' ? googleAuth : null;

          <LoadingButton
            fullWidth
            size="large"
            variant="outlined"
            loading={isSubmitting}
            // onClick={handleAuth}
            sx={{
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
              bgcolor: '#1340FF',
              color: 'whitesmoke',
              width: 80,
              py: 1,
              '&:hover': {
                bgcolor: '#1340FF',
              },
            }}
            disabled={item.platform === 'facebook'}
          >
            <Iconify icon={item.icon} width={25} />
          </LoadingButton>
        ))}
      </Stack>
    </Stack>
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
      }}
    >
      By signing up, I agree to
      <Link
        component="button"
        underline="always"
        color="text.primary"
        onClick={handleOpenTerms}
        type="button"
        sx={{
          verticalAlign: 'baseline',
          fontSize: '13px',
          lineHeight: 1,
          p: 0,
          color: '#231F20',
        }}
      >
        Terms of Service
      </Link>
      and
      <Link
        component="button"
        underline="always"
        color="text.primary"
        onClick={handleOpenPrivacy}
        type="button"
        sx={{
          verticalAlign: 'baseline',
          fontSize: '13px',
          lineHeight: 1,
          p: 0,
          color: '#231F20',
        }}
      >
        Privacy Policy.
      </Link>
    </Typography>
  );

  // useEffect(() => {
  //   if (errorRecaptcha) {
  //     enqueueSnackbar(errorRecaptcha?.message, {
  //       variant: 'error',
  //     });
  //   }
  // }, [errorRecaptcha]);

  return (
    <>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Box
          sx={{
            p: 3,
            bgcolor: '#F4F4F4',
            borderRadius: 2,
            width: { xs: '100%', sm: 470 },
            maxWidth: { xs: '100%', sm: 470 },
            mx: 'auto',
          }}
        >
          <Typography
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontSize: '40px',
              fontWeight: 400,
              mb: -0.5,
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

            {renderTerms}
          </Box>
        </Box>
      </FormProvider>

      <CreatorForm
        open={openCreatorForm}
        onClose={() => setOpenCreatorForm(false)}
        onSubmit={handleRegister}
      />

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
    </>
  );
};

export default Register;

PdfModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pdfFile: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};
