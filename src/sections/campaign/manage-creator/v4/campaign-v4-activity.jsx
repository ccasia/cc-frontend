/* eslint-disable no-case-declarations */
/* eslint-disable no-nested-ternary */
import useSWR from 'swr';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { PDFDocument } from 'pdf-lib';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { Page, pdfjs, Document } from 'react-pdf';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useMemo, useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Stack,
  Paper,
  Button,
  Dialog,
  Divider,
  Collapse,
  MenuItem,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useGetCreatorLogistic } from 'src/hooks/use-get-creator-logistic';

import { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { regions } from 'src/assets/data/regions';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import PDFEditorV2 from 'src/components/pdf/pdf-editor-v2';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFUpload, RHFSelect, RHFTextField } from 'src/components/hook-form';

import V4VideoSubmission from './submissions/v4-video-submission';
import V4PhotoSubmission from './submissions/v4-photo-submission';
import V4RawFootageSubmission from './submissions/v4-raw-footage-submission';

// Configure PDF.js worker
try {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;
} catch (error) {
  console.warn('Failed to set CDN worker, falling back to local worker:', error);
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

// Enhanced Agreement Submission Component with PDF Display and Signing
const AgreementSubmission = ({ campaign, agreementSubmission, onUpdate }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState('');

  // New signing functionality
  const editor = useBoolean();
  const [annotations, setAnnotations] = useState([]);
  const [signURL, setSignURL] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showUploadOption, setShowUploadOption] = useState(false);

  const isSmallScreen = useMediaQuery('(max-width: 600px)');

  const originalAgreementUrl = campaign?.agreement?.agreementUrl;
  const agreementUrl = originalAgreementUrl
    ? originalAgreementUrl.replace(
        'https://storage.googleapis.com/cult-prod/',
        `${window.location.origin}/api/agreement/agreement-template/`
      )
    : null;

  const isAgreementSubmitted =
    agreementSubmission?.status === 'PENDING_REVIEW' ||
    agreementSubmission?.status === 'APPROVED' ||
    agreementSubmission?.status === 'CLIENT_APPROVED';

  const methods = useForm({
    defaultValues: {
      agreementForm: null,
    },
  });

  const { watch, setValue, handleSubmit, reset } = methods;
  const agreementForm = watch('agreementForm');

  const onDocumentLoadSuccess = ({ numPages: pages }) => {
    setNumPages(pages);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    enqueueSnackbar('Failed to load PDF. Please try again.', { variant: 'error' });
  };

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const filename = `${campaign?.id}-${campaign?.name}-agreement.pdf`;

      if ('download' in document.createElement('a')) {
        const link = document.createElement('a');
        const blobUrl = window.URL.createObjectURL(blob);
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);
      } else {
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
          enqueueSnackbar('Please allow popups for this website to download the file.', {
            variant: 'warning',
          });
        }
      }
    } catch (error) {
      enqueueSnackbar('Download failed. Please try again.', { variant: 'error' });
    }
  };

  const handleRemove = () => {
    setValue('agreementForm', null, { shouldValidate: true });
    setValue('agreementForm', null, { shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!data.agreementForm) {
      enqueueSnackbar('Please select a file to upload.', { variant: 'warning' });

      return;
    }

    setUploading(true);
    setOpenUploadModal(false);

    const formData = new FormData();
    formData.append('agreementForm', data.agreementForm);
    formData.append(
      'data',
      JSON.stringify({
        campaignId: campaign.id,
        submissionId: agreementSubmission?.id || null,
      })
    );

    try {
      await fetch(endpoints.submission.creator.agreement, {
        method: 'POST',
        body: formData,
      });

      enqueueSnackbar('Agreement submitted successfully!', { variant: 'success' });
      reset();
      // setPreview('');
      // Update the agreement status to IN REVIEW after successful submission
      onUpdate();
    } catch (error) {
      console.error('Agreement upload failed:', error);
      enqueueSnackbar('Submission of agreement failed', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  });

  // V4 Agreement Signing Functions
  const handleAgreementSubmit = async (signedPdfFile) => {
    setUploading(true);

    const formData = new FormData();
    formData.append('agreementForm', signedPdfFile);
    formData.append(
      'data',
      JSON.stringify({
        campaignId: campaign.id,
        submissionId: agreementSubmission?.id || null,
      })
    );

    try {
      await fetch(endpoints.submission.creator.agreement, {
        method: 'POST',
        body: formData,
      });

      enqueueSnackbar('Agreement signed and submitted successfully!', { variant: 'success' });
      onUpdate();
    } catch (error) {
      console.error('Agreement submission failed:', error);
      enqueueSnackbar('Failed to submit signed agreement', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateAndSubmitPdf = async () => {
    if (!signURL || annotations.length === 0) {
      enqueueSnackbar('Please add your signature to the document before saving.', {
        variant: 'warning',
      });
      return;
    }

    setLoading(true);
    editor.onFalse();

    try {
      const existingPdfBytes = await fetch(agreementUrl).then((res) => res.arrayBuffer());
      const signatureImageBytes = await fetch(signURL).then((res) => res.arrayBuffer());

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

      annotations.forEach((annotation) => {
        const page = pdfDoc.getPage(annotation.page - 1);
        const { width, height } = page.getSize();

        page.drawImage(signatureImage, {
          x: annotation.x,
          y: height - annotation.y - annotation.height,
          width: annotation.width,
          height: annotation.height,
        });
      });

      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const signedPdfFile = new File([pdfBlob], 'signed-agreement.pdf', {
        type: 'application/pdf',
      });

      await handleAgreementSubmit(signedPdfFile);
    } catch (err) {
      console.error('Failed to generate signed PDF', err);
      enqueueSnackbar('An error occurred while generating the signed document.', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handler to open the upload modal with a clean state
  const handleOpenUploadModal = () => {
    reset(); // Clears the react-hook-form state
    setOpenUploadModal(true);
  };

  const handleOpenEditor = () => {
    setAnnotations([]);
    setSignURL(null);
    editor.onTrue();
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Left Side - PDF Preview */}
        {agreementUrl && (
          <Box
            sx={{
              width: { xs: '100%', md: '70%' },
              height: { xs: '400px', sm: '500px' },
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'auto',
              bgcolor: 'background.neutral',
              '& .react-pdf__Document': {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              },
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0,0,0,0.1)',
              },
            }}
          >
            <Document
              file={agreementUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    '&:not(:last-child)': {
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    },
                  }}
                >
                  <Page
                    key={`page-${index + 1}`}
                    pageNumber={index + 1}
                    scale={isSmallScreen ? 0.4 : 0.6}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                </Box>
              ))}
            </Document>
          </Box>
        )}

        {/* Instructions */}
        <Stack display="flex" flexDirection="column">
          <Box>
            <Typography variant="body1" mb={1} sx={{ color: '#221f20' }}>
              Before starting the campaign, you must sign the standard agreement submission
              procedure!
            </Typography>
            <Typography variant="body1" mb={2} sx={{ color: '#221f20' }}>
              Review the agreement PDF below and choose your preferred method to sign and submit it.
            </Typography>
          </Box>

          {/* Action Buttons - Bottom Right */}
          <Box
            display="flex"
            flexDirection={{ xs: 'row', md: 'column' }}
            flex={1}
            justifyContent="space-between"
            sx={{ gap: 2 }}
          >
            {/* Download Agreement Button */}
            {agreementUrl && (
              <Button
                variant="contained"
                onClick={() => handleDownload(agreementUrl)}
                sx={{
                  bgcolor: '#fff',
                  border: 1,
                  borderColor: '#e7e7e7',
                  borderBottom: 3,
                  borderBottomColor: '#e7e7e7',
                  color: '#203ff5',
                  alignSelf: 'flex-start',
                  '&:hover': {
                    bgcolor: '#fff',
                    borderColor: '#e7e7e7',
                  },
                  '& .MuiButton-startIcon': {
                    color: '#203ff5',
                  },
                }}
              >
                <Iconify icon="material-symbols:download" width={{ xs: 30, md: 20 }} />
                <Box
                  component="span"
                  ml={1}
                  sx={{
                    display: { xs: 'none', md: 'inline' },
                  }}
                >
                  Download Agreement
                </Box>
              </Button>
            )}

            <Box
              component="span"
              sx={{
                display: 'flex',
                alignSelf: 'flex-end',
                gap: 1,
              }}
            >
              {agreementUrl && (
                <Button
                  variant="contained"
                  onClick={handleOpenUploadModal}
                  disabled={isAgreementSubmitted || !agreementUrl}
                  sx={{
                    bgcolor: isAgreementSubmitted ? '#b0b0b1' : '#203ff5',
                    color: '#fff',
                    alignSelf: 'flex-end',
                    borderBottom: 3.5,
                    borderBottomColor: isAgreementSubmitted ? '#9e9e9f' : '#112286',
                    borderRadius: 1.5,
                    px: 2.5,
                    py: 1.2,
                    '&:hover': {
                      bgcolor: isAgreementSubmitted ? '#b0b0b1' : '#203ff5',
                      opacity: 0.9,
                    },
                    '&.Mui-disabled': {
                      color: '#fff',
                      opacity: 0.6,
                    },
                  }}
                >
                  <Iconify icon="material-symbols:upload" width={24} />
                  <Box
                    component="span"
                    ml={1}
                    sx={{
                      display: { xs: 'none', md: 'inline' },
                    }}
                  >
                    Upload Agreement
                  </Box>
                </Button>
              )}

              {/* Digital Signing Option */}
              <Button
                variant="contained"
                onClick={handleOpenEditor}
                disabled={isAgreementSubmitted || !agreementUrl}
                startIcon={<Iconify icon="solar:document-text-bold-duotone" width={24} />}
                sx={{
                  bgcolor: isAgreementSubmitted ? '#b0b0b1' : '#203ff5',
                  color: '#fff',
                  alignSelf: 'flex-end',
                  borderBottom: 3.5,
                  borderBottomColor: isAgreementSubmitted ? '#9e9e9f' : '#112286',
                  borderRadius: 1.5,
                  px: 2.5,
                  py: 1.2,
                  '&:hover': {
                    bgcolor: isAgreementSubmitted ? '#b0b0b1' : '#203ff5',
                    opacity: 0.9,
                  },
                  '&.Mui-disabled': {
                    color: '#fff',
                    opacity: 0.6,
                  },
                }}
              >
                {isAgreementSubmitted ? 'Submitted' : 'Sign Agreement'}
              </Button>
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Sign Agreement Dialog */}
      <Dialog
        open={editor.value}
        onClose={editor.onFalse}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            height: { xs: '85vh', md: '90vh' },
            maxHeight: { xs: '85vh', md: '90vh' },
            margin: { xs: '7.5vh auto', md: 'auto' },
            borderRadius: { xs: 2, md: 1 },
            width: { xs: '90vw', md: 'auto' },
            maxWidth: { xs: '90vw', md: 'md' },
          },
        }}
      >
        <DialogTitle
          sx={{
            p: { xs: 2, md: 2 },
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'background.paper',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontSize: { xs: '1.2rem', md: '1.25rem' },
            }}
          >
            Sign Your Agreement
          </Typography>
          <IconButton
            onClick={editor.onFalse}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Iconify icon="eva:close-fill" width={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden' }}>
          <PDFEditorV2
            file={agreementUrl}
            annotations={annotations}
            setAnnotations={setAnnotations}
            signURL={signURL}
            setSignURL={setSignURL}
          />
        </DialogContent>
        <DialogActions
          sx={{
            p: { xs: 2, md: 2 },
            borderTop: 1,
            borderColor: 'divider',
            gap: { xs: 1.5, md: 2 },
            flexDirection: 'row',
            bgcolor: 'background.paper',
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
          }}
        >
          <Button
            onClick={editor.onFalse}
            variant="outlined"
            sx={{
              borderColor: '#203ff5',
              color: '#203ff5',
              borderWidth: 1,
              borderBottom: 2,
              borderBottomColor: '#203ff5',
              borderRadius: 1.5,
              px: { xs: 1.5, md: 2.5 },
              py: { xs: 1, md: 1.2 },
              fontSize: { xs: '0.875rem', md: '0.9rem' },
              flex: 1,
              '&:hover': {
                bgcolor: 'rgba(32, 63, 245, 0.04)',
                borderColor: '#203ff5',
              },
            }}
          >
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            onClick={handleGenerateAndSubmitPdf}
            loading={loading}
            sx={{
              bgcolor: '#203ff5',
              color: 'white',
              borderBottom: 3.5,
              borderBottomColor: '#112286',
              borderRadius: 1.5,
              px: { xs: 1.5, md: 2.5 },
              py: { xs: 1, md: 1.2 },
              fontSize: { xs: '0.875rem', md: '0.9rem' },
              flex: 1,
              '&:hover': {
                bgcolor: '#203ff5',
                opacity: 0.9,
              },
            }}
          >
            Save & Submit
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!preview} onClose={() => setPreview('')} fullWidth maxWidth="md">
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={2}>
            <Typography variant="h5">Preview Document</Typography>
            <IconButton onClick={() => setPreview('')} sx={{ ml: 'auto' }}>
              <Iconify icon="hugeicons:cancel-01" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: 600, overflow: 'auto' }}>
            <Document file={preview} onLoadSuccess={onDocumentLoadSuccess}>
              {Array.from(new Array(numPages), (el, index) => (
                <Page
                  key={index}
                  pageNumber={index + 1}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  width={isSmallScreen ? window.innerWidth - 64 : 800}
                />
              ))}
            </Document>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openUploadModal}
        onClose={() => setOpenUploadModal(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          Upload Signed Agreement
        </DialogTitle>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                If you have downloaded and signed the agreement manually, please upload the
                completed PDF file here.
              </Typography>
              {!agreementForm ? (
                <RHFUpload
                  key={openUploadModal ? 'loaded' : 'empty'}
                  name="agreementForm"
                  type="pdf"
                />
              ) : (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 1.5,
                    bgcolor: 'background.neutral',
                    border: '1px dashed',
                    borderColor: 'divider',
                  }}
                >
                  <Iconify
                    icon="solar:file-text-bold-duotone"
                    width={40}
                    sx={{ color: '#1340FF', mr: 2 }}
                  />

                  <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {agreementForm.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {(agreementForm.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Stack>

                  <Button
                    size="small"
                    color="error"
                    onClick={handleRemove}
                    startIcon={<Iconify icon="eva:close-fill" />}
                    sx={{ ml: 2, minWidth: 'auto', whiteSpace: 'nowrap' }}
                  >
                    Remove
                  </Button>
                </Paper>
              )}
            </Stack>
          </DialogContent>
          <DialogActions
            sx={{
              p: { xs: 2, md: 2 },
              borderTop: 1,
              borderColor: 'divider',
              gap: { xs: 1.5, md: 2 },
            }}
          >
            <Button
              onClick={() => setOpenUploadModal(false)}
              variant="outlined"
              sx={{
                borderColor: '#203ff5',
                color: '#203ff5',
                borderWidth: 1,
                borderBottomWidth: 2,
                borderRadius: 1.5,
                px: { xs: 1.5, md: 2.5 },
                py: { xs: 1, md: 1.2 },
                fontSize: { xs: '0.875rem', md: '0.9rem' },
                flex: 1,
                '&:hover': {
                  bgcolor: 'rgba(32, 63, 245, 0.04)',
                  borderColor: '#203ff5',
                },
              }}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={uploading}
              disabled={!agreementForm}
              sx={{
                bgcolor: '#203ff5',
                color: 'white',
                borderBottom: 3.5,
                borderBottomColor: '#112286',
                borderRadius: 1.5,
                px: { xs: 1.5, md: 2.5 },
                py: { xs: 1, md: 1.2 },
                fontSize: { xs: '0.875rem', md: '0.9rem' },
                flex: 1,
                '&:hover': {
                  bgcolor: '#203ff5',
                  opacity: 0.9,
                },
                '&.Mui-disabled': {
                  bgcolor: '#b0b0b1',
                  color: '#fff',
                  borderBottomColor: '#9e9e9f',
                },
              }}
            >
              Submit Agreement
            </LoadingButton>
          </DialogActions>
        </FormProvider>
      </Dialog>
    </>
  );
};

const LogisticsForm = ({ user, campaignId, onUpdate }) => {
  const LogisticsSchema = Yup.object().shape({
    country: Yup.string().required('Country is required'),
    state: Yup.string().required('State/Region is required'),
    address: Yup.string().required('Address is required'),
    location: Yup.string(),
    postcode: Yup.string().required('Postcode is required'),
    city: Yup.string().required('City is required'),
    dietaryRestrictions: Yup.string(),
  });

  const defaultValues = useMemo(() => {
    const creator = user?.creator || {};
    return {
      country: creator.country || '',
      state: creator.state || '',
      address: creator.address || '',
      location: creator.location || '',
      postcode: creator.postcode || '',
      city: creator.city || '',
      dietaryRestrictions: creator.defaultDietaryRestrictions || '',
    };
  }, [user]);

  const methods = useForm({
    resolver: yupResolver(LogisticsSchema),
    defaultValues,
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const selectedCountry = watch('country');

  const availableStates = useMemo(() => {
    const countryData = regions.find((region) => region.countryName === selectedCountry);
    return countryData ? countryData.regions : [];
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry && selectedCountry !== user?.creator?.country) {
      setValue('state', '');
    }
  }, [selectedCountry, setValue, user?.creator?.country, user?.creator?.state]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await fetch(
        `/api/logistics/creator/campaign/${campaignId}/onboarding-details`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save logistics information');
      }

      enqueueSnackbar('Logistics information saved!', { variant: 'success' });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to save information', { variant: 'error' });
    }
  });

  const countryOptions = useMemo(() => {
    const allCountries = regions.map((region) => region.countryName);

    const priorityCountries = ['Malaysia', 'Singapore'];

    const otherCountries = allCountries
      .filter((country) => !priorityCountries.includes(country))
      .sort();

    return [...priorityCountries, ...otherCountries];
  }, []);

  return (
    <>
      {/* Form Content */}
      <Box sx={{ p: 3 }}>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
            {/* Left Column: Address Details */}
            <Stack spacing={2.5} sx={{ width: 1 }}>
              <Stack direction="row" spacing={2}>
                <Stack spacing={1} sx={{ width: 1 }}>
                  <Typography variant="caption" sx={{ color: '#636366' }}>
                    Country of Residence <span style={{ color: '#FF4842' }}>*</span>
                  </Typography>
                  <RHFSelect
                    name="country"
                    placeholder="Select Country"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#fff',
                        borderRadius: 1,
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select Country
                    </MenuItem>
                    {countryOptions.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </RHFSelect>
                </Stack>

                <Stack spacing={1} sx={{ width: 1 }}>
                  <Typography variant="caption" sx={{ color: '#636366' }}>
                    State/Territory <span style={{ color: '#FF4842' }}>*</span>
                  </Typography>
                  <RHFSelect
                    name="state"
                    placeholder="Select State"
                    disabled={!selectedCountry || availableStates.length === 0}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#fff',
                        borderRadius: 1,
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select State
                    </MenuItem>
                    {availableStates.map((region) => (
                      <MenuItem key={region.shortCode || region.name} value={region.name}>
                        {region.name}
                      </MenuItem>
                    ))}
                  </RHFSelect>
                </Stack>
              </Stack>

              <Stack spacing={1}>
                <Typography variant="caption" sx={{ color: '#636366' }}>
                  Address <span style={{ color: '#FF4842' }}>*</span>
                </Typography>
                <RHFTextField
                  name="address"
                  placeholder="Address"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#fff',
                      borderRadius: 1,
                    },
                  }}
                />
              </Stack>

              <Stack spacing={1}>
                <Typography variant="caption" sx={{ color: '#636366' }}>
                  Apartment, suite, etc.
                </Typography>
                <RHFTextField
                  name="location"
                  placeholder="Apartment, suite, etc."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#fff',
                      borderRadius: 1,
                    },
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={2}>
                <Stack spacing={1} sx={{ width: 1 }}>
                  <Typography variant="caption" sx={{ color: '#636366' }}>
                    Postcode <span style={{ color: '#FF4842' }}>*</span>
                  </Typography>
                  <RHFTextField
                    name="postcode"
                    placeholder="Enter Postcode"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#fff',
                        borderRadius: 1,
                      },
                    }}
                  />
                </Stack>

                <Stack spacing={1} sx={{ width: 1 }}>
                  <Typography variant="caption" sx={{ color: '#636366' }}>
                    City <span style={{ color: '#FF4842' }}>*</span>
                  </Typography>
                  <RHFTextField
                    name="city"
                    placeholder="Enter City"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#fff',
                        borderRadius: 1,
                      },
                    }}
                  />
                </Stack>
              </Stack>
            </Stack>

            {/* Right Column: Dietary */}
            <Stack spacing={2.5} sx={{ width: 1 }}>
              <Stack spacing={1} sx={{ height: '100%' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#636366', display: 'block' }}>
                    Dietary Restrictions/Allergies
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#919EAB', display: 'block', lineHeight: 1.2, mt: 0.5 }}
                  >
                    Please provide any dietary restrictions, or allergies to help us ensure your
                    safety and suitability for this campaign
                  </Typography>
                </Box>

                <RHFTextField
                  name="dietaryRestrictions"
                  placeholder="Dietary Restrictions/Allergies"
                  multiline
                  rows={8}
                  sx={{
                    bgcolor: '#fff',
                    borderRadius: 1,
                    height: '40%',
                    '& .MuiOutlinedInput-root': {
                      height: '100%',
                      alignItems: 'flex-start',
                    },
                  }}
                />
              </Stack>
            </Stack>
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting}
              sx={{
                bgcolor: '#333333',
                color: '#fff',
                px: 4,
                '&:hover': { bgcolor: '#000000' },
              }}
            >
              Submit
            </LoadingButton>
          </Box>
        </FormProvider>
      </Box>
    </>
  );
};

