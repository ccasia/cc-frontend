import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import React, { useEffect } from 'react';

import { Box, Card, Stack, Tooltip, Typography, ListItemText } from '@mui/material';
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

export const defaultSubmission = [
  {
    name: 'Agreeement Submission',
    value: 'Agreement',
    type: 'AGREEMENT_FORM',
  },
  {
    name: 'First Draft Submission',
    value: 'First Draft',
    type: 'FIRST_DRAFT',
  },
  {
    name: 'Final Draft Submission',
    value: 'Final Draft',
    type: 'FINAL_DRAFT',
  },
  {
    name: 'Posting',
    value: 'Posting',
    type: 'POSTING',
  },
];

const CampaignMyTasks = ({ campaign }) => {
  // const [preview, setPreview] = useState('');
  // const [loading, setLoading] = useState(false);
  // const [taskId, setTimelineId] = useState('');
  const { user } = useAuthContext();
  const { data: submissions } = useGetSubmissions(user.id, campaign?.id);

  const isSubmitted = (name) => {
    if (!submissions) return;
    // eslint-disable-next-line consistent-return
    return submissions.some((item) => item.submissionType.type === name);
  };

  const value = (name) => submissions?.find((item) => item.submissionType.type === name);

  const timeline = campaign?.campaignTimeline;

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
                      {value(item.type) && (
                        <Box flexGrow={1}>
                          {value(item.type)?.status === 'PENDING_REVIEW' && (
                            <Tooltip title="Pending Review">
                              <Label>
                                <Iconify icon="mdi:clock-outline" color="warning.main" width={18} />
                              </Label>
                            </Tooltip>
                          )}
                        </Box>
                      )}
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
                    submission={value(item.type)}
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
