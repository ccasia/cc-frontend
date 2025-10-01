import useSWR, { mutate } from 'swr';
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { Page, pdfjs, Document } from 'react-pdf';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';

import { 
  Box, 
  Grid, 
  Card, 
  Stack, 
  Chip, 
  Button, 
  Typography, 
  LinearProgress,
  CircularProgress,
  Collapse,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  Avatar
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { fetcher, endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { RHFUpload } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

// Configure PDF.js worker
try {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
} catch (error) {
  console.warn('Failed to set CDN worker, falling back to local worker:', error);
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

// Helper component for avatar icon
const AvatarIcon = ({ icon, ...props }) => (
  <Avatar {...props}>
    <Iconify icon={icon} />
  </Avatar>
);

// File size formatter
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

import V4VideoSubmission from './submissions/v4-video-submission';
import V4PhotoSubmission from './submissions/v4-photo-submission';
import V4RawFootageSubmission from './submissions/v4-raw-footage-submission';

// Enhanced Agreement Submission Component with PDF Display
const AgreementSubmission = ({ campaign, agreementSubmission, onUpdate }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState('');
  
  const isSmallScreen = useMediaQuery('(max-width: 600px)');

  // Get agreement URL from campaign
  const agreementUrl = campaign?.agreement?.agreementUrl;
  
  // Check if agreement has been submitted (not just pending)
  const isAgreementSubmitted = agreementSubmission?.status === 'PENDING_REVIEW' || 
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

  const onDrop = (files) => {
    const file = files[0];
    setValue('agreementForm', file);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          enqueueSnackbar('Uploaded successfully!', { variant: 'success' });
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
    setUploading(true);

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
      setPreview('');
      // Update the agreement status to IN REVIEW after successful submission
      onUpdate();
    } catch (error) {
      console.error('Agreement upload failed:', error);
      enqueueSnackbar('Submission of agreement failed', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  });

  return (
    <>
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
      {/* Left Side - PDF Preview */}
      {agreementUrl && (
        <Box sx={{ flex: 1 }}>
          <Box
            sx={{
              width: '100%',
              height: '500px',
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
        </Box>
      )}

      {/* Right Side - Instructions and Buttons */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Instructions */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ color: '#221f20'}}>
            Before starting the campaign, you must sign the standard agreement submission procedure!
          </Typography>
          <Typography variant="body1" sx={{ color: '#221f20'}}>
            Download the agreement PDF from the link below, and then upload it back here to proceed to the next step.
          </Typography>

          {/* Download Agreement Button */}
          {agreementUrl && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="material-symbols:download" width={20} />}
              onClick={() => handleDownload(agreementUrl)}
              sx={{
                bgcolor: 'white',
                border: 1,
                borderColor: '#e7e7e7',
                borderBottom: 3,
                borderBottomColor: '#e7e7e7',
                color: '#203ff5',
                ml: -1,
                alignSelf: 'flex-start',
                '&:hover': {
                  bgcolor: 'white',
                  borderColor: '#e7e7e7',
                },
                '& .MuiButton-startIcon': {
                  color: '#203ff5',
                },
              }}
            >
              Download Agreement
            </Button>
          )}
        </Stack>

        {/* Upload Button - Bottom Right */}
        <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={() => setOpenUploadModal(true)}
            disabled={isAgreementSubmitted || !agreementUrl}
            startIcon={<Iconify icon="material-symbols:add" width={24} />}
            sx={{
              bgcolor: isAgreementSubmitted ? '#b0b0b1' : '#203ff5',
              color: 'white',
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
                color: 'white',
                opacity: 0.6,
              },
            }}
          >
            {isAgreementSubmitted ? 'Submitted' : 'Upload'}
          </Button>
        </Box>
      </Box>
    </Box>

      {/* Upload Modal */}
      <Dialog
        open={openUploadModal}
        fullWidth
        maxWidth="md"
        sx={{
          '& .MuiDialog-paper': {
            width: { xs: 'calc(100% - 32px)', sm: '100%' },
            m: { xs: 2, sm: 32 },
          },
        }}
      >
        <DialogTitle sx={{ bgcolor: '#f4f4f4' }}>
          <Stack direction="row" alignItems="center" gap={2}>
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: { xs: '1.8rem', sm: '2.4rem' },
                fontWeight: 550,
              }}
            >
              Upload Signed Agreement
            </Typography>
            <IconButton
              onClick={() => setOpenUploadModal(false)}
              sx={{ ml: 'auto' }}
            >
              <Iconify icon="hugeicons:cancel-01" />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ bgcolor: '#f4f4f4' }}>
          <FormProvider methods={methods} onSubmit={onSubmit}>
            {agreementForm ? (
              <Box sx={{ mt: 0.5 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: '#e7e7e7',
                    borderRadius: 1.2,
                    bgcolor: '#ffffff',
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                  }}
                >
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
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {agreementForm.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {uploadProgress < 100
                        ? `Uploading ${uploadProgress}%`
                        : formatFileSize(agreementForm.size)}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    {uploadProgress < 100 ? (
                      <CircularProgress size={30} />
                    ) : (
                      <>
                        <Button onClick={() => setPreview(URL.createObjectURL(agreementForm))} variant="outlined">
                          Preview
                        </Button>
                        <Button onClick={handleRemove} variant="outlined">
                          Remove
                        </Button>
                      </>
                    )}
                  </Stack>
                </Stack>
              </Box>
            ) : (
              <RHFUpload type="pdf" name="agreementForm" onDrop={onDrop} />
            )}
          </FormProvider>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, bgcolor: '#f4f4f4' }}>
          <LoadingButton
            loading={uploading}
            variant="contained"
            disabled={!agreementForm || uploadProgress < 100}
            onClick={onSubmit}
            sx={{
              fontSize: '0.95rem',
              fontWeight: 600,
              bgcolor: agreementForm && uploadProgress === 100 ? '#203ff5' : '#b0b0b1 !important',
              color: '#ffffff !important',
              borderBottom: 3.5,
              borderBottomColor: agreementForm && uploadProgress === 100 ? '#112286' : '#9e9e9f',
              borderRadius: 1.5,
              px: 2.5,
              py: 1.2,
            }}
          >
            Submit
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Preview Modal */}
      <Dialog
        open={!!preview}
        onClose={() => setPreview('')}
        fullWidth
        maxWidth="md"
      >
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
    </>
  );
};