const CampaignV4Activity = ({ campaign, mutateLogistic, logistic }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [numPages, setNumPages] = useState(null);
  const [uploadingSubmissions, setUploadingSubmissions] = useState({}); // Track which submissions are uploading
  const updateTimerRef = React.useRef(null); // Store timer for debouncing updates
  const isFirstUpdateRef = React.useRef(true); // Track if this is the first update

  const isSmallScreen = useMediaQuery('(max-width: 600px)');

  // Socket integration for real-time updates
  const { socket } = useSocketContext();
  const { user } = useAuthContext();

  // Fetch logistics data
  const isLogisticsCompleted = !!logistic;
  const isDelivery = campaign?.logisticsType === 'PRODUCT_DELIVERY';

  // Get agreement URL from campaign and convert to backend proxy URL to bypass CORS
  const originalAgreementUrl = campaign?.agreement?.agreementUrl;
  const agreementUrl = originalAgreementUrl
    ? originalAgreementUrl.replace(
        'https://storage.googleapis.com/cult-prod/',
        `${window.location.origin}/api/agreement/agreement-template/`
      )
    : null;

  // Fetch creator's v4 submissions using SWR
  // Following SWR's standard API: useSWR(key, fetcher, options)
  const {
    data: submissionsData,
    error,
    mutate, // mutate() will revalidate this data
  } = useSWR(
    campaign?.id
      ? `${endpoints.submission.creator.v4.getMyV4Submissions}?campaignId=${campaign?.id}`
      : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: socket ? 0 : 30000, // Disable auto-refresh when socket is connected
    }
  );

  // Fetch campaign overview using SWR
  const { data: overviewData, mutate: mutateOverview } = useSWR(
    campaign?.id
      ? `${endpoints.submission.creator.v4.getMyCampaignOverview}?campaignId=${campaign?.id}`
      : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: socket ? 0 : 30000, // Disable auto-refresh when socket is connected
    }
  );

  // Get signed agreement URL if available (for approved agreement display)
  const signedAgreementUrl = useMemo(() => {
    const signedContent = submissionsData?.grouped?.agreement?.content;
    if (signedContent) {
      return signedContent.replace(
        'https://storage.googleapis.com/cult-prod/',
        `${window.location.origin}/api/agreement/agreement-template/`
      );
    }
    return null;
  }, [submissionsData?.grouped?.agreement?.content]);

  // Handle section expand/collapse
  const handleToggleSection = (submissionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [submissionId]: !prev[submissionId],
    }));
  };

  // PDF-related functions for approved agreement display
  const onDocumentLoadSuccess = ({ numPages: pages }) => {
    setNumPages(pages);
  };

  const onDocumentLoadError = (err) => {
    console.error('Error loading PDF:', err);
  };

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const filename = `${campaign?.id}-${campaign?.name}-agreement.pdf`;

      // Create download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Download failed:', err);
      enqueueSnackbar('Failed to download agreement', { variant: 'error' });
    }
  };

  // Auto-expand first incomplete submission
  useEffect(() => {
    if (submissionsData?.grouped && Object.keys(expandedSections).length === 0) {
      const allSubmissions = [
        ...submissionsData.grouped.videos,
        ...submissionsData.grouped.photos,
        ...submissionsData.grouped.rawFootage,
      ];

      const firstIncomplete = allSubmissions.find(
        (s) => !['APPROVED', 'CLIENT_APPROVED', 'POSTED'].includes(s.status)
      );

      if (firstIncomplete) {
        setExpandedSections({ [firstIncomplete.id]: true });
      }
    }
  }, [submissionsData, expandedSections]);

  // Socket listeners for real-time submission updates
  useEffect(() => {
    if (!socket || !campaign?.id) return;

    const queueUpdate = () => {
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current);

      const delay = isFirstUpdateRef.current ? 0 : 200;

      updateTimerRef.current = setTimeout(() => {
        mutate();
        mutateOverview();
        isFirstUpdateRef.current = false;
      }, delay);
    };

    const handleSubmissionUpdate = (data) => {
      // Check if the update is for submissions in this campaign
      const allSubmissions = [
        ...(submissionsData?.grouped?.videos || []),
        ...(submissionsData?.grouped?.photos || []),
        ...(submissionsData?.grouped?.rawFootage || []),
      ];

      const isRelevantUpdate = allSubmissions.some(
        (submission) => submission.id === data.submissionId
      );

      if (isRelevantUpdate && data.userId !== user?.id) {
        queueUpdate();
      }
    };

    const handleContentSubmitted = (data) => {
      const allSubmissions = [
        ...(submissionsData?.grouped?.videos || []),
        ...(submissionsData?.grouped?.photos || []),
        ...(submissionsData?.grouped?.rawFootage || []),
      ];

      const isRelevantUpdate = allSubmissions.some(
        (submission) => submission.id === data.submissionId
      );

      if (isRelevantUpdate && data.userId !== user?.id) {
        queueUpdate();
      }
    };

    const handlePostingUpdated = (data) => {
      const allSubmissions = [
        ...(submissionsData?.grouped?.videos || []),
        ...(submissionsData?.grouped?.photos || []),
        ...(submissionsData?.grouped?.rawFootage || []),
      ];

      const isRelevantUpdate = allSubmissions.some(
        (submission) => submission.id === data.submissionId
      );

      if (isRelevantUpdate && data.userId !== user?.id) {
        queueUpdate();
      }
    };

    const handleContentProcessed = (data) => {
      const allSubmissions = [
        ...(submissionsData?.grouped?.videos || []),
        ...(submissionsData?.grouped?.photos || []),
        ...(submissionsData?.grouped?.rawFootage || []),
      ];

      const isRelevantUpdate = allSubmissions.some(
        (submission) => submission.id === data.submissionId
      );

      if (isRelevantUpdate) {
        queueUpdate();
      }
    };

    // Join the campaign room
    socket.emit('join-campaign', campaign.id);

    // Listen for submission updates
    socket.on('v4:submission:updated', handleSubmissionUpdate);
    socket.on('v4:content:submitted', handleContentSubmitted);
    socket.on('v4:posting:updated', handlePostingUpdated);
    socket.on('v4:content:processed', handleContentProcessed);

    // Cleanup
    // eslint-disable-next-line consistent-return
    return () => {
      // Clear any pending updates
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current);

      socket.off('v4:submission:updated', handleSubmissionUpdate);
      socket.off('v4:content:submitted', handleContentSubmitted);
      socket.off('v4:posting:updated', handlePostingUpdated);
      socket.off('v4:content:processed', handleContentProcessed);
      socket.emit('leave-campaign', campaign.id);
    };
  }, [socket, campaign?.id, submissionsData, user?.id, mutate, mutateOverview]);

  // Helper function to determine if submission is "new" (not submitted yet)
  const isNewSubmission = (submission) => {
    const hasContent =
      submission.video?.length > 0 ||
      submission.photos?.length > 0 ||
      submission.rawFootages?.length > 0;
    return !hasContent && submission.status === 'IN_PROGRESS';
  };

  // Helper function to get submission status
  const getSubmissionStatus = (submission) => {
    // Check if this submission is currently uploading
    const isUploading = uploadingSubmissions[submission.id];

    // Show "UPLOADING..." immediately when upload starts
    if (isUploading) {
      return 'UPLOADING...';
    }

    // IMPORTANT: Check status FIRST before checking content
    // This prevents showing "NOT STARTED" when status is PENDING_REVIEW during upload
    // (before backend has processed and added video/photo data)

    switch (submission.status) {
      case 'IN_PROGRESS':
      case 'PENDING_REVIEW':
      case 'SENT_TO_CLIENT':
      case 'CLIENT_FEEDBACK':
        return 'IN REVIEW';
      case 'CHANGES_REQUIRED':
      case 'REJECTED':
      case 'REVISION_REQUESTED':
        return 'CHANGES REQUIRED';
      case 'APPROVED':
      case 'CLIENT_APPROVED':
        // Check if campaign requires posting links and if this submission type needs one
        const campaignRequiresPosting = campaign?.campaignType === 'normal'; // 'normal' = UGC (With Posting)
        const hasVideoOrPhotos = submission.video?.length > 0 || submission.photos?.length > 0;
        const needsPostingLink = campaignRequiresPosting && hasVideoOrPhotos;

        if (needsPostingLink) {
          if (!submission.content) {
            return 'PENDING POSTING LINK';
          }
          // If posting link exists but not yet approved by admin, show IN REVIEW
          if (submission.content && submission.postingLinkStatus !== 'APPROVED') {
            return 'IN REVIEW';
          }
        }
        return 'APPROVED';
      case 'POSTED':
        return 'POSTED';
      case 'NOT_STARTED':
      default:
        // Only check content for NOT_STARTED status
        const hasContent =
          submission.video?.length > 0 ||
          submission.photos?.length > 0 ||
          submission.rawFootages?.length > 0;

        // If there's content but status is NOT_STARTED, it means upload is in progress
        // Show "IN REVIEW" to indicate processing
        if (hasContent) {
          return 'IN REVIEW';
        }

        return 'NOT STARTED';
    }
  };

  // Helper function to get status styling info (matching admin design)
  const getSubmissionStatusInfo = (status) => {
    const statusMap = {
      'NOT STARTED': {
        color: '#8E8E93',
        borderColor: '#8E8E93',
      },
      'UPLOADING...': {
        color: '#1340FF',
        borderColor: '#1340FF',
      },
      'IN REVIEW': {
        color: '#8B5CF6',
        borderColor: '#8B5CF6',
      },
      'CHANGES REQUIRED': {
        color: '#FF4842',
        borderColor: '#FF4842',
      },
      'PENDING POSTING LINK': {
        color: '#FFC702',
        borderColor: '#FFC702',
      },
      APPROVED: {
        color: '#00AB55',
        borderColor: '#00AB55',
      },
      POSTED: {
        color: '#00AB55',
        borderColor: '#00AB55',
      },
    };

    return statusMap[status] || statusMap['NOT STARTED'];
  };

  // Helper function to get submission title
  const getSubmissionTitle = (submission, index) => {
    switch (submission.submissionType?.type) {
      case 'VIDEO':
        return `Video ${submission.contentOrder || index + 1}`;
      case 'PHOTO':
        return 'Photos';
      case 'RAW_FOOTAGE':
        return 'Raw Footages';
      default:
        return 'Submission';
    }
  };

  // Check if creator's agreement has been approved
  const isAgreementApproved = overviewData?.isAgreementApproved;

  useEffect(() => {
    if (isAgreementApproved && !isLogisticsCompleted) {
      setExpandedSections((prev) => ({ ...prev, logistics: true }));
    }
  }, [isAgreementApproved, isLogisticsCompleted]);

  if (error) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="error">Failed to load submissions</Typography>
        <Button onClick={() => mutate()} startIcon={<Iconify icon="eva:refresh-fill" />}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!submissionsData) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  const { grouped, progress, total, completed } = submissionsData;

  console.log(submissionsData);

  // If agreement hasn't been approved, show agreement submission
  if (!isAgreementApproved && overviewData?.agreementStatus) {
    return (
      <Box>
        {/* Agreement Submission Card */}
        <Card
          sx={{
            overflow: 'visible',
            bgcolor: '#F5F5F5',
            boxShadow: '0px 4px 4px rgba(142, 142, 147, 0.25)',
            borderRadius: 2,
            border: 'none',
            mb: 2,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ p: 2, cursor: 'pointer' }}
            onClick={() => setExpandedSections((prev) => ({ ...prev, agreement: !prev.agreement }))}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily:
                    'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 500,
                  color: 'black',
                }}
              >
                Agreement
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  px: 1.5,
                  py: 0.5,
                  fontWeight: 600,
                  border: '1px solid',
                  borderBottom: '3px solid',
                  borderRadius: 0.8,
                  bgcolor: 'white',
                  whiteSpace: 'nowrap',
                  color: overviewData.agreementStatus === 'PENDING_REVIEW' ? '#8B5CF6' : '#FFC702',
                  borderColor:
                    overviewData.agreementStatus === 'PENDING_REVIEW' ? '#8B5CF6' : '#FFC702',
                  fontSize: '0.75rem',
                }}
              >
                {overviewData.agreementStatus === 'IN_PROGRESS'
                  ? 'PENDING AGREEMENT'
                  : overviewData.agreementStatus === 'PENDING_REVIEW'
                    ? 'IN REVIEW'
                    : overviewData.agreementStatus?.replace('_', ' ').toUpperCase() ||
                      'NOT STARTED'}
              </Typography>
            </Stack>
            <Iconify
              icon={expandedSections.agreement ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'}
              width={20}
            />
          </Stack>

          <Collapse in={expandedSections.agreement}>
            <Box sx={{ p: 2, pt: 0 }}>
              <AgreementSubmission
                campaign={campaign}
                agreementSubmission={submissionsData?.grouped?.agreement}
                onUpdate={async () => {
                  await Promise.all([mutate(), mutateOverview()]);
                  setExpandedSections((prev) => ({ ...prev, agreement: false }));
                }}
              />
            </Box>
          </Collapse>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      {/* Campaign Brief Message */}
      <Typography
        variant="body2"
        gutterBottom
        sx={{
          mb: 3,
          color: 'black',
          fontFamily:
            'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontWeight: 400,
          lineHeight: 1.5,
        }}
      >
        Do ensure to read through the brief, and the do&apos;s and don&apos;t&apos;s for the
        creatives over at the <br />
        <Typography
          component="span"
          sx={{
            color: '#1340FF',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontFamily: 'inherit',
            '&:hover': {
              opacity: 0.8,
            },
          }}
          onClick={() => {
            // Add navigation logic here if needed
          }}
        >
          Campaign Details
        </Typography>{' '}
        page.
      </Typography>
      {/* Approved Agreement Display */}
      {isAgreementApproved && (
        <Card
          sx={{
            overflow: 'visible',
            bgcolor: '#F5F5F5',
            boxShadow: '0px 4px 4px rgba(142, 142, 147, 0.25)',
            borderRadius: 2,
            border: 'none',
            mb: isDelivery ? 2 : 1,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ p: 2, cursor: 'pointer' }}
            onClick={() =>
              setExpandedSections((prev) => ({
                ...prev,
                approvedAgreement: !prev.approvedAgreement,
              }))
            }
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily:
                    'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 500,
                  color: 'black',
                }}
              >
                Agreement
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  px: 1.5,
                  py: 0.5,
                  fontWeight: 600,
                  border: '1px solid',
                  borderBottom: '3px solid',
                  borderRadius: 0.8,
                  bgcolor: 'white',
                  whiteSpace: 'nowrap',
                  color: '#00AB55',
                  borderColor: '#00AB55',
                  fontSize: '0.75rem',
                }}
              >
                APPROVED
              </Typography>
            </Stack>
            <Iconify
              icon={
                expandedSections.approvedAgreement ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'
              }
              width={20}
            />
          </Stack>

          <Collapse in={expandedSections.approvedAgreement}>
            <Box sx={{ p: 2, pt: 0 }}>
              <Stack spacing={2}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#221f20',
                    fontFamily:
                      'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 500,
                  }}
                >
                  ✅ Your agreement has been approved!{' '}
                  {signedAgreementUrl ? 'Below is your signed agreement.' : ''} You can now proceed
                  with the campaign submissions.
                </Typography>

                {/* Agreement PDF Preview */}
                {(signedAgreementUrl || agreementUrl) && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      gap: 2,
                      mt: 1,
                    }}
                  >
                    {/* PDF Preview */}
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          width: '100%',
                          height: { xs: '250px', sm: '300px' },
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          overflow: 'auto',
                          bgcolor: 'background.neutral',
                          '& .react-pdf__Document': {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          },
                          '&::-webkit-scrollbar': {
                            width: '8px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            borderRadius: '4px',
                          },
                          '&::-webkit-scrollbar-track': {
                            backgroundColor: 'rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <Document
                          file={signedAgreementUrl || agreementUrl}
                          onLoadSuccess={onDocumentLoadSuccess}
                          onLoadError={onDocumentLoadError}
                        >
                          {Array.from(new Array(numPages), (el, index) => (
                            <Box
                              key={index}
                              sx={{
                                p: 1,
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                '&:not(:last-child)': {
                                  borderBottom: '1px solid',
                                  borderColor: 'divider',
                                },
                              }}
                            >
                              <Page
                                key={`page-${index + 1}`}
                                pageNumber={index + 1}
                                scale={isSmallScreen ? 0.3 : 0.4}
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                              />
                            </Box>
                          ))}
                        </Document>
                      </Box>
                    </Box>

                    {/* Download Button */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: { xs: 'center', md: 'flex-start' },
                      }}
                    >
                      <Button
                        variant="contained"
                        startIcon={<Iconify icon="material-symbols:download" width={20} />}
                        onClick={() => handleDownload(signedAgreementUrl || agreementUrl)}
                        sx={{
                          bgcolor: '#203ff5',
                          color: 'white',
                          borderBottom: 3,
                          borderBottomColor: '#112286',
                          borderRadius: 1.5,
                          px: 2.5,
                          py: 1.2,
                          '&:hover': {
                            bgcolor: '#203ff5',
                            opacity: 0.9,
                          },
                        }}
                      >
                        {signedAgreementUrl ? 'Download Signed Agreement' : 'Download Agreement'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Box>
          </Collapse>
        </Card>
      )}

      {/* HIDE: Logistics Information Card from creator */}
      {isAgreementApproved && isDelivery && (
        <Card
          sx={{
            overflow: 'visible',
            bgcolor: '#F5F5F5',
            boxShadow: '0px 4px 4px rgba(142, 142, 147, 0.25)',
            borderRadius: 2,
            border: 'none',
            mb: 1,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ p: 2, cursor: 'pointer' }}
            onClick={() => setExpandedSections((prev) => ({ ...prev, logistics: !prev.logistics }))}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily:
                    'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 500,
                  color: 'black',
                }}
              >
                Logistics Information
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  fontWeight: 600,
                  border: '1px solid',
                  borderBottom: '3px solid',
                  borderRadius: 0.8,
                  bgcolor: 'white',
                  whiteSpace: 'nowrap',
                  color: isLogisticsCompleted ? '#00AB55' : '#8E8E93',
                  borderColor: isLogisticsCompleted ? '#00AB55' : '#8E8E93',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'inherit' }}
                >
                  {isLogisticsCompleted ? 'COMPLETED' : 'NOT STARTED'}
                </Typography>
              </Box>
            </Stack>
            <Iconify
              icon={expandedSections.logistics ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'}
              width={20}
            />
          </Stack>

          <Collapse in={expandedSections.logistics}>
            <Divider />
            {isLogisticsCompleted ? (
              <Box sx={{ p: 3 }}>
                <Stack spacing={4}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 3, md: 10 }}>
                    <Box sx={{ minWidth: 200 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: '#636366', display: 'block', mb: 1 }}
                      >
                        Country of Residence <span style={{ color: '#FF4842' }}>*</span>
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#636366', fontSize: '14px' }}>
                        {user?.creator?.country}
                      </Typography>
                    </Box>

                    <Box sx={{ minWidth: 200 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: '#636366', display: 'block', mb: 1 }}
                      >
                        State/Territory <span style={{ color: '#FF4842' }}>*</span>
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#636366', fontSize: '14px' }}>
                        {user?.creator?.state}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: '#636366', display: 'block', mb: 1 }}
                      >
                        Dietary Restrictions/Allergies
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#636366', fontSize: '14px' }}>
                        {logistic?.deliveryDetails?.dietaryRestrictions || '-'}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Middle Row: Address */}
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: '#636366', display: 'block', mb: 1 }}
                    >
                      Address <span style={{ color: '#FF4842' }}>*</span>
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#636366', fontSize: '14px' }}>
                      {logistic?.deliveryDetails?.address}
                    </Typography>
                  </Box>

                  {/* Bottom Row: Apartment */}
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: '#636366', display: 'block', mb: 1 }}
                    >
                      Apartment, suite, etc.
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#636366', fontSize: '14px' }}>
                      {user?.creator?.location || '-'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ) : (
              <LogisticsForm
                user={user}
                campaignId={campaign.id}
                onUpdate={() => {
                  mutateLogistic();
                  mutate();
                  setExpandedSections((prev) => ({
                    ...prev,
                    logistics: false,
                  }));
                }}
              />
            )}
          </Collapse>
        </Card>
      )}
      {/* Collapsible Submission Cards */}
      {isAgreementApproved && (!isDelivery || isLogisticsCompleted) && (
        <Stack spacing={2} sx={{ p: 1, mx: -1 }}>
          {/* Video Submissions */}
          {grouped?.videos?.map((video, index) => {
            const isExpanded = expandedSections[video.id];
            const isNew = isNewSubmission(video);
            const title = getSubmissionTitle(video, index);
            const status = getSubmissionStatus(video);
            const statusInfo = getSubmissionStatusInfo(status);

            return (
              <Card
                key={video.id}
                sx={{
                  overflow: 'visible',
                  bgcolor: '#F5F5F5',
                  boxShadow: '0px 4px 4px rgba(142, 142, 147, 0.25)',
                  borderRadius: 2,
                  border: 'none',
                }}
              >
                {/* Header */}
                <Box
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    '&:hover': {
                      bgcolor: 'transparent',
                    },
                  }}
                  onClick={() => handleToggleSection(video.id)}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily:
                          'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontWeight: 500,
                        color: 'black',
                      }}
                    >
                      {title}
                    </Typography>

                    {/* Status Badge with Loading Indicator */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1.5,
                        py: 0.5,
                        fontWeight: 600,
                        border: '1px solid',
                        borderBottom: '3px solid',
                        borderRadius: 0.8,
                        bgcolor: 'white',
                        whiteSpace: 'nowrap',
                        color: statusInfo.color,
                        borderColor: statusInfo.color,
                        transition: 'all 0.3s ease-in-out', // Smooth color transitions
                      }}
                    >
                      {status === 'UPLOADING...' && (
                        <CircularProgress
                          size={12}
                          thickness={4}
                          sx={{ color: statusInfo.color }}
                        />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          color: 'inherit',
                        }}
                      >
                        {status}
                      </Typography>
                    </Box>

                    {isNew && (
                      <Chip
                        label="NEW"
                        size="small"
                        sx={{
                          bgcolor: 'error.main',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                        }}
                      />
                    )}
                  </Stack>
                  <IconButton size="small">
                    <Iconify
                      icon={isExpanded ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'}
                      width={20}
                    />
                  </IconButton>
                </Box>
                {/* Collapsible Content */}
                <Collapse in={isExpanded}>
                  <Divider />
                  <Box sx={{ p: 3 }}>
                    <V4VideoSubmission
                      submission={video}
                      campaign={campaign}
                      onUploadStateChange={(isUploading) => {
                        setUploadingSubmissions((prev) => ({
                          ...prev,
                          [video.id]: isUploading,
                        }));
                      }}
                      onUpdate={async () => {
                        // Optimistically update status to PENDING_REVIEW immediately (no revalidation)
                        await mutate(
                          (currentData) => {
                            if (!currentData?.grouped) return currentData;
                            return {
                              ...currentData,
                              grouped: {
                                ...currentData.grouped,
                                videos: currentData.grouped.videos.map((v) =>
                                  v.id === video.id
                                    ? {
                                        ...v,
                                        status: 'PENDING_REVIEW',
                                        // Keep video data to prevent UI flickering
                                        video: v.video,
                                        caption: v.caption,
                                      }
                                    : v
                                ),
                              },
                            };
                          },
                          { revalidate: false }
                        );

                        setExpandedSections((prev) => ({ ...prev, [video.id]: false }));
                      }}
                    />
                  </Box>
                </Collapse>
              </Card>
            );
          })}
          {/* Photo Submissions */}
          {grouped?.photos?.map((photo, index) => {
            const isExpanded = expandedSections[photo.id];
            const isNew = isNewSubmission(photo);
            const title = getSubmissionTitle(photo, index);
            const status = getSubmissionStatus(photo);
            const statusInfo = getSubmissionStatusInfo(status);

            return (
              <Card
                key={photo.id}
                sx={{
                  overflow: 'visible',
                  bgcolor: '#F5F5F5',
                  boxShadow: '0px 4px 4px rgba(142, 142, 147, 0.25)',
                  borderRadius: 2,
                  border: 'none',
                }}
              >
                {/* Header */}
                <Box
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    '&:hover': {
                      bgcolor: 'transparent',
                    },
                  }}
                  onClick={() => handleToggleSection(photo.id)}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily:
                          'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontWeight: 500,
                        color: 'black',
                      }}
                    >
                      {title}
                    </Typography>

                    {/* Status Badge with Loading Indicator */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1.5,
                        py: 0.5,
                        fontWeight: 600,
                        border: '1px solid',
                        borderBottom: '3px solid',
                        borderRadius: 0.8,
                        bgcolor: 'white',
                        whiteSpace: 'nowrap',
                        color: statusInfo.color,
                        borderColor: statusInfo.color,
                        transition: 'all 0.3s ease-in-out', // Smooth color transitions
                      }}
                    >
                      {status === 'UPLOADING...' && (
                        <CircularProgress
                          size={12}
                          thickness={4}
                          sx={{ color: statusInfo.color }}
                        />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          color: 'inherit',
                        }}
                      >
                        {status}
                      </Typography>
                    </Box>

                    {isNew && (
                      <Chip
                        label="NEW"
                        size="small"
                        sx={{
                          bgcolor: 'error.main',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                        }}
                      />
                    )}
                  </Stack>
                  <IconButton size="small">
                    <Iconify
                      icon={isExpanded ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'}
                      width={20}
                    />
                  </IconButton>
                </Box>

                {/* Collapsible Content */}
                <Collapse in={isExpanded}>
                  <Divider />
                  <Box sx={{ p: 3 }}>
                    <V4PhotoSubmission
                      submission={photo}
                      campaign={campaign}
                      onUpdate={async () => {
                        await mutate(
                          (currentData) => {
                            console.log(
                              '[Photo Submission] Before update - status:',
                              currentData?.grouped?.photos?.find((p) => p.id === photo.id)?.status
                            );

                            if (!currentData?.grouped) return currentData;

                            const updated = {
                              ...currentData,
                              grouped: {
                                ...currentData.grouped,
                                photos: currentData.grouped.photos.map((p) =>
                                  p.id === photo.id
                                    ? {
                                        ...p,
                                        status: 'PENDING_REVIEW',
                                        // Update individual photo statuses to PENDING
                                        photos: p.photos?.map((photoItem) => ({
                                          ...photoItem,
                                          status: 'PENDING',
                                        })),
                                      }
                                    : p
                                ),
                              },
                            };

                            console.log(
                              '[Photo Submission] After update - status:',
                              updated.grouped.photos.find((p) => p.id === photo.id)?.status
                            );
                            return updated;
                          },
                          { revalidate: false }
                        );
                        setExpandedSections((prev) => ({ ...prev, [photo.id]: false }));
                      }}
                    />
                  </Box>
                </Collapse>
              </Card>
            );
          })}
          {/* Raw Footage Submissions */}
          {grouped?.rawFootage?.map((rawFootage, index) => {
            const isExpanded = expandedSections[rawFootage.id];
            const isNew = isNewSubmission(rawFootage);
            const title = getSubmissionTitle(rawFootage, index);
            const status = getSubmissionStatus(rawFootage);
            const statusInfo = getSubmissionStatusInfo(status);

            return (
              <Card
                key={rawFootage.id}
                sx={{
                  overflow: 'visible',
                  bgcolor: '#F5F5F5',
                  boxShadow: '0px 4px 4px rgba(142, 142, 147, 0.25)',
                  borderRadius: 2,
                  border: 'none',
                }}
              >
                {/* Header */}
                <Box
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    '&:hover': {
                      bgcolor: 'transparent',
                    },
                  }}
                  onClick={() => handleToggleSection(rawFootage.id)}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily:
                          'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontWeight: 500,
                        color: 'black',
                      }}
                    >
                      {title}
                    </Typography>

                    {/* Status Badge with Loading Indicator */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1.5,
                        py: 0.5,
                        fontWeight: 600,
                        border: '1px solid',
                        borderBottom: '3px solid',
                        borderRadius: 0.8,
                        bgcolor: 'white',
                        whiteSpace: 'nowrap',
                        color: statusInfo.color,
                        borderColor: statusInfo.color,
                        transition: 'all 0.3s ease-in-out', // Smooth color transitions
                      }}
                    >
                      {status === 'UPLOADING...' && (
                        <CircularProgress
                          size={12}
                          thickness={4}
                          sx={{ color: statusInfo.color }}
                        />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          color: 'inherit',
                        }}
                      >
                        {status}
                      </Typography>
                    </Box>

                    {isNew && (
                      <Chip
                        label="NEW"
                        size="small"
                        sx={{
                          bgcolor: 'error.main',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                        }}
                      />
                    )}
                  </Stack>
                  <IconButton size="small">
                    <Iconify
                      icon={isExpanded ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'}
                      width={20}
                    />
                  </IconButton>
                </Box>

                {/* Collapsible Content */}
                <Collapse in={isExpanded}>
                  <Divider />
                  <Box sx={{ p: 3 }}>
                    <V4RawFootageSubmission
                      submission={rawFootage}
                      onUpdate={async () => {
                        await mutate(
                          (currentData) => {
                            console.log(
                              '[Raw Footage] Before update - status:',
                              currentData?.grouped?.rawFootage?.find(
                                (rf) => rf.id === rawFootage.id
                              )?.status
                            );

                            if (!currentData?.grouped) return currentData;

                            const updated = {
                              ...currentData,
                              grouped: {
                                ...currentData.grouped,
                                rawFootage: currentData.grouped.rawFootage.map((rf) =>
                                  rf.id === rawFootage.id
                                    ? {
                                        ...rf,
                                        status: 'PENDING_REVIEW',
                                        // Update individual raw footage statuses to PENDING
                                        rawFootages: rf.rawFootages?.map((footage) => ({
                                          ...footage,
                                          status: 'PENDING',
                                        })),
                                      }
                                    : rf
                                ),
                              },
                            };

                            console.log(
                              '[Raw Footage] After update - status:',
                              updated.grouped.rawFootage.find((rf) => rf.id === rawFootage.id)
                                ?.status
                            );
                            return updated;
                          },
                          { revalidate: false }
                        );
                        setExpandedSections((prev) => ({ ...prev, [rawFootage.id]: false }));
                      }}
                    />
                  </Box>
                </Collapse>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

CampaignV4Activity.propTypes = {
  campaign: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    campaignType: PropTypes.string,
    logisticsType: PropTypes.string,
    agreement: PropTypes.shape({
      agreementUrl: PropTypes.string,
    }),
  }).isRequired,
};

AgreementSubmission.propTypes = {
  campaign: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    agreement: PropTypes.shape({
      agreementUrl: PropTypes.string,
    }),
  }).isRequired,
  agreementSubmission: PropTypes.shape({
    id: PropTypes.string,
    status: PropTypes.string,
  }),
  onUpdate: PropTypes.func,
};

LogisticsForm.propTypes = {
  user: PropTypes.object,
  campaignId: PropTypes.string,
  onUpdate: PropTypes.func,
};

export default CampaignV4Activity;
