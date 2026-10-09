import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useRef, useState, useEffect, useLayoutEffect } from 'react';

import {
  Box,
  Link,
  Stack,
  alpha,
  Avatar,
  darken,
  Tooltip,
  TextField,
  ButtonBase,
  IconButton,
  Typography,
} from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import CtaButton from 'src/components/cta-button';

import ReasonChips from './ReasonChips';
import { sectionLabelSx } from '../styles';
import PostingLinkForm from './PostingLinkForm';
import FeedbackHistory from './FeedbackHistory';
import useViewerData from '../hooks/use-viewer-data';
import useLinkReview from '../hooks/use-link-review';
import StatusChip from '../../components/StatusChip';
import useReasonPicker from '../hooks/use-reason-picker';
import useCaptionEditor from '../hooks/use-caption-editor';
import DecisionConfirmDialog from './DecisionConfirmDialog';
import useReviewDecision from '../hooks/use-review-decision';
import useCommentComposer from '../hooks/use-comment-composer';
import useViewerNavigation from '../hooks/use-viewer-navigation';
import ViewerComments, { timestampChipSx } from './ViewerComments';
import useCaptionHistory, { getAdminCaptionEdit } from '../hooks/use-caption-history';
import { getInitials, getStatusChip, getSubmittedAt, getSubmissionLabel } from '../../utils';
import { isAdminAddedLink, canAddPostingLink, canApproveAdminAddedLinks } from '../posting-links';
import {
  STEPS,
  needsAction,
  getStepIndex,
  formatTimestamp,
  isChangesRequested,
  REVIEW_SCROLL_ATTR,
} from '../utils';
import {
  setItemIndex,
  toggleHistory,
  openLinkChange,
  closeLinkChange,
  setVersionIndex,
  setFeedbackError,
  openChangeRequest,
  closeChangeRequest,
  setLinkChangeError,
  setCaptionOverflows,
  toggleCaptionExpanded,
  closeSubmissionViewer,
  setConfirmingDecision,
  useCreatorSubmissionsStore,
} from '../../store/use-creator-submissions-store';

const WAITING_TEXT = {
  SENT_TO_CLIENT: 'Sent to client · waiting on their approval',
  APPROVED: 'Approved · waiting for the creator to post the link',
  CLIENT_APPROVED: 'Approved · waiting for the creator to post the link',
  POSTED: 'Completed · link approved',
  CHANGES_REQUIRED: 'Changes requested · waiting on the creator',
  REJECTED: 'Changes requested · waiting on the creator',
};

// Text colours for white CtaButtons
const APPROVE_COLOR = '#1ABF66';
const REQUEST_CHANGE_COLOR = '#D4321C';
const NEUTRAL_COLOR = '#3A3A3C';

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
          <Typography
            noWrap
            sx={{
              flex: 1,
              minWidth: 0,
              fontFamily: 'monospace',
              fontSize: 12,
              letterSpacing: '-0.04em',
            }}
          >
            {link}
          </Typography>
          <Link
            href={link}
            target="_blank"
            rel="noopener"
            sx={{ fontSize: 12, flexShrink: 0, color: '#1340FF' }}
          >
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

