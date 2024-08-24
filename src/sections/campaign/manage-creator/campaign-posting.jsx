import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  List,
  Stack,
  Dialog,
  Button,
  ListItem,
  Typography,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Image from 'src/components/image';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const guideSteps = [
  'Log in to Instagram.',
  'Create a new post by tapping the "+" icon.',
  'Upload or capture your content and edit it as needed.',
  'Add a caption, hashtags, tags, or location.',
  'Tap "Share" to publish the post.',
  'Navigate to your profile and find the post.',
  'Open the post, tap the three dots (⋯), and select "Copy Link".',
  'Paste the copied link into the designated text field in your application.',
  'Submit the link to complete the process.',
];

const CampaignPosting = ({ campaign, timeline, submission, getDependency, fullSubmission }) => {
  const dependency = getDependency(submission?.id);
  const dialog = useBoolean();

  const previewSubmission = useMemo(() => {
    const finalDraftSubmission = fullSubmission?.find(
      (item) => item?.id === dependency?.dependentSubmissionId
    );
    const firstDraftSubmission = fullSubmission?.find(
      (item) => item?.id === finalDraftSubmission?.dependentOn[0]?.dependentSubmissionId
    );

    if (firstDraftSubmission?.status === 'APPROVED') {
      return firstDraftSubmission;
    }
    return finalDraftSubmission;
  }, [fullSubmission, dependency]);

  const methods = useForm({
    defaultValues: {
      postingLink: '',
    },
  });

  const { handleSubmit } = methods;

  const renderGuide = (
    <Dialog open={dialog.value} onClose={dialog.onFalse}>
      <DialogTitle>
        <Typography variant="h5" gutterBottom>
          Steps to Post on Instagram and Copy Link
        </Typography>
      </DialogTitle>
      <DialogContent>
        <List>
          {guideSteps.map((step, index) => (
            <ListItem key={index}>
              <ListItemText primary={`Step ${index + 1}: ${step}`} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={dialog.onFalse}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.post(endpoints.submission.creator.postSubmission, {
        ...data,
        submissionId: submission?.id,
      });
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Error submitting post link', {
        variant: 'error',
      });
    }
  });

  return (
    <>
      {previewSubmission?.status === 'APPROVED' && (
        <Box>
          {submission?.status === 'PENDING_REVIEW' && (
            <Stack justifyContent="center" alignItems="center" spacing={2}>
              <Image src="/assets/pending.svg" sx={{ width: 250 }} />
              <Typography variant="subtitle2">Your Submission is in review.</Typography>
              {/* <Button onClick={display.onTrue}>Preview Draft</Button> */}
            </Stack>
          )}
          {submission?.status === 'IN_PROGRESS' && (
            <Stack spacing={1}>
              <Box>
                <Button size="small" variant="outlined" onClick={dialog.onTrue}>
                  Show guide
                </Button>
              </Box>
              <Box>
                <FormProvider methods={methods} onSubmit={onSubmit}>
                  <Stack spacing={1} alignItems="flex-end">
                    <RHFTextField
                      name="postingLink"
                      label="Posting Link"
                      placeholder="Paste you posting link"
                    />
                    <Button variant="contained" size="small" type="submit">
                      Submit
                    </Button>
                  </Stack>
                </FormProvider>
              </Box>
            </Stack>
          )}
          {submission?.status === 'APPROVED' && (
            <Stack justifyContent="center" alignItems="center" spacing={2}>
              <Image src="/assets/approve.svg" sx={{ width: 250 }} />
              <Typography variant="subtitle2">Your Posting has been approved.</Typography>
            </Stack>
          )}
        </Box>
      )}
      {renderGuide}
    </>
  );
};

export default CampaignPosting;

CampaignPosting.propTypes = {
  campaign: PropTypes.object,
  timeline: PropTypes.object,
  submission: PropTypes.object,
  getDependency: PropTypes.func,
  fullSubmission: PropTypes.array,
};
