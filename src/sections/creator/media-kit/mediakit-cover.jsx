import React from 'react';

import { deepOrange } from '@mui/material/colors';
import { Box, Chip, Stack, Avatar, useTheme, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

const MediaKitCover = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        // height: 1,
        p: 5,
      }}
    >
      <Stack direction="column" alignItems="center" gap={2}>
        <Avatar sx={{ bgcolor: deepOrange[500], width: 150, height: 150 }}>N</Avatar>
        <Typography variant="h2" color={theme.palette.text.primary} fontWeight={800}>
          Afiq Danial
        </Typography>
        <Stack direction="row" gap={2}>
          <Chip
            label="Humor"
            sx={{
              borderRadius: 10,
              fontWeight: 800,
            }}
          />
          <Chip
            label="Lifestyle"
            sx={{
              borderRadius: 10,
              fontWeight: 800,
            }}
          />
          <Chip
            label="Toys"
            sx={{
              borderRadius: 10,
              fontWeight: 800,
            }}
          />
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
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum, odio sequi aliquid
            obcaecati esse quidem quas eligendi quos minima voluptates? Hic tempore perferendis
            velit natus.
          </Typography>
          <Stack direction={{ sm: 'row' }} justifyContent="space-evenly" alignItems="center">
            <Stack direction="row" gap={2}>
              <Iconify icon="mingcute:location-fill" />
              <Typography variant="subtitle2" gutterBottom fontWeight={800}>
                Live at Andorra
              </Typography>
            </Stack>
            <Stack direction="row" gap={2}>
              <Iconify icon="mdi:email" />
              <Typography variant="subtitle2" gutterBottom fontWeight={800}>
                test@gmail.com
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};
export default MediaKitCover;
