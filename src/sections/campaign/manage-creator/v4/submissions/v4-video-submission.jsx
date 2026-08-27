import { toast } from 'sonner';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { produce, enableArrayMethods } from 'immer';
import { useMutation } from '@tanstack/react-query';
import React, { useRef, useMemo, useState, useCallback } from 'react';

import { Box, Stack, Divider, Tooltip, TextField, Typography, IconButton } from '@mui/material';

import socket from 'src/hooks/socket';
import { useBoolean } from 'src/hooks/use-boolean';
import { useSubmissionComments } from 'src/hooks/use-submission-comments';
import useResumableUpload from 'src/hooks/submissions/use-resumable-upload';

import axiosInstance from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import CustomV4Upload from 'src/components/upload/custom-v4-upload';

import VideoSubmissionModal from './VideoSubmissionModal';
import { CreatorFeedbackModal } from './feeedback-component';
import {
  getButtonStates,
  SubmissionSection,
  useSubmissionUpload,
  getRelevantFeedback,
  getIsCaptionEditable,
  prepareVideoFormData,
  SubmissionActionButton,
  getSubmissionStatusFlags,
} from './shared';

enableArrayMethods();

// Helper to parse timestamp string to seconds
const parseSecondsFromTimestamp = (timeStr) => {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
};

