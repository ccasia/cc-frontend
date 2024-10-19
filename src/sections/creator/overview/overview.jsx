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
            {!isLoading &&
              data.map((item, index) => (
                <Card sx={{ p: 2 }} key={index}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
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
                    <Typography variant="subtitle2" color="text.secondary">
                      {item.completed}% Completed
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
              ))}
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
