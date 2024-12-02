import { useCallback } from 'react';
import { Droppable, DragDropContext } from '@hello-pangea/dnd';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { moveTask, moveColumn, useGetBoard } from 'src/api/kanban';

import Scrollbar from 'src/components/scrollbar';

import KanbanColumn from '../kanban-column';
import KanbanColumnAdd from '../kanban-column-add';
import { KanbanColumnSkeleton } from '../kanban-skeleton';

// ----------------------------------------------------------------------

export default function KanbanView() {
  const { board, boardLoading } = useGetBoard();

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

  const renderSkeleton = (
    <Stack direction="row" alignItems="flex-start" spacing={3}>
      {[...Array(4)].map((_, index) => (
        <KanbanColumnSkeleton key={index} index={index} />
      ))}
    </Stack>
  );

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
        }}
      >
        My Tasks ✏️
      </Typography>

      {boardLoading && renderSkeleton}

      {/* {boardEmpty && (
        <EmptyContent
          filled
          title="No Data"
          sx={{
            py: 10,
            maxHeight: { md: 480 },
          }}
        />
      )} */}
      {/* <Box sx={{ maxHeight: '75vh', overflow: 'hidden' }}> */}
      {!!board?.columns.length && (
        <DragDropContext
          onDragEnd={onDragEnd}
          onDragStart={() => {
            console.log('start');
          }}
        >
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
                  spacing={3}
                  direction="row"
                  alignItems="flex-start"
                  sx={{
                    p: 0.25,
                    height: 1,
                  }}
                >
                  {board.columns.map((item, index) => (
                    <KanbanColumn
                      index={index}
                      key={item?.id}
                      column={board.columns[item.position]}
                      tasks={item?.task.filter(
                        (a) => a?.name !== 'Final Draft' && a?.submission?.status !== 'NOT_STARTED'
                      )}
                      status={status}
                    />
                  ))}

                  {provided.placeholder}

                  {/* <KanbanColumnAdd /> */}
                </Stack>
              </Scrollbar>
            )}
          </Droppable>
        </DragDropContext>
      )}
      {!!board?.columns.length < 1 && <KanbanColumnAdd />}
      {/* </Box> */}
    </Container>
  );
}
