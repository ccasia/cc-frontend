import { create } from 'zustand';

import {
  DEFAULT_STROKE,
  buildAnnotationPayload,
  DEFAULT_ANNOTATION_COLOR,
} from 'src/components/video-annotation';

// Single store for the creator submissions feature: the card list and the submission viewer.

export const PANEL_WIDTH = { min: 320, max: 720, default: 400 };
// Media pane always keeps at least this much room
const MIN_MEDIA_WIDTH = 480;
const PANEL_WIDTH_STORAGE_KEY = 'submission-viewer:panel-width';

const clampPanelWidth = (width) =>
  Math.round(
    Math.max(PANEL_WIDTH.min, Math.min(width, PANEL_WIDTH.max, window.innerWidth - MIN_MEDIA_WIDTH))
  );

const readSavedPanelWidth = () => {
  try {
    const saved = Number(localStorage.getItem(PANEL_WIDTH_STORAGE_KEY));
    return saved ? clampPanelWidth(saved) : PANEL_WIDTH.default;
  } catch (error) {
    return PANEL_WIDTH.default;
  }
};

const listState = {
  search: '',
  statusFilter: 'all',
  typeFilter: 'all',
  // Card's selected submission, keyed by creator (user) id
  selectedByCreator: {},
  expandedByCreator: {},
};

// Reset whenever the viewer moves to another submission or upload
const playbackState = {
  feedbackDraft: '',
  feedbackFrozenTime: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  muted: false,
  annotationMode: false,
  annotationShapes: [],
  annotationPast: [],
  annotationSelected: null,
  annotationFrameMs: null,
  viewedAnnotation: null,
};

const threadState = {
  commentComposer: null,
  expandedThreads: {},
  originalShown: {},
  showResolvedComments: false,
  incomingComments: null,
};

const reviewState = {
  pendingDecision: null,
  confirmingDecision: null,
  feedbackSending: false,
  feedbackError: false,
  feedbackReasons: null,
  changeRequestOpen: false,
  linkChangeOpen: false,
  linkChangeReasons: [],
  linkChangeError: false,
  postingLinkDrafts: [''],
  postingLinkErrors: [],
  postingLinkSubmitError: '',
};

const viewerState = {
  viewerOpen: false,
  viewerUserId: null,
  viewerSubmissionId: null,
  versionIndex: 0,
  itemIndex: 0,
  mediaSwitching: false,
  captionDraft: null,
  captionSaving: false,
  captionExpanded: false,
  captionOverflows: false,
  historyOpen: false,
  historyTab: 'feedback',
  pendingCommentDeletes: {},
  annotationTool: 'pen',
  annotationColor: DEFAULT_ANNOTATION_COLOR,
  annotationTextBg: null,
  annotationStroke: DEFAULT_STROKE,
  // Switch / close waiting on "Discard your drawing?": the action to run if confirmed
  pendingDrawingDiscard: null,
  ...threadState,
  ...reviewState,
  ...playbackState,
};

const initialState = {
  campaignId: null,
  // Client-attached campaigns route admin approval through client review
  campaignHasClient: false,
  ...listState,
  ...viewerState,
};

// panelWidth is a per-admin preference, so it survives resets
export const useCreatorSubmissionsStore = create(() => ({
  ...initialState,
  panelWidth: readSavedPanelWidth(),
}));

const { setState, getState } = useCreatorSubmissionsStore;

// ----------------------------------------------------------------------
// Page

export const setCampaign = ({ id, hasClient }) =>
  setState({ campaignId: id ?? null, campaignHasClient: Boolean(hasClient) });

export const resetCreatorSubmissions = () => setState({ ...initialState });

// ----------------------------------------------------------------------
// List (cards + toolbar)

export const setSearch = (search) => setState({ search });

export const setStatusFilter = (statusFilter) => setState({ statusFilter });

export const setTypeFilter = (typeFilter) => setState({ typeFilter });