function LinkReview({ submission }) {
  const { pending, approveLink, requestLinkChange } = useLinkReview(submission);
  const { saving: captionSaving } = useCaptionEditor(submission);
  const requesting = useCreatorSubmissionsStore((s) => s.linkChangeOpen);
  const { selected: reasons } = useReasonPicker('link');
  const confirmingApprove = useCreatorSubmissionsStore(
    (s) => s.confirmingDecision === 'link-approve'
  );

  const busy = Boolean(pending) || captionSaving;
  const label = getSubmissionLabel(submission);
  const firstName = firstNameOf(submission.user);

  const confirmApprove = async () => {
    await approveLink();
    setConfirmingDecision(null);
  };

  const handleSendBack = () => {
    if (!reasons.length) {
      setLinkChangeError(true);
      return;
    }
    requestLinkChange(reasons);
  };

  return (
    <Stack gap={1.25}>
      <PostedLinks submission={submission} />
      <AddedByAdminNote submission={submission} />

      {requesting && <ReasonChips kind="link" />}

      {requesting ? (
        <Stack direction="row" gap={1.125}>
          <CtaButton
            fullWidth
            size="large"
            variant="white"
            color={NEUTRAL_COLOR}
            disabled={busy}
            onClick={closeLinkChange}
          >
            Cancel
          </CtaButton>
          <CtaButton
            fullWidth
            size="large"
            variant="blue"
            hint="to post a new link"
            disabled={busy}
            onClick={handleSendBack}
          >
            {pending === 'reject' ? 'Sending…' : 'Send to creator'}
          </CtaButton>
        </Stack>
      ) : (
        <Stack direction="row" gap={1.125}>
          <CtaButton
            fullWidth
            size="large"
            variant="white"
            color={APPROVE_COLOR}
            hint="marks as completed"
            disabled={busy}
            onClick={() => setConfirmingDecision('link-approve')}
          >
            {pending === 'approve' ? 'Approving…' : 'Approve link'}
          </CtaButton>
          <CtaButton
            fullWidth
            size="large"
            variant="white"
            color={REQUEST_CHANGE_COLOR}
            hint="link is wrong"
            disabled={busy}
            onClick={openLinkChange}
          >
            Request a change
          </CtaButton>
        </Stack>
      )}

      <DecisionConfirmDialog
        open={confirmingApprove}
        title={`Approve ${firstName}'s link?`}
        description={`Check the link opens the right post. Approving marks ${label} as posted and completes it.`}
        confirmLabel="Approve link"
        loading={busy}
        onConfirm={confirmApprove}
        onClose={() => setConfirmingDecision(null)}
      />
    </Stack>
  );
}

LinkReview.propTypes = {
  submission: PropTypes.object.isRequired,
};

// "Added by Sam" when an admin, not the creator, submitted the link
function AddedByAdminNote({ submission }) {
  if (!isAdminAddedLink(submission)) return null;
  return (
    <Typography sx={{ fontSize: 12, color: '#6E6E76' }}>
      Added by {submission.admin?.user?.name || 'an admin'} for the creator
    </Typography>
  );
}

AddedByAdminNote.propTypes = {
  submission: PropTypes.object.isRequired,
};

