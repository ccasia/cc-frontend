import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { m, AnimatePresence } from 'framer-motion';
import React, { useRef, useState, useEffect, useCallback } from 'react';

import { Box, Avatar, Button, TextField, Typography, IconButton, CircularProgress } from '@mui/material';

import { useSubmissionComments } from 'src/hooks/use-submission-comments';

import { fDateTime } from 'src/utils/format-time';
import axiosInstance, { endpoints } from 'src/utils/axios';

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
    {time.split('').map((char, i) =>
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
}) => {
  const isClientComment = comment.user?.role === 'client';
  const isEditedClientComment = isClientComment && !!comment.forwardedBy;
  const hasAgreed = comment.agreedBy?.length > 0;
  const isResolved = !!comment.resolvedByUserId || isPastVideo;

  const [showOriginal, setShowOriginal] = useState(false);

  // Toggle identity along with text: edited view shows admin, original view shows client
  const showingOriginal = showOriginal && isEditedClientComment;
  const displayName = showingOriginal
    ? (comment.user?.name || 'Unknown')
    : (comment.forwardedBy?.name || comment.user?.name || 'Unknown');
  const displayPhoto = showingOriginal
    ? (comment.user?.photoURL || comment?.user?.client?.company?.logo || null)
    : (comment.forwardedBy?.photoURL || comment.user?.photoURL || comment?.user?.client?.company?.logo || null);
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

  const hasLeftActions = !isPastVideo && ((!isReply && isClientComment && !isEditedClientComment) || (isClientComment && !isEditedClientComment && !!onEdit));

  return (
    <Box
      sx={{
        bgcolor: 'white',
        p: hasLeftActions ? 2 : 1.5,
        borderRadius: 2,
        border: isClientComment && !isEditedClientComment ? '1px solid #2563EB' : '1px solid #EBEBEB',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: hasLeftActions ? 1.5 : 0.75,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5 }}>
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
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {!displayPhoto && displayName.charAt(0)}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                {displayName}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF' }}>
                {displayRole}
              </Typography>
            </Box>
          </m.div>
        </AnimatePresence>
        <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
          {fDateTime(comment.createdAt)}
        </Typography>
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
                  sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1F2937', wordBreak: 'break-word' }}
                >
                  {(() => {
                    const displayTimestamp = showingOriginal && comment.originalTimestamp ? comment.originalTimestamp : comment.timestamp;
                    const displayText = showingOriginal && comment.originalText ? comment.originalText : comment.text;
                    return (
                      <>
                        {displayTimestamp && (
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
                              fontWeight: 700,
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
        <Box sx={{ pl: 0.5, display: 'flex', alignItems: 'center', justifyContent: hasLeftActions ? 'space-between' : 'flex-end' }}>
          {hasLeftActions && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {!isReply && isClientComment && !isEditedClientComment && (
              <Typography
                onClick={() => onReply?.(comment)}
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  '&:hover': { color: '#6B7280' },
                }}
              >
                Reply
              </Typography>
            )}
            {isClientComment && !isEditedClientComment && onEdit && (
              <Typography
                onClick={() => onEdit(comment)}
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  '&:hover': { color: '#6B7280' },
                }}
              >
                Edit
              </Typography>
            )}
          </Box>}
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
            {hasAgreed && (
              <DarkGlassTooltip
                title={(() => {
                  const names = comment.agreedBy?.map((a) => a.user?.name).filter(Boolean).join(', ');
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
            <DarkGlassTooltip title={isResolved ? `Resolved at ${fDateTime(comment.resolvedAt)}` : 'Mark as Resolved'} placement="top">
              <IconButton size="small" sx={{ p: 0.5 }} onClick={isPastVideo ? undefined : () => onToggleResolve?.(comment.id)}>
                <Iconify
                  icon={isResolved ? 'mdi:check-circle' : 'mdi:check-circle-outline'}
                  width={20}
                  sx={{ color: isResolved ? '#00A76F' : '#919191' }}
                />
              </IconButton>
            </DarkGlassTooltip>
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
                    fontSize: 13,
                    fontFamily: 'Inter, sans-serif',
                    p: 0,
                    lineHeight: 1.4,
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
};

CommentCard.propTypes = {
  comment: PropTypes.object.isRequired,
  onTimestampClick: PropTypes.func,
  onReply: PropTypes.func,
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
  const [sending, setSending] = useState(false);
  const [confirmSendToClientOpen, setConfirmSendToClientOpen] = useState(false);
  const [confirmSendToCreatorOpen, setConfirmSendToCreatorOpen] = useState(false);

  const { socket } = useSocketContext();
  const { comments, commentsLoading, commentsMutate } = useSubmissionComments(
    submission?.id,
    videoId
  );

  const commentsEndRef = useRef(null);
  const initialLoadDone = useRef(false);

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

    socket.on('v4:comment:added', handleCommentEvent);
    socket.on('v4:comment:updated', handleCommentEvent);
    socket.on('v4:comment:reply:added', handleCommentEvent);
    socket.on('v4:comment:deleted', handleCommentEvent);
    socket.on('v4:comment:agreed', handleCommentEvent);

    return () => {
      socket.off('v4:comment:added', handleCommentEvent);
      socket.off('v4:comment:updated', handleCommentEvent);
      socket.off('v4:comment:reply:added', handleCommentEvent);
      socket.off('v4:comment:deleted', handleCommentEvent);
      socket.off('v4:comment:agreed', handleCommentEvent);
    };
  }, [socket, submission?.id, commentsMutate]);

  // Reset scroll state on mount and when switching video pages
  useEffect(() => {
    initialLoadDone.current = false;
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

  // ---- Handlers ----

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
      setInlineReplyTarget(null);
      setInlineReplyText('');
    } catch (error) {
      enqueueSnackbar('Failed to send reply', { variant: 'error' });
    }
  };

  const handleCancelInlineReply = () => {
    setInlineReplyTarget(null);
    setInlineReplyText('');
  };

  const handleEdit = (comment) => {
    setEditTarget({ commentId: comment.id, originalText: comment.text, timestamp: comment.timestamp });
    setEditText(comment.text);
    setInlineReplyTarget(null);
  };

  const handleSaveEdit = async (commentId) => {
    const text = editText.trim();
    if (!text) return;

    const timestamp = editTarget?.timestamp || null;

    try {
      await axiosInstance.patch(endpoints.submission.v4.updateComment(commentId), { text, timestamp });
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
  const isReadOnly = isPastVideo || submission?.status === 'CHANGES_REQUIRED' || submission?.status === 'SENT_TO_CLIENT' || submission?.status === 'APPROVED' || submission?.status === 'CLIENT_APPROVED' || submission?.status === 'POSTED';

  const showSendToClient =
    submission?.status === 'PENDING_REVIEW' && submission?.campaign?.origin !== 'ADMIN';

  const showSendToCreator =
    submission?.status === 'PENDING_REVIEW' || submission?.status === 'CLIENT_FEEDBACK';

  const hasComments = comments.length > 0;

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
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          pr: 1,
          pb: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.1)', borderRadius: '4px' },
        }}
      >
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
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
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
                comments.map((comment) => (
                  <div key={comment.id}>
            {/* Parent Comment */}
            <CommentCard
              comment={comment}
              onTimestampClick={onSeek}
              onReply={handleReply}
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
            />

            {/* Threaded Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
                {comment.replies.map((reply, index) => {
                  const isLast = index === comment.replies.length - 1;

                  return (
                    <Box key={reply.id} sx={{ position: 'relative', ml: 12 }}>
                      {/* Vertical line */}
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
                      {/* L-shaped connector */}
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
                      />
                    </Box>
                  );
                })}
              </Box>
            )}
          </div>
                ))
              )}
            </m.div>
          </AnimatePresence>
        )}
        <div ref={commentsEndRef} />
      </Box>

      {/* Input Section */}
      {!isReadOnly && <Box
        sx={{
          flexShrink: 0,
          border: '1px solid #E7E7E7',
          borderRadius: '12px',
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
      </Box>}

      {/* Pagination + Action Buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
          ...(!isReadOnly && { minHeight: 48 }),
          flexShrink: 0,
          flexWrap: 'wrap',
          pt: isReadOnly ? 0.5 : 1,
          pb: isReadOnly ? 0 : 0.5,
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
                disabled={!hasComments || sending}
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
                    borderBottom: '1px solid #202021',
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
                    borderBottom: '1px solid #E7E7E7',
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
        title="Send this Feedback to the Creator?"
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
            Send this Feedback to the Creator?
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
