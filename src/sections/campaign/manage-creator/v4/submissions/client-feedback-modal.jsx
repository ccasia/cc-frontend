import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';
import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Avatar,
  Button,
  Dialog,
  Divider,
  useTheme,
  TextField,
  Typography,
  IconButton,
  Collapse,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import { DarkGlassTooltip } from 'src/components/tooltip/glass-tooltip';

const formatCommentDate = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString));
};

const formatDisplayTime = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':').map(Number);

  if (parts.some(Number.isNaN)) return timeStr;

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return timeStr;
};

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

const CommentCard = ({
  comment,
  isReply = false,
  isNew = false,
  onReplyClick,
  replyCount = 0,
  isRepliesOpen = false,
  onToggleReplies,
  onAgree,
  onTimestampClick,
  currentUser,
  isReplying,
  onCancelReply,
  onSubmitReply,
  isLocked,
  isPastVideo,
  onDelete,
  onUndoDelete,
  pendingDelete = false,
  pendingDeleteStartTime,
}) => {
  const isUser = currentUser?.id === comment?.user?.id;
  const hasAgreed = comment.agreedBy?.some((agreement) => agreement.userId === currentUser?.id);
  const displayName = comment.forwardedBy?.name || comment.user?.name || 'Unknown';
  const displayPhoto = comment.user?.photoURL || comment?.user?.client?.company?.logo || null;

  const isDisabled = isLocked || isPastVideo;
  const showRepliesToggle = !isReply && replyCount > 0;
  const repliesToggleColor = isRepliesOpen ? '#1340FF' : '#919191';
  const canDelete = !!onDelete && !isDisabled && !pendingDelete && isUser;
  const showRepliesToggle = !isReply && replyCount > 0;
  const repliesToggleColor = isRepliesOpen ? '#1340FF' : '#919191';

  // Countdown for pending-delete state
  const [deleteProgress, setDeleteProgress] = useState(100);
  const deleteIntervalRef = useRef(null);
  useEffect(() => {
    if (!pendingDelete || !pendingDeleteStartTime) {
      setDeleteProgress(100);
      return undefined;
    }
    setDeleteProgress(100);
    const startDelay = setTimeout(() => {
      deleteIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - pendingDeleteStartTime;
        const remaining = 100 - (elapsed / 5000) * 100;
        setDeleteProgress(remaining);
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

  const deleteSecondsLeft = Math.max(0, Math.ceil((deleteProgress / 100) * 5));
  const deleteRingValue = Math.max(0, deleteProgress);
  const deleteTimerDone = deleteProgress <= -16;

  const [replyText, setReplyText] = useState('');
  const replyBoxRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isReplying) {
      const timeoutId = setTimeout(() => {
        if (replyBoxRef.current) {
          replyBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        if (inputRef.current) {
          inputRef.current.focus({ preventScroll: true });
        }
      }, 250);
      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [isReplying]);

  const handleReplySubmit = () => {
    if (!replyText.trim()) return;
    onSubmitReply(comment, replyText);
    setReplyText('');
  };

  // Dynamic styling
  const bgColor = isDisabled ? '#EBEBEB' : 'white';
  const shadow = isDisabled || isNew ? 'none' : '0px 1px 2px rgba(0, 0, 0, 0.05)';

  let borderColor = '#E5E7EB';
  if (isDisabled) {
    borderColor = 'transparent';
  } else if (isNew) {
    borderColor = '#1340FF';
  }

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
          border: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', width: 32, height: 32, flexShrink: 0 }}>
            <AnimatePresence mode="wait" initial={false}>
              {deleteTimerDone ? (
                <m.div
                  key="tick"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                  <CircularProgress variant="determinate" value={100} size={32} thickness={4} sx={{ color: '#E0E7FF', position: 'absolute' }} />
                  <CircularProgress variant="determinate" value={deleteRingValue} size={32} thickness={4} sx={{ color: '#1340FF' }} />
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <AnimatePresence initial={false}>
          {!deleteTimerDone && (
            <m.div
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                size="small"
                onClick={() => onUndoDelete?.(comment.id)}
                sx={{
                  fontSize: '0.75rem', fontWeight: 600, color: '#1340FF', bgcolor: 'white',
                  border: '1px solid #E7E7E7', borderBottom: '2px solid #E7E7E7', borderRadius: 1,
                  px: 1.5, py: 0.25, minWidth: 'unset', minHeight: 'unset', lineHeight: 1.4, textTransform: 'none',
                  '&:hover': { bgcolor: '#F9F9F9', border: '1px solid #E7E7E7', borderBottom: '2px solid #E7E7E7' },
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
      sx={{
        bgcolor: bgColor,
        borderRadius: 2,
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: { xs: 1.25, md: 2 },
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 0.75, md: 1 },
        }}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', px: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
              {comment.user?.name?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.813rem', md: '0.875rem' },
                  color: '#111827',
                }}
              >
                {comment.user?.name || 'User'}
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '0.688rem', md: '0.75rem' },
                  fontWeight: 600,
                  color: '#9CA3AF',
                  textTransform: 'capitalize',
                }}
              >
                {comment.user?.role || 'Role'}
              </Typography>
            </Box>
          </Box>
          {canDelete ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25, flexShrink: 0 }}>
              <DarkGlassTooltip title="Delete?" placement="top">
                <IconButton
                  size="small"
                  onClick={() => onDelete(comment.id)}
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
              <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                {formatCommentDate(comment.createdAt)}
              </Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
              {formatCommentDate(comment.createdAt)}
            </Typography>
          )}
        </Box>

        {/* Body */}
        <Box sx={{ pl: 0.5 }}>
          <Typography
            sx={{
              fontSize: { xs: '0.813rem', md: '0.875rem' },
              fontWeight: 500,
              color: '#1F2937',
              wordBreak: 'break-word',
            }}
          >
            {comment.timestamp && (
              <Typography
                component="span"
                onClick={() => onTimestampClick(comment.timestamp)}
                sx={{
                  fontSize: { xs: '0.813rem', md: '0.875rem' },
                  color: '#1340FF',
                  fontWeight: 500,
                  mr: 1,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {formatDisplayTime(comment.timestamp)}
              </Typography>
            )}
            {comment.text}
          </Typography>
        </Box>

        {/* Footer Actions (Hidden if locked) */}
        <Box
          sx={{
            pl: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isReply || isDisabled ? 'flex-end' : 'space-between',
          }}
        >
          {!isDisabled && !isReply && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Typography
                onClick={() => onReplyClick(comment.id)}
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
            </Box>
          )}

          {!isUser && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {showRepliesToggle && (
                <DarkGlassTooltip title={isRepliesOpen ? 'Hide replies' : 'Show replies'} placement="top">
                  <Box
                    component="button"
                    type="button"
                    onClick={onToggleReplies}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.35,
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
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
                        width: { xs: 20, md: 22 },
                        height: { xs: 20, md: 22 },
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

              <DarkGlassTooltip title="I agree with this comment" placement="top">
                <IconButton
                  size="small"
                  sx={{ p: { xs: 0.25, md: 0.5 } }}
                  onClick={() => onAgree(comment.id)}
                  disabled={isDisabled}
                >
                  <Iconify
                    icon={hasAgreed ? 'mdi:thumb-up' : 'mdi-light:thumb-up'}
                    width={{ xs: 16, md: 20 }}
                    sx={{
                      color: !isDisabled && hasAgreed ? '#1340FF' : '#9CA3AF',
                      filter: 'drop-shadow(0px 0px 0.2px #000000)',
                      opacity: isDisabled && !hasAgreed ? 0.6 : 1,
                    }}
                  />
                </IconButton>
              </DarkGlassTooltip>
            </Box>
          )}
        </Box>
      </Box>

      {/* --- INLINE REPLY BOX --- */}
      <AnimatePresence>
        {isReplying && !isDisabled && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <Box
              ref={replyBoxRef}
              sx={{
                borderTop: '1px solid #E5E7EB',
                p: { xs: 1.25, md: 2 },
                bgcolor: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 1, md: 2 },
              }}
            >
              <TextField
                inputRef={inputRef}
                multiline
                minRows={1}
                maxRows={4}
                placeholder="Write your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReplySubmit();
                  }
                }}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: { fontSize: '0.875rem', color: '#1F2937', lineHeight: 1.5 },
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setReplyText('');
                    onCancelReply();
                  }}
                  sx={{
                    borderColor: '#E5E7EB',
                    color: '#1340FF',
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    py: 0.5,
                    px: 2,
                    height: { xs: 28, md: 32 },
                    '&:hover': { borderColor: '#D1D5DB', bgcolor: '#F9FAFB' },
                  }}
                >
                  Cancel
                </Button>

                <Button
                  variant="contained"
                  disabled={!replyText.trim()}
                  onClick={handleReplySubmit}
                  sx={{
                    bgcolor: '#1340FF',
                    borderRadius: 1.5,
                    minWidth: { xs: 40, md: 48 },
                    px: 1,
                    height: { xs: 28, md: 32 },
                    boxShadow: 'none',
                    '&:hover': { bgcolor: '#0B2EB5', boxShadow: 'none' },
                    '&.Mui-disabled': { bgcolor: '#9CA3AF', color: 'white' },
                  }}
                >
                  <Iconify icon="ic:round-send" width={16} />
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
  comment: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    text: PropTypes.string,
    timestamp: PropTypes.string,
    createdAt: PropTypes.string,
    user: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      role: PropTypes.string,
      photoURL: PropTypes.string,
      client: PropTypes.shape({
        company: PropTypes.shape({
          logo: PropTypes.string,
        }),
      }),
    }),
    forwardedBy: PropTypes.shape({
      name: PropTypes.string,
      photoURL: PropTypes.string,
    }),
    agreedBy: PropTypes.arrayOf(
      PropTypes.shape({
        userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ),
  }).isRequired,
  isReply: PropTypes.bool,
  isNew: PropTypes.bool,
  onReplyClick: PropTypes.func,
  replyCount: PropTypes.number,
  isRepliesOpen: PropTypes.bool,
  onToggleReplies: PropTypes.func,
  onAgree: PropTypes.func,
  onTimestampClick: PropTypes.func,
  currentUser: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  isReplying: PropTypes.bool,
  onCancelReply: PropTypes.func,
  onSubmitReply: PropTypes.func,
  isLocked: PropTypes.bool,
  isPastVideo: PropTypes.bool,
  onDelete: PropTypes.func,
  onUndoDelete: PropTypes.func,
  pendingDelete: PropTypes.bool,
  pendingDeleteStartTime: PropTypes.number,
};

