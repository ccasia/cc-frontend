import * as yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Dialog,
  Divider,
  FormLabel,
  Typography,
  IconButton,
  createFilterOptions,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { banks } from 'src/contants/bank';
import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

// eslint-disable-next-line react/prop-types
const FormField = ({ label, children }) => (
  <Stack spacing={1}>
    <FormLabel
      sx={{
        fontWeight: 600,
        fontSize: '12px',
        color: '#636366',
      }}
    >
      {label}
      <span style={{ color: 'red' }}> *</span>
    </FormLabel>
    {children}
  </Stack>
);

const filter = createFilterOptions();

const CreatorForm = ({ dialog, user, display, backdrop }) => {
  const { initialize } = useAuthContext();
  const schema = yup.object().shape({
    fullName: yup.string().required('Full name is required'),
    icNumber: yup.string().required('IC/Passport number is required'),
    bankName: yup.string().required('Bank Name is required'),
    accountName: yup.string().required('Account Name is required'),
    accountNumber: yup.string().required('Account Number is required'),
  });

  const loading = useBoolean();

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: user?.name || '',
      icNumber: user?.paymentForm?.icNumber || '',
      bankName: user?.paymentForm?.bankName || '',
      accountName: user?.paymentForm?.bankAccountName || '',
      accountNumber: user?.paymentForm?.bankAccountNumber || '',
    },
  });

  const {
    handleSubmit,
    formState: { isValid },
    setValue,
    watch,
  } = methods;

  const bankName = watch('bankName');

  const onSubmit = handleSubmit(async (data) => {
    console.log(data);
    try {
      loading.onTrue();
      const res = await axiosInstance.patch(endpoints.creators.updateCreatorform, {
        ...data,
        userId: user?.id,
      });
      enqueueSnackbar(res?.data?.message);
      initialize();
      dialog.onFalse();
      backdrop?.onFalse();
      mutate(endpoints.auth.me);
    } catch (error) {
      enqueueSnackbar('error', {
        variant: 'error',
      });
    } finally {
      loading.onFalse();
    }
  });

  useEffect(() => {
    if (bankName && bankName.includes('Add')) {
      const value = bankName.split(' ').slice(1).join(' ');
      setValue('bankName', value);
    }
  }, [bankName, setValue]);

  return display ? (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Box
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(1, 1fr)',
        }}
        gap={2}
        mt={2}
      >
        <FormField label="Full Name">
          <RHFTextField
            name="fullName"
            placeholder="Full name"
            sx={{
              '& .MuiInputBase-input': {
                padding: '12px',
                background: '#FFFFFF',
                border: '1px solid #EBEBEB',
                borderRadius: '8px',
              },
            }}
          />
        </FormField>

        <FormField label="NRIC No.">
          <RHFTextField
            name="icNumber"
            placeholder="NRIC No."
            sx={{
              '& .MuiInputBase-input': {
                padding: '12px',
                background: '#FFFFFF',
                border: '1px solid #EBEBEB',
                borderRadius: '8px',
              },
            }}
          />
        </FormField>

        <FormField label="Bank Selection">
          <RHFAutocomplete
            selectOnFocus
            clearOnBlur
            label="Select Bank"
            name="bankName"
            options={banks.map((item) => item.bank)}
            getOptionLabel={(option) => option}
            sx={{
              '& .MuiInputBase-root': {
                background: '#FFFFFF',
                border: '1px solid #EBEBEB',
                borderRadius: '8px',
              },
              '& .MuiOutlinedInput-root .MuiAutocomplete-input': {
                padding: '5px 4px 5px 4px',
              },
              '& .MuiLoadingButton-root.Mui-disabled': {
                backgroundColor: '#B0BEC5',
                color: '#FFFFFF',
                opacity: 1,
                cursor: 'not-allowed',
              },
            }}
          />
        </FormField>

        <FormField label="Account Name">
          <RHFTextField
            name="accountName"
            placeholder="Your Name / Sdn Bhd"
            sx={{
              '& .MuiInputBase-input': {
                padding: '12px',
                background: '#FFFFFF',
                border: '1px solid #EBEBEB',
                borderRadius: '8px',
              },
            }}
          />
        </FormField>

        <FormField label="Account No.">
          <RHFTextField
            name="accountNumber"
            placeholder="Account No."
            sx={{
              '& .MuiInputBase-input': {
                padding: '12px',
                background: '#FFFFFF',
                border: '1px solid #EBEBEB',
                borderRadius: '8px',
              },
            }}
          />
        </FormField>
      </Box>

      <Stack direction="row" alignItems="center" justifyContent="end" spacing={2} mt={3}>
        <LoadingButton
          size="medium"
          variant="contained"
          type="submit"
          loading={loading.value}
          disabled={!isValid}
          sx={{
            width: '126px',
            height: '44px',
            background: '#3A3A3C',
            boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
            borderRadius: '8px',
            fontWeight: 'normal',
            fontSize: '16px',
            color: '#FFFFFF',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&.MuiLoadingButton-root.Mui-disabled': {
              backgroundColor: '#B0BEC5',
              color: '#FFFFFF',
              background:
                'linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6)), #3A3A3C',
              boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          Save Details
        </LoadingButton>
      </Stack>
    </FormProvider>
  ) : (
    <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="sm" fullWidth>
      <Box
        sx={{
          padding: '20px',
          width: 1,
          height: '638px',
          background: '#f4f4f4',
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.15)',
          borderRadius: '20px',
          overflow: 'auto',
        }}
      >
        <IconButton
          onClick={dialog.onFalse}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <Iconify icon="mingcute:close-fill" width={24} />
        </IconButton>

        <Stack spacing={0}>
          <Typography
            variant="body1"
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              flexGrow: 1,
              fontWeight: 'normal',
              fontSize: '32px',
            }}
          >
            💰 Fill in your payment details
          </Typography>

          <Divider sx={{ my: 2, mb: 0 }} />
          <FormProvider methods={methods} onSubmit={onSubmit}>
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(1, 1fr)',
              }}
              gap={2}
              mt={2}
            >
              <FormField label="Full Name">
                <RHFTextField
                  name="fullName"
                  placeholder="Full name"
                  sx={{
                    '& .MuiInputBase-input': {
                      padding: '12px',
                      background: '#FFFFFF',
                      border: '1px solid #EBEBEB',
                      borderRadius: '8px',
                    },
                  }}
                />
              </FormField>

              <FormField label="NRIC No.">
                <RHFTextField
                  name="icNumber"
                  placeholder="NRIC No."
                  sx={{
                    '& .MuiInputBase-input': {
                      padding: '12px',
                      background: '#FFFFFF',
                      border: '1px solid #EBEBEB',
                      borderRadius: '8px',
                    },
                  }}
                />
              </FormField>

              <FormField label="Bank Selection">
                <RHFAutocomplete
                  selectOnFocus
                  clearOnBlur
                  placeholder="Select Bank"
                  name="bankName"
                  options={banks.map((item) => item.bank)}
                  getOptionLabel={(option) => option}
                  filterOptions={(options, params) => {
                    const { inputValue } = params;
                    const filtered = filter(options, params);

                    // Suggest the creation of a new value
                    const isExisting = options.some(
                      (option) => option.toLowerCase() === inputValue.toLowerCase()
                    );

                    if (inputValue !== '' && !isExisting) {
                      filtered.push(`Add ${inputValue}`);
                    }

                    return filtered;
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      background: '#FFFFFF',
                      border: '1px solid #EBEBEB',
                      borderRadius: '8px',
                    },
                    '& .MuiOutlinedInput-root .MuiAutocomplete-input': {
                      padding: '5px 4px 5px 4px',
                    },
                    '& .MuiLoadingButton-root.Mui-disabled': {
                      backgroundColor: '#B0BEC5',
                      color: '#FFFFFF',
                      opacity: 1,
                      cursor: 'not-allowed',
                    },
                  }}
                />
              </FormField>

              <FormField label="Account Name">
                <RHFTextField
                  name="accountName"
                  placeholder="Your Name / Sdn Bhd"
                  sx={{
                    '& .MuiInputBase-input': {
                      padding: '12px',
                      background: '#FFFFFF',
                      border: '1px solid #EBEBEB',
                      borderRadius: '8px',
                    },
                  }}
                />
              </FormField>

              <FormField label="Account No.">
                <RHFTextField
                  name="accountNumber"
                  placeholder="Account No."
                  sx={{
                    '& .MuiInputBase-input': {
                      padding: '12px',
                      background: '#FFFFFF',
                      border: '1px solid #EBEBEB',
                      borderRadius: '8px',
                    },
                  }}
                />
              </FormField>
            </Box>

            <Stack direction="row" alignItems="center" justifyContent="end" spacing={2} mt={3}>
              <LoadingButton
                size="medium"
                variant="contained"
                type="submit"
                loading={loading.value}
                disabled={!isValid}
                sx={{
                  width: '126px',
                  height: '44px',
                  background: '#3A3A3C',
                  boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
                  borderRadius: '8px',
                  fontWeight: 'normal',
                  fontSize: '16px',
                  color: '#FFFFFF',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '&.MuiLoadingButton-root.Mui-disabled': {
                    backgroundColor: '#B0BEC5',
                    color: '#FFFFFF',
                    background:
                      'linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6)), #3A3A3C',
                    boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                Save Details
              </LoadingButton>
            </Stack>
          </FormProvider>
        </Stack>
      </Box>
    </Dialog>
  );
};

export default CreatorForm;

CreatorForm.propTypes = {
  dialog: PropTypes.object,
  user: PropTypes.object,
  display: PropTypes.bool,
  backdrop: PropTypes.object,
};
