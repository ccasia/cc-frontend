import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useRef, useState } from 'react';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Link,
  Stack,
  alpha,
  Avatar,
  Button,
  darken,
  MenuItem,
  TextField,
  IconButton,
  Typography,
} from '@mui/material';

import Iconify from 'src/components/iconify';

import { posting_link_options_changes } from 'src/sections/campaign/discover/admin/submissions/v4/constants';

import useViewerData from '../hooks/use-viewer-data';
import useLinkReview from '../hooks/use-link-review';
import StatusChip from '../../components/StatusChip';
import useCaptionEditor from '../hooks/use-caption-editor';
import DecisionConfirmDialog from './DecisionConfirmDialog';
import useReviewDecision from '../hooks/use-review-decision';
import useCommentComposer from '../hooks/use-comment-composer';
import useViewerNavigation from '../hooks/use-viewer-navigation';
import ViewerComments, { TimestampChip } from './ViewerComments';
import { getInitials, getStatusChip, getSubmittedAt, getSubmissionLabel } from '../../utils';
import { STEPS, needsAction, getStepIndex, formatTimestamp, isChangesRequested } from '../utils';
import { setVersionIndex, closeSubmissionViewer } from '../../store/use-creator-submissions-store';

const sectionLabelSx = {
  fontSize: 11.5,
  fontWeight: 500,
  color: '#8A8A92',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
};

const WAITING_TEXT = {
  SENT_TO_CLIENT: 'Sent to client · waiting on their approval',
  APPROVED: 'Approved · waiting for the creator to post the link',
  CLIENT_APPROVED: 'Approved · waiting for the creator to post the link',
  POSTED: 'Completed · link approved',
  CHANGES_REQUIRED: 'Changes requested · waiting on the creator',
  REJECTED: 'Changes requested · waiting on the creator',
};

// Two-line decision buttons ("Approve link / marks as completed") shared by the footers
const actionButtonSx = { height: 44, flexDirection: 'column', lineHeight: 1.2 };

const primaryActionSx = {
  ...actionButtonSx,
  bgcolor: '#1304FF',
  '&:hover': { bgcolor: '#0F03CC' },
};

const secondaryActionSx = { ...actionButtonSx, borderColor: '#D9D9DE' };

const actionHintSx = { fontSize: 11, fontWeight: 400 };

const firstNameOf = (user) => user?.name?.split(' ')[0] || 'Creator';

// A posted submission can carry up to two links (`videos`); older ones only have `content`
const getPostingLinks = (submission) =>
  (submission.videos?.length ? submission.videos : [submission.content]).filter(Boolean);

function PostedLinks({ submission }) {
  const links = getPostingLinks(submission);
  if (!links.length) return null;

  return (
    <Stack
      gap={1}
      sx={{ p: 1.5, border: '1px solid #F5D6A0', bgcolor: '#FFF8EC', borderRadius: 1.25 }}
    >
      <Typography sx={{ ...sectionLabelSx, color: '#8A5A00' }}>
        {links.length > 1 ? 'Posted links' : 'Posted link'}
      </Typography>
      {links.map((link) => (
        <Stack key={link} direction="row" alignItems="center" gap={1.25}>
          <Typography noWrap sx={{ flex: 1, minWidth: 0, fontFamily: 'monospace', fontSize: 12.5 }}>
            {link}
          </Typography>
          <Link href={link} target="_blank" rel="noopener" sx={{ fontSize: 12, flexShrink: 0 }}>
            Open ↗
          </Link>
        </Stack>
      ))}
    </Stack>
  );
}

PostedLinks.propTypes = {
  submission: PropTypes.object.isRequired,
};

