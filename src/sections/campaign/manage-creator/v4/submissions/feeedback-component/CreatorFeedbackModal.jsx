import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';

import { Box, Avatar, TextField, Typography, IconButton } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { useSubmissionComments } from 'src/hooks/use-submission-comments';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';

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

const FONT_FAMILY = 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

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
    name: feedbackItem.adminName || feedbackAdmin?.name || feedbackAdmin?.firstName || feedbackAdmin?.user?.name || feedbackItem.user?.name || 'Admin',
    role: feedbackItem.adminRole || feedbackAdmin?.role || feedbackItem.role || 'Admin',
    photo: adminPhoto,
  };
};

// Sub-components
const UserAvatar = ({ src, name, size = 40, responsive = false }) => (
  <Avatar
    src={src}
    alt={name}
    sx={{
      width: responsive ? { xs: 32, md: size } : size,
      height: responsive ? { xs: 32, md: size } : size,
      bgcolor: COLORS.bgAvatar,
      color: '#6B7280',
      fontSize: responsive ? { xs: '0.75rem', md: '0.875rem' } : '0.875rem',
      fontWeight: 600,
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

const UserInfo = ({ name, roleLabel, photo, date }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: { xs: 0.5, md: 0 } }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
      <UserAvatar src={photo} name={name} responsive />
      <Box>
        <Typography variant="body2" sx={{ fontFamily: FONT_FAMILY, fontWeight: 600, fontSize: { xs: '0.813rem', md: '0.875rem' }, color: COLORS.textPrimary }}>
          {name}
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: FONT_FAMILY, fontSize: { xs: '0.688rem', md: '0.75rem' }, color: COLORS.textSecondary }}>
          {roleLabel}
        </Typography>
      </Box>
    </Box>
    {date && (
      <Typography variant="caption" sx={{ fontFamily: FONT_FAMILY, fontSize: { xs: '0.688rem', md: '0.75rem' }, color: COLORS.textSecondary }}>
        {date}
      </Typography>
    )}
  </Box>
);

UserInfo.propTypes = {
  name: PropTypes.string.isRequired,
  roleLabel: PropTypes.string.isRequired,
  photo: PropTypes.string,
  date: PropTypes.string,
};