// What admins who can't approve see while an admin-added link waits for an approver
function AwaitingLinkApproval({ submission }) {
  return (
    <Stack gap={1.25}>
      <PostedLinks submission={submission} />
      <Box sx={{ p: 1.5, borderRadius: 1.25, bgcolor: '#FFF6E5', color: '#8A5A00' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
          Waiting for a superadmin or CS lead to approve
        </Typography>
        <Typography sx={{ fontSize: 12, mt: 0.25 }}>
          Added by {submission.admin?.user?.name || 'an admin'} for the creator.
        </Typography>
      </Box>
    </Stack>
  );
}

AwaitingLinkApproval.propTypes = {
  submission: PropTypes.object.isRequired,
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
      <CtaButton variant="dark" onClick={action.onClick} sx={{ ml: 'auto' }}>
        {action.label}
      </CtaButton>
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

// Small CtaButton (28) + its 3px lip, so the field doesn't shift when Save appears
const CAPTION_HEADER_HEIGHT = 31;
// The edit box grows to this many lines, and the read-only caption is clamped to match
const CAPTION_MAX_LINES = 8;

const captionTextSx = { fontSize: 14, lineHeight: 1.6 };

const PANEL_BODY_PAD_Y = 18;
const CAPTION_GAP = 8;
const CAPTION_TOGGLE_LINE_PX = 24;
const CAPTION_CHROME_PX = CAPTION_HEADER_HEIGHT + CAPTION_GAP + CAPTION_TOGGLE_LINE_PX;
const CAPTION_SECTION_ATTR = 'data-caption-section';

// Read-only caption: same max height as the edit box, "See more" for the rest
function CaptionText({ caption }) {
  const textRef = useRef(null);
  const expanded = useCreatorSubmissionsStore((s) => s.captionExpanded);
  const overflows = useCreatorSubmissionsStore((s) => s.captionOverflows);

  // Measured while clamped; re-measures when the panel is resized
  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element || expanded) return undefined;
    const measure = () => setCaptionOverflows(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [caption, expanded]);

  const handleToggle = () => {
    const willExpand = !expanded;
    // The clamped view keeps the element's scroll position; collapse back to the first lines
    if (!willExpand && textRef.current) textRef.current.scrollTop = 0;
    toggleCaptionExpanded();
    // Line the caption up with the top of the panel so it can run down to the footer
    if (willExpand) {
      requestAnimationFrame(() =>
        textRef.current
          ?.closest(`[${CAPTION_SECTION_ATTR}]`)
          ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      );
    }
  };

  return (
    <Box>
      <Typography
        ref={textRef}
        sx={{
          ...captionTextSx,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          ...(expanded
            ? {
                // Desktop: the panel body is a size container, so cqh = its visible height.
                // Mobile scrolls the whole page instead, so cap against the screen.
                maxHeight: { xs: '60svh', md: `calc(100cqh - ${CAPTION_CHROME_PX}px)` },
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                pr: 0.5,
              }
            : {
                display: '-webkit-box',
                WebkitLineClamp: CAPTION_MAX_LINES,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }),
        }}
      >
        {caption}
      </Typography>
      {(overflows || expanded) && (
        <Link
          component="button"
          onClick={handleToggle}
          sx={{ mt: 0.5, fontSize: 12, fontWeight: 500, color: '#1340FF' }}
        >
          {expanded ? 'See less' : 'See more'}
        </Link>
      )}
    </Box>
  );
}

CaptionText.propTypes = {
  caption: PropTypes.string.isRequired,
};

function CaptionSection({ submission }) {
  const { caption, canEdit, isDirty, saving, changeCaption, discardCaption, saveCaption } =
    useCaptionEditor(submission);
  const { captionHistory } = useCaptionHistory(submission.id);
  // Stays "edited" after saving, for as long as the caption is the admin's version
  const adminEdit = getAdminCaptionEdit(captionHistory, submission.caption);

  // Nothing to show or edit
  if (!canEdit && !caption) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    enqueueSnackbar('Caption copied');
  };

  return (
    <Stack
      {...{ [CAPTION_SECTION_ATTR]: '' }}
      gap={`${CAPTION_GAP}px`}
      sx={{ scrollMarginTop: PANEL_BODY_PAD_Y }}
    >
      {/* Fixed height = the Save button's, so the field doesn't shift when it appears */}
      <Stack direction="row" alignItems="center" gap={1} sx={{ height: CAPTION_HEADER_HEIGHT }}>
        <Typography sx={sectionLabelSx}>Caption</Typography>
        {isDirty && (
          <Typography sx={{ fontSize: 12, fontStyle: 'italic', color: '#1340FF' }}>
            edited
          </Typography>
        )}
        {!isDirty && adminEdit && (
          <Tooltip
            title={`Edited by ${adminEdit.authorName || 'an admin'} · ${dayjs(
              adminEdit.createdAt
            ).format('D MMM, h:mm A')}`}
          >
            <Typography sx={{ fontSize: 12, fontStyle: 'italic', color: '#1340FF' }}>
              edited
            </Typography>
          </Tooltip>
        )}
        {!isDirty && !adminEdit && canEdit && (
          <Typography sx={{ fontSize: 12, fontStyle: 'italic', color: '#9A9AA2' }}>
            (editable)
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
              <CtaButton size="small" variant="blue" disabled={saving} onClick={saveCaption}>
                {saving ? 'Saving…' : 'Save'}
              </CtaButton>
            </>
          ) : (
            caption && (
              <Link component="button" onClick={handleCopy} sx={{ fontSize: 12, color: '#1340FF' }}>
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
          maxRows={CAPTION_MAX_LINES}
          size="small"
          value={caption}
          disabled={saving}
          placeholder="Add a caption"
          onChange={(event) => changeCaption(event.target.value)}
          InputProps={{ sx: captionTextSx }}
        />
      ) : (
        <CaptionText caption={caption} />
      )}
    </Stack>
  );
}

CaptionSection.propTypes = {
  submission: PropTypes.object.isRequired,
};

// Seconds of video per pixel dragged on the timestamp chip
const DRAG_SECONDS_PER_PX = 0.15;

// The feedback's timestamp; drag sideways to nudge it (and the video) to the right frame
function DraftTimestamp({ time, onAdjust }) {
  const dragRef = useRef(null);

  return (
    <Tooltip title="Drag to adjust" placement="top">
      <Box
        component="span"
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = { startX: event.clientX, startTime: time };
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag) return;
          onAdjust(drag.startTime + (event.clientX - drag.startX) * DRAG_SECONDS_PER_PX);
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
        sx={{
          ...timestampChipSx,
          mt: '1px',
          cursor: 'ew-resize',
          userSelect: 'none',
          touchAction: 'none',
          '&:hover': { bgcolor: '#DCD8FF' },
        }}
      >
        {formatTimestamp(time)}
      </Box>
    </Tooltip>
  );
}

DraftTimestamp.propTypes = {
  time: PropTypes.number.isRequired,
  onAdjust: PropTypes.func.isRequired,
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
    adjustDraftTime,
    postDraft,
  } = useCommentComposer(submission);
  const { saveCaption, saving: captionSaving } = useCaptionEditor(submission);
  const {
    pending,
    hasClient,
    canSendToClient,
    canApprove,
    canSendToCreator,
    sendToClient,
    approve,
    sendToCreator,
  } = useReviewDecision(submission);

  const busy = sending || captionSaving || Boolean(pending);
  const showError = useCreatorSubmissionsStore((s) => s.feedbackError);
  // Which decision is waiting for confirmation: 'client' | 'approve' | 'creator' | null
  const confirmingDecision = useCreatorSubmissionsStore((s) => s.confirmingDecision);
  const confirming = ['client', 'approve', 'creator'].includes(confirmingDecision)
    ? confirmingDecision
    : null;
  // Keeps the dialog's wording while it fades out after closing
  const lastConfirmingRef = useRef('approve');
  if (confirming) lastConfirmingRef.current = confirming;
  const dialogKind = confirming ?? lastConfirmingRef.current;

  const firstName = submission.user?.name?.split(' ')[0] || 'the creator';
  // Photos / raw footage are sent back with reasons only (videos send their comment thread)
  const changeRequestOpen = useCreatorSubmissionsStore((s) => s.changeRequestOpen);
  const { selected: pickedReasons } = useReasonPicker('creator');
  const reasons = isVideo ? [] : pickedReasons;

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      postDraft();
    }
  };

  // Send to client / Approve: unsaved caption edits and unposted feedback go out first
  const confirmDecision = async (kind) => {
    const saved = (await saveCaption()) && (await postDraft());
    if (saved) await (kind === 'client' ? sendToClient() : approve());
    setConfirmingDecision(null);
  };

  // Validate first, so the dialog only opens for a send that can actually go out
  const handleSendToCreator = () => {
    const hasFeedback = isVideo ? draft.trim() || hasUnsentFeedback : reasons.length;
    if (!hasFeedback) {
      setFeedbackError(true);
      return;
    }
    setConfirmingDecision('creator');
  };

  const confirmSendToCreator = async () => {
    // Videos forward their comment thread (the draft is posted to it first)
    const saved = (await saveCaption()) && (await postDraft());
    if (saved) await sendToCreator(reasons);
    setConfirmingDecision(null);
  };

  // Client feedback rounds: comments can exist but all be left out of what goes to the creator
  let emptyFeedbackError = `Add feedback so ${firstName} knows what to change.`;
  if (submission.status === 'CLIENT_FEEDBACK') {
    emptyFeedbackError = `Tick at least one comment for ${firstName}, or add feedback here.`;
  }

  const placeholder = `What ${firstName} should change at this moment`;

  const label = getSubmissionLabel(submission);
  // Unsent comments plus the draft (which is posted on confirm); videos only
  const feedbackCount = isVideo ? unsentComments.length + (draft.trim() ? 1 : 0) : 0;

  const confirmCopy = {
    client: {
      title: `Send ${label} to the client?`,
      description:
        "The client will review it and either approve it or send feedback. You can't edit it while it's with them.",
      confirmLabel: 'Send to client',
    },
    approve: {
      title: `Approve ${label}?`,
      description: hasClient
        ? `This approves ${label} straight away, without the client reviewing it.`
        : `This marks ${label} as approved and moves ${firstName} on to the next step.`,
      confirmLabel: 'Approve',
    },
    creator: {
      title: `Send feedback to ${firstName}?`,
      description: `${[
        feedbackCount && `${feedbackCount} ${feedbackCount === 1 ? 'piece' : 'pieces'} of feedback`,
        reasons.length && `${reasons.length} ${reasons.length === 1 ? 'reason' : 'reasons'}`,
      ]
        .filter(Boolean)
        .join(' and ')} will be sent and ${label} goes back to ${firstName} for changes.`,
      confirmLabel: 'Send to creator',
    },
  }[dialogKind];

  const sendToClientButton = canSendToClient && (
    <CtaButton
      fullWidth
      size="large"
      variant="dark"
      hint="for validation"
      disabled={busy}
      onClick={() => setConfirmingDecision('client')}
    >
      {pending === 'client' ? 'Sending…' : 'Send to client'}
    </CtaButton>
  );

  // Its own button, last in the footer: approve straight away (first review only)
  const approveButton = canApprove && (
    <CtaButton
      fullWidth
      size="large"
      variant="white"
      color={APPROVE_COLOR}
      hint={hasClient ? 'without client review' : 'content is good to go'}
      disabled={busy}
      onClick={() => setConfirmingDecision('approve')}
    >
      {pending === 'approve' ? 'Approving…' : 'Approve'}
    </CtaButton>
  );

  const sendToCreatorLabel = pending === 'creator' ? 'Sending…' : 'Send to creator';

  // Photos / raw footage: "Request a change" first (like the posted-link review); the
  // reasons and the send only show once sending back. Without an approve option (client
  // feedback round) sending back is the only choice, so they show straight away.
  const showReasons = !isVideo && canSendToCreator && (changeRequestOpen || !canApprove);

  let actions;
  if (showReasons) {
    actions = (
      <Stack direction="row" gap={1.125}>
        {/* Nothing to go back to when sending back is the only option */}
        {canApprove && (
          <CtaButton
            fullWidth
            size="large"
            variant="white"
            color={NEUTRAL_COLOR}
            disabled={busy}
            onClick={closeChangeRequest}
          >
            Cancel
          </CtaButton>
        )}
        <CtaButton
          fullWidth
          size="large"
          variant="blue"
          hint="for resubmission"
          disabled={busy}
          onClick={handleSendToCreator}
        >
          {sendToCreatorLabel}
        </CtaButton>
      </Stack>
    );
  } else {
    actions = (
      <Stack gap={1.125}>
        <Stack direction="row" gap={1.125}>
          {sendToClientButton}
          {canSendToCreator && isVideo && (
            <CtaButton
              fullWidth
              size="large"
              variant="white"
              color={NEUTRAL_COLOR}
              hint="for resubmission"
              disabled={busy}
              onClick={handleSendToCreator}
            >
              {sendToCreatorLabel}
            </CtaButton>
          )}
          {canSendToCreator && !isVideo && (
            <CtaButton
              fullWidth
              size="large"
              variant="white"
              color={REQUEST_CHANGE_COLOR}
              hint="send back to creator"
              disabled={busy}
              onClick={openChangeRequest}
            >
              Request a change
            </CtaButton>
          )}
        </Stack>
        {approveButton}
      </Stack>
    );
  }

  return (
    <Stack gap={1.25}>
      {/* Typed, timestamped feedback is for videos; photos/raw footage use reasons only */}
      {isVideo && (
        <Stack direction="row" alignItems="center">
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Your feedback</Typography>
          <Typography sx={{ ml: 'auto', fontSize: 11.5, color: '#9A9AA2' }}>
            Enter to add · Shift+Enter for new line
          </Typography>
        </Stack>
      )}

      {isVideo && (
        <TextField
          multiline
          minRows={2}
          maxRows={6}
          size="small"
          value={draft}
          disabled={sending}
          onChange={(event) => {
            changeDraft(event.target.value);
            setFeedbackError(false);
          }}
          onKeyDown={handleKeyDown}
          error={showError}
          helperText={showError ? emptyFeedbackError : ''}
          placeholder={placeholder}
          InputProps={{
            startAdornment: <DraftTimestamp time={draftTime} onAdjust={adjustDraftTime} />,
            sx: { fontSize: 13, alignItems: 'flex-start' },
          }}
        />
      )}

      {showReasons && <ReasonChips kind="creator" />}

      {actions}

      <DecisionConfirmDialog
        open={Boolean(confirming)}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        loading={busy}
        onConfirm={
          dialogKind === 'creator' ? confirmSendToCreator : () => confirmDecision(dialogKind)
        }
        onClose={() => setConfirmingDecision(null)}
      />
    </Stack>
  );
}

