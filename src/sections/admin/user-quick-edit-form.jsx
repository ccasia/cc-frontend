import * as Yup from 'yup';
import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';
import { Chip, Stack, Typography, IconButton, InputAdornment } from '@mui/material';

import useGetRoles from 'src/hooks/use-get-roles';
import { editAdmin } from 'src/hooks/use-get-admins-for-superadmin';

import { countries } from 'src/assets/data';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFSelect, RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

// eslint-disable-next-line import/no-cycle

// ----------------------------------------------------------------------

const ADMIN_STATUS = [
  {
    label: 'Banned',
    value: 'banned',
    color: '#dc3545',
    bgColor: 'rgba(220, 53, 69, 0.08)',
  },
  {
    label: 'Active',
    value: 'active',
    color: '#1DBF66',
    bgColor: 'rgba(29, 191, 102, 0.08)',
  },
  {
    label: 'Pending',
    value: 'pending',
    color: '#FFC704',
    bgColor: 'rgba(255, 199, 4, 0.08)',
  },
];

function UserQuickEditForm({ currentUser, open, onClose }) {
  const { data: roles, isLoading } = useGetRoles();

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
      reset();
      onClose();

      enqueueSnackbar('Admin updated successfully', {
        variant: 'success',
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

  const countryValue = watch('country');
  const statusValue = watch('status');

  const getStatusConfig = (status) => ADMIN_STATUS.find(s => s.value === status) || ADMIN_STATUS[1];

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid #f0f0f0',
        },
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#111827',
                    fontSize: '1.25rem',
                    mb: 0.5,
                  }}
                >
                  Quick Update
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#6b7280', 
                    fontSize: '0.875rem',
                  }}
                >
                  Update admin information and permissions
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                {statusValue && (
                  <Chip
                    label={getStatusConfig(statusValue).label}
                    sx={{
                      bgcolor: getStatusConfig(statusValue).bgColor,
                      color: getStatusConfig(statusValue).color,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: '28px',
                      border: `1px solid ${getStatusConfig(statusValue).color}`,
                    }}
                  />
                )}
                <IconButton
                  onClick={onClose}
                  sx={{
                    color: '#6b7280',
                    '&:hover': {
                      bgcolor: '#f3f4f6',
                      color: '#374151',
                    },
                  }}
                >
                  <Iconify icon="heroicons:x-mark-20-solid" width={20} height={20} />
                </IconButton>
              </Stack>
            </Stack>
          </Box>

          {/* Form Content */}
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              },
            }}
          >
            {/* Status Field - Full Width */}
            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
              <RHFSelect
                name="status"
                label="Status"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1340ff',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1340ff',
                      borderWidth: 2,
                    },
                  },
                }}
              >
                {ADMIN_STATUS.map((status) => (
                  <MenuItem 
                    key={status.value} 
                    value={status.value}
                    sx={{
                      borderRadius: 0.75,
                      mx: 0.5,
                      my: 0.25,
                      '&:hover': {
                        bgcolor: 'rgba(19, 64, 255, 0.04)',
                      },
                      '&.Mui-selected': {
                        bgcolor: 'rgba(19, 64, 255, 0.08)',
                        '&:hover': {
                          bgcolor: 'rgba(19, 64, 255, 0.12)',
                        },
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: status.color,
                        }}
                      />
                      {status.label}
                    </Stack>
                  </MenuItem>
                ))}
              </RHFSelect>
            </Box>

            {/* Name Field */}
            <RHFTextField 
              name="name" 
              label="Full Name"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1340ff',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1340ff',
                    borderWidth: 2,
                  },
                },
              }}
            />

            {/* Email Field */}
            <RHFTextField 
              name="email" 
              label="Email Address"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1340ff',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1340ff',
                    borderWidth: 2,
                  },
                },
              }}
            />

            {/* Phone Number Field */}
            <RHFTextField
              name="phoneNumber"
              label="Phone Number"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                      +{countries.filter((elem) => elem.label === countryValue).map((e) => e.phone)}
                    </Typography>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1340ff',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1340ff',
                    borderWidth: 2,
                  },
                },
              }}
            />

            {/* Country Field */}
            <RHFAutocomplete
              name="country"
              type="country"
              label="Country"
              placeholder="Choose a country"
              fullWidth
              options={countries.map((option) => option.label)}
              getOptionLabel={(option) => option}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1340ff',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1340ff',
                    borderWidth: 2,
                  },
                },
              }}
            />

            {/* Role Field */}
            <RHFSelect 
              name="role" 
              label="Role"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1340ff',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1340ff',
                    borderWidth: 2,
                  },
                },
              }}
            >
              {!isLoading &&
                roles.map((role) => (
                  <MenuItem 
                    key={role.id} 
                    value={role?.id}
                    sx={{
                      borderRadius: 0.75,
                      mx: 0.5,
                      my: 0.25,
                      '&:hover': {
                        bgcolor: 'rgba(19, 64, 255, 0.04)',
                      },
                      '&.Mui-selected': {
                        bgcolor: 'rgba(19, 64, 255, 0.08)',
                        '&:hover': {
                          bgcolor: 'rgba(19, 64, 255, 0.12)',
                        },
                      },
                    }}
                  >
                    {role?.name}
                  </MenuItem>
                ))}
            </RHFSelect>

            {/* Mode Field */}
            <RHFSelect 
              name="mode" 
              label="Mode"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1340ff',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1340ff',
                    borderWidth: 2,
                  },
                },
              }}
            >
              <MenuItem 
                value="normal"
                sx={{
                  borderRadius: 0.75,
                  mx: 0.5,
                  my: 0.25,
                  '&:hover': {
                    bgcolor: 'rgba(19, 64, 255, 0.04)',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(19, 64, 255, 0.08)',
                    '&:hover': {
                      bgcolor: 'rgba(19, 64, 255, 0.12)',
                    },
                  },
                }}
              >
                Normal
              </MenuItem>
              <MenuItem 
                value="advanced"
                sx={{
                  borderRadius: 0.75,
                  mx: 0.5,
                  my: 0.25,
                  '&:hover': {
                    bgcolor: 'rgba(19, 64, 255, 0.04)',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(19, 64, 255, 0.08)',
                    '&:hover': {
                      bgcolor: 'rgba(19, 64, 255, 0.12)',
                    },
                  },
                }}
              >
                Advanced
              </MenuItem>
              <MenuItem 
                value="god"
                sx={{
                  borderRadius: 0.75,
                  mx: 0.5,
                  my: 0.25,
                  '&:hover': {
                    bgcolor: 'rgba(19, 64, 255, 0.04)',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(19, 64, 255, 0.08)',
                    '&:hover': {
                      bgcolor: 'rgba(19, 64, 255, 0.12)',
                    },
                  },
                }}
              >
                God
              </MenuItem>
            </RHFSelect>
          </Box>

          {/* Actions */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #f0f0f0' }}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{
                  borderColor: '#d1d5db',
                  color: '#6b7280',
                  borderRadius: 1,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#9ca3af',
                    bgcolor: '#f9fafb',
                  },
                }}
              >
                Cancel
              </Button>

              <LoadingButton
                type="submit"
                variant="contained"
                loading={isSubmitting}
                disabled={!isDirty}
                sx={{
                  bgcolor: '#1340ff',
                  color: '#ffffff',
                  borderRadius: 1,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#0f35d1',
                  },
                  '&:disabled': {
                    bgcolor: '#e5e7eb',
                    color: '#9ca3af',
                  },
                }}
              >
                Update Admin
              </LoadingButton>
            </Stack>
          </Box>
        </Box>
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
