import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import axiosInstance, { endpoints } from 'src/utils/axios';

import FormProvider, { RHFTextField } from 'src/components/hook-form';



export default function CreateCompany({ setCompany,currentUser, open, onClose }) {


  const NewUserSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Must be a valid email').required('Email is required'),
    phone: Yup.string().required('Phone is required'),
    website: Yup.string().required('Website is required'),
    registration_number: Yup.string().required('Registration Number is required'),
    address: Yup.string().required('Address is required'),
  });
  const defaultValues = {
    name: '',
    email: '',
    phone: '',
    registration_number: '',
    address: '',
    website: '',
  };

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.post(endpoints.company.createOneCompany, data);
      reset();
      onClose();
      setCompany(data.name);
      enqueueSnackbar('Company created successfully', { variant: 'success' });
      console.log(res.data);
    } catch (error) {
      console.log(error);
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { maxWidth: 720 },
      }}
      fullWidth
    >
      <DialogTitle>Create Company</DialogTitle>
      <DialogContent>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Box
            rowGap={2}
            columnGap={3}
            display="grid"
            mt={4}
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
            }}
          >
            <RHFTextField name="name" label="Name" fullWidth />
            <RHFTextField name="email" label="Email" fullWidth />
            <RHFTextField name="phone" label="Phone" />
            <RHFTextField name="registration_number" label="Registration Number" fullWidth />
            <RHFTextField name="address" label="Address" />
            <RHFTextField name="website" label="Website" fullWidth />
          </Box>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting}
              loadingPosition="start"
              color="primary"
            >
              Create
            </LoadingButton>
          </DialogActions>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

CreateCompany.propTypes = {
  currentUser: PropTypes.object,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  setCompany: PropTypes.func,
};
