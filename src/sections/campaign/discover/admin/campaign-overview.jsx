import React from 'react';
import PropTypes from 'prop-types';

import { Box, Card, Grid, Stack, Avatar, Typography } from '@mui/material';

import Label from 'src/components/label';

const CampaignOverview = ({ campaign }) => (
  <Grid container spacing={2}>
    <Grid item xs={12} sm={6} md={3}>
      <Box component={Card} p={3} flexGrow={1}>
        <Stack gap={1}>
          <Typography variant="subtitle2">Applied Creator</Typography>
          <Typography variant="h4">{campaign?.Pitch.length}</Typography>
        </Stack>
      </Box>
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <Box component={Card} p={3} flexGrow={1}>
        <Stack gap={1}>
          <Typography variant="subtitle2">Shortlisted Creator</Typography>
          <Typography variant="h4">{campaign?.ShortListedCreator.length}</Typography>
        </Stack>
      </Box>
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <Box component={Card} p={3}>
        <Stack gap={1}>
          <Typography variant="subtitle2">Filtered Creator</Typography>
          <Typography variant="h4">
            {campaign?.Pitch.filter((i) => i.status === 'filtered').length}
          </Typography>
        </Stack>
      </Box>
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <Box component={Card} p={3}>
        <Stack gap={1}>
          <Typography variant="subtitle2">Rejected Creator</Typography>
          <Typography variant="h4">
            {campaign?.Pitch.filter((i) => i.status === 'rejected').length}
          </Typography>
        </Stack>
      </Box>
    </Grid>
    <Grid item xs={12} md={6}>
      <Box component={Card} p={3}>
        <Stack gap={2}>
          <Typography variant="subtitle2">Shortlisted Creators</Typography>
          {campaign?.ShortListedCreator.map((item, index) => (
            <Stack key={item.id} direction="row" alignItems="center" spacing={2}>
              <Label>{index + 1}</Label>
              <Avatar src={item.creator.photoURL} />
              <Typography variant="subtitle2">{item.creator.name}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Grid>
  </Grid>
);

export default CampaignOverview;

CampaignOverview.propTypes = {
  campaign: PropTypes.object,
};
