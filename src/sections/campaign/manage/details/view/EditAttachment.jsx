import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import { Box, Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { RHFUpload } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const EditAttachments = ({ open, campaign, onClose }) => {
  const campaignAttachments = useMemo(() => campaign?.campaignBrief?.otherAttachments, [campaign]);

  const methods = useForm({
    defaultValues: {
      otherAttachments: campaignAttachments || [],
    },
    reValidateMode: 'onChange',
    mode: 'onChange',
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, dirtyFields },
  } = methods;

  const values = watch();

  const handleDropMultiFile = useCallback(
    (acceptedFiles) => {
      const files = values.otherAttachments || [];
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue('otherAttachments', [...files, ...newFiles]);
    },
    [setValue, values.otherAttachments]
  );

  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();

    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (const i in data.otherAttachments) {
      formData.append('otherAttachments', data.otherAttachments[i]);
    }

    formData.append('campaignId', campaign?.id);

    try {
      const res = await axiosInstance.patch(
        endpoints.campaign.editCampaignAttachments(campaign?.id),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
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
    <Dialog open={open.campaignAttachments}>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Campaign Attachments</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignContent: 'center',
              gap: 3,
              p: 3,
            }}
          >
            <RHFUpload
              multiple
              type="otherAttachment"
              name="otherAttachments"
              onDrop={handleDropMultiFile}
              onRemove={(inputFile) =>
                setValue(
                  'otherAttachments',
                  values.otherAttachments &&
                    values.otherAttachments?.filter((file, index) => file !== inputFile),
                  { shouldValidate: true }
                )
              }
              onRemoveAll={() => setValue('otherAttachments', [], { shouldValidate: true })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <LoadingButton
            size="small"
            onClick={() => onClose('campaignAttachments')}
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

export default EditAttachments;

EditAttachments.propTypes = {
  open: PropTypes.object,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