ReviewComposer.propTypes = {
  submission: PropTypes.object.isRequired,
};

const CLIP_STATUS = {
  REVISION_REQUESTED: { label: 'Changes requested', color: '#B42318', bgcolor: '#FEE4E2' },
  REJECTED: { label: 'Changes requested', color: '#B42318', bgcolor: '#FEE4E2' },
  APPROVED: { label: 'Approved', color: '#067647', bgcolor: '#DCFAE6' },
};

// Raw footage clips as a list; the one on screen is highlighted, clicking jumps to it
function FilesReceived({ submission }) {
  const itemIndex = useCreatorSubmissionsStore((s) => s.itemIndex);
  const clips = (submission.rawFootages || []).filter((clip) => clip.url);
  if (!clips.length) return null;

  return (
    <Stack gap={1}>
      <Typography sx={sectionLabelSx}>Files received · {clips.length}</Typography>
      <Stack sx={{ border: '1px solid #EDEDF0', borderRadius: 1.25, overflow: 'hidden' }}>
        {clips.map((clip, index) => {
          const isCurrent = index === Math.min(itemIndex, clips.length - 1);
          const status = CLIP_STATUS[clip.status];
          return (
            <ButtonBase
              key={clip.id}
              onClick={() => setItemIndex(index)}
              sx={{
                gap: 1.25,
                px: 1.5,
                py: 1,
                justifyContent: 'flex-start',
                textAlign: 'left',
                bgcolor: isCurrent ? '#EDEBFF' : 'transparent',
                '&:not(:last-of-type)': { borderBottom: '1px solid #EDEDF0' },
                '&:hover': { bgcolor: isCurrent ? '#EDEBFF' : '#F7F7F9' },
              }}
            >
              <Iconify
                icon={isCurrent ? 'eva:play-circle-fill' : 'eva:film-outline'}
                width={18}
                sx={{ flexShrink: 0, color: isCurrent ? '#1304FF' : '#8A8A92' }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: isCurrent ? 600 : 500 }}>
                  Clip {index + 1}
                </Typography>
                {clip.createdAt && (
                  <Typography sx={{ fontSize: 11.5, color: '#8A8A92' }}>
                    Uploaded {dayjs(clip.createdAt).format('D MMM, h:mm A')}
                  </Typography>
                )}
              </Box>
              {status && (
                <Box
                  component="span"
                  sx={{
                    flexShrink: 0,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.75,
                    fontSize: 11,
                    fontWeight: 600,
                    color: status.color,
                    bgcolor: status.bgcolor,
                  }}
                >
                  {status.label}
                </Box>
              )}
            </ButtonBase>
          );
        })}
      </Stack>
    </Stack>
  );
}

