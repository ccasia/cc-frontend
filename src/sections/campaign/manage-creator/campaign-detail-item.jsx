import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { Box, Tab, Tabs, Stack, ListItemText } from '@mui/material';
import {
  Timeline,
  TimelineDot,
  TimelineItem,
  TimelineContent,
  TimelineConnector,
  TimelineSeparator,
} from '@mui/lab';

import Image from 'src/components/image';

const CampaignDetailItem = ({ campaign }) => {
  const [currentTab, setCurrentTab] = useState('info');

  const renderGallery = (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
      gap={1}
      mt={2}
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

  const renderTabs = (
    <Tabs value={currentTab} onChange={(e, val) => setCurrentTab(val)} variant="scrollable">
      <Tab value="info" label="Campaign Info" />
      <Tab value="brief" label="Campaign Brief" />
      <Tab value="admin" label="Campaign Admin" />
      <Tab value="requirement" label="Campaign Requirement" />
      <Tab value="tasks" label="My Tasks" />
    </Tabs>
  );

  return (
    <Stack overflow="scroll" gap={2}>
      {renderGallery}
      {renderTabs}
      {currentTab === 'tasks' && (
        <Timeline>
          {campaign?.campaignTimelineTask
            .sort((a, b) => dayjs(a.endDate).diff(dayjs(b.endDate)))
            .map((timeline) => (
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineDot color={timeline.status === 'NOT_STARTED' && 'error'} />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <ListItemText
                    primary={timeline.task}
                    secondary={dayjs(timeline.endDate).format('ddd LL')}
                  />
                </TimelineContent>
              </TimelineItem>
            ))}
        </Timeline>
      )}
    </Stack>
  );
};

export default CampaignDetailItem;

CampaignDetailItem.propTypes = {
  campaign: PropTypes.object,
};
