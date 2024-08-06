import dayjs from 'dayjs';
import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import React, { useEffect } from 'react';

import { Box, Card, Stack, Typography, ListItemText } from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineContent,
  TimelineConnector,
  TimelineSeparator,
  timelineItemClasses,
} from '@mui/lab';

import { useGetSubmissions } from 'src/hooks/use-get-submission';

import { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import CampaignAgreement from './campaign-agreement';

const defaultSubmission = [
  {
    name: 'Agreeement Submission',
    value: 'Agreement',
  },
  {
    name: 'First Draft Submission',
    value: 'First Draft',
  },
  {
    name: 'Final Draft Submission',
    value: 'Final Draft',
  },
  {
    name: 'Posting',
    value: 'Posting',
  },
];

const CampaignMyTasks = ({ campaign }) => {
  // const [preview, setPreview] = useState('');
  // const [loading, setLoading] = useState(false);
  // const [taskId, setTimelineId] = useState('');
  const { user } = useAuthContext();
  const { data: submissions } = useGetSubmissions(user.id, campaign?.id);

  const timeline = campaign?.campaignTimeline;

  const schema = Yup.object().shape({
    // draft: Yup.string().required(),
    caption: Yup.string().required(),
  });

  const getTimeline = (name) => timeline?.find((item) => item.name === name);

  useEffect(() => {
    const socket = io();
    socket.on('draft', () => {
      mutate(endpoints.campaign.draft.getFirstDraftForCreator(campaign.id));
    });
  }, [campaign]);

  return (
    <Box component={Card}>
      {campaign.status === 'PAUSED' ? (
        <Box p={20}>
          <Stack alignItems="center" justifyContent="center" spacing={2}>
            <Iconify icon="hugeicons:license-maintenance" width={50} />
            <Typography variant="h6" color="text.secondary">
              Campaign is under maintenance
            </Typography>
          </Stack>
        </Box>
      ) : (
        <Timeline
          sx={{
            [`& .${timelineItemClasses.root}:before`]: {
              flex: 0,
              padding: 0,
            },
          }}
        >
          {defaultSubmission.map((item, index) => (
            <TimelineItem>
              <TimelineSeparator>
                <Label sx={{ mt: 0.5 }}>{index + 1}</Label>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <ListItemText
                  primary={
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={1}
                      alignItems={{ md: 'center' }}
                      mb={2}
                    >
                      <Typography variant="subtitle2">{item.name}</Typography>
                      <Box flexGrow={1}>
                        <Label>{timeline.status}</Label>
                      </Box>
                      <Typography variant="caption">
                        Due: {dayjs(getTimeline(item.value)?.endDate).format('ddd LL')}
                      </Typography>
                    </Stack>
                  }
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.disabled',
                  }}
                />
                {item.value === 'Agreement' && (
                  <CampaignAgreement
                    campaign={campaign}
                    timeline={timeline}
                    submission={submissions?.filter((val) => val?.type === 'AGREEMENT')[0]}
                  />
                )}
                {/* {timeline.task === 'First Draft' && (
                  <CampaignFirstDraft
                    campaign={campaign}
                    timeline={timeline}
                    submission={submissions?.filter((item) => item?.type === 'FIRST_DRAFT')[0]}
                  />
                )}
                {timeline.task === 'Final Draft' && (
                  <CampaignFinalDraft
                    campaign={campaign}
                    timeline={timeline}
                    submission={submissions?.filter((item) => item?.type === 'FINAL_DRAFT')[0]}
                  />
                )} */}
              </TimelineContent>
            </TimelineItem>
          ))}
          {/* {campaign?.campaignTasks
            .sort((a, b) => dayjs(a.endDate).diff(dayjs(b.endDate)))
            .map((timeline, index) => (
              <TimelineItem>
                <TimelineSeparator>
                  <Label sx={{ mt: 0.5 }}>{index + 1}</Label>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <ListItemText
                    primary={
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={1}
                        alignItems={{ md: 'center' }}
                        mb={2}
                      >
                        <Typography variant="subtitle2">{timeline.task}</Typography>
                        <Box flexGrow={1}>
                          <Label>{timeline.status}</Label>
                        </Box>
                        <Typography variant="caption">
                          Due: {dayjs(timeline.endDate).format('ddd LL')}
                        </Typography>
                      </Stack>
                    }
                    secondaryTypographyProps={{
                      variant: 'caption',
                      color: 'text.disabled',
                    }}
                  />
                  {timeline.task === 'Agreement' && (
                    <CampaignAgreement
                      campaign={campaign}
                      timeline={timeline}
                      submission={submissions?.filter((item) => item?.type === 'AGREEMENT')[0]}
                    />
                  )}
                  {timeline.task === 'First Draft' && (
                    <CampaignFirstDraft
                      campaign={campaign}
                      timeline={timeline}
                      submission={submissions?.filter((item) => item?.type === 'FIRST_DRAFT')[0]}
                    />
                  )}
                  {timeline.task === 'Final Draft' && (
                    <CampaignFinalDraft
                      campaign={campaign}
                      timeline={timeline}
                      submission={submissions?.filter((item) => item?.type === 'FINAL_DRAFT')[0]}
                    />
                  )}
                </TimelineContent>
              </TimelineItem>
            ))} */}
        </Timeline>
      )}
    </Box>
  );
};

export default CampaignMyTasks;

CampaignMyTasks.propTypes = {
  campaign: PropTypes.object,
};
