import React, { useState } from 'react';
import { Box, Typography, Avatar, IconButton, Button, TextField } from '@mui/material';
import Iconify from 'src/components/iconify';

// Mock data based on your screenshots
const MOCK_COMMENTS = [
  {
    id: '1',
    author: { name: 'Natalie', role: 'Admin' },
    date: 'May 11, 2025 8:39PM',
    timestamp: '0:00',
    text: 'the audio is too low',
    replies: [
      {
        id: '1-2',
        author: { name: 'Jordan', role: 'Creator' },
        date: 'May 11, 2025 8:39PM',
        text: 'Okay will amendkay will amendkay will amendkay will amendkay will amendkay will amendkay willkay will amendkay will amendkay will amendkay will amendkay will amendkay will amendkay will amend amendkay will amendkay will amendOkay will amendkay will amendkay will amendkay will amendkay will amendkay will amendkay willkay will amendkay will amendkay will amendkay will amendkay will amendkay will amendkay will amend amendkay will amendkay will amend',
      },
      {
        id: '1-3',
        author: { name: 'Jordan', role: 'Client' },
        date: 'May 11, 2025 8:39PM',
        text: 'Sike',
        isClient: true,
      },
      {
        id: '1-4',
        author: { name: 'Jordan', role: 'Creator' },
        date: 'May 11, 2025 8:39PM',
        text: 'Sike',
      },
    ],
  },
  {
    id: '2',
    author: { name: 'Natalie', role: 'Admin' },
    date: 'May 11, 2025 8:39PM',
    timestamp: '0:10',
    text: 'remove this graphic',
    replies: [
      {
        id: '2-1',
        author: { name: 'Jordan', role: 'Creator' },
        date: 'May 11, 2025 8:39PM',
        text: 'Sike',
      },
    ],
  },
  {
    id: '3',
    author: { name: 'Grab', role: 'Client' },
    date: 'May 11, 2025 8:45PM',
    timestamp: '0:12',
    text: 'yeehaw',
    isClient: true,
    agreedBy: ['1', '2'], // Used to trigger the blue border
    replies: [
      {
        id: '2-1',
        author: { name: 'Jordan', role: 'Admin' },
        date: 'May 11, 2025 8:39PM',
        text: 'Creator is quite dumb, im sorry',
      },
    ],
  },
];

const formatTime = (timeInSeconds) => {
  const totalSeconds = Math.floor(timeInSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const parseTimestamp = (timestampStr) => {
  if (!timestampStr) return 0;
  const parts = timestampStr.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

const CommentCard = ({ comment, isReply = false, onTimestampClick }) => {
  const isClient = comment.isClient || comment.replies?.isClient;
  const hasAgreed = comment.agreedBy?.length > 0;

  return (
    <Box
      sx={{
        bgcolor: 'white',
        p: 2,
        borderRadius: 2,
        border: isClient ? '1px solid #2563EB' : '1px solid transparent',
        boxShadow: isClient
          ? 'none'
          : '0px 2px 4px rgba(0, 0, 0, 0.02), 0px 1px 2px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
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
            {comment.author.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
              {comment.author.name}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF' }}>
              {comment.author.role}
            </Typography>
          </Box>
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{comment.date}</Typography>
      </Box>

      {/* Body */}
      <Box sx={{ pl: 0.5 }}>
        <Typography
          sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1F2937', wordBreak: 'break-word' }}
        >
          {comment.timestamp && (
            <Typography
              component="span"
              onClick={(e) => {
                e.stopPropagation();
                if (onTimestampClick) {
                  onTimestampClick(parseTimestamp(comment.timestamp));
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
              {comment.timestamp}
            </Typography>
          )}
          {comment.text}
        </Typography>
      </Box>

      {/* Footer Actions */}
      <Box sx={{ pl: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
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
        <IconButton size="small" sx={{ p: 0.5 }}>
          <Iconify
            icon={hasAgreed ? 'mdi:thumb-up' : 'mdi-light:thumb-up'}
            width={20}
            sx={{
              color: hasAgreed ? '#1340FF' : '#9CA3AF',
              filter: 'drop-shadow(0px 0px 0.2px #000000)',
            }}
          />
        </IconButton>
      </Box>
    </Box>
  );
};

export default function AdminFeedbackPanel({ currentTime = 0, onSeek }) {
  const [feedback, setFeedback] = useState('');

  return (
    <Box
      sx={{
        flex: { xs: '1 1 auto', md: '0 0 calc(40% - 20px)' },
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Scrollable Comments Area */}
      <Box
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
        {MOCK_COMMENTS.map((comment) => (
          <Box key={comment.id}>
            {/* Parent Comment */}
            <CommentCard comment={comment} onTimestampClick={onSeek} />

            {/* Threaded Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
                {comment.replies.map((reply, index) => {
                  const isLast = index === comment.replies.length - 1;

                  return (
                    <Box key={reply.id} sx={{ position: 'relative', ml: 12 }}>
                      {/* The L-shaped connection line */}
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

                      <CommentCard comment={reply} isReply onTimestampClick={onSeek} />
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Bottom Sticky Input Section */}
      <Box
        sx={{
          mt: 'auto',
          pt: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          borderTop: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        {/* Input Field */}
      </Box>
      <Box
        sx={{
          flexShrink: 0,
          border: '1px solid #E7E7E7',
          borderRadius: '12px',
          bgcolor: '#FFFFFF',
          mb: 1,
        }}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, px: 2, pt: 1.5, pb: 0.75 }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              bgcolor: 'background.paper',
              color: '#1340ff',
              border: '1px solid #E7E7E7',
              borderBottom: '2px solid #E7E7E7',
              borderRadius: 0.85,
              px: 1.5,
              py: 0.6,
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.4,
              userSelect: 'none',
              boxShadow: '0px 1px 0px 0px #E7E7E7',
              flexShrink: 0,
            }}
          >
            {formatTime(currentTime)}
          </Box>
          <TextField
            multiline
            minRows={2}
            maxRows={6}
            placeholder="Leave feedback..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                // handleModalAddComment();
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
                lineHeight: 1.6,
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
            // disabled={!modalCommentText.trim()}
            // onClick={handleModalAddComment}
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 1.5,
          mt: 1.5,
          mb: 1,
        }}
      >
        <Button
          variant="contained"
          disableElevation
          disabled={!feedback.trim()}
          sx={{
            fontWeight: 700,
            fontSize: '0.95rem',
            borderRadius: '10px',
            px: 2.5,
            py: 0.9,
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
          Send Feedback to Creator
        </Button>
        <Button
          variant="contained"
          disableElevation
          disabled={!feedback.trim()}
          sx={{
            fontWeight: 700,
            fontSize: '0.95rem',
            borderRadius: '10px',
            px: 2.5,
            py: 0.9,
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
          Send Feedback to Client
        </Button>
      </Box>
    </Box>
  );
}