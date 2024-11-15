import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState, useEffect, useCallback } from 'react';
import { formatIncompletePhoneNumber } from 'libphonenumber-js';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import axiosInstance, { endpoints } from 'src/utils/axios';

import FormProvider, { RHFTextField, RHFUploadAvatar } from 'src/components/hook-form';

export default function CreateCompany({ setCompany, open, onClose, companyName }) {
  const [phoneError, setPhoneError] = useState('');

  const checkPhoneExists = async (phone) => {
    try {
      const response = await axiosInstance.get(endpoints.company.getAll);
      const companies = response.data;
      console.log(companies);
      return companies.some((company) => company.phone === phone);
    } catch (error) {
      console.error('Error checking phone:', error);
      return false;
    }
  };

  const NewUserSchema = Yup.object().shape({
    companyName: Yup.string().required('Name is required'),
    companyEmail: Yup.string().email('Must be a valid email').required('Email is required'),
    companyPhone: Yup.string().required('Phone is required'),
    companyWebsite: Yup.string().required('Website is required'),
    companyLogo: Yup.mixed(),
  });

  const defaultValues = {
    companyName: companyName || '',
    companyEmail: '',
    companyPhone: '',
    companyWebsite: '',
    companyLogo: null,
  };

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
    control,
  } = methods;

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      if (file) {
        const newFile = Object.assign(file, {
          preview: URL.createObjectURL(file),
        });
        setValue('companyLogo', newFile, { shouldValidate: true });
      }
    },
    [setValue]
  );

  const handlePhoneChange = (event, onChange) => {
    setPhoneError('');
    const formattedNumber = formatIncompletePhoneNumber(event.target.value, 'MY');
    onChange(formattedNumber);
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const phoneExists = await checkPhoneExists(data.companyPhone);
      if (phoneExists) {
        setPhoneError('This phone number is already registered to another company.');
        return;
      }

      const formData = new FormData();

      const companyData = {
        companyName: data.companyName,
        companyEmail: data.companyEmail,
        companyPhone: data.companyPhone,
        companyWebsite: data.companyWebsite,
      };

      formData.append('data', JSON.stringify(companyData));

      if (data.companyLogo) {
        formData.append('companyLogo', data.companyLogo);
      }

      const res = await axiosInstance.post(endpoints.company.create, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      reset(defaultValues);

      mutate(endpoints.company.getAll);
      setCompany(res?.data?.company?.company);
      onClose();


      console.log("DASDSADSAD", res?.data?.company);
      enqueueSnackbar('Company created successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  });

  useEffect(() => {
    if (companyName) {
      setValue('companyName', companyName);
    }
  }, [companyName, setValue]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { maxWidth: 720 },
      }}
      fullWidth
    >
      <DialogTitle>Create Client</DialogTitle>
      <DialogContent>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Box rowGap={3} columnGap={2} display="grid" mt={2}>
            <RHFUploadAvatar
              name="companyLogo"
              onDrop={handleDrop}
              helperText={
                <Typography
                  variant="caption"
                  sx={{
                    mt: 2,
                    mx: 'auto',
                    display: 'block',
                    textAlign: 'center',
                    color: 'text.secondary',
                  }}
                >
                  Allowed *.jpeg, *.jpg, *.png, *.gif
                  <br /> max size of 3.1 MB
                </Typography>
              }
              sx={{ mx: 'auto' }}
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)',
                },
                gap: 2,
              }}
            >
              <RHFTextField name="companyName" label="Name" />
              <RHFTextField name="companyEmail" label="Email" />
              <Controller
                name="companyPhone"
                control={control}
                defaultValue=""
                rules={{ required: 'Phone number is required' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    placeholder="Phone Number"
                    variant="outlined"
                    fullWidth
                    error={!!fieldState.error || !!phoneError}
                    helperText={(fieldState.error ? fieldState.error.message : '') || phoneError}
                    onChange={(event) => handlePhoneChange(event, field.onChange)}
                  />
                )}
              />
              <RHFTextField name="companyWebsite" label="Website" />
              {/* <RHFTextField
                name="companyPhone"
                label="Phone"
                error={!!phoneError}
                helperText={phoneError}
                onChange={handlePhoneChange}
                value={methods.watch('companyPhone')}
              />

              <RHFTextField name="name" label="Name" fullWidth />
              <RHFTextField name="email" label="Email" fullWidth />
              <RHFTextField name="phone" label="Phone" />

              <RHFTextField name="website" label="Website" fullWidth /> */}
            </Box>
          </Box>

          <DialogActions sx={{ mt: 3 }}>
            <Button size="small" onClick={onClose}>
              Cancel
            </Button>
            <LoadingButton size="small" type="submit" variant="contained" loading={isSubmitting}>
              Create
            </LoadingButton>
          </DialogActions>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

CreateCompany.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  setCompany: PropTypes.func,
  companyName: PropTypes.string,
};
