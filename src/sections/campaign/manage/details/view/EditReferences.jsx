import { mutate } from 'swr';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { enqueueSnackbar } from 'notistack';
import { useForm, useFieldArray } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Dialog,
  Button,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const EditReferences = ({ open, campaign, onClose }) => {
  const campaignReferences = useMemo(() => campaign?.campaignBrief?.referencesLinks, [campaign]);

  const methods = useForm({
    defaultValues: {
      referencesLinks: campaignReferences?.map((link) => ({ value: link })) || [],
    },
    reValidateMode: 'onChange',
    mode: 'onChange',
  });

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'referencesLinks',
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(
        endpoints.campaign.editCampaignReference(campaign?.id),
        data
      );
      mutate(endpoints.campaign.getCampaignById(campaign.id));
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  });

  return (
    <Dialog open={open.campaignReferences} maxWidth="md" fullWidth>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Campaign References Links</DialogTitle>
        <DialogContent>
          <Box>
            {fields.map((field, index) => (
              <Stack direction="row" alignItems="center" spacing={1} my={2}>
                <RHFTextField
                  key={field.id}
                  name={`referencesLinks.${index}.value`}
                  placeholder={`Reference link ${index + 1}`}
                />
                {index !== 0 && (
                  <IconButton color="error" onClick={() => remove(index)}>
                    <Iconify icon="mdi:trash-outline" />
                  </IconButton>
                )}
              </Stack>
            ))}
            <Button onClick={() => append()} fullWidth sx={{ mt: 2 }} variant="outlined">
              Add more link
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <LoadingButton
            size="small"
            onClick={() => onClose('campaignReferences')}
            variant="outlined"
          >
            Close
          </LoadingButton>
          <LoadingButton
            size="small"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            // disabled={!isDirty}
          >
            Save
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default EditReferences;

EditReferences.propTypes = {
  open: PropTypes.object,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
