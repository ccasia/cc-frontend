import PropTypes from 'prop-types';
import React, { useRef, useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Modal,
  Avatar,
  Dialog,
  Button,
  Backdrop,
  Typography,
  IconButton,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

const formatTime = (timeInSeconds) => {
  if (!timeInSeconds) return '0:00';
  const m = Math.floor(timeInSeconds / 60);
  const s = Math.floor(timeInSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

const VideoSubmissionModal = ({
  open,
  onClose,
  submission,
  creator,
  rightSideContent,
  showNewCommentBorders = false,
}) => {
  const { user } = useAuthContext();
  const isClient = user?.role === 'client';
  const [videoPage, setVideoPage] = useState(0);
  const [freshSubmission, setFreshSubmission] = useState(submission);

  const modalVideoRef = useRef(null);
  const feedbackPanelRef = useRef(null);
  const [modalCurrentTime, setModalCurrentTime] = useState(0);

  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);

  const handleModalSeek = (timeStr) => {
    if (modalVideoRef.current) {
      const seconds = parseTimeToSeconds(timeStr);
      modalVideoRef.current.currentTime = seconds;
      modalVideoRef.current.play();
    }
  };

  useEffect(() => {
    if (open) setVideoPage(0);
  }, [open, submission?.id]);

  useEffect(() => {
    setModalCurrentTime(0);
  }, [videoPage]);

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
  const campaignName = submission.campaign?.name || 'Campaign';

  const creatorInfo = creator || effectiveSubmission.user || effectiveSubmission.creator || {};
  const creatorName =
    creatorInfo.name || creatorInfo.firstName || effectiveSubmission.creatorName || 'Creator';
  const creatorPhoto =
    creatorInfo?.photoURL ||
    creatorInfo?.photoUrl ||
    creatorInfo?.photo ||
    creatorInfo?.image ||
    null;

  const handleModalCloseRequest = () => {
    if (feedbackPanelRef.current) {
      const { getHasInteracted, isLocked, isCountingDown } = feedbackPanelRef.current;
      if (getHasInteracted() && !isLocked && !isCountingDown) {
        setIsCloseConfirmOpen(true);
        return;
      }
    }
    onClose();
  };

  const confirmCloseAndSend = () => {
    setIsCloseConfirmOpen(false);
    if (feedbackPanelRef.current) {
      feedbackPanelRef.current.startCountdown();
    }
  };

  const confirmCloseNoSend = () => {
    setIsCloseConfirmOpen(false);
    onClose();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={isClient ? handleModalCloseRequest : onClose}
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
              onClick={handleModalCloseRequest}
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
                    fontFamily:
                      'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
                    fontFamily:
                      'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
                    ref={modalVideoRef}
                    src={videoUrl}
                    controls
                    controlsList="nodownload"
                    preload="metadata"
                    playsInline
                    onTimeUpdate={(e) => setModalCurrentTime(e.target.currentTime)} // <--- YOUR TIME TRACKER ATTACHED
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
                  videoPage,
                  setVideoPage,
                  videoCount,
                  currentVideo,
                  videos,
                  showNewCommentBorders,
                  submission: effectiveSubmission,
                  submissionId: effectiveSubmission.id,
                  videoId: currentVideo?.id,
                  isPastVideo: videoPage !== 0,
                  currentVideoTime: formatTime(modalCurrentTime),
                  onSeekTo: handleModalSeek,
                  ref: feedbackPanelRef,
                })
              : React.isValidElement(rightSideContent)
                ? React.cloneElement(rightSideContent, {
                    ref: feedbackPanelRef,
                    submissionId: effectiveSubmission.id,
                    videoId: currentVideo?.id,
                    isLocked:
                      !['SENT_TO_CLIENT'].includes(effectiveSubmission.status) ||
                      videoPage !== 0,
                    isPastVideo: videoPage !== 0,
                    currentVideoTime: formatTime(modalCurrentTime),
                    onSeekTo: handleModalSeek,
                    videoPage,
                    setVideoPage,
                    videoCount,
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

      {/* Dialog - Unsent Feedback Intercept */}
      <Dialog
        open={isCloseConfirmOpen}
        onClose={() => setIsCloseConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: { xs: 3, md: 4 },
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
              bgcolor: '#D4FF00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}
          >
            💬
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
          All set with your Feedback?
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: '#636366', fontWeight: 400, fontSize: '16px', mb: 3 }}
        >
          Your submission for <strong>{campaignName}</strong> has feedback to review
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <LoadingButton
            fullWidth
            variant="contained"
            size="large"
            onClick={confirmCloseAndSend}
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
            Yes, I'm done with my feedback
          </LoadingButton>
          <Button
            fullWidth
            variant="outlined"
            onClick={confirmCloseNoSend}
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
            No, I need more time
          </Button>
        </Box>
      </Dialog>
    </>
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
