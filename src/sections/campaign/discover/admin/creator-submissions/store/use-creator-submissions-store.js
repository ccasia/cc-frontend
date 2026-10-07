import { create } from 'zustand';

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
  // Playback position + length (seconds), for timestamped comments
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  muted: false,
};

const viewerState = {
  viewerOpen: false,
  viewerUserId: null,
  viewerSubmissionId: null,
  // Which upload of a video submission is shown; 0 = latest
  versionIndex: 0,
  // Which photo of a photo set is shown
  photoIndex: 0,
  // Unsaved caption edit (null = untouched); kept across upload switches, cleared per submission
  captionDraft: null,
  captionSaving: false,
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

// Shows a submission in the viewer and keeps the card's selection in sync
// Switching freezes the current video, so it doesn't keep playing (or drive the
// scrubber) underneath while the next media loads and crossfades in.
export const showViewerSubmission = ({ userId, submissionId }) => {
  pauseVideo();
  setState((state) => ({
    viewerUserId: userId,
    viewerSubmissionId: submissionId,
    versionIndex: 0,
    photoIndex: 0,
    captionDraft: null,
    ...playbackState,
    selectedByCreator: { ...state.selectedByCreator, [userId]: submissionId },
  }));
};

export const openSubmissionViewer = ({ userId, submissionId }) => {
  showViewerSubmission({ userId, submissionId });
  setState({ viewerOpen: true });
};

export const closeSubmissionViewer = () => setState({ viewerOpen: false });

// Switching upload starts a fresh video, so playback state resets with it
export const setVersionIndex = (versionIndex) => {
  pauseVideo();
  setState({ versionIndex, ...playbackState });
};

export const setPhotoIndex = (photoIndex) => setState({ photoIndex });

export const setFeedbackDraft = (feedbackDraft) => setState({ feedbackDraft });

export const setCaptionDraft = (captionDraft) => setState({ captionDraft });

export const setCaptionSaving = (captionSaving) => setState({ captionSaving });

export const setCurrentTime = (currentTime) => setState({ currentTime });

export const setIsPlaying = (isPlaying) => setState({ isPlaying });

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

export const seekVideo = (seconds) => {
  if (!videoElement) return;
  videoElement.currentTime = seconds;
  setCurrentTime(seconds);
};

export const pauseVideo = () => videoElement?.pause();

export const playVideo = () => videoElement?.play()?.catch(() => {});

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

// Used by the scrubber dots and the thread's timestamps
export const playFromFeedback = (seconds) => {
  seekVideo(Math.max(0, seconds - FEEDBACK_LEAD_IN));
  playVideo();
};
