import * as Yup from 'yup';
import PropTypes from 'prop-types';
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
  Avatar,
  Dialog,
  Button,
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
import Image from 'src/components/image/image';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

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
  const { register } = useAuthContext();
  const [error, setError] = useState();
  const router = useRouter();
  const { setEmail } = useCreator();
  const [openTermsModal, setOpenTermsModal] = useState(false);
  const [openPrivacyModal, setOpenPrivacyModal] = useState(false);

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
    password: Yup.string().required('Password is required'),
  });

  const defaultValues = {
    name: '',
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: yupResolver(RegisterSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

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
    }
  });

  const renderHead = (
    <Stack direction="row" spacing={0.5}>
      <Typography variant="body2">Already have an account?</Typography>
      <Link
        href={paths.auth.jwt.login}
        component={RouterLink}
        variant="subtitle2"
        color="rgba(19, 64, 255, 1)"
      >
        Sign in
      </Link>
    </Stack>
  );

  const renderForm = (
    <Stack spacing={2.5}>
      {/* <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}> */}
      <RHFTextField name="name" label="Name" />
      {/* </Stack> */}

      <RHFTextField name="email" label="Email address" />

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
      />

      {renderHead}

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        sx={{
          background: 'linear-gradient(180deg, #138EFF 0%, #1340FF 100%)',
        }}
      >
        Create account
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
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Box
        sx={{
          p: 3,
        }}
      >
        <Box
          component="div"
          sx={{
            position: 'relative',
            mb: 3,
            width: 55,
            height: 55,
            borderRadius: 10,
          }}
        >
          <Image
            src="/assets/icons/auth/Vector.svg"
            alt="Background Image"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 'inherit',
            }}
          />
          <Avatar
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 40,
              height: 40,
            }}
            src="/assets/icons/auth/test.svg"
          />
        </Box>

        <Typography variant="h3" fontWeight="bold">
          Register 👾
        </Typography>
        <Box
          sx={{
            mt: 3,
          }}
        >
          {renderForm}

          {renderTerms}
        </Box>
      </Box>

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
