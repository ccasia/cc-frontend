import dayjs from 'dayjs';
import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Draggable } from '@hello-pangea/dnd';

import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, ListItemText } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { bgBlur } from 'src/theme/css';
import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function KanbanTaskItem({
  task,
  index,
  column,
  onDeleteTask,
  onUpdateTask,
  sx,
  ...other
}) {
  const theme = useTheme();
  const router = useRouter();
  const { user, role } = useAuthContext();

  const openDetails = useBoolean();

  const renderInfo = (
    <Stack direction="row" alignItems="center">
      <Stack
        flexGrow={1}
        direction="row"
        alignItems="center"
        sx={{
          typography: 'caption',
          color: 'text.disabled',
        }}
      >
        <Iconify width={16} icon="solar:chat-round-dots-bold" sx={{ mr: 0.25 }} />

        <Iconify width={16} icon="eva:attach-2-fill" sx={{ mr: 0.25 }} />
      </Stack>
    </Stack>
  );

  const isDue = useMemo(() => {
    const dueDate = task?.submission?.dueDate;

    if (dayjs(dueDate).add(2, 'day').isSame(dayjs(), 'D')) {
      return true;
    }

    if (column?.name?.includes('In Progress') && dayjs(dueDate).isBefore(dayjs(), 'D')) {
      return true;
    }

    return false;
  }, [task, column]);

  const isDone = useMemo(() => task?.submission?.status === 'APPROVED', [task]);
  const isChangesRequired = useMemo(() => task?.submission?.status === 'CHANGES_REQUIRED', [task]);

  return (
    <>
      <Draggable draggableId={task.id} index={index} isDragDisabled>
        {(provided, snapshot) => (
          <Paper
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            // onClick={openDetails.onTrue}
            onClick={() => {
              if (user?.role?.includes('admin') && role?.name === 'CSM') {
                router.push(
                  paths.dashboard.campaign.manageCreator(
                    task?.submission?.campaign?.id,
                    task?.submission?.userId,
                    { tabs: 'submission' }
                  )
                );
              } else {
                router.push(
                  paths.dashboard.campaign.creator.detail(task?.submission?.campaign?.id)
                );
              }
            }}
            sx={{
              width: 1,
              borderRadius: 1.5,
              overflow: 'hidden',
              position: 'relative',
              bgcolor: 'background.paper',
              boxShadow: theme.customShadows.z1,
              '&:hover': {
                boxShadow: theme.customShadows.z20,
                cursor: 'pointer',
              },
              ...(openDetails.value && {
                boxShadow: theme.customShadows.z20,
              }),
              ...(snapshot.isDragging && {
                boxShadow: theme.customShadows.z20,
                ...bgBlur({
                  opacity: 0.48,
                  color: theme.palette.background.default,
                }),
              }),
              ...sx,
            }}
            {...other}
          >
            <Stack sx={{ px: 2, py: 2.5, position: 'relative' }}>
              <ListItemText
                primary={task?.name}
                secondary={
                  task?.submission?.campaign && `Campaign ${task?.submission?.campaign?.name}`
                }
                primaryTypographyProps={{
                  variant: 'subtitle2',
                }}
              />
              {user?.role?.includes('admin') && (
                <Typography variant="caption" color="text.secondary" textAlign="end">
                  from {task?.submission?.user?.name}
                </Typography>
              )}
            </Stack>
            <Box
              sx={{
                position: 'absolute',
                top: 5,
                right: 0,
                bgcolor: 'inherit',
                px: 1,
              }}
            >
              {isDue && <Label color="error">Due</Label>}
              {isDone && <Label color="success">Done</Label>}
              {isChangesRequired && <Label color="warning">Changes Required</Label>}
            </Box>
          </Paper>
        )}
      </Draggable>

      {/* <KanbanDetails
        task={task}
        column={column}
        openDetails={openDetails.value}
        onCloseDetails={openDetails.onFalse}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        status={other.status}
      /> */}
    </>
  );
}

KanbanTaskItem.propTypes = {
  index: PropTypes.number,
  onDeleteTask: PropTypes.func,
  onUpdateTask: PropTypes.func,
  sx: PropTypes.object,
  column: PropTypes.object,
  task: PropTypes.object,
};

// When creator submit agreememt
// https://storage.googleapis.com/app-test-cult-cretive/agreement/cm2rs72h40044osu3z68jswa1.pdf?v=2024-10-30T07:28:46+00:00

// When creator submit first draft
// https://storage.googleapis.com/app-test-cult-cretive/FIRST_DRAFT/cm2t0viyv000z91g35fyfhfn1_draft.mp4?v=2024-10-30T07:34:12+00:00
