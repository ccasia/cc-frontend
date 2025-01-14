import useSWR from 'swr';
import React, { useMemo } from 'react';

import { Box, Stack, Avatar, Typography } from '@mui/material';

import { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

const MediaKitPartnership = () => {
  const { user } = useAuthContext();
  const { data, isLoading } = useSWR(endpoints.creators.getPartnerships(user?.id), fetcher);

  const partnerships = useMemo(() => !isLoading && data?.shortlisted, [data, isLoading]);

  return (
    <Box mt={5}>
      {/* <Stack
        direction="row"
        alignItems="center"
        gap={5}
        justifyContent={{ xs: 'center', sm: 'start' }}
        flexWrap="wrap"
      >
        {partnerships?.map((item) => (
          <Stack
            spacing={1}
            alignItems="center"
            position="relative"
            sx={{
              px: 2,
              ':after': {
                content: "''",
                position: 'absolute',
                border: 1,
                height: '80%',
                top: '50%',
                transform: 'translateY(-50%)',
                borderColor: '#EBEBEB',
                right: 0,
              },
            }}
          >
            <Avatar
              key={item.id}
              src={item.campaign?.campaignBrief?.images[0]}
              sx={{
                width: 100,
                height: 100,
                border: 1,
                borderColor: '#EBEBEB',
              }}
            >
              {item?.campaign?.name?.slice(0, 1)}
            </Avatar>
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
              }}
            >
              {item?.campaign?.brand?.name ?? item?.campaign?.company?.name}
            </Typography>
          </Stack>
        ))}
      </Stack> */}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4,1fr)', md: 'repeat(6,1fr)' },
          rowGap: 2,
        }}
      >
        {!isLoading &&
          partnerships?.map((item) => (
            <Stack
              spacing={1}
              alignItems="center"
              position="relative"
              // sx={{
              //   '&::after': {
              //     content: '""',
              //     position: 'absolute',
              //     top: '50%',
              //     transform: 'translateY(-50%)',
              //     right: 0,
              //     height: '70%',
              //     width: '2px',
              //     backgroundColor: '#EBEBEB',
              //   },
              // }}
            >
              <Avatar
                key={item.id}
                src={item.campaign?.campaignBrief?.images[0]}
                sx={{
                  width: 100,
                  height: 100,
                  border: 1,
                  borderColor: '#EBEBEB',
                }}
              >
                {item?.campaign?.name?.slice(0, 1)}
              </Avatar>
              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                }}
              >
                {item?.campaign?.brand?.name ?? item?.campaign?.company?.name}
              </Typography>
            </Stack>
          ))}
      </Box>
    </Box>
  );
};

export default MediaKitPartnership;

// MediaKitPartnership.propTypes = {
//   partnerships: PropTypes.array,
// };
