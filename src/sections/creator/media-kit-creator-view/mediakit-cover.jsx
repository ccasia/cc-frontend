/* eslint-disable react/prop-types */
import React from 'react';

import { deepOrange } from '@mui/material/colors';
import { Box, Chip, Stack, Avatar, useTheme, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

const MediaKitCover = ({ user }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 5,
      }}
    >
      <Stack direction="column" alignItems="center" gap={2}>
        <Avatar sx={{ bgcolor: deepOrange[500], width: 150, height: 150 }}>N</Avatar>
        <Typography variant="h2" color={theme.palette.text.primary} fontWeight={800}>
          {user?.creator?.MediaKit?.name || user?.name}
        </Typography>
        <Stack
          direction="row"
          gap={2}
          flexWrap="wrap"
          sx={{
            justifyContent: 'center',
          }}
        >
          {user?.creator?.MediaKit?.interests.map((elem) => (
            <Chip
              label={elem}
              sx={{
                borderRadius: 10,
                fontWeight: 800,
              }}
            />
          )) ||
            user?.creator?.interests.map((elem) => (
              <Chip
                label={elem?.name}
                sx={{
                  borderRadius: 10,
                  fontWeight: 800,
                }}
              />
            ))}
        </Stack>
        <Stack gap={2}>
          <Typography
            gutterBottom
            variant="body1"
            maxWidth={600}
            textAlign="center"
            lineHeight={1.2}
            fontWeight={600}
            color={theme.palette.grey[600]}
          >
            {user?.creator?.MediaKit?.about}
          </Typography>
          <Stack direction={{ sm: 'row' }} justifyContent="space-evenly" alignItems="center">
            <Stack direction="row" gap={2}>
              <Iconify icon="mingcute:location-fill" />
              <Typography variant="subtitle2" gutterBottom fontWeight={800}>
                Live at {user?.country}
              </Typography>
            </Stack>
            <Stack direction="row" gap={2}>
              <Iconify icon="mdi:email" />
              <Typography variant="subtitle2" gutterBottom fontWeight={800}>
                {user?.email}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};
export default MediaKitCover;
