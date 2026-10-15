import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { Box, Stack, Typography, ButtonBase, CircularProgress } from '@mui/material';

import { useSubmissionComments } from 'src/hooks/use-submission-comments';

import { sectionLabelSx } from '../styles';
import useCaptionHistory from '../hooks/use-caption-history';
import {
  setHistoryTab,
  useCreatorSubmissionsStore,
} from '../../store/use-creator-submissions-store';

const formatHistoryTime = (date) => dayjs(date).format('D MMM YYYY, h:mm A');

const ROLE_LABEL = { client: 'Client', creator: 'Creator' };
const roleLabelOf = (user) => ROLE_LABEL[user?.role] ?? 'CS';

const groupByUpload = (comments, uploads = []) => {
  const groups = new Map(
    uploads.map((upload, index) => [
      upload.id,
      {
        key: upload.id,
        label: `Upload ${uploads.length - index}${index === 0 ? ' · Latest' : ''}`,
        comments: [],
      },
    ])
  );
  const groupFor = (key, label) => {
    if (!groups.has(key)) groups.set(key, { key, label, comments: [] });
    return groups.get(key);
  };

  comments.forEach((comment) => {
    let group = comment.videoId && groups.get(comment.videoId);
    if (!group && comment.videoId) group = groupFor('earlier', 'Earlier uploads');
    if (!group) group = groupFor('none', uploads.length ? 'Not tied to an upload' : null);
    group.comments.push(comment);
  });

  return [...groups.values()].filter((group) => group.comments.length);
};

// Where the comment stands: whether the creator has it, and whether it was resolved
const describeComment = (comment) => {
  const notes = [];
  if (comment.user?.role !== 'creator') {
    notes.push(comment.isSentToCreator ? 'Sent to creator' : 'Not sent to creator');
  }
  if (comment.resolvedAt || comment.resolvedByUserId) {
    notes.push(`Resolved${comment.resolvedBy?.name ? ` by ${comment.resolvedBy.name}` : ''}`);
  }
  return notes.join(' · ');
};

const entrySx = { p: 1.5, borderRadius: 1.25, border: '1px solid #EDEDF0' };

const emptySx = { py: 4, textAlign: 'center', fontSize: 13, color: '#9A9AA2' };

const timestampSx = {
  mr: 0.75,
  px: 0.5,
  borderRadius: 0.5,
  fontSize: 11.5,
  fontWeight: 600,
  color: '#1340FF',
  bgcolor: '#EEF1FF',
};

function CommentAuthor({ user, createdAt, size = 12.5 }) {
  return (
    <Stack direction="row" alignItems="baseline" gap={1}>
      <Typography
        sx={{
          fontSize: size,
          fontWeight: 600,
          color: user?.role === 'client' ? '#1304FF' : '#17171A',
        }}
      >
        {user?.name || roleLabelOf(user)}
        <Box component="span" sx={{ fontWeight: 400, color: '#8A8A92' }}>
          {' '}
          ({roleLabelOf(user)})
        </Box>
      </Typography>
      <Typography sx={{ ml: 'auto', fontSize: 11.5, color: '#8A8A92', textAlign: 'right' }}>
        {formatHistoryTime(createdAt)}
      </Typography>
    </Stack>
  );
}

CommentAuthor.propTypes = {
  user: PropTypes.object,
  createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  size: PropTypes.number,
};

