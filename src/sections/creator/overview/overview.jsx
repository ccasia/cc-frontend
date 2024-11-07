import React from 'react';

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
import { useNotification } from 'src/components/popup/popup-provider';

const Overview = () => {
  const { user } = useAuthContext();
  const { data, isLoading } = useGetOverview();

  const { notifications, bool, test } = useNotification();

  const renderOverview = (
    <Grid container spacing={2}>
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
              secondary={data?.length}
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

            {!isLoading && data.length < 1 ? (
              <Typography textAlign="center" variant="subtitle2" color="text.secondary">
                No campaigns found
              </Typography>
            ) : (
              data?.slice(0, 3).map((item, index) => (
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
              ))
            )}
          </Stack>

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
              secondary="11"
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

          <Typography textAlign="center" py={2}>
            In development...
          </Typography>
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

      {renderOverview}
    </Container>
  );
};

export default Overview;
