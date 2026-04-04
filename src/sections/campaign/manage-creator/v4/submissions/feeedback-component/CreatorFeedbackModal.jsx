import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

import { m, AnimatePresence } from 'framer-motion';

import {
  Box,
  Avatar,
  Button,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Collapse,
  Divider,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { useSubmissionComments } from 'src/hooks/use-submission-comments';
import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import { DarkGlassTooltip } from 'src/components/tooltip/glass-tooltip';

const COLORS = {
  primary: '#1340FF',
  primaryHover: '#0F36E6',
  textPrimary: '#1F2937',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F4F4F4',
  bgAvatar: '#E5E7EB',
  border: '#EBEBEB',
  borderLight: '#E7E7E7',
  connector: '#8E8E93',
  resolvedBg: '#EBEBEB',
};

const getNewItemLabel = ({ replies, messages }) => {
  const total = replies + messages;
  if (replies > 0 && messages === 0) return `${total} New ${replies === 1 ? 'Reply' : 'Replies'}`;
  return `${total} New ${total === 1 ? 'Message' : 'Messages'}`;
};

const FONT_FAMILY =
  'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/** Normalize stored timestamps (e.g. 00:00:02) to mm:ss for display when under 1h */
const parseSecondsFromTimestamp = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
};

const formatTimestampForDisplay = (timeStr) => {
  const total = parseSecondsFromTimestamp(timeStr);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const shouldHighlightAsNew = (createdAt, sessionActive, cutoffMs) => {
  if (!sessionActive) return false;
  const t = new Date(createdAt || 0).getTime();
  if (Number.isNaN(t)) return false;
  if (cutoffMs == null) return true;
  return t > cutoffMs;
};

const getPhotoFromObject = (obj) => {
  if (!obj) return null;
  return (
    obj.photoURL ||
    obj.photoUrl ||
    obj.photo ||
    obj.image ||
    obj.avatar ||
    obj.displayPhoto ||
    obj.user?.photoURL ||
    obj.user?.photoUrl ||
    obj.user?.photo ||
    null
  );
};

const getAdminInfo = (feedbackItem, submission) => {
  if (feedbackItem.forwardedBy) {
    return {
      name: feedbackItem.forwardedBy.name || 'Admin',
      role: feedbackItem.forwardedBy.role || 'Admin',
      photo: feedbackItem.forwardedBy.photoURL || null,
    };
  }

  const feedbackAdmin = feedbackItem.admin || submission.admin || {};
  const adminPhoto =
    feedbackItem.adminPhotoURL ||
    getPhotoFromObject(feedbackAdmin) ||
    getPhotoFromObject(feedbackItem.user) ||
    null;
  return {
    name:
      feedbackItem.adminName ||
      feedbackAdmin?.name ||
      feedbackAdmin?.firstName ||
      feedbackAdmin?.user?.name ||
      feedbackItem.user?.name ||
      'Admin',
    role: feedbackItem.adminRole || feedbackAdmin?.role || feedbackItem.role || 'Admin',
    photo: adminPhoto,
  };
};

// Sub-components
const UserAvatar = ({ src, name, size = 36, responsive = false }) => (
  <Avatar
    src={src}
    alt={name}
    sx={{
      width: responsive ? { xs: 32, md: size } : size,
      height: responsive ? { xs: 32, md: size } : size,
      bgcolor: COLORS.bgAvatar,
      color: '#6B7280',
      border: '1px solid #EBEBEB',
      fontSize: responsive ? { xs: '0.75rem', md: '0.875rem' } : '0.875rem',
      fontWeight: 500,
    }}
  >
    {!src && name?.[0]?.toUpperCase()}
  </Avatar>
);

UserAvatar.propTypes = {
  src: PropTypes.string,
  name: PropTypes.string.isRequired,
  size: PropTypes.number,
  responsive: PropTypes.bool,
};

const UserInfo = ({ name, roleLabel, photo, date, sequenceLabel }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: { xs: 0.5, md: 0 },
      width: '100%',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
      <UserAvatar src={photo} name={name} responsive />
      <Box>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: { xs: '0.813rem', md: '0.875rem' },
            color: COLORS.textPrimary,
          }}
        >
          {name}
        </Typography>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: { xs: '0.688rem', md: '0.75rem' },
            color: COLORS.textSecondary,
            textTransform: 'capitalize',
          }}
        >
          {roleLabel}
        </Typography>
      </Box>
    </Box>
    {date && (
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        {sequenceLabel && (
          <Typography
            variant="caption"
            sx={{
              fontSize: { xs: '0.688rem', md: '0.75rem' },
              color: COLORS.textSecondary,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {sequenceLabel}
          </Typography>
        )}
        <Typography
          variant="caption"
          sx={{
            fontSize: { xs: '0.688rem', md: '0.75rem' },
            color: COLORS.textSecondary,
            whiteSpace: 'nowrap',
          }}
        >
          {date}
        </Typography>
      </Box>
    )}
  </Box>
);

UserInfo.propTypes = {
  name: PropTypes.string.isRequired,
  roleLabel: PropTypes.string.isRequired,
  photo: PropTypes.string,
  date: PropTypes.string,
  sequenceLabel: PropTypes.string,
};

const ActionButton = ({ onClick, children, variant = 'primary', icon }) => {
  const isPrimary = variant === 'primary';
  return (
    <Typography
      component="button"
      onClick={onClick}
      sx={{
        fontSize: isPrimary
          ? { xs: '0.813rem', md: '0.875rem' }
          : { xs: '0.688rem', md: '0.75rem' },
        color: isPrimary ? 'white' : COLORS.primary,
        fontWeight: 600,
        bgcolor: isPrimary ? COLORS.primary : COLORS.bgPrimary,
        border: isPrimary ? 'none' : `1px solid ${COLORS.borderLight}`,
        borderRadius: '6px',
        cursor: 'pointer',
        px: { xs: '4px', md: '6px' },
        py: '2px 6px 5px 6px',
        height: { xs: '22px', md: '24px' },
        width: icon ? { xs: '36px', md: '40px' } : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isPrimary
          ? 'inset 0px -3px 0px 0px #00000073'
          : `inset 0px -3px 0px 0px ${COLORS.borderLight}`,
        '&:hover': {
          bgcolor: isPrimary ? COLORS.primaryHover : '#F9F9F9',
        },
      }}
    >
      {icon ? <Iconify icon={icon} width={{ xs: 12, md: 14 }} /> : children}
    </Typography>
  );
};

ActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node,
  variant: PropTypes.oneOf(['primary', 'secondary']),
  icon: PropTypes.string,
};

