import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { Page, pdfjs, Document } from 'react-pdf';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Alert,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
  useMediaQuery,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import { RHFUpload } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';
import EmptyContent from 'src/components/empty-content/empty-content';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const CampaignAgreement = ({ campaign, timeline, submission, agreementStatus }) => {
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const display = useBoolean();

  const isSmallScreen = useMediaQuery('(max-width: 600px)');

  const [numPages, setNumPages] = useState(null);

  // eslint-disable-next-line no-shadow
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const agreement = campaign?.campaignTimeline.find((elem) => elem.name === 'Agreement');

  const methods = useForm({
    defaultValues: {
      agreementForm: null,
    },
  });

  const { watch, setValue, handleSubmit, reset } = methods;

  const agreementForm = watch('agreementForm');

  const onDrop = (e) => {
    setValue('agreementForm', e[0]);
    const url = URL.createObjectURL(e[0]);
    setPreview(url);
  };

  const onSubmit = handleSubmit(async (data) => {
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
      enqueueSnackbar(res?.data?.message);
      mutate(endpoints.kanban.root);
      mutate(`${endpoints.submission.root}?creatorId=${user?.id}&campaignId=${campaign?.id}`);
      mutate(endpoints.campaign.creator.getCampaign(campaign.id));
      reset();
      setPreview('');
    } catch (error) {
      enqueueSnackbar('Submission of agreement failed', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  });

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      // const contentType = response.headers.get('content-type');
      const blob = await response.blob();
      const filename = `${campaign?.id}-${campaign?.name}.pdf?v=${dayjs().toISOString()}.pdf`;

      // For browsers that support the download attribute
      if ('download' in document.createElement('a')) {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
      }
      // For IE10+
      else if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, filename);
      }
      // Fallback - open in new window
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
    <Box p={1.5}>
      {!agreementStatus ? (
        <EmptyContent title="Agreement Processing" />
      ) : (
        <>
          {submission?.status === 'PENDING_REVIEW' && (
            <Stack justifyContent="center" alignItems="center" spacing={2}>
              <Image src="/assets/pending.svg" sx={{ width: 250 }} />
              <Typography variant="subtitle2">Your agreement is in review.</Typography>
            </Stack>
          )}

          {submission?.status === 'IN_PROGRESS' && (
            <Stack gap={2}>
              <ListItemText
                primary="1. Please download and review the Agreement Form."
                secondary={
                  <Button
                    variant="contained"
                    startIcon={<Iconify icon="material-symbols:download" width={20} />}
                    onClick={() => handleDownload(campaign?.agreement?.agreementUrl)}
                    size="small"
                  >
                    Download Agreement
                  </Button>
                }
                primaryTypographyProps={{
                  variant: 'subtitle2',
                  mb: 1.2,
                }}
              />

              <ListItemText
                primary="2. Please sign and upload the document here."
                secondary={
                  <FormProvider methods={methods} onSubmit={onSubmit}>
                    {preview ? (
                      <iframe
                        src={preview}
                        style={{
                          width: '100%',
                          height: 400,
                          border: 0,
                          borderRadius: 15,
                        }}
                        title="PDF Viewer"
                      />
                    ) : (
                      <RHFUpload type="pdf" name="agreementForm" onDrop={onDrop} />
                    )}

                    <Box
                      mt={2}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={2}
                    >
                      {agreementForm && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => {
                            setValue('agreementForm', null);
                            setPreview('');
                          }}
                        >
                          Remove
                        </Button>
                      )}
                      <LoadingButton
                        loading={loading}
                        variant="contained"
                        size="small"
                        disabled={!agreementForm}
                        sx={{ flexGrow: 1 }}
                        type="submit"
                      >
                        Submit
                      </LoadingButton>
                    </Box>
                  </FormProvider>
                }
                primaryTypographyProps={{
                  variant: 'subtitle2',
                  mb: 1.2,
                }}
              />
            </Stack>
          )}

          {submission?.status === 'APPROVED' && (
            <Stack justifyContent="center" alignItems="center" spacing={2}>
              <Image src="/assets/approve.svg" sx={{ width: 250 }} />
              <Typography variant="subtitle2">Your agreement has been approved.</Typography>
              <Button onClick={display.onTrue} variant="outlined" size="small">
                Preview agreement
              </Button>
            </Stack>
          )}

          {submission?.status === 'CHANGES_REQUIRED' && (
            <Box>
              <Alert severity="warning">
                <Typography variant="subtitle1">Feedback</Typography>
                <Typography variant="subtitle2">{submission?.feedback?.content}</Typography>
              </Alert>
              <Stack gap={2} mt={2}>
                <ListItemText
                  primary="1. Please download and review the Agreement Form."
                  secondary={
                    <Button
                      variant="contained"
                      startIcon={<Iconify icon="material-symbols:download" width={20} />}
                      href={campaign?.agreement?.agreementUrl}
                      download="agreementForm.pdf"
                      target="__blank"
                      size="small"
                    >
                      Download Agreement
                    </Button>
                  }
                  primaryTypographyProps={{
                    variant: 'subtitle2',
                    mb: 1.2,
                  }}
                />

                <ListItemText
                  primary="2. Please sign and upload the document here."
                  secondary={
                    <FormProvider methods={methods} onSubmit={onSubmit}>
                      {preview ? (
                        <iframe
                          src={preview}
                          style={{
                            width: '100%',
                            height: 400,
                            border: 0,
                            borderRadius: 15,
                          }}
                          title="PDF Viewer"
                        />
                      ) : (
                        <RHFUpload type="pdf" name="agreementForm" onDrop={onDrop} />
                      )}

                      <Box
                        mt={2}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        gap={2}
                      >
                        {agreementForm && (
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={() => {
                              setValue('agreementForm', null);
                              setPreview('');
                            }}
                          >
                            Remove
                          </Button>
                        )}
                        <LoadingButton
                          loading={loading}
                          variant="contained"
                          size="small"
                          disabled={!agreementForm}
                          sx={{ flexGrow: 1 }}
                          type="submit"
                        >
                          Submit
                        </LoadingButton>
                      </Box>
                    </FormProvider>
                  }
                  primaryTypographyProps={{
                    variant: 'subtitle2',
                    mb: 1.2,
                  }}
                />
              </Stack>
            </Box>
          )}
        </>
      )}

      <Dialog open={display.value} onClose={display.onFalse} fullWidth maxWidth="md">
        <DialogTitle>Agreement</DialogTitle>
        <DialogContent>
          <Box sx={{ flexGrow: 1, mt: 1, borderRadius: 2, overflow: 'scroll' }}>
            <Document
              // file={submission?.content}
              file="https://storage.googleapis.com/app-test-cult-cretive/agreement/cm2t0viyu000v91g3u3r6avvy.pdf?v=2024-10-28T13:10:58+00:00"
              onLoadSuccess={onDocumentLoadSuccess}
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
          {/* <iframe
            src={submission?.content}
            style={{
              width: '100%',
              height: 600,
              border: 0,
              borderRadius: 15,
            }}
            title="PDF Viewer"
          /> */}
        </DialogContent>
        <DialogActions>
          <Button onClick={display.onFalse}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CampaignAgreement;

CampaignAgreement.propTypes = {
  campaign: PropTypes.object,
  timeline: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  submission: PropTypes.object,
  agreementStatus: PropTypes.bool,
};
