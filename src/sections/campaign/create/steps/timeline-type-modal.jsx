import React from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';

import { Dialog, DialogContent } from '@mui/material';

import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const TimelineTypeModal = ({ open, onClose }) => {
  const methods = useForm({
    defaultValues: {
      name: '',
    },
  });

  return (
    <Dialog open={open} onClose={onClose}>
      <FormProvider methods={methods}>
        <DialogContent>
          <RHFTextField name="name" />
        </DialogContent>
      </FormProvider>
    </Dialog>
  );
};

export default TimelineTypeModal;

TimelineTypeModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
