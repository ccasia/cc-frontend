import React from 'react';
import dayjs from 'dayjs';

import {
  Box,
  Card,
  Grid,
  Stack,
  Avatar,
  Divider,
  Container,
  Typography,
  ListItemText,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import useGetOverview from 'src/hooks/use-get-overview';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

const Overview = () => {
  const { user } = useAuthContext();
  const { data, isLoading } = useGetOverview();

  const renderOverview = (
    <Grid container spacing={2} pb={10}>
      <Grid item xs={12} md={6}>
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{
              p: 2,
            }}
          >
            <Avatar
              sx={{
                width: 50,
                height: 50,
                bgcolor: '#1340FF',
              }}
            >
              <Image src="/assets/icons/overview/total_campaigns.svg" />
            </Avatar>
            <ListItemText
              primary="TOTAL CAMPAIGNS"
              secondary={data?.adjustedCampaigns?.length}
              primaryTypographyProps={{
                variant: 'subtitle2',
                color: 'text.secondary',
                fontWeight: 'bold',
              }}
              secondaryTypographyProps={{
                variant: 'h4',
                fontWeight: 'bold',
                color: 'black',
                letterSpacing: -3,
              }}
            />
          </Stack>

          {/* <Divider /> */}

          <Stack
            spacing={1}
            sx={{
              p: 2,
            }}
          >
            {isLoading && (
              <Box
                sx={{
                  position: 'relative',
                  top: 200,
                  textAlign: 'center',
                }}
              >
                <CircularProgress
                  thickness={7}
                  size={25}
                  sx={{
                    color: (theme) => theme.palette.common.black,
                    strokeLinecap: 'round',
                  }}
                />
              </Box>
            )}

            {!isLoading && data?.adjustedCampaigns?.length < 1 ? (
              <Box
                sx={{
                  borderRadius: 2,
                  border: 1,
                  borderColor: '#EBEBEB',
                  p: 5,
                  textAlign: 'center',
                }}
              >
                <ListItemText
                  primary="No campaigns to show"
                  secondary="Click here to discover campaigns for you!"
                  primaryTypographyProps={{
                    variant: 'subtitle1',
                  }}
                  secondaryTypographyProps={{
                    variant: 'subtitle2',
                  }}
                />
              </Box>
            ) : (
              <>
                {data?.adjustedCampaigns?.slice(0, 3).map((item, index) => (
                  <Card
                    sx={{ p: 2, boxShadow: 'none', border: 1, borderColor: '#EBEBEB' }}
                    key={index}
                  >
                    <Stack
                      direction={{ sm: 'row' }}
                      alignItems={{ xs: 'start', sm: 'center' }}
                      justifyContent={{ sm: 'space-between' }}
                      gap={{ xs: 2, sm: 0 }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar src={item?.campaignImages[0]}>H</Avatar>
                        <ListItemText
                          primary={item?.campaignName}
                          secondary={item?.brand?.name}
                          primaryTypographyProps={{
                            variant: 'h6',
                            fontWeight: 'bold',
                            color: 'black',
                          }}
                          secondaryTypographyProps={{
                            variant: 'subtitle2',
                            color: 'text.secondary',
                          }}
                        />
                      </Stack>
                      <Box
                        sx={{
                          p: 0.5,
                          px: 1,
                          textAlign: 'center',
                          border: 1,
                          borderColor: '#EBEBEB',
                          borderRadius: 1,
                          boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {item?.completed > 0 && (
                            <CircularProgress
                              variant="determinate"
                              thickness={8}
                              value={parseInt(item?.completed, 10)}
                              size={20}
                              sx={{
                                ' .MuiCircularProgress-circle': {
                                  stroke: (theme) =>
                                    theme.palette.mode === 'dark'
                                      ? theme.palette.common.white
                                      : theme.palette.success.main,
                                  strokeLinecap: 'round',
                                },
                              }}
                            />
                          )}
                          <Typography variant="subtitle2" color="text.secondary">
                            {item?.completed}% Completed
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                    <Divider
                      sx={{
                        my: 2,
                      }}
                    />
                    <Typography variant="subtitle2" color="text.secondary">
                      Last update: Awaiting client approval.
                    </Typography>
                  </Card>
                ))}

                <Divider />

                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight="bolder"
                    component={RouterLink}
                    sx={{
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                    href={paths.dashboard.campaign.creator.manage}
                  >
                    SEE ALL CAMPAIGNS
                  </Typography>
                  <Iconify icon="ic:round-navigate-next" width={18} />
                </Box>
              </>
            )}
          </Stack>
        </Box>
      </Grid>

      <Grid item xs={12} md={6}>
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{
              p: 2,
            }}
          >
            <Avatar
              sx={{
                width: 50,
                height: 50,
                bgcolor: '#FF3500',
              }}
            >
              <Image src="/assets/icons/overview/total_tasks.svg" />
            </Avatar>
            <ListItemText
              primary="TOTAL TASKS"
              secondary={data?.tasks?.length}
              primaryTypographyProps={{
                variant: 'subtitle2',
                color: 'text.secondary',
                fontWeight: 'bold',
              }}
              secondaryTypographyProps={{
                variant: 'h4',
                fontWeight: 'bold',
                color: 'black',
                letterSpacing: -1,
              }}
            />
          </Stack>

          {/* <Divider /> */}

          <Stack
            spacing={1}
            sx={{
              p: 2,
            }}
          >
            {!isLoading && data?.tasks?.length < 1 ? (
              <Box
                sx={{
                  borderRadius: 2,
                  border: 1,
                  borderColor: '#EBEBEB',
                  p: 5,
                  textAlign: 'center',
                }}
              >
                <ListItemText
                  primary="No tasks to show"
                  secondary="Click here to discover campaigns for you!"
                  primaryTypographyProps={{
                    variant: 'subtitle1',
                  }}
                  secondaryTypographyProps={{
                    variant: 'subtitle2',
                  }}
                />
              </Box>
            ) : (
              <>
                {data?.tasks?.slice(0, 3).map((task) => (
                  <Card
                    sx={{ p: 2, boxShadow: 'none', border: 1, borderColor: '#EBEBEB' }}
                    key={task.id}
                  >
                    <Stack
                      direction={{ sm: 'row' }}
                      alignItems={{ xs: 'start', sm: 'center' }}
                      gap={1}
                    >
                      <Avatar
                        src={task?.campaign?.campaignBrief?.images[0]}
                        sx={{
                          border: 1,
                          borderColor: '#EBEBEB',
                        }}
                      >
                        H
                      </Avatar>
                      <Stack flexGrow={1}>
                        <Typography variant="subtitle2">{task.campaign.name}</Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Iconify
                            icon="material-symbols-light:calendar-clock"
                            color="text.secondary"
                          />
                          <Typography
                            sx={{
                              fontSize: 12,
                              fontWeight: 400,
                              color: 'text.secondary',
                            }}
                          >
                            {dayjs(task?.dueDate).format('D MMM')}
                          </Typography>
                        </Stack>
                      </Stack>
                      <Box
                        sx={{
                          py: 0.5,
                          px: 2,
                          border: 1,
                          borderRadius: 1,
                          borderColor: '#1340FF',
                          boxShadow: '0px -3px 0px 0px #1340FF inset',
                          color: '#1340FF',
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        {task?.task?.status}
                      </Box>
                    </Stack>
                  </Card>
                ))}
              </>
            )}
          </Stack>

          {/* <Typography textAlign="center" py={2}>
            In development...
          </Typography> */}
        </Box>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="xl">
      <ListItemText
        primary={`Welcome back, ${user?.name} 👋🏼`}
        secondary="Keep up the good work! Here’s what is relevant to you right now."
        primaryTypographyProps={{
          variant: 'h2',
          fontWeight: 400,
          fontFamily: 'InstrumentSerif',
          letterSpacing: 0.5,
        }}
        secondaryTypographyProps={{
          variant: 'body1',
          color: 'text.secondary',
        }}
        sx={{
          mb: 3,
        }}
      />

      {/* <Button onClick={() => test('asdsas')}>Open</Button> */}

      {/* <Divider
        sx={{
          my: 3,
        }}
      /> */}

      {isLoading && (
        <Box
          sx={{
            position: 'relative',
            top: 200,
            textAlign: 'center',
          }}
        >
          <CircularProgress
            thickness={7}
            size={25}
            sx={{
              color: (theme) => theme.palette.common.black,
              strokeLinecap: 'round',
            }}
          />
        </Box>
      )}

      {!isLoading && renderOverview}
    </Container>
  );
};

export default Overview;
