import React from 'react';

import { Box, Stack, Typography } from '@mui/material';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

const MediaKitSocialContent = () => (
  <Stack>
    <Stack direction="row" justifyContent="space-between">
      <Stack direction="row" alignItems="center" gap={2}>
        <Iconify icon="skill-icons:instagram" width={40} />
        <Typography variant="body1" fontWeight={600}>
          @John Doe
        </Typography>
      </Stack>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          color: (theme) => theme.palette.grey[600],
        }}
      >
        <Typography fontWeight={700}>Go to profile</Typography>
        <Iconify icon="ion:open-outline" />
      </Box>
    </Stack>
    <Stack direction="row" gap={2} overflow="scroll" mt={5}>
      <Image
        src="https://fastly.picsum.photos/id/13/2500/1667.jpg?hmac=SoX9UoHhN8HyklRA4A3vcCWJMVtiBXUg0W4ljWTor7s"
        sx={{
          minWidth: { xs: 400, md: 500 },
          height: { xs: 400, md: 500 },
          borderRadius: 2,
        }}
      />
      <Image
        src="https://fastly.picsum.photos/id/21/3008/2008.jpg?hmac=T8DSVNvP-QldCew7WD4jj_S3mWwxZPqdF0CNPksSko4"
        sx={{
          minWidth: { xs: 400, md: 500 },
          height: { xs: 400, md: 500 },
          borderRadius: 2,
        }}
      />
      <Image
        src="https://fastly.picsum.photos/id/25/5000/3333.jpg?hmac=yCz9LeSs-i72Ru0YvvpsoECnCTxZjzGde805gWrAHkM"
        sx={{
          minWidth: { xs: 400, md: 500 },
          height: { xs: 400, md: 500 },
          borderRadius: 2,
        }}
      />
      <Image
        src="https://fastly.picsum.photos/id/26/4209/2769.jpg?hmac=vcInmowFvPCyKGtV7Vfh7zWcA_Z0kStrPDW3ppP0iGI"
        sx={{
          minWidth: { xs: 400, md: 500 },
          height: { xs: 400, md: 500 },
          borderRadius: 2,
        }}
      />
    </Stack>
  </Stack>
);

export default MediaKitSocialContent;