export const selectSubmission = (creatorId, submissionId) =>
  setState((state) => ({
    selectedByCreator: { ...state.selectedByCreator, [creatorId]: submissionId },
  }));

export const setExpanded = (creatorId, expanded) =>
  setState((state) => ({
    expandedByCreator: { ...state.expandedByCreator, [creatorId]: expanded },
  }));

// ----------------------------------------------------------------------
// Viewer

// Switching media or closing the viewer resets the drawing, so with an unposted one
// these ask first ("Discard your drawing?") and only run once confirmed
const guardDrawing =
  (action) =>
  (...args) => {
    if (!isFrameLocked()) {
      action(...args);
      return;
    }
    setState({ pendingDrawingDiscard: () => action(...args) });
  };

export const confirmDrawingDiscard = () => {
  const action = getState().pendingDrawingDiscard;
  setState({ pendingDrawingDiscard: null });
  closeAnnotation();
  action?.();
};

export const cancelDrawingDiscard = () => setState({ pendingDrawingDiscard: null });

// Shows a submission in the viewer and keeps the card's selection in sync
// Switching freezes the current video, so it doesn't keep playing (or drive the
// scrubber) underneath while the next media loads and crossfades in.
const showSubmission = ({ userId, submissionId }) => {
  pauseVideo();
  setState((state) => ({
    viewerUserId: userId,
    viewerSubmissionId: submissionId,
    versionIndex: 0,
    itemIndex: 0,
    captionDraft: null,
    captionExpanded: false,
    captionOverflows: false,
    historyOpen: false,
    ...threadState,
    ...reviewState,
    ...playbackState,
    selectedByCreator: { ...state.selectedByCreator, [userId]: submissionId },
  }));
};

export const showViewerSubmission = guardDrawing(showSubmission);

// Opened from outside the viewer, so there's no drawing to guard
export const openSubmissionViewer = ({ userId, submissionId }) => {
  showSubmission({ userId, submissionId });
  setState({ viewerOpen: true });
};

export const closeSubmissionViewer = guardDrawing(() => setState({ viewerOpen: false }));

// Switching upload starts a fresh video, so playback state resets with it
export const setVersionIndex = guardDrawing((versionIndex) => {
  pauseVideo();
  setState({ versionIndex, ...threadState, ...reviewState, ...playbackState });
});

export const setItemIndex = guardDrawing((itemIndex) => {
  pauseVideo();
  setState((state) => ({ itemIndex, ...playbackState, feedbackDraft: state.feedbackDraft }));
});

export const setFeedbackDraft = (feedbackDraft) => setState({ feedbackDraft });

export const setFeedbackFrozenTime = (feedbackFrozenTime) => setState({ feedbackFrozenTime });

export const setPendingDecision = (pendingDecision) => setState({ pendingDecision });

export const setConfirmingDecision = (confirmingDecision) => setState({ confirmingDecision });

export const setFeedbackSending = (feedbackSending) => setState({ feedbackSending });

export const setFeedbackError = (feedbackError) => setState({ feedbackError });

export const setFeedbackReasons = (feedbackReasons) =>
  setState({ feedbackReasons, feedbackError: false });

export const setPostingLinkDraft = (index, value) =>
  setState((state) => {
    const postingLinkDrafts = [...state.postingLinkDrafts];
    postingLinkDrafts[index] = value;
    const postingLinkErrors = [...state.postingLinkErrors];
    postingLinkErrors[index] = null;
    return { postingLinkDrafts, postingLinkErrors, postingLinkSubmitError: '' };
  });

export const setPostingLinkFields = (postingLinkDrafts, postingLinkErrors) =>
  setState({ postingLinkDrafts, postingLinkErrors, postingLinkSubmitError: '' });

export const setPostingLinkError = (index, error) =>
  setState((state) => {
    const postingLinkErrors = [...state.postingLinkErrors];
    postingLinkErrors[index] = error;
    return { postingLinkErrors };
  });

