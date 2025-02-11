import React from 'react';

import { Box, Container, Typography, CircularProgress } from '@mui/material';

import { useGetBoard } from 'src/api/kanban';

import TaskRow from '../mobile/task-row';

const TaskView = () => {
  const { board, boardLoading } = useGetBoard();

  if (boardLoading) {
    return (
      <Box
        sx={{
          position: 'relative',
          top: 200,
          textAlign: 'center',
        }}
      >
        <CircularProgress
          thickness={7}
          size={25}
          sx={{
            color: (theme) => theme.palette.common.black,
            strokeLinecap: 'round',
          }}
        />
      </Box>
    );
  }

  return (
    <Container
      maxWidth={false}
      sx={{
        height: 1,
      }}
    >
      <Typography
        variant="h2"
        sx={{
          mb: 0.2,
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          fontWeight: 'normal',
        }}
      >
        My Tasks ✏️
      </Typography>
      {!!board?.columns.length && <TaskRow board={board} />}
    </Container>
  );
};

export default TaskView;
