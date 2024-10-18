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
} from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

const Overview = () => {
  console.log('DASD');

  const { user } = useAuthContext();

  const renderOverview = (
    <Grid container mt={3} spacing={2}>
      <Grid item xs={12} md={6}>
        <Card>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              p: 2,
            }}
          >
            <Image src="/assets/icons/overview/total_campaigns.svg" />
            <ListItemText
              primary="TOTAL CAMPAIGNS"
              secondary="8"
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
          <Divider />
          <Stack
            spacing={1}
            sx={{
              p: 2,
            }}
          >
            <Card sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar>H</Avatar>
                  <ListItemText
                    primary="Sauz it"
                    secondary="A&W"
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
                <Typography variant="subtitle2" color="text.secondary">
                  82% Completed
                </Typography>
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
            <Card sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar>H</Avatar>
                  <ListItemText
                    primary="Sauz it"
                    secondary="A&W"
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
                <Typography variant="subtitle2" color="text.secondary">
                  82% Completed
                </Typography>
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
          </Stack>
          <Divider />
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight="bolder">
              SEE ALL CAMPAIGNS
            </Typography>
            <Iconify icon="ic:round-navigate-next" width={18} />
          </Box>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              p: 2,
            }}
          >
            <Image src="/assets/icons/overview/total_tasks.svg" />
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
                letterSpacing: -3,
              }}
            />
          </Stack>
          <Divider />
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="xl">
      <ListItemText
        primary={`Hi ${user?.name} 👋🏼`}
        secondary="Keep up the good work! Here’s what is relevant to you right now."
        primaryTypographyProps={{
          variant: 'h3',
        }}
        secondaryTypographyProps={{
          variant: 'body1',
          color: 'text.secondary',
        }}
      />

      {renderOverview}
    </Container>
  );
};

export default Overview;
