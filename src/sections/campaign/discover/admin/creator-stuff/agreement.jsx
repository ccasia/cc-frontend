import React from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const Agreement = ({ campaign, submission, user }) => {
  const modal = useBoolean();
  const methods = useForm({
    defaultValues: {
      feedback: '',
    },
  });
  const campaignTasks = user?.user?.campaignTasks.filter(
    (task) => task?.campaignId === campaign.id
  );

  const { reset, handleSubmit } = methods;

  const handleClick = async () => {
    try {
      const res = await axiosInstance.patch(
        endpoints.submission.agreement.adminManageAgreementSubmission,
        {
          campaignId: campaign?.id,
          status: 'approve',
          userId: user?.user?.id,
          campaignTaskId: submission?.campaignTask?.id,
          firstDraftId: campaignTasks.filter((value) => value.task === 'First Draft')[0]?.id,
          submissionId: submission?.id,
        }
      );
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Failed', {
        variant: 'error',
      });
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(
        endpoints.submission.agreement.adminManageAgreementSubmission,
        {
          campaignId: campaign?.id,
          status: 'reject',
          userId: user?.user?.id,
          campaignTaskId: submission?.campaignTask?.id,
          firstDraftId: campaignTasks.filter((value) => value.task === 'First Draft')[0]?.id,
          submissionId: submission?.id,
          feedback: data.feedback,
        }
      );
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Failed', {
        variant: 'error',
      });
    }
  });

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
          <Button type="submit" size="small" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );

  return (
    <Box>
      <iframe
        src={submission?.content}
        style={{
          borderRadius: 10,
          width: '100%',
          height: 900,
        }}
        title="AgreementForm"
      />
      {submission?.campaignTask?.status !== 'COMPLETED' && (
        <Stack direction="row" gap={1.5} justifyContent="end" mt={2}>
          <Button
            onClick={modal.onTrue}
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="mingcute:close-fill" />}
          >
            Reject
          </Button>
          <Button
            size="small"
            onClick={() => handleClick()}
            variant="contained"
            color="success"
            startIcon={<Iconify icon="hugeicons:tick-03" />}
          >
            Approve
          </Button>
        </Stack>
      )}
      {renderFeedbackForm}
    </Box>
  );
};

export default Agreement;

Agreement.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  user: PropTypes.object,
};
