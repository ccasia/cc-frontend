import React from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { Box, Paper, Stack, Divider, ListItemText } from '@mui/material';

import { fToNow } from 'src/utils/format-time';

const AllNotifications = ({ data }) => (
  <Stack spacing={2} divider={<Divider />}>
    {data
      ?.sort((a, b) => dayjs(b.notification.createdAt).diff(a.notification.createdAt, 'date'))
      ?.map((item) => (
        <Box component={Paper} key={item?.id} p={2}>
          <ListItemText
            primary={item.notification.message}
            primaryTypographyProps={{
              variant: 'subtitle2',
              marginBottom: 0.5,
            }}
            secondary={
              <Stack
                direction="row"
                alignItems="center"
                sx={{ typography: 'caption', color: 'text.disabled' }}
                divider={
                  <Box
                    sx={{
                      width: 2,
                      height: 2,
                      bgcolor: 'currentColor',
                      mx: 0.5,
                      borderRadius: '50%',
                    }}
                  />
                }
              >
                {fToNow(item.notification.createdAt)}
                {item.notification?.entity}
              </Stack>
            }
          />
        </Box>
      ))}
  </Stack>
);

export default AllNotifications;

AllNotifications.propTypes = {
  data: PropTypes.array,
};