const ClientFeedbackModal = forwardRef(
  (
    {
      submissionId,
      videoId,
      currentVideoTime = '0:00',
      onSeekTo,
      onSendToAdmin,
      isLocked,
      isPastVideo,
      videoPage,
      setVideoPage,
      videoCount,
      feedbackDeadline,
      feedbackSentByName,
    },
    ref
  ) => {
    const { user } = useAuthContext();
    const { socket } = useSocketContext();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [comments, setComments] = useState([]);
    const [pendingDeletes, setPendingDeletes] = useState(new Map());
    const pendingDeletesRef = useRef(pendingDeletes);
    useEffect(() => { pendingDeletesRef.current = pendingDeletes; }, [pendingDeletes]);
    useEffect(() => () => {
      pendingDeletesRef.current.forEach(({ timeoutId }) => clearTimeout(timeoutId));
    }, []);
    const [feedbackText, setFeedbackText] = useState('');
    const [replyingToId, setReplyingToId] = useState(null);
    const [openRepliesById, setOpenRepliesById] = useState({});

    const [hasInteracted, setHasInteracted] = useState(false);
    const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);

    const COUNTDOWN_SECONDS = 24 * 60 * 60;
    const STORAGE_KEY_END_TIME = `send_timer_end_${submissionId}_${videoId}`;

    const [timeLeft, setTimeLeft] = useState(() => {
      if (!feedbackDeadline) return 0;
      return Math.max(0, Math.floor((new Date(feedbackDeadline).getTime() - Date.now()) / 1000));
    });
    const [isCountingDown, setIsCountingDown] = useState(timeLeft > 0);

    const commentRefs = useRef({});
    const prevRemainingRef = useRef(-1);
    const isTimerExpired = Boolean(feedbackDeadline) && timeLeft === 0;
    const effectiveIsLocked = isLocked || isPastVideo || isTimerExpired;
    console.log('feedbackDeadline:', feedbackDeadline);
    console.log('isCountingDown:', isCountingDown);
    console.log('timeLeft:', timeLeft);

    useImperativeHandle(ref, () => ({
      getHasInteracted: () => hasInteracted,
      isLocked,
      isCountingDown,
      startCountdown: () => {
        if (onSendToAdmin) onSendToAdmin(videoId);
      },
    }));

    const formatTimer = (totalSeconds) => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds / 60) % 60);
      const seconds = totalSeconds % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
      setComments([]);
    }, [videoId]);

    // 1. Fetch Comments from Backend
    useEffect(() => {
      if (!submissionId || !videoId) return;
      const fetchComments = async () => {
        try {
          const { data } = await axiosInstance.get(
            `/api/submissions/v4/submission/${submissionId}/comments?videoId=${videoId}`
          );

          const storageKey = `lastViewed_sub_${submissionId}_vid_${videoId}_user${user.id}`;
          const lastViewedStr = localStorage.getItem(storageKey);
          const lastViewedTime = lastViewedStr ? new Date(lastViewedStr).getTime() : 0;

          const markUnreadComments = (list) =>
            list.map((comment) => ({
              ...comment,
              isNew: new Date(comment.createdAt).getTime() > lastViewedTime,
              replies: comment.replies ? markUnreadComments(comment.replies) : [],
            }));

          setComments(markUnreadComments(data || []));
          localStorage.setItem(storageKey, new Date().toISOString());
        } catch (err) {
          console.error('Failed to fetch comments', err);
        }
      };
      fetchComments();
    }, [submissionId, videoId, user.id]);

    useEffect(() => {
      if (!feedbackDeadline) {
        setTimeLeft(0);
        setIsCountingDown(false);
        prevRemainingRef.current = -1;
        return undefined;
      }

      const endMs = new Date(feedbackDeadline).getTime();

      const tick = () => {
        const remaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
        setTimeLeft(remaining);
        setIsCountingDown(remaining > 0);

        if (remaining === 0 && prevRemainingRef.current > 0) {
          if (onSendToAdmin) onSendToAdmin(videoId, true);
        }

        prevRemainingRef.current = remaining;
      };

      tick();
      const timerId = setInterval(tick, 1000);

      return () => clearInterval(timerId);
    }, [feedbackDeadline, videoId, onSendToAdmin]);

    // Real-time: listen for admin replies to client parent comments
    useEffect(() => {
      if (!socket || !submissionId) return undefined;

      const handleReplyAdded = (data) => {
        if (data.submissionId !== submissionId || data.videoId !== videoId) return;

        // Skip if reply is from current user (already added optimistically)
        if (data.comment?.userId === user.id) return;

        setComments((prev) => {
          const parent = prev.find((c) => c.id === data.parentCommentId);

          // Only handle replies to client parent comments
          if (!parent || parent.user?.role !== 'client') return prev;

          // Dedup check
          if (parent.replies?.some((r) => r.id === data.comment.id)) return prev;

          return prev.map((c) => {
            if (c.id === data.parentCommentId) {
              return {
                ...c,
                replies: [...(c.replies || []), { ...data.comment, agreedBy: [], isNew: true }],
              };
            }
            return c;
          });
        });

        setTimeout(() => scrollToElement(data.comment.id), 100);
      };

      const handleCommentAdded = (data) => {
        if (data.submissionId !== submissionId || data.videoId !== videoId) return;
        if (data.comment?.userId === user.id) return;

        setComments((prev) => {
          if (prev.some((c) => c.id === data.comment.id)) return prev;
          return [...prev, { ...data.comment, replies: [], agreedBy: [], isNew: true }];
        });

        setTimeout(() => scrollToElement(data.comment.id), 100);
      };

      const handleCommentUpdated = (data) => {
        if (data.submissionId !== submissionId || data.videoId !== videoId) return;

        setComments((prev) =>
          prev.map((c) => {
            if (c.id === data.comment.id) {
              return {
                ...c,
                ...data.comment,
                replies: c.replies,
                agreedBy: c.agreedBy,
                user: data.comment.user || c.user,
                text: data.comment.text ?? c.text,
              };
            }
            if (c.replies?.some((r) => r.id === data.comment.id)) {
              return {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === data.comment.id
                    ? {
                        ...r,
                        ...data.comment,
                        agreedBy: r.agreedBy,
                        user: data.comment.user || r.user,
                        text: data.comment.text ?? r.text,
                      }
                    : r
                ),
              };
            }
            return c;
          })
        );
      };

      const handleCommentDeleted = (data) => {
        if (data.submissionId !== submissionId || data.videoId !== videoId) return;
        // Skip if we're handling this delete locally (pending undo)
        if (pendingDeletesRef.current.has(data.commentId)) return;

        setComments((prev) => {
          const filtered = prev.filter((c) => c.id !== data.commentId);
          return filtered.map((c) => ({
            ...c,
            replies: c.replies?.filter((r) => r.id !== data.commentId) || [],
          }));
        });
      };

      const handleCommentAgreed = (data) => {
        if (data.submissionId !== submissionId || data.videoId !== videoId) return;
        if (data.userId === user.id) return; // client already saw their own like update instantly, no need to process the socket echo

        setComments((prev) =>
          prev.map((c) => {
            if (c.id === data.commentId) {
              return { ...c, agreedBy: data.agreedBy };
            }
            if (c.replies?.some((r) => r.id === data.commentId)) {
              return {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === data.commentId ? { ...r, agreedBy: data.agreedBy } : r
                ),
              };
            }
            return c;
          })
        );
      };

      socket.on('v4:comment:reply:added', handleReplyAdded);
      socket.on('v4:comment:added', handleCommentAdded);
      socket.on('v4:comment:updated', handleCommentUpdated);
      socket.on('v4:comment:deleted', handleCommentDeleted);
      socket.on('v4:comment:agreed', handleCommentAgreed);

      return () => {
        socket.off('v4:comment:reply:added', handleReplyAdded);
        socket.off('v4:comment:added', handleCommentAdded);
        socket.off('v4:comment:updated', handleCommentUpdated);
        socket.off('v4:comment:deleted', handleCommentDeleted);
        socket.off('v4:comment:agreed', handleCommentAgreed);
      };
    }, [socket, submissionId, videoId, user.id]);

    const scrollToElement = (id) => {
      const element = commentRefs.current?.[id];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    const handleTimestampClick = (timestamp) => {
      if (onSeekTo) onSeekTo(timestamp);
    };

    // 2. Toggle Agree (Like) with API
    const handleAgree = async (commentId) => {
      try {
        const { data } = await axiosInstance.post(
          `/api/submissions/v4/comments/${commentId}/agree`
        );

        setHasInteracted(true);
        setComments((prevComments) => {
          const toggleAgree = (list) =>
            list.map((comment) => {
              if (comment.id === commentId) {
                const agreedBy = comment.agreedBy || [];
                return {
                  ...comment,
                  agreedBy: data.agreed
                    ? [...agreedBy, { userId: user.id, user: { id: user.id, name: user.name } }] // Add
                    : agreedBy.filter((agreement) => agreement.userId !== user.id), // Remove
                };
              }
              if (comment.replies) return { ...comment, replies: toggleAgree(comment.replies) };
              return comment;
            });
          return toggleAgree(prevComments);
        });
      } catch (err) {
        console.error('Failed to toggle agreement', err);
      }
    };

    // 3. Delete comment/reply
    const handleDeleteComment = useCallback((commentId) => {
      if (pendingDeletesRef.current.has(commentId)) return;
      const startTime = Date.now();
      const timeoutId = setTimeout(async () => {
        try {
          await axiosInstance.delete(endpoints.submission.v4.deleteCommentByClient(commentId));
          await new Promise((r) => setTimeout(r, 1000));
          setComments((prev) => {
            const filtered = prev.filter((c) => c.id !== commentId);
            return filtered.map((c) => ({
              ...c,
              replies: c.replies?.filter((r) => r.id !== commentId) || [],
            }));
          });
        } catch (error) {
          console.error('Failed to delete comment:', error);
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
    }, []);

    const handleUndoDelete = useCallback((commentId) => {
      setPendingDeletes((prev) => {
        const entry = prev.get(commentId);
        if (entry) clearTimeout(entry.timeoutId);
        const next = new Map(prev);
        next.delete(commentId);
        return next;
      });
    }, []);

    // 4. Submits a reply originating from the inline Reply box
    const handleInlineReplySubmit = async (targetComment, text) => {
      try {
        // Find the ROOT parent to attach the reply to
        const rootParentId = comments.find(
          (c) => c.id === targetComment.id || c.replies?.some((r) => r.id === targetComment.id)
        )?.id;

        const { data } = await axiosInstance.post(
          `/api/submissions/v4/submission/${submissionId}/comments`,
          {
            text,
            parentId: rootParentId,
            timestamp: null,
            videoId,
            isClientDraft: !isCountingDown,
          }
        );

        setHasInteracted(true);

        const newReply = { ...data, isNew: true };

        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === rootParentId) {
              return { ...comment, replies: [...(comment.replies || []), newReply] };
            }
            return comment;
          })
        );

        setReplyingToId(null);
        setTimeout(() => scrollToElement(newReply.id), 100);
      } catch (error) {
        console.error('Failed to post reply', error);
      }
    };

    // 4. Submits a brand new top-level comment from the bottom sticky input
    const handleTopLevelSubmit = async () => {
      if (!feedbackText.trim()) return;

      try {
        const { data } = await axiosInstance.post(
          `/api/submissions/v4/submission/${submissionId}/comments`,
          {
            text: feedbackText,
            timestamp: currentVideoTime,
            parentId: null,
            videoId,
            isClientDraft: !isCountingDown,
          }
        );

        setHasInteracted(true);

        const newComment = { ...data, replies: data.replies || [], isNew: true };

        setComments((prev) => [...prev, newComment]);
        setFeedbackText('');
        setTimeout(() => scrollToElement(newComment.id), 100);
      } catch (error) {
        console.error('Failed to post top-level comment', error);
      }
    };

    const handleSendToAdmin = () => {
      setIsSendConfirmOpen(true);
    };

    const confirmSendFeedback = () => {
      setIsSendConfirmOpen(false);
      if (onSendToAdmin) onSendToAdmin(videoId);
      const endTime = Date.now() + COUNTDOWN_SECONDS * 1000;
      localStorage.setItem(STORAGE_KEY_END_TIME, endTime.toString());
      setTimeLeft(COUNTDOWN_SECONDS);
      setIsCountingDown(true);
    };

    return (
      <Box
        sx={{
          flex: { xs: '1 1 80%', md: '0 0 calc(40% - 20px)' },
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Scrollable Comments Area */}
        <Box
          ref={commentRefs}
          sx={{
            flex: 1,
            overflowY: 'auto',
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
          {/* Empty State */}
          {comments.length === 0 && (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ color: '#8E8E93', fontSize: '0.875rem' }}>
                No Comments Currently
              </Typography>
            </Box>
          )}

          {/* Resolved Comments Divider for older videos */}
          {comments.length > 0 && isPastVideo && (
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
            {comments.map((comment) => (
              <m.div
                key={comment.id}
                initial={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, x: '100%', height: 0, marginBottom: 0, overflow: 'hidden' }}
                transition={{
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1],
                  height: { delay: 0.3, duration: 0.3 },
                }}
              >
                <Box
                  ref={(el) => {
                    if (el) commentRefs.current[comment.id] = el;
                  }}
                >
                  {/* Parent Comment */}
                  <CommentCard
                    comment={comment}
                    currentUser={user}
                    isNew={comment.isNew}
                    onReplyClick={(id) => setReplyingToId(id)}
                    replyCount={(comment.replies || []).length}
                    isRepliesOpen={openRepliesById[comment.id] ?? true}
                    onToggleReplies={() =>
                      setOpenRepliesById((prev) => ({
                        ...prev,
                        [comment.id]: !(prev[comment.id] ?? true),
                      }))
                    }
                    onAgree={handleAgree}
                    onTimestampClick={handleTimestampClick}
                    isReplying={replyingToId === comment.id}
                    onCancelReply={() => setReplyingToId(null)}
                    onSubmitReply={handleInlineReplySubmit}
                    isLocked={effectiveIsLocked}
                    isPastVideo={isPastVideo}
                    onDelete={!effectiveIsLocked ? handleDeleteComment : undefined}
                    onUndoDelete={handleUndoDelete}
                    pendingDelete={pendingDeletes.has(comment.id)}
                    pendingDeleteStartTime={pendingDeletes.get(comment.id)?.startTime}
                  />

                  {/* Threaded Replies */}
                  <Collapse
                    in={
                      (openRepliesById[comment.id] ?? true) &&
                      !!comment.replies &&
                      comment.replies.length > 0
                    }
                    timeout="auto"
                    unmountOnExit
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
                      <AnimatePresence initial={false}>
                        {comment.replies.map((reply, index) => {
                          const isLast = index === comment.replies.length - 1;

                          return (
                            <m.div
                              key={reply.id}
                              initial={{ opacity: 1, height: 'auto' }}
                              exit={{
                                opacity: 0,
                                x: '100%',
                                height: 0,
                                marginBottom: 0,
                                overflow: 'hidden',
                              }}
                              transition={{
                                duration: 0.6,
                                ease: [0.4, 0, 0.2, 1],
                                height: { delay: 0.3, duration: 0.3 },
                              }}
                            >
                              <Box
                                ref={(el) => {
                                  if (el) commentRefs.current[reply.id] = el;
                                }}
                                sx={{ position: 'relative', ml: { xs: 5, md: 10 } }}
                              >
                                {/* Vertical straight line (connects siblings) */}
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    left: { xs: -25, md: -50 },
                                    top: index === 0 ? -4 : -16,
                                    bottom: isLast ? 'calc(50% + 20px)' : -16,
                                    borderLeft: '2px solid #8E8E93',
                                    zIndex: 0,
                                  }}
                                />
                                {/* Curved L-shape linking into the card */}
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    left: { xs: -25, md: -50 },
                                    top: index === 0 ? -4 : -16,
                                    bottom: 'calc(50% - 1px)',
                                    width: { xs: 20, md: 45 },
                                    borderLeft: '2px solid #8E8E93',
                                    borderBottom: '2px solid #8E8E93',
                                    borderBottomLeftRadius: 16,
                                    zIndex: 0,
                                  }}
                                />

                                <CommentCard
                                  comment={reply}
                                  isReply
                                  currentUser={user}
                                  isNew={reply.isNew}
                                  onReplyClick={(id) => setReplyingToId(id)}
                                  onAgree={handleAgree}
                                  onTimestampClick={handleTimestampClick}
                                  isReplying={replyingToId === reply.id}
                                  onCancelReply={() => setReplyingToId(null)}
                                  onSubmitReply={handleInlineReplySubmit}
                                  isLocked={effectiveIsLocked}
                                  isPastVideo={isPastVideo}
                                  onDelete={!effectiveIsLocked ? handleDeleteComment : undefined}
                                  onUndoDelete={handleUndoDelete}
                                  pendingDelete={pendingDeletes.has(reply.id)}
                                  pendingDeleteStartTime={pendingDeletes.get(reply.id)?.startTime}
                                />
                              </Box>
                            </m.div>
                          );
                        })}
                      </AnimatePresence>
                    </Box>
                  </Collapse>
                </Box>
              </m.div>
            ))}
          </AnimatePresence>
        </Box>

        {/* Bottom Sticky Input Section */}
        <Box
          sx={{
            mt: 'auto',
            pt: { xs: 1, md: 2 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {effectiveIsLocked && (
            <Typography
              sx={{
                fontSize: '0.875rem',
                color: '#8E8E93',
                textAlign: 'center',
                fontWeight: 500,
                fontStyle: 'italic',
                mb: -0.5, // Pulls it slightly closer to the box below
              }}
            >
              {isPastVideo ? 'This is an older version' : 'Feedback has been sent'}
            </Typography>
          )}
          {!effectiveIsLocked && !(isMobile && !!replyingToId) && (
            <Box
              sx={{
                flexShrink: 0,
                border: '1px solid #E7E7E7',
                borderBottom: '2px solid #E7E7E7',
                borderRadius: '12px',
                bgcolor: effectiveIsLocked ? '#F4F4F4' : '#FFFFFF',
                boxShadow: effectiveIsLocked ? 'none' : '0px 1px 0px 0px #E7E7E7',
                mb: 1,
                transition: 'all 0.2s ease',
                opacity: effectiveIsLocked ? 0.7 : 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: { xs: 1, md: 1.25 },
                  px: { xs: 1.5, md: 2 },
                  pt: { xs: 1, md: 1.5 },
                  pb: 0.75,
                }}
              >
                {/* Timestamp Badge */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    bgcolor: effectiveIsLocked ? '#E5E7EB' : 'background.paper',
                    color: effectiveIsLocked ? '#9CA3AF' : '#1340ff',
                    border: '1px solid',
                    borderColor: effectiveIsLocked ? '#D1D5DB' : '#E7E7E7',
                    borderBottom: '2px solid',
                    borderBottomColor: effectiveIsLocked ? '#D1D5DB' : '#E7E7E7',
                    borderRadius: 0.85,
                    px: 1.5,
                    py: 0.6,
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: 1.4,
                    userSelect: 'none',
                    boxShadow: effectiveIsLocked ? 'none' : '0px 1px 0px 0px #E7E7E7',
                    flexShrink: 0,
                  }}
                >
                  <AnimatedTime time={currentVideoTime} />
                </Box>

                <TextField
                  multiline
                  disabled={effectiveIsLocked}
                  minRows={isMobile ? 1 : 2}
                  maxRows={isMobile ? 4 : 6}
                  placeholder={effectiveIsLocked ? 'Comments are disabled' : 'Leave feedback...'}
                  value={effectiveIsLocked ? 'Comments are disabled' : feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTopLevelSubmit();
                    }
                  }}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    mt: { xs: '1px', md: '3px' },
                    '& .MuiOutlinedInput-root': {
                      border: 'none',
                      '& fieldset': { border: 'none' },
                      p: 0,
                    },
                    '& .MuiInputBase-input': {
                      fontSize: 15,
                      fontFamily: 'Inter, sans-serif',
                      p: 0,
                      lineHeight: 1.6,
                      '&::placeholder': { color: '#B0B0B0', opacity: 1 },
                    },
                    '&.Mui-disabled': {
                      WebkitTextFillColor: '#9CA3AF',
                    },
                  }}
                  size="small"
                />
                {isMobile && (
                  <Button
                    variant="contained"
                    disabled={!feedbackText.trim() || effectiveIsLocked}
                    onClick={handleTopLevelSubmit}
                    sx={{
                      bgcolor: '#1340ff',
                      borderBottom: '2px solid #0A238C',
                      boxShadow: 'inset 0px -2px 0px 0px #0A238C',
                      borderRadius: 1,
                      minWidth: 52,
                      minHeight: 32,
                      height: 28,
                      px: 2,
                      py: 0.5,
                      '&:hover': { bgcolor: '#1a4dff' },
                      '&.Mui-disabled': {
                        bgcolor: 'action.disabledBackground',
                        color: 'action.disabled',
                        borderBottomColor: '#E7E7E7',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    <Iconify icon="ic:round-send" width={20} sx={{ color: 'white' }} />
                  </Button>
                )}
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: isCountingDown && videoPage === 0 ? 'space-between' : 'flex-end',
                  px: 1.5,
                  pb: 1.25,
                }}
              >
                {isCountingDown && !effectiveIsLocked && (
                  <DarkGlassTooltip
                    title={`Feedback sent by ${feedbackSentByName || 'Client'}: Time left to leave additional feedback for this round of submission`}
                    placement="top-start"
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'default',
                        gap: 0.5,
                        color: '#D4321C',
                      }}
                    >
                      <Iconify icon="ic:sharp-timer" width={18} />
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {formatTimer(timeLeft)}
                      </Typography>
                    </Box>
                  </DarkGlassTooltip>
                )}
                {!isMobile && (
                  <Button
                    variant="contained"
                    disabled={!feedbackText.trim() || effectiveIsLocked}
                    onClick={handleTopLevelSubmit}
                    sx={{
                      bgcolor: '#1340ff',
                      borderBottom: '2px solid #0A238C',
                      boxShadow: 'inset 0px -2px 0px 0px #0A238C',
                      borderRadius: 1,
                      minWidth: 52,
                      minHeight: 32,
                      height: 28,
                      px: 2,
                      py: 0.5,
                      '&:hover': { bgcolor: '#1a4dff' },
                      '&.Mui-disabled': {
                        bgcolor: 'action.disabledBackground',
                        color: 'action.disabled',
                        borderBottomColor: '#E7E7E7',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    <Iconify icon="ic:round-send" width={20} sx={{ color: 'white' }} />
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {/* Existing Send Feedback Button */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: videoCount > 1 ? 'space-between' : 'flex-end',
              alignItems: 'center',
              mb: { xs: 0, md: 1 },
            }}
          >
            {videoCount > 1 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: { xs: 1.75, md: 0.5 },
                  pt: { xs: 0.5, md: 2 },
                  pb: { xs: 0.5, md: 1 },
                  px: { xs: 1, md: 0 },
                  flexShrink: 0,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => setVideoPage((prev) => Math.max(0, prev - 1))}
                  disabled={videoPage === 0}
                  sx={{
                    color: '#111827',
                    '&.Mui-disabled': { color: '#D1D5DB' },
                    p: { xs: 0.25, md: 0.5 },
                  }}
                >
                  <Iconify icon="eva:arrow-ios-back-fill" width={{ xs: 18, md: 20 }} />
                </IconButton>

                {Array.from({ length: videoCount }).map((_, idx) => (
                  <Typography
                    key={idx}
                    onClick={() => setVideoPage(idx)}
                    sx={{
                      cursor: 'pointer',
                      fontSize: { xs: '0.813rem', md: '0.875rem' },
                      fontWeight: videoPage === idx ? 700 : 500,
                      color: videoPage === idx ? '#111827' : '#8E8E93',
                      p: { xs: 0.25, md: 0.5 },
                      userSelect: 'none',
                    }}
                  >
                    {idx === 0 ? 'Latest' : idx + 1}
                  </Typography>
                ))}
                <IconButton
                  size="small"
                  onClick={() => setVideoPage((prev) => Math.min(videoCount - 1, prev + 1))}
                  disabled={videoPage === videoCount - 1}
                  sx={{ color: '#111827', '&.Mui-disabled': { color: '#D1D5DB' }, p: 0.5 }}
                >
                  <Iconify icon="eva:arrow-ios-forward-fill" width={{ xs: 18, md: 20 }} />
                </IconButton>
              </Box>
            )}
            <Button
              variant="contained"
              disableElevation
              disabled={effectiveIsLocked || isCountingDown}
              onClick={handleSendToAdmin}
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                borderRadius: '8px',
                boxShadow: '0px -4px 0px 0px #00000073 inset',
                bgcolor: '#3A3A3C',
                '&:hover': { bgcolor: '#3a3a3cd1', boxShadow: '0px -4px 0px 0px #000000 inset' },
                '&:active': {
                  boxShadow: '0px 0px 0px 0px #000000 inset',
                  transform: 'translateY(1px)',
                },
                '&.Mui-disabled': {
                  bgcolor: '#E5E7EB',
                  color: '#9CA3AF',
                },
              }}
            >
              Send Feedback to Admin
            </Button>
          </Box>
        </Box>

        {/* Confirmation Dialog */}
        <Dialog
          open={isSendConfirmOpen}
          onClose={() => setIsSendConfirmOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: '16px',
              p: { xs: 2, md: 4 },
              maxWidth: 450,
              width: '100%',
              textAlign: 'center',
              bgcolor: '#F6F6F6',
              backgroundImage: 'none',
              boxShadow: '0px 24px 48px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: '#8A5AFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
              }}
            >
              🛫
            </Box>
          </Box>
          <Typography
            variant="h2"
            sx={{
              fontFamily: 'instrument serif',
              fontWeight: 400,
              mb: 1,
              fontSize: { xs: '2.4rem', sm: '2.6rem' },
              whiteSpace: 'nowrap',
            }}
          >
            Send Feedback to Admin?
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: '#636366', fontWeight: 400, fontSize: '16px', mb: 3, lineHeight: 1.2 }}
          >
            After sending, your organisation will have 24 hours to add additional feedback before
            the current submission round ends
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <LoadingButton
              fullWidth
              variant="contained"
              size="large"
              onClick={confirmSendFeedback}
              sx={{
                py: 1.5,
                borderRadius: '8px',
                boxShadow: '0px -4px 0px 0px #00000073 inset',
                color: '#FFFFFF',
                bgcolor: '#3A3A3C',
                '&:hover': { bgcolor: '#3a3a3cd1', boxShadow: '0px -4px 0px 0px #000000 inset' },
                '&:active': {
                  boxShadow: '0px 0px 0px 0px #000000 inset',
                  transform: 'translateY(1px)',
                },
              }}
            >
              Confirm
            </LoadingButton>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setIsSendConfirmOpen(false)}
              sx={{
                py: 1.5,
                borderRadius: '8px',
                fontWeight: 600,
                boxShadow: '0px -4px 0px 0px #E7E7E7 inset',
                color: '#231F20',
                bgcolor: '#FFFFFF',
                '&:hover': {
                  bgcolor: '#FFFFFF',
                  boxShadow: '0px -4px 0px 0px #E7E7E7 inset',
                  borderColor: '#E7E7E7',
                },
                '&:active': {
                  boxShadow: '0px 0px 0px 0px #E7E7E7 inset',
                  transform: 'translateY(1px)',
                },
              }}
            >
              Cancel
            </Button>
          </Box>
        </Dialog>
      </Box>
    );
  }
);

ClientFeedbackModal.propTypes = {
  submissionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  videoId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  currentVideoTime: PropTypes.string,
  onSeekTo: PropTypes.func,
  onSendToAdmin: PropTypes.func,
  isLocked: PropTypes.bool,
  isPastVideo: PropTypes.bool,
  videoPage: PropTypes.number,
  setVideoPage: PropTypes.func,
  videoCount: PropTypes.number,
  feedbackDeadline: PropTypes.string,
  feedbackSentByName: PropTypes.string,
};

ClientFeedbackModal.displayName = 'ClientFeedbackModal';

export default ClientFeedbackModal;
