import React, { useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { useForm, useFieldArray } from 'react-hook-form';

import {
  Stack,
  Dialog,
  Button,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import useGetAllTimelineType from 'src/hooks/use-get-all-timeline';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

// eslint-disable-next-line react/prop-types
const TimelineTypeModal = ({ open, handleClose }) => {
  const { data, isLoading } = useGetAllTimelineType();
  const methods = useForm({
    defaultValues: {
      timelineType: [{ name: '' }],
    },
  });

  const { control, handleSubmit, reset } = methods;

  const { fields, append } = useFieldArray({
    name: 'timelineType',
    control,
  });

  useEffect(() => {
    if (!isLoading && data.length) {
      reset({ timelineType: data });
    }
  }, [data, reset, isLoading]);

  const onSubmit = handleSubmit(async (timeline) => {
    try {
      const res = await axiosInstance.post(endpoints.campaign.timeline.createNewTimeline, timeline);
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      handleClose();
    }
  });

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Campaign Timeline Type</DialogTitle>
        <DialogContent>
          <Stack p={2} gap={2}>
            {isLoading ? (
              <Typography>Loading...</Typography>
            ) : (
              fields.map((item, index) => (
                <Stack key={item.id} direction="row" spacing={1} alignItems="center">
                  <RHFTextField
                    name={`timelineType[${index}].name`}
                    label="Campaign Type"
                    placeholder="Eg: Open For Pitch"
                  />
                  <IconButton color="error">
                    <Iconify icon="mdi:trash-outline" />
                  </IconButton>
                </Stack>
              ))
            )}
            <Button onClick={() => append({ name: '' })}>New Campaign Type</Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button type="submit" color="success">
            Save
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default TimelineTypeModal;