const ActionButton = ({ onClick, children, variant = 'primary', icon }) => {
  const isPrimary = variant === 'primary';
  return (
    <Typography
      component="button"
      onClick={onClick}
      sx={{
        fontFamily: FONT_FAMILY,
        fontSize: isPrimary ? { xs: '0.813rem', md: '0.875rem' } : { xs: '0.688rem', md: '0.75rem' },
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
        boxShadow: isPrimary ? 'inset 0px -3px 0px 0px #00000073' : `inset 0px -3px 0px 0px ${COLORS.borderLight}`,
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
      p: { xs: '8px 16px', md: '10px 24px' },
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
          fontFamily: FONT_FAMILY,
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
      multiline
      minRows={2}
      placeholder="Reply here..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{
        '& .MuiOutlinedInput-root': {
          fontFamily: FONT_FAMILY,
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
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: { xs: 0.75, md: 1 }, alignItems: 'center' }}>
      <ActionButton onClick={onCancel} variant="secondary">Cancel</ActionButton>
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

const ReplyItem = ({ reply, isParentResolved }) => {
  // If reply was forwarded by admin (client reply), show admin as the author
  const displayUser = reply.forwardedBy || reply.user;
  const displayName = displayUser?.name || reply.creatorName || 'User';
  const displayRole = displayUser?.role || 'Creator';
  const displayPhoto = displayUser?.photoURL || reply.creatorPhoto;

  return (
    <Box
      sx={{
        bgcolor: isParentResolved ? COLORS.resolvedBg : COLORS.bgPrimary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '16px',
        p: { xs: '12px 16px', md: '16px 24px' },
        ml: { xs: 3, md: 4 },
      }}
    >
      <UserInfo
        name={displayName}
        roleLabel={displayRole}
        photo={displayPhoto}
        date={formatDate(reply.createdAt)}
      />
      <Typography
        variant="body2"
        sx={{
          fontFamily: FONT_FAMILY,
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
};

ReplyItem.propTypes = {
  reply: PropTypes.shape({
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    creatorName: PropTypes.string,
    creatorPhoto: PropTypes.string,
    user: PropTypes.shape({
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
};

const RepliesList = ({ replies, isParentResolved }) => (
  <Box sx={{ mt: { xs: 1.5, md: 2 }, position: 'relative' }}>
    <ConnectorLine isVertical isSingleReply={replies.length === 1} />
    {replies.map((reply, replyIndex) => (
      <Box
        key={reply.id ?? replyIndex}
        sx={{
          position: 'relative',
          ml: { xs: 8, md: 10 },
          mb: replyIndex < replies.length - 1 ? { xs: 1.5, md: 2 } : 0,
        }}
      >
        <ConnectorLine />
        <ReplyItem reply={reply} isParentResolved={isParentResolved} />
      </Box>
    ))}
  </Box>
);

RepliesList.propTypes = {
  replies: PropTypes.arrayOf(PropTypes.object).isRequired,
  isParentResolved: PropTypes.bool,
};

const FeedbackCard = ({
  feedbackItem,
  submission,
  index,
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
}) => {
  const adminInfo = getAdminInfo(feedbackItem, submission);
  const replyCount = replies?.length ?? 0;
  const showRepliesList = isResolved ? isRepliesListOpen && replyCount > 0 : replyCount > 0;

  return (
    <Box>
      <Box
        sx={{
          width: '100%',
          bgcolor: isResolved ? COLORS.resolvedBg : COLORS.bgPrimary,
          border: `1px solid ${isNewAndUnopened ? COLORS.primary : COLORS.border}`,
          borderRadius: isReplyOpen || (isResolved && isRepliesListOpen) ? '16px 16px 0 0' : '16px',
          p: { xs: '12px 16px', md: '16px 24px' },
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: '8px', md: '10px' },
        }}
      >
        <UserInfo
          name={adminInfo.name}
          roleLabel={adminInfo.role}
          photo={adminInfo.photo}
          date={formatDate(feedbackItem.createdAt)}
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
              fontFamily: FONT_FAMILY,
              fontSize: { xs: '0.813rem', md: '0.875rem' },
              color: COLORS.primary,
              fontWeight: 600,
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
              fontFamily: FONT_FAMILY,
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {!isResolved && (
            <Typography
              component="button"
              onClick={onToggleReply}
              sx={{
                fontFamily: FONT_FAMILY,
                fontSize: { xs: '0.813rem', md: '0.875rem' },
                color: COLORS.textSecondary,
                fontWeight: 500,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                '&:hover': {
                  color: COLORS.textTertiary,
                },
              }}
            >
              Reply
            </Typography>
          )}
          {isResolved && replyCount > 0 && (
            <Typography
              component="button"
              onClick={onToggleViewReplies}
              sx={{
                fontFamily: FONT_FAMILY,
                fontSize: { xs: '0.813rem', md: '0.875rem' },
                color: COLORS.primary,
                fontWeight: 500,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
                '&:hover': { opacity: 0.9 },
              }}
            >
              {isRepliesListOpen ? 'Hide' : 'View'} {replyCount} Reply{replyCount !== 1 ? 'ies' : ''}
            </Typography>
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
          showTimestamp={useCommentSystem}
        />
      )}

      {showRepliesList && replies && replies.length > 0 && (
        <RepliesList replies={replies} isParentResolved={isResolved} />
      )}
    </Box>
  );
};

FeedbackCard.propTypes = {
  feedbackItem: PropTypes.object.isRequired,
  submission: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
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
};

// Main Component
const CreatorFeedbackModal = ({
  submission,
  videoPage = 0,
  setVideoPage,
  videoCount = 1,
  currentVideo = null,
  showNewCommentBorders = false,
  onSeekTo,
  currentTime = 0,
}) => {
  const currentVideoId = currentVideo?.id;
  const { socket } = useSocketContext();
  
  // Use submissionComment system when available (admin feedback)
  const { comments, commentsLoading, commentsMutate } = useSubmissionComments(
    submission?.id,
    currentVideoId
  );
  
  // Legacy feedback system (fallback)
  const allFeedback = submission?.feedback || [];
  const feedbackToShow = currentVideoId
    ? allFeedback.filter((f) => !f.videoId || f.videoId === currentVideoId)
    : allFeedback;
  
  // Determine which system to use: if we have comments from submissionComment, use that
  const useCommentSystem = comments && comments.length > 0;
  const displayItems = useCommentSystem ? comments : feedbackToShow;
  
  const [replyStates, setReplyStates] = useState({});
  const [viewRepliesOpen, setViewRepliesOpen] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [replies, setReplies] = useState({});
  const commentsEndRef = useRef(null);
  const initialLoadDone = useRef(false);

  const hasResolvedComments = useCommentSystem 
    ? comments.some((c) => c.resolvedByUserId)
    : feedbackToShow.some((item) => item.resolved === true);

  // Socket listeners for real-time updates (comment system)
  useEffect(() => {
    if (!socket || !submission?.id || !useCommentSystem) return undefined;

    const handleCommentEvent = (data) => {
      if (data.submissionId === submission.id) {
        commentsMutate();
      }
    };

    socket.on('v4:comment:added', handleCommentEvent);
    socket.on('v4:comment:updated', handleCommentEvent);
    socket.on('v4:comment:reply:added', handleCommentEvent);
    socket.on('v4:comment:deleted', handleCommentEvent);

    return () => {
      socket.off('v4:comment:added', handleCommentEvent);
      socket.off('v4:comment:updated', handleCommentEvent);
      socket.off('v4:comment:reply:added', handleCommentEvent);
      socket.off('v4:comment:deleted', handleCommentEvent);
    };
  }, [socket, submission?.id, commentsMutate, useCommentSystem]);

  // Reset scroll state on mount
  useEffect(() => {
    initialLoadDone.current = false;
  }, []);

  // Scroll to bottom on initial load (instant) and when new items added (smooth)
  useEffect(() => {
    if (!commentsEndRef.current || !displayItems?.length) return;
    if (!initialLoadDone.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'instant' });
      initialLoadDone.current = true;
      return;
    }
    commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [displayItems?.length]);

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
          const m = Math.floor((t % 3600) / 60);
          const s = t % 60;
          if (h > 0) {
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
          }
          return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        await axiosInstance.post(endpoints.submission.v4.comments(submission.id), {
          text: replyText,
          parentId: item.id,
          videoId: currentVideoId,
          timestamp: formatTimeForBackend(currentTime),
        });
        // Real-time update via socket
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

        const res = await axiosInstance.post(`/api/creator/submissions/v4/feedback/${item.id}/replies`, {
          content: replyText,
        });

        const saved = res?.data?.reply;
        if (saved) {
          setReplies((prev) => ({
            ...prev,
            [index]: (prev[index] || []).map((r) => (r.id === optimisticReply.id ? saved : r)),
          }));
        }
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
        {displayItems.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 } }}>
            {hasResolvedComments && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 0.5,
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    height: 0,
                    borderTop: `1px solid ${COLORS.textSecondary}`,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: FONT_FAMILY,
                    fontWeight: 600,
                    fontSize: { xs: '0.813rem', md: '0.875rem' },
                    color: COLORS.textSecondary,
                    flexShrink: 0,
                    px: 0.5,
                  }}
                >
                  resolved comments
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: 0,
                    borderTop: `1px solid ${COLORS.textSecondary}`,
                  }}
                />
              </Box>
            )}
            {displayItems.map((item, index) => {
              // Map comment system data to feedback card format
              const feedbackItem = useCommentSystem ? {
                id: item.id,
                content: item.text,
                timestamp: item.timestamp,
                createdAt: item.createdAt,
                resolved: !!item.resolvedByUserId,
                resolvedAt: item.resolvedAt,
                resolvedBy: item.resolvedBy,
                replies: item.replies || [],
                // If forwarded by admin, use forwardedBy as the display user
                forwardedBy: item.forwardedBy,
                admin: item.forwardedBy || item.user,
                adminName: item.forwardedBy?.name || item.user?.name,
                adminRole: item.forwardedBy?.role || item.user?.role,
                adminPhotoURL: item.forwardedBy?.photoURL || item.user?.photoURL,
                user: item.user,
              } : item;

              const formatTimeForBackend = (seconds) => {
                const t = Math.floor(Math.max(0, Number(seconds) || 0));
                const h = Math.floor(t / 3600);
                const m = Math.floor((t % 3600) / 60);
                const s = t % 60;
                if (h > 0) {
                  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                }
                return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
              };

              return (
                <FeedbackCard
                  key={item.id ?? index}
                  feedbackItem={feedbackItem}
                  submission={submission}
                  index={index}
                  isReplyOpen={replyStates[index] || false}
                  onToggleReply={() => toggleReply(index)}
                  isRepliesListOpen={viewRepliesOpen[index] || false}
                  onToggleViewReplies={() => toggleViewReplies(index)}
                  replyText={replyTexts[index] || ''}
                  onReplyTextChange={(value) => handleReplyTextChange(index, value)}
                  onCancelReply={() => handleCancelReply(index)}
                  onSendReply={() => handleSendReply(index)}
                  replies={useCommentSystem ? (item.replies || []).map(r => ({
                    id: r.id,
                    content: r.text,
                    createdAt: r.createdAt,
                    user: r.user,
                    forwardedBy: r.forwardedBy,
                  })) : [...(item.replies || []), ...(replies[index] || [])]}
                  isResolved={useCommentSystem ? !!item.resolvedByUserId : item.resolved === true}
                  isNewAndUnopened={showNewCommentBorders}
                  onSeekTo={onSeekTo}
                  currentTime={formatTimeForBackend(currentTime)}
                  useCommentSystem={useCommentSystem}
                />
              );
            })}
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
            <Typography variant="body2" sx={{ fontFamily: FONT_FAMILY, textAlign: 'center', fontSize: { xs: '0.813rem', md: '0.875rem' } }}>
              No Comments Currently
            </Typography>
          </Box>
        )}
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
            <Iconify icon="eva:chevron-left-fill" width={{ xs: 18, md: 20 }} color={videoPage === 0 ? COLORS.textSecondary : COLORS.textPrimary} />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.1, md: 0.25 } }}>
            {Array.from({ length: videoCount }, (_, i) => (
              <Typography
                key={i}
                component="button"
                onClick={() => setVideoPage?.(i)}
                sx={{
                  fontFamily: FONT_FAMILY,
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
                {i + 1}
              </Typography>
            ))}
          </Box>
          <IconButton
            size="small"
            onClick={() => setVideoPage?.((p) => Math.min(videoCount - 1, p + 1))}
            disabled={videoPage >= videoCount - 1}
            sx={{ p: { xs: 0.25, md: 0.5 } }}
          >
            <Iconify icon="eva:chevron-right-fill" width={{ xs: 18, md: 20 }} color={videoPage >= videoCount - 1 ? COLORS.textSecondary : COLORS.textPrimary} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

CreatorFeedbackModal.propTypes = {
  submission: PropTypes.shape({
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
  onSeekTo: PropTypes.func,
  currentTime: PropTypes.number,
};

export default CreatorFeedbackModal;
