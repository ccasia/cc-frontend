import React from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import {
  Box,
  List,
  Stack,
  Divider,
  ListItem,
  Typography,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Timeline,
  TimelineDot,
  TimelineItem,
  TimelineContent,
  TimelineConnector,
  TimelineSeparator,
  TimelineOppositeContent,
} from '@mui/lab';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

const CampaignDetailContent = ({ campaign }) => {
  const renderGallery = (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
      gap={1}
      mb={5}
    >
      <Image
        src={campaign?.campaignBrief?.images[0]}
        alt="test"
        ratio="1/1"
        sx={{ borderRadius: 2, cursor: 'pointer' }}
      />
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={1}>
        {campaign?.campaignBrief?.images.map((elem, index) => (
          <Image
            key={index}
            src={elem}
            alt="test"
            ratio="1/1"
            sx={{ borderRadius: 2, cursor: 'pointer' }}
          />
        ))}
      </Box>
    </Box>
  );

  const renderOverview = (
    <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
      <Stack direction="row" spacing={1} alignItems="start">
        <Iconify icon="mdi:clock" width={18} />
        <Stack>
          <ListItemText
            primary="Durations"
            secondary={`${dayjs(campaign?.campaignBrief?.startDate).format('LL')} - ${dayjs(campaign?.campaignBrief?.endDate).format('LL')}`}
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="start">
        <Iconify icon="mdi:clock" width={18} />
        <Stack>
          <ListItemText
            primary="Durations"
            secondary="4 days 3 nights"
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="start">
        <Iconify icon="mdi:clock" width={18} />
        <Stack>
          <ListItemText
            primary="Durations"
            secondary="4 days 3 nights"
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="start">
        <Iconify icon="mdi:clock" width={18} />
        <Stack>
          <ListItemText
            primary="Durations"
            secondary="4 days 3 nights"
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      </Stack>
    </Box>
  );

  // const formatDays = (days) => (days === 1 ? 'day' : 'days');

  const renderInformation = (
    <Stack spacing={5}>
      <Typography variant="h4">{campaign?.name}</Typography>

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      {renderOverview}

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      <Stack direction="column">
        <Typography variant="h5">Objectives</Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <Iconify icon="octicon:dot-16" />
            </ListItemIcon>
            <ListItemText primary="Single-line item" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Iconify icon="octicon:dot-16" />
            </ListItemIcon>
            <ListItemText primary="Single-line item" />
          </ListItem>
        </List>
      </Stack>

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      <Stack direction="column">
        <Typography variant="h5">Campaign Do&apos;s</Typography>
        <List>
          {campaign?.campaignBrief?.campaigns_do.map((item, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Iconify icon="octicon:dot-16" sx={{ color: 'success.main' }} />
              </ListItemIcon>
              <ListItemText primary={item.value} />
            </ListItem>
          ))}
        </List>
      </Stack>

      <Stack direction="column">
        <Typography variant="h5">Campaign Dont&apos;s</Typography>
        <List>
          {campaign?.campaignBrief?.campaigns_dont.map((item, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Iconify icon="octicon:dot-16" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText primary={item.value} />
            </ListItem>
          ))}
        </List>
      </Stack>

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      <Stack>
        <Typography variant="h5">Campaign timeline</Typography>
        {/* <Timeline position="alternate">
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {dayjs(campaign?.campaignBrief?.startDate).format('LL')}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Start Date</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.openForPitch ??
                campaign?.defaultCampaignTimeline?.openForPitch}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.openForPitch ??
                  campaign?.defaultCampaignTimeline?.openForPitch
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Open For Pitch</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.shortlistCreator ??
                campaign?.defaultCampaignTimeline?.shortlistCreator}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.shortlistCreator ??
                  campaign?.defaultCampaignTimeline?.shortlistCreator
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Shortlist Creator</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.firstDraft ??
                campaign?.defaultCampaignTimeline?.firstDraft}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.firstDraft ??
                  campaign?.defaultCampaignTimeline?.firstDraft
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>First Draft</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.finalDraft ??
                campaign?.defaultCampaignTimeline?.finalDraft}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.finalDraft ??
                  campaign?.defaultCampaignTimeline?.finalDraft
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Final Draft</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.feedBackFirstDraft ??
                campaign?.defaultCampaignTimeline?.feedBackFirstDraft}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.feedBackFirstDraft ??
                  campaign?.defaultCampaignTimeline?.feedBackFirstDraft
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Feedback First Draft</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.feedBackFinalDraft ??
                campaign?.defaultCampaignTimeline?.feedBackFinalDraft}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.feedBackFinalDraft ??
                  campaign?.defaultCampaignTimeline?.feedBackFinalDraft
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Feedback Final Draft</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.filterPitch ??
                campaign?.defaultCampaignTimeline?.filterPitch}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.filterPitch ??
                  campaign?.defaultCampaignTimeline?.filterPitch
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Filter Pitch</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.agreementSign ??
                campaign?.defaultCampaignTimeline?.agreementSign}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.agreementSign ??
                  campaign?.defaultCampaignTimeline?.agreementSign
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Agreement Sign</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.qc ?? campaign?.defaultCampaignTimeline?.qc}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.qc ?? campaign?.defaultCampaignTimeline?.qc
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>QC</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.posting ??
                campaign?.defaultCampaignTimeline?.posting}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.posting ??
                  campaign?.defaultCampaignTimeline?.posting
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Posting</TimelineContent>
          </TimelineItem>
        </Timeline> */}
        <Timeline>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              <Typography variant="caption">
                {dayjs(campaign?.campaignBrief?.startDate).format('ddd LL')}
              </Typography>
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2">Campaign Start Date</Typography>
            </TimelineContent>
          </TimelineItem>
          {campaign &&
            campaign?.campaignTimeline.map((timeline) => (
              <TimelineItem>
                <TimelineOppositeContent color="text.secondary">
                  <Typography variant="caption">
                    {/* {dayjs(timeline.startDate).format('ddd LL')} -{' '} */}
                    {dayjs(timeline.endDate).format('ddd LL')}
                  </Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="subtitle2">{timeline?.timeline_type}</Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              <Typography variant="caption">
                {dayjs(campaign?.campaignBrief?.endDate).format('ddd LL')}
              </Typography>
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              {/* <TimelineConnector /> */}
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2">Campaign End Date</Typography>
            </TimelineContent>
          </TimelineItem>
          {/* <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {dayjs(campaign?.campaignBrief?.startDate).format('LL')}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Start Date</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {dayjs(campaign?.campaignBrief?.startDate)
                .add(
                  campaign?.customCampaignTimeline?.openForPitch ??
                    campaign?.defaultCampaignTimeline?.openForPitch,
                  'day'
                )
                .format('LL')}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Open For Pitch</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {dayjs(campaign?.campaignBrief?.startDate)
                .add(
                  campaign?.customCampaignTimeline?.openForPitch ??
                    campaign?.defaultCampaignTimeline?.openForPitch,
                  'day'
                )
                .add(
                  campaign?.customCampaignTimeline?.filterPitch ??
                    campaign?.defaultCampaignTimeline?.filterPitch,
                  'day'
                )
                .format('LL')}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Filter Pitch</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {dayjs(campaign?.campaignBrief?.startDate)
                .add(
                  campaign?.customCampaignTimeline?.shortListCreator ??
                    campaign?.defaultCampaignTimeline?.filterPitch,
                  'day'
                )
                .format('LL')}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Shortlist Creator</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.firstDraft ??
                campaign?.defaultCampaignTimeline?.firstDraft}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.firstDraft ??
                  campaign?.defaultCampaignTimeline?.firstDraft
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>First Draft</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.finalDraft ??
                campaign?.defaultCampaignTimeline?.finalDraft}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.finalDraft ??
                  campaign?.defaultCampaignTimeline?.finalDraft
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Final Draft</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.feedBackFirstDraft ??
                campaign?.defaultCampaignTimeline?.feedBackFirstDraft}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.feedBackFirstDraft ??
                  campaign?.defaultCampaignTimeline?.feedBackFirstDraft
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Feedback First Draft</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.feedBackFinalDraft ??
                campaign?.defaultCampaignTimeline?.feedBackFinalDraft}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.feedBackFinalDraft ??
                  campaign?.defaultCampaignTimeline?.feedBackFinalDraft
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Feedback Final Draft</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.agreementSign ??
                campaign?.defaultCampaignTimeline?.agreementSign}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.agreementSign ??
                  campaign?.defaultCampaignTimeline?.agreementSign
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Agreement Sign</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.qc ?? campaign?.defaultCampaignTimeline?.qc}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.qc ?? campaign?.defaultCampaignTimeline?.qc
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>QC</TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {campaign?.customCampaignTimeline?.posting ??
                campaign?.defaultCampaignTimeline?.posting}{' '}
              {formatDays(
                campaign?.customCampaignTimeline?.posting ??
                  campaign?.defaultCampaignTimeline?.posting
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>Posting</TimelineContent>
          </TimelineItem> */}
        </Timeline>
      </Stack>
    </Stack>
  );

  return (
    <>
      {renderGallery}

      <Stack maxWidth={720} mx="auto" spacing={2}>
        {renderInformation}
      </Stack>
    </>
  );
};

export default CampaignDetailContent;

CampaignDetailContent.propTypes = {
  campaign: PropTypes.object,
};
