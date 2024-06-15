import React from 'react';

import { Box, Card, Stack, Typography } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import Label from 'src/components/label';

const CampaignList = () => {
  const smUp = useResponsive('up', 'sm');

  return (
    <Box
      gap={3}
      display="grid"
      gridTemplateColumns={{
        xs: 'repeat(1, 1fr)',
        md: 'repeat(2, 1fr)',
      }}
      mt={3}
    >
      <Card
        sx={{
          p: 2,
        }}
      >
        <Stack direction="row" gap={2}>
          <Box
            sx={{
              borderRadius: 2,
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Stack direction="row" justifyContent="space-between">
              <Label>Draft</Label>
              <Typography variant="caption" color="text.disabled">
                12 Jan 2023
              </Typography>
            </Stack>
            <Stack gap={1} flexGrow={1}>
              <Typography variant="subtitle2">
                The Future of Renewable Energy: Innovations and Challenges Ahead
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem
              </Typography>
            </Stack>
            <Typography>Test</Typography>
          </Box>
          {smUp && (
            <Box
              sx={{
                width: 180,
                height: 240,
                position: 'relative',
                flexShrink: 0,
                p: 1,
              }}
            >
              <img
                src="/public/test.jpeg"
                alt="test"
                width="100%"
                height="100%"
                style={{ borderRadius: 10 }}
              />
            </Box>
          )}
        </Stack>
      </Card>
      {/* <Box
        sx={{
          width: '100%',
          bgcolor: (theme) => theme.palette.background.paper,
          height: 300,
          borderRadius: 2,
        }}
      /> */}
    </Box>
  );
};

export default CampaignList;