// Status color mapping for v4 with client feedback support
const getStatusColor = (status) => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'info';
    case 'PENDING_REVIEW':
      return 'warning';
    case 'APPROVED':
    case 'CLIENT_APPROVED':
    case 'POSTED':
      return 'success';
    case 'CHANGES_REQUIRED':
    case 'REJECTED':
      return 'error';
    case 'SENT_TO_CLIENT':
      return 'secondary';
    case 'CLIENT_FEEDBACK':
      return 'warning';
    default:
      return 'default';
  }
};

// Creator-friendly status labels with client feedback states
const getCreatorStatusLabel = (status) => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'PENDING_REVIEW':
      return 'Admin Review';
    case 'APPROVED':
      return 'Approved';
    case 'CLIENT_APPROVED':
      return 'Approved';
    case 'POSTED':
      return 'Posted';
    case 'CHANGES_REQUIRED':
      return 'Changes Required';
    case 'REJECTED':
      return 'Changes Required';
    case 'SENT_TO_CLIENT':
      return 'Client Review';
    case 'CLIENT_FEEDBACK':
      return 'Client Review';
    default:
      return status;
  }
};

const CampaignV4Activity = ({ campaign }) => {
  const [expandedSections, setExpandedSections] = useState({});
  
  // Fetch creator's v4 submissions
  const { data: submissionsData, error, mutate } = useSWR(
    campaign?.id ? `${endpoints.submission.creator.v4.getMyV4Submissions}?campaignId=${campaign?.id}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Fetch campaign overview
  const { data: overviewData } = useSWR(
    campaign?.id ? `${endpoints.submission.creator.v4.getMyCampaignOverview}?campaignId=${campaign?.id}` : null,
    fetcher
  );

  // Handle section expand/collapse
  const handleToggleSection = (submissionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [submissionId]: !prev[submissionId]
    }));
  };

  // Auto-expand first incomplete submission
  useEffect(() => {
    if (submissionsData?.grouped && Object.keys(expandedSections).length === 0) {
      const allSubmissions = [
        ...submissionsData.grouped.videos,
        ...submissionsData.grouped.photos,
        ...submissionsData.grouped.rawFootage
      ];
      
      const firstIncomplete = allSubmissions.find(s => 
        !['APPROVED', 'CLIENT_APPROVED', 'POSTED'].includes(s.status)
      );
      
      if (firstIncomplete) {
        setExpandedSections({ [firstIncomplete.id]: true });
      }
    }
  }, [submissionsData, expandedSections]);

  // Helper function to determine if submission is "new" (not submitted yet)
  const isNewSubmission = (submission) => {
    const hasContent = submission.video?.length > 0 || 
                      submission.photos?.length > 0 || 
                      submission.rawFootages?.length > 0;
    return !hasContent && submission.status === 'IN_PROGRESS';
  };

  // Helper function to get submission status
  const getSubmissionStatus = (submission) => {
    const hasContent = submission.video?.length > 0 || 
                      submission.photos?.length > 0 || 
                      submission.rawFootages?.length > 0;
    
    if (!hasContent) {
      return 'NOT STARTED';
    }
    
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
        // Check if this is a type that needs posting link (Videos and Photos, not Raw Footages)
        const needsPostingLink = submission.video?.length > 0 || submission.photos?.length > 0;
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
      default:
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
      'APPROVED': {
        color: '#00AB55',
        borderColor: '#00AB55',
      },
      'POSTED': {
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
        return `Draft Video ${submission.contentOrder || index + 1}`;
      case 'PHOTO':
        return 'Photos';
      case 'RAW_FOOTAGE':
        return 'Raw Footages';
      default:
        return 'Submission';
    }
  };

  // Helper function to get submission icon
  const getSubmissionIcon = (submissionType) => {
    switch (submissionType) {
      case 'VIDEO':
        return 'eva:video-fill';
      case 'PHOTO':
        return 'eva:image-fill';
      case 'RAW_FOOTAGE':
        return 'eva:film-fill';
      default:
        return 'eva:file-fill';
    }
  };

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

  // Check if creator's agreement has been approved
  const isAgreementApproved = overviewData?.isAgreementApproved;
  
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
            mb: 2
          }}
        >
          <Stack 
            direction="row" 
            alignItems="center" 
            justifyContent="space-between" 
            sx={{ p: 2, cursor: 'pointer' }}
            onClick={() => setExpandedSections(prev => ({ ...prev, agreement: !prev.agreement }))}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600, 
                  color: 'black',
                  fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
                  borderColor: overviewData.agreementStatus === 'PENDING_REVIEW' ? '#8B5CF6' : '#FFC702',
                  fontSize: '0.75rem',
                }}
              >
                {overviewData.agreementStatus === 'IN_PROGRESS' ? 'PENDING AGREEMENT' : 
                 overviewData.agreementStatus === 'PENDING_REVIEW' ? 'IN REVIEW' :
                 overviewData.agreementStatus?.replace('_', ' ').toUpperCase() || 'NOT STARTED'}
                </Typography>
              </Stack>
            <Iconify 
              icon={expandedSections.agreement ? "eva:chevron-up-fill" : "eva:chevron-down-fill"} 
              width={20} 
            />
          </Stack>
          
          <Collapse in={expandedSections.agreement}>
            <Box sx={{ p: 2, pt: 0 }}>
              <AgreementSubmission 
                campaign={campaign} 
                agreementSubmission={submissionsData?.grouped?.agreement}
                onUpdate={() => mutate(`${endpoints.submission.creator.v4.getMyCampaignOverview}?campaignId=${campaign.id}`)} 
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
          fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontWeight: 400,
          lineHeight: 1.5
        }}
      >
        Do ensure to read through the brief, and the do's and don't's for the creatives over at the{' '}
        <br />
        <Typography 
          component="span" 
          sx={{ 
            color: '#1340FF',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontFamily: 'inherit',
            '&:hover': {
              opacity: 0.8
            }
          }}
          onClick={() => {
            // Add navigation logic here if needed
          }}
        >
          Campaign Details
        </Typography>{' '}
        page.
      </Typography>

      {/* Collapsible Submission Cards */}
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
                border: 'none'
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
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
                onClick={() => handleToggleSection(video.id)}
              >
              <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography 
                    variant="h6" 
                    sx={{
                      fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 500,
                      color: 'black'
                    }}
                  >
                    {title}
                  </Typography>
                  
                  {/* Status Typography */}
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
                      color: statusInfo.color,
                      borderColor: statusInfo.color,
                      fontSize: '0.75rem',
           
                    }}
                  >
                    {status}
                  </Typography>
                  
                  {isNew && (
                    <Chip 
                      label="NEW" 
                      size="small" 
                      sx={{ 
                        bgcolor: 'error.main', 
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                      }} 
                    />
                  )}
                </Stack>
                <IconButton size="small">
                  <Iconify 
                    icon={isExpanded ? "eva:chevron-up-fill" : "eva:chevron-down-fill"} 
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
                    onUpdate={() => mutate()}
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
                border: 'none'
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
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
                onClick={() => handleToggleSection(photo.id)}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography 
                    variant="h6" 
                    sx={{
                      fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 500,
                      color: 'black'
                    }}
                  >
                    {title}
                  </Typography>
                  
                  {/* Status Typography */}
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
                      color: statusInfo.color,
                      borderColor: statusInfo.color,
                      fontSize: '0.75rem',
                    }}
                  >
                    {status}
                  </Typography>
                  
                  {isNew && (
                    <Chip 
                      label="NEW" 
                      size="small" 
                      sx={{ 
                        bgcolor: 'error.main', 
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                      }} 
                    />
                  )}
                  </Stack>
                <IconButton size="small">
                  <Iconify 
                    icon={isExpanded ? "eva:chevron-up-fill" : "eva:chevron-down-fill"} 
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
                    onUpdate={() => mutate()}
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
                border: 'none'
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
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
                onClick={() => handleToggleSection(rawFootage.id)}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography 
                    variant="h6" 
                  sx={{ 
                      fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 500,
                      color: 'black'
                    }}
                  >
                    {title}
                      </Typography>
                  
                  {/* Status Typography */}
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
                      color: statusInfo.color,
                      borderColor: statusInfo.color,
                      fontSize: '0.75rem',
                    }}
                  >
                    {status}
                      </Typography>
                  
                  {isNew && (
                    <Chip 
                      label="NEW" 
                      size="small" 
                      sx={{ 
                        bgcolor: 'error.main', 
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                      }} 
                    />
                  )}
                  </Stack>
                <IconButton size="small">
                  <Iconify 
                    icon={isExpanded ? "eva:chevron-up-fill" : "eva:chevron-down-fill"} 
                  />
                </IconButton>
              </Box>

              {/* Collapsible Content */}
              <Collapse in={isExpanded}>
                <Divider />
                <Box sx={{ p: 3 }}>
                <V4RawFootageSubmission 
                    submission={rawFootage}
                  onUpdate={() => mutate()}
                />
                </Box>
              </Collapse>
            </Card>
          );
        })}
              </Stack>
    </Box>
  );
};

CampaignV4Activity.propTypes = {
  campaign: PropTypes.object.isRequired,
};

export default CampaignV4Activity;