export const setPostingLinkSubmitError = (postingLinkSubmitError) =>
  setState({ postingLinkSubmitError });

export const resetPostingLinkForm = () =>
  setState({ postingLinkDrafts: [''], postingLinkErrors: [], postingLinkSubmitError: '' });

export const openChangeRequest = () => setState({ changeRequestOpen: true });

export const closeChangeRequest = () =>
  setState({ changeRequestOpen: false, feedbackReasons: null, feedbackError: false });

export const openLinkChange = () => setState({ linkChangeOpen: true });

export const closeLinkChange = () =>
  setState({ linkChangeOpen: false, linkChangeReasons: [], linkChangeError: false });

export const setLinkChangeReasons = (linkChangeReasons) =>
  setState({ linkChangeReasons, linkChangeError: false });

export const setLinkChangeError = (linkChangeError) => setState({ linkChangeError });

export const openCommentComposer = (mode, commentId, text = '') =>
  setState({ commentComposer: { mode, commentId, text, saving: false } });

export const closeCommentComposer = () => setState({ commentComposer: null });

const updateCommentComposer = (changes) =>
  setState((state) =>
    state.commentComposer ? { commentComposer: { ...state.commentComposer, ...changes } } : {}
  );

export const setCommentComposerText = (text) => updateCommentComposer({ text });

export const setCommentComposerSaving = (saving) => updateCommentComposer({ saving });

export const toggleOriginalShown = (commentId) =>
  setState((state) => ({
    originalShown: { ...state.originalShown, [commentId]: !state.originalShown[commentId] },
  }));

export const toggleShowResolvedComments = () =>
  setState((state) => ({ showResolvedComments: !state.showResolvedComments }));

export const addIncomingComment = ({ targetId, above }) =>
  setState((state) => ({
    incomingComments: { count: (state.incomingComments?.count ?? 0) + 1, targetId, above },
  }));

export const clearIncomingComments = () => setState({ incomingComments: null });

export const expandThread = (commentId) =>
  setState((state) => ({ expandedThreads: { ...state.expandedThreads, [commentId]: true } }));

export const toggleThreadExpanded = (commentId) =>
  setState((state) => ({
    expandedThreads: { ...state.expandedThreads, [commentId]: !state.expandedThreads[commentId] },
  }));

export const setCommentDeletePending = (commentId, pending) =>
  setState((state) => {
    const pendingCommentDeletes = { ...state.pendingCommentDeletes };
    if (pending) pendingCommentDeletes[commentId] = Date.now();
    else delete pendingCommentDeletes[commentId];
    return { pendingCommentDeletes };
  });

export const setCaptionDraft = (captionDraft) => setState({ captionDraft });

export const setCaptionSaving = (captionSaving) => setState({ captionSaving });

export const toggleHistory = () => setState((state) => ({ historyOpen: !state.historyOpen }));

export const setHistoryTab = (historyTab) => setState({ historyTab });

export const toggleCaptionExpanded = () =>
  setState((state) => ({ captionExpanded: !state.captionExpanded }));

export const setCaptionOverflows = (captionOverflows) => setState({ captionOverflows });

export const setCurrentTime = (currentTime) => setState({ currentTime });

export const setIsPlaying = (isPlaying) =>
  setState(isPlaying ? { isPlaying, viewedAnnotation: null } : { isPlaying });

export const setMuted = (muted) => setState({ muted });

export const setDuration = (duration) =>
  setState({ duration: Number.isFinite(duration) ? duration : 0 });

// ----------------------------------------------------------------------
// Viewer review panel width

export const setPanelWidth = (width) => setState({ panelWidth: clampPanelWidth(width) });

export const savePanelWidth = () => {
  try {
    localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(getState().panelWidth));
  } catch (error) {
    // Storage unavailable (private mode etc.) — width just won't persist
  }
};

export const resetPanelWidth = () => {
  setState({ panelWidth: PANEL_WIDTH.default });
  savePanelWidth();
};

