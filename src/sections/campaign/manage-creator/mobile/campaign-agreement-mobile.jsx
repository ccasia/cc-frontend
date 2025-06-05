import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { Page, pdfjs, Document } from 'react-pdf';
import React, { useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Alert,
  Button,
  Dialog,
  Avatar,
  Divider,
  Tooltip,
  Container,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { RHFUpload } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// eslint-disable-next-line react/prop-types
const AvatarIcon = ({ icon, ...props }) => (
  <Avatar {...props}>
    <Iconify icon={icon} />
  </Avatar>
);

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

const LoadingDots = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return `${prev}.`;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <span>{dots}</span>;
};

const CampaignAgreementMobile = ({ campaign, timeline, submission, agreementStatus }) => {
  const [loading, setLoading] = useState(false);
  const { user, dispatch } = useAuthContext();
  const display = useBoolean();
  const router = useRouter();

  const [numPages, setNumPages] = useState(null);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitStatus, setSubmitStatus] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(null);
  const [openPreviewModal, setOpenPreviewModal] = useState(false);

  // eslint-disable-next-line no-shadow
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfLoading(false);
  };

  const onDocumentLoadError = (error) => {
    setPdfError(error);
    setPdfLoading(false);
    enqueueSnackbar('Error to load PDF', { variant: 'error' });
    console.error('Error loading PDF:', error);
  };

  const agreement = campaign?.campaignTimeline?.find((elem) => elem?.name === 'Agreement');

  const methods = useForm({
    defaultValues: {
      agreementForm: null,
    },
  });

  const { watch, setValue, handleSubmit, reset } = methods;

  const agreementForm = watch('agreementForm');

  const onDrop = (files) => {
    const file = files[0];

    setValue('agreementForm', file);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          enqueueSnackbar('Uploaded successfully!', {
            variant: 'success',
            anchorOrigin: {
              vertical: 'top',
              horizontal: 'center',
            },
          });
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleRemove = () => {
    setValue('agreementForm', null);
    setUploadProgress(0);
  };

  const onSubmit = handleSubmit(async (data) => {
    setOpenUploadModal(false);
    setShowSubmitDialog(true);
    setSubmitStatus('submitting');

    const formData = new FormData();
    formData.append('agreementForm', data.agreementForm);
    formData.append(
      'data',
      JSON.stringify({
        campaignId: campaign.id,
        timelineId: timeline.id,
        submissionTypeId: agreement.submissionTypeId,
        submissionId: submission?.id,
      })
    );

    try {
      setLoading(true);
      const res = await axiosInstance.post(endpoints.submission.creator.agreement, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      enqueueSnackbar(res?.data?.message);
      mutate(endpoints.kanban.root);
      mutate(`${endpoints.submission.root}?creatorId=${user?.id}&campaignId=${campaign?.id}`);
      mutate(endpoints.campaign.creator.getCampaign(campaign.id));
      reset();
      setOpenPreviewModal(false);
      setSubmitStatus('success');
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (error?.message === 'Forbidden') {
        dispatch({
          type: 'LOGOUT',
        });
        enqueueSnackbar('Your session is expired. Please re-login', {
          variant: 'error',
        });
        return;
      }
      enqueueSnackbar('Submission of agreement failed', {
        variant: 'error',
      });
      setSubmitStatus('error');
    } finally {
      setLoading(false);
    }
  });

  const handleCloseSubmitDialog = () => {
    setShowSubmitDialog(false);
    setSubmitStatus('');
  };

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const filename = `${campaign?.id}-${campaign?.name}-${dayjs().toISOString()}.pdf`;

      if ('download' in document.createElement('a')) {
        const link = document.createElement('a');
        const blobUrl = window.URL.createObjectURL(blob);
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Delay revocation to ensure Safari processes the download
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);
      }
      // For IE10+
      else if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, filename);
      }
      // Fallback - open in a new window
      else {
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

  return (
    <Container maxWidth="sm" sx={{ py: 2, px: 3 }}>
      {/* Header */}
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Button
          color="inherit"
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
          onClick={() => router.back()}
          sx={{
            alignSelf: 'flex-start',
            color: '#636366',
            fontSize: '0.9rem',
            fontWeight: 600,
            ml: -1,
          }}
        >
          Overview
        </Button>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            fontSize: '1.5rem',
            color: '#221f20',
          }}
        >
          Agreement Submission ✍
        </Typography>

        <Typography variant="subtitle2" color="text.secondary">
          Due: {dayjs(submission?.dueDate).format('MMM DD, YYYY')}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {!agreementStatus ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="60vh"
          textAlign="center"
        >
          <Box
            style={{
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              backgroundColor: '#f5f5f5',
              borderRadius: '50%',
              marginBottom: '16px',
            }}
          >
            🕑
          </Box>
          <Typography variant="h5" sx={{ fontFamily: 'Instrument Serif', fontWeight: 550, mb: 1 }}>
            Agreement Processing
          </Typography>
          <Typography variant="body1" color="#636366">
            Your agreement is being processed. Please check back later.
          </Typography>
        </Box>
      ) : (
        <>
          {submission?.status === 'PENDING_REVIEW' && (
            <Stack justifyContent="center" alignItems="center" spacing={2} sx={{ py: 8 }}>
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: '#f4b84a',
                  fontSize: '50px',
                }}
              >
                ⏳
              </Box>
              <Stack spacing={1} alignItems="center">
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: 'Instrument Serif, serif',
                    fontWeight: 550,
                  }}
                >
                  In Review
                </Typography>
                <Typography variant="body1" sx={{ color: '#636366' }}>
                  Your agreement is being reviewed.
                </Typography>
              </Stack>
            </Stack>
          )}

          {submission?.status === 'IN_PROGRESS' && (
            <Box sx={{ pb: '100px' }}>
              <Stack gap={3}>
                <Box>
                  <Typography variant="body1" sx={{ color: '#221f20', mb: 2 }}>
                    Before starting the campaign, you must sign the standard agreement submission
                    procedure!
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#221f20', mb: 3 }}>
                    Download the agreement PDF from the link below, and then upload it back here to
                    proceed to the next step.
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<Iconify icon="material-symbols:download" width={20} />}
                      onClick={() => handleDownload(campaign?.agreement?.agreementUrl)}
                      fullWidth
                      sx={{
                        bgcolor: 'white',
                        border: 1,
                        borderColor: '#e7e7e7',
                        borderBottom: 3,
                        borderBottomColor: '#e7e7e7',
                        color: '#203ff5',
                        '&:hover': {
                          bgcolor: 'white',
                          borderColor: '#e7e7e7',
                        },
                        '& .MuiButton-startIcon': {
                          color: '#203ff5',
                        },
                      }}
                    >
                      Download
                    </Button>

                    <Button
                      variant="contained"
                      startIcon={<Iconify icon="solar:eye-bold" width={20} />}
                      onClick={() => setOpenPreviewModal(true)}
                      fullWidth
                      sx={{
                        bgcolor: '#203ff5',
                        color: 'white',
                        borderBottom: 3,
                        borderBottomColor: '#112286',
                        '&:hover': {
                          bgcolor: '#1935dd',
                        },
                        '& .MuiButton-startIcon': {
                          color: 'white',
                        },
                      }}
                    >
                      Preview
                    </Button>
                  </Stack>

                  {/* Mobile-optimized PDF Preview */}
                  <Box
                    sx={{
                      width: '100%',
                      height: '400px',
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
                    }}
                  >
                    <Document
                      file={campaign?.agreement?.agreementUrl}
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
                            scale={0.6}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                          />
                        </Box>
                      ))}
                    </Document>
                  </Box>
                </Box>
              </Stack>

              {/* Fixed Upload Button */}
              <Box
                sx={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  bgcolor: 'white',
                  borderTop: '1px solid #e7e7e7',
                  p: 2,
                  zIndex: 1000,
                  boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Container maxWidth="sm" sx={{ px: 3 }}>
                  <Button
                    variant="contained"
                    onClick={() => setOpenUploadModal(true)}
                    startIcon={<Iconify icon="material-symbols:add" width={24} />}
                    fullWidth
                    sx={{
                      bgcolor: '#203ff5',
                      color: 'white',
                      borderBottom: 3.5,
                      borderBottomColor: '#112286',
                      borderRadius: 1.5,
                      py: 1.5,
                      '&:hover': {
                        bgcolor: '#203ff5',
                        opacity: 0.9,
                      },
                    }}
                  >
                    Upload
                  </Button>
                </Container>
              </Box>
            </Box>
          )}

          {submission?.status === 'APPROVED' && (
            <Stack justifyContent="center" alignItems="center" spacing={3} sx={{ py: 8 }}>
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: '#5abc6f',
                  fontSize: '50px',
                }}
              >
                ✅
              </Box>
              <Stack spacing={1} alignItems="center">
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: 'Instrument Serif, serif',
                    fontWeight: 500,
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '2.5rem' },
                  }}
                >
                  Agreement Approved!
                </Typography>
                <Typography variant="body1" sx={{ color: '#636366' }}>
                  Your agreement has been approved.
                </Typography>
              </Stack>
              <Button
                onClick={display.onTrue}
                variant="contained"
                startIcon={<Iconify icon="solar:document-bold" width={24} />}
                fullWidth
                sx={{
                  bgcolor: '#203ff5',
                  color: 'white',
                  borderBottom: 3.5,
                  borderBottomColor: '#112286',
                  borderRadius: 1.5,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: '#203ff5',
                    opacity: 0.9,
                  },
                }}
              >
                Preview Agreement
              </Button>
            </Stack>
          )}

          {submission?.status === 'CHANGES_REQUIRED' && (
            <Box sx={{ pb: '100px' }}>
              <Stack gap={3}>
                <Alert
                  severity="warning"
                  icon={<Iconify icon="solar:danger-triangle-bold" width={20} sx={{ mt: 0.2 }} />}
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'warning.light',
                    '& .MuiAlert-icon': {
                      color: 'warning.main',
                    },
                    bgcolor: 'warning.lighter',
                  }}
                >
                  <Stack spacing={1}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: 'warning.darker',
                        fontWeight: 600,
                      }}
                    >
                      Feedback
                    </Typography>

                    {submission?.feedback?.length > 0 && (
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.primary',
                            mb: 1,
                            lineHeight: 1.5,
                          }}
                        >
                          {submission.feedback[submission.feedback.length - 1].content}
                        </Typography>

                        {submission.feedback[submission.feedback.length - 1].reasons?.length > 0 && (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                            {submission.feedback[submission.feedback.length - 1].reasons.map(
                              (reason, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    bgcolor: 'warning.main',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                  }}
                                >
                                  {reason}
                                </Box>
                              )
                            )}
                          </Stack>
                        )}
                      </Box>
                    )}
                  </Stack>
                </Alert>

                <Box>
                  <Typography variant="body1" sx={{ color: '#221f20', mb: 2 }}>
                    Before starting the campaign, you must sign the standard agreement submission
                    procedure!
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#221f20', mb: 3 }}>
                    Download the agreement PDF from the link below, and then upload it back here to
                    proceed to the next step.
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<Iconify icon="material-symbols:download" width={20} />}
                      onClick={() => handleDownload(campaign?.agreement?.agreementUrl)}
                      fullWidth
                      sx={{
                        bgcolor: 'white',
                        border: 1,
                        borderColor: '#e7e7e7',
                        borderBottom: 3,
                        borderBottomColor: '#e7e7e7',
                        color: '#203ff5',
                        '&:hover': {
                          bgcolor: 'white',
                          borderColor: '#e7e7e7',
                        },
                        '& .MuiButton-startIcon': {
                          color: '#203ff5',
                        },
                      }}
                    >
                      Download
                    </Button>

                    <Button
                      variant="contained"
                      startIcon={<Iconify icon="solar:eye-bold" width={20} />}
                      onClick={() => setOpenPreviewModal(true)}
                      fullWidth
                      sx={{
                        bgcolor: '#203ff5',
                        color: 'white',
                        borderBottom: 3,
                        borderBottomColor: '#112286',
                        '&:hover': {
                          bgcolor: '#1935dd',
                        },
                        '& .MuiButton-startIcon': {
                          color: 'white',
                        },
                      }}
                    >
                      Preview
                    </Button>
                  </Stack>

                  <Box
                    sx={{
                      width: '100%',
                      height: '400px',
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
                    }}
                  >
                    <Document
                      file={campaign?.agreement?.agreementUrl}
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
                            scale={0.6}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                          />
                        </Box>
                      ))}
                    </Document>
                  </Box>
                </Box>
              </Stack>

              {/* Fixed Upload Button */}
              <Box
                sx={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  bgcolor: 'white',
                  borderTop: '1px solid #e7e7e7',
                  p: 2,
                  zIndex: 1000,
                  boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Container maxWidth="sm" sx={{ px: 3 }}>
                  <Button
                    variant="contained"
                    onClick={() => setOpenUploadModal(true)}
                    startIcon={<Iconify icon="material-symbols:add" width={24} />}
                    fullWidth
                    sx={{
                      bgcolor: '#203ff5',
                      color: 'white',
                      borderBottom: 3.5,
                      borderBottomColor: '#112286',
                      borderRadius: 1.5,
                      py: 1.5,
                      '&:hover': {
                        bgcolor: '#203ff5',
                        opacity: 0.9,
                      },
                    }}
                  >
                    Upload Agreement
                  </Button>
                </Container>
              </Box>
            </Box>
          )}

          {/* PDF Preview Modal */}
          <Dialog
            open={openPreviewModal}
            onClose={() => setOpenPreviewModal(false)}
            fullScreen
            PaperProps={{
              sx: {
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                overflow: 'hidden',
                position: 'relative',
              },
            }}
            sx={{
              zIndex: 9999,
              '& .MuiDialog-container': {
                alignItems: 'center',
                justifyContent: 'center',
              },
              '& .MuiDialog-paper': {
                m: 0,
                width: '100%',
                height: '100%',
              },
            }}
          >
            {/* Header Info - Top Left */}
            <Box
              sx={{
                position: 'fixed',
                top: { xs: 10, md: 20 },
                left: { xs: 10, md: 20 },
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1, md: 1.5 },
                borderRadius: '8px',
                p: { xs: 1.5, md: 2 },
                height: { xs: '56px', md: '64px' },
                minWidth: { xs: '200px', md: '240px' },
              }}
            >
              <Box
                sx={{
                  width: { xs: 36, md: 40 },
                  height: { xs: 36, md: 40 },
                  borderRadius: 1,
                  bgcolor: '#1340ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify
                  icon="solar:document-bold"
                  sx={{
                    color: 'white',
                    width: { xs: 18, md: 20 },
                    height: { xs: 18, md: 20 },
                  }}
                />
              </Box>
              <Stack spacing={0.5}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: '#e7e7e7',
                    fontSize: { xs: '13px', md: '14px' },
                    lineHeight: 1.3,
                  }}
                >
                  Agreement Form
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#85868E',
                    fontSize: { xs: '11px', md: '12px' },
                    lineHeight: 1.3,
                  }}
                >
                  {campaign?.name}
                </Typography>
              </Stack>
            </Box>

            {/* Action Buttons - Top Right */}
            <Stack
              direction="row"
              spacing={{ xs: 0.5, md: 1 }}
              sx={{
                position: 'fixed',
                top: { xs: 10, md: 20 },
                right: { xs: 10, md: 20 },
                zIndex: 10000,
              }}
            >
              {/* Download Button */}
              {campaign?.agreement?.agreementUrl && (
                <Button
                  onClick={() => handleDownload(campaign.agreement.agreementUrl)}
                  sx={{
                    minWidth: { xs: '40px', md: '44px' },
                    width: { xs: '40px', md: '44px' },
                    height: { xs: '40px', md: '44px' },
                    p: 0,
                    bgcolor: 'transparent',
                    color: '#ffffff',
                    border: '1px solid #28292C',
                    borderRadius: '8px',
                    fontWeight: 650,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: { xs: '3px', md: '4px' },
                      left: { xs: '3px', md: '4px' },
                      right: { xs: '3px', md: '4px' },
                      bottom: { xs: '3px', md: '4px' },
                      borderRadius: '4px',
                      backgroundColor: 'transparent',
                      transition: 'background-color 0.2s ease',
                      zIndex: -1,
                    },
                    '&:hover::before': {
                      backgroundColor: '#5A5A5C',
                    },
                    '&:hover': {
                      bgcolor: 'transparent',
                    },
                  }}
                >
                  <Iconify icon="eva:download-fill" width={{ xs: 16, md: 18 }} />
                </Button>
              )}

              {/* Close Button */}
              <Button
                onClick={() => setOpenPreviewModal(false)}
                sx={{
                  minWidth: { xs: '40px', md: '44px' },
                  width: { xs: '40px', md: '44px' },
                  height: { xs: '40px', md: '44px' },
                  p: 0,
                  color: '#ffffff',
                  border: '1px solid #28292C',
                  borderRadius: '8px',
                  fontWeight: 650,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: { xs: '3px', md: '4px' },
                    left: { xs: '3px', md: '4px' },
                    right: { xs: '3px', md: '4px' },
                    bottom: { xs: '3px', md: '4px' },
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s ease',
                    zIndex: -1,
                  },
                  '&:hover::before': {
                    backgroundColor: '#5A5A5C',
                  },
                  '&:hover': {
                    bgcolor: 'transparent',
                  },
                }}
              >
                <Iconify icon="eva:close-fill" width={{ xs: 20, md: 22 }} />
              </Button>
            </Stack>

            {/* PDF Content */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                pt: { xs: '80px', md: '100px' },
                pb: { xs: 2, md: 3 },
                px: { xs: 2, md: 4 },
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: '90%',
                  height: 'calc(100vh - 120px)',
                  maxWidth: '1000px',
                  bgcolor: 'transparent',
                  borderRadius: 2,
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  '&::-webkit-scrollbar': {
                    width: { xs: '4px', md: '6px' },
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#5A5A5C',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#6A6A6C',
                  },
                }}
              >
                {!campaign?.agreement?.agreementUrl ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#e7e7e7',
                    }}
                  >
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        border: '2px dashed #5A5A5C',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                      }}
                    >
                      <Iconify
                        icon="solar:document-text-bold"
                        sx={{
                          color: '#85868E',
                          width: 32,
                          height: 32,
                        }}
                      />
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#e7e7e7',
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      No Agreement Form Available
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#85868E',
                        textAlign: 'center',
                        maxWidth: 300,
                      }}
                    >
                      The agreement template for this campaign has not been set up yet.
                    </Typography>
                  </Box>
                ) : (
                  <Document
                    file={agreementForm ? URL.createObjectURL(agreementForm) : campaign?.agreement?.agreementUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center', 
                          height: '100%',
                          gap: 2,
                        }}
                      >
                        <CircularProgress 
                          size={32} 
                          sx={{ 
                            color: '#ffffff',
                          }} 
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#e7e7e7',
                            fontWeight: 500,
                          }}
                        >
                          Loading agreement form...
                        </Typography>
                      </Box>
                    }
                  >
                    {pdfError ? (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          color: '#e7e7e7',
                        }}
                      >
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: 2,
                            border: '2px dashed #dc3545',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 3,
                          }}
                        >
                          <Iconify
                            icon="solar:danger-triangle-bold"
                            sx={{
                              color: '#dc3545',
                              width: 32,
                              height: 32,
                            }}
                          />
                        </Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: '#dc3545',
                            fontWeight: 600,
                            mb: 1,
                          }}
                        >
                          Error Loading PDF
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#85868E',
                            textAlign: 'center',
                            maxWidth: 400,
                          }}
                        >
                          There was an error loading the agreement form. Please try again later.
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={3} sx={{ py: 2, alignItems: 'center' }}>
                        {Array.from(new Array(numPages), (el, index) => (
                          <Box
                            key={`page_${index + 1}`}
                            sx={{
                              bgcolor: '#ffffff',
                              borderRadius: 1,
                              overflow: 'hidden',
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                              border: '1px solid #28292C',
                            }}
                          >
                            <Page
                              pageNumber={index + 1}
                              renderAnnotationLayer={false}
                              renderTextLayer={false}
                              width={window.innerWidth < 768 ? window.innerWidth - 64 : 800}
                              scale={1}
                            />
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Document>
                )}
              </Box>
            </Box>
          </Dialog>

          {/* Upload Modal */}
          <Dialog
            open={openUploadModal}
            fullScreen
            sx={{
              '& .MuiDialog-paper': {
                bgcolor: '#f4f4f4',
              },
            }}
          >
            <DialogTitle sx={{ bgcolor: '#f4f4f4', pb: 1 }}>
              <Stack direction="row" alignItems="center" gap={2}>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: 'Instrument Serif, serif',
                    fontSize: '1.8rem',
                    fontWeight: 550,
                  }}
                >
                  Upload Document
                </Typography>

                <IconButton
                  onClick={() => setOpenUploadModal(false)}
                  sx={{
                    ml: 'auto',
                    '& svg': {
                      width: 24,
                      height: 24,
                      color: '#636366',
                    },
                  }}
                >
                  <Iconify icon="hugeicons:cancel-01" />
                </IconButton>
              </Stack>
            </DialogTitle>

            <DialogContent sx={{ bgcolor: '#f4f4f4', px: 2 }}>
              <FormProvider methods={methods} onSubmit={onSubmit}>
                {agreementForm ? (
                  <Box sx={{ mt: 1 }}>
                    <Stack
                      spacing={2}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: '#e7e7e7',
                        borderRadius: 1.2,
                        bgcolor: '#ffffff',
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <AvatarIcon
                          icon="ph:file-light"
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: '#f5f5f5',
                            color: '#8e8e93',
                            borderRadius: 1.2,
                            '& svg': { width: 24, height: 24 },
                          }}
                        />

                        <Box sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: 'text.primary',
                              fontWeight: 600,
                              fontSize: '1rem',
                            }}
                          >
                            {agreementForm.name}
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              display: 'block',
                              mt: 0.5,
                              fontSize: '0.875rem',
                            }}
                          >
                            {uploadProgress < 100
                              ? `Uploading ${uploadProgress}%`
                              : formatFileSize(agreementForm.size)}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack spacing={2}>
                        {uploadProgress < 100 ? (
                          <Stack spacing={2} alignItems="center">
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                              <CircularProgress
                                variant="determinate"
                                value={100}
                                size={40}
                                thickness={6}
                                sx={{ color: 'grey.300' }}
                              />
                              <CircularProgress
                                variant="determinate"
                                value={uploadProgress}
                                size={40}
                                thickness={6}
                                sx={{
                                  color: '#5abc6f',
                                  position: 'absolute',
                                  left: 0,
                                  strokeLinecap: 'round',
                                }}
                              />
                            </Box>
                            <Button
                              onClick={handleRemove}
                              variant="contained"
                              fullWidth
                              sx={{
                                bgcolor: 'white',
                                border: 1,
                                borderColor: '#e7e7e7',
                                borderBottom: 3,
                                borderBottomColor: '#e7e7e7',
                                color: '#221f20',
                                '&:hover': {
                                  bgcolor: 'white',
                                  borderColor: '#e7e7e7',
                                },
                                textTransform: 'none',
                                py: 1.5,
                              }}
                            >
                              Cancel
                            </Button>
                          </Stack>
                        ) : (
                          <Stack spacing={1}>
                            <Button
                              onClick={() => setOpenPreviewModal(true)}
                              variant="contained"
                              fullWidth
                              sx={{
                                bgcolor: 'white',
                                border: 1,
                                borderColor: '#e7e7e7',
                                borderBottom: 3,
                                borderBottomColor: '#e7e7e7',
                                color: '#221f20',
                                '&:hover': {
                                  bgcolor: 'white',
                                  borderColor: '#e7e7e7',
                                },
                                textTransform: 'none',
                                py: 1.5,
                              }}
                            >
                              Preview
                            </Button>
                            <Button
                              onClick={handleRemove}
                              variant="contained"
                              fullWidth
                              sx={{
                                bgcolor: 'white',
                                border: 1,
                                borderColor: '#e7e7e7',
                                borderBottom: 3,
                                borderBottomColor: '#e7e7e7',
                                color: '#221f20',
                                '&:hover': {
                                  bgcolor: 'white',
                                  borderColor: '#e7e7e7',
                                },
                                textTransform: 'none',
                                py: 1.5,
                              }}
                            >
                              Remove
                            </Button>
                          </Stack>
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                ) : (
                  <RHFUpload type="pdf" name="agreementForm" onDrop={onDrop} />
                )}
              </FormProvider>
            </DialogContent>

            <DialogActions sx={{ px: 2, pb: 3, bgcolor: '#f4f4f4' }}>
              <LoadingButton
                loading={loading}
                variant="contained"
                disabled={!agreementForm || uploadProgress < 100}
                onClick={onSubmit}
                fullWidth
                sx={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  bgcolor:
                    agreementForm && uploadProgress === 100 ? '#203ff5' : '#b0b0b1 !important',
                  color: '#ffffff !important',
                  borderBottom: 3.5,
                  borderBottomColor:
                    agreementForm && uploadProgress === 100 ? '#112286' : '#9e9e9f',
                  borderRadius: 1.5,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: agreementForm && uploadProgress === 100 ? '#203ff5' : '#b0b0b1',
                    opacity: 0.9,
                  },
                }}
              >
                Submit
              </LoadingButton>
            </DialogActions>
          </Dialog>

          {/* Approved Agreement Preview Modal */}
          <Dialog
            open={display.value}
            onClose={display.onFalse}
            fullScreen
            PaperProps={{
              sx: {
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                overflow: 'hidden',
                position: 'relative',
              },
            }}
            sx={{
              zIndex: 9999,
              '& .MuiDialog-container': {
                alignItems: 'center',
                justifyContent: 'center',
              },
              '& .MuiDialog-paper': {
                m: 0,
                width: '100%',
                height: '100%',
              },
            }}
          >
            {/* Header Info - Top Left */}
            <Box
              sx={{
                position: 'fixed',
                top: { xs: 10, md: 20 },
                left: { xs: 10, md: 20 },
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1, md: 1.5 },
                borderRadius: '8px',
                p: { xs: 1.5, md: 2 },
                height: { xs: '56px', md: '64px' },
                minWidth: { xs: '200px', md: '240px' },
              }}
            >
              <Box
                sx={{
                  width: { xs: 36, md: 40 },
                  height: { xs: 36, md: 40 },
                  borderRadius: 1,
                  bgcolor: '#1340ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify
                  icon="solar:document-bold"
                  sx={{
                    color: 'white',
                    width: { xs: 18, md: 20 },
                    height: { xs: 18, md: 20 },
                  }}
                />
              </Box>
              <Stack spacing={0.5}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: '#e7e7e7',
                    fontSize: { xs: '13px', md: '14px' },
                    lineHeight: 1.3,
                  }}
                >
                  Preview Agreement
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#85868E',
                    fontSize: { xs: '11px', md: '12px' },
                    lineHeight: 1.3,
                  }}
                >
                  {campaign?.name}
                </Typography>
              </Stack>
            </Box>

            {/* Action Buttons - Top Right */}
            <Stack
              direction="row"
              spacing={{ xs: 0.5, md: 1 }}
              sx={{
                position: 'fixed',
                top: { xs: 10, md: 20 },
                right: { xs: 10, md: 20 },
                zIndex: 10000,
              }}
            >
              {/* Download Button */}
              {submission?.content && (
                <Tooltip 
                  title="Download PDF" 
                  arrow 
                  placement="bottom"
                  PopperProps={{
                    sx: {
                      zIndex: 10001,
                    },
                  }}
                  slotProps={{
                    tooltip: {
                      sx: {
                        bgcolor: 'rgba(0, 0, 0, 0.9)',
                        color: 'white',
                        fontSize: { xs: '11px', md: '12px' },
                        fontWeight: 500,
                      },
                    },
                    arrow: {
                      sx: {
                        color: 'rgba(0, 0, 0, 0.9)',
                      },
                    },
                  }}
                >
                  <Button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = submission.content;
                      link.download = 'agreement-document.pdf';
                      link.click();
                    }}
                    sx={{
                      minWidth: { xs: '40px', md: '44px' },
                      width: { xs: '40px', md: '44px' },
                      height: { xs: '40px', md: '44px' },
                      p: 0,
                      bgcolor: 'transparent',
                      color: '#ffffff',
                      border: '1px solid #28292C',
                      borderRadius: '8px',
                      fontWeight: 650,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: { xs: '3px', md: '4px' },
                        left: { xs: '3px', md: '4px' },
                        right: { xs: '3px', md: '4px' },
                        bottom: { xs: '3px', md: '4px' },
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        transition: 'background-color 0.2s ease',
                        zIndex: -1,
                      },
                      '&:hover::before': {
                        backgroundColor: '#5A5A5C',
                      },
                      '&:hover': {
                        bgcolor: 'transparent',
                      },
                    }}
                  >
                    <Iconify icon="eva:download-fill" width={{ xs: 16, md: 18 }} />
                  </Button>
                </Tooltip>
              )}

              {/* Close Button */}
              <Tooltip 
                title="Close" 
                arrow 
                placement="bottom"
                PopperProps={{
                  sx: {
                    zIndex: 10001,
                  },
                }}
                slotProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'rgba(0, 0, 0, 0.9)',
                      color: 'white',
                      fontSize: { xs: '11px', md: '12px' },
                      fontWeight: 500,
                    },
                  },
                  arrow: {
                    sx: {
                      color: 'rgba(0, 0, 0, 0.9)',
                    },
                  },
                }}
              >
                <Button
                  onClick={display.onFalse}
                  sx={{
                    minWidth: { xs: '40px', md: '44px' },
                    width: { xs: '40px', md: '44px' },
                    height: { xs: '40px', md: '44px' },
                    p: 0,
                    color: '#ffffff',
                    border: '1px solid #28292C',
                    borderRadius: '8px',
                    fontWeight: 650,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: { xs: '3px', md: '4px' },
                      left: { xs: '3px', md: '4px' },
                      right: { xs: '3px', md: '4px' },
                      bottom: { xs: '3px', md: '4px' },
                      borderRadius: '4px',
                      backgroundColor: 'transparent',
                      transition: 'background-color 0.2s ease',
                      zIndex: -1,
                    },
                    '&:hover::before': {
                      backgroundColor: '#5A5A5C',
                    },
                    '&:hover': {
                      bgcolor: 'transparent',
                    },
                  }}
                >
                  <Iconify icon="eva:close-fill" width={{ xs: 20, md: 22 }} />
                </Button>
              </Tooltip>
            </Stack>

            {/* PDF Content */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                pt: { xs: '80px', md: '100px' },
                pb: { xs: 2, md: 3 },
                px: { xs: 2, md: 4 },
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: '90%',
                  height: 'calc(100vh - 120px)',
                  maxWidth: '1000px',
                  bgcolor: 'transparent',
                  borderRadius: 2,
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  '&::-webkit-scrollbar': {
                    width: { xs: '4px', md: '6px' },
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#5A5A5C',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#6A6A6C',
                  },
                }}
              >
                {!submission?.content ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#e7e7e7',
                    }}
                  >
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        border: '2px dashed #5A5A5C',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                      }}
                    >
                      <Iconify
                        icon="solar:document-text-bold"
                        sx={{
                          color: '#85868E',
                          width: 32,
                          height: 32,
                        }}
                      />
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#e7e7e7',
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      No Agreement Available
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#85868E',
                        textAlign: 'center',
                        maxWidth: 300,
                      }}
                    >
                      The agreement document is not available for preview.
                    </Typography>
                  </Box>
                ) : (
                  <Document
                    file={submission?.content}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center', 
                          height: '100%',
                          gap: 2,
                        }}
                      >
                        <CircularProgress 
                          size={32} 
                          sx={{ 
                            color: '#ffffff',
                          }} 
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#e7e7e7',
                            fontWeight: 500,
                          }}
                        >
                          Loading agreement document...
                        </Typography>
                      </Box>
                    }
                  >
                    {pdfError ? (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          color: '#e7e7e7',
                        }}
                      >
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: 2,
                            border: '2px dashed #dc3545',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 3,
                          }}
                        >
                          <Iconify
                            icon="solar:danger-triangle-bold"
                            sx={{
                              color: '#dc3545',
                              width: 32,
                              height: 32,
                            }}
                          />
                        </Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: '#dc3545',
                            fontWeight: 600,
                            mb: 1,
                          }}
                        >
                          Error Loading PDF
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#85868E',
                            textAlign: 'center',
                            maxWidth: 400,
                          }}
                        >
                          {pdfError.message || 'There was an error loading the agreement document. Please try again later.'}
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={3} sx={{ py: 2, alignItems: 'center' }}>
                        {Array.from(new Array(numPages), (el, index) => (
                          <Box
                            key={`page_${index + 1}`}
                            sx={{
                              bgcolor: '#ffffff',
                              borderRadius: 1,
                              overflow: 'hidden',
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                              border: '1px solid #28292C',
                            }}
                          >
                            <Page
                              pageNumber={index + 1}
                              renderAnnotationLayer={false}
                              renderTextLayer={false}
                              width={window.innerWidth < 768 ? window.innerWidth - 64 : 800}
                              scale={1}
                            />
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Document>
                )}
              </Box>
            </Box>
          </Dialog>

          {/* Submit Status Dialog */}
          <Dialog open={showSubmitDialog} maxWidth="xs" fullWidth>
            <DialogContent>
              <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
                {submitStatus === 'submitting' && (
                  <>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        bgcolor: '#f4b84a',
                        fontSize: '40px',
                      }}
                    >
                      🛫
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        display: 'flex',
                        fontFamily: 'Instrument Serif, serif',
                        fontSize: '1.5rem',
                        fontWeight: 550,
                        textAlign: 'center',
                      }}
                    >
                      Submitting Agreement
                      <LoadingDots />
                    </Typography>
                  </>
                )}
                {submitStatus === 'success' && (
                  <>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        bgcolor: '#835cf5',
                        fontSize: '40px',
                      }}
                    >
                      🚀
                    </Box>
                    <Stack spacing={1} alignItems="center">
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: 'Instrument Serif, serif',
                          fontSize: '1.5rem',
                          fontWeight: 550,
                          textAlign: 'center',
                        }}
                      >
                        Agreement Submitted!
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: '#636366',
                          textAlign: 'center',
                          mb: -3,
                        }}
                      >
                        Your agreement has been sent.
                      </Typography>
                    </Stack>
                  </>
                )}
                {submitStatus === 'error' && (
                  <>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        bgcolor: 'error.lighter',
                        fontSize: '30px',
                      }}
                    >
                      <Iconify icon="mdi:error" sx={{ width: 40, height: 40, color: 'error.main' }} />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: 'Instrument Serif, serif',
                        fontSize: '1.5rem',
                        fontWeight: 550,
                        textAlign: 'center',
                      }}
                    >
                      Submission Failed
                    </Typography>
                  </>
                )}
              </Stack>
            </DialogContent>
            {(submitStatus === 'success' || submitStatus === 'error') && (
              <DialogActions sx={{ pb: 3, px: 3 }}>
                <Button
                  onClick={handleCloseSubmitDialog}
                  variant="contained"
                  fullWidth
                  sx={{
                    bgcolor: '#3a3a3c',
                    color: '#ffffff',
                    borderBottom: 3.5,
                    borderBottomColor: '#202021',
                    borderRadius: 1.5,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: '#3a3a3c',
                      opacity: 0.9,
                    },
                  }}
                >
                  Done
                </Button>
              </DialogActions>
            )}
          </Dialog>
        </>
      )}
    </Container>
  );
};

export default CampaignAgreementMobile;

CampaignAgreementMobile.propTypes = {
  campaign: PropTypes.object,
  timeline: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  submission: PropTypes.object,
  agreementStatus: PropTypes.bool,
}; 