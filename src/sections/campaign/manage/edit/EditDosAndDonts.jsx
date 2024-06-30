import React from 'react';
import PropTypes from 'prop-types';
import { useForm, useFieldArray } from 'react-hook-form';

import {
  Box,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';

import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

export const EditDosAndDonts = ({ open, campaign, onClose }) => {
  const methods = useForm({
    defaultValues: {
      campaignDo: campaign?.campaignBrief?.campaigns_do,
      campaignDont: campaign?.campaignBrief?.campaigns_dont,
    },
  });

  const { control } = methods;

  // TODO TEMP: Use a simpler placeholder for now, see below
  const {
    append: doAppend,
    fields: doFields,
    // remove: doRemove,
  } = useFieldArray({
    control,
    name: 'campaignDo',
  });

  const {
    append: dontAppend,
    fields: dontFields,
    // remove: dontRemove,
  } = useFieldArray({
    control,
    name: 'campaignDont',
  });

  return (
    <Dialog
      open={open.dosAndDonts}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="md"
    >
      <DialogTitle id="alert-dialog-title">Dos and Don&apos;ts</DialogTitle>
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
              <Stack direction="column" spacing={2}>
                {/* TODO TEMP: Use a simpler placeholder for now */}
                {doFields.map((item, index) => (
                  <RHFTextField
                    name={`campaignDo[${index}].value`}
                    label={`Campaign Do's ${index + 1}`}
                  />
                ))}
                {/* <RHFTextField name="Placeholder name" label="Campaign Do 1" /> */}
                <Button variant="contained" onClick={() => doAppend({ value: '' })}>
                  Add Do
                </Button>
              </Stack>

              <Stack direction="column" spacing={2}>
                {dontFields.map((item, index) => (
                  <RHFTextField
                    name={`campaignDont[${index}].value`}
                    label={`Campaign Dont's ${index + 1}`}
                  />
                ))}
                <Button variant="contained" onClick={() => dontAppend({ value: '' })}>
                  Add Don&apos;t
                </Button>
              </Stack>
            </Box>
          </FormProvider>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose('dosAndDonts')}>Cancel</Button>
        <Button autoFocus color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

EditDosAndDonts.propTypes = {
  open: PropTypes.object,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