FilesReceived.propTypes = {
  submission: PropTypes.object.isRequired,
};

// Swaps the panel body between the review thread and past feedback / caption edits
function HistoryToggle() {
  const historyOpen = useCreatorSubmissionsStore((s) => s.historyOpen);

  return (
    <Tooltip title={historyOpen ? 'Back to review' : 'Feedback & caption history'}>
      <IconButton
        size="small"
        onClick={toggleHistory}
        sx={{
          flexShrink: 0,
          border: '1px solid #E2E2E6',
          borderRadius: 0.875,
          color: historyOpen ? '#1304FF' : '#6E6E76',
          bgcolor: historyOpen ? '#EDEBFF' : 'transparent',
        }}
      >
        <Iconify icon={historyOpen ? 'eva:close-fill' : 'eva:clock-outline'} width={16} />
      </IconButton>
    </Tooltip>
  );
}

const pad = (value) => String(value).padStart(2, '0');

const formatCountdown = (totalSeconds) =>
  `${pad(Math.floor(totalSeconds / 3600))}:${pad(Math.floor((totalSeconds % 3600) / 60))}:${pad(
    totalSeconds % 60
  )}`;

// While the client's feedback round is open, how long they have left to add more
function ClientFeedbackTimer({ deadline }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsLeft = Math.max(0, Math.floor((new Date(deadline).getTime() - now) / 1000));
  if (!secondsLeft) return null;

  return (
    <Tooltip
      title="The client can still add feedback to this round until the timer runs out."
      placement="bottom-start"
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={0.75}
        sx={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 500, color: '#1340FF' }}
      >
        <Iconify icon="ic:sharp-timer" width={15} />
        Client feedback window ·
        <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {formatCountdown(secondsLeft)}
        </Box>
      </Stack>
    </Tooltip>
  );
}

