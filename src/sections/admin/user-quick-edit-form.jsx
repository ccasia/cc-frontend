import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useCallback } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { Tab, Tabs, Select, InputLabel, FormControl } from '@mui/material';

import useGetAdmins from 'src/hooks/use-get-admins';

import { flattenData } from 'src/utils/flatten-array';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { countries } from 'src/assets/data';
import { USER_STATUS_OPTIONS } from 'src/_mock';

import FormProvider, { RHFSelect, RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

// eslint-disable-next-line import/no-cycle
import { MODULE_ITEMS } from './view/user-list-view';

// ----------------------------------------------------------------------

function UserQuickEditForm({ currentUser, open, onClose }) {
  const { getAdmins } = useGetAdmins();

  const { admin } = currentUser;


  const [currentTab, setCurrentTab] = useState('profile');

  const NewUserSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    phoneNumber: Yup.string().required('Phone number is required'),
    country: Yup.string().required('Country is required'),
    designation: Yup.string().required('Designation is required'),
    mode: Yup.string().required('Mode is required'),
  });

  const defaultValuesProfile = useMemo(
    () => ({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phoneNumber: currentUser?.phoneNumber || '',
      country: currentUser?.country || '',
      status: currentUser?.status,
      designation: currentUser?.admin?.designation || '',
      mode: currentUser?.admin?.mode || '',
      permission: (admin?.AdminPermissionModule &&
        Object.values(flattenData(admin?.AdminPermissionModule))) || [
        {
          module: '',
          permissions: [],
        },
      ],
    }),
    [currentUser, admin]
  );

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues: defaultValuesProfile,
  });

  const {
    reset,
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await axiosInstance.patch(endpoints.auth.updateProfileAdmin, {
        ...data,
        userId: currentUser?.id,
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      reset();
      onClose();
      enqueueSnackbar('Success', {
        anchorOrigin: {
          horizontal: 'center',
          vertical: 'top',
        },
      });

      getAdmins();
    } catch (error) {
      console.error(error);
    }
  });

  const { fields, append } = useFieldArray({
    control,
    name: 'permission',
  });

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { maxWidth: 720 },
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Quick Update</DialogTitle>

        <DialogContent>
          <Tabs
            value={currentTab}
            onChange={handleChangeTab}
            sx={{
              mb: 3,
            }}
          >
            <Tab value="profile" label="Profile" />
            <Tab value="permission" label="Permissions" />
          </Tabs>
          {currentTab === 'profile' && (
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              mt={2}
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <RHFSelect name="status" label="Status">
                {USER_STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </RHFSelect>

              <RHFTextField name="name" label="Full Name" />
              <RHFTextField name="email" label="Email Address" />
              <RHFTextField name="phoneNumber" label="Phone Number" />

              <RHFAutocomplete
                name="country"
                type="country"
                label="Country"
                placeholder="Choose a country"
                fullWidth
                options={countries.map((option) => option.label)}
                getOptionLabel={(option) => option}
              />

              <RHFSelect name="designation" label="Designation">
                <MenuItem value="Finance">Finance</MenuItem>
                <MenuItem value="CSM">CSM</MenuItem>
                <MenuItem value="BD">BD</MenuItem>
                <MenuItem value="Growth">Growth</MenuItem>
              </RHFSelect>

              <RHFSelect name="mode" label="Mode">
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="god">God</MenuItem>
              </RHFSelect>
            </Box>
          )}

          {currentTab === 'permission' && (
            <Box
              display="grid"
              rowGap={2}
              gridTemplateAreas={{
                xs: 'repeat(1, 1fr)',
              }}
            >
              {fields.map((elem, index) => (
                <Box display="flex" gap={2} my={2} alignItems="center">
                  <Controller
                    name={`permission.${index}.module`}
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        error={
                          errors.permission &&
                          errors.permission[index] &&
                          errors.permission[index].module
                        }
                      >
                        <InputLabel id="module">Module</InputLabel>
                        <Select labelId="module" label="Module" {...field}>
                          {MODULE_ITEMS.map((item, a) => (
                            <MenuItem value={item.value} key={a}>
                              {item.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />

                  <Controller
                    name={`permission.${index}.permissions`}
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        error={
                          errors.permission &&
                          errors.permission[index] &&
                          errors.permission[index].permission
                        }
                      >
                        <InputLabel id="permissions">Permission</InputLabel>
                        <Select
                          labelId="permissions"
                          label="Permission"
                          multiple
                          {...field}
                          required
                        >
                          <MenuItem value="create">Create</MenuItem>
                          <MenuItem value="read">Read</MenuItem>
                          <MenuItem value="update">Update</MenuItem>
                          <MenuItem value="delete">Delete</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                  {/* <IconButton color="error" onClick={() => remove(index)}>
                    <Iconify icon="mdi:trash" />
                  </IconButton> */}
                </Box>
              ))}

              {fields.length < 5 && (
                <Button
                  fullWidth
                  variant="outlined"
                  // onClick={() => permissionLength < 5 && setPermissionLength((prev) => prev + 1)}
                  onClick={() => append({ module: '', permissions: [] })}
                  sx={{
                    my: 2,
                  }}
                >
                  +
                </Button>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Update
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

export default UserQuickEditForm;

UserQuickEditForm.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  currentUser: PropTypes.object,
};
