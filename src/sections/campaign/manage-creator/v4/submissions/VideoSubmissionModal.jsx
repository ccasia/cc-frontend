import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Avatar, IconButton, Modal, Backdrop } from '@mui/material';
import Iconify from 'src/components/iconify';
import axiosInstance, { endpoints } from 'src/utils/axios';

const VideoSubmissionModal = ({ open, onClose, submission, creator, rightSideContent, showNewCommentBorders = false }) => {
  const [videoPage, setVideoPage] = useState(0);
  const [freshSubmission, setFreshSubmission] = useState(submission);

  // Reset to page 1 (latest) when modal opens or submission changes
  useEffect(() => {
    if (open) setVideoPage(0);
  }, [open, submission?.id]);

  // Fetch latest submission (includes feedback replies) on open
  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!open || !submission?.id) return;
      try {
        const res = await axiosInstance.get(`${endpoints.submission.v4.getById}/${submission.id}`);
        if (isMounted) {
          setFreshSubmission(res?.data?.submission || submission);
        }
      } catch (e) {
        if (isMounted) setFreshSubmission(submission);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [open, submission?.id]);

  if (!open || !submission) return null;

  const effectiveSubmission = freshSubmission || submission;

  const allVideos = effectiveSubmission.video || [];
  const MAX_VIDEO_PAGES = 3;
  // Videos come from backend ordered by createdAt DESC (latest first)
  // Take the first MAX_VIDEO_PAGES videos (which are already the latest)
  const latestVideos =
    allVideos.length <= MAX_VIDEO_PAGES
      ? allVideos
      : allVideos.slice(0, MAX_VIDEO_PAGES);
  const videos = latestVideos;
  const videoCount = videos.length;
  const currentVideo = videos[videoPage] || videos[0];
  const videoUrl = currentVideo?.url || null;
  
  const captionText = effectiveSubmission.caption || '';
  
  // Get creator info from props or submission object
  // Note: submission.user contains the creator info
  const creatorInfo = creator || effectiveSubmission.user || effectiveSubmission.creator || {};
  const creatorName = creatorInfo.name || creatorInfo.firstName || effectiveSubmission.creatorName || 'Creator';
  const creatorPhoto = creatorInfo?.photoURL || 
                      creatorInfo?.photoUrl || 
                      creatorInfo?.photo ||
                      creatorInfo?.image ||
                      null;
  
  // Debug: Log the data structure
  if (process.env.NODE_ENV === 'development') {
    console.log('Modal Data:', { submission: effectiveSubmission, creator, creatorInfo, creatorName, creatorPhoto });
    console.log('submission.user:', effectiveSubmission.user);
    console.log('submission.admin:', effectiveSubmission.admin);
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
          width: { xs: '92vw', sm: '95vw', md: '90vw', lg: 1397 },
          maxWidth: { xs: '92vw', sm: '95vw', md: 1397 },
          height: { xs: '90vh', sm: '92vh', md: '90vh', lg: 855 },
          maxHeight: { xs: '90vh', sm: '92vh', md: 855 },
          bgcolor: '#F4F4F4',
          borderRadius: '16px',
          p: { xs: 2, sm: 2.5, md: 3 },
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
            mb: { xs: 1.5, md: 2.5 },
            flexShrink: 0,
          }}
        >
          {/* User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
            <Avatar
              src={creatorPhoto}
              alt={creatorName}
              sx={{
                width: { xs: 36, md: 40 },
                height: { xs: 36, md: 40 },
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
                  fontSize: { xs: '0.875rem', md: '1rem' },
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
                  fontSize: { xs: '0.688rem', md: '0.75rem' },
                  display: { xs: 'none', sm: 'block' },
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
              width: { xs: 28, md: 32 },
              height: { xs: 28, md: 32 },
              bgcolor: 'white',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                bgcolor: '#F5F5F5',
              },
            }}
          >
            <Iconify icon="eva:close-fill" width={{ xs: 18, md: 20 }} color="#636366" />
          </IconButton>
        </Box>

        {/* Main Content Area */}
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 2, md: 2.5 },
            flex: 1,
            overflow: 'hidden',
            flexDirection: { xs: 'column', md: 'row' },
            minHeight: 0,
          }}
        >
          {/* Left Side - Caption and Video */}
          <Box
            sx={{
              flex: { xs: '1 1 auto', md: '0 0 60%' },
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 1.5, md: 2.5 },
              minWidth: 0,
              minHeight: 0,
            }}
          >
            {/* Caption Section */}
            <Box
              sx={{
                bgcolor: '#F4F4F4',
                maxHeight: { xs: 100, sm: 120, md: 150 },
                overflowY: 'auto',
                flexShrink: 0,
                '&::-webkit-scrollbar': {
                  width: '4px',
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
                  fontSize: { xs: '0.813rem', md: '0.875rem' },
                  color: '#636366',
                  mb: 0.5,
                }}
              >
                Caption
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: { xs: '0.813rem', md: '0.875rem' },
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
                borderRadius: { xs: '8px', md: '12px' },
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: { xs: 160, sm: 280, md: 450 },
                maxHeight: { xs: '32vh', sm: '42vh', md: 'none' },
                position: 'relative',
              }}
            >
              {videoUrl ? (
                <video
                  key={currentVideo?.id}
                  src={videoUrl}
                  controls
                  controlsList="nodownload"
                  preload="metadata"
                  playsInline
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
            ? rightSideContent({
                videoPage,
                setVideoPage,
                videoCount,
                currentVideo,
                videos,
                showNewCommentBorders,
                submission: effectiveSubmission,
              })
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
  showNewCommentBorders: PropTypes.bool,
};

export default VideoSubmissionModal;
