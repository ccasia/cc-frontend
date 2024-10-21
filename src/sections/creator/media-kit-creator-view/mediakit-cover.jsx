/* eslint-disable react/prop-types */
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

import { deepOrange } from '@mui/material/colors';
import { Box, Stack, Avatar, useTheme, Typography, useMediaQuery } from '@mui/material';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

const MediaKitCover = ({ user }) => {
  const theme = useTheme();
  const mediaKitData = user?.creator?.mediaKit || user?.user || user || {};
  const { name } = mediaKitData;

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const encodedBackgroundUrl = useMemo(() => {
    const backgroundURL = user?.photoBackgroundURL || user?.user?.photoBackgroundURL;
    if (backgroundURL) {
      // Split the URL at the last '/'
      const parts = backgroundURL.split('/');
      // Encode only the filename part
      const encodedFilename = encodeURIComponent(parts.pop());
      // Join the URL back together
      return [...parts, encodedFilename].join('/');
    }
    return null;
  }, [user?.photoBackgroundURL, user?.user?.photoBackgroundURL]);

  return (
    <Box sx={{ pt: 5, pl: 0, pr: 0, pb: 5 }}>
      <Stack direction="column" alignItems="center" gap={1}>
        <Box
          key={user?.photoBackgroundURL}
          sx={{
            position: 'relative',
            paddingTop: '25%', // 
            width: '100%',
            backgroundImage: encodedBackgroundUrl ? `url("${encodedBackgroundUrl}")` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: theme.palette.background.default, // Fallback color
            borderRadius: '1rem',
            mb: '85px', // Adjusted to accommodate the avatar
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '1rem',
              // backgroundColor: alpha(theme.palette.background.default, 0.2),
            },
          }}
        >
          <Avatar
            sx={{
              bgcolor: deepOrange[500],
              width: 170,
              height: 170,
              border: `6px solid ${theme.palette.background.paper}`,
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translate(-50%, 50%)',
              boxShadow: theme.shadows[3],
            }}
            src={user?.photoURL || user?.user?.photoURL}
          >
            {user?.name?.[0] || 'N'}
          </Avatar>
        </Box>
        <Typography variant="h2" color={theme.palette.text.primary} fontWeight={800}>
          {name || user?.name}
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

            const result = interestsToUse.map((elem, index) => (
                <Label key={`interest-${index}`}>
                  {typeof elem === 'string' ? elem : elem?.name ?? 'Unnamed Interest'}
                </Label>
              ));

            return result.length > 0 ? result : "No Interests";
          })()}
        </Stack>
        <Stack gap={2}>
          <Typography
            gutterBottom
            variant="body1"
            maxWidth={500}
            textAlign="center"
            lineHeight={1.2}
            fontWeight={600}
            color={theme.palette.grey[600]}
            sx={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {user?.creator?.mediaKit?.about || user?.user?.creator?.mediaKit?.about || 'No about'}
          </Typography>
          <Stack
            direction={{ sm: 'row' }}
            justifyContent="space-evenly"
            alignItems="center"
            spacing={2}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon="mingcute:location-fill" />
              <Typography variant="subtitle2" fontWeight={800}>
                Live at {user?.country || user?.user.country}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon="mdi:email" />
              <Typography variant="subtitle2" fontWeight={800}>
                {user?.email || user?.user.email}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};

MediaKitCover.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    country: PropTypes.string,
    email: PropTypes.string,
    creator: PropTypes.shape({
      mediaKit: PropTypes.shape({
        name: PropTypes.string,
        interests: PropTypes.arrayOf(PropTypes.string),
        about: PropTypes.string,
      }),
      interests: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string,
        })
      ),
    }),
  }),
};
export default MediaKitCover;
