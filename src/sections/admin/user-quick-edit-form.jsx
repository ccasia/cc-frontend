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
import { Tab, Tabs, Stack, Select, InputLabel, FormControl, InputAdornment } from '@mui/material';

import useGetRoles from 'src/hooks/use-get-roles';
import { editAdmin } from 'src/hooks/use-get-admins-for-superadmin';

import { countries } from 'src/assets/data';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFSelect, RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

// eslint-disable-next-line import/no-cycle
import { MODULE_ITEMS } from './view/user-list-view';

// ----------------------------------------------------------------------

const ADMIN_STATUS = [
  {
    label: 'Banned',
    value: 'banned',
    color: 'error',
  },
  {
    label: 'Active',
    value: 'active',
    color: 'success',
  },
  {
    label: 'Pending',
    value: 'pending',
    color: 'warning',
  },
];

function UserQuickEditForm({ currentUser, open, onClose }) {
  const { data: roles, isLoading } = useGetRoles();

  const [currentTab, setCurrentTab] = useState('profile');

  const NewUserSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    phoneNumber: Yup.string().required('Phone number is required'),
    country: Yup.string().required('Country is required'),
    role: Yup.string().required('Role is required'),
    mode: Yup.string().required('Mode is required'),
  });

  const defaultValuesProfile = useMemo(
    () => ({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phoneNumber: currentUser?.phoneNumber || '',
      country: currentUser?.country || '',
      status: currentUser?.status,
      role: currentUser?.admin?.role?.id,
      mode: currentUser?.admin?.mode || '',
      // permission: (admin?.adminPermissionModule &&
      //   Object.values(flattenData(admin?.adminPermissionModule))) || [
      //   {
      //     module: '',
      //     permissions: [],
      //   },
      // ],
    }),
    [currentUser]
  );

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues: defaultValuesProfile,
  });

  const {
    reset,
    watch,
    handleSubmit,
    control,
    formState: { isSubmitting, errors, isDirty },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      editAdmin({ ...data, userId: currentUser?.id });
      // await new Promise((resolve) => setTimeout(resolve, 500));
      // mutate(endpoints.users.admins);
      reset();
      onClose();

      enqueueSnackbar('Success', {
        anchorOrigin: {
          horizontal: 'center',
          vertical: 'top',
        },
      });
    } catch (error) {
      enqueueSnackbar('Error updating admin', {
        variant: 'error',
      });
    }
  });

  const { fields, append } = useFieldArray({
    control,
    name: 'permission',
  });

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const countryValue = watch('country');

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { maxWidth: 720, position: 'relative' },
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
            {/* <Tab value="permission" label="Permissions" /> */}
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
              <RHFSelect
                name="status"
                label="Status"
                size="small"
                sx={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  minWidth: 150,
                  width: 150,
                }}
              >
                {ADMIN_STATUS.map((status) => (
                  <MenuItem key={status.id} value={status.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="octicon:dot-16" color={`${status.color}.main`} />
                      {status.label}
                    </Stack>
                  </MenuItem>
                ))}
              </RHFSelect>

              <RHFTextField name="name" label="Full Name" />
              <RHFTextField name="email" label="Email Address" />
              <RHFTextField
                name="phoneNumber"
                label="Phone Number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      +{countries.filter((elem) => elem.label === countryValue).map((e) => e.phone)}
                    </InputAdornment>
                  ),
                }}
              />

              <RHFAutocomplete
                name="country"
                type="country"
                label="Country"
                placeholder="Choose a country"
                fullWidth
                options={countries.map((option) => option.label)}
                getOptionLabel={(option) => option}
              />

              {/* <RHFSelect name="designation" label="Designation">
                <MenuItem value="Finance">Finance</MenuItem>
                <MenuItem value="CSM">CSM</MenuItem>
                <MenuItem value="BD">BD</MenuItem>
                <MenuItem value="Growth">Growth</MenuItem>
              </RHFSelect> */}

              <RHFSelect name="role" label="Role">
                {!isLoading &&
                  roles.map((role) => <MenuItem value={role?.id}>{role?.name}</MenuItem>)}
              </RHFSelect>

              <RHFSelect name="mode" label="Mode">
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
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
                <Box key={elem.id} display="flex" gap={2} my={2} alignItems="center">
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

          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={!isDirty}
          >
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
