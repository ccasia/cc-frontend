import dayjs from 'dayjs';
import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Draggable } from '@hello-pangea/dnd';

import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import { Box, ListItemText } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { bgBlur } from 'src/theme/css';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

// submission page routes
// paths.dashboard.campaign.creator.detail({{ campaingId }})

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

  return (
    <>
      <Draggable draggableId={task.id} index={index} isDragDisabled>
        {(provided, snapshot) => (
          <Paper
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            // onClick={openDetails.onTrue}
            onClick={() =>
              router.push(paths.dashboard.campaign.creator.detail(task?.submission?.campaign?.id))
            }
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
            <Stack spacing={2} sx={{ px: 2, py: 2.5, position: 'relative' }}>
              <ListItemText
                primary={task?.name}
                secondary={task?.submission?.campaign?.name}
                primaryTypographyProps={{
                  variant: 'subtitle2',
                }}
              />
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

// {
//   "id": "cm2j77jl800142isdd5srg8bs",
//   "name": "Posting",
//   "description": null,
//   "status": "To Do",
//   "position": 3,
//   "priority": "",
//   "createdAt": "2024-10-21T15:55:40.107Z",
//   "dueDate": null,
//   "labels": [],
//   "columnId": "cm233yjg8000912cnenystfda",
//   "submissionId": "cm2j77jl800122isdysxw3g0g",
//   "submission": {
//       "id": "cm2j77jl800122isdysxw3g0g",
//       "content": "adsdasdasdasd",
//       "caption": null,
//       "campaignId": "cm2j5eb3u001pmzzniagky6xn",
//       "status": "APPROVED",
//       "createdAt": "2024-10-21T15:55:40.107Z",
//       "updatedAt": "2024-10-21T17:01:36.376Z",
//       "submissionDate": "2024-10-21T17:01:25.000Z",
//       "dueDate": "2024-11-22T00:00:00.000Z",
//       "userId": "cm233xksh000012cncofkwjo5",
//       "submissionTypeId": "cm1ep6esf000m2ble5r92thp5",
//       "isReview": true,
//       "startDate": null,
//       "endDate": null,
//       "feedback": [
//           {
//               "id": "cm2j9jv5g0001vr3kisvcv0r6",
//               "content": "idk man",
//               "type": "REASON",
//               "reasons": [],
//               "submissionId": "cm2j77jl800122isdysxw3g0g",
//               "adminId": "cm1egn6n8000957brgc4aiy4h",
//               "createdAt": "2024-10-21T17:01:15.508Z",
//               "updatedAt": "2024-10-21T17:01:15.508Z"
//           }
//       ],
//       "campaign": {
//           "id": "cm2j5eb3u001pmzzniagky6xn",
//           "name": "Find Your Greatness",
//           "description": "With Nike, you can find endless greatness.",
//           "status": "ACTIVE",
//           "createdAt": "2024-10-21T15:04:57.701Z",
//           "updatedAt": "2024-10-21T15:04:57.701Z",
//           "brandId": null,
//           "companyId": "cm1emzllp000q127f0zk54s0q",
//           "brandTone": "Gen Z",
//           "productName": "Nike - Find Your Greatness (Brand Awareness)",
//           "eventId": null,
//           "campaignTimeline": [
//               {
//                   "id": "cm2j5ebh80020mzznt3lf87eg",
//                   "name": "Open For Pitch",
//                   "createdAt": "2024-10-21T15:04:57.701Z",
//                   "updatedAt": "2024-10-21T15:04:57.701Z",
//                   "for": "creator",
//                   "description": null,
//                   "duration": 15,
//                   "startDate": "2024-10-21T00:00:00.000Z",
//                   "endDate": "2024-11-05T00:00:00.000Z",
//                   "campaignId": "cm2j5eb3u001pmzzniagky6xn",
//                   "order": 1,
//                   "status": "OPEN",
//                   "submissionTypeId": null
//               },
//               {
//                   "id": "cm2j5ebh90021mzznem89llld",
//                   "name": "Filter Pitch",
//                   "createdAt": "2024-10-21T15:04:57.701Z",
//                   "updatedAt": "2024-10-21T15:04:57.701Z",
//                   "for": "admin",
//                   "description": null,
//                   "duration": 2,
//                   "startDate": "2024-11-05T00:00:00.000Z",
//                   "endDate": "2024-11-07T00:00:00.000Z",
//                   "campaignId": "cm2j5eb3u001pmzzniagky6xn",
//                   "order": 2,
//                   "status": "OPEN",
//                   "submissionTypeId": null
//               },
//               {
//                   "id": "cm2j5ebh90022mzznzy954vi0",
//                   "name": "Shortlist Creator",
//                   "createdAt": "2024-10-21T15:04:57.701Z",
//                   "updatedAt": "2024-10-21T15:04:57.701Z",
//                   "for": "admin",
//                   "description": null,
//                   "duration": 2,
//                   "startDate": "2024-11-07T00:00:00.000Z",
//                   "endDate": "2024-11-09T00:00:00.000Z",
//                   "campaignId": "cm2j5eb3u001pmzzniagky6xn",
//                   "order": 3,
//                   "status": "OPEN",
//                   "submissionTypeId": null
//               },
//               {
//                   "id": "cm2j5ebh90023mzznnpwusx46",
//                   "name": "Agreement",
//                   "createdAt": "2024-10-21T15:04:57.701Z",
//                   "updatedAt": "2024-10-21T15:04:57.701Z",
//                   "for": "creator",
//                   "description": null,
//                   "duration": 1,
//                   "startDate": "2024-11-09T00:00:00.000Z",
//                   "endDate": "2024-11-10T00:00:00.000Z",
//                   "campaignId": "cm2j5eb3u001pmzzniagky6xn",
//                   "order": 4,
//                   "status": "OPEN",
//                   "submissionTypeId": "cm1ep6esf000n2blek5wieyl6"
//               },
//               {
//                   "id": "cm2j5ebha0024mzzniiqubfkq",
//                   "name": "First Draft",
//                   "createdAt": "2024-10-21T15:04:57.701Z",
//                   "updatedAt": "2024-10-21T15:04:57.701Z",
//                   "for": "creator",
//                   "description": null,
//                   "duration": 2,
//                   "startDate": "2024-11-10T00:00:00.000Z",
//                   "endDate": "2024-11-12T00:00:00.000Z",
//                   "campaignId": "cm2j5eb3u001pmzzniagky6xn",
//                   "order": 5,
//                   "status": "OPEN",
//                   "submissionTypeId": "cm1ep6esf000k2bleew9oei0f"
//               },
//               {
//                   "id": "cm2j5ebha0025mzznmyrgz7gd",
//                   "name": "Feedback First Draft",
//                   "createdAt": "2024-10-21T15:04:57.701Z",
//                   "updatedAt": "2024-10-21T15:04:57.701Z",
//                   "for": "admin",
//                   "description": null,
//                   "duration": 2,
//                   "startDate": "2024-11-12T00:00:00.000Z",
//                   "endDate": "2024-11-14T00:00:00.000Z",
//                   "campaignId": "cm2j5eb3u001pmzzniagky6xn",
//                   "order": 6,
//                   "status": "OPEN",
//                   "submissionTypeId": null
//               },
//               {
//                   "id": "cm2j5ebha0026mzznxw9kwnx3",
//                   "name": "Final Draft",
//                   "createdAt": "2024-10-21T15:04:57.701Z",
//                   "updatedAt": "2024-10-21T15:04:57.701Z",
//                   "for": "creator",
//                   "description": null,
//                   "duration": 2,
//                   "startDate": "2024-11-14T00:00:00.000Z",
//                   "endDate": "2024-11-16T00:00:00.000Z",
//                   "campaignId": "cm2j5eb3u001pmzzniagky6xn",
//                   "order": 7,
//                   "status": "OPEN",
//                   "submissionTypeId": "cm1ep6esf000l2ble0pks8a9a"
//               },
//               {
//                   "id": "cm2j5ebhb0027mzzn16qtgy5m",
//                   "name": "Feedback Final Draft",
//                   "createdAt": "2024-10-21T15:04:57.701Z",
//                   "updatedAt": "2024-10-21T15:04:57.701Z",
//                   "for": "admin",
//                   "description": null,
//                   "duration": 2,
//                   "startDate": "2024-11-16T00:00:00.000Z",
//                   "endDate": "2024-11-18T00:00:00.000Z",
//                   "campaignId": "cm2j5eb3u001pmzzniagky6xn",
//                   "order": 8,
//                   "status": "OPEN",
//                   "submissionTypeId": null
//               },
//               {
//                   "id": "cm2j5ebhb0028mzzn34ursvdm",
//                   "name": "QC",
//                   "createdAt": "2024-10-21T15:04:57.701Z",
//                   "updatedAt": "2024-10-21T15:04:57.701Z",
//                   "for": "admin",
//                   "description": null,
//                   "duration": 2,
//                   "startDate": "2024-11-18T00:00:00.000Z",
//                   "endDate": "2024-11-20T00:00:00.000Z",
//                   "campaignId": "cm2j5eb3u001pmzzniagky6xn",
//                   "order": 9,
//                   "status": "OPEN",
//                   "submissionTypeId": null
//               },
//               {
//                   "id": "cm2j5ebhc0029mzzna51c7mgf",
//                   "name": "Posting",
//                   "createdAt": "2024-10-21T15:04:57.701Z",
//                   "updatedAt": "2024-10-21T15:04:57.701Z",
//                   "for": "creator",
//                   "description": null,
//                   "duration": 2,
//                   "startDate": "2024-11-20T00:00:00.000Z",
//                   "endDate": "2024-11-22T00:00:00.000Z",
//                   "campaignId": "cm2j5eb3u001pmzzniagky6xn",
//                   "order": 10,
//                   "status": "OPEN",
//                   "submissionTypeId": "cm1ep6esf000m2ble5r92thp5"
//               }
//           ]
//       },
//       "submissionType": {
//           "id": "cm1ep6esf000m2ble5r92thp5",
//           "type": "POSTING",
//           "description": null
//       }
//   }
// }
