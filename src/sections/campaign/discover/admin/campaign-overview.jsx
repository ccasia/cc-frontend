import React from 'react';
import PropTypes from 'prop-types';

import { SparkLineChart } from '@mui/x-charts';
import { Box, Card, Grid, Stack, Avatar, Typography } from '@mui/material';

import Label from 'src/components/label';
import EmptyContent from 'src/components/empty-content/empty-content';

const CampaignOverview = ({ campaign }) => {
  const generateRandomNumbers = (count) => {
    const randomNumbers = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < count; i++) {
      randomNumbers.push(Math.floor(Math.random() * 100)); // generates a random number between 0 and 99
    }
    return randomNumbers;
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <Box component={Card} p={3} flexGrow={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack gap={1}>
              <Typography variant="subtitle2">Applied Creator</Typography>
              <Typography variant="h4">{campaign?.pitch.length}</Typography>
            </Stack>
            <Box>
              <SparkLineChart
                plotType="bar"
                data={generateRandomNumbers(7)}
                height={50}
                width={50}
              />
            </Box>
          </Stack>
        </Box>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Box component={Card} p={3} flexGrow={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack gap={1}>
              <Typography variant="subtitle2">Shortlisted Creator</Typography>
              <Typography variant="h4">{campaign?.shortListedCreator?.length}</Typography>
            </Stack>
            <Box>
              <SparkLineChart
                plotType="bar"
                data={generateRandomNumbers(7)}
                height={50}
                width={50}
              />
            </Box>
          </Stack>
        </Box>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Box component={Card} p={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack gap={1}>
              <Typography variant="subtitle2">Filtered Creator</Typography>
              <Typography variant="h4">
                {campaign?.pitch.filter((i) => i.status === 'filtered').length}
              </Typography>
            </Stack>
            <Box>
              <SparkLineChart
                plotType="bar"
                data={generateRandomNumbers(7)}
                height={50}
                width={50}
              />
            </Box>
          </Stack>
        </Box>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Box component={Card} p={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack gap={1}>
              <Typography variant="subtitle2">Rejected Creator</Typography>
              <Typography variant="h4">
                {campaign?.pitch.filter((i) => i.status === 'rejected').length}
              </Typography>
            </Stack>

            <Box>
              <SparkLineChart
                plotType="bar"
                data={generateRandomNumbers(7)}
                height={50}
                width={50}
              />
            </Box>
          </Stack>
        </Box>
      </Grid>
      <Grid item xs={12} md={6}>
        <Box component={Card} p={3}>
          <Stack gap={2}>
            <Typography variant="subtitle2">Shortlisted Creators</Typography>
            {campaign?.shortListedCreator?.length ? (
              campaign?.shortListedCreator.map((item, index) => (
                <Stack key={item.id} direction="row" alignItems="center" spacing={2}>
                  <Label>{index + 1}</Label>
                  <Avatar src={item.creator.photoURL} />
                  <Typography variant="subtitle2">{item.creator.name}</Typography>
                </Stack>
              ))
            ) : (
              <EmptyContent title={"You haven't shortlisted any creator yet"} />
            )}
          </Stack>
        </Box>
      </Grid>
    </Grid>
  );
};
export default CampaignOverview;

CampaignOverview.propTypes = {
  campaign: PropTypes.object,
};
