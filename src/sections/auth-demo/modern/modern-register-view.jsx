import * as Yup from 'yup';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Page, pdfjs, Document } from 'react-pdf';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
// import { Alert, Box } from '@mui/material';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import { useMediaQuery } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';
import { useCreator } from 'src/hooks/zustands/useCreator';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ----------------------------------------------------------------------

const PdfModal = ({ open, onClose, pdfFile, title }) => {
  const [numPages, setNumPages] = useState(null);
  // const [pageNumber, setPageNumber] = useState(1);
  const isSmallScreen = useMediaQuery('(max-width: 600px)');

  // eslint-disable-next-line no-shadow
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // const handlePrevPage = () => {
  //   setPageNumber((prevPageNumber) => Math.max(prevPageNumber - 1, 1));
  // };

  // const handleNextPage = () => {
  //   setPageNumber((prevPageNumber) => Math.min(prevPageNumber + 1, numPages));
  // };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg">
      <DialogTitle>{title}</DialogTitle>
      {/* <Typography> Pages {pageNumber}/{numPages} </Typography>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <Button onClick={handlePrevPage} disabled={pageNumber <= 1}>
            Previous
          </Button>
          <Button onClick={handleNextPage} disabled={pageNumber >= numPages}>
            Next
          </Button>
        </div> */}
      {/* <DialogContent dividers> */}
      <Box sx={{ flexGrow: 1, mt: 2 }}>
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
                // scale={1.5}
                scale={isSmallScreen ? -0.7 : 1.5}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                style={{ margin: 0, padding: 0, position: 'relative' }}
              />
            </div>
          ))}
        </Document>
      </Box>

      {/* </DialogContent> */}

      <Button onClick={onClose}>Close</Button>
    </Dialog>
  );
};

export default function ModernRegisterView() {
  const password = useBoolean();
  const { register } = useAuthContext();
  const [error, setError] = useState();
  const router = useRouter();
  const { setEmail } = useCreator();
  const [openTermsModal, setOpenTermsModal] = useState(false);
  const [openPrivacyModal, setOpenPrivacyModal] = useState(false);

  // Handlers for opening/closing modals
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
      setError(err.message);
    }
  });

  const renderHead = (
    <Stack spacing={2} sx={{ mb: 5, position: 'relative' }}>
      <Typography variant="h4">Let&apos;s match you to brands test</Typography>

      <Stack direction="row" spacing={0.5}>
        <Typography variant="body2"> Already have an account? </Typography>

        <Link href={paths.auth.jwt.login} component={RouterLink} variant="subtitle2">
          Sign in
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
        Create account
      </LoadingButton>
    </Stack>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      {renderHead}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {renderForm}

      {renderTerms}

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
    </FormProvider>
  );
}

PdfModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pdfFile: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};
