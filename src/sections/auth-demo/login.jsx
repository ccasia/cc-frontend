import * as Yup from 'yup';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Page, Document } from 'react-pdf';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import Link from '@mui/material/Link';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Dialog,
  Button,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  DialogActions,
  InputAdornment,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

// import error from '../../../public/sounds/error.mp3';

// eslint-disable-next-line react/prop-types
const PdfModal = ({ open, onClose, pdfFile, title }) => {
  const [numPages, setNumPages] = useState(null);
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

const Login = () => {
  const password = useBoolean();
  const [openTermsModal, setOpenTermsModal] = useState(false);
  const [openPrivacyModal, setOpenPrivacyModal] = useState(false);
  // const [play] = useSound(error, {
  //   interrupt: true,
  // });

  const { login } = useAuthContext();
  const router = useRouter();

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

  const LoginSchema = Yup.object().shape({
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    password: Yup.string().required('Password is required'),
  });

  const defaultValues = {
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: yupResolver(LoginSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await login(data.email, data.password, { admin: false });
      // if (res?.user?.role === 'creator') {
      //   router.push(paths.dashboard.overview.root);
      // }
      enqueueSnackbar('Successfully login');
    } catch (err) {
      // play();
      enqueueSnackbar(err.message, {
        variant: 'error',
      });
    }
  });

  const renderForm = (
    <Stack spacing={2.5}>
      <RHFTextField
        name="email"
        label="Email address"
        sx={{
          '&.MuiTextField-root': {
            bgcolor: 'white',
            borderRadius: 1,
          },
        }}
      />

      <RHFTextField
        name="password"
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
        sx={{
          '&.MuiTextField-root': {
            bgcolor: 'white',
            borderRadius: 1,
          },
        }}
      />

      <Link
        component={RouterLink}
        href={paths.auth.jwt.forgetPassword}
        variant="body2"
        color="#636366"
        underline="always"
        sx={{ alignSelf: 'flex-start' }}
      >
        Forgot your password?
      </Link>

      <LoadingButton
        fullWidth
        sx={{
          background: isDirty
            ? '#1340FF'
            : 'linear-gradient(0deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.60) 100%), #1340FF',
          pointerEvents: !isDirty && 'none',
          fontSize: '18px',
        }}
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        // disabled={!isDirty}
      >
        Login
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

  return (
    <>
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
            // fontWeight="bold"
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontWeight: 400,
            }}
          >
            Login 👾
          </Typography>

          <Stack direction="row" spacing={0.5} my={2}>
            <Typography variant="body2">New user?</Typography>

            <Link
              component={RouterLink}
              href={paths.auth.jwt.register}
              variant="body2"
              color="#1340FF"
              fontWeight={600}
            >
              Create an account
            </Link>
          </Stack>

          <Box
            sx={{
              mt: 3,
            }}
          >
            {renderForm}
          </Box>
          {renderTerms}
        </Box>
      </FormProvider>
      <PdfModal
        open={openTermsModal}
        onClose={handleCloseTerms}
        pdfFile="/assets/pdf/tnc.pdf"
        title="Terms and Conditions"
      />

      <PdfModal
        open={openPrivacyModal}
        onClose={handleClosePrivacy}
        pdfFile="/assets/pdf/privacy-policy.pdf"
        title="Privacy Policy"
      />
    </>
  );
};

export default Login;
