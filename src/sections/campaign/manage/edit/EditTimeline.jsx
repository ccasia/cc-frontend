import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  InputAdornment,
  DialogContentText,
} from '@mui/material';

import FormProvider from 'src/components/hook-form/form-provider';

export const EditTimeline = ({ open, campaign, onClose }) => {
  const methods = useForm();

  const { setValue } = methods;

  useEffect(() => {
    setValue('timeline.openForPitch', campaign?.customCampaignTimeline?.openForPitch);
    setValue('timeline.filterPitch', campaign?.customCampaignTimeline?.filterPitch);
    setValue('timeline.shortlistCreator', campaign?.customCampaignTimeline?.shortlistCreator);
    setValue('timeline.agreementSign', campaign?.customCampaignTimeline?.agreementSign);
    setValue('timeline.firstDraft', campaign?.customCampaignTimeline?.firstDraft);
    setValue('timeline.feedBackFirstDraft', campaign?.customCampaignTimeline?.feedBackFirstDraft);
    setValue('timeline.finalDraft', campaign?.customCampaignTimeline?.finalDraft);
    setValue('timeline.qc', campaign?.customCampaignTimeline?.qc);
    setValue('timeline.feedBackFinalDraft', campaign?.customCampaignTimeline?.feedBackFinalDraft);
    setValue('timeline.posting', campaign?.customCampaignTimeline?.posting);
  }, [setValue, campaign]);

  return (
    <Dialog
      open={open.timeline}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="md"
    >
      <DialogTitle id="alert-dialog-title">Timeline</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description" p={1.5}>
          <FormProvider methods={methods}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(1, 1fr)',
                  md: 'repeat(2, 1fr)',
                },
                gap: 2,
              }}
            >
              <Controller
                name="timeline.openForPitch"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Open For Pitches"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // TODO TEMP: Ignore `errors` for now
                    // error={errors.timeline?.openForPitch && errors.timeline.openForPitch}
                    // helperText={errors.timeline?.openForPitch && errors.timeline.openForPitch.message}
                  />
                )}
              />
              <Controller
                name="timeline.filterPitch"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Filtering of pitches by CC"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.filterPitch}
                    // helperText={errors?.timeline?.filterPitch && errors?.timeline?.filterPitch?.message}
                  />
                )}
              />

              <Controller
                name="timeline.shortlistCreator"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Shortlisting of creators by brand"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.shortlistCreator}
                    // helperText={
                    //   errors?.timeline?.shortlistCreator && errors?.timeline?.shortlistCreator?.message
                    // }
                  />
                )}
              />

              <Controller
                name="timeline.agreementSign"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Signing of agreement"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.agreementSign}
                    // helperText={errors?.timeline?.agreementSign && errors?.timeline?.agreementSign?.message}
                  />
                )}
              />

              <Controller
                name="timeline.firstDraft"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First draft from creators"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.firstDraft}
                    // helperText={errors?.timeline?.firstDraft && errors?.timeline?.firstDraft?.message}
                  />
                )}
              />

              <Controller
                name="timeline.feedBackFirstDraft"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Feedback on first draft by brand"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.feedBackFirstDraft}
                    // helperText={
                    //   errors?.timeline?.feedBackFirstDraft && errors?.timeline?.feedBackFirstDraft?.message
                    // }
                  />
                )}
              />

              <Controller
                name="timeline.finalDraft"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Final draft from creators"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.finalDraft}
                    // helperText={errors?.timeline?.finalDraft && errors?.timeline?.finalDraft?.message}
                  />
                )}
              />

              <Controller
                name="timeline.qc"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="QC of drafts by CC"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.qc}
                    // helperText={errors?.timeline?.qc && errors?.timeline?.qc?.message}
                  />
                )}
              />

              <Controller
                name="timeline.feedBackFinalDraft"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Feedback on final draft by brand"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.feedBackFinalDraft}
                    // helperText={
                    //   errors?.timeline?.feedBackFinalDraft && errors?.timeline?.feedBackFinalDraft?.message
                    // }
                  />
                )}
              />

              <Controller
                name="timeline.posting"
                // TODO TEMP: Ignore `control` for now, we don't know where it comes from
                // control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Posting in social media"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.posting}
                    // helperText={errors?.timeline?.posting && errors?.timeline?.posting?.message}
                  />
                )}
              />
            </Box>
          </FormProvider>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose('timeline')}>Cancel</Button>
        <Button autoFocus color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

EditTimeline.propTypes = {
  open: PropTypes.bool,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
