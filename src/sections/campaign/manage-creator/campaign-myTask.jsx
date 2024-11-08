import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import React, { useEffect, useCallback } from 'react';

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
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import CampaignPosting from './campaign-posting';
import CampaignAgreement from './campaign-agreement';
import CampaignFirstDraft from './campaign-first-draft';
import CampaignFinalDraft from './campaign-final-draft';

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

const CampaignMyTasks = ({ campaign, openLogisticTab }) => {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();

  const agreementStatus = user?.shortlisted?.find(
    (item) => item?.campaignId === campaign?.id
  )?.isAgreementReady;

  const { data: submissions, mutate: submissionMutate } = useGetSubmissions(user.id, campaign?.id);

  const getDueDate = (name) =>
    submissions?.find((submission) => submission?.submissionType?.type === name)?.dueDate;

  const value = (name) => submissions?.find((item) => item.submissionType.type === name);

  const timeline = campaign?.campaignTimeline;

  const getTimeline = (name) => timeline?.find((item) => item.name === name);

  const getDependency = useCallback(
    (submissionId) => {
      const isDependencyeExist = submissions?.find((item) => item.id === submissionId)
        ?.dependentOn[0];
      return isDependencyeExist;
    },
    [submissions]
  );

  useEffect(() => {
    socket?.on('draft', () => {
      mutate(endpoints.campaign.draft.getFirstDraftForCreator(campaign.id));
    });

    socket?.on('newFeedback', () => submissionMutate());

    return () => {
      socket?.off('draft');
      socket?.off('newFeedback');
    };
  }, [campaign, submissionMutate, socket]);

  return (
    <Box component={Card}>
      {campaign.status === 'PAUSED' ? (
        <Box p={20}>
          <Stack alignItems="center" justifyContent="center" spacing={2}>
            <Iconify icon="hugeicons:license-maintenance" width={50} />
            <Typography variant="h6" color="text.secondary">
              Campaign is currently under maintenance.
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
          {defaultSubmission.map((item, index) => {
            if (item.type === 'FINAL_DRAFT' && value('FIRST_DRAFT')?.status === 'APPROVED') {
              return null;
            }

            return (
              <TimelineItem key={index} id={item.type}>
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
                                  <Iconify
                                    icon="mdi:clock-outline"
                                    color="warning.main"
                                    width={18}
                                  />
                                </Label>
                              </Tooltip>
                            )}

                            {value(item.type)?.status === 'APPROVED' && (
                              <Tooltip title="Approved">
                                <Label color="success">
                                  <Iconify
                                    icon="hugeicons:tick-04"
                                    color="success.main"
                                    width={18}
                                  />
                                </Label>
                              </Tooltip>
                            )}

                            {value(item.type)?.status === 'CHANGES_REQUIRED' && (
                              <Tooltip title="Change Required">
                                <Label color="warning">
                                  <Iconify icon="uiw:warning" color="warning.main" width={18} />
                                </Label>
                              </Tooltip>
                            )}
                          </Box>
                        )}
                        <Typography variant="caption">
                          Due: {dayjs(getDueDate(item.type)).format('D MMMM, YYYY')}
                          {/* Due: {dayjs(getTimeline(item.value)?.endDate).format('D MMMM, YYYY')} */}
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
                      getDependency={getDependency}
                      agreementStatus={agreementStatus}
                    />
                  )}
                  {item.value === 'First Draft' && (
                    <CampaignFirstDraft
                      campaign={campaign}
                      timeline={timeline}
                      fullSubmission={submissions}
                      submission={value(item.type)}
                      getDependency={getDependency}
                      openLogisticTab={openLogisticTab}
                    />
                  )}
                  {item.value === 'Final Draft' && (
                    <CampaignFinalDraft
                      campaign={campaign}
                      timeline={timeline}
                      submission={value(item.type)}
                      fullSubmission={submissions}
                      getDependency={getDependency}
                    />
                  )}
                  {item.value === 'Posting' && (
                    <CampaignPosting
                      campaign={campaign}
                      timeline={timeline}
                      submission={value(item.type)}
                      fullSubmission={submissions}
                      getDependency={getDependency}
                    />
                  )}
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      )}
    </Box>
  );
};

export default CampaignMyTasks;

CampaignMyTasks.propTypes = {
  campaign: PropTypes.object,
  openLogisticTab: PropTypes.func,
};
