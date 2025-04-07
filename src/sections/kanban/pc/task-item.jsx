import React from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { Draggable } from '@hello-pangea/dnd';

import { Box, Stack, Avatar, Divider, Typography, ListItemText } from '@mui/material';

import Iconify from 'src/components/iconify';

const dictionary = {
  Agreement: 'Sign Agreement Letter',
  'First Draft': 'Submit 1st Draft',
  'Final Draft': 'Submit 2nd Draft',
  Posting: 'Posting Link Submission',
};

const COLORS = {
    0: '#8A5AFE',
    1: '#1340FF',
    2: '#E3B100',
    3: '#1ABF66',
  };

const TaskItem = ({ task, index, columnIndex }) => {
  const isDue = dayjs().add(2, 'day').isAfter(task.submission.dueDate, 'date');
  const columnColor = COLORS[columnIndex % 4];

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            border: 1,
            borderBottom: 4,
            borderColor: (theme) => theme.palette.divider,
            borderRadius: 1,
            p: 2,
            mt: 0.5,
            bgcolor: 'background.paper',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: columnColor,
              borderBottom: 4,
              borderBottomColor: columnColor,
            //   boxShadow: `0 0 0 1px ${columnColor}`,
            },
          }}
        >
          <Stack direction="row" justifyContent="space-between" mt={-0.5}>
            <ListItemText
              primary={
                <Typography 
                  sx={{ 
                    color: '#231F20',
                    fontSize: '16px',
                    fontWeight: 600,
                  }}
                >
                  {dictionary[task.name]}
                </Typography>
              }
              secondary={
                <Typography 
                  sx={{ 
                    color: '#8E8E93',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {`${task.submission.campaign.name} Campaign`}
                </Typography>
              }
            />
            <Avatar
              sx={{
                width: 24,
                height: 24,
                border: 1,
                borderColor: '#EBEBEB',
              }}
              src={task.submission.campaign.campaignBrief.images[0]}
            >
              {task.submission.campaign.name}
            </Avatar>
          </Stack>
          <Divider sx={{ mt: 1 }} />

          <Stack direction="row" spacing={0.5} alignItems="center" color="#8E8E93" py={1}>
            <Box
              component="img"
              src="/assets/icons/components/ic_kanban_client.svg"
              sx={{
                width: 14,
                height: 14,
                // mr: 0.5,
              }}
            />
            <Typography variant="caption" fontWeight={500}>
              {task.submission.campaign.company?.name || task.submission.campaign.brand?.name}
            </Typography>
          </Stack>
          <Divider />
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            color={isDue ? 'error.main' : 'text.secondary'}
            pt={1}
          >
            <Box
              component="img"
              src="/assets/icons/components/ic_kanban_calendar.svg"
              sx={{
                width: 14,
                height: 14,
                // mr: 0.5,
              }}
            />
            <Typography variant="caption" fontWeight={500}>
              {dayjs(task.submission.dueDate).format('LL')}
            </Typography>
          </Stack>
        </Box>
      )}
    </Draggable>
  );
};

export default TaskItem;

TaskItem.propTypes = {
  task: PropTypes.object,
  index: PropTypes.number,
  columnIndex: PropTypes.number,
};