import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Chip,
  Stack,
  Avatar,
  Dialog,
  Button,
  Switch,
  MenuItem,
  FormLabel,
  Typography,
  DialogContent,
} from '@mui/material';

import useGetClients from 'src/hooks/use-get-clients';

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

  const companyId = campaign?.company?.id || campaign?.brand?.company?.id;

  // Fetch clients for this company using the new hook
  const { clients: campaignClients } = useGetClients(companyId);

  // Warning dialog state for v4 submission toggle
  const [v4WarningOpen, setV4WarningOpen] = useState(false);
  const [pendingV4Value, setPendingV4Value] = useState(null);

  // Get existing campaign managers from campaignAdmin (includes both CSM and Client users)
  const existingManagers = useMemo(() => {
    if (!campaign?.campaignAdmin) return [];
    return campaign.campaignAdmin
      .filter(
        (ca) =>
          ca.admin?.role?.name === 'CSM' ||
          ca.admin?.role?.name === 'Client' ||
          ca.admin?.user?.role === 'client'
      )
      .map((ca) => ({
        id: ca.admin?.userId,
        name: ca.admin?.user?.name || ca.admin?.name,
        photoURL: ca.admin?.user?.photoURL,
        role: ca.admin?.role?.name || ca.admin?.user.role,
      }));
  }, [campaign?.campaignAdmin]);

  // UGC_VIDEOS is the default/base deliverable
  const existingDeliverables = useMemo(() => {
    const delivs = ['UGC_VIDEOS']; // UGC_VIDEOS is always included as the base
    if (campaign?.rawFootage) delivs.push('RAW_FOOTAGES');
    if (campaign?.photos) delivs.push('PHOTOS');
    if (campaign?.ads) delivs.push('ADS');
    if (campaign?.crossPosting) delivs.push('CROSS_POSTING');
    return delivs;
  }, [campaign?.rawFootage, campaign?.photos, campaign?.ads, campaign?.crossPosting]);

  const defaultValues = useMemo(
    () => ({
      campaignManager: existingManagers,
      campaignType: campaign?.campaignType || 'normal',
      deliverables: existingDeliverables,
      isV4Submission: campaign?.submissionVersion === 'v4',
    }),
    [existingManagers, campaign?.submissionVersion, campaign?.campaignType, existingDeliverables]
  );

  const methods = useForm({
    resolver: yupResolver(UpdateFinaliseCampaignSchema),
    defaultValues,
    mode: 'onChange',
  });

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, isDirty },
  } = methods;

  const isV4Submission = watch('isV4Submission');
  const currentManagers = watch('campaignManager');

  // Handle v4 toggle change with warning dialog
  const handleV4ToggleChange = (event) => {
    const newValue = event.target.checked;
    // Show warning for both enabling and disabling
    setPendingV4Value(newValue);
    setV4WarningOpen(true);
  };

  const handleV4WarningConfirm = () => {
    const newValue = pendingV4Value;
    setValue('isV4Submission', newValue, { shouldDirty: true });

    if (newValue) {
      // Enabling v4: Add all client users to campaign managers
      const currentManagerIds = currentManagers?.map((m) => m.id) || [];
      const clientsToAdd = campaignClients.filter((c) => !currentManagerIds.includes(c.id));
      if (clientsToAdd.length > 0) {
        setValue('campaignManager', [...(currentManagers || []), ...clientsToAdd], {
          shouldDirty: true,
        });
      }
    } else {
      // Disabling v4: Remove all client users from campaign managers
      const nonClientManagers = (currentManagers || []).filter(
        (m) => m.role !== 'Client' && m.role !== 'client'
      );
      setValue('campaignManager', nonClientManagers, { shouldDirty: true });
    }

    setV4WarningOpen(false);
    setPendingV4Value(null);
  };

  const handleV4WarningCancel = () => {
    setV4WarningOpen(false);
    setPendingV4Value(null);
  };

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
        isV4Submission: data.isV4Submission,
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
        {/* Submission Version Toggle */}
        <Stack>
          <Stack direction="row" alignItems="center" mb={-0.8}>
            <Typography
              sx={{
                fontWeight: 700,
                color: '#231F20',
                opacity: 0.6,
                fontSize: '0.875rem',
                mr: -0.5
              }}
            >
              Enable this as a Client Campaign?
            </Typography>
            <Switch
              checked={isV4Submission || false}
              onChange={handleV4ToggleChange}
              color="primary"
              disabled
            />
          </Stack>
          <Typography variant="caption" fontWeight={400} color="text.secondary">
            {isV4Submission
              ? 'Client users will be added as campaign managers. Disabling will remove them.'
              : 'Enabling this option makes it a campaign that the previously selected client will manage.'}
          </Typography>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {/* Left column */}
          <Stack flex={1} spacing={2}>
            <FormField label="Campaign Managers">
              <RHFAutocomplete
                name="campaignManager"
                multiple
                placeholder="Campaign Manager"
                options={admins}
                freeSolo
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => option.name || ''}
                renderTags={(selected, getTagProps) =>
                  selected.map((option, index) => {
                    const isClient = option?.role === 'Client' || option?.role === 'client';
                    return (
                      <Chip
                        {...getTagProps({ index })}
                        avatar={<Avatar src={option?.photoURL}>{option?.name?.slice(0, 1)}</Avatar>}
                        key={option?.id}
                        label={
                          option?.id === user?.id
                            ? 'Me'
                            : `${option?.name}${isClient ? ' (Client)' : ''}`
                        }
                        size="small"
                        variant="outlined"
                        sx={{
                          border: 1,
                          borderColor: isClient ? '#1340FF' : '#EBEBEB',
                          boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                          py: 2,
                          px: 1,
                          ...(isClient && {
                            bgcolor: 'rgba(19, 64, 255, 0.08)',
                          }),
                        }}
                      />
                    );
                  })
                }
              />
            </FormField>
          </Stack>

          {/* Right column */}
          <Stack flex={1} spacing={2}>
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
        </Stack>

        <Stack>
          <FormField label="Additional Deliverables">
            <RHFMultiSelect
              name="deliverables"
              placeholder="Select deliverable(s)"
              chip
              checkbox
              options={deliverableOptions}
            />
          </FormField>
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

      {/* V4 Submission Warning Dialog */}
      <Dialog
        open={v4WarningOpen}
        onClose={handleV4WarningCancel}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Icon Circle */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: pendingV4Value ? '#1340FF' : '#2C2C2C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <Typography sx={{ fontSize: 40 }}>{pendingV4Value ? '🔄' : '⚠️'}</Typography>
          </Box>

          {/* Title */}
          <Typography
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontSize: 36,
              fontWeight: 400,
              mb: 1,
              lineHeight: 1.2,
            }}
          >
            {pendingV4Value ? 'Enable Client Campaign?' : 'Disable Client Campaign?'}
          </Typography>

          {/* Info Statement */}
          <Typography
            sx={{
              color: '#636366',
              fontSize: '0.875rem',
              mb: 3,
              mt: 1,
              lineHeight: 1.5,
            }}
          >
            This action will affect workflow if creators are already shortlisted with agreements
            sent out. Ensure you are doing this before any creators are shortlisted.
          </Typography>

          {/* Buttons */}
          <Stack spacing={1.5}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleV4WarningConfirm}
              sx={{
                bgcolor: pendingV4Value ? '#1340FF' : '#3A3A3C',
                borderBottom: pendingV4Value ? '3px solid #0d2db3' : '3px solid #00000073',
                color: '#fff',
                py: 1,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 1.5,
                textTransform: 'none',
                '&:hover': {
                  bgcolor: pendingV4Value ? '#0d2db3' : '#2C2C2C',
                },
              }}
            >
              Confirm
            </Button>
            <Button
              fullWidth
              onClick={handleV4WarningCancel}
              sx={{
                color: '#3A3A3C',
                border: '1px solid #E7E7E7',
                borderBottom: '3px solid #e7e7e7',
                py: 1,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 1.5,
                bgcolor: 'transparent',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              Cancel
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
};

UpdateFinaliseCampaign.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
};

export default UpdateFinaliseCampaign;
