import * as Yup from 'yup';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import {
  Stack,
  Dialog,
  Button,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

// Validation schema
const InviteClientSchema = Yup.object().shape({
  email: Yup.string().email('Please enter a valid email address').required('Email is required'),
});

export default function InviteClientDialog({ open, onClose, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(InviteClientSchema),
    mode: 'onChange',
  });

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);

      // Create a default company name based on email domain
      const domain = values.email.split('@')[1];
      const companyName = domain
        ? domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
        : 'New Company';

      // First, create a company
      const companyResponse = await axiosInstance.post(endpoints.company.createOneCompany, {
        name: companyName,
        email: values.email,
        phone: '',
        website: '',
      });

      const { company } = companyResponse.data;

      // Then, invite the client using the company ID
      const response = await axiosInstance.post(endpoints.auth.inviteClient, {
        email: values.email,
        companyId: company.id,
      });

      const result = response.data;

      enqueueSnackbar(
        `Invitation sent successfully to ${values.email}! The client will receive an email with setup instructions.`,
        {
          variant: 'success',
          autoHideDuration: 6000,
        }
      );

      // Reset form
      reset();

      // Close dialog
      onClose();

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Error inviting client:', error);

      // Handle specific error cases
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes('already exists')) {
          enqueueSnackbar('A client with this email already exists.', { variant: 'error' });
        } else if (errorMessage.includes('Company already exists')) {
          enqueueSnackbar('A company with this name already exists.', { variant: 'error' });
        } else {
          enqueueSnackbar(errorMessage, { variant: 'error' });
        }
      } else {
        enqueueSnackbar('Failed to send invitation. Please try again.', { variant: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 0.6 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="eva:email-fill" width={24} />
          <Typography variant="h6">Invite New Client</Typography>
        </Stack>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={3} paddingY={1}>
            {/* <Alert severity="info" icon={<Iconify icon="eva:info-fill" />}>
              <Typography variant="body2">
                An invitation email will be sent to the client with a secure link. They will need to verify their email and set up their password to access the platform.
              </Typography>
            </Alert> */}

            <TextField
              fullWidth
              label="Client Email"
              placeholder="Enter client's email"
              type="email"
              {...register('email')}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              disabled={isSubmitting}
              InputProps={{
                sx: {
                  borderRadius: 0.6,
                },
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !isValid}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

InviteClientDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};
