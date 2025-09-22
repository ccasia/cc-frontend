import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';

import { LoadingButton } from '@mui/lab';
import {
  Chip,
  Dialog,
  Button,
  Checkbox,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFAutocomplete } from 'src/components/hook-form';

import { useGetClients } from 'src/sections/campaign/create/hooks/get-clients';

const EditCampaignClient = ({ open, campaign, onClose }) => {
  const { user } = useAuthContext();
  const { data: clients, isLoading } = useGetClients('active');

  const filteredClients = useMemo(
    () => !isLoading && (clients?.filter((item) => item.client) || []),
    [clients, isLoading]
  );

  const existedClients = campaign?.campaignClients?.map(({ client }) => ({
    id: client?.user?.id,
    name: client?.user?.name,
    role: 'client',
  }));

  const methods = useForm({
    defaultValues: {
      clients: existedClients || [],
    },
  });


  const {
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Step 1: Save client managers
      const res = await axiosInstance.patch(endpoints.campaign.editCampaignClients(campaign?.id), {
        data,
      });
      enqueueSnackbar(res?.data?.message || 'Clients updated successfully');
      
      // Step 2: If this is not yet a V3 campaign, convert it automatically
      if (campaign?.origin !== 'CLIENT') {
        enqueueSnackbar('Converting campaign to V3...', { variant: 'info' });
        
        // Enhanced single-step conversion that handles everything
        const convertRes = await axiosInstance.patch(endpoints.campaign.convertToV3(campaign?.id));
        
        const migratedCreators = convertRes?.data?.migratedCreators || 0;
        const totalSubmissions = convertRes?.data?.totalSubmissions || 0;
        
        // Always run the fix function to ensure all submissions are created properly
        enqueueSnackbar('Ensuring all submissions are created...', { variant: 'info' });
        const fixRes = await axiosInstance.patch(endpoints.campaign.fixV3Submissions(campaign?.id));
        const createdSubmissions = fixRes?.data?.createdSubmissions || 0;
        
        if (createdSubmissions > 0) {
          enqueueSnackbar(`Created ${createdSubmissions} additional missing submissions!`, { 
            variant: 'success' 
          });
        }
        
        // Activate the campaign
        const activateRes = await axiosInstance.patch(endpoints.campaign.activateV3Campaign(campaign?.id));
        const newStatus = activateRes?.data?.newStatus || 'ACTIVE';
        
        const successMessage = `Campaign successfully converted to V3! 🎉\n` +
          `• Migrated ${migratedCreators} creator(s)\n` +
          `• Total submissions: ${totalSubmissions}\n` +
          `• Additional submissions created: ${createdSubmissions}\n` +
          `• Campaign status: ${newStatus}`;
        
        enqueueSnackbar(successMessage, { variant: 'success' });
        
        // Refresh the page to show all updates
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        // If already V3, just close the modal
        onClose();
      }
      
    } catch (error) {
      console.log('Error updating clients or converting to V3:', error);
      enqueueSnackbar(error?.message || 'Failed to update clients', {
        variant: 'error',
      });
    }
  });



  return (
    <Dialog open={open} fullWidth maxWidth="xs">
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle id="alert-dialog-title">Edit Campaign Client</DialogTitle>

        <DialogContent>
          <RHFAutocomplete
            name="clients"
            placeholder="Client Manager"
            multiple
            disableCloseOnSelect
            options={
              (!isLoading &&
                filteredClients?.map((client) => ({
                  id: client?.id,
                  name: client?.name,
                  role: 'client',
                }))) ||
              []
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => `${option.name}`}
            renderTags={(selected, getTagProps) =>
              selected.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option?.id}
                  label={option?.id === user?.id ? 'Me' : option?.name || ''}
                  size="small"
                  color="info"
                  variant="soft"
                />
              ))
            }
            renderOption={(props, option, { selected }) => {
              // eslint-disable-next-line react/prop-types
              const { key, ...optionProps } = props;
              return (
                <li key={key} {...optionProps}>
                  <Checkbox
                    icon={<Iconify icon="mingcute:checkbox-line" width={20} />}
                    checkedIcon={<Iconify icon="mingcute:checkbox-fill" width={20} />}
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  {option.name}
                </li>
              );
            }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} size="small" variant="outlined">
            Close
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            size="small"
            loading={isSubmitting}
            disabled={!isDirty}
          >
            {campaign?.origin === 'CLIENT' ? 'Save Changes' : 'Save'}
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default EditCampaignClient;

EditCampaignClient.propTypes = {
  open: PropTypes.bool,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
