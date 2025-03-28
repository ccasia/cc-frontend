import { useCallback } from 'react';
import { Droppable, DragDropContext } from '@hello-pangea/dnd';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import { useSettingsContext } from 'src/components/settings';

import { moveTask, moveColumn, useGetBoard } from 'src/api/kanban';

import Scrollbar from 'src/components/scrollbar';

import KanbanColumn from '../kanban-column';
import KanbanColumnAdd from '../kanban-column-add';
// import { KanbanColumnSkeleton } from '../kanban-skeleton';

// ----------------------------------------------------------------------

export default function KanbanView() {
  const { board, boardLoading } = useGetBoard();

  const theme = useTheme();
  const settings = useSettingsContext();
  const status = board?.columns?.map((column) => column?.name);

  const onDragEnd = useCallback(
    async ({ destination, source, draggableId, type }) => {
      try {
        if (!destination) {
          return;
        }

        if (destination.droppableId === source.droppableId && destination.index === source.index) {
          return;
        }

        // Moving column
        if (type === 'COLUMN') {
          const newOrdered = [...board.columns];
          const columnToBeMove = board.columns.find((item) => item?.id === draggableId);
          const movedColumn = {
            columnToBeMove,
            newPosition: destination.index,
          };

          newOrdered.splice(source.index, 1);

          newOrdered.splice(destination.index, 0, columnToBeMove);

          moveColumn(movedColumn, newOrdered);

          return;
        }

        const sourceColumn = board?.columns.find((column) => column?.id === source.droppableId);

        const destinationColumn = board?.columns.find(
          (column) => column?.id === destination.droppableId
        );

        // Moving task to same list
        if (sourceColumn.id === destinationColumn.id) {
          const newTaskIds = [...sourceColumn.task];
          const newTaskInfo = newTaskIds.find((item) => item.id === draggableId);

          newTaskIds.splice(source.index, 1);

          newTaskIds.splice(destination.index, 0, newTaskInfo);

          const data = {
            columnId: sourceColumn.id,
            tasks: [...newTaskIds.map((item, index) => ({ ...item, position: index }))],
          };

          moveTask(data);

          console.info('Moving to same list!');

          return;
        }

        // Moving task to different list
        const sourceTasks = [...sourceColumn.task];
        const destinationTasks = [...destinationColumn.task];

        // Remove from source
        const removeSource = sourceTasks.splice(source.index, 1);

        // Insert into destination
        destinationTasks.splice(destination.index, 0, ...removeSource);

        const data = {
          type: 'differentColumn',
          sourceColumn: {
            id: sourceColumn.id,
            tasks: [...sourceTasks],
          },
          destinationColumn: {
            id: destinationColumn.id,
            tasks: destinationTasks,
          },
        };

        moveTask(data);

        console.info('Moving to different list!');
      } catch (error) {
        console.error(error);
      }
    },
    [board?.columns]
  );

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
            color: theme.palette.common.black,
            strokeLinecap: 'round',
          }}
        />
      </Box>
    );
  }

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Typography
        variant="h2"
        sx={{
          mb: 2,
          mt: { lg: 2, xs: 2, sm: 2 },
          fontFamily: theme.typography.fontSecondaryFamily,
          fontWeight: 'normal',
          pl: 2,
        }}
      >
        My Tasks ✏️
      </Typography>

      {!!board?.columns.length && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="board" type="COLUMN" direction="horizontal">
            {(provided) => (
              <Scrollbar
                sx={{
                  height: 1,
                  minHeight: {
                    xs: '80vh',
                    md: 'unset',
                  },
                }}
              >
                <Stack
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  direction="row"
                  divider={
                    <Divider orientation="vertical" flexItem 
                      sx={{ 
                        height: 'auto',
                        minHeight: {
                          xs: '80vh',
                          md: '65vh'
                        }
                      }} 
                    />
                  }
                  sx={{
                    p: 0,
                    height: '100%',
                    minHeight: '65vh',
                  }}
                >
                  {board.columns.map((item, index) => (
                    <Box 
                      key={item?.id}
                      sx={{ 
                        width: `${100 / board.columns.length}%`,
                        pl: index === 0 ? 0 : 2,
                        pr: 2,
                      }}
                    >
                      <KanbanColumn
                        index={index}
                        column={board.columns[item.position]}
                        tasks={item?.task.filter(
                          (a) => a?.name !== 'Final Draft' && a?.submission?.status !== 'NOT_STARTED'
                        )}
                        status={status}
                      />
                    </Box>
                  ))}

                  {provided.placeholder}
                </Stack>
              </Scrollbar>
            )}
          </Droppable>
        </DragDropContext>
      )}
      {!!board?.columns.length < 1 && <KanbanColumnAdd />}
    </Container>
  );
}