// APPROVE_LINK footer: the link is the thing to act on. Sending back uses the same fixed
// reasons as the legacy flow (no free-text feedback).
function LinkReview({ submission }) {
  const { pending, approveLink, requestLinkChange } = useLinkReview(submission);
  const { saving: captionSaving } = useCaptionEditor(submission);
  const [requesting, setRequesting] = useState(false);
  const [reasons, setReasons] = useState([]);
  const [showError, setShowError] = useState(false);
  const [confirmingApprove, setConfirmingApprove] = useState(false);

  const busy = Boolean(pending) || captionSaving;
  const label = getSubmissionLabel(submission);
  const firstName = firstNameOf(submission.user);

  const confirmApprove = async () => {
    await approveLink();
    setConfirmingApprove(false);
  };

  const cancelRequest = () => {
    setRequesting(false);
    setReasons([]);
    setShowError(false);
  };

  const handleSendBack = () => {
    if (!reasons.length) {
      setShowError(true);
      return;
    }
    requestLinkChange(reasons);
  };

  return (
    <Stack gap={1.25}>
      <PostedLinks submission={submission} />

      {requesting && (
        <TextField
          select
          fullWidth
          size="small"
          value={reasons}
          disabled={busy}
          error={showError}
          helperText={showError ? 'Pick at least one reason.' : ''}
          onChange={(event) => {
            setReasons(event.target.value);
            setShowError(false);
          }}
          SelectProps={{
            multiple: true,
            displayEmpty: true,
            renderValue: (selected) =>
              selected.length ? (
                selected.join(', ')
              ) : (
                <Box component="span" sx={{ color: '#9A9AA2' }}>
                  What&apos;s wrong with the link?
                </Box>
              ),
          }}
          InputProps={{ sx: { fontSize: 13 } }}
        >
          {posting_link_options_changes.map((option) => (
            <MenuItem key={option} value={option} sx={{ fontSize: 13 }}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      )}

      {requesting ? (
        <Stack direction="row" gap={1.125}>
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            disabled={busy}
            onClick={cancelRequest}
            sx={secondaryActionSx}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            disabled={busy}
            onClick={handleSendBack}
            sx={primaryActionSx}
          >
            {pending === 'reject' ? 'Sending…' : 'Send to creator'}
            <Box component="span" sx={{ ...actionHintSx, opacity: 0.8 }}>
              to post a new link
            </Box>
          </Button>
        </Stack>
      ) : (
        <Stack direction="row" gap={1.125}>
          <Button
            fullWidth
            variant="contained"
            disabled={busy}
            onClick={() => setConfirmingApprove(true)}
            sx={primaryActionSx}
          >
            {pending === 'approve' ? 'Approving…' : 'Approve link'}
            <Box component="span" sx={{ ...actionHintSx, opacity: 0.8 }}>
              marks as completed
            </Box>
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            disabled={busy}
            onClick={() => setRequesting(true)}
            sx={secondaryActionSx}
          >
            Request a change
            <Box component="span" sx={{ ...actionHintSx, color: '#6E6E76' }}>
              link is wrong
            </Box>
          </Button>
        </Stack>
      )}

      <DecisionConfirmDialog
        open={confirmingApprove}
        title={`Approve ${firstName}'s link?`}
        description={`Check the link opens the right post. Approving marks ${label} as posted and completes it.`}
        confirmLabel="Approve link"
        loading={busy}
        onConfirm={confirmApprove}
        onClose={() => setConfirmingApprove(false)}
      />
    </Stack>
  );
}

LinkReview.propTypes = {
  submission: PropTypes.object.isRequired,
};

const nextButtonSx = {
  ml: 'auto',
  flexShrink: 0,
  height: 32,
  px: 1.5,
  fontSize: 12.5,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  color: 'common.white',
  bgcolor: '#17171A',
  '&:hover': { bgcolor: '#000' },
};

// Once a submission is decided: carry on with this creator, then the next creator with
// something needing action, then back to the list when everything's done.
function NextUp() {
  const { creator } = useViewerData();
  const {
    nextActionSubmission,
    goToNextActionSubmission,
    nextActionCreator,
    goToNextActionCreator,
  } = useViewerNavigation();

  if (!creator) return null;

  const firstName = firstNameOf(creator.user);
  const leftForCreator = creator.submissions.filter((item) => needsAction(item.status)).length;

  let message = 'All caught up';
  let action = { label: 'Back to list', onClick: closeSubmissionViewer };

  if (nextActionSubmission) {
    message = `${leftForCreator} left for ${firstName}`;
    action = {
      label: `Next: ${getSubmissionLabel(nextActionSubmission)} →`,
      onClick: goToNextActionSubmission,
    };
  } else if (nextActionCreator) {
    message = `${firstName} is done`;
    action = {
      label: `Next creator: ${firstNameOf(nextActionCreator.user)} →`,
      onClick: goToNextActionCreator,
    };
  }

  return (
    <Stack direction="row" alignItems="center" gap={1.5} sx={{ mt: 1.25 }}>
      <Typography sx={{ fontSize: 12.5, color: '#6E6E76' }}>{message}</Typography>
      <Button variant="contained" onClick={action.onClick} sx={nextButtonSx}>
        {action.label}
      </Button>
    </Stack>
  );
}

function StepBar({ status }) {
  const current = getStepIndex(status);
  const isDone = status === 'POSTED';

  return (
    <Stack direction="row" gap={0.5}>
      {STEPS.map((label, index) => {
        const isCurrent = index === current && !isDone;
        const isPast = index < current || isDone;

        let barColor = '#E4E4E8';
        let labelColor = '#A6A6AE';
        if (isPast) {
          barColor = '#15A34A';
          labelColor = '#6E6E76';
        }
        if (isCurrent) {
          barColor = isChangesRequested(status) ? '#E5533D' : '#1304FF';
          labelColor = '#17171A';
        }

        return (
          <Stack key={label} gap={0.625} sx={{ flex: 1 }}>
            <Box sx={{ height: 4, borderRadius: 99, bgcolor: barColor }} />
            <Typography sx={{ fontSize: 11, fontWeight: isCurrent ? 600 : 400, color: labelColor }}>
              {label}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

StepBar.propTypes = {
  status: PropTypes.string,
};

function CaptionSection({ submission }) {
  const { caption, canEdit, isDirty, saving, changeCaption, discardCaption, saveCaption } =
    useCaptionEditor(submission);

  // Nothing to show or edit
  if (!canEdit && !caption) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    enqueueSnackbar('Caption copied');
  };

  return (
    <Stack gap={1}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography sx={sectionLabelSx}>Caption</Typography>
        {isDirty && (
          <Typography sx={{ fontSize: 11.5, fontStyle: 'italic', color: '#9A9AA2' }}>
            edited
          </Typography>
        )}

        <Stack direction="row" alignItems="center" gap={1.5} sx={{ ml: 'auto' }}>
          {isDirty ? (
            <>
              <Link
                component="button"
                disabled={saving}
                onClick={discardCaption}
                sx={{ fontSize: 12, color: '#6E6E76' }}
              >
                Discard
              </Link>
              <Button
                size="small"
                variant="contained"
                disabled={saving}
                onClick={saveCaption}
                sx={{
                  minWidth: 0,
                  height: 26,
                  px: 1.25,
                  fontSize: 12,
                  bgcolor: '#1304FF',
                  '&:hover': { bgcolor: '#0F03CC' },
                }}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </>
          ) : (
            caption && (
              <Link component="button" onClick={handleCopy} sx={{ fontSize: 12 }}>
                Copy
              </Link>
            )
          )}
        </Stack>
      </Stack>

      {canEdit ? (
        <TextField
          multiline
          fullWidth
          minRows={2}
          maxRows={8}
          size="small"
          value={caption}
          disabled={saving}
          placeholder="Add a caption"
          onChange={(event) => changeCaption(event.target.value)}
          InputProps={{ sx: { fontSize: 14, lineHeight: 1.6 } }}
        />
      ) : (
        <Typography sx={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {caption}
        </Typography>
      )}
    </Stack>
  );
}

CaptionSection.propTypes = {
  submission: PropTypes.object.isRequired,
};

function ReviewComposer({ submission }) {
  const {
    isVideo,
    draft,
    draftTime,
    sending,
    unsentComments,
    hasUnsentFeedback,
    changeDraft,
    postDraft,
  } = useCommentComposer(submission);
  const { saveCaption, saving: captionSaving } = useCaptionEditor(submission);
  const { pending, hasClient, canApprove, canSendToCreator, approve, sendToCreator } =
    useReviewDecision(submission);

  const busy = sending || captionSaving || Boolean(pending);
  const [showError, setShowError] = useState(false);
  // Which decision is waiting for confirmation: 'approve' | 'creator' | null
  const [confirming, setConfirming] = useState(null);
  // Keeps the dialog's wording while it fades out after closing
  const lastConfirmingRef = useRef('approve');
  if (confirming) lastConfirmingRef.current = confirming;
  const dialogKind = confirming ?? lastConfirmingRef.current;

  const firstName = submission.user?.name?.split(' ')[0] || 'the creator';

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      postDraft();
    }
  };

  const confirmApprove = async () => {
    // Unsaved caption edits and unposted feedback both go out with the decision
    const saved = (await saveCaption()) && (await postDraft());
    if (saved) await approve();
    setConfirming(null);
  };

  // Validate first, so the dialog only opens for a send that can actually go out
  const handleSendToCreator = () => {
    if (!draft.trim() && !hasUnsentFeedback) {
      setShowError(true);
      return;
    }
    setConfirming('creator');
  };

  const confirmSendToCreator = async () => {
    // Photos/raw footage take feedback as text: everything not yet sent, incl. the draft.
    // Videos forward their comment thread (the draft is posted to it first).
    const feedbackText = [...unsentComments.map((comment) => comment.text), draft.trim()]
      .filter(Boolean)
      .join('\n\n');
    const saved = (await saveCaption()) && (await postDraft());
    if (saved) await sendToCreator(feedbackText);
    setConfirming(null);
  };

  const placeholder = isVideo
    ? `What ${firstName} should change at this moment`
    : `Notes for the client, or what ${firstName} should change`;

  // Client campaigns validate with the client first; otherwise the admin approves directly
  const approveLabel = hasClient ? 'Send to client' : 'Approve';
  const approveHint = hasClient ? 'for validation' : 'content is good to go';

  const label = getSubmissionLabel(submission);
  // Unsent comments plus the draft (which is posted on confirm)
  const feedbackCount = unsentComments.length + (draft.trim() ? 1 : 0);

  const confirmCopy = {
    approve: hasClient
      ? {
          title: `Send ${label} to the client?`,
          description:
            "The client will review it and either approve it or send feedback. You can't edit it while it's with them.",
          confirmLabel: 'Send to client',
        }
      : {
          title: `Approve ${label}?`,
          description: `This marks ${label} as approved and moves ${firstName} on to the next step.`,
          confirmLabel: 'Approve',
        },
    creator: {
      title: `Send feedback to ${firstName}?`,
      description: `${feedbackCount} ${
        feedbackCount === 1 ? 'piece' : 'pieces'
      } of feedback will be sent and ${label} goes back to ${firstName} for changes.`,
      confirmLabel: 'Send to creator',
    },
  }[dialogKind];

  return (
    <Stack gap={1.25}>
      <Stack direction="row" alignItems="center">
        <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Your feedback</Typography>
        <Typography sx={{ ml: 'auto', fontSize: 11.5, color: '#9A9AA2' }}>
          Enter to add · Shift+Enter for new line
        </Typography>
      </Stack>

      <TextField
        multiline
        minRows={2}
        maxRows={6}
        size="small"
        value={draft}
        disabled={sending}
        onChange={(event) => {
          changeDraft(event.target.value);
          setShowError(false);
        }}
        onKeyDown={handleKeyDown}
        error={showError}
        helperText={showError ? `Add feedback so ${firstName} knows what to change.` : ''}
        placeholder={placeholder}
        InputProps={{
          startAdornment: isVideo ? (
            <TimestampChip timestamp={formatTimestamp(draftTime)} />
          ) : undefined,
          sx: { fontSize: 13, alignItems: 'flex-start' },
        }}
      />

      <Stack direction="row" gap={1.125}>
        {canApprove && (
          <Button
            fullWidth
            variant="contained"
            disabled={busy}
            onClick={() => setConfirming('approve')}
            sx={primaryActionSx}
          >
            {pending === 'approve' ? 'Sending…' : approveLabel}
            <Box component="span" sx={{ ...actionHintSx, opacity: 0.8 }}>
              {approveHint}
            </Box>
          </Button>
        )}
        {canSendToCreator && (
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            disabled={busy}
            onClick={handleSendToCreator}
            sx={secondaryActionSx}
          >
            {pending === 'creator' ? 'Sending…' : 'Send to creator'}
            <Box component="span" sx={{ ...actionHintSx, color: '#6E6E76' }}>
              for resubmission
            </Box>
          </Button>
        )}
      </Stack>

      <DecisionConfirmDialog
        open={Boolean(confirming)}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        loading={busy}
        onConfirm={dialogKind === 'approve' ? confirmApprove : confirmSendToCreator}
        onClose={() => setConfirming(null)}
      />
    </Stack>
  );
}

ReviewComposer.propTypes = {
  submission: PropTypes.object.isRequired,
};

// "Upload 2 of 3" with older/newer arrows; same as ← → and horizontal swipes
function VersionSwitcher() {
  const {
    olderVersion,
    newerVersion,
    versionIndex,
    versionCount,
    hasOlderVersion,
    hasNewerVersion,
  } = useViewerNavigation();

  if (versionCount < 2) return null;

  const uploadNumber = versionCount - versionIndex;
  const arrowSx = { p: 0.5, border: '1px solid #E2E2E6', borderRadius: 0.875 };

  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <IconButton size="small" disabled={!hasOlderVersion} onClick={olderVersion} sx={arrowSx}>
        <Iconify icon="eva:arrow-ios-back-fill" width={14} />
      </IconButton>
      <Typography sx={{ fontSize: 12.5, fontWeight: 500 }}>
        Upload {uploadNumber} of {versionCount}
      </Typography>
      {versionIndex === 0 && (
        <Box
          component="span"
          sx={{
            fontSize: 10.5,
            fontWeight: 600,
            px: 0.875,
            py: 0.25,
            borderRadius: 0.625,
            color: '#7A5C00',
            bgcolor: '#FFF6CC',
          }}
        >
          Latest
        </Box>
      )}
      <IconButton size="small" disabled={!hasNewerVersion} onClick={newerVersion} sx={arrowSx}>
        <Iconify icon="eva:arrow-ios-forward-fill" width={14} />
      </IconButton>
    </Stack>
  );
}

// Shown instead of the feedback box while reviewing an older upload
function OlderVersionNotice({ submission, versionIndex }) {
  const version = submission.video?.[versionIndex];
  const uploadNumber = (submission.video?.length || 0) - versionIndex;

  return (
    <Stack gap={0.75} sx={{ p: 1.5, borderRadius: 1.25, bgcolor: '#FCEEE4', color: '#8A4213' }}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
          Viewing Upload {uploadNumber}
          {version?.createdAt && ` · ${dayjs(version.createdAt).format('D MMM')}`}
        </Typography>
        <Link
          component="button"
          onClick={() => setVersionIndex(0)}
          sx={{ ml: 'auto', fontSize: 12, color: 'inherit', textDecorationColor: 'inherit' }}
        >
          Back to latest
        </Link>
      </Stack>
      {version?.feedback && (
        <Typography sx={{ fontSize: 12.5, lineHeight: 1.5 }}>
          You requested: {version.feedback}
        </Typography>
      )}
    </Stack>
  );
}

OlderVersionNotice.propTypes = {
  submission: PropTypes.object.isRequired,
  versionIndex: PropTypes.number.isRequired,
};

export default function ViewerReviewPanel() {
  const { submission, creator } = useViewerData();
  const { versionIndex } = useViewerNavigation();

  if (!submission) return <Box sx={{ flex: 1, bgcolor: 'background.paper' }} />;

  const statusColor = getStatusChip(submission.status).color;
  const submittedAt = getSubmittedAt(submission);
  // Awaiting link approval → the link moves to the footer as the action
  const isLinkReview = submission.status === 'APPROVE_LINK';

  const feedbackSection = (
    <Stack gap={1.25}>
      <Typography sx={sectionLabelSx}>Feedback</Typography>
      {/* key resets the thread when switching submissions */}
      <ViewerComments key={submission.id} submission={submission} />
    </Stack>
  );

  return (
    <Stack
      sx={{ flex: 1, minWidth: 0, minHeight: 0, bgcolor: 'background.paper', color: '#17171A' }}
    >
      {/* Header */}
      <Stack gap={1.75} sx={{ px: 2.75, pt: 2.5, pb: 2, borderBottom: '1px solid #EDEDF0' }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Avatar
            src={creator.user?.photoURL}
            alt={creator.user?.name}
            sx={{ width: 42, height: 42, fontSize: 14, fontWeight: 600 }}
          >
            {getInitials(creator.user?.name)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap sx={{ fontSize: 15, fontWeight: 600 }}>
              {creator.user?.name}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: '#8A8A92' }}>
              {getSubmissionLabel(submission)}
              {submittedAt && ` · Submitted ${dayjs(submittedAt).format('D MMM')}`}
            </Typography>
          </Box>
          <StatusChip status={submission.status} />
        </Stack>

        <StepBar status={submission.status} />
        <VersionSwitcher />
      </Stack>

      {/* Body */}
      <Stack gap={2.25} sx={{ flex: 1, overflow: 'auto', px: 2.75, py: 2.25 }}>
        {submission.status === 'POSTED' && <PostedLinks submission={submission} />}

        {/* key drops the caption section's state when switching submissions */}
        <CaptionSection key={submission.id} submission={submission} />

        {/* TODO: "Files received" list for RAW_FOOTAGE */}

        {feedbackSection}
      </Stack>

      {/* Footer */}
      <Box sx={{ px: 2.75, pt: 2, pb: 2.5, borderTop: '1px solid #EDEDF0' }}>
        {/* Feedback can only be given on the latest upload */}
        {versionIndex > 0 && (
          <OlderVersionNotice submission={submission} versionIndex={versionIndex} />
        )}
        {versionIndex === 0 && isLinkReview && (
          <LinkReview key={submission.id} submission={submission} />
        )}
        {versionIndex === 0 && needsAction(submission.status) && !isLinkReview && (
          <ReviewComposer key={submission.id} submission={submission} />
        )}
        {versionIndex === 0 && !needsAction(submission.status) && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.25,
              bgcolor: alpha(statusColor, 0.16),
              color: darken(statusColor, 0.4),
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              {WAITING_TEXT[submission.status] ?? getStatusChip(submission.status).label}
            </Typography>
          </Box>
        )}
        {versionIndex === 0 && !needsAction(submission.status) && <NextUp />}
      </Box>
    </Stack>
  );
}