function CommentText({ comment, size = 13 }) {
  return (
    <Typography
      sx={{ fontSize: size, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
    >
      {comment.timestamp && (
        <Box component="span" sx={timestampSx}>
          {comment.timestamp}
        </Box>
      )}
      {comment.text}
    </Typography>
  );
}

CommentText.propTypes = {
  comment: PropTypes.object.isRequired,
  size: PropTypes.number,
};

// Every comment thread on the submission, across all uploads, read-only
function CommentHistory({ submission }) {
  const { comments, commentsLoading } = useSubmissionComments(submission.id);

  if (commentsLoading) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={22} />
      </Box>
    );
  }
  if (!comments.length) return <Typography sx={emptySx}>No feedback yet.</Typography>;

  return (
    <Stack gap={2}>
      {groupByUpload(comments, submission.video).map((group) => (
        <Stack key={group.key} gap={1.25}>
          {group.label && (
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#6E6E76' }}>
              {group.label}
            </Typography>
          )}
          {group.comments.map((comment) => {
            const notes = describeComment(comment);
            return (
              <Stack key={comment.id} gap={0.75} sx={entrySx}>
                <CommentAuthor user={comment.user} createdAt={comment.createdAt} />
                <CommentText comment={comment} />
                {notes && <Typography sx={{ fontSize: 11.5, color: '#8A8A92' }}>{notes}</Typography>}
                {comment.replies?.length > 0 && (
                  <Stack gap={0.75} sx={{ mt: 0.5, pl: 1.5, borderLeft: '2px solid #EDEDF0' }}>
                    {comment.replies.map((reply) => (
                      <Stack key={reply.id} gap={0.25}>
                        <CommentAuthor user={reply.user} createdAt={reply.createdAt} size={11.5} />
                        <CommentText comment={reply} size={12.5} />
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Stack>
            );
          })}
        </Stack>
      ))}
    </Stack>
  );
}

CommentHistory.propTypes = {
  submission: PropTypes.object.isRequired,
};

function CaptionEdits({ submission }) {
  const { captionHistory, captionHistoryLoading } = useCaptionHistory(submission.id);

  if (captionHistoryLoading) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={22} />
      </Box>
    );
  }
  if (!captionHistory.length) {
    return <Typography sx={emptySx}>No caption changes yet.</Typography>;
  }

  return (
    <Stack gap={1.25}>
      {captionHistory.map((entry) => (
        <Stack key={entry.id} gap={0.75} sx={entrySx}>
          <Stack direction="row" alignItems="baseline" gap={1}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
              Edited by {entry.authorName || (entry.authorType === 'admin' ? 'admin' : 'creator')}
              {entry.authorName && (
                <Box component="span" sx={{ fontWeight: 400, color: '#8A8A92' }}>
                  {' '}
                  ({entry.authorType === 'admin' ? 'admin' : 'creator'})
                </Box>
              )}
            </Typography>
            <Typography sx={{ ml: 'auto', fontSize: 11.5, color: '#8A8A92' }}>
              {formatHistoryTime(entry.createdAt)}
            </Typography>
          </Stack>
          <Typography
            sx={{
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: entry.caption ? 'inherit' : '#9A9AA2',
            }}
          >
            {entry.caption || '(empty)'}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

CaptionEdits.propTypes = {
  submission: PropTypes.object.isRequired,
};

const TABS = [
  { value: 'feedback', label: 'Feedback' },
  { value: 'caption', label: 'Caption' },
];

// Past comment threads and caption edits; replaces the panel body while open
export default function FeedbackHistory({ submission }) {
  const tab = useCreatorSubmissionsStore((s) => s.historyTab);

  return (
    <Stack gap={1.5}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography sx={sectionLabelSx}>History</Typography>
        <Stack direction="row" sx={{ ml: 'auto', p: 0.25, borderRadius: 1, bgcolor: '#F1F1F4' }}>
          {TABS.map((item) => (
            <ButtonBase
              key={item.value}
              onClick={() => setHistoryTab(item.value)}
              sx={{
                px: 1.25,
                py: 0.375,
                borderRadius: 0.75,
                fontSize: 12,
                fontWeight: 500,
                color: tab === item.value ? '#17171A' : '#8A8A92',
                bgcolor: tab === item.value ? 'common.white' : 'transparent',
                boxShadow: tab === item.value ? '0 1px 2px rgba(0, 0, 0, 0.08)' : 'none',
              }}
            >
              {item.label}
            </ButtonBase>
          ))}
        </Stack>
      </Stack>

      {tab === 'feedback' ? (
        <CommentHistory submission={submission} />
      ) : (
        <CaptionEdits submission={submission} />
      )}
    </Stack>
  );
}

FeedbackHistory.propTypes = {
  submission: PropTypes.object.isRequired,
};
