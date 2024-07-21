import io from 'socket.io-client';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import axios, { endpoints } from 'src/utils/axios';

import { useSettingsContext } from 'src/components/settings';

import CreatorForm from './form/creatorForm';

// ----------------------------------------------------------------------

export default function CreatorView() {
  const settings = useSettingsContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creator, setCreator] = useState({});
  const [data, setData] = useState();
  // eslint-disable-next-line react-hooks/exhaustive-deps

  useEffect(() => {
    const socket = io();
    socket.on('message', (a) => {
      setData(a);
    });
  }, []);

  // Get user role if creator send request to backend to check if the data is complete

  useEffect(() => {
    const getUserRoleAndCheckData = async () => {
      let role;
      try {
        const response = await axios.get(endpoints.auth.getCurrentUser);
        role = response.data?.user.role;
      } catch (error) {
        console.error(error);
      }
      // check if role is creator
      if (role === 'creator') {
        const response = await axios.get(endpoints.auth.checkCreator);

        setCreator(response.data?.creator);
        const openFormModal = response?.data?.creator?.user?.status === 'pending';
        setDialogOpen(openFormModal);
      }
    };

    getUserRoleAndCheckData();
  }, []);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Typography variant="h4">Dashboard</Typography>

      <Box
        sx={{
          mt: 5,
          width: 1,
          height: 320,
          borderRadius: 2,
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
          border: (theme) => `dashed 1px ${theme.palette.divider}`,
        }}
      />
      {data && <Typography>{data}</Typography>}
      <CreatorForm open={dialogOpen} onClose={() => setDialogOpen(false)} creator={creator} />
    </Container>
  );
}
