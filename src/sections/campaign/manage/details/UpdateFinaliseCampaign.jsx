import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import { Box, Chip, Stack, Avatar, MenuItem, FormLabel } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelectV2, RHFMultiSelect, RHFAutocomplete } from 'src/components/hook-form';

import { useGetAdmins } from '../../create/hooks/get-am';

// Campaign type options (matching activate-campaign-dialog.jsx)
const campaignTypeOptions = [
  { value: 'normal', label: 'UGC (With Posting)' },
  { value: 'ugc', label: 'UGC (No Posting)' },
];

// Deliverable options (matching activate-campaign-dialog.jsx)
const deliverableOptions = [
  { value: 'UGC_VIDEOS', label: 'UGC Videos' },
  { value: 'PHOTOS', label: 'Photos' },
  { value: 'RAW_FOOTAGES', label: 'Raw Footage' },
];

// Form field component with consistent styling
const FormField = ({ label, children, required = true }) => (
  <Stack spacing={0.5}>
    <FormLabel
      required={required}
      sx={{
        fontWeight: 700,
        color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
        fontSize: '0.875rem',
        mb: 0.5,
        '& .MuiFormLabel-asterisk': {
          color: '#FF3500',
        },
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
  required: PropTypes.bool,
};

// Validation schema
const UpdateFinaliseCampaignSchema = Yup.object().shape({
  campaignManager: Yup.array().min(1, 'At least one campaign manager is required'),
  campaignType: Yup.string().required('Campaign type is required'),
  deliverables: Yup.array().min(1, 'At least one deliverable is required'),
});

const UpdateFinaliseCampaign = ({ campaign, campaignMutate }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const { data: admins } = useGetAdmins('active');

  // Filter for CSM campaign managers
  const filteredCampaignManagers = useMemo(
    () =>
      admins?.filter((item) => item.role === 'CSM').sort((a, b) => a.name.localeCompare(b.name)) ||
      [],
    [admins]
  );

  // Get existing campaign managers from campaignAdmin
  const existingManagers = useMemo(() => {
    if (!campaign?.campaignAdmin) return [];
    return campaign.campaignAdmin
      .filter((ca) => ca.admin?.role?.name === 'CSM')
      .map((ca) => ({
        id: ca.admin?.userId,
        name: ca.admin?.user?.name || ca.admin?.name,
        photoURL: ca.admin?.user?.photoURL,
      }));
  }, [campaign]);

  // Extract deliverables from campaign boolean flags (same as createCampaign/activateClientCampaign)
  // UGC_VIDEOS is the default/base deliverable
  const existingDeliverables = useMemo(() => {
    const delivs = ['UGC_VIDEOS']; // UGC_VIDEOS is always included as the base
    if (campaign?.rawFootage) delivs.push('RAW_FOOTAGES');
    if (campaign?.photos) delivs.push('PHOTOS');
    if (campaign?.ads) delivs.push('ADS');
    if (campaign?.crossPosting) delivs.push('CROSS_POSTING');
    return delivs;
  }, [campaign]);

  const defaultValues = useMemo(
    () => ({
      campaignManager: existingManagers,
      campaignType: campaign?.campaignType || 'normal',
      deliverables: existingDeliverables,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaign?.id, campaign?.submissionVersion, campaign?.campaignType, JSON.stringify(existingManagers), JSON.stringify(existingDeliverables)]
  );

  const methods = useForm({
    resolver: yupResolver(UpdateFinaliseCampaignSchema),
    defaultValues,
    mode: 'onChange',
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = methods;

  // Reset form only when the campaign ID changes (new campaign loaded)
  useEffect(() => {
    if (campaign?.id) {
      reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.id]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await axiosInstance.patch(endpoints.campaign.editCampaignFinalise, {
        campaignId: campaign?.id,
        campaignManagers: data.campaignManager,
        campaignType: data.campaignType,
        deliverables: data.deliverables,
      });

      enqueueSnackbar('Campaign finalise settings updated successfully');
      campaignMutate();
    } catch (error) {
      console.error('Error updating campaign finalise settings:', error);
      enqueueSnackbar(error?.message || 'Failed to update campaign', { variant: 'error' });
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          maxWidth: 800,
        }}
      >
        <Stack direction="row" spacing={2}>
          {/* Left column */}
          <Stack flex={1} spacing={2}>
            <FormField label="Campaign Managers">
              <RHFAutocomplete
                name="campaignManager"
                multiple
                placeholder="Campaign Manager"
                options={filteredCampaignManagers}
                freeSolo
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => option.name || ''}
                renderTags={(selected, getTagProps) =>
                  selected.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      avatar={<Avatar src={option?.photoURL}>{option?.name?.slice(0, 1)}</Avatar>}
                      key={option?.id}
                      label={option?.id === user?.id ? 'Me' : option?.name}
                      size="small"
                      variant="outlined"
                      sx={{
                        border: 1,
                        borderColor: '#EBEBEB',
                        boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                        py: 2,
                        px: 1,
                      }}
                    />
                  ))
                }
              />
            </FormField>

            <FormField label="Campaign Type">
              <RHFSelectV2 name="campaignType" placeholder="Select campaign type">
                {campaignTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </RHFSelectV2>
            </FormField>
          </Stack>

          {/* Right column */}
          <Stack flex={1} spacing={2}>
            <FormField label="Deliverables">
              <RHFMultiSelect
                name="deliverables"
                placeholder="Select deliverable(s)"
                chip
                checkbox
                options={deliverableOptions}
              />
            </FormField>
          </Stack>
        </Stack>

        {/* Submit Button */}
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
            Save Finalise
          </LoadingButton>
        </Stack>
      </Box>
    </FormProvider>
  );
};

UpdateFinaliseCampaign.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
};

export default UpdateFinaliseCampaign;
