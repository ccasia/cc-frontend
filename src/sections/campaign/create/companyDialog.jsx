import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import FormProvider, {  RHFTextField } from 'src/components/hook-form';

export default function CreateCompany({ currentUser, open, onClose }) {
  // const { enqueueSnackbar } = useSnackbar();

  // const { getAdmins } = useGetAdmins();

  const NewUserSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    brand: Yup.string().required('Brand is required'),
    supBrand: Yup.string().required('supBrand  is required'),
    location: Yup.string().required('Location is required'),
  });
  const defaultValues = {
    name: '',
    brand: '',
    supBrand: '',
    location: '',
  };

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues,
  });

  const {
    // reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    console.log(data);
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
            <RHFTextField name="brand" label="Brand" fullWidth />
            <RHFTextField name="supBrand" label="Sup Brand" />
            <RHFTextField name="location" label="Location" />
            {/* <RHFAutocomplete
                name="country"
                label="Country"
                options={countries}
                getOptionLabel={(option) => option.label}
                getOptionSelected={(option, value) => option.label === value.label}
                fullWidth
              /> */}
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
};
