import React from 'react';

import { LoadingButton } from '@mui/lab';
import { Card, Grid, Stack, TextField, IconButton, InputAdornment } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';

const AccountSecurity = () => {
  const password = useBoolean();

  return (
    <Card sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={12} lg={12}>
          <TextField
            type={password.value ? 'text' : 'password'}
            label="Current password"
            placeholder="Current password"
            fullWidth
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
        </Grid>
        <Grid item xs={12} md={12} lg={12}>
          <TextField
            type={password.value ? 'text' : 'password'}
            label="New password"
            placeholder="New password"
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={password.onToggle} edge="end">
                    <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText={
              <Stack component="span" direction="row" alignItems="center">
                <Iconify icon="eva:info-fill" width={16} sx={{ mr: 0.5 }} /> Password must be
                minimum 6+
              </Stack>
            }
          />
        </Grid>
        <Grid item xs={12} md={12} lg={12}>
          <TextField
            type={password.value ? 'text' : 'password'}
            label="Confirm new password"
            placeholder="Confirm new password"
            fullWidth
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
        </Grid>
        <Grid item xs={12} sm={12} md={12} lg={12} sx={{ textAlign: 'end' }}>
          <LoadingButton type="submit" variant="contained">
            Save Changes
          </LoadingButton>
        </Grid>
      </Grid>
    </Card>
  );
};

export default AccountSecurity;
