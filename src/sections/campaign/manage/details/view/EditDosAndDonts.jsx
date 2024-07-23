import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
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

import axiosInstance, { endpoints } from 'src/utils/axios';

import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

export const EditDosAndDonts = ({ open, campaign, onClose }) => {
  const methods = useForm({
    defaultValues: {
      campaignDo: campaign?.campaignBrief?.campaigns_do,
      campaignDont: campaign?.campaignBrief?.campaigns_dont,
    },
  });

  const { control, handleSubmit } = methods;

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

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.campaign.editCampaignDosAndDonts, {
        ...data,
        id: campaign?.id,
      });
      enqueueSnackbar(res?.data.message);
    } catch (error) {
      enqueueSnackbar("Failed to update dos and don'ts", {
        variant: 'error',
      });
    }
  });

  const closeDialog = () => onClose('dosAndDonts');

  return (
    <Dialog
      open={open.dosAndDonts}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="md"
    >
      <FormProvider
        methods={methods}
        onSubmit={onSubmit}
      >
        <DialogTitle id="alert-dialog-title">
          Edit Dos and Don&apos;ts
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            id="alert-dialog-description"
            p={1.5}
          >
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                md: 'repeat(2, 1fr)',
              },
              gap: 2,
            }}>
              <Stack
                direction="column"
                spacing={2}
              >
                {doFields.map((item, index) => (
                  <RHFTextField
                    name={`campaignDo[${index}].value`}
                    label={`Campaign Do ${index + 1}`}
                  />
                ))}
                <Button
                  variant="contained"
                  onClick={() => doAppend({ value: '' })}
                >
                  Add Do
                </Button>
              </Stack>

              <Stack
                direction="column"
                spacing={2}
              >
                {dontFields.map((item, index) => (
                  <RHFTextField
                    name={`campaignDont[${index}].value`}
                    label={`Campaign Don't ${index + 1}`}
                  />
                ))}
                <Button
                  variant="contained"
                  onClick={() => dontAppend({ value: '' })}
                >
                  Add Don&apos;t
                </Button>
              </Stack>
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={closeDialog}
            autoFocus
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

EditDosAndDonts.propTypes = {
  open: PropTypes.object,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
