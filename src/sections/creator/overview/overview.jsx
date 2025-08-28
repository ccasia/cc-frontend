import dayjs from 'dayjs';
import React from 'react';

import {
  Box,
  Card,
  Grid,
  Stack,
  Avatar,
  Divider,
  Container,
  CardMedia,
  Typography,
  CardContent,
  ListItemText,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import useGetOverview from 'src/hooks/use-get-overview';

import { useAuthContext } from 'src/auth/hooks';
import resources from 'src/assets/resources/blogs.json';

import Image from 'src/components/image';
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

const Overview = () => {
  const { user } = useAuthContext();

  const { data, isLoading } = useGetOverview();

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
                letterSpacing: -1,
              }}
            />
          </Stack>

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
                      Last update: {item?.lastUpdate || 'N/A'}
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

                {/* Creator Academy Promotional Section */}
                <Box
                  sx={{
                    p: 1,
                  }}
                >
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box
                      component="a"
                      href="https://bit.ly/CreatorAcademybyCCandOA"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        flexShrink: 0,
                        width: 300,
                        height: 80,
                        borderRadius: 3,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    >
                      <Image
                        src="/assets/images/home/b0b60c98a5d1e3b63c69d2bb614bed427b04d118.png"
                        alt="Creator Academy"
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </Box>
                    <Stack spacing={0.5} sx={{ flex: 1 }}>
                      <Typography
                        variant="h3"
                        sx={{
                          fontFamily: 'Instrument Serif, serif',
                          fontWeight: 400,
                          color: '#000',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        From Content to Contentpreneur
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          fontFamily: 'Inter Display, sans-serif',
                          color: '#666',
                          fontWeight: 400,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Use code CCCCREATORS for 15% off!
                      </Typography>
                    </Stack>
                  </Stack>
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

  const renderResources = (
    <>
      <Typography
        sx={{
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          fontWeight: 400,
        }}
        variant="h2"
      >
        Resources
      </Typography>

      <Stack direction="row" spacing={2} overflow="auto" p={1}>
        {resources.map((resource) => (
          <Card
            key={resource.id}
            component="a"
            sx={{
              minWidth: 300,
              width: 300,
              position: 'relative',
              cursor: 'pointer',
              transition: 'all .2s linear',
              textDecoration: 'none',
              '&:hover': {
                outline: 2,
                outlineColor: 'green',
              },
            }}
            href={resource?.resource_link}
            target="__blank"
          >
            <CardMedia sx={{ height: 200 }} image={resource.image_link} title="green iguana" />
            <Label
              sx={{
                position: 'absolute',
                top: 20,
                left: 20,
                px: 2,
                py: 1,
                bgcolor: 'white',
                color: '#1340FF',
                fontSize: 14,
                fontFamily: (theme) => theme.typography.fontFamily,
              }}
              variant="filled"
            >
              {resource.tag.toUpperCase() || 'CREATIVE'}
            </Label>
            <CardContent>
              <Typography
                gutterBottom
                variant="subtitle1"
                sx={{
                  display: '-webkit-box',
                  overflow: 'hidden',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  textOverflow: 'ellipsis',
                  fontWeight: 'bold',
                  lineHeight: 1.4,
                }}
              >
                {resource.title}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {dayjs().format('ll')}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </>
  );

  if (isLoading) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
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
    );
  }

  return (
    <Container maxWidth="xl">
      <ListItemText
        primary={`Welcome to the Cult, ${user?.name?.split(' ')[0]} 👋`}
        secondary="Keep up the good work! Here’s what is relevant to you right now."
        primaryTypographyProps={{
          mt: { lg: 2, xs: 2, sm: 0 },
          variant: 'h2',
          fontWeight: 400,
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
        }}
        secondaryTypographyProps={{
          variant: 'body1',
          color: '#636366',
        }}
        sx={{
          mb: 3,
        }}
      />

      {!isLoading && renderOverview}

      {renderResources}

      {/* <CreatorForm open={isFormCompleted} onClose={() => setDialogOpen(false)} /> */}
    </Container>
  );
};

export default Overview;