const ReplyBox = ({ value, onChange, onCancel, onSend, currentTime, showTimestamp }) => (
  <Box
    sx={{
      width: '100%',
      bgcolor: COLORS.bgPrimary,
      border: `1px solid ${COLORS.border}`,
      borderTop: 'none',
      borderRadius: '0 0 16px 16px',
      p: { xs: 1.25, md: 2 },
      display: 'flex',
      flexDirection: 'column',
      gap: { xs: 1, md: 1.5 },
    }}
  >
    {showTimestamp && currentTime !== undefined && (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          bgcolor: 'background.paper',
          color: COLORS.primary,
          border: `1px solid ${COLORS.borderLight}`,
          borderBottom: `2px solid ${COLORS.borderLight}`,
          borderRadius: 0.85,
          px: 1,
          py: 0.4,
          fontSize: 13,
          fontWeight: 600,

          lineHeight: 1.4,
          userSelect: 'none',
          boxShadow: `0px 1px 0px 0px ${COLORS.borderLight}`,
          flexShrink: 0,
          alignSelf: 'flex-start',
        }}
      >
        {formatTimestampForDisplay(currentTime)}
      </Box>
    )}
    <TextField
      autoFocus
      multiline
      minRows={2}
      placeholder="Reply here..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSend();
        }
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          fontSize: { xs: '0.813rem', md: '0.875rem' },
          padding: 0,
          '& fieldset': { border: 'none' },
        },
        '& .MuiInputBase-input': { padding: 0 },
        '& .MuiInputBase-input::placeholder': {
          color: COLORS.textSecondary,
          opacity: 1,
        },
      }}
    />
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: { xs: 0.75, md: 1 },
        alignItems: 'center',
      }}
    >
      <ActionButton onClick={onCancel} variant="secondary">
        Cancel
      </ActionButton>
      <ActionButton onClick={onSend} variant="primary" icon="ic:round-send" />
    </Box>
  </Box>
);

ReplyBox.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  currentTime: PropTypes.string,
  showTimestamp: PropTypes.bool,
};

