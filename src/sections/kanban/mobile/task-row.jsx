import PropTypes from 'prop-types';

import { Box, Stack, Divider, Typography } from '@mui/material';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import TaskItem from './task-item';

const COLORS = {
  0: '#8A5AFE',
  1: '#1340FF',
  2: '#E3B100',
  3: '#1ABF66',
};

const TaskRow = ({ board }) => (
  <Box py={2}>
    <Stack spacing={1}>
      {board.columns.map((column, index) => (
        <Box key={column.id}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <Label
                sx={{
                  border: 1,
                  color: COLORS[index],
                  bgcolor: 'white',
                  boxShadow: `0px 2px 0 ${COLORS[index]}`,
                }}
              >
                {column.name}
              </Label>
              <Typography variant="caption" color="text.secondary">
                {column.task.length}
              </Typography>
            </Stack>
            <Iconify icon="tabler:dots" width={24} color="text.secondary" />
          </Stack>

          {!!column.task.length &&
            column.task
              .filter((c) => c.name !== 'Final Draft' && c.submission.status !== 'NOT_STARTED')
              .map((task) => <TaskItem task={task} />)}

          {index !== board.columns.length - 1 && <Divider sx={{ my: 2 }} />}
        </Box>
      ))}
    </Stack>
  </Box>
);

export default TaskRow;

TaskRow.propTypes = {
  board: PropTypes.object,
};
