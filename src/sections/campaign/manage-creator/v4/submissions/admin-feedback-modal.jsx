import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { m, AnimatePresence } from 'framer-motion';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Avatar,
  Button,
  Divider,
  Collapse,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';

import { useSubmissionComments } from 'src/hooks/use-submission-comments';

import { fDateTime } from 'src/utils/format-time';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import { DarkGlassTooltip } from 'src/components/tooltip/glass-tooltip';
import ConfirmDialogV2 from 'src/components/custom-dialog/confirm-dialog-v2';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

// mm:ss under 1h; hh:mm:ss when hours > 0 — chip, saved comment timestamps, display
const formatTime = (timeInSeconds) => {
  const totalSeconds = Math.floor(Math.max(0, timeInSeconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const formatDisplayTimestamp = formatTime;

const AnimatedDigit = ({ digit }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-block',
      position: 'relative',
      width: '0.62em',
      height: '1.2em',
      overflow: 'hidden',
      verticalAlign: 'top',
    }}
  >
    <AnimatePresence mode="popLayout" initial={false}>
      <m.span
        key={digit}
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        exit={{ y: '-100%', opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          display: 'inline-block',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {digit}
      </m.span>
    </AnimatePresence>
  </Box>
);

AnimatedDigit.propTypes = { digit: PropTypes.string.isRequired };

const AnimatedTime = ({ time }) => (
  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
    {time
      .split('')
      .map((char, i) =>
        char === ':' ? (
          <span key={`sep-${i}`}>:</span>
        ) : (
          <AnimatedDigit key={`pos-${i}`} digit={char} />
        )
      )}
  </Box>
);

AnimatedTime.propTypes = { time: PropTypes.string.isRequired };

const parseTimestamp = (timestampStr) => {
  if (!timestampStr) return 0;
  const parts = timestampStr.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

// Extract a leading timestamp from text, returning { timestamp, text }
// Matches: "0:12 ...", "00:20 ...", "1:30:00 ...", "00:01:12 ..."
const extractTimestamp = (input) => {
  const match = input.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+([\s\S]*)$/);
  if (match) {
    return { timestamp: formatTime(parseTimestamp(match[1])), text: match[2].trim() };
  }
  return { timestamp: null, text: input };
};

// ---------------------------------------------------------------------------
// CommentCard
// ---------------------------------------------------------------------------

const CommentCard = ({
  comment,
  onTimestampClick,
  onReply,
  replyCount = 0,
  isRepliesOpen = false,
  onToggleReplies,
  isReply = false,
  isPastVideo = false,
  onEdit,
  onToggleResolve,
  editTarget,
  onSaveEdit,
  onCancelEdit,
  editText,
  onEditTextChange,
  inlineReplyTarget,
  inlineReplyText,
  onInlineReplyTextChange,
  onSendInlineReply,
  onCancelInlineReply,
  isAdminView = false,
  onToggleVisibility,
  isNew = false,
  onDelete,
  onUndoDelete,
  pendingDelete = false,
  pendingDeleteStartTime,
  currentUserId,
  parentResolved = false,
  isNewCreatorReply = false,
  feedbackSent = false,
}) => {
  const isClientComment = comment.user?.role === 'client';
  const isCreatorComment = comment.user?.role === 'creator';
  const isEditedClientComment = isClientComment && !!comment.forwardedBy;
  const isAdminComment = !isClientComment && !isCreatorComment;
  const canAdminReply = isAdminView && !isReply && (isEditedClientComment || isAdminComment);
  const hasAgreed = comment.agreedBy?.length > 0;
  const isResolved = !!comment.resolvedByUserId || !!comment.resolvedAt || isPastVideo || parentResolved;
  const showRepliesToggle = !isReply && replyCount > 0;
  const repliesToggleColor = isRepliesOpen ? '#919191' : '#1340FF';

  const [showOriginal, setShowOriginal] = useState(false);

  // Toggle identity along with text: edited view shows admin, original view shows client
  const showingOriginal = showOriginal && isEditedClientComment;
  const displayName = showingOriginal
    ? comment.user?.name || 'Unknown'
    : comment.forwardedBy?.name || comment.user?.name || 'Unknown';
  const displayPhoto = showingOriginal
    ? comment.user?.photoURL || comment?.user?.client?.company?.logo || null
    : comment.forwardedBy?.photoURL ||
      comment.user?.photoURL ||
      comment?.user?.client?.company?.logo ||
      null;
  const role = comment.user?.role;
  const capitalizedRole = (role && role.charAt(0).toUpperCase() + role.slice(1)) || '';
  const forwardedRole = comment.forwardedBy ? 'Admin' : capitalizedRole;
  const displayRole = showingOriginal ? capitalizedRole : forwardedRole;

  const isEditing = editTarget?.commentId === comment.id;
  const editFocusedRef = useRef(false);
  const prevEditingRef = useRef(false);

  // Reset the focus flag when entering/exiting edit mode
  if (isEditing && !prevEditingRef.current) {
    editFocusedRef.current = false;
  }
  prevEditingRef.current = isEditing;

  const hasLeftActions =
    !isPastVideo &&
    ((!isReply && isClientComment && !isEditedClientComment) ||
      (isClientComment && !isEditedClientComment && !!onEdit) ||
      canAdminReply);

  const isVisible = comment.isVisibleToCreator !== false;
  const showVisibilityBorder = isAdminView && !isCreatorComment;

  const canToggleVisibility = showVisibilityBorder && !isPastVideo && !!onToggleVisibility;

  // Delete permission: own comment, not past video
  // Allow deletion when forwardedByUserId is absent OR matches the current admin
  // (backend auto-sets forwardedByUserId on admin replies when the parent is already forwarded)
  const canDelete = !!onDelete && !isPastVideo && !pendingDelete
    && (comment.userId === currentUserId || comment.user?.id === currentUserId)
    && (!comment.forwardedByUserId || comment.forwardedByUserId === currentUserId);

  // Countdown for pending-delete state
  const [deleteProgress, setDeleteProgress] = useState(100);
  const deleteIntervalRef = useRef(null);
  useEffect(() => {
    if (!pendingDelete || !pendingDeleteStartTime) {
      setDeleteProgress(100);
      return undefined;
    }
    setDeleteProgress(100);
    // Wait one frame so the initial 100% state renders before countdown begins
    const startDelay = setTimeout(() => {
      deleteIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - pendingDeleteStartTime;
        const remaining = 100 - (elapsed / 5000) * 100;
        setDeleteProgress(remaining);
        // Stop once past the tick threshold to avoid unnecessary re-renders
        // -16 ≈ 800ms past zero (each 1% = 50ms)
        if (remaining <= -16) {
          clearInterval(deleteIntervalRef.current);
          deleteIntervalRef.current = null;
        }
      }, 50);
    }, 16);
    return () => {
      clearTimeout(startDelay);
      if (deleteIntervalRef.current) clearInterval(deleteIntervalRef.current);
    };
  }, [pendingDelete, pendingDeleteStartTime]);

  const handleCardClick = (e) => {
    if (!canToggleVisibility) return;
    // Don't toggle when clicking interactive elements inside the card
    if (
      e.target.closest(
        'button, input, textarea, [role="button"], a, .MuiIconButton-root, [data-interactive]'
      )
    )
      return;
    onToggleVisibility(comment.id);
  };

  const deleteSecondsLeft = Math.max(0, Math.ceil((deleteProgress / 100) * 5));
  const deleteRingValue = Math.max(0, deleteProgress);
  // Show tick ~800ms after the ring reaches 0 (-16% ≈ 800ms past zero, each 1% = 50ms)
  const deleteTimerDone = deleteProgress <= -16;

  const pendingDeleteContent = (
    <m.div
      key="pending-delete"
      initial={{ opacity: 0, x: 30, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 30, filter: 'blur(4px)' }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <Box
        sx={{
          bgcolor: 'white',
          py: 1.25,
          px: 1.5,
          borderRadius: 2,
          border: '1px solid #EBEBEB',
          boxShadow: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Left: ring/tick + message */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', width: 32, height: 32, flexShrink: 0 }}>
            <AnimatePresence mode="wait" initial={false}>
              {deleteTimerDone ? (
                <m.div
                  key="tick"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon="mdi:check" width={20} sx={{ color: '#1340FF' }} />
                </m.div>
              ) : (
                <m.div
                  key="ring"
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  style={{ position: 'absolute', inset: 0 }}
                >
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={32}
                    thickness={4}
                    sx={{ color: '#E0E7FF', position: 'absolute' }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={deleteRingValue}
                    size={32}
                    thickness={4}
                    sx={{ color: '#1340FF' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.688rem', fontWeight: 700, color: '#1340FF', lineHeight: 1 }}>
                      {deleteSecondsLeft}
                    </Typography>
                  </Box>
                </m.div>
              )}
            </AnimatePresence>
          </Box>
          <AnimatePresence mode="wait" initial={false}>
            <m.span
              key={deleteTimerDone ? 'done' : 'counting'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Typography sx={{ fontSize: '0.813rem', fontWeight: 500, color: deleteTimerDone ? '#1340FF' : '#6B7280' }}>
                {deleteTimerDone ? 'Comment deleted.' : 'Comment has been deleted. Undo?'}
              </Typography>
            </m.span>
          </AnimatePresence>
        </Box>

        {/* Right: undo pill button — hidden once timer done */}
        <AnimatePresence initial={false}>
          {!deleteTimerDone && (
            <m.div
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                data-interactive
                size="small"
                onClick={() => onUndoDelete?.(comment.id)}
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#1340FF',
                  bgcolor: 'white',
                  border: '1px solid #E7E7E7',
                  borderBottom: '2px solid #E7E7E7',
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.25,
                  minWidth: 'unset',
                  minHeight: 'unset',
                  lineHeight: 1.4,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#F9F9F9',
                    border: '1px solid #E7E7E7',
                    borderBottom: '2px solid #E7E7E7',
                  },
                }}
              >
                Undo
              </Button>
            </m.div>
          )}
        </AnimatePresence>
      </Box>
    </m.div>
  );

  const cardContent = (
    <Box
      onClick={handleCardClick}
      sx={{
        p: { xs: 1.25, md: 2 },
        gap: { xs: 0.75, md: 1 },
        bgcolor: isResolved ? '#EBEBEB' : 'white',
        borderRadius: 2,
        border:
          isClientComment && !isEditedClientComment ? '1px solid #2563EB' : '1px solid #EBEBEB',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        ...(isNewCreatorReply && {
          border: '1.5px solid #1340FF',
        }),
        ...(showVisibilityBorder && isVisible && (feedbackSent || !!onToggleVisibility) && {
          border: 'none',
          borderLeft: '5px solid #1340FF',
          borderTop: '1px solid #1340FF',
        }),
        ...(showVisibilityBorder && !isVisible && {
          border: '1px solid #EBEBEB',
        }),
        ...(canToggleVisibility && {
          cursor: 'pointer',
          '&:hover': {
            boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)',
          },
        }),
      }}
    >
      {showVisibilityBorder && isVisible && (feedbackSent || !!onToggleVisibility) && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 30,
            transform: 'translateY(-50%)',
            background: `linear-gradient(to bottom, #F4F4F4 50%, ${isResolved ? '#EBEBEB' : '#ffffff'} 50%)`,
            px: 1,
            zIndex: 2,
            lineHeight: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#1340FF',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {feedbackSent ? 'Sent to Creator' : 'Included'}
          </Typography>
        </Box>
      )}
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          px: 0.5,
        }}
      >
        <AnimatePresence mode="wait">
          <m.div
            key={showingOriginal ? 'original' : 'edited'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Avatar
              src={displayPhoto}
              alt={displayName}
              sx={{
                width: 36,
                height: 36,
                bgcolor: '#E5E7EB',
                color: '#6B7280',
                border: '1px solid #EBEBEB',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                fontWeight: 500,
              }}
            >
              {!displayPhoto && displayName.charAt(0)}
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: '0.813rem', md: '0.875rem' },
                    color: '#111827',
                  }}
                >
                  {displayName}
                </Typography>
                {(isNew || isNewCreatorReply) && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#FF5630',
                      flexShrink: 0,
                    }}
                  />
                )}
              </Box>
              <Typography
                sx={{
                  fontSize: { xs: '0.688rem', md: '0.75rem' },
                  fontWeight: 600,
                  color: '#9CA3AF',
                  textTransform: 'capitalize',
                }}
              >
                {displayRole}
              </Typography>
            </Box>
          </m.div>
        </AnimatePresence>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25 }}>
          {canDelete && (
            <DarkGlassTooltip title="Delete?" placement="top">
              <IconButton
                data-interactive
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(comment.id);
                }}
                sx={{
                  p: 0.25,
                  bgcolor: 'transparent',
                  '&:hover': { bgcolor: 'transparent' },
                  '&:hover img': {
                    filter: 'brightness(0) saturate(100%) invert(41%) sepia(93%) saturate(1352%) hue-rotate(340deg) brightness(101%) contrast(101%)',
                  },
                }}
              >
                <Box component="img" src="/assets/icons/components/comment_delete.svg" sx={{ width: 16, height: 16 }} />
              </IconButton>
            </DarkGlassTooltip>
          )}
          <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
            {fDateTime(comment.createdAt)}
          </Typography>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ pl: 0.5 }}>
        <m.div
          animate={{
            border: isEditing ? '1px solid #E7E7E7' : '1px solid transparent',
            backgroundColor: isEditing ? '#FFFFFF' : 'transparent',
            padding: isEditing ? 12 : 0,
            borderRadius: 8,
          }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {isEditing ? (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              {editTarget?.timestamp && (
                <Typography
                  component="span"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTimestampClick) {
                      onTimestampClick(parseTimestamp(editTarget.timestamp));
                    }
                  }}
                  sx={{
                    color: '#1340FF',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    lineHeight: 1.4,
                    cursor: onTimestampClick ? 'pointer' : 'default',
                    '&:hover': onTimestampClick ? { textDecoration: 'underline' } : {},
                    whiteSpace: 'nowrap',
                    mt: '1px',
                  }}
                >
                  {formatDisplayTimestamp(parseTimestamp(editTarget.timestamp))}
                </Typography>
              )}
              <TextField
                inputRef={(input) => {
                  if (input && !editFocusedRef.current) {
                    editFocusedRef.current = true;
                    input.focus();
                    const { length } = input.value;
                    input.setSelectionRange(length, length);
                  }
                }}
                multiline
                minRows={1}
                maxRows={6}
                value={editText}
                onChange={(e) => onEditTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSaveEdit(comment.id);
                  }
                }}
                size="small"
                fullWidth
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    border: 'none',
                    '& fieldset': { border: 'none' },
                    p: 0,
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.875rem',
                    fontFamily: 'Inter, sans-serif',
                    p: 0,
                    lineHeight: 1.4,
                  },
                }}
              />
            </Box>
          ) : (
            <AnimatePresence mode="wait">
              <m.div
                key={showingOriginal ? 'original-body' : 'edited-body'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: '0.813rem', md: '0.875rem' },
                    fontWeight: 500,
                    color: '#1F2937',
                    wordBreak: 'break-word',
                  }}
                >
                  {(() => {
                    const displayTimestamp =
                      showingOriginal && comment.originalTimestamp
                        ? comment.originalTimestamp
                        : comment.timestamp;
                    const displayText =
                      showingOriginal && comment.originalText ? comment.originalText : comment.text;
                    return (
                      <>
                        {displayTimestamp && comment.user?.role !== 'creator' && (
                          <Typography
                            component="span"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onTimestampClick) {
                                onTimestampClick(parseTimestamp(displayTimestamp));
                              }
                            }}
                            sx={{
                              color: '#1340FF',
                              fontWeight: 500,
                              fontSize: 'inherit',
                              mr: 0.5,
                              cursor: onTimestampClick ? 'pointer' : 'default',
                              '&:hover': onTimestampClick ? { textDecoration: 'underline' } : {},
                            }}
                          >
                            {formatDisplayTimestamp(parseTimestamp(displayTimestamp))}
                          </Typography>
                        )}
                        {displayText}
                      </>
                    );
                  })()}
                </Typography>
              </m.div>
            </AnimatePresence>
          )}
          <AnimatePresence>
            {isEditing && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ overflow: 'hidden' }}
              >
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    size="small"
                    onClick={onCancelEdit}
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#1340FF',
                      bgcolor: 'transparent',
                      border: '1px solid #E7E7E7',
                      borderBottom: '3px solid #E7E7E7',
                      borderRadius: 1,
                      px: 1.5,
                      py: 0.5,
                      '&:hover': {
                        bgcolor: '#F9F9F9',
                        border: '1px solid #E7E7E7',
                        borderBottom: '3px solid #E7E7E7',
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <DarkGlassTooltip title="Update Feedback?" placement="top">
                    <Button
                      size="small"
                      variant="contained"
                      disabled={!editText?.trim()}
                      onClick={() => onSaveEdit(comment.id)}
                      sx={{
                        bgcolor: '#1340ff',
                        borderBottom: '2px solid #0A238C',
                        boxShadow: 'inset 0px -2px 0px 0px #0A238C',
                        borderRadius: 1,
                        minWidth: 'unset',
                        minHeight: 28,
                        px: 1.5,
                        py: 0.5,
                        '&:hover': { bgcolor: '#1a4dff' },
                        '&.Mui-disabled': {
                          bgcolor: 'action.disabledBackground',
                          color: 'action.disabled',
                          borderBottomColor: 'action.disabledBackground',
                          boxShadow: 'none',
                        },
                      }}
                    >
                      <Iconify icon="ic:round-send" width={18} sx={{ color: 'white' }} />
                    </Button>
                  </DarkGlassTooltip>
                </Box>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      </Box>

      {/* Footer Actions */}
      {!isEditing && (
        <Box
          sx={{
            pl: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: hasLeftActions ? 'space-between' : 'flex-end',
          }}
        >
          {hasLeftActions && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {((!isReply && isClientComment && !isEditedClientComment) || canAdminReply) && (
                <Typography
                  data-interactive
                  onClick={() => onReply?.(comment)}
                  sx={{
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    fontWeight: 600,
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    padding: { xs: '2px 0', md: 0 },
                    '&:hover': { color: '#6B7280' },
                  }}
                >
                  Reply
                </Typography>
              )}
              {isClientComment && !isEditedClientComment && onEdit && (
                <Typography
                  data-interactive
                  onClick={() => onEdit(comment)}
                  sx={{
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    fontWeight: 600,
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    '&:hover': { color: '#6B7280' },
                  }}
                >
                  Edit
                </Typography>
              )}
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            {isEditedClientComment && (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
                {!showOriginal && (
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      fontStyle: 'italic',
                      color: '#9CA3AF',
                    }}
                  >
                    Edited,
                  </Typography>
                )}
                <Typography
                  data-interactive
                  onClick={() => setShowOriginal((prev) => !prev)}
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    ml: showOriginal ? 0 : 0.5,
                    '&:hover': { color: '#6B7280' },
                  }}
                >
                  {showOriginal ? 'Back to edited' : 'see original'}
                </Typography>
              </Box>
            )}
            {showRepliesToggle && (
              <DarkGlassTooltip title={isRepliesOpen ? 'Hide replies' : 'Show replies'} placement="top">
                <Box
                  data-interactive
                  component="button"
                  type="button"
                  onClick={() => onToggleReplies?.(comment.id)}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.35,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    mr: 0.5,
                    '&:hover': { opacity: 0.9 },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: '0.875rem', md: '0.95rem' },
                      fontWeight: 700,
                      color: repliesToggleColor,
                      lineHeight: 1,
                      userSelect: 'none',
                    }}
                  >
                    {replyCount}
                  </Typography>
                  <Box
                    aria-label="Replies"
                    sx={{
                      width: { xs: 16, md: 18 },
                      height: { xs: 16, md: 18 },
                      display: 'block',
                      flexShrink: 0,
                      bgcolor: repliesToggleColor,
                      WebkitMaskImage: 'url(/favicon/repliesicon.svg)',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      WebkitMaskSize: 'contain',
                      maskImage: 'url(/favicon/repliesicon.svg)',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      maskSize: 'contain',
                    }}
                  />
                </Box>
              </DarkGlassTooltip>
            )}
            {hasAgreed && (
              <DarkGlassTooltip
                title={(() => {
                  const names = comment.agreedBy
                    ?.map((a) => a.user?.name)
                    .filter(Boolean)
                    .join(', ');
                  return names ? `Agreed by ${names}` : 'Agreed';
                })()}
                placement="top"
              >
                <IconButton size="small" sx={{ p: 0.5 }}>
                  <Iconify
                    icon="mdi:thumb-up"
                    width={20}
                    sx={{
                      color: '#1340FF',
                      filter: 'drop-shadow(0px 0px 0.2px #000000)',
                    }}
                  />
                </IconButton>
              </DarkGlassTooltip>
            )}
            {!isReply && (
              <DarkGlassTooltip
                title={
                  // eslint-disable-next-line no-nested-ternary
                  isResolved
                    ? comment.resolvedAt
                      ? `Resolved at ${fDateTime(comment.resolvedAt)}${comment.resolvedBy?.name ? ` by ${comment.resolvedBy.name}` : ''}`
                      : 'Resolved'
                    : 'Mark as Resolved'
                }
                placement="top"
              >
                <IconButton
                  size="small"
                  sx={{ p: 0.5 }}
                  onClick={isPastVideo ? undefined : () => onToggleResolve?.(comment.id)}
                >
                  <Iconify
                    icon={isResolved ? 'mdi:check-circle' : 'mdi:check-circle-outline'}
                    width={20}
                    sx={{ color: isResolved ? '#00A76F' : '#919191' }}
                  />
                </IconButton>
              </DarkGlassTooltip>
            )}
          </Box>
        </Box>
      )}

      {/* Inline Reply Input */}
      <AnimatePresence>
        {inlineReplyTarget === comment.id && (
          <m.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <Box
              sx={{
                border: '1px solid #E7E7E7',
                borderRadius: '8px',
                bgcolor: '#FFFFFF',
                p: 1.5,
              }}
            >
              <TextField
                inputRef={(input) => {
                  if (input) input.focus();
                }}
                multiline
                minRows={1}
                maxRows={4}
                placeholder={`Reply to ${comment.forwardedBy?.name || comment.user?.name || 'Unknown'}...`}
                value={inlineReplyText}
                onChange={(e) => onInlineReplyTextChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSendInlineReply?.();
                  }
                }}
                size="small"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    border: 'none',
                    '& fieldset': { border: 'none' },
                    p: 0,
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.875rem',
                    fontFamily: 'Inter, sans-serif',
                    p: 0,
                    lineHeight: 1.5,
                    '&::placeholder': {
                      color: '#B0B0B0',
                      opacity: 1,
                    },
                  },
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  size="small"
                  onClick={onCancelInlineReply}
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#1340FF',
                    bgcolor: 'transparent',
                    border: '1px solid #E7E7E7',
                    borderBottom: '3px solid #E7E7E7',
                    borderRadius: 1,
                    px: 1.5,
                    py: 0.5,
                    '&:hover': {
                      bgcolor: '#F9F9F9',
                      border: '1px solid #E7E7E7',
                      borderBottom: '3px solid #E7E7E7',
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={!inlineReplyText?.trim()}
                  onClick={onSendInlineReply}
                  sx={{
                    bgcolor: '#1340ff',
                    borderBottom: '2px solid #0A238C',
                    boxShadow: 'inset 0px -2px 0px 0px #0A238C',
                    borderRadius: 1,
                    minWidth: 'unset',
                    minHeight: 28,
                    px: 1.5,
                    py: 0.5,
                    '&:hover': { bgcolor: '#1a4dff' },
                    '&.Mui-disabled': {
                      bgcolor: 'action.disabledBackground',
                      color: 'action.disabled',
                      borderBottomColor: 'action.disabledBackground',
                      boxShadow: 'none',
                    },
                  }}
                >
                  <Iconify icon="ic:round-send" width={18} sx={{ color: 'white' }} />
                </Button>
              </Box>
            </Box>
          </m.div>
        )}
      </AnimatePresence>
    </Box>
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      {pendingDelete ? pendingDeleteContent : (
        <m.div
          key="comment-card"
          initial={{ opacity: 0, x: -30, filter: 'blur(4px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: -30, filter: 'blur(4px)' }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {cardContent}
        </m.div>
      )}
    </AnimatePresence>
  );
};

