import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useSettingsContext } from 'src/components/settings';
import axios, { endpoints } from 'src/utils/axios';

import CreatorForm from './creatorForm';


// ----------------------------------------------------------------------

export default function OneView() {
  const settings = useSettingsContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creator, setCreator] = useState({});

  // get user role if creator send request to backend to check if the data is complete
  const getUserRoleAndCheckData = async () => {
    // get user role
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
      const isDataEmpty = Object.values(response.data?.creator).some((value) => !value);
      setDialogOpen(isDataEmpty);
    }
  };

  useEffect(() => {
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
      <CreatorForm open={dialogOpen} onClose={() => setDialogOpen(false)} creator={creator}/>
    </Container>
  );
}
