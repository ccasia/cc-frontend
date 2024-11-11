/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import { useTheme } from '@emotion/react';
import { PDFViewer } from '@react-pdf/renderer';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Tab,
  Card,
  Tabs,
  Grid,
  Stack,
  alpha,
  Button,
  Avatar,
  Container,
  Typography,
  tabsClasses,
  ListItemText,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetSubmissions } from 'src/hooks/use-get-submission';
import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';
import { useGetCampaignById } from 'src/hooks/use-get-campaign-by-id';
import useGetInvoiceByCreatorAndCampaign from 'src/hooks/use-get-invoice-creator-camp';

import { _userAbout } from 'src/_mock';
import { bgGradient } from 'src/theme/css';
import { countries } from 'src/assets/data';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content/empty-content';

import InvoicePDF from 'src/sections/invoice/invoice-pdf';

import OverView from '../creator-stuff/overview';
import Submissions from '../creator-stuff/submissions';
import TimelineCreator from '../creator-stuff/timeline/view/page';
import LogisticView from '../creator-stuff/logistics/view/logistic-view';

const CampaignManageCreatorView = ({ id, campaignId }) => {
  const { data, isLoading } = useGetCreatorById(id);
  const [currentTab, setCurrentTab] = useState('profile');
  const { socket } = useSocketContext();
  const { campaign, campaignLoading } = useGetCampaignById(campaignId);
  const {
    data: submissions,
    isLoading: submissionLoading,
    mutate,
  } = useGetSubmissions(id, campaignId);
  const { invoice } = useGetInvoiceByCreatorAndCampaign(id, campaignId);

  // use get invoice by campaign id and creator id
  const theme = useTheme();
  const router = useRouter();

  const interests = data?.user?.creator?.interests;

  const phoneNumberHelper = (country, phoneNumber) => {
    if (!phoneNumber) {
      return;
    }
    const prefix = countries.filter((item) => item.label === country)[0].phone;
    // eslint-disable-next-line consistent-return
    return `+${prefix} ${phoneNumber}`;
  };

  const renderTabs = (
    <Tabs
      value={currentTab}
      onChange={(a, val) => setCurrentTab(val)}
      sx={{
        width: 1,
        bottom: 0,
        zIndex: 9,
        position: 'absolute',
        bgcolor: 'background.paper',
        [`& .${tabsClasses.flexContainer}`]: {
          pr: { md: 3 },
          justifyContent: {
            sm: 'center',
            md: 'flex-end',
          },
        },
      }}
    >
      <Tab
        value="profile"
        label="Profile"
        icon={<Iconify icon="flowbite:profile-card-outline" width={18} />}
      />
      {/* <Tab value="overview" label="Overview" /> */}
      <Tab value="submission" label="Submissions" />
      <Tab value="invoice" label="Invoice" />
      <Tab value="logistics" label="Logistics" />
      <Tab value="timeline" label="Timeline" />
    </Tabs>
  );

  const renderProfile = (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Stack gap={2}>
          <Box
            sx={{
              p: 3,
            }}
            component={Card}
          >
            <Typography variant="h6">About</Typography>
            <Stack gap={1.5} mt={2}>
              <Box display="inline-flex" alignItems="center" gap={1}>
                <Iconify icon="ic:baseline-email" width={20} color="text.secondary" />
                <Typography variant="subtitle2">{data?.user?.email}</Typography>
              </Box>
              <Box display="inline-flex" alignItems="center" gap={1}>
                <Iconify icon="ic:baseline-phone" width={20} color="text.secondary" />
                <Typography variant="subtitle2">
                  {phoneNumberHelper(data?.user?.country, data?.user?.phoneNumber)}
                </Typography>
              </Box>
              <Box display="inline-flex" alignItems="center" gap={1}>
                {/* <Iconify icon="material-symbols:globe" width={20} color="text.secondary" /> */}
                <Iconify icon={`twemoji:flag-${data?.user?.country.toLowerCase()}`} width={20} />
                <Typography variant="subtitle2">{data?.user?.country}</Typography>
              </Box>
            </Stack>
          </Box>
          <Card
            sx={{
              p: 3,
            }}
          >
            <Typography variant="h6">Social</Typography>
            <Stack gap={1.5} mt={2}>
              <Box display="inline-flex" alignItems="center" gap={1}>
                <Iconify icon="mdi:instagram" width={20} color="text.secondary" />
                <Typography variant="subtitle2">{data?.user?.creator?.instagram}</Typography>
              </Box>
              <Box display="inline-flex" alignItems="center" gap={1}>
                <Iconify icon="ic:baseline-tiktok" width={20} color="text.secondary" />
                <Typography variant="subtitle2">{data?.user?.creator?.tiktok}</Typography>
              </Box>
            </Stack>
          </Card>
        </Stack>
      </Grid>
      <Grid item xs={12} md={8}>
        <Box component={Card} sx={{ p: 2 }}>
          <Typography variant="h6">Interests</Typography>

          {/* List creator interests */}
          <Stack direction="row" justifyContent="space-evenly" mt={2} flexWrap="wrap" gap={1}>
            {!isLoading &&
              interests?.map((item) => (
                <Box
                  key={item.id}
                  p={3}
                  borderRadius={2}
                  border={1}
                  sx={{ boxShadow: `0px 5px 10px ${alpha(theme.palette.text.primary, 0.05)}` }}
                >
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{
                      variant: 'subtitle2',
                      fontWeight: 800,
                    }}
                  />
                </Box>
              ))}
          </Stack>
        </Box>
      </Grid>
    </Grid>
  );

  const shortlistedCreators = useMemo(
    () =>
      !campaignLoading && campaign?.shortlisted
        ? campaign.shortlisted.map((item, index) => ({ index, userId: item?.userId }))
        : [],
    [campaign, campaignLoading]
  );

  const currentIndex = shortlistedCreators.find((a) => a?.userId === id)?.index;

  useEffect(() => {
    if (socket) {
      socket.on('newSubmission', () => {
        mutate();
      });
    }

    return () => {
      socket?.off('newSubmission');
    };
  }, [socket, mutate]);

  return (
    <Container>
      <Button
        onClick={() => router.push(paths.dashboard.campaign.adminCampaignDetail(campaign?.id))}
        sx={{
          mb: 3,
        }}
        variant="contained"
        size="small"
      >
        All creators
      </Button>

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
              color: theme.palette.common.black,
              strokeLinecap: 'round',
            }}
          />
        </Box>
      )}

      {!campaignLoading && (
        <>
          <Card
            sx={{
              mb: 3,
              height: 290,
            }}
          >
            <Box
              sx={{
                ...bgGradient({
                  color: alpha(theme.palette.primary.darker, 0.8),
                  imgUrl: _userAbout?.coverUrl,
                }),
                height: 1,
                color: 'common.white',
              }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                sx={{
                  left: { md: 24 },
                  bottom: { md: 24 },
                  zIndex: { md: 10 },
                  pt: { xs: 6, md: 0 },
                  position: { md: 'absolute' },
                }}
              >
                <Avatar
                  alt={data?.user?.name}
                  src={data?.user?.photoURL}
                  sx={{
                    mx: 'auto',
                    width: { xs: 64, md: 128 },
                    height: { xs: 64, md: 128 },
                    border: `solid 2px ${theme.palette.common.white}`,
                  }}
                >
                  {data?.user?.name?.charAt(0).toUpperCase()}
                </Avatar>

                <ListItemText
                  sx={{
                    mt: 3,
                    ml: { md: 3 },
                    textAlign: { xs: 'center', md: 'unset' },
                  }}
                  primary={`${data?.user?.name?.charAt(0).toUpperCase()}${data?.user?.name.slice(1)}`}
                  secondary={data?.user?.creator?.pronounce}
                  primaryTypographyProps={{
                    typography: 'h3',
                    fontFamily: theme.typography.fontSecondaryFamily,
                  }}
                  secondaryTypographyProps={{
                    color: 'inherit',
                    component: 'span',
                    typography: 'body1',
                    sx: { opacity: 0.48 },
                    fontFamily: theme.typography.fontSecondaryFamily,
                  }}
                />
              </Stack>
            </Box>
            {renderTabs}
          </Card>

          {currentTab === 'profile' && renderProfile}
          {currentTab === 'overview' && <OverView campaign={campaign} />}

          {currentTab === 'submission' && (
            <Submissions campaign={campaign} submissions={submissions} creator={data} />
          )}
          {currentTab === 'logistics' && <LogisticView campaign={campaign} creator={data} />}

          {currentTab === 'invoice' && invoice ? (
            <PDFViewer width="100%" height={600} style={{ border: 'none', borderRadius: 10 }}>
              <InvoicePDF invoice={invoice} />
            </PDFViewer>
          ) : null}

          {currentTab === 'invoice' && !invoice ? (
            <EmptyContent
              title="No invoice found"
              description="This creator has not been invoiced yet."
            />
          ) : null}

          {currentTab === 'timeline' && <TimelineCreator campaign={campaign} creator={data} />}
        </>
      )}
    </Container>
  );
};

export default CampaignManageCreatorView;

CampaignManageCreatorView.propTypes = {
  id: PropTypes.string,
  campaignId: PropTypes.string,
};