CommentCard.propTypes = {
  comment: PropTypes.object.isRequired,
  onTimestampClick: PropTypes.func,
  onReply: PropTypes.func,
  replyCount: PropTypes.number,
  isRepliesOpen: PropTypes.bool,
  onToggleReplies: PropTypes.func,
  isReply: PropTypes.bool,
  isPastVideo: PropTypes.bool,
  onEdit: PropTypes.func,
  onToggleResolve: PropTypes.func,
  editTarget: PropTypes.object,
  onSaveEdit: PropTypes.func,
  onCancelEdit: PropTypes.func,
  editText: PropTypes.string,
  onEditTextChange: PropTypes.func,
  inlineReplyTarget: PropTypes.string,
  inlineReplyText: PropTypes.string,
  onInlineReplyTextChange: PropTypes.func,
  onSendInlineReply: PropTypes.func,
  onCancelInlineReply: PropTypes.func,
  isAdminView: PropTypes.bool,
  onToggleVisibility: PropTypes.func,
  isNew: PropTypes.bool,
  isNewCreatorReply: PropTypes.bool,
  onDelete: PropTypes.func,
  onUndoDelete: PropTypes.func,
  pendingDelete: PropTypes.bool,
  pendingDeleteStartTime: PropTypes.number,
  currentUserId: PropTypes.string,
  parentResolved: PropTypes.bool,
};

