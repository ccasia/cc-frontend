import PropTypes from 'prop-types';
import React, { useRef, useState, useEffect, useCallback } from 'react';

import { Box, Modal, Avatar, Backdrop, Typography, IconButton } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

const MAX_VIDEO_PAGES = 3;

const VideoSubmissionModal = ({ open, onClose, submission, creator, rightSideContent }) => {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoPage, setVideoPage] = useState(0);
  const [freshSubmission, setFreshSubmission] = useState(null);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleSeekToTime = useCallback((timeInSeconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeInSeconds;
      setCurrentTime(timeInSeconds);
    }
  }, []);

  // Reset to latest video when modal opens or submission changes
  useEffect(() => {
    if (open) setVideoPage(-1);
  }, [open, submission?.id]);

  // Reset time when switching videos
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [videoPage]);

  // Fetch fresh submission data on open to get all video versions
  useEffect(() => {
    let isMounted = true;
    if (!open || !submission?.id) return () => { isMounted = false; };
    setFreshSubmission(null);
    const fetchFresh = async () => {
      try {
        const res = await axiosInstance.get(`${endpoints.submission.v4.getById}/${submission.id}`);
        if (isMounted) {
          setFreshSubmission(res?.data?.submission || null);
        }
      } catch (e) {
        if (isMounted) setFreshSubmission(null);
      }
    };
    fetchFresh();
    return () => { isMounted = false; };
  }, [open, submission?.id]);

  if (!open || !submission) return null;

  const effectiveSubmission = freshSubmission || submission;

  // Video pagination: submission.video is ordered createdAt DESC (newest first).
  // slice(0, N) takes the N newest from the DESC array, then reverse to get ASC for display.
  const allVideos = effectiveSubmission.video || [];
  const latestVideos =
    allVideos.length <= MAX_VIDEO_PAGES
      ? [...allVideos].reverse()
      : allVideos.slice(0, MAX_VIDEO_PAGES).reverse();
  const videos = latestVideos;
  const videoCount = videos.length;
  // Default to latest video (last in reversed array)
  const effectiveVideoPage = videoPage >= 0 && videoPage < videoCount ? videoPage : videoCount - 1;
  const currentVideo = videos[effectiveVideoPage] || videos[videoCount - 1] || null;
  const videoUrl = currentVideo?.url || null;
  const isPastVideo = effectiveVideoPage !== videoCount - 1;

  const captionText = effectiveSubmission.caption || '';

  const creatorInfo = creator || effectiveSubmission.user || effectiveSubmission.creator || {};
  const creatorName =
    creatorInfo.name || creatorInfo.firstName || effectiveSubmission.creatorName || 'Creator';
  const creatorPhoto =
    creatorInfo?.photoURL ||
    creatorInfo?.photoUrl ||
    creatorInfo?.photo ||
    creatorInfo?.image ||
    null;

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
          width: { xs: '95vw', sm: '92vw', md: '88vw', lg: '95vw' },
          maxWidth: '95vw',
          height: { xs: '95vh', sm: '92vh', md: '90vh', lg: 950 },
          maxHeight: '90vh',
          bgcolor: '#F4F4F4',
          borderRadius: '20px',
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
          }}
        >
          {/* User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                  fontFamily:
                    'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
                  fontFamily:
                    'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#8E8E93',
                  display: { xs: 'none', sm: 'block' },
                  fontSize: { xs: '0.688rem', md: '0.75rem' },
                }}
              >
                {effectiveSubmission.createdAt
                  ? new Date(effectiveSubmission.createdAt).toLocaleDateString('en-US', {
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
              p: 0.5,
              width: { xs: 28, md: 32 },
              height: { xs: 28, md: 32 },
              bgcolor: 'white',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)',
              },
            }}
          >
            <Iconify icon="eva:close-fill" width={22} color="#636366" />
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
                  fontFamily:
                    'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
                  fontFamily:
                    'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
                borderRadius: { xs: '8px', md: '12px' },
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: { xs: 200, sm: 280, md: 450 },
                position: 'relative',
              }}
            >
              {videoUrl ? (
                <video
                  key={currentVideo?.id}
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  controlsList="nodownload"
                  preload="metadata"
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
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
                    fontFamily:
                      'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
                currentTime,
                duration,
                onSeek: handleSeekToTime,
                videoId: currentVideo?.id,
                videoPage: effectiveVideoPage,
                setVideoPage,
                videoCount,
                isPastVideo,
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
                  fontFamily:
                    'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