const ConnectorLine = ({ isVertical, isSingleReply }) => {
  if (isVertical) {
    return (
      <Box
        sx={{
          position: 'absolute',
          left: { xs: 32, md: 42 },
          top: -8,
          ...(isSingleReply ? { height: 50 } : { height: 'calc(100% - 57px)' }),
          width: 2,
          bgcolor: COLORS.connector,
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        left: { xs: -24, md: -28 },
        top: { xs: 24, md: 28 },
        width: { xs: 24, md: 28 },
        height: 24,
        '&::after': {
          content: '""',
          position: 'absolute',
          left: { xs: -8, md: -10 },
          top: 0,
          width: { xs: 52, md: 60 },
          height: 26,
          borderLeft: `2px solid ${COLORS.connector}`,
          borderBottom: `2px solid ${COLORS.connector}`,
          borderBottomLeftRadius: '10px',
        },
      }}
    />
  );
};

ConnectorLine.propTypes = {
  isVertical: PropTypes.bool,
  isSingleReply: PropTypes.bool,
};

const ReplyItem = ({
  reply,
  isParentResolved,
  showNewHighlight,
  highlightCutoffMs,
  onDelete,
  onUndoDelete,
  pendingDelete = false,
  pendingDeleteStartTime,
  currentUserId,
}) => {
  const [highlightDismissed, setHighlightDismissed] = useState(false);
  const dismissHighlight = useCallback(() => setHighlightDismissed(true), []);
  const isNew = useMemo(
    () => shouldHighlightAsNew(reply.createdAt, showNewHighlight, highlightCutoffMs),
    [reply.createdAt, showNewHighlight, highlightCutoffMs]
  );
  const showBlueBorder = isNew && !highlightDismissed;

  // If reply was forwarded by admin (client reply), show admin as the author
  const displayUser = reply.forwardedBy || reply.user;
  const displayName = displayUser?.name || reply.creatorName || 'User';
  const displayRole = displayUser?.role || 'Creator';
  const displayPhoto = displayUser?.photoURL || reply.creatorPhoto;

  const canDelete =
    !!onDelete &&
    !pendingDelete &&
    (reply.user?.id === currentUserId || reply.userId === currentUserId);

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
          bgcolor: isParentResolved ? COLORS.resolvedBg : COLORS.bgPrimary,
          py: 1.25,
          px: 1.5,
          borderRadius: 2,
          border: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              position: 'relative',
              display: 'inline-flex',
              width: 32,
              height: 32,
              flexShrink: 0,
            }}
          >
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
                    <Typography
                      sx={{
                        fontSize: '0.688rem',
                        fontWeight: 700,
                        color: '#1340FF',
                        lineHeight: 1,
                      }}
                    >
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
              <Typography
                sx={{
                  fontSize: '0.813rem',
                  fontWeight: 500,
                  color: deleteTimerDone ? '#1340FF' : '#6B7280',
                }}
              >
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
                data-interactive
                size="small"
                onClick={() => onUndoDelete?.(reply.id)}
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
      onMouseEnter={dismissHighlight}
      sx={{
        bgcolor: isParentResolved ? COLORS.resolvedBg : COLORS.bgPrimary,
        border: `1px solid ${showBlueBorder ? COLORS.primary : COLORS.border}`,
        borderRadius: '16px',
        p: { xs: 1.25, md: 2 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <UserInfo
          name={displayName}
          roleLabel={displayRole}
          photo={displayPhoto}
          date={!canDelete ? formatDate(reply.createdAt) : undefined}
        />
        {canDelete && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 0.25,
              flexShrink: 0,
            }}
          >
            <DarkGlassTooltip title="Delete?" placement="top">
              <IconButton
                size="small"
                onClick={() => onDelete(reply.id)}
                sx={{
                  p: 0.25,
                  bgcolor: 'transparent',
                  '&:hover': { bgcolor: 'transparent' },
                  '&:hover img': {
                    filter:
                      'brightness(0) saturate(100%) invert(41%) sepia(93%) saturate(1352%) hue-rotate(340deg) brightness(101%) contrast(101%)',
                  },
                }}
              >
                <Box
                  component="img"
                  src="/assets/icons/components/comment_delete.svg"
                  sx={{ width: 16, height: 16 }}
                />
              </IconButton>
            </DarkGlassTooltip>
            <Typography
              variant="caption"
              sx={{
                fontSize: { xs: '0.688rem', md: '0.75rem' },
                color: COLORS.textSecondary,
                whiteSpace: 'nowrap',
              }}
            >
              {formatDate(reply.createdAt)}
            </Typography>
          </Box>
        )}
      </Box>
      <Typography
        variant="body2"
        sx={{
          fontSize: { xs: '0.813rem', md: '0.875rem' },
          color: COLORS.textPrimary,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          mt: { xs: 0.75, md: 1 },
        }}
      >
        {reply.content}
      </Typography>
    </Box>
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      {pendingDelete ? (
        pendingDeleteContent
      ) : (
        <m.div
          key="reply-card"
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

ReplyItem.propTypes = {
  reply: PropTypes.shape({
    id: PropTypes.string,
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    creatorName: PropTypes.string,
    creatorPhoto: PropTypes.string,
    userId: PropTypes.string,
    user: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      role: PropTypes.string,
      photoURL: PropTypes.string,
    }),
    forwardedBy: PropTypes.shape({
      name: PropTypes.string,
      role: PropTypes.string,
      photoURL: PropTypes.string,
    }),
  }).isRequired,
  isParentResolved: PropTypes.bool,
  showNewHighlight: PropTypes.bool,
  highlightCutoffMs: PropTypes.number,
  onDelete: PropTypes.func,
  onUndoDelete: PropTypes.func,
  pendingDelete: PropTypes.bool,
  pendingDeleteStartTime: PropTypes.number,
  currentUserId: PropTypes.string,
};

const RepliesList = ({
  replies,
  isParentResolved,
  showNewHighlight,
  highlightCutoffMs,
  onDelete,
  onUndoDelete,
  pendingDeletes,
  currentUserId,
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: { xs: 1.5, md: 2 },
      mt: { xs: 1.5, md: 2 },
    }}
  >
    <AnimatePresence initial={false}>
      {replies.map((reply, replyIndex) => {
        const isLast = replyIndex === replies.length - 1;
        return (
          <m.div
            key={reply.id ?? replyIndex}
            initial={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, x: '100%', height: 0, marginBottom: 0, overflow: 'hidden' }}
            transition={{
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1],
              height: { delay: 0.3, duration: 0.3 },
            }}
          >
            <Box sx={{ position: 'relative', ml: { xs: 8, md: 10 } }}>
              {/* Vertical line */}
              <Box
                sx={{
                  position: 'absolute',
                  left: { xs: -32, md: -42 },
                  top: replyIndex === 0 ? -8 : { xs: -12, md: -16 },
                  bottom: isLast ? 'calc(50% + 20px)' : 0,
                  borderLeft: `2px solid ${COLORS.connector}`,
                  zIndex: 0,
                }}
              />
              {/* L-shaped connector */}
              <Box
                sx={{
                  position: 'absolute',
                  left: { xs: -32, md: -42 },
                  top: replyIndex === 0 ? 0 : { xs: -12, md: -16 },
                  bottom: 'calc(50% - 1px)',
                  width: { xs: 24, md: 30 },
                  borderLeft: `2px solid ${COLORS.connector}`,
                  borderBottom: `2px solid ${COLORS.connector}`,
                  borderBottomLeftRadius: 20,
                  zIndex: 0,
                }}
              />
              <ReplyItem
                reply={reply}
                isParentResolved={isParentResolved}
                showNewHighlight={showNewHighlight}
                highlightCutoffMs={highlightCutoffMs}
                onDelete={onDelete}
                onUndoDelete={onUndoDelete}
                pendingDelete={pendingDeletes?.has(reply.id)}
                pendingDeleteStartTime={pendingDeletes?.get(reply.id)?.startTime}
                currentUserId={currentUserId}
              />
            </Box>
          </m.div>
        );
      })}
    </AnimatePresence>
  </Box>
);

