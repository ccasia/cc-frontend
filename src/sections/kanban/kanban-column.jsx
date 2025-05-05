import PropTypes from 'prop-types';
import { Droppable, Draggable } from '@hello-pangea/dnd';

import { Box, Stack, Typography } from '@mui/material';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import TaskItem from './pc/task-item';

const COLORS = {
  0: '#8A5AFE',
  1: '#1340FF',
  2: '#E3B100',
  3: '#1ABF66',
};

const columnDictionary = {
  'To Do': 'TO-DO',
  'In Progress': 'IN-PROGRESS',
  'In Review': 'IN-REVIEW',
  'Done': 'COMPLETED',
};

export default function KanbanColumn({ column, index, tasks }) {
  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided) => (
        <Box
          {...provided.draggableProps}
          ref={provided.innerRef}
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            p: 2,
            pt: 0,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" {...provided.dragHandleProps} mb={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Label
                sx={{
                  width: 'auto',
                  height: '32px',
                  border: 1,
                  borderRadius: 0.8,
                  fontWeight: 600,
                  fontSize: '14px',
                  p: 1,
                  color: COLORS[index % 4],
                  bgcolor: 'white',
                  boxShadow: `0px 2px 0 ${COLORS[index % 4]}`,
                }}
              >
                {columnDictionary[column.name] || column.name.toUpperCase()}
              </Label>
              <Typography variant="caption" color="#8E8E93" fontWeight={500} fontSize="16px" pl={1}>
                {tasks.length}
              </Typography>
            </Stack>
            <Iconify icon="tabler:dots" width={24} color="#636366" />
          </Stack>

          <Droppable droppableId={column.id} type="task">
            {(dropProvided) => (
              <Box
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                sx={{
                  width: '100%',
                  height: '100%',
                  overflowY: 'auto',
                  pb: 3,
                }}
              >
                {tasks.map((task, taskIndex) => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    index={taskIndex} 
                    columnIndex={index}
                  />
                ))}
                {dropProvided.placeholder}
              </Box>
            )}
          </Droppable>
        </Box>
      )}
    </Draggable>
  );
}

KanbanColumn.propTypes = {
  column: PropTypes.object,
  index: PropTypes.number,
  tasks: PropTypes.array,
};