const getNewItemLabel = ({ replies, messages }) => {
  const total = replies + messages;
  if (replies > 0 && messages === 0) return `${total} New ${replies === 1 ? 'Reply' : 'Replies'}`;
  return `${total} New ${total === 1 ? 'Message' : 'Messages'}`;
};

// ---------------------------------------------------------------------------
// AdminFeedbackPanel
// ---------------------------------------------------------------------------

export default function AdminFeedbackPanel({
  currentTime = 0,
  duration = 0,
  onSeek,
  submission,
  videoId,
  videoPage,
  setVideoPage,
  videoCount = 1,
  isPastVideo = false,
  onFeedbackSent,
}) {
  const [commentText, setCommentText] = useState('');
  const [inlineReplyTarget, setInlineReplyTarget] = useState(null); // commentId or null
  const [inlineReplyText, setInlineReplyText] = useState('');
  const [editTarget, setEditTarget] = useState(null); // { commentId, originalText }
  const [editText, setEditText] = useState('');
  const [openRepliesById, setOpenRepliesById] = useState({});
  const [sessionNewReplyIds, setSessionNewReplyIds] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [confirmSendToClientOpen, setConfirmSendToClientOpen] = useState(false);
  const [confirmSendToCreatorOpen, setConfirmSendToCreatorOpen] = useState(false);
  const [pendingDeletes, setPendingDeletes] = useState(new Map()); // commentId -> { timeoutId, startTime }

  const { user } = useAuthContext();

  const { socket } = useSocketContext();
  const { comments, commentsLoading, commentsMutate } = useSubmissionComments(
    submission?.id,
    videoId
  );

  const commentsEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const initialLoadDone = useRef(false);
  const firstViewExpandDone = useRef(false);
  const [newAbove, setNewAbove] = useState({ replies: 0, messages: 0, targetId: null });
  const [newBelow, setNewBelow] = useState({ replies: 0, messages: 0, targetId: null });

  // Track which client comments are new (created after admin last viewed)
  const lastViewedRef = useRef(null);
  useEffect(() => {
    lastViewedRef.current = null;
  }, [videoId]);
  const newClientCommentIds = useMemo(() => {
    if (!comments?.length || !videoId) return new Set();

    const storageKey = `admin_lastViewed_${submission?.id}_${videoId}`;
    if (lastViewedRef.current === null) {
      const stored = localStorage.getItem(storageKey);
      lastViewedRef.current = stored ? new Date(stored).getTime() : 0;
    }
    const cutoff = lastViewedRef.current;

    const ids = new Set();
    const checkComment = (c) => {
      if (c.user?.role === 'client' && new Date(c.createdAt).getTime() > cutoff) {
        ids.add(c.id);
      }
    };
    comments.forEach((c) => {
      checkComment(c);
      (c.replies || []).forEach(checkComment);
    });
    return ids;
  }, [comments, videoId, submission?.id]);

  const newCreatorReplyIds = useMemo(() => {
    if (!comments?.length || !videoId) return new Set();
    const cutoff = lastViewedRef.current || 0;
    const ids = new Set();
    comments.forEach((c) => {
      (c.replies || []).forEach((r) => {
        if (r.user?.role === 'creator' && new Date(r.createdAt).getTime() > cutoff) {
          ids.add(r.id);
        }
      });
    });
    return ids;
  }, [comments, videoId]);

  // Update last-viewed timestamp after comments load
  useEffect(() => {
    if (!commentsLoading && comments?.length && videoId && submission?.id) {
      const storageKey = `admin_lastViewed_${submission.id}_${videoId}`;
      // Small delay so the red dots are visible briefly before clearing on next load
      const timer = setTimeout(() => {
        localStorage.setItem(storageKey, new Date().toISOString());
        lastViewedRef.current = Date.now();
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [commentsLoading, comments?.length, videoId, submission?.id]);

  // Write localStorage on unmount (modal close) so reopening sees updated timestamp
  useEffect(() => {
    const sid = submission?.id;
    const vid = videoId;
    if (!sid || !vid) return undefined;
    return () => {
      const storageKey = `admin_lastViewed_${sid}_${vid}`;
      localStorage.setItem(storageKey, new Date().toISOString());
    };
  }, [submission?.id, videoId]);

  // Expand threads that have new unseen client or creator replies
  useEffect(() => {
    if (!comments?.length || firstViewExpandDone.current) return;
    firstViewExpandDone.current = true;

    const expandMap = {};
    comments.forEach((c) => {
      const hasNewClientOrCreatorReply = (c.replies || []).some(
        (r) => newClientCommentIds.has(r.id) || newCreatorReplyIds.has(r.id)
      );
      if (hasNewClientOrCreatorReply) expandMap[c.id] = true;
    });
    if (Object.keys(expandMap).length > 0) {
      setOpenRepliesById((prev) => ({ ...prev, ...expandMap }));
    }
  }, [comments, newClientCommentIds, newCreatorReplyIds]);

  // Track page-slide direction: 1 = slide from right, -1 = slide from left
  const prevVideoPageRef = useRef(videoPage);
  const slideDirection = useRef(0);
  if (videoPage !== prevVideoPageRef.current) {
    // videoPage decreasing = navigating to older page = new content from right
    slideDirection.current = videoPage < prevVideoPageRef.current ? 1 : -1;
    prevVideoPageRef.current = videoPage;
  }

  const pageSlideVariants = {
    enter: (dir) => (dir !== 0 ? { x: `${dir * 40}%`, opacity: 0 } : { opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: `${dir * -40}%`, opacity: 0 }),
  };

  // Drag-to-seek on timer chip
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;

  const handleTimerMouseDown = useCallback(
    (e) => {
      if (!duration) return;
      e.preventDefault();
      isDraggingRef.current = true;
      dragStartXRef.current = e.clientX;
      dragStartTimeRef.current = currentTimeRef.current;

      const handleMouseMove = (moveEvent) => {
        if (!isDraggingRef.current) return;
        const deltaX = moveEvent.clientX - dragStartXRef.current;
        const newTime = Math.max(0, Math.min(duration, dragStartTimeRef.current + deltaX * 0.15));
        onSeek(newTime);
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [duration, onSeek]
  );

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket || !submission?.id) return undefined;

    const handleCommentEvent = (data) => {
      if (data.submissionId === submission.id && !data.comment?.isClientDraft) {
        commentsMutate();
      }
    };

    const handleNewItem = (data, isReply) => {
      if (data.submissionId !== submission.id || data.comment?.isClientDraft) return;
      commentsMutate();
      // Track reply IDs that arrive during this session so they render outside the Collapse
      if (isReply && data.comment?.id) {
        setSessionNewReplyIds((prev) => new Set([...prev, data.comment.id]));
      }
      // Skip indicator for own messages
      if (data.comment?.userId === user?.id) return;
      if (!initialLoadDone.current) return;
      // Determine direction after DOM updates
      setTimeout(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const parentId = isReply ? data.parentCommentId : data.comment?.id;
        const parentEl = parentId && container.querySelector(`[data-comment-id="${parentId}"]`);
        const key = isReply ? 'replies' : 'messages';
        if (parentEl) {
          const parentRect = parentEl.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          if (parentRect.bottom < containerRect.top) {
            setNewAbove((prev) => ({ ...prev, [key]: prev[key] + 1, targetId: prev.targetId || parentId }));
          } else if (parentRect.bottom > containerRect.bottom) {
            setNewBelow((prev) => ({ ...prev, [key]: prev[key] + 1, targetId: prev.targetId || parentId }));
          }
        } else {
          setNewBelow((prev) => ({ ...prev, [key]: prev[key] + 1, targetId: prev.targetId || parentId }));
        }
      }, 200);
    };

    const handleDeletedEvent = (data) => {
      if (data.submissionId === submission.id) {
        // Skip revalidation if we're still showing the pending-delete UI
        if (pendingDeletesRef.current.has(data.commentId)) return;
        commentsMutate();
      }
    };

    const handleNewComment = (data) => handleNewItem(data, false);
    const handleNewReply = (data) => handleNewItem(data, true);

    socket.on('v4:comment:added', handleNewComment);
    socket.on('v4:comment:updated', handleCommentEvent);
    socket.on('v4:comment:reply:added', handleNewReply);
    socket.on('v4:comment:deleted', handleDeletedEvent);
    socket.on('v4:comment:agreed', handleCommentEvent);

    return () => {
      socket.off('v4:comment:added', handleNewComment);
      socket.off('v4:comment:updated', handleCommentEvent);
      socket.off('v4:comment:reply:added', handleNewReply);
      socket.off('v4:comment:deleted', handleDeletedEvent);
      socket.off('v4:comment:agreed', handleCommentEvent);
    };
  }, [socket, submission?.id, user?.id, commentsMutate]);

  // Reset scroll state on mount and when switching video pages
  useEffect(() => {
    initialLoadDone.current = false;
    firstViewExpandDone.current = false;
    setSessionNewReplyIds(new Set());
  }, [videoId]);

  // Scroll to bottom on initial load / page switch (instant) and when new comments are added (smooth)
  useEffect(() => {
    if (!commentsEndRef.current || !comments?.length || commentsLoading) return;
    if (!initialLoadDone.current) {
      // Use requestAnimationFrame to ensure replies/nested content have rendered
      requestAnimationFrame(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'instant' });
      });
      initialLoadDone.current = true;
      return;
    }
    commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [comments?.length, commentsLoading, videoId]);

  const clearNewIndicators = () => {
    setNewAbove({ replies: 0, messages: 0, targetId: null });
    setNewBelow({ replies: 0, messages: 0, targetId: null });
  };

  const scrollToThread = (targetId) => {
    const container = scrollContainerRef.current;
    if (!container || !targetId) return;
    const threadEl = container.querySelector(`[data-comment-id="${targetId}"]`);
    if (threadEl) {
      const threadRect = threadEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      // Scroll so the bottom of the thread (where the new reply is) is visible
      const scrollOffset = threadRect.bottom - containerRect.bottom;
      if (scrollOffset > 0) {
        container.scrollBy({ top: scrollOffset + 16, behavior: 'smooth' });
      } else if (threadRect.top < containerRect.top) {
        container.scrollBy({ top: threadRect.top - containerRect.top - 16, behavior: 'smooth' });
      }
    }
  };

  // Keep a ref in sync for cleanup on unmount
  const pendingDeletesRef = useRef(pendingDeletes);
  useEffect(() => { pendingDeletesRef.current = pendingDeletes; }, [pendingDeletes]);

  // Clear pending delete timeouts on unmount
  useEffect(() => () => {
    pendingDeletesRef.current.forEach(({ timeoutId }) => clearTimeout(timeoutId));
  }, []);

  // ---- Handlers ----

  const handleDeleteComment = useCallback((commentId) => {
    if (pendingDeletesRef.current.has(commentId)) return;
    const startTime = Date.now();
    const timeoutId = setTimeout(async () => {
      try {
        await axiosInstance.delete(endpoints.submission.v4.deleteComment(commentId));
        // Hold the "Comment deleted." state for a bit before removing
        await new Promise((r) => setTimeout(r, 1000));
        commentsMutate();
      } catch (error) {
        enqueueSnackbar('Failed to delete comment', { variant: 'error' });
        commentsMutate();
      }
      setPendingDeletes((prev) => {
        const next = new Map(prev);
        next.delete(commentId);
        return next;
      });
    }, 6000);
    setPendingDeletes((prev) => {
      const next = new Map(prev);
      next.set(commentId, { timeoutId, startTime });
      return next;
    });
  }, [commentsMutate]);

  const handleUndoDelete = useCallback((commentId) => {
    setPendingDeletes((prev) => {
      const entry = prev.get(commentId);
      if (entry) clearTimeout(entry.timeoutId);
      const next = new Map(prev);
      next.delete(commentId);
      return next;
    });
  }, []);

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text) return;

    try {
      await axiosInstance.post(endpoints.submission.v4.comments(submission.id), {
        text,
        timestamp: formatTime(currentTime),
        videoId,
      });
      setCommentText('');
    } catch (error) {
      enqueueSnackbar('Failed to send comment', { variant: 'error' });
    }
  };

  const handleReply = (comment) => {
    setInlineReplyTarget(comment.id);
    setInlineReplyText('');
    setEditTarget(null);
  };

  const handleSendInlineReply = async () => {
    const text = inlineReplyText.trim();
    if (!text || !inlineReplyTarget) return;

    const { timestamp, text: parsedText } = extractTimestamp(text);

    try {
      await axiosInstance.post(endpoints.submission.v4.comments(submission.id), {
        text: parsedText,
        videoId,
        parentId: inlineReplyTarget,
        ...(timestamp && { timestamp }),
      });
      const replyParentId = inlineReplyTarget;
      setInlineReplyTarget(null);
      setInlineReplyText('');
      // Scroll to the thread where the reply was added
      setTimeout(() => {
        scrollToThread(replyParentId);
        clearNewIndicators();
      }, 300);
    } catch (error) {
      enqueueSnackbar('Failed to send reply', { variant: 'error' });
    }
  };

  const handleCancelInlineReply = () => {
    setInlineReplyTarget(null);
    setInlineReplyText('');
  };

  const handleEdit = (comment) => {
    setEditTarget({
      commentId: comment.id,
      originalText: comment.text,
      timestamp: comment.timestamp,
    });
    setEditText(comment.text);
    setInlineReplyTarget(null);
  };

  const handleSaveEdit = async (commentId) => {
    const text = editText.trim();
    if (!text) return;

    const timestamp = editTarget?.timestamp || null;

    try {
      await axiosInstance.patch(endpoints.submission.v4.updateComment(commentId), {
        text,
        timestamp,
      });
      setEditTarget(null);
      setEditText('');
    } catch (error) {
      enqueueSnackbar('Failed to edit comment', { variant: 'error' });
    }
  };

  const handleCancelEdit = () => {
    setEditTarget(null);
    setEditText('');
  };

  const handleToggleResolve = async (commentId) => {
    try {
      await axiosInstance.patch(endpoints.submission.v4.resolveComment(commentId));
    } catch (error) {
      enqueueSnackbar('Failed to update resolve status', { variant: 'error' });
    }
  };

  const handleToggleVisibility = async (commentId) => {
    // Optimistic update to prevent checkbox flicker
    commentsMutate(
      (prev) =>
        prev?.map((c) => {
          if (c.id === commentId)
            return { ...c, isVisibleToCreator: c.isVisibleToCreator === false };
          const updatedReplies = c.replies?.map((r) =>
            r.id === commentId ? { ...r, isVisibleToCreator: r.isVisibleToCreator === false } : r
          );
          return updatedReplies !== c.replies ? { ...c, replies: updatedReplies } : c;
        }),
      false
    );
    try {
      await axiosInstance.patch(endpoints.submission.v4.toggleCommentVisibility(commentId));
    } catch (error) {
      enqueueSnackbar('Failed to update visibility', { variant: 'error' });
      commentsMutate(); // revert by revalidating from server
    }
  };

  const handleSendToCreator = async () => {
    setSending(true);
    try {
      await axiosInstance.post(endpoints.submission.v4.sendToCreator(submission.id), { videoId });
      enqueueSnackbar('Feedback sent to creator', { variant: 'success' });
      onFeedbackSent?.();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to send feedback', { variant: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleSendToClient = async () => {
    setSending(true);
    try {
      await axiosInstance.post(endpoints.submission.v4.sendToClient(submission.id), { videoId });
      enqueueSnackbar('Feedback sent to client', { variant: 'success' });
      onFeedbackSent?.();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to send feedback', { variant: 'error' });
    } finally {
      setSending(false);
    }
  };

  // ---- Button visibility ----
  const isReadOnly =
    isPastVideo ||
    submission?.status === 'CHANGES_REQUIRED' ||
    submission?.status === 'SENT_TO_CLIENT' ||
    submission?.status === 'APPROVED' ||
    submission?.status === 'CLIENT_APPROVED' ||
    submission?.status === 'POSTED';

  const showSendToClient =
    submission?.status === 'PENDING_REVIEW' && submission?.campaign?.origin !== 'ADMIN';

  const showSendToCreator =
    submission?.status === 'PENDING_REVIEW' || submission?.status === 'CLIENT_FEEDBACK';

  // During PENDING_REVIEW (first round) all comments are auto-included — no selection needed.
  // Selection UI and toggle are only active during CLIENT_FEEDBACK.
  const isFirstRound = submission?.status === 'PENDING_REVIEW';

  const hasComments = comments.length > 0;

  const visibleFeedbackCount = useMemo(
    () =>
      comments.reduce((count, c) => {
        const parentVisible = c.isVisibleToCreator !== false ? 1 : 0;
        const repliesVisible = (c.replies || []).filter(
          (r) => r.isVisibleToCreator !== false
        ).length;
        return count + parentVisible + repliesVisible;
      }, 0),
    [comments]
  );

  // ---- Render ----

  return (
    <Box
      sx={{
        flex: { xs: '1 1 auto', md: '0 0 calc(40% - 20px)' },
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Scrollable Comments Area */}
      <Box
        ref={scrollContainerRef}
        onScroll={() => {
          const container = scrollContainerRef.current;
          if (!container) return;
          const { scrollTop, scrollHeight, clientHeight } = container;
          if (scrollTop < 100) setNewAbove({ replies: 0, messages: 0, targetId: null });
          if (scrollHeight - scrollTop - clientHeight < 100) setNewBelow({ replies: 0, messages: 0, targetId: null });
        }}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          pr: 1,
          pt: 1,
          pb: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.1)', borderRadius: '4px' },
        }}
      >
        {/* New items above indicator */}
        <AnimatePresence>
          {(newAbove.replies > 0 || newAbove.messages > 0) && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ position: 'sticky', top: 0, zIndex: 10, pointerEvents: 'none' }}
            >
              <Box
                onClick={() => {
                  scrollToThread(newAbove.targetId);
                  setNewAbove({ replies: 0, messages: 0, targetId: null });
                }}
                sx={{
                  background: 'linear-gradient(to bottom, #F4F4F4 30%, transparent 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  pb: 4,
                  pt: 1,
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                }}
              >
                <Iconify icon="mdi:arrow-up" width={14} sx={{ color: '#1340FF' }} />
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1340FF', whiteSpace: 'nowrap' }}>
                  {getNewItemLabel(newAbove)}
                </Typography>
              </Box>
            </m.div>
          )}
        </AnimatePresence>

        {commentsLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!commentsLoading && (
          <AnimatePresence initial={false} mode="wait" custom={slideDirection.current}>
            <m.div
              key={videoId}
              custom={slideDirection.current}
              variants={pageSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}
            >
              {comments.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                  }}
                >
                  <Typography sx={{ color: '#636366', fontSize: '1rem', fontWeight: 500 }}>
                    No Comments Currently
                  </Typography>
                </Box>
              ) : (
                (() => {
                  const unresolvedComments = isPastVideo ? [] : comments.filter((c) => !c.resolvedByUserId && !c.resolvedAt);
                  const resolvedComments = isPastVideo ? comments : comments.filter((c) => !!c.resolvedByUserId || !!c.resolvedAt);

                  const renderCommentThread = (comment) => {
                    const allReplies = comment.replies || [];
                    const sessionNewReplies = allReplies.filter((r) => sessionNewReplyIds.has(r.id));
                    const isExpanded = openRepliesById[comment.id] === true;

                    const renderReplyItem = (reply, index, list) => {
                      const isLast = index === list.length - 1;
                      return (
                        <Box key={reply.id} sx={{ position: 'relative', ml: 12 }}>
                          <Box
                            sx={{
                              position: 'absolute',
                              left: -56,
                              top: index === 0 ? -6 : -16,
                              bottom: isLast ? 'calc(50% + 20px)' : 0,
                              borderLeft: '2px solid #8E8E93',
                              zIndex: 0,
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              left: -56,
                              top: index === 0 ? 0 : -16,
                              bottom: 'calc(50% - 1px)',
                              width: 45,
                              borderLeft: '2px solid #8E8E93',
                              borderBottom: '2px solid #8E8E93',
                              borderBottomLeftRadius: 20,
                              zIndex: 0,
                            }}
                          />
                          <CommentCard
                            comment={reply}
                            isReply
                            parentResolved={!!comment.resolvedByUserId || !!comment.resolvedAt}
                            isPastVideo={isPastVideo}
                            onTimestampClick={onSeek}
                            onReply={handleReply}
                            onEdit={handleEdit}
                            onToggleResolve={handleToggleResolve}
                            editTarget={editTarget}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={handleCancelEdit}
                            editText={editText}
                            onEditTextChange={setEditText}
                            inlineReplyTarget={inlineReplyTarget}
                            inlineReplyText={inlineReplyText}
                            onInlineReplyTextChange={setInlineReplyText}
                            onSendInlineReply={handleSendInlineReply}
                            onCancelInlineReply={handleCancelInlineReply}
                            isAdminView
                            onToggleVisibility={!isReadOnly && !isFirstRound ? handleToggleVisibility : undefined}
                            isNew={newClientCommentIds.has(reply.id)}
                            isNewCreatorReply={newCreatorReplyIds.has(reply.id)}
                            onDelete={handleDeleteComment}
                            onUndoDelete={handleUndoDelete}
                            pendingDelete={pendingDeletes.has(reply.id)}
                            pendingDeleteStartTime={pendingDeletes.get(reply.id)?.startTime}
                            currentUserId={user?.id}
                            feedbackSent={isReadOnly && !isPastVideo && submission?.status !== 'SENT_TO_CLIENT'}
                          />
                        </Box>
                      );
                    };

                    return (
                    <m.div
                      key={comment.id}
                      data-comment-id={comment.id}
                      initial={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, x: '100%', height: 0, marginBottom: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], height: { delay: 0.3, duration: 0.3 } }}
                    >
                      <CommentCard
                        comment={comment}
                        onTimestampClick={onSeek}
                        onReply={handleReply}
                        replyCount={allReplies.length}
                        isRepliesOpen={isExpanded}
                        onToggleReplies={(commentId) => {
                          // When expanding, acknowledge session-new replies so they
                          // become existing on the next collapse
                          if (!isExpanded && sessionNewReplies.length > 0) {
                            setSessionNewReplyIds((prev) => {
                              const next = new Set(prev);
                              sessionNewReplies.forEach((r) => next.delete(r.id));
                              return next;
                            });
                          }
                          // true → undefined (back to initial), undefined → true (expand all)
                          setOpenRepliesById((prev) => ({
                            ...prev,
                            [commentId]: prev[commentId] === true ? undefined : true,
                          }));
                        }}
                        isPastVideo={isPastVideo}
                        onEdit={handleEdit}
                        onToggleResolve={handleToggleResolve}
                        editTarget={editTarget}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                        editText={editText}
                        onEditTextChange={setEditText}
                        inlineReplyTarget={inlineReplyTarget}
                        inlineReplyText={inlineReplyText}
                        onInlineReplyTextChange={setInlineReplyText}
                        onSendInlineReply={handleSendInlineReply}
                        onCancelInlineReply={handleCancelInlineReply}
                        isAdminView
                        onToggleVisibility={!isReadOnly && !isFirstRound ? handleToggleVisibility : undefined}
                        isNew={newClientCommentIds.has(comment.id)}
                        onDelete={handleDeleteComment}
                        onUndoDelete={handleUndoDelete}
                        pendingDelete={pendingDeletes.has(comment.id)}
                        pendingDeleteStartTime={pendingDeletes.get(comment.id)?.startTime}
                        currentUserId={user?.id}
                        feedbackSent={isReadOnly && !isPastVideo && submission?.status !== 'SENT_TO_CLIENT'}
                      />

                      {/* When expanded: merge all replies for continuous connector lines */}
                      <Collapse
                        in={isExpanded && allReplies.length > 0}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
                          {allReplies.map((reply, index) =>
                            renderReplyItem(reply, index, allReplies)
                          )}
                        </Box>
                      </Collapse>

                      {/* Initial state only: session-new replies visible before toggle is clicked */}
                      {!isExpanded && sessionNewReplies.length > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
                          {sessionNewReplies.map((reply, index) =>
                            renderReplyItem(reply, index, sessionNewReplies)
                          )}
                        </Box>
                      )}
                    </m.div>
                    );
                  };

                  return (
                    <>
                      <AnimatePresence initial={false}>
                        {unresolvedComments.map((comment) => renderCommentThread(comment))}
                      </AnimatePresence>

                      {resolvedComments.length > 0 && (
                        <Divider
                          sx={{
                            mb: 1,
                            mt: 1,
                            typography: 'caption',
                            color: '#8E8E93',
                            '&::before, &::after': { borderColor: '#E5E7EB' },
                          }}
                        >
                          resolved comments
                        </Divider>
                      )}

                      <AnimatePresence initial={false}>
                        {resolvedComments.map((comment) => renderCommentThread(comment))}
                      </AnimatePresence>
                    </>
                  );
                })()
              )}
            </m.div>
          </AnimatePresence>
        )}
        <div ref={commentsEndRef} />
      </Box>

      {/* New items below indicator */}
      <AnimatePresence>
        {(newBelow.replies > 0 || newBelow.messages > 0) && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ pointerEvents: 'none', marginTop: -48, position: 'relative', zIndex: 10 }}
          >
            <Box
              onClick={() => {
                scrollToThread(newBelow.targetId);
                setNewBelow({ replies: 0, messages: 0, targetId: null });
              }}
              sx={{
                background: 'linear-gradient(to top, #F4F4F4 30%, transparent 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                pt: 4,
                pb: 1,
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
            >
              <Iconify icon="mdi:arrow-down" width={14} sx={{ color: '#1340FF' }} />
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1340FF', whiteSpace: 'nowrap' }}>
                {getNewItemLabel(newBelow)}
              </Typography>
            </Box>
          </m.div>
        )}
      </AnimatePresence>

      {/* Input Section */}
      {!isReadOnly && hasComments && !isFirstRound && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.75,
            py: 1,
            flexShrink: 0,
            bgcolor: '#FFFFFF',
            border: '1px solid #E7E7E7',
            borderBottom: 'none',
            borderRadius: '12px 12px 0 0',
          }}
        >
          <Typography
            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, fontWeight: 400, color: '#636366', lineHeight: 1.4 }}
          >
            Click on comments to include/exclude it for Creator&apos;s Feedback
          </Typography>
        </Box>
      )}
      {!isReadOnly && (
        <Box
          sx={{
            flexShrink: 0,
            border: '1px solid #E7E7E7',
            borderRadius: hasComments ? '0 0 12px 12px' : '12px',
            bgcolor: '#FFFFFF',
            mb: 0.5,
          }}
        >
          <Box
            sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, px: 2, pt: 1.5, pb: 0.75 }}
          >
            <Box
              onMouseDown={handleTimerMouseDown}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                bgcolor: 'background.paper',
                color: '#1340ff',
                border: '1px solid #E7E7E7',
                borderBottom: '2px solid #E7E7E7',
                borderRadius: 0.85,
                px: 1,
                py: 0.4,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.4,
                userSelect: 'none',
                boxShadow: '0px 1px 0px 0px #E7E7E7',
                flexShrink: 0,
                cursor: duration ? 'ew-resize' : 'default',
              }}
            >
              <AnimatedTime time={formatTime(currentTime)} />
            </Box>
            <TextField
              multiline
              minRows={2}
              maxRows={6}
              placeholder="Leave feedback..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendComment();
                }
              }}
              sx={{
                flex: 1,
                minWidth: 0,
                mt: '3px',
                '& .MuiOutlinedInput-root': {
                  border: 'none',
                  '& fieldset': { border: 'none' },
                  p: 0,
                },
                '& .MuiInputBase-input': {
                  fontSize: 15,
                  fontFamily: 'Inter, sans-serif',
                  p: 0,
                  lineHeight: 1.4,
                  '&::placeholder': {
                    color: '#B0B0B0',
                    opacity: 1,
                    fontFamily: 'Inter, sans-serif',
                  },
                },
              }}
              size="small"
            />
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              px: 1.5,
              pb: 1.25,
            }}
          >
            <Button
              variant="contained"
              disabled={!commentText.trim()}
              onClick={handleSendComment}
              sx={{
                bgcolor: '#1340ff',
                borderBottom: '2px solid #0A238C',
                boxShadow: 'inset 0px -2px 0px 0px #0A238C',
                borderRadius: 1,
                minWidth: 'unset',
                minHeight: 32,
                height: 28,
                px: 1.5,
                py: 0.5,
                '&:hover': {
                  bgcolor: '#1a4dff',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled',
                  borderBottomColor: '#E7E7E7',
                },
              }}
            >
              <Iconify icon="ic:round-send" width={20} sx={{ color: 'white' }} />
            </Button>
          </Box>
        </Box>
      )}

      {/* Pagination + Action Buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
          minHeight: 48,
          flexShrink: 0,
          flexWrap: 'wrap',
          pt: 1,
          pb: 0.5,
        }}
      >
        {/* Pagination - left side (always occupies space) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
          {videoCount > 1 && (
            <>
              <IconButton
                size="small"
                disabled={videoPage === videoCount - 1}
                onClick={() => setVideoPage(videoPage + 1)}
                sx={{ p: 0.25, color: '#231F20', '&.Mui-disabled': { color: '#D1D1D6' } }}
              >
                <Iconify icon="eva:chevron-left-fill" width={24} />
              </IconButton>
              {Array.from({ length: videoCount }, (_, i) => {
                const pageIndex = videoCount - 1 - i;
                return (
                  <Typography
                    key={pageIndex}
                    component={m.span}
                    animate={{ color: videoPage === pageIndex ? '#231F20' : '#8E8E93' }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    onClick={() => setVideoPage(pageIndex)}
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      px: 0.5,
                      userSelect: 'none',
                    }}
                  >
                    {i === 0 ? 'Latest' : i + 1}
                  </Typography>
                );
              })}
              <IconButton
                size="small"
                disabled={videoPage === 0}
                onClick={() => setVideoPage(videoPage - 1)}
                sx={{ p: 0.25, color: '#231F20', '&.Mui-disabled': { color: '#D1D1D6' } }}
              >
                <Iconify icon="eva:chevron-right-fill" width={24} />
              </IconButton>
            </>
          )}
        </Box>

        {/* Send buttons - right side */}
        {!isPastVideo && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {showSendToCreator && (
              <Button
                variant="contained"
                disableElevation
                disabled={!hasComments || sending || visibleFeedbackCount === 0}
                onClick={() => setConfirmSendToCreatorOpen(true)}
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '0.8rem', md: '0.85rem', lg: '0.95rem' },
                  borderRadius: '10px',
                  px: { xs: 1.5, md: 2, lg: 2.5 },
                  py: 0.9,
                  whiteSpace: 'nowrap',
                  boxShadow: 'none',
                  bgcolor: '#3A3A3C',
                  borderBottom: '3px solid #202021',
                  '&:hover': { bgcolor: '#3a3a3cd1', boxShadow: 'none' },
                  '&:active': {
                    borderBottom: '3px solid #202021',
                    transform: 'translateY(1px)',
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#B0B0B1',
                    color: '#FFFFFF',
                    borderBottom: '3px solid #9E9E9F',
                  },
                }}
              >
                {sending ? 'Sending...' : 'Send Feedback to Creator'}
              </Button>
            )}
            {showSendToClient && (
              <Button
                variant="contained"
                disableElevation
                disabled={!hasComments || sending}
                onClick={() => setConfirmSendToClientOpen(true)}
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '0.8rem', md: '0.85rem', lg: '0.95rem' },
                  borderRadius: '10px',
                  px: { xs: 1.5, md: 2, lg: 2.5 },
                  py: 0.9,
                  whiteSpace: 'nowrap',
                  color: '#3A3A3C',
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E7E7E7',
                  borderBottom: '3px solid #E7E7E7',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#F9F9F9',
                    boxShadow: 'none',
                  },
                  '&:active': {
                    borderBottom: '3px solid #E7E7E7',
                    transform: 'translateY(1px)',
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#F2F2F2',
                    color: '#B0B0B1',
                    border: '1px solid #DBDBDB',
                    borderBottom: '3px solid #E7E7E7',
                  },
                }}
              >
                {sending ? 'Sending...' : 'Send Feedback to Client'}
              </Button>
            )}
          </Box>
        )}
      </Box>

      <ConfirmDialogV2
        open={confirmSendToCreatorOpen}
        onClose={() => setConfirmSendToCreatorOpen(false)}
        title={`Send ${visibleFeedbackCount} ${visibleFeedbackCount === 1 ? 'Comment' : 'Comments'} to the Creator?`}
        emoji={
          <Avatar
            src="/assets/images/modals/sent_to_creator.png"
            alt="sent_to_creator"
            sx={{ width: 80, height: 80 }}
          />
        }
        content=""
        action={
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              setConfirmSendToCreatorOpen(false);
              handleSendToCreator();
            }}
            disabled={sending}
          >
            {`Send ${visibleFeedbackCount} ${visibleFeedbackCount === 1 ? 'Comment' : 'Comments'} to the Creator?`}
          </Button>
        }
      />

      <ConfirmDialogV2
        open={confirmSendToClientOpen}
        onClose={() => setConfirmSendToClientOpen(false)}
        title="Send this Submission to Client?"
        emoji={
          <Avatar
            src="/assets/images/modals/send_to_client.png"
            alt="send_to_client"
            sx={{ width: 80, height: 80 }}
          />
        }
        content=""
        action={
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              setConfirmSendToClientOpen(false);
              handleSendToClient();
            }}
            disabled={sending}
          >
            Send this Submission to Client?
          </Button>
        }
      />
    </Box>
  );
}

AdminFeedbackPanel.propTypes = {
  currentTime: PropTypes.number,
  duration: PropTypes.number,
  onSeek: PropTypes.func,
  submission: PropTypes.object,
  videoId: PropTypes.string,
  videoPage: PropTypes.number,
  setVideoPage: PropTypes.func,
  videoCount: PropTypes.number,
  isPastVideo: PropTypes.bool,
  onFeedbackSent: PropTypes.func,
};