RepliesList.propTypes = {
  replies: PropTypes.arrayOf(PropTypes.object).isRequired,
  isParentResolved: PropTypes.bool,
  showNewHighlight: PropTypes.bool,
  highlightCutoffMs: PropTypes.number,
  onDelete: PropTypes.func,
  onUndoDelete: PropTypes.func,
  pendingDeletes: PropTypes.instanceOf(Map),
  currentUserId: PropTypes.string,
};

const FeedbackCard = ({
  feedbackItem,
  submission,
  index,
  sequenceNumber,
  isReplyOpen,
  onToggleReply,
  isRepliesListOpen,
  onToggleViewReplies,
  replyText,
  onReplyTextChange,
  onCancelReply,
  onSendReply,
  replies,
  isResolved,
  isNewAndUnopened,
  onSeekTo,
  currentTime,
  useCommentSystem,
  commentHighlightCutoffMs,
  isPastVideo = false,
  onDeleteReply,
  onUndoDelete,
  pendingDeletes,
  currentUserId,
}) => {
  const [highlightDismissed, setHighlightDismissed] = useState(false);
  const dismissHighlight = useCallback(() => setHighlightDismissed(true), []);

  const adminInfo = getAdminInfo(feedbackItem, submission);
  const replyCount = replies?.length ?? 0;
  // Replies are shown/hidden via toggle for both resolved + latest comments
  const showRepliesList = isRepliesListOpen && replyCount > 0;
  const showRepliesToggle = replyCount > 0;
  const repliesToggleColor = isRepliesListOpen ? COLORS.primary : '#919191';

  const qualifiesForHighlight = useMemo(
    () => shouldHighlightAsNew(feedbackItem.createdAt, isNewAndUnopened, commentHighlightCutoffMs),
    [feedbackItem.createdAt, isNewAndUnopened, commentHighlightCutoffMs]
  );
  const showBlueBorder = qualifiesForHighlight && !highlightDismissed;
  const sequenceLabel = useMemo(() => {
    const n = Number(sequenceNumber);
    if (!n || Number.isNaN(n) || n <= 0) return null;
    return `#${n}`;
  }, [sequenceNumber]);

  return (
    <Box>
      <Box
        onMouseEnter={dismissHighlight}
        sx={{
          width: '100%',
          bgcolor: isResolved ? COLORS.resolvedBg : COLORS.bgPrimary,
          border: `1px solid ${showBlueBorder ? COLORS.primary : COLORS.border}`,
          borderRadius: isReplyOpen || (isResolved && isRepliesListOpen) ? '16px 16px 0 0' : '16px',
          p: { xs: 1.25, md: 2 },
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 0.75, md: 1 },
        }}
      >
        <UserInfo
          name={adminInfo.name}
          roleLabel={adminInfo.role}
          photo={adminInfo.photo}
          date={formatDate(feedbackItem.createdAt)}
          sequenceLabel={sequenceLabel}
        />

        <Box sx={{ display: 'flex', gap: { xs: 0.75, md: 1 } }}>
          <Typography
            variant="body2"
            component={onSeekTo && feedbackItem.timestamp ? 'button' : 'span'}
            type={onSeekTo && feedbackItem.timestamp ? 'button' : undefined}
            onClick={
              onSeekTo && feedbackItem.timestamp
                ? () => onSeekTo(feedbackItem.timestamp)
                : undefined
            }
            sx={{
              fontSize: { xs: '0.813rem', md: '0.875rem' },
              color: COLORS.primary,
              fontWeight: 500,
              flexShrink: 0,
              ...(onSeekTo && feedbackItem.timestamp
                ? {
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    textAlign: 'left',
                    '&:hover': {
                      textDecoration: 'underline',
                      textUnderlineOffset: 2,
                      opacity: 0.9,
                    },
                  }
                : {}),
            }}
          >
            {feedbackItem.timestamp ? formatTimestampForDisplay(feedbackItem.timestamp) : '00:00'}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.813rem', md: '0.875rem' },
              color: COLORS.textPrimary,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {feedbackItem.content || 'No specific feedback provided.'}
          </Typography>
        </Box>

        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {!isResolved && (
              <Typography
                component="button"
                onClick={onToggleReply}
                sx={{
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  color: COLORS.textSecondary,
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: { xs: '2px 0', md: 0 },
                  '&:hover': {
                    color: COLORS.textTertiary,
                  },
                }}
              >
                Reply
              </Typography>
            )}
          </Box>

          {showRepliesToggle && (
            <DarkGlassTooltip
              title={isRepliesListOpen ? 'Hide replies' : 'Show replies'}
              placement="top"
            >
              <Box
                component="button"
                type="button"
                onClick={onToggleViewReplies}
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
                  variant="caption"
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
        </Box>
      </Box>

      {isReplyOpen && !isResolved && (
        <ReplyBox
          value={replyText}
          onChange={onReplyTextChange}
          onCancel={onCancelReply}
          onSend={onSendReply}
          currentTime={currentTime}
          showTimestamp={false}
        />
      )}

      <Collapse in={isRepliesListOpen && replyCount > 0} timeout="auto" unmountOnExit>
        {replies && replies.length > 0 && (
          <RepliesList
            replies={replies}
            isParentResolved={isResolved}
            showNewHighlight={isNewAndUnopened}
            highlightCutoffMs={commentHighlightCutoffMs}
            onDelete={onDeleteReply}
            onUndoDelete={onUndoDelete}
            pendingDeletes={pendingDeletes}
            currentUserId={currentUserId}
          />
        )}
      </Collapse>
    </Box>
  );
};

FeedbackCard.propTypes = {
  feedbackItem: PropTypes.object.isRequired,
  submission: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  sequenceNumber: PropTypes.number,
  isReplyOpen: PropTypes.bool.isRequired,
  onToggleReply: PropTypes.func.isRequired,
  isRepliesListOpen: PropTypes.bool.isRequired,
  onToggleViewReplies: PropTypes.func.isRequired,
  replyText: PropTypes.string.isRequired,
  onReplyTextChange: PropTypes.func.isRequired,
  onCancelReply: PropTypes.func.isRequired,
  onSendReply: PropTypes.func.isRequired,
  replies: PropTypes.array,
  isResolved: PropTypes.bool,
  isNewAndUnopened: PropTypes.bool,
  onSeekTo: PropTypes.func,
  currentTime: PropTypes.string,
  useCommentSystem: PropTypes.bool,
  commentHighlightCutoffMs: PropTypes.number,
  isPastVideo: PropTypes.bool,
  onDeleteReply: PropTypes.func,
  onUndoDelete: PropTypes.func,
  pendingDeletes: PropTypes.instanceOf(Map),
  currentUserId: PropTypes.string,
};

// Main Component
const CreatorFeedbackModal = ({
  submission,
  videoPage = 0,
  setVideoPage,
  videoCount = 1,
  currentVideo = null,
  showNewCommentBorders = false,
  commentHighlightCutoffMs = null,
  isPastVideo = false,
  onSeekTo,
  currentTime = 0,
}) => {
  const currentVideoId = currentVideo?.id;
  const { socket } = useSocketContext();
  const { user } = useAuthContext();

  // Delete reply state
  const [pendingDeletes, setPendingDeletes] = useState(new Map());
  const pendingDeletesRef = useRef(pendingDeletes);
  useEffect(() => {
    pendingDeletesRef.current = pendingDeletes;
  }, [pendingDeletes]);
  useEffect(
    () => () => {
      pendingDeletesRef.current.forEach(({ timeoutId }) => clearTimeout(timeoutId));
    },
    []
  );

  // Use submissionComment system when available (admin feedback)
  const { comments, commentsLoading, commentsMutate } = useSubmissionComments(
    submission?.id,
    currentVideoId
  );

  // Legacy feedback system (fallback)
  const allFeedback = useMemo(() => submission?.feedback || [], [submission?.feedback]);
  const feedbackToShow = currentVideoId
    ? allFeedback.filter((f) => !f.videoId || f.videoId === currentVideoId)
    : allFeedback;

  // Determine which system to use: if we have comments from submissionComment, use that
  const useCommentSystem = comments && comments.length > 0;
  const displayItems = useCommentSystem ? comments : feedbackToShow;

  // Sequence numbering for TOP-LEVEL comments only (replies excluded):
  // oldest createdAt => #1 ... newest createdAt => #N
  const topLevelSequenceByKey = useMemo(() => {
    const items = displayItems || [];
    const normalized = items.map((item, idx) => {
      const key = item?.id ?? `idx-${idx}`;
      const t = new Date(item?.createdAt || 0).getTime();
      return { key, idx, t: Number.isNaN(t) ? 0 : t };
    });
    normalized.sort((a, b) => a.t - b.t || a.idx - b.idx);
    const map = new Map();
    normalized.forEach((n, i) => {
      map.set(n.key, i + 1);
    });
    return map;
  }, [displayItems]);

  const [replyStates, setReplyStates] = useState({});
  const [viewRepliesOpen, setViewRepliesOpen] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [replies, setReplies] = useState({});
  const commentsEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const initialLoadDone = useRef(false);
  const [newAbove, setNewAbove] = useState({ replies: 0, messages: 0, targetId: null });
  const [newBelow, setNewBelow] = useState({ replies: 0, messages: 0, targetId: null });

  // Socket listeners for real-time updates (comment system)
  useEffect(() => {
    if (!socket || !submission?.id || !useCommentSystem) return undefined;

    const handleCommentEvent = (data) => {
      if (data.submissionId === submission.id && !data.comment?.isClientDraft) {
        commentsMutate();
      }
    };

    const handleNewItem = (data, isReply) => {
      if (data.submissionId !== submission.id || data.comment?.isClientDraft) return;
      commentsMutate();
      // Skip indicator for own messages
      if (data.comment?.userId === user?.id) return;
      if (!initialLoadDone.current) return;
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

    const handleNewComment = (data) => handleNewItem(data, false);
    const handleNewReply = (data) => handleNewItem(data, true);

    const handleDeletedEvent = (data) => {
      if (data.submissionId === submission.id) {
        if (pendingDeletesRef.current.has(data.commentId)) return;
        commentsMutate();
      }
    };

    socket.on('v4:comment:added', handleNewComment);
    socket.on('v4:comment:updated', handleCommentEvent);
    socket.on('v4:comment:reply:added', handleNewReply);
    socket.on('v4:comment:deleted', handleDeletedEvent);

    return () => {
      socket.off('v4:comment:added', handleNewComment);
      socket.off('v4:comment:updated', handleCommentEvent);
      socket.off('v4:comment:reply:added', handleNewReply);
      socket.off('v4:comment:deleted', handleDeletedEvent);
    };
  }, [socket, submission?.id, user?.id, commentsMutate, useCommentSystem]);

  // Reset scroll state on mount
  useEffect(() => {
    initialLoadDone.current = false;
  }, []);

  // Past-video pages: expand reply threads by default (archive / resolved design)
  useEffect(() => {
    if (!isPastVideo) return;
    let items;
    if (useCommentSystem) {
      items = comments || [];
    } else if (currentVideoId) {
      items = allFeedback.filter((f) => !f.videoId || f.videoId === currentVideoId);
    } else {
      items = allFeedback;
    }
    if (!items.length) return;
    setViewRepliesOpen((prev) => {
      const next = { ...prev };
      items.forEach((item, index) => {
        const repliesLen = (item.replies || []).length;
        const baseResolved = useCommentSystem ? !!item.resolvedByUserId : item.resolved === true;
        if (repliesLen > 0 && (baseResolved || isPastVideo)) {
          next[index] = true;
        }
      });
      return next;
    });
  }, [isPastVideo, currentVideoId, useCommentSystem, comments, allFeedback]);

  // Scroll to bottom on initial load (instant) and when new top-level items added (smooth)
  useEffect(() => {
    if (!commentsEndRef.current || !displayItems?.length) return;
    if (!initialLoadDone.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'instant' });
      initialLoadDone.current = true;
      return;
    }
    commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [displayItems?.length]);

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
      const scrollOffset = threadRect.bottom - containerRect.bottom;
      if (scrollOffset > 0) {
        container.scrollBy({ top: scrollOffset + 16, behavior: 'smooth' });
      } else if (threadRect.top < containerRect.top) {
        container.scrollBy({ top: threadRect.top - containerRect.top - 16, behavior: 'smooth' });
      }
    }
  };

  // Default: if a top-level comment has replies, show them (latest + past pages).
  // User can still hide via the replies icon toggle.
  useEffect(() => {
    if (!displayItems?.length) return;
    setViewRepliesOpen((prev) => {
      const next = { ...prev };
      displayItems.forEach((item, index) => {
        const hasReplies = (item.replies || []).length > 0;
        if (hasReplies && next[index] === undefined) {
          next[index] = true;
        }
      });
      return next;
    });
  }, [displayItems]);

  const toggleReply = (index) => {
    setReplyStates((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleViewReplies = (index) => {
    setViewRepliesOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCancelReply = (index) => {
    setReplyStates((prev) => ({ ...prev, [index]: false }));
    setReplyTexts((prev) => ({ ...prev, [index]: '' }));
  };

  const handleReplyTextChange = (index, value) => {
    setReplyTexts((prev) => ({ ...prev, [index]: value }));
  };

  const handleDeleteReply = useCallback(
    (commentId) => {
      if (pendingDeletesRef.current.has(commentId)) return;
      const startTime = Date.now();
      const timeoutId = setTimeout(async () => {
        try {
          await axiosInstance.delete(endpoints.submission.creator.v4.deleteComment(commentId));
          await new Promise((r) => setTimeout(r, 1000));
          commentsMutate();
        } catch (error) {
          console.error('Failed to delete reply:', error);
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
    },
    [commentsMutate]
  );

  const handleUndoDelete = useCallback((commentId) => {
    setPendingDeletes((prev) => {
      const entry = prev.get(commentId);
      if (entry) clearTimeout(entry.timeoutId);
      const next = new Map(prev);
      next.delete(commentId);
      return next;
    });
  }, []);

  const handleSendReply = async (index) => {
    const replyText = replyTexts[index];
    if (!replyText?.trim()) return;

    const item = displayItems[index];
    if (!item?.id) return;

    handleCancelReply(index);

    try {
      if (useCommentSystem) {
        // Use submissionComment system with timestamp support
        const formatTimeForBackend = (seconds) => {
          const t = Math.floor(Math.max(0, Number(seconds) || 0));
          const h = Math.floor(t / 3600);
          const min = Math.floor((t % 3600) / 60);
          const s = t % 60;
          if (h > 0) {
            return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
          }
          return `${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        await axiosInstance.post(endpoints.submission.v4.comments(submission.id), {
          text: replyText,
          parentId: item.parentId || item.id,
          videoId: currentVideoId,
          timestamp: formatTimeForBackend(currentTime),
        });
        // Scroll to the thread where the reply was added
        setTimeout(() => {
          scrollToThread(item.parentId || item.id);
          clearNewIndicators();
        }, 300);
      } else {
        // Legacy feedback reply system
        const optimisticReply = {
          id: `optimistic-${Date.now()}`,
          content: replyText,
          createdAt: new Date().toISOString(),
          user: {
            name: submission.user?.name || submission.creator?.name || 'Creator',
            role: 'Creator',
            photoURL: getPhotoFromObject(submission.user) || getPhotoFromObject(submission.creator),
          },
        };

        setReplies((prev) => ({
          ...prev,
          [index]: [...(prev[index] || []), optimisticReply],
        }));

        const res = await axiosInstance.post(
          `/api/creator/submissions/v4/feedback/${item.id}/replies`,
          {
            content: replyText,
          }
        );

        const saved = res?.data?.reply;
        if (saved) {
          setReplies((prev) => ({
            ...prev,
            [index]: (prev[index] || []).map((r) => (r.id === optimisticReply.id ? saved : r)),
          }));
        }
        // Scroll to the thread where the reply was added
        setTimeout(() => {
          scrollToThread(item.id);
          clearNewIndicators();
        }, 300);
      }
    } catch (err) {
      // Rollback optimistic reply on failure (legacy system only)
      if (!useCommentSystem) {
        setReplies((prev) => ({
          ...prev,
          [index]: (prev[index] || []).filter((r) => r.id?.startsWith('optimistic-')),
        }));
      }
      // eslint-disable-next-line no-console
      console.error('Failed to send reply', err);
    }
  };

  return (
    <Box
      sx={{
        flex: { xs: '1 1 auto', md: '0 0 calc(40% - 20px)' },
        bgcolor: COLORS.bgSecondary,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: { xs: '50vh', sm: '60vh', md: '100%' },
        minHeight: { xs: 200, md: 0 },
        borderRadius: { xs: '12px', md: 0 },
      }}
    >
      {/* Feedback content - scrollable */}
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
          overflowY: 'auto',
          overflowX: 'hidden',
          p: { xs: 1, md: 0 },
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.05)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
            '&:hover': { background: 'rgba(0,0,0,0.3)' },
          },
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
                  background: `linear-gradient(to bottom, ${COLORS.bgSecondary} 30%, transparent 100%)`,
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

        {displayItems.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 1.5 } }}>
            {(() => {
              const itemsWithIndex = displayItems.map((item, index) => ({ item, index }));

              const unresolvedItems = itemsWithIndex.filter(({ item }) => {
                const baseResolved = useCommentSystem
                  ? !!item.resolvedByUserId
                  : item.resolved === true;
                return !baseResolved && !isPastVideo;
              });

              const resolvedItems = itemsWithIndex.filter(({ item }) => {
                const baseResolved = useCommentSystem
                  ? !!item.resolvedByUserId
                  : item.resolved === true;
                return baseResolved || isPastVideo;
              });

              const formatTimeForBackend = (seconds) => {
                const t = Math.floor(Math.max(0, Number(seconds) || 0));
                const h = Math.floor(t / 3600);
                const min = Math.floor((t % 3600) / 60);
                const s = t % 60;
                if (h > 0) {
                  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                }
                return `${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
              };

              const renderItem = ({ item, index }) => {
                const feedbackItem = useCommentSystem
                  ? {
                      id: item.id,
                      content: item.text,
                      timestamp: item.timestamp,
                      createdAt: item.createdAt,
                      resolved: !!item.resolvedByUserId,
                      resolvedAt: item.resolvedAt,
                      resolvedBy: item.resolvedBy,
                      replies: item.replies || [],
                      forwardedBy: item.forwardedBy,
                      admin: item.forwardedBy || item.user,
                      adminName: item.forwardedBy?.name || item.user?.name,
                      adminRole: item.forwardedBy?.role || item.user?.role,
                      adminPhotoURL: item.forwardedBy?.photoURL || item.user?.photoURL,
                      user: item.user,
                    }
                  : item;

                const baseResolved = useCommentSystem
                  ? !!item.resolvedByUserId
                  : item.resolved === true;
                const effectiveResolved = baseResolved || isPastVideo;

                return (
                  <div key={item.id ?? index} data-comment-id={item.id}>
                  <FeedbackCard
                    feedbackItem={feedbackItem}
                    submission={submission}
                    index={index}
                    sequenceNumber={topLevelSequenceByKey.get(item?.id ?? `idx-${index}`)}
                    isReplyOpen={replyStates[index] || false}
                    onToggleReply={() => toggleReply(index)}
                    isRepliesListOpen={viewRepliesOpen[index] || false}
                    onToggleViewReplies={() => toggleViewReplies(index)}
                    replyText={replyTexts[index] || ''}
                    onReplyTextChange={(value) => handleReplyTextChange(index, value)}
                    onCancelReply={() => handleCancelReply(index)}
                    onSendReply={() => handleSendReply(index)}
                    replies={
                      useCommentSystem
                        ? (item.replies || []).map((r) => ({
                            id: r.id,
                            content: r.text,
                            createdAt: r.createdAt,
                            user: r.user,
                            forwardedBy: r.forwardedBy,
                          }))
                        : [...(item.replies || []), ...(replies[index] || [])]
                    }
                    isResolved={effectiveResolved}
                    isNewAndUnopened={showNewCommentBorders && !isPastVideo}
                    onSeekTo={onSeekTo}
                    currentTime={formatTimeForBackend(currentTime)}
                    useCommentSystem={useCommentSystem}
                    commentHighlightCutoffMs={commentHighlightCutoffMs}
                    isPastVideo={isPastVideo}
                    onDeleteReply={
                      useCommentSystem && !effectiveResolved ? handleDeleteReply : undefined
                    }
                    onUndoDelete={handleUndoDelete}
                    pendingDeletes={pendingDeletes}
                    currentUserId={user?.id}
                  />
                  </div>
                );
              };

              return (
                <>
                  {unresolvedItems.map(renderItem)}
                  {resolvedItems.length > 0 && (
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
                  {resolvedItems.map(renderItem)}
                </>
              );
            })()}
            <div ref={commentsEndRef} />
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              minHeight: { xs: 150, md: 200 },
              pt: { xs: 15, md: 35 },
              color: COLORS.textSecondary,
            }}
          >
            <Typography
              variant="body2"
              sx={{ textAlign: 'center', fontSize: { xs: '0.813rem', md: '0.875rem' } }}
            >
              No Comments Currently
            </Typography>
          </Box>
        )}

        {/* New items below indicator */}
        <AnimatePresence>
          {(newBelow.replies > 0 || newBelow.messages > 0) && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ position: 'sticky', bottom: 0, zIndex: 10, pointerEvents: 'none' }}
            >
              <Box
                onClick={() => {
                  scrollToThread(newBelow.targetId);
                  setNewBelow({ replies: 0, messages: 0, targetId: null });
                }}
                sx={{
                  background: `linear-gradient(to top, ${COLORS.bgSecondary} 30%, transparent 100%)`,
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
      </Box>

      {/* Page navigation - at bottom of feedback panel */}
      {videoCount > 1 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: { xs: 0.25, md: 0.5 },
            pt: { xs: 1.5, md: 2 },
            pb: { xs: 0.5, md: 1 },
            px: { xs: 1, md: 0 },
            flexShrink: 0,
          }}
        >
          <IconButton
            size="small"
            onClick={() => setVideoPage?.((p) => Math.max(0, p - 1))}
            disabled={videoPage === 0}
            sx={{ p: { xs: 0.25, md: 0.5 } }}
          >
            <Iconify
              icon="eva:chevron-left-fill"
              width={{ xs: 18, md: 20 }}
              color={videoPage === 0 ? COLORS.textSecondary : COLORS.textPrimary}
            />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.1, md: 0.25 } }}>
            {Array.from({ length: videoCount }, (_, i) => (
              <Typography
                key={i}
                component="button"
                onClick={() => setVideoPage?.(i)}
                sx={{
                  fontSize: { xs: '0.813rem', md: '0.875rem' },
                  fontWeight: videoPage === i ? 700 : 500,
                  color: videoPage === i ? COLORS.textPrimary : COLORS.textSecondary,
                  minWidth: { xs: 20, md: 24 },
                  bgcolor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  p: { xs: 0.25, md: 0.5 },
                }}
              >
                {i === 0 ? 'Latest' : i + 1}
              </Typography>
            ))}
          </Box>
          <IconButton
            size="small"
            onClick={() => setVideoPage?.((p) => Math.min(videoCount - 1, p + 1))}
            disabled={videoPage >= videoCount - 1}
            sx={{ p: { xs: 0.25, md: 0.5 } }}
          >
            <Iconify
              icon="eva:chevron-right-fill"
              width={{ xs: 18, md: 20 }}
              color={videoPage >= videoCount - 1 ? COLORS.textSecondary : COLORS.textPrimary}
            />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

CreatorFeedbackModal.propTypes = {
  submission: PropTypes.shape({
    id: PropTypes.string,
    admin: PropTypes.object,
    user: PropTypes.shape({
      name: PropTypes.string,
      photoURL: PropTypes.string,
    }),
    creator: PropTypes.shape({
      name: PropTypes.string,
      photoURL: PropTypes.string,
    }),
    feedback: PropTypes.arrayOf(
      PropTypes.shape({
        content: PropTypes.string,
        timestamp: PropTypes.string,
        reasons: PropTypes.arrayOf(PropTypes.string),
        adminName: PropTypes.string,
        adminRole: PropTypes.string,
        admin: PropTypes.object,
        createdAt: PropTypes.string,
      })
    ),
  }),
  videoPage: PropTypes.number,
  setVideoPage: PropTypes.func,
  videoCount: PropTypes.number,
  currentVideo: PropTypes.shape({
    id: PropTypes.string,
    url: PropTypes.string,
  }),
  showNewCommentBorders: PropTypes.bool,
  commentHighlightCutoffMs: PropTypes.number,
  isPastVideo: PropTypes.bool,
  onSeekTo: PropTypes.func,
  currentTime: PropTypes.number,
};

export default CreatorFeedbackModal;
