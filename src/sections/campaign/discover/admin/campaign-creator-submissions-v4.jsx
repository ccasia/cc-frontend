import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useSearchParams } from 'react-router-dom';
import { useRef, useState, useEffect, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';
import {
  Box,
  Chip,
  Stack,
  Avatar,
  Button,
  Dialog,
  Divider,
  Tooltip,
  Collapse,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  useMediaQuery,
  DialogContent,
  DialogActions,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import { useGetV4Submissions } from 'src/hooks/use-get-v4-submissions';

import { getUserDisplay } from 'src/utils/user-display';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { getStatusColor } from 'src/contants/statusColors';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';

import V4VideoSubmission from './submissions/v4/video-submission';
import V4PhotoSubmission from './submissions/v4/photo-submission';
import V4RawFootageSubmission from './submissions/v4/raw-footage-submission';
import MobileCreatorSubmissions from './submissions/v4/mobile/mobile-creator-submissions';
import useV4SubmissionListSocket from './submissions/v4/shared/use-v4-submission-list-socket';

// ----------------------------------------------------------------------

function ScrollingName({ name }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.scrollWidth;
        const needsScroll = textWidth > containerWidth;
        setShouldScroll(needsScroll);
        if (needsScroll) {
          setScrollDistance(textWidth - containerWidth);
        } else {
          setScrollDistance(0);
        }
      }
    };

    // Use a small delay to ensure layout is complete
    const timeoutId = setTimeout(checkOverflow, 0);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [name]);

  // Create keyframes dynamically - using a unique name based on distance
  // We'll use inline styles for the animation since keyframes can't be dynamic
  const animationName = `scroll-${scrollDistance}`;

  return (
    <>
      {shouldScroll && scrollDistance > 0 && (
        <style>
          {`
            @keyframes ${animationName} {
              0%, 25% {
                transform: translateX(0);
              }
              50%, 75% {
                transform: translateX(-${scrollDistance}px);
              }
              100% {
                transform: translateX(0);
              }
            }
          `}
        </style>
      )}
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Tooltip title={name} arrow>
          <Typography
            ref={textRef}
            variant="subtitle1"
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              whiteSpace: 'nowrap',
              display: 'inline-block',
              ...(shouldScroll &&
                scrollDistance > 0 && {
                animation: `${animationName} 8s ease-in-out infinite`,
              }),
            }}
          >
            {name}
          </Typography>
        </Tooltip>
      </Box>
    </>
  );
}

ScrollingName.propTypes = {
  name: PropTypes.string.isRequired,
};

function CreatorAccordionWithSubmissions({ creator, campaign, isDisabled = false, autoExpand = false }) {
  // Get V4 submissions for this creator to check if they have any
  const { submissions, submissionsLoading } = useGetV4Submissions(campaign?.id, creator?.userId);

  // Don't render if loading or if no submissions exist
  if (submissionsLoading || submissions.length === 0) {
    return null;
  }

  // Check if the creator has an approved agreement submission
  // Only show creators whose agreement has been approved by CSM admin
  const agreementSubmission = submissions.find((s) => s.submissionType?.type === 'AGREEMENT_FORM');
  const isAgreementApproved = agreementSubmission?.status === 'APPROVED';

  // Don't render if agreement doesn't exist or isn't approved
  if (!agreementSubmission || !isAgreementApproved) {
    return null;
  }

  return <CreatorAccordion creator={creator} campaign={campaign} isDisabled={isDisabled} autoExpand={autoExpand} />;
}

