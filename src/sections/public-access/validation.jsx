import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, TextField, Button, Modal } from '@mui/material';
import { useRouter } from 'src/routes/hooks';
import { enqueueSnackbar } from 'notistack';
import axiosInstance, { endpoints } from 'src/utils/axios';


const PublicValidate = () => {
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { id } = useParams();

  const handlePasswordChange = (e) => setPassword(e.target.value);

  const validatePassword = async () => {
    try {
      const response = await axiosInstance.post(endpoints.public.validate, {
        campaignId: id,
        inputPassword: password,
      });

      if (response.data.success) {
        enqueueSnackbar('Access granted!', { variant: 'success' });
        //router.push(`/public-access/${id}`);  
        router.push(`/public/view/${id}`)
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Invalid password', { variant: 'error' });
    }
  };

  return (
    <Modal open={true} onClose={() => {}} aria-labelledby="password-validation-modal">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'white',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Please enter the password for Access
        </Typography>
        <TextField
          label="Password"
          type="password"
          fullWidth
          value={password}
          onChange={handlePasswordChange}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" color="primary" onClick={validatePassword}>
          Validate
        </Button>
      </Box>
    </Modal>
  );
};

export default PublicValidate;
