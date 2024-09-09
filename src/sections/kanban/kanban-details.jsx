import useSWR from 'swr';
import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import { Typography } from '@mui/material';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';

import { useBoolean } from 'src/hooks/use-boolean';
import { useGetSubmissions } from 'src/hooks/use-get-submission';

import { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Scrollbar from 'src/components/scrollbar';

import KanbanDetailsToolbar from './kanban-details-toolbar';
import CampaignAgreement from '../campaign/manage-creator/campaign-agreement';
import CampaignFirstDraft from '../campaign/manage-creator/campaign-first-draft';

// ----------------------------------------------------------------------

const StyledLabel = styled('span')(({ theme }) => ({
  ...theme.typography.caption,
  width: 100,
  flexShrink: 0,
  color: theme.palette.text.secondary,
  fontWeight: theme.typography.fontWeightSemiBold,
}));

const MAPPING = {
  AGREEMENT_FORM: 'Agreement Submission',
  FIRST_DRAFT: 'First Draft Submission',
  FINAL_DRAFT: 'Final Draft Submission',
  POSTING: 'Posting Submission',
};

// ----------------------------------------------------------------------

export default function KanbanDetails({
  task,
  openDetails,
  column,
  onCloseDetails,
  //
  onUpdateTask,
  onDeleteTask,
  ...other
}) {
  const [priority, setPriority] = useState(task?.priority);

  const { user } = useAuthContext();

  const { data, isLoading } = useSWR(
    endpoints.campaign.creator.getCampaign(task?.submission?.campaignId),
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnMount: true,
    }
  );

  const { data: submissions } = useGetSubmissions(user.id, task?.submission?.campaignId);

  const [taskName, setTaskName] = useState(task?.title);

  const like = useBoolean();

  const [taskDescription, setTaskDescription] = useState(task.description);

  const getDependency = useCallback(
    (submissionId) => {
      const isDependencyeExist = submissions?.find((item) => item.id === submissionId)
        ?.dependentOn[0];
      return isDependencyeExist;
    },
    [submissions]
  );

  const handleChangeTaskName = useCallback((event) => {
    setTaskName(event.target.value);
  }, []);

  const handleUpdateTask = useCallback(
    (event) => {
      try {
        if (event.key === 'Enter') {
          if (taskName) {
            onUpdateTask({
              ...task,
              name: taskName,
            });
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
    [onUpdateTask, task, taskName]
  );

  const handleChangeTaskDescription = useCallback((event) => {
    setTaskDescription(event.target.value);
  }, []);

  const handleChangePriority = useCallback((newValue) => {
    setPriority(newValue);
  }, []);

  const agreementStatus = user?.shortlisted?.find(
    (item) => item?.campaignId === task?.submission?.campaignId
  )?.isAgreementReady;

  const timeline = task?.submission?.campaign?.campaignTimeline;

  const renderHead = (
    <KanbanDetailsToolbar
      task={task}
      liked={like.value}
      column={column}
      taskName={task.name}
      onLike={like.onToggle}
      onDelete={onDeleteTask}
      taskStatus={task.status}
      onCloseDetails={onCloseDetails}
      status={other?.status}
    />
  );

  const renderName = (
    <Typography>{MAPPING[task?.submission?.submissionType?.type]}</Typography>
    // <KanbanInputName
    //   placeholder="Task name"
    //   value={taskName}
    //   onChange={handleChangeTaskName}
    //   onKeyUp={handleUpdateTask}
    // />
  );

  // const renderPriority = (
  //   <Stack direction="row" alignItems="center">
  //     <StyledLabel>Priority</StyledLabel>

  //     <KanbanDetailsPriority priority={priority} onChangePriority={handleChangePriority} />
  //   </Stack>
  // );

  const renderDescription = (
    <Stack direction="row">
      <StyledLabel>Description</StyledLabel>

      <TextField
        fullWidth
        multiline
        size="small"
        value={taskDescription}
        onChange={handleChangeTaskDescription}
        InputProps={{
          sx: { typography: 'body2' },
        }}
      />
    </Stack>
  );

  const renderSubmission = (
    <>
      {task?.name === 'Agreement' && (
        <CampaignAgreement
          campaign={!isLoading && data}
          timeline={timeline}
          submission={task?.submission}
          agreementStatus={agreementStatus}
        />
      )}
      {task?.name === 'First Draft' && (
        <CampaignFirstDraft
          campaign={!isLoading && data}
          timeline={timeline}
          fullSubmission={submissions}
          submission={task?.submission}
          getDependency={getDependency}
        />
      )}
    </>
  );

  return (
    <Drawer
      open={openDetails}
      onClose={onCloseDetails}
      anchor="right"
      slotProps={{
        backdrop: { invisible: true },
      }}
      PaperProps={{
        sx: {
          width: {
            xs: 1,
            sm: 480,
          },
        },
      }}
    >
      {renderHead}

      <Divider />

      <Scrollbar
        sx={{
          height: 1,
          '& .simplebar-content': {
            height: 1,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Stack
          spacing={3}
          sx={{
            pt: 3,
            pb: 5,
            px: 2.5,
          }}
        >
          {renderName}

          {/* {renderLabel} */}

          {/* {renderDueDate} */}

          {/* {renderPriority} */}
          {renderSubmission}
        </Stack>
      </Scrollbar>

      {/* <KanbanDetailsCommentInput /> */}
    </Drawer>
  );
}

KanbanDetails.propTypes = {
  onCloseDetails: PropTypes.func,
  onDeleteTask: PropTypes.func,
  onUpdateTask: PropTypes.func,
  openDetails: PropTypes.bool,
  task: PropTypes.object,
  column: PropTypes.object,
};
