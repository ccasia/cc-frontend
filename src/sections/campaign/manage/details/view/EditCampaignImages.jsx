import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  Box,
  Typography,
} from '@mui/material';
import Carousel from 'src/components/carousel/carousel';
import { RHFUpload } from 'src/components/hook-form';
import { useForm } from 'react-hook-form';
import FormProvider from 'src/components/hook-form/form-provider';
import axiosInstance, { endpoints } from 'src/utils/axios';
import { enqueueSnackbar } from 'notistack';
import { LoadingButton } from '@mui/lab';
import { useBoolean } from 'src/hooks/use-boolean';
import { mutate } from 'swr';

const EditCampaignImages = ({ open, campaign, onClose }) => {
  const campaignImages = useMemo(() => campaign?.campaignBrief?.images, [campaign]);

  const methods = useForm({
    defaultValues: {
      campaignImages: campaignImages || [],
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
      const files = values.campaignImages || [];
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue('campaignImages', [...files, ...newFiles]);
    },
    [setValue, values.campaignImages]
  );

  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();

    for (const i in data.campaignImages) {
      formData.append('campaignImages', data.campaignImages[i]);
    }

    formData.append('campaignId', campaign?.id);

    try {
      const res = await axiosInstance.patch(
        endpoints.campaign.editCampaignImages(campaign?.id),
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
    <Dialog open={open.campaignImages}>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Edit Campaign Images</DialogTitle>
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
            <Typography variant="h4">Upload Campaign Images</Typography>
            <RHFUpload
              multiple
              thumbnail
              name="campaignImages"
              maxSize={3145728}
              onDrop={handleDropMultiFile}
              onRemove={(inputFile) =>
                setValue(
                  'campaignImages',
                  values.campaignImages &&
                    values.campaignImages?.filter((file, index) => file !== inputFile),
                  { shouldValidate: true }
                )
              }
              onRemoveAll={() => setValue('campaignImages', [], { shouldValidate: true })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <LoadingButton size="small" onClick={() => onClose('campaignImages')} variant="outlined">
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

export default EditCampaignImages;

EditCampaignImages.propTypes = {
  open: PropTypes.object,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
