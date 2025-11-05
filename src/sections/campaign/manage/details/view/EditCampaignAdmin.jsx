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

import { useGetAdmins } from 'src/sections/campaign/create/hooks/get-am';

const EditCampaignAdmin = ({ open, campaign, onClose }) => {
  const { user } = useAuthContext();
  const { data: admins } = useGetAdmins('active');

  const filteredAdmins = useMemo(
    () => admins?.filter((item) => item.role === 'CSM' || item.role === 'Client') || [],
    [admins]
  );

  const existedAdmins = campaign?.campaignAdmin?.map(({ admin }) => ({
    id: admin?.user?.id,
    name: admin?.user?.name,
    role: admin?.role?.name,
  }));

  const methods = useForm({
    defaultValues: {
      admins: existedAdmins?.length ? [...existedAdmins] : [],
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.campaign.editCampaignAdmins(campaign?.id), {
        data,
      });
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      console.log(error);
      enqueueSnackbar(error, {
        variant: 'error',
      });
    }
  });

  return (
    <Dialog open={open} fullWidth maxWidth="xs">
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle id="alert-dialog-title">Edit Campaign Manager</DialogTitle>

        <DialogContent>
          <RHFAutocomplete
            name="admins"
            placeholder="Campaign Manager"
            multiple
            disableCloseOnSelect
            options={filteredAdmins}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => option.name}
            renderTags={(selected, getTagProps) =>
              selected.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option?.id}
                  label={option?.id === user?.id ? 'Me' : option?.name}
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
            disabled={isDirty}
          >
            Save
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default EditCampaignAdmin;

EditCampaignAdmin.propTypes = {
  open: PropTypes.bool,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
