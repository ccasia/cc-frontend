import dayjs from 'dayjs';
import { useEffect } from 'react';
import PropTypes from 'prop-types';

import { Box, Stack, Avatar, Typography, ButtonBase } from '@mui/material';

import { useSubmissionComments } from 'src/hooks/use-submission-comments';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import { parseTimestamp, getCommentVideoId } from '../utils';
import {
  playFromFeedback,
  useCreatorSubmissionsStore,
} from '../../store/use-creator-submissions-store';

const COMMENT_EVENTS = [
  'v4:comment:added',
  'v4:comment:reply:added',
  'v4:comment:updated',
  'v4:comment:deleted',
];

export function TimestampChip({ timestamp, onClick }) {
  return (
    <ButtonBase
      component="span"
      onClick={onClick}
      disabled={!onClick}
      sx={{
        mr: 0.75,
        px: 0.75,
        py: 0.125,
        borderRadius: 0.75,
        fontFamily: 'monospace',
        fontSize: 11.5,
        fontWeight: 600,
        color: '#1304FF',
        bgcolor: '#EDEBFF',
        verticalAlign: 'baseline',
        '&:hover': onClick ? { bgcolor: '#DCD8FF' } : undefined,
      }}
    >
      {timestamp}
    </ButtonBase>
  );
}

TimestampChip.propTypes = {
  timestamp: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

function CommentItem({ comment, isReply = false }) {
  const isCreatorComment = comment.user?.role === 'creator';

  return (
    <Stack direction="row" gap={1.125} sx={{ pl: isReply ? 4 : 0 }}>
      <Avatar
        src={comment.user?.photoURL}
        alt={comment.user?.name}
        sx={{ width: 24, height: 24, fontSize: 10 }}
      >
        {comment.user?.name?.[0]}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" alignItems="center" gap={0.75}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{comment.user?.name}</Typography>
          <Typography sx={{ fontSize: 12, color: '#9A9AA2' }}>
            {dayjs(comment.createdAt).format('D MMM, h:mm A')}
          </Typography>
          {/* Admin comments reach the creator when the submission is sent back to them */}
          {!isCreatorComment && !comment.isSentToCreator && (
            <Typography sx={{ ml: 'auto', fontSize: 11, color: '#9A9AA2' }}>
              Not sent yet
            </Typography>
          )}
        </Stack>
        <Typography
          sx={{
            fontSize: 13,
            lineHeight: 1.5,
            color: '#3C3C44',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {comment.timestamp && (
            <TimestampChip
              timestamp={comment.timestamp}
              onClick={() => playFromFeedback(parseTimestamp(comment.timestamp))}
            />
          )}
          {comment.text}
        </Typography>
      </Box>
    </Stack>
  );
}

CommentItem.propTypes = {
  comment: PropTypes.object.isRequired,
  isReply: PropTypes.bool,
};

// Read-only thread; new feedback is written in the review panel's "Your feedback" box
export default function ViewerComments({ submission }) {
  const { socket } = useSocketContext();
  const versionIndex = useCreatorSubmissionsStore((s) => s.versionIndex);
  const { comments, commentsLoading, commentsMutate } = useSubmissionComments(
    submission.id,
    getCommentVideoId(submission, versionIndex)
  );

  useEffect(() => {
    if (!socket) return undefined;

    const refresh = (data) => {
      if (data?.submissionId === submission.id) commentsMutate();
    };

    COMMENT_EVENTS.forEach((event) => socket.on(event, refresh));
    return () => COMMENT_EVENTS.forEach((event) => socket.off(event, refresh));
  }, [socket, submission.id, commentsMutate]);

  return (
    <Stack gap={1.5}>
      {!commentsLoading && !comments.length && (
        <Typography sx={{ fontSize: 13, color: '#9A9AA2' }}>No feedback yet.</Typography>
      )}

      {comments.map((comment) => (
        <Stack key={comment.id} gap={1}>
          <CommentItem comment={comment} />
          {comment.replies?.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

ViewerComments.propTypes = {
  submission: PropTypes.object.isRequired,
};