// ----------------------------------------------------------------------
// Viewer video controls — the <video> registers itself so any component can seek/pause/play
// without prop drilling. A DOM node isn't state, so it lives outside the store.

let videoElement = null;

export const registerVideoElement = (element) => {
  videoElement = element;
};

const VIEWED_ANNOTATION_TOLERANCE_MS = 300;

const isFrameLocked = () => {
  const { annotationMode, annotationShapes, annotationPast } = getState();
  return annotationMode && (annotationShapes.length > 0 || annotationPast.length > 0);
};

export const seekVideo = (seconds) => {
  if (!videoElement || isFrameLocked()) return;
  videoElement.currentTime = seconds;

  const { annotationMode, viewedAnnotation } = getState();
  const leavesViewedFrame =
    viewedAnnotation &&
    Math.abs(seconds * 1000 - viewedAnnotation.frameTimeMs) > VIEWED_ANNOTATION_TOLERANCE_MS;

  setState({
    currentTime: seconds,
    ...(annotationMode && { annotationFrameMs: Math.round(seconds * 1000) }),
    ...(leavesViewedFrame && { viewedAnnotation: null }),
  });
};

export const pauseVideo = () => videoElement?.pause();

export const setMediaSwitching = (mediaSwitching) => setState({ mediaSwitching });

export const playVideo = () => {
  const { mediaSwitching, annotationMode } = getState();
  if (mediaSwitching || annotationMode) return;
  videoElement?.play()?.catch(() => {});
};

export const togglePlay = () => {
  if (!videoElement) return;
  if (videoElement.paused) playVideo();
  else pauseVideo();
};

export const toggleMute = () => {
  if (!videoElement) return;
  videoElement.muted = !videoElement.muted;
};

// Feedback playback starts this many seconds early, to give context
export const FEEDBACK_LEAD_IN = 3;

// ----------------------------------------------------------------------
// Viewer annotations — admins draw on the paused frame; the drawing is attached to the
// next feedback comment they post (see use-comment-composer)

// Pauses and opens the drawing tools on the current frame. The feedback's timestamp locks
// to that frame, as it does when typing.
export const startAnnotation = () => {
  if (!videoElement || getState().mediaSwitching) return;
  pauseVideo();
  const seconds = videoElement.currentTime;
  setState({
    annotationMode: true,
    annotationShapes: [],
    annotationPast: [],
    annotationSelected: null,
    annotationFrameMs: Math.round(seconds * 1000),
    viewedAnnotation: null,
    feedbackFrozenTime: seconds,
    currentTime: seconds,
  });
};

// Leaves drawing mode, dropping the drawing. With nothing typed either, the feedback's
// timestamp follows the video again.
export const closeAnnotation = () =>
  setState((state) => ({
    annotationMode: false,
    annotationShapes: [],
    annotationPast: [],
    annotationSelected: null,
    annotationFrameMs: null,
    feedbackFrozenTime: state.feedbackDraft ? state.feedbackFrozenTime : null,
  }));

// Every change to the drawing goes through here, so undo can step back through it
const changeShapes = (update, changes = {}) =>
  setState((state) => ({
    annotationPast: [...state.annotationPast, state.annotationShapes],
    annotationShapes: update(state.annotationShapes),
    ...changes,
  }));

const replaceShape = (index, shape) =>
  changeShapes((shapes) => shapes.map((item, i) => (i === index ? shape : item)));

export const addAnnotationShape = (shape) => changeShapes((shapes) => [...shapes, shape]);

// Moved, resized or re-typed on the canvas
export const updateAnnotationShape = (index, shape) => replaceShape(index, shape);

export const deleteAnnotationShape = (index) => {
  if (index == null || !getState().annotationShapes[index]) return;
  changeShapes((shapes) => shapes.filter((_, i) => i !== index), { annotationSelected: null });
};

export const deleteSelectedAnnotationShape = () =>
  deleteAnnotationShape(getState().annotationSelected);