ClientFeedbackTimer.propTypes = {
  deadline: PropTypes.string.isRequired,
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
  const { user } = useAuthContext();
  const { versionIndex } = useViewerNavigation();
  const historyOpen = useCreatorSubmissionsStore((s) => s.historyOpen);
  const isVideo = submission?.submissionType?.type === 'VIDEO';

  if (!submission) return <Box sx={{ flex: 1, bgcolor: 'background.paper' }} />;

  const statusColor = getStatusChip(submission.status).color;
  const submittedAt = getSubmittedAt(submission);
  // Awaiting link approval → the link moves to the footer as the action
  const isLinkReview = submission.status === 'APPROVE_LINK';
  // A link an admin added waits for a superadmin / CS lead; other admins just see it's pending
  const awaitingApprover = isAdminAddedLink(submission) && !canApproveAdminAddedLinks(user);
  const feedbackDeadline =
    submission.status === 'CLIENT_FEEDBACK' ? submission.video?.[0]?.feedbackDeadline : null;

  const feedbackSection = (
    <Stack gap={1.25}>
      <Typography sx={sectionLabelSx}>Review Thread</Typography>
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
          <HistoryToggle />
        </Stack>

        <StepBar status={submission.status} />
        {feedbackDeadline && <ClientFeedbackTimer deadline={feedbackDeadline} />}
        <VersionSwitcher />
      </Stack>

      {/* Body */}
      <Stack
        {...{ [REVIEW_SCROLL_ATTR]: '' }}
        gap={2.25}
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 2.75,
          py: `${PANEL_BODY_PAD_Y}px`,
          containerType: { md: 'size' },
        }}
      >
        {historyOpen ? (
          <FeedbackHistory submission={submission} />
        ) : (
          <>
            {submission.status === 'POSTED' && <PostedLinks submission={submission} />}

            {/* Videos only; key drops the caption section's state between submissions */}
            {isVideo && <CaptionSection key={submission.id} submission={submission} />}

            {submission.submissionType?.type === 'RAW_FOOTAGE' && (
              <FilesReceived submission={submission} />
            )}

            {/* Photos / raw footage are reviewed with reasons only, no comment thread */}
            {isVideo && feedbackSection}
          </>
        )}
      </Stack>

      {/* Footer */}
      <Box sx={{ px: 2.75, pt: 2, pb: 2.5, borderTop: '1px solid #EDEDF0' }}>
        {/* Feedback can only be given on the latest upload */}
        {versionIndex > 0 && (
          <OlderVersionNotice submission={submission} versionIndex={versionIndex} />
        )}
        {versionIndex === 0 && isLinkReview && awaitingApprover && (
          <AwaitingLinkApproval submission={submission} />
        )}
        {versionIndex === 0 && isLinkReview && !awaitingApprover && (
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
        {versionIndex === 0 && canAddPostingLink(submission) && (
          <PostingLinkForm key={submission.id} submission={submission} />
        )}
        {versionIndex === 0 && !needsAction(submission.status) && <NextUp />}
      </Box>
    </Stack>
  );
}
