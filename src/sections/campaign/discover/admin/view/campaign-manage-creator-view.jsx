/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useTheme } from '@emotion/react';

import {
  Box,
  Tab,
  Card,
  Tabs,
  Stack,
  alpha,
  Button,
  Avatar,
  Container,
  Typography,
  tabsClasses,
  ListItemText,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useGetSubmissions } from 'src/hooks/use-get-submission';
import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';
import { useGetCampaignById } from 'src/hooks/use-get-campaign-by-id';

import { _userAbout } from 'src/_mock';
import { bgGradient } from 'src/theme/css';
import { countries } from 'src/assets/data';

import Iconify from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';

import OverView from '../creator-stuff/overview';
import Agreement from '../creator-stuff/agreement';
import Submissions from '../creator-stuff/submissions';
import FirstDraft from '../creator-stuff/draft/first-draft';
import FinalDraft from '../creator-stuff/draft/final-draft';

const CampaignManageCreatorView = ({ id, campaignId }) => {
  const { data, isLoading } = useGetCreatorById(id);
  const [currentTab, setCurrentTab] = useState('profile');
  const { campaign, campaignLoading } = useGetCampaignById(campaignId);
  const { data: submissionData, /* isLoading: submissionLoading */ } = useGetSubmissions(id, campaignId);
  const theme = useTheme();
  const router = useRouter();

  const phoneNumberHelper = (country, phoneNumber) => {
    if (!phoneNumber) {
      return;
    }
    const prefix = countries.filter((item) => item.label === country)[0].phone;
    // eslint-disable-next-line consistent-return
    return `+${prefix} ${phoneNumber}`;
  };

  const agreement = submissionData?.filter((item) => item?.type === 'AGREEMENT_FORM')[0];
  const firstDraft = submissionData?.filter((item) => item?.type === 'FIRST_DRAFT')[0];
  const finalDraft = submissionData?.filter((item) => item?.type === 'FINAL_DRAFT')[0];

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
      <Tab value="overview" label="Overview" />
      <Tab value="submission" label="Submissions" />
      {/* <Tab
        icon={
          agreement?.campaignTask.status === 'PENDING_REVIEW' ? (
            <Iconify icon="material-symbols:pending-actions" color="warning.main" width={18} />
          ) : agreement?.campaignTask.status === 'COMPLETED' ? (
            <Iconify icon="hugeicons:tick-03" color="success.main" width={18} />
          ) : agreement?.campaignTask.status === 'CHANGES_REQUIRED' ? (
            <Iconify icon="mingcute:time-fill" width={18} />
          ) : agreement?.campaignTask.status === 'IN_PROGRESS' ? (
            <Iconify icon="mingcute:time-fill" width={18} />
          ) : null
        }
        value="agreement"
        label="Agreement"
      /> */}
      {/* <Tab
        value="firstDraft"
        label="First Draft"
        icon={
          firstDraft?.campaignTask.status === 'PENDING_REVIEW' ? (
            <Iconify icon="material-symbols:pending-actions" color="warning.main" width={18} />
          ) : firstDraft?.campaignTask.status === 'COMPLETED' ? (
            <Iconify icon="hugeicons:tick-03" color="success.main" width={18} />
          ) : firstDraft?.campaignTask.status === 'CHANGES_REQUIRED' ? (
            <Iconify icon="hugeicons:tick-03" color="success.main" width={18} />
          ) : firstDraft?.campaignTask.status === 'IN_PROGRESS' ? (
            <Iconify icon="pajamas:progress" width={18} />
          ) : (
            <Iconify icon="pajamas:progress" width={18} color="warning.main" />
          )
        }
      /> */}
      {/* <Tab
        value="finalDraft"
        label="Final Draft"
        icon={
          finalDraft?.campaignTask.status === 'PENDING_REVIEW' ? (
            <Iconify icon="material-symbols:pending-actions" color="warning.main" width={18} />
          ) : finalDraft?.campaignTask.status === 'COMPLETED' ? (
            <Iconify icon="hugeicons:tick-03" color="success.main" width={18} />
          ) : finalDraft?.campaignTask.status === 'CHANGES_REQUIRED' ? (
            <Iconify icon="hugeicons:tick-03" color="success.main" width={18} />
          ) : finalDraft?.campaignTask.status === 'IN_PROGRESS' ? (
            <Iconify icon="pajamas:progress" width={18} />
          ) : (
            <Iconify icon="pajamas:progress" width={18} color="warning.main" />
          )
        }
      /> */}

      <Tab value="logistics" label="Logistics" />
      <Tab value="timeline" label="Timeline" />
      {/* <Tab value="reminder" label="Reminder" /> */}
    </Tabs>
  );

  // const renderOverview = (
  //   <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
  //     <Box
  //       sx={{
  //         height: 150,
  //         p: 3,
  //       }}
  //       component={Card}
  //     >
  //       <Typography variant="h3">Draft</Typography>
  //     </Box>
  //   </Box>
  // );

  const renderProfile = (
    <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
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
    </Box>
  );

  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Button
          startIcon={<Iconify icon="material-symbols:arrow-back-ios" width={12} sx={{ ml: 1 }} />}
          onClick={() => router.back()}
          sx={{
            mb: 3,
          }}
        >
          Back
        </Button>
      </Stack>

      {isLoading && <LoadingScreen />}

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
                typography: 'h4',
              }}
              secondaryTypographyProps={{
                mt: 0.5,
                color: 'inherit',
                component: 'span',
                typography: 'body2',
                sx: { opacity: 0.48 },
              }}
            />
          </Stack>
        </Box>
        {renderTabs}
      </Card>
      {!campaignLoading && (
        <>
          {currentTab === 'profile' && renderProfile}
          {currentTab === 'overview' && <OverView campaign={campaign} />}
          {currentTab === 'agreement' && (
            <Agreement campaign={campaign} submission={agreement} user={data} />
          )}
          {currentTab === 'firstDraft' && (
            <FirstDraft campaign={campaign} submission={firstDraft} user={data} />
          )}
          {currentTab === 'finalDraft' && (
            <FinalDraft campaign={campaign} submission={finalDraft} user={data} />
          )}
          {currentTab === 'submission' && (
            <Submissions
              campaign={campaign}
              submissions={campaign?.campaignSubmissionRequirement}
              creator={data}
            />
          )}
        </>
      )}
      {/* {currentTab === 'draft' && renderDraft} */}
    </Container>
  );
};

export default CampaignManageCreatorView;

CampaignManageCreatorView.propTypes = {
  id: PropTypes.string,
  campaignId: PropTypes.string,
};
