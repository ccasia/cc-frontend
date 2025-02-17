import * as Yup from 'yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Page, Document } from 'react-pdf';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import {
  Box,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  useMediaQuery,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// eslint-disable-next-line react/prop-types
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

export default function ModernLoginView() {
  const password = useBoolean();
  const { login } = useAuthContext();
  const [error, setError] = useState();
  const router = useRouter();
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
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await login(data.email, data.password, { admin: false });
      if (res?.user?.role === 'creator') {
        router.push(paths.dashboard.campaign.view);
      }
      enqueueSnackbar('Successfully login');
    } catch (err) {
      enqueueSnackbar(err.message, {
        variant: 'error',
      });
      // setError(err.message);
    }
  });

  const renderHead = (
    <Stack spacing={2} sx={{ mb: 5 }}>
      <Typography variant="h4">Sign in to Cult Creative</Typography>

      <Stack direction="row" spacing={0.5}>
        <Typography variant="body2">New user?</Typography>

        <Link component={RouterLink} href={paths.auth.jwt.register} variant="subtitle2">
          Create an account
        </Link>
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
        color: 'text.secondary',
      }}
    >
      {'By signing up, I agree to '}
      <Link component="button" color="text.primary" onClick={handleOpenTerms} type="button">
        Terms of Service
      </Link>
      {' and '}
      <Link underline="always" color="text.primary" onClick={handleOpenPrivacy} type="button">
        Privacy Policy
      </Link>
      .
    </Typography>
  );

  const renderForm = (
    <Stack spacing={2.5}>
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

      <Link
        component={RouterLink}
        href={paths.auth.jwt.forgetPassword}
        variant="body2"
        color="inherit"
        underline="always"
        sx={{ alignSelf: 'flex-end' }}
      >
        Forgot password?
      </Link>

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
        sx={{ justifyContent: 'space-between', pl: 2, pr: 1.5 }}
      >
        Login
      </LoadingButton>
    </Stack>
  );

  return (
    <>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        {renderHead}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderForm}

        {renderTerms}
      </FormProvider>

      <PdfModal
        open={openTermsModal}
        onClose={handleCloseTerms}
        pdfFile="/assets/pdf/tnc.pdf"
        title="Terms and Conditions"
      />

      {/* Privacy Policy Modal */}
      <PdfModal
        open={openPrivacyModal}
        onClose={handleClosePrivacy}
        pdfFile="/assets/pdf/privacy-policy.pdf"
        title="Privacy Policy"
      />
    </>
  );
}
