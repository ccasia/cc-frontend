import PropTypes from 'prop-types';
import React, { useRef, useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Modal,
  Avatar,
  Dialog,
  Button,
  Backdrop,
  Collapse,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { getStatusColor } from 'src/contants/statusColors';

import Iconify from 'src/components/iconify';
import { DarkGlassTooltip } from 'src/components/tooltip/glass-tooltip';

const formatTime = (timeInSeconds) => {
  const t = Math.floor(Math.max(0, Number(timeInSeconds) || 0));
  const h = Math.floor(t / 3600);
  const min = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

const formatTimer = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const VideoSubmissionModal = ({
  open,
  onClose,
  submission,
  creator,
  rightSideContent,
  showNewCommentBorders = false,
  commentHighlightCutoffMs = null,
  videoOrder = 'desc',
}) => {
  const { user } = useAuthContext();
  const isClient = user?.role === 'client';
  const isCreator = user?.role === 'creator';
  const isAdmin = !isClient && !isCreator;
  const [videoPage, setVideoPage] = useState(0);
  const [isCaptionOpen, setIsCaptionOpen] = useState(false);
  const [freshSubmission, setFreshSubmission] = useState(submission);

  const modalVideoRef = useRef(null);
  const feedbackPanelRef = useRef(null);
  const [modalCurrentTime, setModalCurrentTime] = useState(0);
  const [modalDuration, setModalDuration] = useState(0);

  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedbackTimeLeft, setFeedbackTimeLeft] = useState(0);

  const handleModalSeek = (timeStr) => {
    const el = modalVideoRef.current;
    if (!el) return;
    const wasPaused = el.paused;
    const seconds = parseTimeToSeconds(timeStr);
    el.currentTime = seconds;
    if (!wasPaused) {
      el.play();
    }
  };

  useEffect(() => {
    if (open) setVideoPage(videoOrder === 'asc' ? -1 : 0);
  }, [open, submission?.id, videoOrder]);

  useEffect(() => {
    setModalCurrentTime(0);
    setModalDuration(0);
  }, [videoPage]);

  const refreshSubmission = async () => {
    if (!submission?.id) return;
    try {
      const res = await axiosInstance.get(`${endpoints.submission.v4.getById}/${submission.id}`);
      setFreshSubmission(res?.data?.submission || submission);
    } catch (e) {
      // keep current state on error
    }
  };

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
  }, [open, submission?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer for feedbackDeadline (display-only, no auto-submit)
  useEffect(() => {
    const sub = freshSubmission || submission;
    const allVids = sub?.video || [];
    if (!allVids.length) {
      setFeedbackTimeLeft(0);
      return undefined;
    }

    // Derive current video to match render logic (only for admins)
    const MAX = 3;
    let vids;
    if (videoOrder === 'asc') {
      const clipped =
        allVids.length <= MAX ? [...allVids].reverse() : allVids.slice(0, MAX).reverse();
      vids = clipped;
    } else {
      vids = allVids.length <= MAX ? allVids : allVids.slice(0, MAX);
    }

    let page = videoPage;
    if (videoOrder === 'asc') {
      page = videoPage >= 0 && videoPage < vids.length ? videoPage : vids.length - 1;
    }
    const vid = vids[page] || vids[0] || null;
    const deadline = vid?.feedbackDeadline;

    if (!deadline) {
      setFeedbackTimeLeft(0);
      return undefined;
    }

    const endMs = new Date(deadline).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      setFeedbackTimeLeft(remaining);
    };
    tick();
    const timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, [freshSubmission, submission, videoPage, videoOrder]);

  if (!open || !submission) return null;

  const effectiveSubmission = freshSubmission || submission;

  const allVideos = effectiveSubmission.video || [];
  const CLIENT_ALLOWED_STATUSES = ['SENT_TO_CLIENT', 'CLIENT_FEEDBACK', 'APPROVED'];
  const MAX_VIDEO_PAGES = 3;

  // Videos come from backend ordered by createdAt DESC (latest first)
  let videos;
  if (videoOrder === 'asc') {
    // Admin path: reverse DESC-ASC (oldest first), take up to MAX_VIDEO_PAGES
    const clipped =
      allVideos.length <= MAX_VIDEO_PAGES
        ? [...allVideos].reverse()
        : allVideos.slice(0, MAX_VIDEO_PAGES).reverse();
    videos = clipped;
  } else {
    // Client/Creator path: keep DESC, filter for clients
    const visibleVideos = isClient
      ? allVideos.filter((v) => CLIENT_ALLOWED_STATUSES.includes(v.status))
      : allVideos;
    videos =
      visibleVideos.length <= MAX_VIDEO_PAGES
        ? visibleVideos
        : visibleVideos.slice(0, MAX_VIDEO_PAGES);
  }

  const videoCount = videos.length;
  // ASC: default to last index (newest); DESC: default to 0 (newest)
  let effectiveVideoPage = videoPage;
  if (videoOrder === 'asc') {
    effectiveVideoPage = videoPage >= 0 && videoPage < videoCount ? videoPage : videoCount - 1;
  }
  const currentVideo = videos[effectiveVideoPage] || videos[0] || null;
  const videoUrl = currentVideo?.url || null;
  const isPastVideo =
    videoOrder === 'asc' ? effectiveVideoPage !== videoCount - 1 : effectiveVideoPage !== 0;

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

  const handleCopyLink = () => {
    if (videoUrl) {
      navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

  // Role-based status chip helpers
  const campaignType = effectiveSubmission.campaign?.campaignType;
  const submissionStatus = effectiveSubmission.status;

  const getModalStatusColor = (status) => {
    if (isCreator) {
      const creatorColorMap = {
        NOT_STARTED: '#8E8E93',
        IN_PROGRESS: '#8B5CF6',
        PENDING_REVIEW: '#8B5CF6',
        SENT_TO_CLIENT: '#8B5CF6',
        CLIENT_FEEDBACK: '#8B5CF6',
        CHANGES_REQUIRED: '#FF4842',
        REJECTED: '#FF4842',
        APPROVED: '#00AB55',
        CLIENT_APPROVED: '#00AB55',
        POSTED: '#1ABF66',
      };
      return creatorColorMap[status] || '#8E8E93';
    }

    if (isClient) {
      switch (status) {
        case 'SENT_TO_CLIENT':
          return getStatusColor('PENDING_REVIEW');
        case 'PENDING_REVIEW':
        case 'CHANGES_REQUIRED':
        case 'CLIENT_FEEDBACK':
        case 'REJECTED':
          return getStatusColor('IN_PROGRESS');
        default:
          return getStatusColor(status);
      }
    }

    // Admin
    if ((status === 'APPROVED' || status === 'CLIENT_APPROVED') && campaignType === 'normal') {
      return getStatusColor('PENDING_REVIEW');
    }
    return getStatusColor(status);
  };

  const getModalStatusLabel = (status) => {
    if (isCreator) {
      switch (status) {
        case 'IN_PROGRESS':
        case 'PENDING_REVIEW':
        case 'SENT_TO_CLIENT':
        case 'CLIENT_FEEDBACK':
          return 'IN REVIEW';
        case 'CHANGES_REQUIRED':
        case 'REJECTED':
          return 'CHANGES REQUIRED';
        case 'APPROVED':
        case 'CLIENT_APPROVED':
          return 'APPROVED';
        case 'POSTED':
          return 'POSTED';
        case 'NOT_STARTED':
          return 'NOT STARTED';
        default:
          return status?.replace(/_/g, ' ') || 'Unknown';
      }
    }

    if (isClient) {
      switch (status) {
        case 'NOT_STARTED':
          return 'NOT STARTED';
        case 'IN_PROGRESS':
          return 'IN PROGRESS';
        case 'PENDING_REVIEW':
          return 'IN PROGRESS';
        case 'SENT_TO_CLIENT':
          return 'PENDING REVIEW';
        case 'CLIENT_APPROVED':
        case 'APPROVED':
          return 'APPROVED';
        case 'POSTED':
          return 'POSTED';
        case 'CLIENT_FEEDBACK':
        case 'CHANGES_REQUIRED':
        case 'REJECTED':
          return 'IN PROGRESS';
        default:
          return status?.replace(/_/g, ' ') || 'Unknown';
      }
    }

    // Admin
    if (status === 'IN_PROGRESS') return 'PROCESSING';
    if (campaignType === 'normal' && (status === 'APPROVED' || status === 'CLIENT_APPROVED')) {
      return 'PENDING LINK';
    }
    return status?.replace(/_/g, ' ') || 'Unknown';
  };

  const statusColor = getModalStatusColor(submissionStatus);
  const statusLabel = getModalStatusLabel(submissionStatus);

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
                  {(currentVideo?.createdAt || submission.createdAt)
                    ? new Date(currentVideo?.createdAt || submission.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : ''}
                </Typography>
              </Box>
              {/* Status Chip */}
              {submissionStatus && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.8,
                    ml: 1.5,
                    px: 1.3,
                    py: 0.6,
                    border: '1px solid',
                    borderColor: statusColor,
                    borderRadius: 0.8,
                    boxShadow: `0px -2px 0px 0px ${statusColor} inset`,
                    bgcolor: '#fff',
                    color: statusColor,
                  }}
                >
                  {submissionStatus === 'IN_PROGRESS' && (
                    <CircularProgress
                      size={12}
                      thickness={5}
                      sx={{ color: statusColor, display: 'flex' }}
                    />
                  )}
                  <Typography
                    fontWeight="SemiBold"
                    fontSize={12}
                    color={statusColor}
                    noWrap
                  >
                    {statusLabel}
                  </Typography>
                </Box>
              )}
              {/* Feedback Deadline Timer */}
              {feedbackTimeLeft > 0 && !isClient && !isCreator && submissionStatus === 'CLIENT_FEEDBACK' && (
                <DarkGlassTooltip
                  title="Client timer to provide additional feedback for current round of submission."
                  placement="top-start"
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'default',
                      gap: 0.5,
                      color: '#1340ff',
                    }}
                  >
                    <Iconify icon="ic:sharp-timer" width={18} />
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {formatTimer(feedbackTimeLeft)}
                    </Typography>
                  </Box>
                </DarkGlassTooltip>
              )}
            </Box>

            {/* Close Button */}
            <IconButton
              onClick={handleModalCloseRequest}
              sx={{
                p: 0.5,
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              <Iconify icon="eva:close-fill" width={{ xs: 20, md: 24 }} color="#636366" />
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
                flex: { xs: '0 0 auto', md: '0 0 60%' },
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
                  borderRadius: '8px',
                  px: { xs: 1.0, md: 0 },
                  flexShrink: 0,
                }}
              >
                {/* Mobile & Desktop Header */}
                <Box
                  onClick={() => setIsCaptionOpen(!isCaptionOpen)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: { xs: 'pointer', md: 'default' },
                    mb: { xs: 0, md: 0.5 },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'Inter Display, Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', md: '0.875rem' },
                      color: '#636366',
                    }}
                  >
                    Caption
                  </Typography>
                  {/* Dropdown Icon - Only visible on mobile */}
                  <Iconify
                    icon={isCaptionOpen ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'}
                    width={18}
                    sx={{ display: { xs: 'block', md: 'none' }, color: '#636366' }}
                  />
                </Box>

                {/* Mobile: Collapsible Content with MAX HEIGHT */}
                <Collapse in={isCaptionOpen} sx={{ display: { xs: 'block', md: 'none' } }}>
                  <Box
                    sx={{
                      maxHeight: 300,
                      overflowY: 'auto',
                      mt: 1,
                      pr: 1, // Prevents text from touching scrollbar
                      '&::-webkit-scrollbar': { width: '4px' },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '4px',
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Inter Display, Inter, sans-serif',
                        fontSize: '0.813rem',
                        color: '#1F2937',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {captionText || 'No caption provided'}
                    </Typography>
                  </Box>
                </Collapse>

                {/* Desktop: Always visible scrollable area */}
                <Box
                  sx={{
                    display: { xs: 'none', md: 'block' },
                    maxHeight: 150,
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '4px',
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'Inter Display, Inter, sans-serif',
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
              </Box>

              {/* Video Player */}
              <Box
                sx={{
                  flex: 1,
                  bgcolor: '#000',
                  borderRadius: { xs: '8px', md: '12px' },
                  overflow: 'hidden',
                  display: {
                    xs: isCaptionOpen ? 'none' : 'flex',
                    md: 'flex',
                  },
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: { xs: 0, sm: 200, md: 300 },
                  maxHeight: { xs: '33vh', sm: '42vh', md: 'none' },
                  position: 'relative',
                }}
              >
                  {videoUrl && isAdmin && (
                    <DarkGlassTooltip title={copied ? 'Copied!' : 'Copy Link'} placement="right">
                      <IconButton
                        onClick={handleCopyLink}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          zIndex: 10,
                          color: '#F4F4F4',
                          bgcolor: '#1C1C1C',
                          borderRadius: '8px',
                          borderBottom: '2px solid #000',
                          overflow: 'hidden',
                          '&:hover': { bgcolor: '#2C2C2C' },
                        }}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <m.div
                            key={copied ? 'check' : 'copy'}
                            initial={{ opacity: 0, scale: 0.5, y: 6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: -6 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Iconify
                              icon={copied ? 'eva:checkmark-fill' : 'eva:copy-outline'}
                              width={18}
                              sx={{ color: copied ? '#00A76F' : '#F4F4F4' }}
                            />
                          </m.div>
                        </AnimatePresence>
                      </IconButton>
                    </DarkGlassTooltip>
                  )}
                  {videoUrl ? (
                    <video
                      key={currentVideo?.id}
                      ref={modalVideoRef}
                      src={videoUrl}
                      controls
                      controlsList="nodownload"
                      preload="metadata"
                      playsInline
                      onTimeUpdate={(e) => setModalCurrentTime(e.target.currentTime)}
                      onLoadedMetadata={(e) => {
                        if (Number.isFinite(e.target.duration)) setModalDuration(e.target.duration);
                      }}
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
            {(() => {
              if (typeof rightSideContent === 'function') {
                return rightSideContent({
                  videoPage: effectiveVideoPage,
                  setVideoPage,
                  videoCount,
                  currentVideo,
                  videos,
                  showNewCommentBorders,
                  commentHighlightCutoffMs,
                  submission: effectiveSubmission,
                  submissionId: effectiveSubmission.id,
                  videoId: currentVideo?.id,
                  isPastVideo,
                  currentVideoTime: formatTime(modalCurrentTime),
                  onSeekTo: handleModalSeek,
                  ref: feedbackPanelRef,
                  refreshSubmission,
                  // Admin-facing fields (raw seconds)
                  currentTime: modalCurrentTime,
                  duration: modalDuration,
                  onSeek: (seconds) => {
                    if (modalVideoRef.current) {
                      modalVideoRef.current.currentTime = seconds;
                      setModalCurrentTime(seconds);
                    }
                  },
                });
              }
              if (React.isValidElement(rightSideContent)) {
                return React.cloneElement(rightSideContent, {
                  ref: feedbackPanelRef,
                  submissionId: effectiveSubmission.id,
                  videoId: currentVideo?.id,
                  isLocked:
                    !['SENT_TO_CLIENT', 'CLIENT_FEEDBACK'].includes(effectiveSubmission.status) ||
                    isPastVideo,
                  isPastVideo,
                  currentVideoTime: formatTime(modalCurrentTime),
                  onSeekTo: handleModalSeek,
                  videoPage: effectiveVideoPage,
                  setVideoPage,
                  videoCount,
                });
              }
              return rightSideContent;
            })() || (
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
          All set with the Feedback?
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: '#636366', fontWeight: 400, fontSize: '16px', mb: 3 }}
        >
          If yes, your organisation will have 24 hours to add additional feedback before the current
          submission round ends
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
            Yes, the feedback is ready
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
            No, we need more time
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
    campaign: PropTypes.shape({
      name: PropTypes.string,
    }),
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
  commentHighlightCutoffMs: PropTypes.number,
  videoOrder: PropTypes.oneOf(['asc', 'desc']),
};

export default VideoSubmissionModal;