const readFeedbackViewedCutoffMs = (submissionId) => {
  try {
    const raw = localStorage.getItem(`feedback_viewed_${submissionId}`);
    if (raw == null || raw === '') return null;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? null : n;
  } catch {
    return null;
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

const formatFileName = (fileName, { maxLength = 100, unique = false, fallback = 'file' } = {}) => {
  const lastDot = fileName.lastIndexOf('.');
  const hasExt = lastDot > 0;

  const rawBase = hasExt ? fileName.slice(0, lastDot) : fileName;
  const rawExt = hasExt ? fileName.slice(lastDot + 1) : '';

  const clean = (value) =>
    value
      .normalize('NFKD') // split accents: "é" -> "e" + mark
      .replace(/[\u0300-\u036f]/g, '') // remove the accent marks
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // anything not letter/number -> dash
      .replace(/^-+|-+$/g, ''); // trim dashes at both ends

  let base = clean(rawBase).slice(0, maxLength).replace(/-+$/, '') || fallback;
  const ext = clean(rawExt);

  if (unique) base = `${base}-${Date.now()}`;

  return ext ? `${base}.${ext}` : base;
};

const getFileExt = (fileName) => fileName.split('.').at(-1);

const V4VideoSubmission = ({
  submission,
  onUpdate,
  campaign,
  onUploadStateChange,
  creator,
  mutate,
}) => {
  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNewCommentBorders, setShowNewCommentBorders] = useState(false);
  /** Snapshot of last "viewed" time (ms) before opening modal; null = never viewed */
  const [commentHighlightCutoffMs, setCommentHighlightCutoffMs] = useState(null);
  const [progress, setProgress] = useState(null);
  const [uploadId, setUploadId] = useState(null);

  const isEditingFileName = useBoolean();
  const [fileName, setFileName] = useState('');

  const submittedVideo = useMemo(() => {
    const hasSubmittedVideos = submission.video && submission.video.length > 0;
    return hasSubmittedVideos ? submission.video[0] : null;
  }, [submission.video]);

  const { comments } = useSubmissionComments(submission?.id, submittedVideo?.id);

  const hasNewFeedback = useMemo(() => {
    try {
      const storageKey = `feedback_viewed_${submission.id}`;
      const lastViewedTimestamp = localStorage.getItem(storageKey);

      const allFeedback = submission?.feedback || [];
      const legacyFeedbackTime =
        allFeedback.length > 0
          ? Math.max(...allFeedback.map((f) => new Date(f.createdAt || 0).getTime()))
          : 0;

      const allComments = comments || [];
      const commentTimes = allComments.flatMap((comment) => {
        const times = [new Date(comment.createdAt || 0).getTime()];
        if (comment.replies && comment.replies.length > 0) {
          times.push(...comment.replies.map((r) => new Date(r.createdAt || 0).getTime()));
        }
        return times;
      });
      const latestCommentTime = commentTimes.length > 0 ? Math.max(...commentTimes) : 0;

      const latestFeedbackTime = Math.max(legacyFeedbackTime, latestCommentTime);

      if (!lastViewedTimestamp && latestFeedbackTime > 0) {
        return true;
      }

      if (lastViewedTimestamp && latestFeedbackTime > parseInt(lastViewedTimestamp, 10)) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking new feedback:', error);
      return false;
    }
  }, [submission.id, submission?.feedback, comments]);

  // Use shared hook with video-specific configuration
  const {
    uploading,
    uploadProgress,
    selectedFiles,
    isReuploadMode,

    hasSubmitted,
    caption,
    postingLinks,
    postingLoading,
    setIsReuploadMode,
    setSelectedFiles,
    handlePostingLinkChange,
    handleAddPostingLink,
    handleRemovePostingLink,
    handleCaptionChange,
    handleFilesChange,
    handleReuploadMode,
    handleSubmit,
    handleSubmitPostingLink,
  } = useSubmissionUpload(submission, onUpdate, {
    hasCaption: true,
    hasPostingLink: true,
    allowsMultipleUploads: false,
    mediaType: 'video',
  });

  // Notify parent when upload state changes
  React.useEffect(() => {
    if (onUploadStateChange) {
      onUploadStateChange(uploading);
    }
  }, [uploading, onUploadStateChange]);

  // Get submission status flags
  const statusFlags = useMemo(
    () => getSubmissionStatusFlags(submission, campaign),
    [submission, campaign]
  );

  const {
    isApproved,
    hasChangesRequired,
    isPosted,
    isApproveLink,
    requiresPostingLink,
    isPostingLinkEditable,
    isPostingLinkRejected,
  } = statusFlags;

  // Determine video to show (null if in reupload mode)
  const videoToShow = useMemo(
    () => (isReuploadMode ? null : submittedVideo),
    [isReuploadMode, submittedVideo]
  );

  // Determine if caption is editable
  const isCaptionEditable = useMemo(
    () =>
      getIsCaptionEditable({
        isReuploadMode,
        submittedMediaCount: submittedVideo ? 1 : 0,
        hasSubmitted,
        selectedFilesCount: selectedFiles.length,
        hasChangesRequired,
      }),
    [isReuploadMode, submittedVideo, hasSubmitted, selectedFiles.length, hasChangesRequired]
  );

  // Get relevant feedback
  const relevantFeedback = useMemo(() => getRelevantFeedback(submission), [submission]);

  // Get button states
  const { isDisabled, isReuploadButton, isSubmitButton } = useMemo(
    () =>
      getButtonStates({
        submission,
        isReuploadMode,
        selectedFiles,
        caption,
        uploading,
        postingLoading,
        isPostingLinkEditable,
        isPostingLinkRejected,
        hasCaption: true,
      }),
    [
      submission,
      isReuploadMode,
      selectedFiles,
      caption,
      uploading,
      postingLoading,
      isPostingLinkEditable,
      isPostingLinkRejected,
    ]
  );

  // Handle reupload click (prevent if posting link is rejected)
  const handleReupload = () => {
    if (isPostingLinkRejected) {
      return;
    }
    handleReuploadMode();
  };

  // Handle submit with video-specific logic
  const onSubmit = useCallback(
    (e) => {
      // Prevent default if this is an event
      if (e && e.preventDefault) {
        e.preventDefault();
      }

      handleSubmit(prepareVideoFormData, () => {
        enqueueSnackbar('Videos uploaded successfully and are being processed!', {
          variant: 'success',
        });
      });
    },
    [handleSubmit]
  );

  const markFeedbackAsViewed = useCallback(() => {
    try {
      const storageKey = `feedback_viewed_${submission.id}`;
      const currentTimestamp = Date.now();
      localStorage.setItem(storageKey, currentTimestamp.toString());
    } catch (error) {
      console.error('Error marking feedback as viewed:', error);
    }
  }, [submission.id]);

  // Handle video click to open modal
  const handleVideoClick = useCallback(() => {
    // Only open modal if there's a submitted video (not in reupload mode or selecting new files)
    if (submittedVideo && !isReuploadMode && selectedFiles.length === 0) {
      setCommentHighlightCutoffMs(
        hasNewFeedback ? readFeedbackViewedCutoffMs(submission.id) : null
      );
      setShowNewCommentBorders(hasNewFeedback);
      setIsModalOpen(true);
    }
  }, [submittedVideo, isReuploadMode, selectedFiles.length, hasNewFeedback, submission.id]);

  // Handle view feedback button click
  const handleViewFeedback = useCallback(() => {
    setCommentHighlightCutoffMs(hasNewFeedback ? readFeedbackViewedCutoffMs(submission.id) : null);
    setShowNewCommentBorders(hasNewFeedback);
    setIsModalOpen(true);
  }, [hasNewFeedback, submission.id]);

  // Determine if "View Feedback" button should show
  // Show when there's feedback and a video - including after reupload (so user can view feedback & previous drafts)
  const showViewFeedbackButton = useMemo(
    () => relevantFeedback && relevantFeedback.length > 0 && submittedVideo,
    [relevantFeedback, submittedVideo]
  );

  const abortRef = useRef(null);

  const { createSession, isSameFile, probeSession, uploadFrom } = useResumableUpload();

  const mutation = useMutation({
    mutationKey: ['submission', submission.id],
    mutationFn: async () => {
      const file = selectedFiles[0];
      if (!file) throw new Error('No file selected');

      abortRef.current = new AbortController();
      const { signal } = abortRef.current;
      const onProgress = (sent) => setProgress(Math.round((sent / file.size) * 100));

      setProgress(0);

      // ---- 1. Try to reuse an existing session --------------------
      let session = null;
      let startAt = 0;

      const { data: existing } = await axiosInstance.get('/api/upload-sessions/', {
        params: { submissionId: submission.id },
      });

      const ext = getFileExt(file?.name);

      const newFileName = fileName
        ? formatFileName(`${fileName}.${ext}`)
        : formatFileName(file.name);

      const renamedFile = new File([file], existing?.fileName ?? newFileName ?? file.name, {
        type: file.type,
        lastModified: file.lastModified,
      });

      const candidate = (existing?.uploadSessions ?? []).find(
        (s) => s.gcsSessionUri && isSameFile(renamedFile, s)
      );

      if (candidate) {
        const probe = await probeSession(candidate.gcsSessionUri, file.size);

        if (probe.state === 'complete') {
          // Upload finished last time; only /complete never fired
          session = { id: candidate.id, uri: candidate.gcsSessionUri };
          startAt = file.size;
        } else if (probe.state === 'partial') {
          session = { id: candidate.id, uri: candidate.gcsSessionUri };
          startAt = probe.offset;
        } else {
          // Expired on Google's side — bin the row and start over
          await axiosInstance.delete(`/api/upload-sessions/${candidate.id}`);
        }
      }

      // ---- 2. Otherwise create a fresh one -------------------------
      if (!session) {
        session = await createSession(renamedFile, {
          campaignId: campaign.id,
          submissionId: submission.id,
        });
      }

      // ---- 3. Join the room BEFORE finishing -----------------------
      setUploadId(session.id);
      socket.emit('join:upload', session.id);

      // ---- 4. Upload ------------------------------------------------
      if (startAt < file.size) {
        try {
          await uploadFrom({ uri: session.uri, file, startAt, onProgress, signal });
        } catch (err) {
          if (err.message === 'SESSION_GONE') {
            await axiosInstance.delete(`/api/upload-sessions/${session.id}`);
            throw new Error('Upload session expired. Please try again.');
          }
          throw err;
        }
      } else {
        onProgress(file.size);
      }

      // ---- 5. Finalise ---------------------------------------------
      await axiosInstance.patch(`/api/submission/${submission.id}/caption`, { caption });
      const res = await axiosInstance.post(`/api/upload-sessions/${session.id}/complete`);

      return { session, video: res.data?.video }; // ← no TDZ crash
    },
    onSuccess: async (data) => {
      console.log(data);
      setProgress(0);
      setUploadId(null);
      setSelectedFiles([]);
      setIsReuploadMode(false);
      setFileName(null);

      await mutate(
        produce((draft) => {
          if (!draft?.grouped) return;
          const v = draft.grouped.videos.find((a) => a.id === data?.video?.submissionId);

          if (v) {
            v.status = 'PENDING_REVIEW';
            v.video = [data?.video];
          }
        }),
        { revalidate: false }
      );
      toast.success('Done');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message);
    },
  });

  const cancelUpload = () => abortRef.current?.abort();

  // useEffect(() => {
  //   if (!socket) return;

  //   const handleProgress = (data) => {
  //     const { submissionId, progress: compressProgress } = data;

  //     setCompressionProgress((prev) => {
  //       if (!prev.some((i) => i.submissionId === submissionId)) {
  //         return [...prev, { submissionId, progress: compressProgress }];
  //       }

  //       return prev.map((item) =>
  //         item.submissionId === submissionId ? { ...item, progress: compressProgress } : item
  //       );
  //     });
  //   };

  //   const handleDone = async (data) => {
  //     setCompressionProgress(
  //       produce((draft) => {
  //         const index = draft.findIndex((a) => a.submissionId === data?.submissionId);
  //         if (index !== -1) {
  //           draft.splice(index, 1);
  //         }
  //       })
  //     );

  // setUploadId(null);
  // setSelectedFiles([]);
  // setIsReuploadMode(false);
  // setFileName(null);

  // await mutate(
  //   produce((draft) => {
  //     if (!draft?.grouped) return;
  //     const v = draft.grouped.videos.find((a) => a.id === data?.submissionId);

  //     if (v) {
  //       v.status = 'PENDING_REVIEW';
  //       v.video = [data.video];
  //     }
  //   }),
  //   { revalidate: false }
  // );
  //   };

  //   socket.on('compression:progress', handleProgress);
  //   socket.on('status', handleDone);

  //   // eslint-disable-next-line consistent-return
  //   return () => {
  //     socket.off('compression:progress', handleProgress);
  //     socket.off('status', handleDone);
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [onUpdate, setSelectedFiles, mutate]);

  // const { data } = useQuery({
  //   queryFn: async () => {
  //     const res = await axiosInstance.get('/api/upload-sessions/', {
  //       params: {
  //         status: 'COMPRESSING',
  //         submissionId: submission.id,
  //       },
  //     });

  //     return res.data.uploadSessions[0] || null;
  //   },
  //   queryKey: ['upload-session', submission?.id],
  // });

  // useEffect(() => {
  //   if (!socket || !data) return;

  //   setStatus({ sessionId: data.id, status: data.status, submissionId: data.submissionId });

  //   setCompressionProgress(
  //     produce((draft) => {
  //       const existing = draft.find((i) => i.submissionId === data.submissionId);

  //       if (existing) {
  //         existing.progress = data.progress ?? existing.progress;
  //       } else {
  //         draft.push({ submissionId: data.submissionId, progress: data.progress ?? 0 });
  //       }
  //     })
  //   );

  //   socket.emit('join:upload', data.id);
  // }, [data]);

  const ext = selectedFiles[0]?.name?.split('.').at(-1);
  const textWidth = Math.max((Number(fileName?.length) + (ext?.length ?? 0)) * 10, 35);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 3 },
          mb: 2,
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          '@media (max-width: 1200px)': {
            flexDirection: 'column',
            gap: 2,
          },
        }}
      >
        {/* LEFT SIDE - Video Upload Area */}
        <Box
          sx={{
            width: { xs: '100%', md: '65%' },
            order: { xs: 1, md: 1 },
            '@media (max-width: 1200px)': {
              width: '100%',
            },
          }}
        >
          <CustomV4Upload
            files={selectedFiles}
            onFilesChange={(files) => {
              handleFilesChange(files);
            }}
            disabled={uploading}
            submissionId={submission.id}
            submittedVideo={videoToShow}
            accept="video/*"
            maxSize={500 * 1024 * 1024}
            fileTypes="MP4, MOV, AVI, MKV, WEBM"
            height={450}
            uploading={uploading}
            hasSubmitted={hasSubmitted}
            onVideoClick={handleVideoClick}
            multiple={false}
          />
        </Box>

        {/* RIGHT SIDE - Caption, Posting Link & Feedback Sidebar; actions align to video bottom on md+ */}
        <Box
          sx={{
            width: { xs: '100%', md: '35%' },
            order: { xs: 2, md: 2 },
            display: 'flex',
            flexDirection: 'column',
            '@media (min-width: 1201px)': {
              minHeight: 450,
            },
          }}
        >
          <SubmissionSection
            hasCaption
            caption={caption}
            onCaptionChange={handleCaptionChange}
            isCaptionEditable={isCaptionEditable}
            hasPostingLink={
              requiresPostingLink &&
              (isApproved || isApproveLink || isPosted || isPostingLinkRejected)
            }
            postingLinks={isPostingLinkEditable ? postingLinks : submission.videos || []}
            onPostingLinkChange={handlePostingLinkChange}
            onAddPostingLink={handleAddPostingLink}
            onRemovePostingLink={handleRemovePostingLink}
            isPostingLinkEditable={isPostingLinkEditable}
            feedback={relevantFeedback}
            hasChangesRequired={hasChangesRequired}
            uploading={uploading}
            postingLoading={postingLoading}
          />

          {!!selectedFiles.length && (
            <m.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: {
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                },
              }}
            >
              <Box
                sx={{
                  border: 1,
                  p: 1.5,
                  borderRadius: 1,
                  borderColor: (theme) => theme.palette.grey[400],
                  boxShadow: 5,
                }}
              >
                {/* <Typography>{JSON.stringify(selectedFiles[0].text(), null, 2)}</Typography> */}
                <Stack direction="row" alignItems="center" gap={1}>
                  <Iconify icon="material-symbols:info-outline" />
                  <Typography variant="subtitle2" sx={{ letterSpacing: 0.4, fontWeight: 500 }}>
                    File Information
                  </Typography>
                </Stack>
                <Divider sx={{ mx: -1.5, my: 1.5 }} />
                <Stack gap={1.2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography style={{ fontSize: 14 }}>File name</Typography>
                    <Stack
                      direction="row"
                      alignItems="center"
                      gap={0.5}
                      flex={1 / 2}
                      justifyContent="end"
                      textOverflow="clip"
                      overflow="auto"
                      minWidth={0}
                    >
                      {isEditingFileName.value ? (
                        <Tooltip title="Cancel">
                          <IconButton
                            onClick={() => {
                              setFileName('');
                              isEditingFileName.onFalse();
                            }}
                          >
                            <Iconify icon="proicons:cancel" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Edit file name">
                          <IconButton onClick={isEditingFileName.onTrue}>
                            <Iconify icon="material-symbols:edit-outline" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {isEditingFileName.value ? (
                        <TextField
                          value={fileName}
                          onChange={(e) => {
                            setFileName(e.target.value);
                          }}
                          variant="standard"
                          sx={{
                            width: `${textWidth}px`,
                            transition: 'width 120ms ease',
                            '& .MuiInput-underline:before': {
                              borderBottom: 'none',
                            },
                            '& .MuiInput-underline:after': {
                              borderBottom: 'none',
                            },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                              borderBottom: 'none',
                            },
                            '& .MuiInput-input': {
                              fontWeight: 800,
                              textAlign: 'end',
                              bgcolor: 'redas',
                            },
                          }}
                          autoFocus
                          InputProps={{
                            endAdornment: (
                              <Typography variant="subtitle2">{`.${ext?.toUpperCase()}`}</Typography>
                            ),
                          }}
                        />
                      ) : (
                        <Typography variant="subtitle2" style={{ fontSize: 14 }}>
                          {selectedFiles[0]?.name}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography style={{ fontSize: 14 }}>File type</Typography>
                    <Typography variant="subtitle2" style={{ fontSize: 14 }}>
                      {selectedFiles[0]?.type}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography style={{ fontSize: 14 }}>File size</Typography>
                    <Typography variant="subtitle2" style={{ fontSize: 14 }}>
                      {formatFileSize(selectedFiles[0]?.size)}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </m.div>
          )}

          <Stack sx={{ mt: 'auto', width: '100%' }} direction="row" gap={2}>
            <SubmissionActionButton
              isDisabled={mutation.isPending || uploadId || isDisabled}
              isReuploadButton={isReuploadButton}
              isSubmitButton={isSubmitButton}
              uploading={mutation.isPending || uploadId || uploading}
              postingLoading={postingLoading}
              uploadProgress={progress || uploadProgress || 0}
              onReupload={handleReupload}
              // onSubmit={onSubmit}
              onSubmit={() => {
                mutation.mutate();
              }}
              onPostingLinkSubmit={handleSubmitPostingLink}
              isPostingLinkEditable={isPostingLinkEditable}
              reuploadText="Reupload Draft"
              uploadingText="Uploading videos..."
              showViewFeedbackButton={showViewFeedbackButton}
              onViewFeedback={handleViewFeedback}
              hasNewFeedback={hasNewFeedback}
              sx={{
                mt: 2,
                '@media (min-width: 1201px)': { mt: 0 },
              }}
            />
          </Stack>
        </Box>
      </Box>

      {/* VIDEO SUBMISSION MODAL */}
      <VideoSubmissionModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setShowNewCommentBorders(false);
          setCommentHighlightCutoffMs(null);
          markFeedbackAsViewed();
        }}
        submission={submission}
        creator={creator}
        showNewCommentBorders={showNewCommentBorders}
        commentHighlightCutoffMs={commentHighlightCutoffMs}
        rightSideContent={({
          videoPage,
          setVideoPage,
          videoCount,
          currentVideo,
          showNewCommentBorders: showBorders,
          commentHighlightCutoffMs: highlightCutoff,
          submission: freshSubmission,
          onSeekTo,
          currentVideoTime,
          isPastVideo,
        }) => (
          <CreatorFeedbackModal
            submission={freshSubmission || submission}
            videoPage={videoPage}
            setVideoPage={setVideoPage}
            videoCount={videoCount}
            currentVideo={currentVideo}
            showNewCommentBorders={showBorders}
            commentHighlightCutoffMs={highlightCutoff}
            isPastVideo={isPastVideo}
            onSeekTo={onSeekTo}
            currentTime={parseSecondsFromTimestamp(currentVideoTime)}
          />
        )}
      />
    </Box>
  );
};

V4VideoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  campaign: PropTypes.object,
  onUploadStateChange: PropTypes.func,
  creator: PropTypes.object,
  mutate: PropTypes.func,
};

// Memoize component with custom comparison to prevent unnecessary re-renders
const MemoizedV4VideoSubmission = React.memo(
  V4VideoSubmission,
  (prevProps, nextProps) =>
    // Only re-render if submission status, video, caption, or content changes
    prevProps.submission.id === nextProps.submission.id &&
    prevProps.submission.status === nextProps.submission.status &&
    prevProps.submission.caption === nextProps.submission.caption &&
    prevProps.submission.content === nextProps.submission.content &&
    JSON.stringify(prevProps.submission.videos) === JSON.stringify(nextProps.submission.videos) &&
    JSON.stringify(prevProps.submission.video) === JSON.stringify(nextProps.submission.video) &&
    JSON.stringify(prevProps.submission.feedback) ===
      JSON.stringify(nextProps.submission.feedback) &&
    prevProps.campaign?.campaignType === nextProps.campaign?.campaignType
);

MemoizedV4VideoSubmission.displayName = 'V4VideoSubmission';

export default MemoizedV4VideoSubmission;
