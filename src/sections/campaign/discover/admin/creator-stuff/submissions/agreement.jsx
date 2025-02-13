import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState } from 'react';
import { Page, pdfjs, Document } from 'react-pdf';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Grid,
  Stack,
  Paper,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';
import EmptyContent from 'src/components/empty-content/empty-content';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const Agreement = ({ campaign, submission, creator }) => {
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  const [numPages, setNumPages] = useState(null);
  const loading = useBoolean();
  const [pdfError, setPdfError] = useState(false);
  const { user } = useAuthContext();

  const onDocumentLoadSuccess = ({ numPages: num }) => {
    setNumPages(num);
    setPdfError(false);
  };

  const onDocumentLoadError = () => {
    setPdfError(true);
  };

  const handlePdfRefresh = () => {
    setPdfError(false);
    setNumPages(null);
  };

  const modal = useBoolean();
  const methods = useForm({
    defaultValues: {
      feedback: '',
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleClick = async () => {
    try {
      loading.onTrue();
      const res = await axiosInstance.patch(endpoints.submission.admin.agreement, {
        campaignId: campaign?.id,
        status: 'approve',
        userId: creator?.user?.id,
        submissionId: submission?.id,
        submission,
      });
      mutate(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
      );
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Failed', {
        variant: 'error',
      });
    } finally {
      loading.onFalse();
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.submission.admin.agreement, {
        campaignId: campaign?.id,
        status: 'reject',
        userId: creator?.user?.id,
        campaignTaskId: submission?.campaignTask?.id,
        submissionId: submission?.id,
        feedback: data.feedback,
        submission,
      });
      mutate(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
      );
      modal.onFalse();
      reset();
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      console.log(error);
      enqueueSnackbar('Failed', {
        variant: 'error',
      });
    }
  });

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  const renderFeedbackForm = (
    <Dialog open={modal.value} onClose={modal.onFalse} maxWidth="xs" fullWidth>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Feedback</DialogTitle>
        <DialogContent>
          <Box pt={2}>
            <RHFTextField
              name="feedback"
              label="Feedback"
              placeholder="Reason to reject"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              reset();
              modal.onFalse();
            }}
            size="small"
            variant="outlined"
          >
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            size="small"
            variant="contained"
            loading={isSubmitting}
            disabled={isDisabled}
            sx={{
              '&:disabled': {
                display: 'none',
              },
            }}
          >
            Submit
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          {submission?.status === 'IN_PROGRESS' && <EmptyContent title="No submission" />}
          {(submission?.status === 'PENDING_REVIEW' || submission?.status === 'APPROVED') && (
            <Box component={Paper} p={1.5}>
              <>
                <Stack direction="row" spacing={3} sx={{ mb: 3, mt: -2 }}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={0.5}>
                      <Typography
                        variant="caption"
                        sx={{ color: '#8e8e93', fontSize: '0.875rem', fontWeight: 550 }}
                      >
                        Date Submitted:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: '#221f20', fontSize: '0.875rem', fontWeight: 500 }}
                      >
                        {submission?.submissionDate
                          ? dayjs(submission?.submissionDate).format('ddd, D MMM YYYY')
                          : '-'}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.5}>
                      <Typography
                        variant="caption"
                        sx={{ color: '#8e8e93', fontSize: '0.875rem', fontWeight: 550 }}
                      >
                        Reviewed On:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: '#221f20', fontSize: '0.875rem', fontWeight: 500 }}
                      >
                        {submission?.isReview
                          ? dayjs(submission?.updatedAt).format('ddd, D MMM YYYY')
                          : '-'}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>

                <Box
                  sx={{
                    width: '100%',
                    height: '600px',
                    mt: 1,
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
                  {pdfError ? (
                    <Stack
                      spacing={2}
                      alignItems="center"
                      justifyContent="center"
                      sx={{ height: '100%' }}
                    >
                      <Typography color="error">Failed to load PDF</Typography>
                      <Button
                        startIcon={<Iconify icon="mdi:refresh" />}
                        onClick={handlePdfRefresh}
                        variant="contained"
                      >
                        Refresh PDF
                      </Button>
                    </Stack>
                  ) : (
                    <Document
                      file={submission.content}
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
                            scale={isSmallScreen ? 0.7 : 1}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                          />
                        </Box>
                      ))}
                    </Document>
                  )}
                </Box>

                {submission.status === 'PENDING_REVIEW' && (
                  <Stack direction="row" gap={1.5} justifyContent="end" mt={2}>
                    <Button
                      onClick={modal.onTrue}
                      disabled={isDisabled}
                      size="small"
                      variant="contained"
                      startIcon={<Iconify icon="solar:close-circle-bold" />}
                      sx={{
                        bgcolor: 'white',
                        border: 1,
                        borderRadius: 0.8,
                        borderColor: '#e7e7e7',
                        borderBottom: 3,
                        borderBottomColor: '#e7e7e7',
                        color: 'error.main',
                        '&:hover': {
                          bgcolor: 'error.lighter',
                          borderColor: '#e7e7e7',
                        },
                        '&:disabled': {
                          display: 'none',
                        },
                        textTransform: 'none',
                        px: 2.5,
                        py: 1.2,
                        fontSize: '0.875rem',
                        minWidth: '80px',
                        height: '45px',
                      }}
                    >
                      Reject
                    </Button>
                    <LoadingButton
                      size="small"
                      onClick={() => handleClick()}
                      disabled={isDisabled}
                      variant="contained"
                      startIcon={<Iconify icon="solar:check-circle-bold" />}
                      loading={loading.value}
                      sx={{
                        bgcolor: '#2e6c56',
                        color: 'white',
                        borderBottom: 3,
                        borderBottomColor: '#1a3b2f',
                        borderRadius: 0.8,
                        px: 2.5,
                        py: 1.2,
                        '&:hover': {
                          bgcolor: '#2e6c56',
                          opacity: 0.9,
                        },
                        '&:disabled': {
                          display: 'none',
                        },
                        fontSize: '0.875rem',
                        minWidth: '80px',
                        height: '45px',
                      }}
                    >
                      Approve
                    </LoadingButton>
                  </Stack>
                )}
                {renderFeedbackForm}
              </>
            </Box>
          )}
          {submission?.status === 'CHANGES_REQUIRED' && (
            <EmptyContent title="Waiting for another submission" />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Agreement;

Agreement.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  creator: PropTypes.object,
};
