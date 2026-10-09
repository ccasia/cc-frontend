import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { Box, Chip, Stack, Typography, ButtonBase, CircularProgress } from '@mui/material';

import { sectionLabelSx } from '../styles';
import useCaptionHistory from '../hooks/use-caption-history';
import {
  setHistoryTab,
  useCreatorSubmissionsStore,
} from '../../store/use-creator-submissions-store';

const formatHistoryTime = (date) => dayjs(date).format('D MMM YYYY, h:mm A');

// Same rounds the legacy FeedbackLogs lists: change requests and comments with something in them
const getFeedbackRounds = (submission) =>
  (submission.feedback || []).filter(
    (round) =>
      ['REQUEST', 'COMMENT'].includes(round.type) && (round.content || round.reasons?.length)
  );

// Who it came from and where it went, in the legacy wording
const describeRound = (round) => {
  const fromClient = round.admin?.role === 'client';
  const source = fromClient ? 'Client feedback' : 'CS feedback';
  if (round.sentToCreator) return { source, action: 'Sent to creator', fromClient };
  if (round.type === 'COMMENT') {
    return { source, action: fromClient ? 'Sent to admin' : 'Sent to client', fromClient };
  }
  return { source, action: 'Sent to admin', fromClient };
};

const entrySx = { p: 1.5, borderRadius: 1.25, border: '1px solid #EDEDF0' };

const emptySx = { py: 4, textAlign: 'center', fontSize: 13, color: '#9A9AA2' };

function FeedbackRounds({ submission }) {
  const rounds = getFeedbackRounds(submission);
  if (!rounds.length) return <Typography sx={emptySx}>No feedback rounds yet.</Typography>;

  return (
    <Stack gap={1.25}>
      {rounds.map((round) => {
        const { source, action, fromClient } = describeRound(round);
        return (
          <Stack key={round.id} gap={0.75} sx={entrySx}>
            <Stack direction="row" alignItems="baseline" gap={1}>
              <Typography
                sx={{ fontSize: 12.5, fontWeight: 600, color: fromClient ? '#1304FF' : '#17171A' }}
              >
                {source}
              </Typography>
              <Typography sx={{ ml: 'auto', fontSize: 11.5, color: '#8A8A92', textAlign: 'right' }}>
                {action} · {formatHistoryTime(round.createdAt)}
              </Typography>
            </Stack>
            {round.admin?.name && (
              <Typography sx={{ fontSize: 12, color: '#6E6E76' }}>by {round.admin.name}</Typography>
            )}
            {round.reasons?.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {round.reasons.map((reason) => (
                  <Chip
                    key={reason}
                    label={reason}
                    size="small"
                    sx={{ height: 22, fontSize: 11, color: '#B42318', bgcolor: '#FEE4E2' }}
                  />
                ))}
              </Stack>
            )}
            {round.content && (
              <Typography
                sx={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {round.content}
              </Typography>
            )}
            {round.replies?.length > 0 && (
              <Stack gap={0.75} sx={{ mt: 0.5, pl: 1.5, borderLeft: '2px solid #EDEDF0' }}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: '#1340FF' }}>
                  Creator replies ({round.replies.length})
                </Typography>
                {round.replies.map((reply) => (
                  <Box key={reply.id}>
                    <Typography sx={{ fontSize: 11, color: '#8A8A92' }}>
                      {reply.user?.name || 'Creator'} · {formatHistoryTime(reply.createdAt)}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, whiteSpace: 'pre-wrap' }}>
                      {reply.content || reply.text || ''}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}

FeedbackRounds.propTypes = {
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

// Past feedback rounds and caption edits; replaces the panel body while open
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
        <FeedbackRounds submission={submission} />
      ) : (
        <CaptionEdits submission={submission} />
      )}
    </Stack>
  );
}

FeedbackHistory.propTypes = {
  submission: PropTypes.object.isRequired,
};
