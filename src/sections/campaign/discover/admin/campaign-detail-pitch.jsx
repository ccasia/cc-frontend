import React from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { Box, Card, Chip, Stack, IconButton, ListItemText } from '@mui/material';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

const CampaignDetailPitch = ({ pitches }) => (
  <Box display="grid" gridTemplateColumns="repeat(3,1fr)" gap={2}>
    {pitches &&
      pitches.map((pitch) => (
        <>
          {/* {JSON.stringify(pitch)} */}
          <Card
            sx={{
              p: 1.5,
            }}
          >
            <IconButton
              sx={{
                position: ' absolute',
                top: 0,
                right: 0,
              }}
            >
              <Iconify icon="fluent:open-12-filled" width={16} />
            </IconButton>
            <Stack direction="row" spacing={2}>
              <Image
                src="/test.jpeg"
                ratio="1/1"
                sx={{
                  borderRadius: 1,
                  width: 70,
                }}
              />
              <Stack spacing={1} alignItems="start">
                <ListItemText
                  primary={pitch?.user?.name}
                  secondary={`Pitch at ${dayjs(pitch?.createdAt).format('LL')}`}
                  primaryTypographyProps={{
                    typography: 'subtitle1',
                  }}
                />
                <Chip label={pitch?.type} size="small" color="secondary" />
              </Stack>
            </Stack>
          </Card>
        </>
      ))}
  </Box>
);

export default CampaignDetailPitch;

CampaignDetailPitch.propTypes = {
  pitches: PropTypes.array,
};
