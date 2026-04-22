import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import { Box, Stack, FormLabel } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import FormProvider from 'src/components/hook-form/form-provider';
import { RHFUpload } from 'src/components/hook-form/rhf-upload';

const FormField = ({ label, children }) => (
  <Stack spacing={0.5} mb={2}>
    <FormLabel
      sx={{
        fontWeight: 700,
        color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
        fontSize: '0.875rem',
        mb: 0.5,
      }}
    >
      {label}
    </FormLabel>
    {children}
  </Stack>
);

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const UpdateBrandGuidelinesSchema = Yup.object().shape({
  brandGuidelines: Yup.mixed().nullable(),
});

const UpdateBrandGuidelines = ({ campaign, campaignMutate, onDirtyChange }) => {
  const additionalDetails = campaign?.campaignAdditionalDetails;

  const defaultValues = useMemo(
    () => ({
      brandGuidelines: additionalDetails?.brandGuidelinesUrl
        ? additionalDetails.brandGuidelinesUrl.split(',').map((url) => url.trim()).filter(Boolean)
        : [],
    }),
    [additionalDetails]
  );

  const methods = useForm({
    resolver: yupResolver(UpdateBrandGuidelinesSchema),
    defaultValues,
    mode: 'onChange',
  });

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting, isDirty },
  } = methods;

  useEffect(() => {
    if (campaign) reset(defaultValues);
  }, [campaign, defaultValues, reset]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const onSubmit = useCallback(
    async (data) => {
      try {
        const formData = new FormData();
        formData.append('campaignId', campaign?.id);

        const files = Array.isArray(data.brandGuidelines) ? data.brandGuidelines : [];
        const newFiles = files.filter((f) => f instanceof File);
        const existingUrls = files.filter((f) => typeof f === 'string');

        if (newFiles.length > 0 || existingUrls.length > 0) {
          newFiles.forEach((file) => formData.append('brandGuidelines', file));
          formData.append('existingBrandGuidelinesUrls', existingUrls.join(','));
        } else {
          formData.append('existingBrandGuidelinesUrls', '');
          formData.append('clearBrandGuidelines', 'true');
        }

        await axiosInstance.patch(endpoints.campaign.editCampaignAdditionalDetails, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        enqueueSnackbar('Brand guidelines updated successfully!', { variant: 'success' });
        if (campaignMutate) campaignMutate();
      } catch (error) {
        enqueueSnackbar(
          error?.response?.data?.message || error?.message || 'Failed to update brand guidelines',
          { variant: 'error' }
        );
      }
    },
    [campaign?.id, campaignMutate]
  );

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ maxWidth: '816px' }}>
        <FormField label="Brand Guidelines Document">
          <RHFUpload
            name="brandGuidelines"
            maxSize={20971520}
            accept={{
              'application/pdf': ['.pdf'],
              'image/jpeg': ['.jpeg', '.jpg'],
              'image/png': ['.png'],
            }}
            multiple
            onDrop={(acceptedFiles) => {
              const files = watch('brandGuidelines') || [];
              const newFiles = acceptedFiles.map((file) =>
                Object.assign(file, { preview: URL.createObjectURL(file) })
              );
              setValue('brandGuidelines', [...files, ...newFiles], {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            onRemove={(inputFile) => {
              const files = watch('brandGuidelines') || [];
              setValue(
                'brandGuidelines',
                files.filter((file) => file !== inputFile),
                { shouldValidate: true, shouldDirty: true }
              );
            }}
            onRemoveAll={() =>
              setValue('brandGuidelines', [], { shouldValidate: true, shouldDirty: true })
            }
            height={175}
          />
        </FormField>

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={!isDirty}
            size="large"
            sx={{
              bgcolor: '#1340ff',
              boxShadow: '0px -3px 0px 0px rgba(0,0,0,0.45) inset',
              '&:hover': { bgcolor: '#1340ff' },
              '&:disabled': {
                bgcolor: 'rgba(19, 64, 255, 0.3)',
                color: '#fff',
                boxShadow: '0px -3px 0px 0px inset rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            Save Brand Guidelines
          </LoadingButton>
        </Stack>
      </Box>
    </FormProvider>
  );
};

UpdateBrandGuidelines.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
  onDirtyChange: PropTypes.func,
};

export default UpdateBrandGuidelines;
