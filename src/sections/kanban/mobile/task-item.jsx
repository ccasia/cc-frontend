import React from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { Box, Stack, Avatar, Divider, Typography, ListItemText } from '@mui/material';

import Iconify from 'src/components/iconify';

const dictionary = {
  Agreement: 'Sign Agreement Letter',
  'First Draft': 'Submit 1st Draft',
  'Final Draft': 'Submit 2nd Draft',
  Posting: 'Posting Link Submission',
};

const TaskItem = ({ task }) => {
  const isDue = dayjs().add(2, 'day').isAfter(task.submission.dueDate, 'date');

  return (
    <Box
      sx={{
        border: 1,
        borderColor: (theme) => theme.palette.divider,
        borderRadius: 1,
        p: 2,
        mt: 2,
      }}
    >
      <Stack direction="row" justifyContent="space-between">
        <ListItemText
          primary={dictionary[task.name]}
          secondary={`${task.submission.campaign.name} Campaign`}
        />
        <Avatar
          sx={{
            width: 30,
            height: 30,
          }}
          src={task.submission.campaign.campaignBrief.images[0]}
        >
          {task.submission.campaign.name}
        </Avatar>
      </Stack>
      <Divider sx={{ mt: 2 }} />

      <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary" py={2}>
        <Iconify icon="stash:user-avatar" width={16} />
        <Typography variant="caption" fontWeight={600}>
          {task.submission.campaign.company.name || task.submission.campaign.brand.name}
        </Typography>
      </Stack>
      <Divider />
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        color={isDue ? 'error.main' : 'text.secondary'}
        pt={2}
      >
        <Iconify icon="mdi:calendar" width={16} />
        <Typography variant="caption" fontWeight={600}>
          {dayjs(task.submission.dueDate).format('LL')}
        </Typography>
      </Stack>
    </Box>
  );
};

export default TaskItem;

TaskItem.propTypes = {
  task: PropTypes.object,
};
