/* eslint-disable react/prop-types */
import React from 'react';

import { deepOrange } from '@mui/material/colors';
import { Box, Stack, Avatar, useTheme, Typography } from '@mui/material';
import Label from 'src/components/label';

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
        <Avatar sx={{ bgcolor: deepOrange[500], width: 150, height: 150 }} src={user?.photoURL}>
          {user?.name?.charAt(0).toUpperCase()}
        </Avatar>
        <Typography variant="h2" color={theme.palette.text.primary} fontWeight={800}>
          {user?.name}
        </Typography>

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
            {user?.creator?.mediaKit?.about}
            {/* Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum, odio sequi aliquid
            obcaecati esse quidem quas eligendi quos minima voluptates? Hic tempore perferendis
            velit natus. */}
          </Typography>
          <Stack
            direction="row"
            gap={2}
            flexWrap="wrap"
            sx={{
              justifyContent: 'center',
            }}
          >
            {(() => {
              const interestsToUse =
                (user?.creator?.interests && user?.creator?.interests.length > 0)
                  ? user.creator.interests
                  : (user?.creator?.mediaKit?.interests ??
                    user?.user?.creator?.interests ??
                    []);

              const result = interestsToUse.map((elem, index) => {
                console.log('Element:', elem);
                return (
                  <Label key={`interest-${index}`}>
                    {typeof elem === 'string' ? elem : elem?.name ?? 'Unnamed Interest'}
                  </Label>
                );
              });

              return result.length > 0 ? result : "No Interests";
            })()}
          </Stack>
          <Stack
            direction={{ sm: 'row' }}
            justifyContent="space-evenly"
            alignItems="center"
            spacing={2}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon="mingcute:location-fill" />
              <Typography variant="subtitle2" fontWeight={800}>
                Live at {user?.country}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon="mdi:email" />
              <Typography variant="subtitle2" fontWeight={800}>
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
