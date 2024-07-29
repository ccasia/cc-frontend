import { mutate } from 'swr';
import { m } from 'framer-motion';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

import {
  Stack,
  Dialog,
  Button,
  Tooltip,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
} from '@mui/material';

import useGetAllTimelineType from 'src/hooks/use-get-all-timeline';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

// eslint-disable-next-line react/prop-types
const TimelineTypeModal = ({ open, handleClose }) => {
  const [isDelete, setIsDelete] = useState({ index: null, value: false });
  const { data, isLoading } = useGetAllTimelineType();

  const methods = useForm({
    defaultValues: {
      timelineType: [{ customId: '', name: '' }],
    },
  });

  const { control, handleSubmit, reset } = methods;

  const { fields, append } = useFieldArray({
    name: 'timelineType',
    control,
  });

  useEffect(() => {
    if (!isLoading && data.length) {
      reset({ timelineType: data.map((item) => ({ customId: item.id, name: item.name })) });
    }
  }, [data, isLoading, reset]);

  const onSubmit = handleSubmit(async (timeline) => {
    try {
      const res = await axiosInstance.post(endpoints.campaign.timeline.createNewTimeline, timeline);
      enqueueSnackbar(res?.data?.message);
      mutate(endpoints.campaign.getTimelineType);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  });

  const onDelete = async (id) => {
    try {
      const res = await axiosInstance.delete(endpoints.campaign.timeline.delete(id));
      enqueueSnackbar(res?.data?.message);
      mutate(endpoints.campaign.getTimelineType);
    } catch (error) {
      enqueueSnackbar('Failed to delete', {
        variant: 'error',
      });
    }
  };

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
                <Stack key={item.customId} direction="row" spacing={1} alignItems="center">
                  <RHFTextField
                    name={`timelineType[${index}].name`}
                    label="Campaign Type"
                    placeholder="Eg: Open For Pitch"
                  />

                  {isDelete.index === index && isDelete.value ? (
                    <Stack
                      component={m.div}
                      initial={{ opacity: 0, scale: 0.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      direction="row"
                      gap={1}
                    >
                      <Tooltip title="Cancel">
                        <IconButton onClick={() => setIsDelete({ index: null, value: false })}>
                          <Iconify icon="mdi:cancel-bold" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Confirm">
                        <IconButton
                          color="success"
                          onClick={() => onDelete(fields[index].customId)}
                        >
                          <Iconify icon="hugeicons:tick-04" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ) : (
                    <>
                      {index < data.length ? (
                        <IconButton
                          color="error"
                          onClick={() => setIsDelete({ index, value: true })}
                        >
                          <Iconify icon="mdi:trash-outline" />
                        </IconButton>
                      ) : (
                        <Tooltip title="Create">
                          <IconButton color="success" type="submit">
                            <Iconify icon="mingcute:add-fill" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </>
                  )}
                </Stack>
              ))
            )}
            <Button onClick={() => append({ name: '' })}>New Campaign Type</Button>
          </Stack>
        </DialogContent>
        {/* <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button type="submit" color="success">
            Save
          </Button>
        </DialogActions> */}
      </FormProvider>
    </Dialog>
  );
};

export default TimelineTypeModal;
