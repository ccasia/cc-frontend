import dayjs from 'dayjs';
import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';

import { keyframes } from '@mui/material/styles';
import {
  Box,
  Link,
  Stack,
  Avatar,
  Tooltip,
  TextField,
  Typography,
  ButtonBase,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import CtaButton from 'src/components/cta-button';

import { sectionLabelSx } from '../styles';
import useCommentSocket from '../hooks/use-comment-socket';
import useCommentThread from '../hooks/use-comment-thread';
import useNewCommentIds from '../hooks/use-new-comment-ids';
import useViewerSubmission from '../hooks/use-viewer-submission';
import useCommentActions, { DELETE_UNDO_MS } from '../hooks/use-comment-actions';
import {
  revealComment,
  parseTimestamp,
  COMMENT_ID_ATTR,
  isCommentResolved,
  REVIEW_SCROLL_ATTR,
} from '../utils';
import {
  playFromFeedback,
  addIncomingComment,
  toggleOriginalShown,
  openCommentComposer,
  closeCommentComposer,
  toggleThreadExpanded,
  clearIncomingComments,
  setCommentComposerText,
  setCommentComposerSaving,
  useCreatorSubmissionsStore,
  toggleShowResolvedComments,
} from '../../store/use-creator-submissions-store';

const ACCENT = '#1304FF';

export const timestampChipSx = {
  mr: 0.75,
  px: 0.75,
  py: 0.125,
  borderRadius: 0.75,
  fontFamily: 'monospace',
  fontSize: 11.5,
  fontWeight: 600,
  color: ACCENT,
  bgcolor: '#EDEBFF',
  verticalAlign: 'baseline',
};

export function TimestampChip({ timestamp, onClick }) {
  return (
    <ButtonBase
      component="span"
      onClick={onClick}
      disabled={!onClick}
      sx={{ ...timestampChipSx, '&:hover': onClick ? { bgcolor: '#DCD8FF' } : undefined }}
    >
      {timestamp}
    </ButtonBase>
  );
}

TimestampChip.propTypes = {
  timestamp: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

const ROLE_TAG = {
  client: { label: 'Client', color: '#1304FF', bgcolor: '#EDEBFF' },
  creator: { label: 'Creator', color: '#8A4213', bgcolor: '#FCEEE4' },
};

const actionLinkSx = {
  fontSize: 12,
  fontWeight: 500,
  color: '#8A8A92',
  textDecoration: 'none',
  '&:hover': { color: '#17171A' },
};

const formatCommentTime = (date) => dayjs(date).format('D MMM, h:mm A');

// ----------------------------------------------------------------------

// Wording for the open reply/edit box, from the comment it belongs to
const getComposerCopy = (mode, comment) => {
  if (mode === 'edit') {
    return {
      submitLabel: 'Save',
      hint: comment.user?.role === 'client' ? 'The creator sees your version' : undefined,
    };
  }
  const replyTo = comment.forwardedBy?.name || comment.user?.name?.split(' ')[0] || 'comment';
  return {
    submitLabel: 'Reply',
    placeholder: `Reply to ${replyTo}…`,
  };
};

// The thread's one reply/edit box. Mode, text and saving come from the store's
// commentComposer; Enter sends, Shift+Enter breaks the line, Esc cancels.
function InlineCommentInput({ comment }) {
  const submission = useViewerSubmission();
  const mode = useCreatorSubmissionsStore((s) => s.commentComposer?.mode);
  const value = useCreatorSubmissionsStore((s) => s.commentComposer?.text ?? '');
  const busy = useCreatorSubmissionsStore((s) => Boolean(s.commentComposer?.saving));
  const { reply, edit } = useCommentActions(submission);
  if (!submission) return null;
  const { submitLabel, placeholder, hint } = getComposerCopy(mode, comment, submission);

  const submit = async () => {
    if (!value.trim() || busy) return;
    setCommentComposerSaving(true);
    const done = mode === 'edit' ? await edit(comment, value) : await reply(comment.id, value);
    // On success the composer is closed; on failure keep the text for another go
    if (!done) setCommentComposerSaving(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeCommentComposer();
    }
  };

  return (
    <Stack gap={0.75} sx={{ mt: 0.75 }}>
      <TextField
        autoFocus
        multiline
        fullWidth
        minRows={1}
        maxRows={6}
        size="small"
        value={value}
        disabled={busy}
        placeholder={placeholder}
        onChange={(event) => setCommentComposerText(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={(event) => {
          const { length } = event.target.value;
          event.target.setSelectionRange(length, length);
        }}
        InputProps={{ sx: { fontSize: 12 } }}
      />
      <Stack direction="row" alignItems="center" gap={1}>
        {hint && <Typography sx={{ fontSize: 11, color: '#9A9AA2' }}>{hint}</Typography>}
        <Link
          component="button"
          disabled={busy}
          onClick={closeCommentComposer}
          sx={{ ...actionLinkSx, ml: 'auto' }}
        >
          Cancel
        </Link>
        <CtaButton size="small" variant="blue" disabled={!value.trim() || busy} onClick={submit}>
          {busy ? 'Saving…' : submitLabel}
        </CtaButton>
      </Stack>
    </Stack>
  );
}

InlineCommentInput.propTypes = {
  comment: PropTypes.object.isRequired,
};

const shrink = keyframes`
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
`;

// Stands in for a comment during its undo window
function DeletedCommentNotice({ commentId, startedAt, onUndo }) {
  return (
    <Stack
      {...{ [COMMENT_ID_ATTR]: commentId }}
      direction="row"
      alignItems="center"
      gap={1}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        px: 1.25,
        py: 0.875,
        borderRadius: 1,
        bgcolor: '#F4F4F6',
      }}
    >
      <Iconify icon="eva:trash-2-outline" width={14} sx={{ color: '#9A9AA2' }} />
      <Typography sx={{ fontSize: 12.5, color: '#6E6E76' }}>Comment deleted</Typography>
      <Link component="button" onClick={onUndo} sx={{ ml: 'auto', fontSize: 12, color: ACCENT }}>
        Undo
      </Link>
      {/* Time left to undo; the negative delay resumes it after navigating away and back */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          bgcolor: ACCENT,
          transformOrigin: 'left',
          animation: `${shrink} ${DELETE_UNDO_MS}ms linear forwards`,
          animationDelay: `${-(Date.now() - startedAt)}ms`,
        }}
      />
    </Stack>
  );
}

DeletedCommentNotice.propTypes = {
  commentId: PropTypes.string.isRequired,
  startedAt: PropTypes.number.isRequired,
  onUndo: PropTypes.func.isRequired,
};

// Whether a comment goes out with the next "Send to creator"
function CreatorDeliveryTag({ comment, canToggle, onToggle }) {
  if (comment.user?.role === 'creator') return null;

  if (canToggle) {
    const included = comment.isVisibleToCreator !== false;
    return (
      <Tooltip title={included ? 'Leave out of the creator feedback' : 'Send to the creator'}>
        <ButtonBase
          onClick={onToggle}
          sx={{
            ml: 'auto',
            gap: 0.5,
            px: 0.75,
            py: 0.25,
            borderRadius: 0.75,
            fontSize: 11,
            fontWeight: 600,
            color: included ? ACCENT : '#8A8A92',
            bgcolor: included ? '#EDEBFF' : '#F4F4F6',
          }}
        >
          <Iconify
            icon={included ? 'eva:checkmark-square-2-fill' : 'eva:square-outline'}
            width={14}
          />
          {included ? 'For creator' : 'Not for creator'}
        </ButtonBase>
      </Tooltip>
    );
  }

  return (
    <Typography sx={{ ml: 'auto', fontSize: 11, color: '#9A9AA2', whiteSpace: 'nowrap' }}>
      {comment.isSentToCreator ? 'Sent to creator' : 'Not sent yet'}
    </Typography>
  );
}

CreatorDeliveryTag.propTypes = {
  comment: PropTypes.object.isRequired,
  canToggle: PropTypes.bool,
  onToggle: PropTypes.func,
};

// Where a deleted comment or reply was; the backend blanks its content
function DeletedCommentPlaceholder({ comment }) {
  return (
    <Stack
      {...{ [COMMENT_ID_ATTR]: comment.id }}
      direction="row"
      alignItems="center"
      gap={1.125}
      sx={{ minHeight: 24 }}
    >
      <Box
        sx={{
          width: 24,
          height: 24,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          bgcolor: '#F4F4F6',
        }}
      >
        <Iconify icon="eva:slash-outline" width={13} sx={{ color: '#9A9AA2' }} />
      </Box>
      <Typography sx={{ fontSize: 13, fontStyle: 'italic', color: '#9A9AA2' }}>
        Message deleted
      </Typography>
      <Tooltip title={`Deleted ${formatCommentTime(comment.deletedAt)}`}>
        <Typography noWrap sx={{ ml: 'auto', fontSize: 12, color: '#B4B4BB' }}>
          {comment.user?.name} · {formatCommentTime(comment.createdAt)}
        </Typography>
      </Tooltip>
    </Stack>
  );
}

DeletedCommentPlaceholder.propTypes = {
  comment: PropTypes.object.isRequired,
};

// threadRoot: set on the thread's last row, which then carries the thread's Resolve button
function CommentItem({ comment, isReply = false, isNew = false, threadRoot }) {
  const submission = useViewerSubmission();
  const { permissionsFor } = useCommentThread(submission);
  const { toggleForCreator, deleteComment } = useCommentActions(submission);
  const composer = useCreatorSubmissionsStore((s) => s.commentComposer);
  const showOriginal = useCreatorSubmissionsStore((s) => Boolean(s.originalShown[comment.id]));

  const { canReply, canEdit, canDelete, canToggleForCreator } = permissionsFor(comment, {
    isReply,
  });
  const isEditing = composer?.mode === 'edit' && composer.commentId === comment.id;

  const role = comment.user?.role;
  const roleTag = ROLE_TAG[role];
  const isEdited = Boolean(comment.originalText);
  const showingOriginal = showOriginal && isEdited;
  const text = showingOriginal ? comment.originalText : comment.text;
  const timestamp = showingOriginal ? comment.originalTimestamp : comment.timestamp;
  const photo = comment.user?.photoURL || comment.user?.client?.company?.logo;
  const agreedNames = (comment.agreedBy || []).map((agreement) => agreement.user?.name);

  if (comment.deletedAt) return <DeletedCommentPlaceholder comment={comment} />;

  return (
    <Stack {...{ [COMMENT_ID_ATTR]: comment.id }} direction="row" gap={1.125}>
      <Avatar src={photo} alt={comment.user?.name} sx={{ width: 24, height: 24, fontSize: 10 }}>
        {comment.user?.name?.[0]}
      </Avatar>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" alignItems="center" gap={0.75} sx={{ minHeight: 22 }}>
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, minWidth: 0 }}>
            {comment.user?.name}
          </Typography>
          {roleTag && (
            <Box
              component="span"
              sx={{
                px: 0.625,
                borderRadius: 0.5,
                fontSize: 10.5,
                fontWeight: 600,
                lineHeight: '17px',
                color: roleTag.color,
                bgcolor: roleTag.bgcolor,
              }}
            >
              {roleTag.label}
            </Box>
          )}
          <Typography noWrap sx={{ fontSize: 12, color: '#9A9AA2', flexShrink: 0 }}>
            {formatCommentTime(comment.createdAt)}
          </Typography>

          {isNew && (
            <Tooltip title="New since you last looked">
              <Box
                sx={{ width: 7, height: 7, flexShrink: 0, borderRadius: '50%', bgcolor: '#FF5630' }}
              />
            </Tooltip>
          )}

          <CreatorDeliveryTag
            comment={comment}
            canToggle={canToggleForCreator}
            onToggle={() => toggleForCreator(comment)}
          />
        </Stack>

        {isEditing ? (
          <InlineCommentInput comment={comment} />
        ) : (
          <Typography
            sx={{
              fontSize: 13,
              lineHeight: 1.5,
              color: '#3C3C44',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {timestamp && (
              <TimestampChip
                timestamp={timestamp}
                onClick={() => playFromFeedback(parseTimestamp(timestamp))}
              />
            )}

            {text}
          </Typography>
        )}

        {!isEditing && (
          <Stack direction="row" alignItems="center" gap={1.5} sx={{ mt: 0.5, minHeight: 20 }}>
            {canReply && (
              <Link
                component="button"
                onClick={() => openCommentComposer('reply', comment.id)}
                sx={actionLinkSx}
              >
                Reply
              </Link>
            )}
            {canEdit && (
              <Link
                component="button"
                onClick={() => openCommentComposer('edit', comment.id, comment.text)}
                sx={actionLinkSx}
              >
                Edit
              </Link>
            )}
            {canDelete && (
              <Link
                component="button"
                onClick={() => deleteComment(comment.id)}
                sx={{ ...actionLinkSx, '&:hover': { color: '#E5533D' } }}
              >
                Delete
              </Link>
            )}
            {/* Own edits overwrite the text, so there's no original to show — just when */}
            {!isEdited && comment.editedAt && (
              <Tooltip title={`Edited ${formatCommentTime(comment.editedAt)}`}>
                <Typography sx={{ fontSize: 11.5, color: '#9A9AA2' }}>Edited</Typography>
              </Tooltip>
            )}
            {isEdited && (
              <Typography sx={{ fontSize: 11.5, color: '#9A9AA2' }}>
                {showingOriginal ? 'Original' : 'Edited'}
                {!showingOriginal && comment.forwardedBy?.name && ` by ${comment.forwardedBy.name}`}
                {' · '}
                <Link
                  component="button"
                  onClick={() => toggleOriginalShown(comment.id)}
                  sx={{ ...actionLinkSx, fontSize: 11.5, verticalAlign: 'baseline' }}
                >
                  {showingOriginal ? 'Show edit' : 'See original'}
                </Link>
              </Typography>
            )}

            {(agreedNames.length > 0 || threadRoot) && (
              <Stack direction="row" alignItems="center" gap={1} sx={{ ml: 'auto' }}>
                {agreedNames.length > 0 && (
                  <Tooltip
                    title={`Agreed by ${agreedNames.filter(Boolean).join(', ') || 'client'}`}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      gap={0.375}
                      sx={{ color: ACCENT, fontSize: 12, fontWeight: 600 }}
                    >
                      <Iconify icon="mdi:thumb-up" width={13} />
                      {agreedNames.length}
                    </Stack>
                  </Tooltip>
                )}
                {threadRoot && <ResolveButton comment={threadRoot} />}
              </Stack>
            )}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

CommentItem.propTypes = {
  comment: PropTypes.object.isRequired,
  isReply: PropTypes.bool,
  isNew: PropTypes.bool,
  threadRoot: PropTypes.object,
};

function ResolveButton({ comment }) {
  const submission = useViewerSubmission();
  const { permissionsFor } = useCommentThread(submission);
  const { toggleResolved } = useCommentActions(submission);
  const { canResolve } = permissionsFor(comment);
  const resolved = isCommentResolved(comment);

  if (!canResolve && !resolved) return null;

  const resolvedBy = comment.resolvedBy?.name ? ` by ${comment.resolvedBy.name}` : '';
  const resolvedAt = comment.resolvedAt ? ` · ${formatCommentTime(comment.resolvedAt)}` : '';
  const tooltip = resolved ? `Resolved${resolvedBy}${resolvedAt}` : 'Mark as resolved';

  return (
    <Tooltip title={tooltip}>
      <span>
        <ButtonBase
          disabled={!canResolve}
          onClick={() => toggleResolved(comment)}
          sx={{
            gap: 0.375,
            px: 0.625,
            py: 0.25,
            borderRadius: 0.75,
            fontSize: 11.5,
            fontWeight: 600,
            color: resolved ? '#15A34A' : '#8A8A92',
            '&:hover': { bgcolor: '#F4F4F6' },
          }}
        >
          <Iconify
            icon={resolved ? 'eva:checkmark-circle-2-fill' : 'eva:checkmark-circle-2-outline'}
            width={15}
          />
          {resolved ? 'Resolved' : 'Resolve'}
        </ButtonBase>
      </span>
    </Tooltip>
  );
}

ResolveButton.propTypes = {
  comment: PropTypes.object.isRequired,
};

function CommentOrNotice({ comment, isReply, newIds, threadRoot }) {
  const submission = useViewerSubmission();
  const startedAt = useCreatorSubmissionsStore((s) => s.pendingCommentDeletes[comment.id]);
  const { undoDelete } = useCommentActions(submission);

  if (startedAt) {
    return (
      <DeletedCommentNotice
        commentId={comment.id}
        startedAt={startedAt}
        onUndo={() => undoDelete(comment.id)}
      />
    );
  }
  return (
    <CommentItem
      comment={comment}
      isReply={isReply}
      isNew={newIds.has(comment.id)}
      threadRoot={threadRoot}
    />
  );
}

CommentOrNotice.propTypes = {
  comment: PropTypes.object.isRequired,
  isReply: PropTypes.bool,
  newIds: PropTypes.object.isRequired,
  threadRoot: PropTypes.object,
};

function CommentThread({ comment, newIds }) {
  const expanded = useCreatorSubmissionsStore((s) => Boolean(s.expandedThreads[comment.id]));
  const composer = useCreatorSubmissionsStore((s) => s.commentComposer);
  const resolved = isCommentResolved(comment);

  const replies = comment.replies || [];
  // Collapsed: every reply hidden, whoever wrote it, behind "Show N replies"
  const visibleReplies = expanded ? replies : [];
  const hiddenNewCount = expanded ? 0 : replies.filter((item) => newIds.has(item.id)).length;
  const isReplying = composer?.mode === 'reply' && composer.commentId === comment.id;

  // Resolve always sits on the thread's bottom row: the "Show N replies" row when the replies
  // are folded away, otherwise the last comment's action row (Reply · Edit · Delete … Resolve).
  // It drops to its own line only when that row isn't showing: the last comment is being
  // edited, deleted (or counting down to it), or a reply box is open below it.
  const isCollapsed = !expanded && replies.length > 0;
  const lastItem = visibleReplies[visibleReplies.length - 1] ?? comment;
  const lastPendingDelete = useCreatorSubmissionsStore((s) =>
    Boolean(s.pendingCommentDeletes[lastItem.id])
  );
  const lastIsEditing = composer?.mode === 'edit' && composer.commentId === lastItem.id;
  const resolveOnToggle = isCollapsed && !isReplying;
  const resolveInline =
    !isCollapsed && !isReplying && !lastIsEditing && !lastPendingDelete && !lastItem.deletedAt;
  const resolveOn = (item) => (resolveInline && item.id === lastItem.id ? comment : undefined);

  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 1.25,
        border: '1px solid',
        borderColor: comment.user?.role === 'client' && !resolved ? '#D5D1FF' : '#EDEDF0',
        bgcolor: resolved ? '#FAFAFB' : 'background.paper',
        opacity: resolved ? 0.75 : 1,
        transition: 'opacity 150ms ease, background-color 150ms ease',
        '&:hover': { opacity: 1 },
      }}
    >
      <CommentOrNotice comment={comment} newIds={newIds} threadRoot={resolveOn(comment)} />

      {(replies.length > 0 || isReplying) && (
        <Stack
          gap={THREAD_GAP}
          sx={{ mt: THREAD_GAP, ml: '11px', pl: '20px', borderLeft: '1px solid #EDEDF0' }}
        >
          {replies.length > 0 && (
            <Stack direction="row" alignItems="center" sx={{ minHeight: 24 }}>
              <Link
                component="button"
                onClick={() => toggleThreadExpanded(comment.id)}
                sx={{ ...actionLinkSx, color: ACCENT }}
              >
                {expanded
                  ? 'Hide replies'
                  : `Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
                {/* New client / creator replies stay noticeable while folded away */}
                {hiddenNewCount > 0 && (
                  <Box component="span" sx={{ color: '#FF5630' }}>
                    {' '}
                    · {hiddenNewCount} new
                  </Box>
                )}
              </Link>
              {resolveOnToggle && (
                <Box sx={{ ml: 'auto' }}>
                  <ResolveButton comment={comment} />
                </Box>
              )}
            </Stack>
          )}
          <AnimatedList
            items={visibleReplies}
            renderItem={(item) => (
              <CommentOrNotice
                comment={item}
                newIds={newIds}
                threadRoot={resolveOn(item)}
                isReply
              />
            )}
          />
          {isReplying && <InlineCommentInput comment={comment} />}
        </Stack>
      )}

      {!resolveInline && !resolveOnToggle && (
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.5 }}>
          <ResolveButton comment={comment} />
        </Stack>
      )}
    </Box>
  );
}

CommentThread.propTypes = {
  comment: PropTypes.object.isRequired,
  newIds: PropTypes.object.isRequired,
};

function NewCommentsPill({ placement }) {
  const incoming = useCreatorSubmissionsStore((s) => s.incomingComments);
  const targetId = incoming?.targetId;
  const isShown = Boolean(incoming) && incoming.above === (placement === 'top');

  useEffect(() => {
    if (!isShown) return undefined;
    const target = document.querySelector(`[${COMMENT_ID_ATTR}="${targetId}"]`);
    if (!target) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) clearIncomingComments();
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [isShown, targetId]);

  if (!isShown) return null;

  return (
    <ButtonBase
      onClick={() => {
        revealComment(targetId);
        clearIncomingComments();
      }}
      sx={{
        position: 'sticky',
        [placement]: 8,
        zIndex: 1,
        alignSelf: 'center',
        gap: 0.5,
        px: 1.5,
        py: 0.625,
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        color: 'common.white',
        bgcolor: ACCENT,
        boxShadow: '0 4px 12px rgba(19, 4, 255, 0.25)',
        '&:hover': { bgcolor: '#0F03CC' },
      }}
    >
      <Iconify icon={incoming.above ? 'eva:arrow-up-fill' : 'eva:arrow-down-fill'} width={14} />
      {incoming.count} new {incoming.count === 1 ? 'comment' : 'comments'}
    </ButtonBase>
  );
}

NewCommentsPill.propTypes = {
  placement: PropTypes.oneOf(['top', 'bottom']).isRequired,
};

const locateComment = (commentId) => {
  const element = document.querySelector(`[${COMMENT_ID_ATTR}="${commentId}"]`);
  const scroller = element?.closest(`[${REVIEW_SCROLL_ATTR}]`);
  if (!element || !scroller) return 'visible';
  const box = element.getBoundingClientRect();
  const view = scroller.getBoundingClientRect();
  if (box.bottom < view.top) return 'above';
  if (box.top > view.bottom) return 'below';
  return 'visible';
};

const THREAD_GAP = 1.25;

const listItemMotion = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
};

// Items collapse out / expand in instead of snapping, so the content below doesn't jump —
// threads moving between the open list and the resolved section, and earlier replies
// folding away. Spacing is padding inside each animated item, so it shrinks away with it.
function AnimatedList({ items, renderItem }) {
  return (
    <Box sx={{ mb: -THREAD_GAP, '&:empty': { display: 'none' } }}>
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <m.div key={item.id} {...listItemMotion} style={{ overflow: 'hidden' }}>
            <Box sx={{ pb: THREAD_GAP }}>{renderItem(item)}</Box>
          </m.div>
        ))}
      </AnimatePresence>
    </Box>
  );
}

AnimatedList.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
};

export default function ViewerComments({ submission }) {
  const { videoId, comments, commentsLoading, canSelectForCreator } = useCommentThread(submission);
  const newIds = useNewCommentIds(submission.id, videoId, comments, commentsLoading);
  const showResolved = useCreatorSubmissionsStore((s) => s.showResolvedComments);

  useCommentSocket(submission, (comment) => {
    requestAnimationFrame(() => {
      const position = locateComment(comment.id);
      if (position !== 'visible') {
        addIncomingComment({ targetId: comment.id, above: position === 'above' });
      }
    });
  });

  const open = comments.filter((comment) => !isCommentResolved(comment));
  const resolved = comments.filter(isCommentResolved);
  const selectable = comments.filter(
    (comment) => !comment.deletedAt && comment.user?.role !== 'creator' && !comment.isSentToCreator
  );
  const selectedCount = selectable.filter((comment) => comment.isVisibleToCreator !== false).length;

  const renderThread = (comment) => <CommentThread comment={comment} newIds={newIds} />;

  return (
    <Stack gap={THREAD_GAP}>
      {canSelectForCreator && selectable.length > 0 && (
        <Typography sx={{ fontSize: 12, color: '#6E6E76' }}>
          {selectedCount} of {selectable.length} selected for the creator · tick to include or leave
          out
        </Typography>
      )}

      {!commentsLoading && !comments.length && (
        <Typography sx={{ fontSize: 13, color: '#9A9AA2' }}>No feedback yet.</Typography>
      )}

      <NewCommentsPill placement="top" />

      <AnimatedList items={open} renderItem={renderThread} />

      {resolved.length > 0 && (
        <>
          <ButtonBase
            onClick={toggleShowResolvedComments}
            sx={{ alignSelf: 'flex-start', gap: 0.25, color: sectionLabelSx.color }}
          >
            <Iconify
              icon={showResolved ? 'eva:chevron-down-fill' : 'eva:chevron-right-fill'}
              width={16}
            />
            {/* Typography, so it gets the theme font rather than the <button>'s default */}
            <Typography component="span" sx={sectionLabelSx}>
              {resolved.length} resolved
            </Typography>
          </ButtonBase>
          <AnimatedList items={showResolved ? resolved : []} renderItem={renderThread} />
        </>
      )}

      <NewCommentsPill placement="bottom" />
    </Stack>
  );
}

ViewerComments.propTypes = {
  submission: PropTypes.object.isRequired,
};
