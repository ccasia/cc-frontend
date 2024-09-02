import { mutate } from 'swr';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import { RHFUpload } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const CampaignAgreement = ({ campaign, timeline, submission, getDependency }) => {
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const display = useBoolean();

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

  return (
    <Box p={1.5}>
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
      )}
      {submission?.status === 'APPROVED' && (
        <Stack justifyContent="center" alignItems="center" spacing={2}>
          <Image src="/assets/approve.svg" sx={{ width: 250 }} />
          <Typography variant="subtitle2">Your agreement has been approved.</Typography>
          <Button onClick={display.onTrue}>Preview agreement</Button>
        </Stack>
      )}
      <Dialog open={display.value} onClose={display.onFalse} fullWidth maxWidth="md">
        <DialogTitle>Agreement</DialogTitle>
        <DialogContent>
          <iframe
            src={submission?.content}
            style={{
              width: '100%',
              height: 600,
              border: 0,
              borderRadius: 15,
            }}
            title="PDF Viewer"
          />
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
  timeline: PropTypes.object,
  submission: PropTypes.object,
  getDependency: PropTypes.func,
};
