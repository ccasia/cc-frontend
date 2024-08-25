import React from 'react';
import PropTypes from 'prop-types';

import { PieChart } from '@mui/x-charts';
import { Box, Card, Grid, Stack, Typography } from '@mui/material';

const OverView = ({ campaign }) => {
  // const generateRandomNumbers = (count) => {
  //   const randomNumbers = [];
  //   // eslint-disable-next-line no-plusplus
  //   for (let i = 0; i < count; i++) {
  //     randomNumbers.push(Math.floor(Math.random() * 100)); // generates a random number between 0 and 99
  //   }
  //   return randomNumbers;
  // };

  const data = [{ label: 'Group A', value: 100 }];
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <Box component={Card} p={3} flexGrow={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack gap={1}>
              <Typography variant="subtitle2">Task Completion Rate</Typography>
              <Typography variant="h4">{campaign?.pitch.length}</Typography>
            </Stack>
            <Box>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <PieChart
                  series={[
                    {
                      innerRadius: 20,
                      outerRadius: 30,
                      data,
                    },
                  ]}
                  margin={{ right: 5 }}
                  height={60}
                  width={60}
                  legend={{ hidden: true }}
                />

                <Typography
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontWeight: 'bold',
                  }}
                  variant="caption"
                  color="text.secondary"
                >
                  45%
                </Typography>
              </Box>
              {/* <SparkLineChart
                plotType="bar"
                data={generateRandomNumbers(7)}
                height={50}
                width={50}
              /> */}
            </Box>
          </Stack>
        </Box>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Box component={Card} p={3} flexGrow={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack gap={1}>
              <Typography variant="subtitle2">Performance</Typography>
              <Typography variant="h4">{campaign?.pitch.length}</Typography>
            </Stack>
            <Box>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <PieChart
                  series={[
                    {
                      innerRadius: 20,
                      outerRadius: 30,
                      data,
                    },
                  ]}
                  margin={{ right: 5 }}
                  height={60}
                  width={60}
                  legend={{ hidden: true }}
                />

                <Typography
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontWeight: 'bold',
                  }}
                  variant="caption"
                  color="text.secondary"
                >
                  10%
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Box>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Box component={Card} p={3} flexGrow={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack gap={1}>
              <Typography variant="subtitle2">Task Completion Rate</Typography>
              <Typography variant="h4">{campaign?.pitch.length}</Typography>
            </Stack>
            <Box>
              <PieChart
                series={[
                  {
                    innerRadius: 20,
                    outerRadius: 30,
                    data,
                  },
                ]}
                margin={{ right: 5 }}
                height={60}
                width={60}
                legend={{ hidden: true }}
              />
            </Box>
          </Stack>
        </Box>
      </Grid>
    </Grid>
  );
};

export default OverView;

OverView.propTypes = {
  campaign: PropTypes.object,
};
