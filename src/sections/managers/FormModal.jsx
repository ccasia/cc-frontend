import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import axios, { endpoints } from 'src/utils/axios';

// import { useTheme } from '@mui/material/styles';

import { Modal } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',

  boxShadow: 24,
  p: 4,
  borderRadius: 5,
};

export default function FormModal({ isEditing, handleSaveClick }) {
  const password = useBoolean();

  const RegisterSchema = Yup.object().shape({
    firstname: Yup.string().required('First name required'),
    lastname: Yup.string().required('Last name required'),
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    password: Yup.string().required('Password is required'),
  });

  const defaultValues = {
    firstname: '',
    lastname: '',
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: yupResolver(RegisterSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await axios.post(endpoints.auth.registerAdmin, data);

      handleSaveClick();
    } catch (error) {
      console.error(error);
    }
  });

  const renderForm = (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <RHFTextField name="firstname" label="First name" />
        <RHFTextField name="lastname" label="Last name" />
      </Stack>

      <RHFTextField name="email" label="Email address" />

      <RHFTextField
        name="password"
        label="Password"
        type={password.value ? 'text' : 'password'}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
        sx={{ justifyContent: 'space-between', pl: 2, pr: 1.5 }}
      >
        Create account
      </LoadingButton>
    </Stack>
  );

  return (
    <Modal
      open={isEditing}
      onClose={handleSaveClick}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 2,
          }}
        >
          <Typography variant="h4">Invite New Admin</Typography>
          <Button onClick={handleSaveClick}>
            <Iconify icon="eva:close-fill" />
          </Button>
        </Box>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          {renderForm}
        </FormProvider>
      </Box>
    </Modal>
  );
}

FormModal.propTypes = {
  isEditing: PropTypes.bool,
  handleSaveClick: PropTypes.func,
};
