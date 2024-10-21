import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import { SparkLineChart } from '@mui/x-charts';
import {
  Box,
  Card,
  Grid,
  Zoom,
  Stack,
  Table,
  Avatar,
  Button,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  Typography,
  TableContainer,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import EmptyContent from 'src/components/empty-content/empty-content';

const CampaignOverview = ({ campaign }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const generateRandomNumbers = (count) => {
    const randomNumbers = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < count; i++) {
      randomNumbers.push(Math.floor(Math.random() * 100)); // generates a random number between 0 and 99
    }
    return randomNumbers;
  };

  const handleChatClick = async (admin) => {
    try {
      const response = await axiosInstance.get(endpoints.threads.getAll);
      const existingThread = response.data.find((thread) => {
        const userIdsInThread = thread.UserThread.map((userThread) => userThread.userId);
        return (
          userIdsInThread.includes(user.id) &&
          userIdsInThread.includes(admin.user.id) &&
          !thread.isGroup
        );
      });

      if (existingThread) {
        navigate(`/dashboard/chat/thread/${existingThread.id}`);
      } else {
        const newThreadResponse = await axiosInstance.post(endpoints.threads.create, {
          title: `Chat between ${user.name} & ${admin.user.name}`,
          description: '',
          userIds: [user.id, admin.user.id],
          isGroup: false,
        });
        navigate(`/dashboard/chat/thread/${newThreadResponse.data.id}`);
      }
    } catch (error) {
      console.error('Error creating or finding chat thread:', error);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <Zoom in>
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
        </Zoom>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Zoom in>
          <Box component={Card} p={3} flexGrow={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack gap={1}>
                <Typography variant="subtitle2">Shortlisted Creator</Typography>
                <Typography variant="h4">{campaign?.shortlisted?.length}</Typography>
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
        </Zoom>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Zoom in>
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
        </Zoom>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Zoom in>
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
        </Zoom>
      </Grid>
      <Grid item xs={12} md={6}>
        <Zoom in>
          <Box component={Card} p={3}>
            <Stack gap={2}>
              <Typography variant="subtitle2">Shortlisted Creators</Typography>

              {campaign?.shortlisted?.length ? (
                campaign?.shortlisted.map((item, index) => (
                  <Stack key={item.id} direction="row" alignItems="center" spacing={2}>
                    <Label>{index + 1}</Label>
                    <Avatar src={item.user.photoURL} />
                    <Typography variant="subtitle2">{item.user.name}</Typography>
                  </Stack>
                ))
              ) : (
                <EmptyContent title="You haven't shortlisted any creator yet" />
              )}
            </Stack>
          </Box>
        </Zoom>
      </Grid>
      <Grid item xs={12} md={6}>
        <Zoom in>
          <Box component={Card} p={3}>
            <Stack gap={2}>
              <Typography variant="subtitle2">Assigned Account Manager</Typography>

              <TableContainer sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {campaign?.campaignAdmin?.length &&
                      campaign?.campaignAdmin?.map((elem) => (
                        <TableRow key={elem?.id}>
                          <TableCell>{elem?.admin?.user?.name}</TableCell>
                          <TableCell>{elem?.admin?.user?.email}</TableCell>
                          <TableCell>
                            {user.id === elem?.admin?.user?.id ? (
                              <Button
                                size="small"
                                variant="outlined"
                                disabled
                                sx={{
                                  color: 'text.disabled',
                                  borderColor: 'action.disabledBackground',
                                  bgcolor: 'action.disabledBackground',
                                  '&.Mui-disabled': {
                                    color: 'text.disabled',
                                    borderColor: 'action.disabledBackground',
                                  },
                                }}
                              >
                                You
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleChatClick(elem.admin)}
                              >
                                Chat
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </Box>
        </Zoom>
      </Grid>
    </Grid>
  );
};

export default CampaignOverview;

CampaignOverview.propTypes = {
  campaign: PropTypes.object,
};
