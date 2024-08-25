import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Box, Dialog, Button, DialogTitle, DialogContent, DialogActions } from '@mui/material';

import { MAP_TIMELINE } from 'src/utils/map-timeline';

import { RHFDatePicker } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const TimelineModal = ({ dialog, selected }) => {
  const methods = useForm({
    defaultValues: {
      dueDate: '',
    },
  });

  const { setValue } = methods;

  useEffect(() => {
    setValue('dueDate', dayjs(selected?.item?.dueDate));
  }, [setValue, selected]);

  return (
    <Dialog open={dialog.value} onClose={dialog.onFalse}>
      <FormProvider methods={methods}>
        <DialogTitle>
          Extend due date for {MAP_TIMELINE[selected?.item?.submissionType?.type]}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 1 }}>
            <RHFDatePicker
              name="dueDate"
              label="Pick new due date"
              minDate={dayjs(selected?.campaign?.campaignBrief?.startDate)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={dialog.onFalse} variant="outlined">
            Cancel
          </Button>
          <Button size="small" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default TimelineModal;

TimelineModal.propTypes = {
  dialog: PropTypes.object,
  selected: PropTypes.object,
};
