import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Avatar, TextField, IconButton } from '@mui/material';
import Iconify from 'src/components/iconify';
import axiosInstance from 'src/utils/axios';

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

const ReplyBox = ({ value, onChange, onCancel, onSend }) => (
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
};

const ConnectorLine = ({ isVertical, isSingleReply }) => {
  if (isVertical) {
    return (
      <Box
        sx={{
          position: 'absolute',
          left: { xs: 34, md: 42 },
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
          height: 24,
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

const ReplyItem = ({ reply }) => (
  <Box
    sx={{
      bgcolor: COLORS.bgPrimary,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '16px',
      p: { xs: '12px 16px', md: '16px 24px' },
      ml: { xs: 3, md: 4 },
    }}
  >
    <UserInfo
      name={reply.user?.name || reply.creatorName || 'Creator'}
      roleLabel={reply.user?.role || 'Creator'}
      photo={reply.user?.photoURL || reply.creatorPhoto}
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

ReplyItem.propTypes = {
  reply: PropTypes.shape({
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    creatorName: PropTypes.string.isRequired,
    creatorPhoto: PropTypes.string,
  }).isRequired,
};

const RepliesList = ({ replies }) => (
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
        <ReplyItem reply={reply} />
      </Box>
    ))}
  </Box>
);

RepliesList.propTypes = {
  replies: PropTypes.arrayOf(PropTypes.object).isRequired,
};

const FeedbackCard = ({
  feedbackItem,
  submission,
  index,
  isReplyOpen,
  onToggleReply,
  replyText,
  onReplyTextChange,
  onCancelReply,
  onSendReply,
  replies,
  isResolved,
  isNewAndUnopened,
}) => {
  const adminInfo = getAdminInfo(feedbackItem, submission);
  const replyCount = replies?.length ?? 0;

  return (
    <Box>
      <Box
        sx={{
          width: '100%',
          bgcolor: isResolved ? COLORS.resolvedBg : COLORS.bgPrimary,
          border: `1px solid ${isNewAndUnopened ? COLORS.primary : COLORS.border}`,
          borderRadius: isReplyOpen ? '16px 16px 0 0' : '16px',
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
            sx={{
              fontFamily: FONT_FAMILY,
              fontSize: { xs: '0.813rem', md: '0.875rem' },
              color: COLORS.primary,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {feedbackItem.timestamp || '0:00'}
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
              onClick={onToggleReply}
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
              View {replyCount} Reply{replyCount !== 1 ? 'ies' : ''}
            </Typography>
          )}
        </Box>
      </Box>

      {isReplyOpen && (
        <ReplyBox
          value={replyText}
          onChange={onReplyTextChange}
          onCancel={onCancelReply}
          onSend={onSendReply}
        />
      )}

      {replies && replies.length > 0 && <RepliesList replies={replies} />}
    </Box>
  );
};

FeedbackCard.propTypes = {
  feedbackItem: PropTypes.object.isRequired,
  submission: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  isReplyOpen: PropTypes.bool.isRequired,
  onToggleReply: PropTypes.func.isRequired,
  replyText: PropTypes.string.isRequired,
  onReplyTextChange: PropTypes.func.isRequired,
  onCancelReply: PropTypes.func.isRequired,
  onSendReply: PropTypes.func.isRequired,
  replies: PropTypes.array,
  isResolved: PropTypes.bool,
  isNewAndUnopened: PropTypes.bool,
};

// Main Component
const CreatorFeedbackModal = ({
  submission,
  videoPage = 0,
  setVideoPage,
  videoCount = 1,
  currentVideo = null,
  showNewCommentBorders = false,
}) => {
  const allFeedback = submission?.feedback || [];
  const currentVideoId = currentVideo?.id;
  const feedbackToShow = currentVideoId
    ? allFeedback.filter((f) => !f.videoId || f.videoId === currentVideoId)
    : allFeedback;
  const [replyStates, setReplyStates] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [replies, setReplies] = useState({});

  const hasResolvedComments = feedbackToShow.some((item) => item.resolved === true);

  const toggleReply = (index) => {
    setReplyStates((prev) => ({ ...prev, [index]: !prev[index] }));
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

    const feedbackId = feedbackToShow[index]?.id;
    if (!feedbackId) return;

    // Optimistic UI
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

    handleCancelReply(index);

    try {
      const res = await axiosInstance.post(`/api/creator/submissions/v4/feedback/${feedbackId}/replies`, {
        content: replyText,
      });

      const saved = res?.data?.reply;
      if (saved) {
        setReplies((prev) => ({
          ...prev,
          [index]: (prev[index] || []).map((r) => (r.id === optimisticReply.id ? saved : r)),
        }));
      }
    } catch (err) {
      // Rollback optimistic reply on failure
      setReplies((prev) => ({
        ...prev,
        [index]: (prev[index] || []).filter((r) => r.id !== optimisticReply.id),
      }));
      // Keep silent here; caller UI doesn't have snackbar in this file
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
        {feedbackToShow.length > 0 ? (
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
            {feedbackToShow.map((feedbackItem, index) => (
              <FeedbackCard
                key={feedbackItem.id ?? index}
                feedbackItem={feedbackItem}
                submission={submission}
                index={index}
                isReplyOpen={replyStates[index] || false}
                onToggleReply={() => toggleReply(index)}
                replyText={replyTexts[index] || ''}
                onReplyTextChange={(value) => handleReplyTextChange(index, value)}
                onCancelReply={() => handleCancelReply(index)}
                onSendReply={() => handleSendReply(index)}
                replies={[...(feedbackItem.replies || []), ...(replies[index] || [])]}
                isResolved={feedbackItem.resolved === true}
                isNewAndUnopened={showNewCommentBorders}
              />
            ))}
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
};

export default CreatorFeedbackModal;
