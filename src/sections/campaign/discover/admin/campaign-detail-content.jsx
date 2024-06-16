import React from 'react';

import {
  Box,
  List,
  Stack,
  Divider,
  ListItem,
  Typography,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

const CampaignDetailContent = () => {
  const renderGallery = (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
      gap={1}
      mb={5}
    >
      <Image src="/test.jpeg" alt="test" ratio="1/1" sx={{ borderRadius: 2, cursor: 'pointer' }} />
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={1}>
        <Image
          src="/test.jpeg"
          alt="test"
          ratio="1/1"
          sx={{ borderRadius: 2, cursor: 'pointer' }}
        />
        <Image
          src="/test.jpeg"
          alt="test"
          ratio="1/1"
          sx={{ borderRadius: 2, cursor: 'pointer' }}
        />
        <Image
          src="/test.jpeg"
          alt="test"
          ratio="1/1"
          sx={{ borderRadius: 2, cursor: 'pointer' }}
        />
        <Image
          src="/test.jpeg"
          alt="test"
          ratio="1/1"
          sx={{ borderRadius: 2, cursor: 'pointer' }}
        />
      </Box>
    </Box>
  );

  const renderOverview = (
    <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
      <Stack direction="row" spacing={1} alignItems="start">
        <Iconify icon="mdi:clock" width={18} />
        <Stack>
          <ListItemText
            primary=" Durations"
            secondary="4 days 3 nights"
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="start">
        <Iconify icon="mdi:clock" width={18} />
        <Stack>
          <ListItemText
            primary=" Durations"
            secondary="4 days 3 nights"
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="start">
        <Iconify icon="mdi:clock" width={18} />
        <Stack>
          <ListItemText
            primary=" Durations"
            secondary="4 days 3 nights"
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="start">
        <Iconify icon="mdi:clock" width={18} />
        <Stack>
          <ListItemText
            primary=" Durations"
            secondary="4 days 3 nights"
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      </Stack>
    </Box>
  );

  const renderInformation = (
    <Stack spacing={5}>
      <Typography variant="h4">Campaign name</Typography>

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      {renderOverview}

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      <Stack direction="column">
        <Typography variant="h5">Objectives</Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <Iconify icon="octicon:dot-16" />
            </ListItemIcon>
            <ListItemText primary="Single-line item" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Iconify icon="octicon:dot-16" />
            </ListItemIcon>
            <ListItemText primary="Single-line item" />
          </ListItem>
        </List>
      </Stack>

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      <Stack direction="column">
        <Typography variant="h5">Campaign Do&apos;s</Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <Iconify icon="octicon:dot-16" />
            </ListItemIcon>
            <ListItemText primary="Single-line item" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Iconify icon="octicon:dot-16" />
            </ListItemIcon>
            <ListItemText primary="Single-line item" />
          </ListItem>
        </List>
      </Stack>

      <Stack direction="column">
        <Typography variant="h5">Campaign Dont&apos;s</Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <Iconify icon="octicon:dot-16" />
            </ListItemIcon>
            <ListItemText primary="Single-line item" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Iconify icon="octicon:dot-16" />
            </ListItemIcon>
            <ListItemText primary="Single-line item" />
          </ListItem>
        </List>
      </Stack>

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      <Stack>
        <Typography variant="h5">Campaign timeline</Typography>
      </Stack>
    </Stack>
  );

  return (
    <>
      {renderGallery}

      <Stack maxWidth={720} mx="auto" spacing={2}>
        {renderInformation}
      </Stack>
    </>
  );
};

export default CampaignDetailContent;
