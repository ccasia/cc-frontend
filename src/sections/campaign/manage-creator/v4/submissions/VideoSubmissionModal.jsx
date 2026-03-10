import React, { useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Avatar, IconButton, Modal, Backdrop } from '@mui/material';
import Iconify from 'src/components/iconify';

const VideoSubmissionModal = ({ open, onClose, submission, creator, rightSideContent }) => {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleSeekToTime = useCallback((timeInSeconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeInSeconds;
      setCurrentTime(timeInSeconds);
    }
  }, []);

  if (!open || !submission) return null;

  const videoUrl = submission.video?.[0]?.url || null;
  
  const captionText = submission.caption || '';
  
  // Get creator info from props or submission object
  // Note: submission.user contains the creator info
  const creatorInfo = creator || submission.user || submission.creator || {};
  const creatorName = creatorInfo.name || creatorInfo.firstName || submission.creatorName || 'Creator';
  const creatorPhoto = creatorInfo?.photoURL || 
                      creatorInfo?.photoUrl || 
                      creatorInfo?.photo ||
                      creatorInfo?.image ||
                      null;
  
  // Debug: Log the data structure
  if (process.env.NODE_ENV === 'development') {
    console.log('Modal Data:', { submission, creator, creatorInfo, creatorName, creatorPhoto });
    console.log('submission.user:', submission.user);
    console.log('submission.admin:', submission.admin);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
          },
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '95vw', sm: '90vw', md: '85vw', lg: '95vw' },
          maxWidth: '95vw',
          height: { xs: '95vh', md: '90vh', lg: 950 },
          maxHeight: 950,
          bgcolor: '#F4F4F4',
          borderRadius: '20px',
          p: 3,
          boxShadow: '0px 24px 48px rgba(0, 0, 0, 0.2)',
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2.5,
          }}
        >
          {/* User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={creatorPhoto}
              alt={creatorName}
              sx={{
                width: 40,
                height: 40,
                border: '2px solid white',
              }}
            >
              {!creatorPhoto && creatorName?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: '#1F2937',
                  lineHeight: 1.2,
                }}
              >
                {creatorName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#8E8E93',
                  fontSize: '0.75rem',
                }}
              >
                {submission.createdAt
                  ? new Date(submission.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : ''}
              </Typography>
            </Box>
          </Box>

          {/* Close Button */}
          <IconButton
            onClick={onClose}
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'white',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                bgcolor: '#F5F5F5',
              },
            }}
          >
            <Iconify icon="eva:close-fill" width={20} color="#636366" />
          </IconButton>
        </Box>

        {/* Main Content Area */}
        <Box
          sx={{
            display: 'flex',
            gap: 2.5,
            flex: 1,
            overflow: 'hidden',
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          {/* Left Side - Caption and Video */}
          <Box
            sx={{
              flex: { xs: '1 1 auto', md: '0 0 60%' },
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              minWidth: 0,
            }}
          >
            {/* Caption Section */}
            <Box
              sx={{
                bgcolor: '#F4F4F4',
                maxHeight: { xs: 'auto', md: 150 },
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0,0,0,0.05)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: 'rgba(0,0,0,0.3)',
                  },
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#636366',
                  mb: 1,
                }}
              >
                Caption
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '0.875rem',
                  color: '#1F2937',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {captionText || 'No caption provided'}
              </Typography>
            </Box>

            {/* Video Player */}
            <Box
              sx={{
                flex: 1,
                bgcolor: '#000',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: { xs: 300, md: 450 },
                position: 'relative',
              }}
            >
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  controlsList="nodownload"
                  preload="metadata"
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                >
                  <track kind="captions" />
                </video>
              ) : (
                <Typography
                  sx={{
                    color: 'white',
                    fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  No video available
                </Typography>
              )}
            </Box>
          </Box>

          {/* Right Side - Flexible Content (Client/Creator/Admin specific) */}
          {(typeof rightSideContent === 'function'
            ? rightSideContent({ currentTime, onSeek: handleSeekToTime })
            : rightSideContent) || (
            <Box
              sx={{
                flex: { xs: '1 1 auto', md: '0 0 calc(40% - 20px)' },
                bgcolor: 'white',
                borderRadius: '12px',
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8E8E93',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  textAlign: 'center',
                }}
              >
                No content
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

VideoSubmissionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  submission: PropTypes.shape({
    id: PropTypes.string,
    caption: PropTypes.string,
    video: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string,
      })
    ),
    createdAt: PropTypes.string,
    user: PropTypes.object,
    creator: PropTypes.object,
    admin: PropTypes.object,
    creatorName: PropTypes.string,
  }),
  creator: PropTypes.shape({
    name: PropTypes.string,
    photoURL: PropTypes.string,
    user: PropTypes.shape({
      name: PropTypes.string,
      photoURL: PropTypes.string,
    }),
  }),
  rightSideContent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};

export default VideoSubmissionModal;
