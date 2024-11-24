import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useSettingsContext } from 'src/components/settings';

import CreatorForm from './creatorForm';

// ----------------------------------------------------------------------

export default function CreatorView() {
  const settings = useSettingsContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creator, setCreator] = useState({});

  const roleCheck = useCallback(async () => {
    const res = await axiosInstance.get(endpoints.auth.checkCreator);
    setCreator(res?.data?.creator);
  }, []);

  useEffect(() => {
    roleCheck();
  }, [roleCheck]);

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

      <CreatorForm open={dialogOpen} onClose={() => setDialogOpen(false)} creator={creator} />
    </Container>
  );
}