function CreatorAccordion({ creator, campaign, isDisabled = false, autoExpand = false }) {
  const { user } = useAuthContext();
  const creatorDisplay = getUserDisplay(creator?.user);
  const { socket } = useSocketContext();
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [renderedSubmission, setRenderedSubmission] = useState(null);
  const [rating, setRating] = useState(creator.adminRating || 0);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [ratingNote, setRatingNote] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const theme = useTheme();

  const RATING_TAG_OPTIONS = ['On Brief', 'Creative', 'Easy to work with', 'On Time'];

  const handleOpenRateDialog = () => {
    setSelectedStars(creator.adminRating || 0);
    setSelectedTags(creator.adminRatingTags || []);
    setRatingNote(creator.adminRatingNote || '');
    setRateDialogOpen(true);
  };

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitRating = async () => {
    setSubmittingRating(true);
    try {
      await axiosInstance.post(endpoints.campaign.rateCreator, {
        campaignId: campaign.id,
        creatorId: creator.userId,
        rating: selectedStars,
        tags: selectedTags,
        note: ratingNote,
      });
      setRating(selectedStars);
      setRateDialogOpen(false);
      enqueueSnackbar('Rating submitted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to submit rating', { variant: 'error' });
    } finally {
      setSubmittingRating(false);
    }
  };

  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  // Treat client_demo as a (view-only) client so the demo renders the client
  // submission view rather than the admin view. Actions are gated by isDisabled
  // (the demo passes isDisabled/isDemo down from campaign-detail-view).
  const isClient = userRole.toLowerCase() === 'client' || userRole.toLowerCase() === 'client_demo';

  const { campaignType } = campaign;

  // Get V4 submissions for this creator
  const {
    submissions,
    grouped,
    submissionsLoading,
    submissionsMutate
  } = useGetV4Submissions(campaign?.id, creator?.userId);

  const handleListUpdate = useCallback(() => {
    submissionsMutate();
  }, [submissionsMutate]);

  // Auto-expand the first PENDING_REVIEW submission when navigated from the dashboard modal
  useEffect(() => {
    if (!autoExpand || submissionsLoading) return;
    const groupEntries = [
      { prefix: 'video', list: grouped.videos },
      { prefix: 'rawFootage', list: grouped.rawFootage },
      { prefix: 'photo', list: grouped.photos },
    ];
    const pendingEntry = groupEntries
      .map(({ prefix, list }) => ({
        prefix,
        pending: (list || []).find(
          (s) =>
            s.status === 'PENDING_REVIEW' ||
            s.status === 'APPROVE_LINK' ||
            s.status === 'CLIENT_FEEDBACK'
        ),
      }))
      .find(({ pending }) => pending);

    if (pendingEntry) {
      const key = `${pendingEntry.prefix}-${pendingEntry.pending.id}`;
      setExpandedSubmission(key);
      setRenderedSubmission(key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoExpand, submissionsLoading]);

  const handleSubmissionUpdate = useCallback(
    (shouldCollapse = false) => {
      if (shouldCollapse) {
        setExpandedSubmission(null);
      }
      submissionsMutate();
    },
    [submissionsMutate]
  );

  // Listen for real-time submission updates for this creator
  useV4SubmissionListSocket({
    socket,
    campaignId: campaign?.id,
    creatorUserId: creator?.userId,
    onUpdate: handleListUpdate,
    userId: user?.id,
  });

  const onlyAgreement =
    submissions.length === 1 && submissions[0].submissionType.type === 'AGREEMENT_FORM';

  const handleSubmissionToggle = useCallback(
    async (submissionType, submissionId) => {
      const key = `${submissionType}-${submissionId}`;
      const isCurrentlyExpanded = expandedSubmission === key;

      if (!isCurrentlyExpanded) {
        // If expanding, refresh the data first
        try {
          await submissionsMutate();
        } catch (error) {
          console.error('Error refreshing submission:', error);
        }
        setRenderedSubmission(key);
      }

      setExpandedSubmission((prev) => (prev === key ? null : key));
    },
    [expandedSubmission, submissionsMutate]
  );

  const renderSubmissionPills = () => {
    const pills = [];

    const formatStatus = (status) => status?.replace(/_/g, ' ') || 'Unknown';

    // Status color
    const getClientStatusColor = (status, submissionType = null) => {
      // Admin-specific
      if (!isClient) {
        switch (status) {
          case 'APPROVED':
          case 'CLIENT_APPROVED':
            // Approved video/photo submissions in normal campaigns are waiting for a posting link.
            if (
              campaignType === 'normal' &&
              (submissionType === 'video' || submissionType === 'photo')
            ) {
              return getStatusColor('PENDING_LINK');
            }
            return getStatusColor(status);
          case 'APPROVE_LINK':
            return getStatusColor('APPROVE_LINK');
          default:
            return getStatusColor(status);
        }
      }

      // Client-specific
      switch (status) {
        case 'SENT_TO_CLIENT':
          return getStatusColor('PENDING_REVIEW');
        case 'PENDING_REVIEW':
          return getStatusColor('IN_PROGRESS');
        case 'CHANGES_REQUIRED':
        case 'CLIENT_FEEDBACK':
          return getStatusColor('IN_PROGRESS');
        case 'APPROVE_LINK':
        case 'REJECTED':
          // Mirror the label mapping: posting link approval/rejection reads as APPROVED to clients.
          return getStatusColor('APPROVED');
        default:
          return getStatusColor(status); // Use default mapping for other statuses
      }
    };

    // Status labels
    const getClientStatusLabel = (status, submissionType = null) => {
      // Admin specific
      if (!isClient && campaignType === 'normal') {
        switch (status) {
          case 'IN_PROGRESS':
            return 'PROCESSING';
          case 'APPROVED':
          case 'CLIENT_APPROVED':
            // Only show PENDING LINK for video and photo submissions, not raw footage
            if (submissionType === 'video' || submissionType === 'photo') {
              return 'PENDING LINK';
            }
            return formatStatus(status);
          default:
            return formatStatus(status);
        }
      } else if (!isClient) {
        if (status === 'IN_PROGRESS') return 'PROCESSING';
        return formatStatus(status)
      }

      // Client-specific
      switch (status) {
        case 'NOT_STARTED':
          return 'NOT STARTED';
        case 'IN_PROGRESS':
          return 'IN PROGRESS';
        case 'PENDING_REVIEW':
          return 'IN PROGRESS'; // Creator has submitted, admin reviewing
        case 'SENT_TO_CLIENT':
          return 'PENDING REVIEW'; // Client should see this as pending their review
        case 'CLIENT_APPROVED':
        case 'APPROVED':
        case 'APPROVE_LINK':
        case 'REJECTED':
          // Posting link approval/rejection is internal — once the client has approved the
          // submission, the pill stays on APPROVED until it's actually POSTED.
          return 'APPROVED';
        case 'POSTED':
          return 'POSTED';
        case 'CLIENT_FEEDBACK':
          return 'IN PROGRESS';
        case 'CHANGES_REQUIRED':
          return 'IN PROGRESS';
        default:
          return formatStatus(status);
      }
    };

    // Video submission pills
    grouped.videos?.forEach((videoSubmission, index) => {
      // removed unused submissionCounter
      const key = `video-${videoSubmission.id}`;
      const isExpanded = expandedSubmission === key;

      pills.push(
        <Box
          key={key}
          onClick={() => handleSubmissionToggle('video', videoSubmission.id)}
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            cursor: 'pointer',
            gap: { xs: 0.2, sm: 0.4, md: 0.5 },
            width: { xs: 140, sm: 210 },
            minWidth: { xs: 120, sm: 140 },
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            '&:hover': {
              bgcolor: isExpanded ? 'background.neutral' : 'rgba(231, 231, 231, 0.8)',
            },
          }}
          bgcolor={isExpanded ? 'background.neutral' : '#E7E7E7'}
          py={{ xs: 1.2, sm: 1.5 }}
          pr={{ xs: 0.3, sm: 0.5 }}
          pl={{ xs: 0.5, sm: 0.8 }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={{ xs: 0.2, sm: 0.3 }}
          >
            <Tooltip
              title="Video"
              placement="top"
              PopperProps={{
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, -7],
                    },
                  },
                ],
              }}
              componentsProps={{
                tooltip: {
                  sx: {
                    width: { xs: 80, sm: 95 },
                    height: { xs: 28, sm: 34 },
                    opacity: 1,
                    borderRadius: '10px',
                    padding: { xs: '6px', sm: '10px' },
                    bgcolor: '#FCFCFC',
                    color: '#000',
                    fontSize: { xs: '10px', sm: '12px' },
                    fontWeight: 'medium',
                    boxShadow: '0px 4px 4px 0px #00000040',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                },
              }}
            >
              <Box
                component="img"
                src="/assets/icons/components/ugc_vid.png"
                sx={{
                  width: { xs: 22, sm: 25, md: 27 },
                  height: { xs: 22, sm: 25, md: 27 },
                  filter: isExpanded
                    ? 'brightness(0) saturate(100%) invert(27%) sepia(99%) saturate(6094%) hue-rotate(227deg) brightness(100%) contrast(104%)'
                    : 'none',
                  cursor: 'pointer',
                }}
              />
            </Tooltip>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.3, sm: 0.5, md: 0.8, lg: 1 },
                px: { xs: 0.6, sm: 0.8, md: 1.0, lg: 1.3 },
                py: { xs: 0.3, sm: 0.4, md: 0.5, lg: 0.6 },
                border: '1px solid',
                borderColor: getClientStatusColor(videoSubmission.status, 'video'),
                borderRadius: 0.8,
                boxShadow: `0px -2px 0px 0px ${getClientStatusColor(videoSubmission.status, 'video')} inset`,
                bgcolor: '#fff',
                color: getClientStatusColor(videoSubmission.status, 'video'),
                minWidth: 0,
                flexShrink: 1,
              }}
            >
              {videoSubmission.status === 'IN_PROGRESS' && (
                <CircularProgress
                  size={12}
                  thickness={5}
                  sx={{ color: getClientStatusColor(videoSubmission.status, 'video'), display: 'flex' }}
                />
              )}
              <Typography
                fontWeight="SemiBold"
                fontSize={{ xs: 8, sm: 12 }}
                color={getClientStatusColor(videoSubmission.status, 'video')}
                noWrap
                sx={{
                  maxWidth: { xs: 60, sm: 210 },
                }}
                textOverflow="ellipsis"
                overflow="hidden"
              >
                {getClientStatusLabel(videoSubmission.status, 'video')}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" flexShrink={0}>
            <Iconify
              icon={isExpanded ? 'mingcute:up-line' : 'mingcute:down-line'}
              sx={{
                width: { xs: 20, sm: 22, md: 24, lg: 26 },
                height: { xs: 20, sm: 22, md: 24, lg: 26 },
              }}
              color={isExpanded ? '#1340FF' : '#8E8E93'}
            />
          </Box>
        </Box>
      );
    });

    // Photo submission pills
    grouped.photos?.forEach((photoSubmission, index) => {
      // removed unused submissionCounter
      const key = `photo-${photoSubmission.id}`;
      const isExpanded = expandedSubmission === key;

      pills.push(
        <Box
          key={key}
          onClick={() => handleSubmissionToggle('photo', photoSubmission.id)}
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            cursor: 'pointer',
            gap: { xs: 0.2, sm: 0.4, md: 0.5 },
            width: { xs: 140, sm: 210 },
            minWidth: { xs: 120, sm: 140 },
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            '&:hover': {
              bgcolor: isExpanded ? 'background.neutral' : 'rgba(231, 231, 231, 0.8)',
            },
          }}
          bgcolor={isExpanded ? 'background.neutral' : '#E7E7E7'}
          py={{ xs: 1.2, sm: 1.5 }}
          pl={{ xs: 0.5, sm: 0.8 }}
          pr={{ xs: 0.3, sm: 0.5 }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={{ xs: 0.2, sm: 0.3 }}
          >
            <Tooltip
              title="Photo"
              placement="top"
              PopperProps={{
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, -7],
                    },
                  },
                ],
              }}
              componentsProps={{
                tooltip: {
                  sx: {
                    width: { xs: 80, sm: 95 },
                    height: { xs: 28, sm: 34 },
                    opacity: 1,
                    borderRadius: '10px',
                    padding: { xs: '6px', sm: '10px' },
                    bgcolor: '#FCFCFC',
                    color: '#000',
                    fontSize: { xs: '10px', sm: '12px' },
                    fontWeight: 'medium',
                    boxShadow: '0px 4px 4px 0px #00000040',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                },
              }}
            >
              <Box
                component="img"
                src="/assets/icons/components/photo.png"
                sx={{
                  width: { xs: 22, sm: 25, md: 27 },
                  height: { xs: 22, sm: 25, md: 27 },
                  filter: isExpanded
                    ? 'brightness(0) saturate(100%) invert(27%) sepia(99%) saturate(6094%) hue-rotate(227deg) brightness(100%) contrast(104%)'
                    : 'none',
                  cursor: 'pointer',
                }}
              />
            </Tooltip>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.3, sm: 0.5, md: 0.8, lg: 1 },
                px: { xs: 0.6, sm: 0.8, md: 1.0, lg: 1.3 },
                py: { xs: 0.3, sm: 0.4, md: 0.5, lg: 0.6 },
                border: '1px solid',
                borderColor: getClientStatusColor(photoSubmission.status, 'photo'),
                borderRadius: 0.8,
                boxShadow: `0px -2px 0px 0px ${getClientStatusColor(photoSubmission.status, 'photo')} inset`,
                bgcolor: '#fff',
                color: getClientStatusColor(photoSubmission.status, 'photo'),
                minWidth: 0,
                flexShrink: 1,
              }}
            >
              <Typography
                fontWeight="SemiBold"
                pb={0.2}
                fontSize={{ xs: 8, sm: 12 }}
                color={getClientStatusColor(photoSubmission.status, 'photo')}
                noWrap
                sx={{
                  maxWidth: { xs: 60, sm: 210 },
                }}
                textOverflow="ellipsis"
                overflow="hidden"
              >
                {getClientStatusLabel(photoSubmission.status, 'photo')}
              </Typography>
            </Box>
          </Box>
          <Iconify
            icon={isExpanded ? 'mingcute:up-line' : 'mingcute:down-line'}
            sx={{
              width: { xs: 20, sm: 22, md: 24, lg: 26 },
              height: { xs: 20, sm: 22, md: 24, lg: 26 },
            }}
            color={isExpanded ? '#1340FF' : '#8E8E93'}
          />
        </Box>
      );
    });

    // Raw footage submission pills
    grouped.rawFootage?.forEach((rawFootageSubmission, index) => {
      // removed unused submissionCounter
      const key = `rawFootage-${rawFootageSubmission.id}`;
      const isExpanded = expandedSubmission === key;

      pills.push(
        <Box
          key={key}
          onClick={() => handleSubmissionToggle('rawFootage', rawFootageSubmission.id)}
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            cursor: 'pointer',
            gap: { xs: 0.2, sm: 0.4, md: 0.5 },
            width: { xs: 140, sm: 210 },
            minWidth: { xs: 120, sm: 140 },
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            '&:hover': {
              bgcolor: isExpanded ? 'background.neutral' : 'rgba(231, 231, 231, 0.8)',
            },
          }}
          bgcolor={isExpanded ? 'background.neutral' : '#E7E7E7'}
          py={{ xs: 1.2, sm: 1.5 }}
          pl={{ xs: 0.5, sm: 0.8 }}
          pr={{ xs: 0.3, sm: 0.5 }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={{ xs: 0.2, sm: 0.3 }}
          >
            <Tooltip
              title="Raw Footage"
              placement="top"
              PopperProps={{
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, -7],
                    },
                  },
                ],
              }}
              componentsProps={{
                tooltip: {
                  sx: {
                    width: { xs: 80, sm: 95 },
                    height: { xs: 28, sm: 34 },
                    opacity: 1,
                    borderRadius: '10px',
                    padding: { xs: '6px', sm: '10px' },
                    bgcolor: '#FCFCFC',
                    color: '#000',
                    fontSize: { xs: '10px', sm: '12px' },
                    fontWeight: 'medium',
                    boxShadow: '0px 4px 4px 0px #00000040',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                },
              }}
            >
              <Box
                component="img"
                src="/assets/icons/components/raw_footage.png"
                sx={{
                  width: { xs: 22, sm: 25, md: 27 },
                  height: { xs: 22, sm: 25, md: 27 },
                  filter: isExpanded
                    ? 'brightness(0) saturate(100%) invert(27%) sepia(99%) saturate(6094%) hue-rotate(227deg) brightness(100%) contrast(104%)'
                    : 'none',
                  cursor: 'pointer',
                }}
              />
            </Tooltip>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.3, sm: 0.5, md: 0.8, lg: 1 },
                px: { xs: 0.6, sm: 0.8, md: 1.0, lg: 1.3 },
                py: { xs: 0.3, sm: 0.4, md: 0.5, lg: 0.6 },
                border: '1px solid',
                borderColor: getClientStatusColor(rawFootageSubmission.status, 'rawFootage'),
                borderRadius: 0.8,
                boxShadow: `0px -2px 0px 0px ${getClientStatusColor(rawFootageSubmission.status, 'rawFootage')} inset`,
                bgcolor: '#fff',
                color: getClientStatusColor(rawFootageSubmission.status, 'rawFootage'),
                minWidth: 0,
                flexShrink: 1,
              }}
            >
              <Typography
                fontWeight="SemiBold"
                pb={0.2}
                fontSize={{ xs: 8, sm: 12 }}
                color={getClientStatusColor(rawFootageSubmission.status, 'rawFootage')}
                noWrap
                sx={{
                  maxWidth: { xs: 60, sm: 210 },
                }}
                textOverflow="ellipsis"
                overflow="hidden"
              >
                {getClientStatusLabel(rawFootageSubmission.status, 'rawFootage')}
              </Typography>
            </Box>
          </Box>
          <Iconify
            icon={isExpanded ? 'mingcute:up-line' : 'mingcute:down-line'}
            sx={{
              width: { xs: 20, sm: 22, md: 24, lg: 26 },
              height: { xs: 20, sm: 22, md: 24, lg: 26 },
            }}
            color={isExpanded ? '#1340FF' : '#8E8E93'}
          />
        </Box>
      );
    });

    console.log(pills);

    return pills;
  };

  const renderExpandedSubmission = () => {
    const activeKey = expandedSubmission || renderedSubmission;
    if (!activeKey) return null;

    const [type, id] = activeKey.split('-');

    if (type === 'video') {
      const submission = grouped.videos?.find((v) => v.id === id);
      if (submission) {
        return (
          <V4VideoSubmission
            key={`expanded-${submission.id}`}
            submission={submission}
            campaign={campaign}
            index={grouped.videos.findIndex((v) => v.id === id) + 1}
            onUpdate={handleSubmissionUpdate}
            expanded
            isDisabled={isDisabled}
          />
        );
      }
    }

    if (type === 'photo') {
      const submission = grouped.photos?.find((p) => p.id === id);
      if (submission) {
        return (
          <V4PhotoSubmission
            key={`expanded-${submission.id}`}
            submission={submission}
            campaign={campaign}
            index={grouped.photos.findIndex((p) => p.id === id) + 1}
            onUpdate={handleSubmissionUpdate}
            expanded
            isDisabled={isDisabled}
          />
        );
      }
    }

    if (type === 'rawFootage') {
      const submission = grouped.rawFootage?.find((rf) => rf.id === id);
      if (submission) {
        return (
          <V4RawFootageSubmission
            key={`expanded-${submission.id}`}
            submission={submission}
            campaign={campaign}
            index={grouped.rawFootage.findIndex((rf) => rf.id === id) + 1}
            onUpdate={handleSubmissionUpdate}
            expanded
            isDisabled={isDisabled}
          />
        );
      }
    }

    return null;
  };

  return (
    <Box
      sx={{
        mb: 1,
      }}
    >
      {/* Creator Info Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#E7E7E7',
          boxShadow: '0px 4px 4px 0px #8E8E9340',
          borderRadius: 1,
          pl: { xs: 0.8, sm: 1 },
          pr: { xs: 0.5, sm: onlyAgreement ? 1 : 0 },
          flexDirection: { xs: 'column', sm: 'row' },
          py: { xs: 1, sm: onlyAgreement ? 1 : 0 },
          gap: { xs: 1, sm: 0 },
        }}
      >
        {/* Creator Info Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            pr: { xs: 0, sm: 2 },
            minWidth: 0,
            maxWidth: { xs: '100%', sm: onlyAgreement ? '100%' : 300 },
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'flex-start', sm: 'flex-start' },
          }}
        >
          <Avatar
            src={creator.user?.photoURL}
            alt={creatorDisplay.name}
            sx={{
              width: { xs: 32, sm: 35 },
              height: { xs: 32, sm: 35 },
              mr: { xs: 1.5, sm: 2 },
              flexShrink: 0,
            }}
          >
            {creatorDisplay.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Tooltip title={creatorDisplay.name || 'Unknown Creator'} arrow>
              <Typography
                variant="subtitle1"
                noWrap
                sx={{
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                }}
              >
                {creatorDisplay.name || 'Unknown Creator'}
              </Typography>
            </Tooltip>
          </Box>
        </Box>

        {/* Submission Pills Section */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            gap: { xs: 0.8, sm: 1.2, md: 1.5 },
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            width: { xs: '100%', sm: 'auto' },
            overflowX: { xs: 'auto', sm: 'visible' },
            '&::-webkit-scrollbar': {
              height: 2,
              display: { xs: 'block', sm: 'none' },
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 2,
            },
          }}
        >
          {(() => {
            if (submissionsLoading) {
              return (
                <Typography variant="body2" color="text.secondary">
                  Loading submissions...
                </Typography>
              );
            }
            return renderSubmissionPills();
          })()}
        </Box>

        {/* Rating Section */}
        <Divider orientation='vertical' flexItem
          sx={{ 
            width: '2px',
            bgcolor: '#BDBDBD',
            border: 'none',
            borderRadius: '1',
            my: 1,
            mx: 2.5,
            }} />
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, pr: 1.5 }}>
          {rating > 0 ? (
            <Button
              variant="outlined"
              size="small"
              onClick={handleOpenRateDialog}
              startIcon={<Iconify icon="material-symbols:star-rounded" sx={{ color: '#FFC702' }} />}
              sx={{
                width: '61px',
                height: '30px',
                pt: '6px',
                pr: '8px',
                pb: '9px',
                pl: '8px',
                gap: '4px',
                bgcolor: '#FFFFFF',
                color: '#FFC702',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '8px',
                border: '1.5px solid #FFC702',
                '&:hover': {
                  bgcolor: '#FFFFFF',
                  border: '1.5px solid #FFC702',
                },
              }}
            >
              {rating.toFixed(1)}
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="small"
              onClick={handleOpenRateDialog}
              startIcon={<Iconify icon="material-symbols:star-rounded" sx={{ color: '#D9D9D9' }} />}
              sx={{
                width: '61px',
                height: '30px',
                pt: '6px',
                pr: '8px',
                pb: '9px',
                pl: '8px',
                gap: '4px',
                bgcolor: '#FFFFFF',
                color: '#212B36',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '8px',
                border: '1.5px solid #D3D3D3',
                boxShadow: 'inset 0px -3px 0px 0px #D3D3D3',
                '&:hover': {
                  bgcolor: '#FFFFFF',
                }
              }}
            >
              Rate
            </Button>
          )}
        </Box>


      </Box>

      {/* Expanded Submission Content */}
      <Collapse
        in={Boolean(expandedSubmission)}
        timeout={250}
        unmountOnExit
        onExited={() => setRenderedSubmission(null)}
      >
        <Box sx={{ p: 0, overflow: 'hidden' }}>{renderExpandedSubmission()}</Box>
      </Collapse>

      {/* Rate Creator Dialog */}
      <Dialog
        open={rateDialogOpen}
        onClose={() => setRateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, bgcolor: '#EBEBEB' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 3 }}>
          <DialogTitle
            sx={{
              p: 0,
              fontFamily: `${theme.typography.fontSecondaryFamily} !important`,
              fontWeight: 'normal !important',
              fontSize: '35px !important',
              lineHeight: '1.2 !important',
            }}
          >
            Rate {creator.user?.name || 'Creator'}
          </DialogTitle>
          <IconButton onClick={() => setRateDialogOpen(false)}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Box>

        <Divider sx={{ mt: 2 }} />

        <DialogContent>
          <Stack spacing={0.5} alignItems="center" sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              How was your experience working with {creator.user?.name?.split(' ')[0] || 'them'}?
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <IconButton key={star} onClick={() => setSelectedStars(star)} sx={{ p: 0.5 }}>
                  <Iconify
                    icon="material-symbols:star-rounded"
                    width={40}
                    sx={{ color: star <= selectedStars ? '#FFC702' : '#D9D9D9' }}
                  />
                </IconButton>
              ))}
            </Stack>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          <Typography
            variant="subtitle2"
            sx={{ mb: 1.5, color: '#636366', fontFamily: theme.typography.fontFamily, fontWeight: 500 }}
          >
            Tags (Optional)
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
            {RATING_TAG_OPTIONS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => handleToggleTag(tag)}
                  variant={isSelected ? 'filled' : 'outlined'}
                  sx={{
                    borderRadius: '16px',
                    fontWeight: 600,
                    ...(isSelected
                      ? {
                          bgcolor: '#1340FF',
                          color: '#FFFFFF',
                          '&:hover': { bgcolor: '#1340FF' },
                        }
                      : { color: 'text.secondary', borderColor: '#8E8E93' }),
                  }}
                />
              );
            })}
          </Stack>

          <Typography
            variant="subtitle2"
            sx={{ mb: 1.5, color: '#636366', fontFamily: theme.typography.fontFamily, fontWeight: 500 }}
          >
            Add a note (Optional)
          </Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder="Share feedback on submissions, communication, or anything other brands should know..."
            value={ratingNote}
            onChange={(e) => setRatingNote(e.target.value)}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#FFFFFF',
              },
            }}
          />

          <Divider sx={{ mb: 3 }} />

          <Stack direction="row" alignItems="center">
            <Stack
              direction="row"
              sx={{
                flex: 1,
                bgcolor: '#FFFFFF',
                border: '1px solid #EBEBEB',
                borderRadius: '8px',
                py: 1.25,
                px: 2.5,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ color: '#8E8E93', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  Client Rating
                </Typography>
                <Stack direction="row" spacing={0.25} sx={{ my: 1 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Iconify key={star} icon="material-symbols:star-rounded" width={20} sx={{ color: '#D9D9D9' }} />
                  ))}
                </Stack>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '12px' }}>
                  NOT SET
                </Typography>
              </Box>

              <Stack alignItems="center" justifyContent="center" sx={{ px: 2 }}>
                <Typography variant="h5" sx={{ color: '#B0B0B5' }}>
                  +
                </Typography>
              </Stack>

              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ color: '#8E8E93', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  Your Rating
                </Typography>
                <Stack direction="row" spacing={0.25} sx={{ my: 1 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Iconify
                      key={star}
                      icon="material-symbols:star-rounded"
                      width={20}
                      sx={{ color: star <= selectedStars ? '#FFC702' : '#D9D9D9' }}
                    />
                  ))}
                </Stack>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '12px' }}>
                  {selectedStars > 0 ? `${selectedStars.toFixed(1)}` : 'NOT SET'}
                </Typography>
              </Box>

              <Stack alignItems="center" justifyContent="center" sx={{ px: 2 }}>
                <Typography variant="h5" sx={{ color: '#B0B0B5' }}>
                  =
                </Typography>
              </Stack>
            </Stack>

            <Box
              sx={{
                width: '170px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 1,
                py: 1.60,
                px: 3,
                ml: -2,
                mr: -0.5,
                position: 'relative',
                zIndex: 1,
                bgcolor: '#231F20',
                color: '#FFFFFF',
                borderRadius: '8px',
                boxShadow: '-4px 0px 8px 0px rgba(0,0,0,0.08)',
              }}
            >
              <Typography
                variant="caption"
                noWrap
                sx={{ color: 'grey.500', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Final Rating
              </Typography>
              <Stack direction="row" spacing={0.25}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Iconify key={star} icon="material-symbols:star-rounded" width={20} sx={{ color: '#FFFFFF' }} />
                ))}
              </Stack>
              <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, fontSize: '12px' }}>
                AWAITING BOTH
              </Typography>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            Only final rating is shown to the creator
          </Typography>
          <Button
            variant="contained"
            disabled={selectedStars === 0 || submittingRating}
            onClick={handleSubmitRating}
            sx={{
              width: '139px',
              height: '44px',
              pt: '10px',
              pr: '16px',
              pb: '13px',
              pl: '16px',
              gap: '6px',
              borderRadius: '8px',
              bgcolor: '#1340FF',
              boxShadow: 'inset 0px -3px 0px 0px #0000001A',
              '&:hover': { bgcolor: '#1340FF', boxShadow: 'inset 0px -3px 0px 0px #0000001A' },
              '&.Mui-disabled': { bgcolor: '#A9B2F3', color: '#FFFFFF' },
            }}
          >
            {submittingRating ? <CircularProgress size={20} sx={{ color: '#FFFFFF' }} /> : 'Submit Rating'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

CreatorAccordionWithSubmissions.propTypes = {
  creator: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
  isDisabled: PropTypes.bool,
  autoExpand: PropTypes.bool,
};

CreatorAccordion.propTypes = {
  creator: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
  isDisabled: PropTypes.bool,
  autoExpand: PropTypes.bool,
};

export default function CampaignCreatorSubmissionsV4({ campaign, isDisabled = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams] = useSearchParams();
  const creatorParam = searchParams.get('creator') || '';
  const [searchTerm, setSearchTerm] = useState(creatorParam);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  // Sort and filter creators based on search term and sort direction
  const sortedCreators = (campaign?.shortlisted || []).slice().sort((a, b) => {
    const aName = (a?.user?.name || '').toLowerCase();
    const bName = (b?.user?.name || '').toLowerCase();
    if (aName === bName) return 0;
    if (sortDirection === 'asc') return aName > bName ? 1 : -1;
    return aName < bName ? 1 : -1;
  });

  const filteredCreators =
    sortedCreators.filter((creator) => {
      const display = getUserDisplay(creator.user);
      const name = display.name.toLowerCase();
      const email = display.email.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      return name.includes(searchLower) || email.includes(searchLower);
    }) || [];

  // Only show V4 campaigns
  if (campaign?.submissionVersion !== 'v4') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary" textAlign="center">
          V4 Creator Submissions
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          This tab is only available for V4 campaigns with content-type based submissions.
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          textAlign="center"
          display="block"
          sx={{ mt: 1 }}
        >
          Current campaign version: {campaign?.submissionVersion || 'Not set'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mx: { xs: 1, sm: 0 }, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ width: '100%' }}
        >
          <TextField
            placeholder="Search creators..."
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{
              width: { xs: '100%', sm: 300 },
              flexShrink: 0,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#FFFFFF',
                border: '1.5px solid #e7e7e7',
                borderBottom: '3px solid #e7e7e7',
                borderRadius: 1.15,
                height: 44,
                fontSize: '0.85rem',
                '& fieldset': {
                  border: 'none',
                },
                '&.Mui-focused': {
                  border: '1.5px solid #e7e7e7',
                  borderBottom: '3px solid #e7e7e7',
                },
              },
              '& .MuiOutlinedInput-input': {
                py: 1.25,
                px: 0,
                color: '#637381',
                fontWeight: 600,
                '&::placeholder': {
                  color: '#637381',
                  opacity: 1,
                  fontWeight: 400,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} sx={{ color: '#637381' }} />
                </InputAdornment>
              ),
            }}
          />
          {/* Alphabetical Sort Button */}
          <Button
            onClick={toggleSortDirection}
            endIcon={
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {sortDirection === 'asc' ? (
                  <Stack direction="column" alignItems="center" spacing={0}>
                    <Typography
                      variant="caption"
                      sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}
                    >
                      A
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}
                    >
                      Z
                    </Typography>
                  </Stack>
                ) : (
                  <Stack direction="column" alignItems="center" spacing={0}>
                    <Typography
                      variant="caption"
                      sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}
                    >
                      Z
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}
                    >
                      A
                    </Typography>
                  </Stack>
                )}
                <Iconify
                  icon={
                    sortDirection === 'asc' ? 'eva:arrow-downward-fill' : 'eva:arrow-upward-fill'
                  }
                  width={12}
                />
              </Stack>
            }
            sx={{
              px: 1.5,
              py: 0.75,
              height: '42px',
              color: '#637381',
              fontWeight: 600,
              fontSize: '0.875rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: 1,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              boxShadow: 'none',
              alignSelf: { xs: 'flex-start', sm: 'center' },
              '&:hover': {
                backgroundColor: 'transparent',
                color: '#221f20',
              },
            }}
          >
            Alphabetical
          </Button>
        </Stack>
      </Box>

      {/* Mobile View */}
      {(() => {
        if (isMobile) {
          return (
            <MobileCreatorSubmissions
              campaign={campaign}
              creators={sortedCreators}
              searchTerm={searchTerm}
              isDisabled={isDisabled}
            />
          );
        }
        // Desktop View
        if (filteredCreators.length === 0) {
          return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <EmptyContent sx={{ py: 10 }} title="No creators found" filled />
            </Box>
          );
        }
        return (
          <Stack spacing={{ xs: 0.5, sm: 1 }}>
            {filteredCreators.map((creator, index) => (
              <CreatorAccordionWithSubmissions
                key={creator.userId || index}
                creator={creator}
                campaign={campaign}
                isDisabled={isDisabled}
                autoExpand={!!creatorParam && searchTerm === creatorParam}
              />
            ))}
          </Stack>
        );
      })()}
    </Box>
  );
}

CampaignCreatorSubmissionsV4.propTypes = {
  campaign: PropTypes.object,
  isDisabled: PropTypes.bool,
};
