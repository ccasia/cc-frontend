import React from 'react';
import PropTypes from 'prop-types';

import { Stack, Alert, FormLabel, Typography, ListItemText, InputAdornment } from '@mui/material';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';

const LastStep = ({ item }) => (
  <>
    <ListItemText
      sx={{
        mt: 2,
        textAlign: 'center',
      }}
      primary={item.title}
      secondary={item.description}
      primaryTypographyProps={{
        fontFamily: (theme) => theme.typography.fontSecondaryFamily,
        variant: 'h3',
        fontWeight: 400,
      }}
      secondaryTypographyProps={{
        variant: 'subtitle2',
      }}
    />

    <Stack
      gap={4}
      sx={{
        width: { sm: 400 },
        mx: 'auto',
        my: 5,
      }}
    >
      <Stack spacing={1}>
        <FormLabel required sx={{ fontWeight: 600, color: 'black' }}>
          Instagram Username
        </FormLabel>
        <Stack gap={1}>
          <RHFTextField
            name="instagram"
            placeholder="@cultcreativeasia"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="mdi:instagram" width={20} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <FormLabel sx={{ fontWeight: 600, color: 'black' }}>Tiktok Username</FormLabel>
        <Stack gap={1}>
          <RHFTextField
            name="tiktok"
            placeholder="@cultcreativeasia"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="ic:baseline-tiktok" width={20} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </Stack>

      <Alert variant="outlined" severity="info">
        <Typography variant="caption" textAlign="justify">
          By entering your social media handle and continuing, you agree to allow Cult Creative
          access to your account data. This includes followers, followings, engagement rates, likes,
          comments, shares and top content which is not limited to active and archived posts. We use
          this information to enhance your experience on the platform and provide insights on your
          Media Kit.
        </Typography>
      </Alert>
    </Stack>
  </>
);

export default LastStep;

LastStep.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
  }),
};