// Steps back one change (draw, move, restyle, delete or clear)
export const undoAnnotation = () =>
  setState((state) => {
    if (!state.annotationPast.length) return {};
    return {
      annotationShapes: state.annotationPast[state.annotationPast.length - 1],
      annotationPast: state.annotationPast.slice(0, -1),
      annotationSelected: null,
    };
  });

export const clearAnnotationShapes = () => {
  if (!getState().annotationShapes.length) return;
  changeShapes(() => [], { annotationSelected: null });
};

// The toolbar's swatches switch to the picked shape's colours, so they show what it has
export const selectAnnotationShape = (annotationSelected) => {
  const shape = getState().annotationShapes[annotationSelected];
  setState({
    annotationSelected,
    ...(shape?.color && { annotationColor: shape.color }),
    ...(shape?.type === 'text' && { annotationTextBg: shape.bg ?? null }),
    ...(shape && shape.type !== 'text' && { annotationStroke: shape.stroke ?? DEFAULT_STROKE }),
  });
};

// Selection belongs to the move tool
export const setAnnotationTool = (annotationTool) =>
  setState({ annotationTool, annotationSelected: null });

// Also recolours the selected shape (the text itself, for text)
export const setAnnotationColor = (annotationColor) => {
  const { annotationSelected, annotationShapes } = getState();
  setState({ annotationColor });
  const shape = annotationShapes[annotationSelected];
  if (shape && shape.color !== annotationColor) {
    replaceShape(annotationSelected, { ...shape, color: annotationColor });
  }
};

// Also changes the selected text's background
export const setAnnotationTextBg = (annotationTextBg) => {
  const { annotationSelected, annotationShapes } = getState();
  setState({ annotationTextBg });
  const shape = annotationShapes[annotationSelected];
  if (shape?.type !== 'text' || (shape.bg ?? null) === annotationTextBg) return;
  const next = { ...shape, bg: annotationTextBg };
  if (!annotationTextBg) delete next.bg;
  replaceShape(annotationSelected, next);
};

// Also changes the selected line / box's thickness (text has none)
export const setAnnotationStroke = (annotationStroke) => {
  const { annotationSelected, annotationShapes } = getState();
  setState({ annotationStroke });
  const shape = annotationShapes[annotationSelected];
  if (!shape || shape.type === 'text' || shape.stroke === annotationStroke) return;
  replaceShape(annotationSelected, { ...shape, stroke: annotationStroke });
};

// The drawing to post with the feedback, or null when there's nothing drawn
export const getAnnotationPayload = () => {
  const { annotationMode, annotationShapes, annotationFrameMs } = getState();
  if (!annotationMode || !annotationShapes.length || annotationFrameMs == null) return null;
  const aspect = videoElement?.videoHeight
    ? videoElement.videoWidth / videoElement.videoHeight
    : null;
  return buildAnnotationPayload(annotationShapes, annotationFrameMs, aspect);
};

// Jumping elsewhere while drawing: an empty drawing just closes; a drawn one keeps the
// frame (returns false) so it isn't lost
const leaveAnnotation = () => {
  if (!getState().annotationMode) return true;
  if (isFrameLocked()) return false;
  closeAnnotation();
  return true;
};

// Shows a posted comment's drawing, paused on the exact frame it was drawn on
export const showAnnotation = (annotation) => {
  if (!videoElement || !Number.isInteger(annotation?.frameTimeMs)) return;
  if (!leaveAnnotation()) return;
  pauseVideo();
  const seconds = annotation.frameTimeMs / 1000;
  videoElement.currentTime = seconds;
  setState({ currentTime: seconds, viewedAnnotation: annotation });
};

// Used by the scrubber dots and the thread's timestamps
export const playFromFeedback = (seconds) => {
  if (!leaveAnnotation()) return;
  seekVideo(Math.max(0, seconds - FEEDBACK_LEAD_IN));
  playVideo();
};
