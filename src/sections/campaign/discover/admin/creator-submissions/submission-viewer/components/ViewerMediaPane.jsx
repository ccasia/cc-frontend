import PropTypes from 'prop-types';
import { m, LayoutGroup } from 'framer-motion';
import { useId, useRef, useState, useEffect } from 'react';

import { keyframes } from '@mui/material/styles';
import { Box, Stack, Tooltip, IconButton, Typography, CircularProgress } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import Iconify from 'src/components/iconify';

import useViewerData from '../hooks/use-viewer-data';
import useReleaseMedia from '../hooks/use-release-media';
import useSettledValue from '../hooks/use-settled-value';
import useSwipeNavigation from '../hooks/use-swipe-navigation';
import { getStatusChip, getSubmissionLabel } from '../../utils';
import useViewerNavigation from '../hooks/use-viewer-navigation';
import usePreloadNeighbours from '../hooks/use-preload-neighbours';
import VideoControls, { OVERLAY_Z, VIDEO_FRAME_ATTR } from './VideoControls';
import { cacheRatio, cacheDuration, DEFAULT_RATIO, getCachedRatio } from '../media-cache';
import {
  getItemNoun,
  getShownUrl,
  getItemCount,
  getVersionCount,
  getSubmissionMedia,
} from '../utils';
import {
  setMuted,
  togglePlay,
  setDuration,
  setIsPlaying,
  setCurrentTime,
  setMediaSwitching,
  registerVideoElement,
  closeSubmissionViewer,
  useCreatorSubmissionsStore,
} from '../../store/use-creator-submissions-store';

const darkButtonSx = {
  width: 36,
  height: 36,
  borderRadius: 1.125,
  border: '1px solid #2E2E34',
  bgcolor: '#1B1B1F',
  color: 'common.white',
  '&:hover': { bgcolor: '#26262B' },
  '&.Mui-disabled': { color: '#4A4A52' },
};

const NAV_BUTTON_SIZE = 40;
// Space on both sides of the up/down buttons
const NAV_GAP = 32;
// Reserved on each side of the media so it stays centred and stops NAV_GAP before the buttons
const STAGE_SIDE = NAV_GAP * 2 + NAV_BUTTON_SIZE;

const roundButtonSx = {
  ...darkButtonSx,
  width: NAV_BUTTON_SIZE,
  height: NAV_BUTTON_SIZE,
  borderRadius: '50%',
};

// ← → steps through photos / raw footage clips, otherwise through video versions; hidden
// when there's only one of either
const getArrowLabel = (submission) => {
  if (getItemCount(submission) > 1) return getItemNoun(submission);
  if (getVersionCount(submission) > 1) return 'versions';
  return null;
};

const getShortcuts = (submission) => {
  const arrowLabel = getArrowLabel(submission);
  return [['↑↓', 'creator'], ...(arrowLabel ? [['←→', arrowLabel]] : []), ['esc', 'close']];
};

const FADE_MS = 160;
const MAX_KEPT_LAYERS = 2;
const SETTLE_MS = 150;
const LOADING_DELAY_MS = 250;

const loadingFadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
const READY_FALLBACK_MS = 800;
const READY_TIMEOUT_MS = 4000;
const READY_POLL_MS = 250;
const HAVE_CURRENT_DATA = 2;

// Largest box with the media's shape that fits the stage (a `size` container).
// Width and height are explicit lengths so a shape change can ease instead of snap.
const getFrameSizeSx = (ratio) => ({
  width: `min(100cqw, 100cqh * ${ratio})`,
  height: `min(100cqh, 100cqw / ${ratio})`,
});

const layerSx = {
  position: 'absolute',
  inset: 0,
  display: 'block',
  width: 1,
  height: 1,
  objectFit: 'contain',
};

// Brings `url` to the front: reuses a loaded layer if one is kept (instant, no reload),
// otherwise adds a hidden layer that fades in once loaded. Half-loaded layers it replaces
// are dropped. Stacking is by `z` (not array order) so <video> elements never move in the
// DOM. Pure, so it can run during render; ids/z come from counters in state so a reused id
// can never pick up a stale load event.
const queueLayer = (stage, url, kind, keepable) => {
  if (!url) return { ...stage, trackedUrl: url, layers: [] };

  const ready = stage.layers.filter((layer) => layer.ready);
  const z = stage.nextZ;
  const next = { ...stage, trackedUrl: url, nextZ: z + 1 };

  if (ready.some((layer) => layer.url === url)) {
    return {
      ...next,
      layers: ready.map((layer) => (layer.url === url ? { ...layer, z, hidden: false } : layer)),
    };
  }

  const layer = {
    id: stage.nextId,
    url,
    kind,
    ratio: getCachedRatio(url) ?? DEFAULT_RATIO,
    ready: false,
    hidden: false,
    // Whether it may stay mounted in the pool after it's no longer shown
    keepable,
    z,
  };
  return { ...next, nextId: stage.nextId + 1, layers: [...ready, layer] };
};

// The visible layer: the front-most one that has loaded
const getActiveLayer = (layers) =>
  layers.reduce((top, layer) => (layer.ready && (!top || layer.z > top.z) ? layer : top), null);

// After a fade: hide everything but the active layer and keep only the most recent few
const settleLayers = (layers, activeId) => {
  const kept = layers
    .filter((layer) => layer.ready && layer.keepable && layer.id !== activeId)
    .sort((a, b) => b.z - a.z)
    .slice(0, MAX_KEPT_LAYERS)
    .map((layer) => layer.id);

  return layers
    .filter((layer) => layer.id === activeId || !layer.ready || kept.includes(layer.id))
    .map((layer) => (layer.id === activeId || !layer.ready ? layer : { ...layer, hidden: true }));
};

const validRatio = (ratio) => (Number.isFinite(ratio) && ratio > 0 ? ratio : undefined);

// Wrapper absorbs clicks so a disabled arrow doesn't toggle play on the video behind it
const versionArrowSlotSx = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: OVERLAY_Z,
  cursor: 'default',
};

const versionArrowSx = {
  width: 36,
  height: 36,
  color: 'common.white',
  bgcolor: 'rgba(17, 17, 19, 0.55)',
  backdropFilter: 'blur(6px)',
  '&:hover': { bgcolor: 'rgba(17, 17, 19, 0.75)' },
  '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)', bgcolor: 'rgba(17, 17, 19, 0.35)' },
};

const overlayTagSx = {
  position: 'absolute',
  left: 12,
  zIndex: OVERLAY_Z,
  px: 1,
  py: 0.375,
  borderRadius: 0.75,
  fontSize: 11.5,
  fontWeight: 500,
  color: 'common.white',
  bgcolor: 'rgba(17, 17, 19, 0.55)',
  backdropFilter: 'blur(6px)',
};

// Keep clicks (even on a disabled arrow) from reaching the frame (play / next photo)
const stopPropagation = (event) => event.stopPropagation();

// Prev/next arrows on the media's edges + a position tag. Disabled (not hidden) at the ends.
function EdgeArrows({ tag, tagTop = 12, noun, onPrev, onNext, hasPrev, hasNext }) {
  return (
    <>
      <Typography sx={{ ...overlayTagSx, top: tagTop }}>{tag}</Typography>

      <Box onClick={stopPropagation} sx={{ ...versionArrowSlotSx, left: 12 }}>
        <IconButton
          aria-label={`Previous ${noun}`}
          disabled={!hasPrev}
          onClick={onPrev}
          sx={versionArrowSx}
        >
          <Iconify icon="eva:arrow-ios-back-fill" width={18} />
        </IconButton>
      </Box>
      <Box onClick={stopPropagation} sx={{ ...versionArrowSlotSx, right: 12 }}>
        <IconButton
          aria-label={`Next ${noun}`}
          disabled={!hasNext}
          onClick={onNext}
          sx={versionArrowSx}
        >
          <Iconify icon="eva:arrow-ios-forward-fill" width={18} />
        </IconButton>
      </Box>
    </>
  );
}

EdgeArrows.propTypes = {
  tag: PropTypes.node,
  tagTop: PropTypes.number,
  noun: PropTypes.string.isRequired,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  hasPrev: PropTypes.bool,
  hasNext: PropTypes.bool,
};

// Older/newer upload arrows + "Upload 2 of 3" tag, only when the video was resubmitted
function VersionArrows() {
  const {
    olderVersion,
    newerVersion,
    versionIndex,
    versionCount,
    hasOlderVersion,
    hasNewerVersion,
  } = useViewerNavigation();

  if (versionCount < 2) return null;

  return (
    <EdgeArrows
      noun="upload"
      tag={`Upload ${versionCount - versionIndex} of ${versionCount}${
        versionIndex === 0 ? ' · Latest' : ''
      }`}
      onPrev={olderVersion}
      onNext={newerVersion}
      hasPrev={hasOlderVersion}
      hasNext={hasNewerVersion}
    />
  );
}

// Story-style progress bars + arrows + "3 / 9" for photo sets and raw footage clips
function ItemPager({ noun }) {
  const { itemIndex, itemCount, prevItem, nextItem, hasPrevItem, hasNextItem } =
    useViewerNavigation();

  if (itemCount < 2) return null;

  return (
    <>
      <Stack
        direction="row"
        gap={0.5}
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          zIndex: OVERLAY_Z,
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: itemCount }, (_, index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              height: 3,
              borderRadius: 99,
              bgcolor: index === itemIndex ? 'common.white' : 'rgba(255, 255, 255, 0.35)',
              transition: 'background-color 150ms ease',
            }}
          />
        ))}
      </Stack>

      <EdgeArrows
        noun={noun}
        tag={`${itemIndex + 1} / ${itemCount}`}
        tagTop={24}
        onPrev={prevItem}
        onNext={nextItem}
        hasPrev={hasPrevItem}
        hasNext={hasNextItem}
      />
    </>
  );
}

ItemPager.propTypes = {
  noun: PropTypes.string,
};

// One video layer of the stage. Aborts its download when removed, and registers itself
// for the store's video controls only while it's the visible layer.
function VideoLayer({ layer, isActive, isMobile, onReady, sx }) {
  const videoRef = useRef(null);
  useReleaseMedia(videoRef);

  // Latest callback for the timers below, without restarting them every render
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  // Safety nets while hidden: catch an element that loaded before (or without) its event
  // firing — e.g. served from the media cache — and promote it anyway after a timeout so a
  // stalled load can't leave the old video on screen. A late loadedmetadata still fills in
  // the real shape/duration afterwards.
  useEffect(() => {
    if (layer.ready) return undefined;
    const video = videoRef.current;

    const poll = setInterval(() => {
      if (video?.readyState >= HAVE_CURRENT_DATA) {
        onReadyRef.current(video.videoWidth / video.videoHeight, video.duration);
      }
    }, READY_POLL_MS);
    const timeout = setTimeout(() => onReadyRef.current(), READY_TIMEOUT_MS);

    return () => {
      clearInterval(poll);
      clearTimeout(timeout);
    };
  }, [layer.ready]);

  // The visible layer drives the store's playback state. A kept video coming back to the
  // front reports where it was left, so it resumes instead of starting over.
  useEffect(() => {
    if (!isActive) return undefined;
    const video = videoRef.current;
    registerVideoElement(video);

    if (video) {
      setCurrentTime(video.currentTime);
      setDuration(video.duration);
      setMuted(video.muted);
    }
    return () => registerVideoElement(null);
  }, [isActive]);

  return (
    <Box
      ref={videoRef}
      component="video"
      src={layer.url}
      preload="auto"
      playsInline
      controls={isActive && isMobile}
      onLoadedData={(e) =>
        onReady(e.currentTarget.videoWidth / e.currentTarget.videoHeight, e.currentTarget.duration)
      }
      onLoadedMetadata={(e) => {
        const video = e.currentTarget;
        setTimeout(
          () => onReady(video.videoWidth / video.videoHeight, video.duration),
          READY_FALLBACK_MS
        );
      }}
      onError={() => onReady()}
      {...(isActive && {
        onPlay: () => setIsPlaying(true),
        onPause: () => setIsPlaying(false),
        onVolumeChange: (e) => setMuted(e.currentTarget.muted),
        onTimeUpdate: (e) => setCurrentTime(e.currentTarget.currentTime),
        onDurationChange: (e) => setDuration(e.currentTarget.duration),
      })}
      sx={sx}
    />
  );
}

VideoLayer.propTypes = {
  layer: PropTypes.object.isRequired,
  isActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  onReady: PropTypes.func.isRequired,
  sx: PropTypes.object,
};

/**
 * Media stage that never flashes empty between switches: the incoming media loads invisibly
 * on top of the current (paused) one and fades in once it has a frame, while the frame eases
 * from the old shape to the new one. Only the visible layer drives playback and the toolbar.
 */
function ViewerMedia({ submission }) {
  const versionIndex = useCreatorSubmissionsStore((s) => s.versionIndex);
  const itemIndex = useCreatorSubmissionsStore((s) => s.itemIndex);
  const { kind } = getSubmissionMedia(submission, versionIndex);
  const url = getShownUrl(submission, versionIndex, itemIndex);
  const isItemSet = getItemCount(submission) > 1;
  // Clicking a photo flips to the next one; clicking a clip plays/pauses like any video
  const isPhotoSet = isItemSet && kind === 'photo';
  const { advanceItem } = useViewerNavigation();
  const isMobile = useResponsive('down', 'md');
  const keepable = !isMobile && submission.submissionType?.type !== 'RAW_FOOTAGE';

  // Only start loading once switching has paused, so a fast swipe through several
  // creators loads just the one you land on. Settled as a primitive "kind|url" key.
  const settledKey = useSettledValue(url ? `${kind}|${url}` : '', SETTLE_MS);
  const separator = settledKey.indexOf('|');
  const settledKind = settledKey.slice(0, separator);
  const settledUrl = settledKey.slice(separator + 1) || undefined;

  const [stage, setStage] = useState(() =>
    queueLayer({ trackedUrl: undefined, nextId: 1, nextZ: 1, layers: [] }, url, kind, keepable)
  );

  const isKept = stage.layers.some((layer) => layer.ready && layer.url === url);
  const shouldQueue =
    stage.trackedUrl !== url && (!url || isKept || (settledUrl === url && settledKind === kind));
  if (shouldQueue) setStage(queueLayer(stage, url, kind, keepable));

  const { layers } = stage;
  // Latest layers for async callbacks (load events, timers) that outlive a render
  const layersRef = useRef(layers);
  layersRef.current = layers;

  const activeLayer = getActiveLayer(layers);

  const mediaSwitching = Boolean(url) && activeLayer?.url !== url;
  useEffect(() => {
    setMediaSwitching(mediaSwitching);
  }, [mediaSwitching]);
  useEffect(() => () => setMediaSwitching(false), []);

  const activeId = activeLayer?.id;
  useEffect(() => {
    if (activeId === undefined) return undefined;
    const timer = setTimeout(
      () => setStage((prev) => ({ ...prev, layers: settleLayers(prev.layers, activeId) })),
      FADE_MS
    );
    return () => clearTimeout(timer);
  }, [activeId]);

  const updateLayers = (update) => setStage((prev) => ({ ...prev, layers: update(prev.layers) }));

  const markReady = (id, layerUrl, ratio, duration) => {
    if (!layersRef.current.some((layer) => layer.id === id)) return;
    cacheRatio(layerUrl, ratio);
    cacheDuration(layerUrl, duration);
    updateLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, ready: true, ratio: validRatio(ratio) ?? layer.ratio } : layer
      )
    );
  };

  if (!url) {
    return (
      <Typography sx={{ fontSize: 12, color: '#7A7A84', fontFamily: 'monospace' }}>
        No media uploaded yet
      </Typography>
    );
  }

  const frontLayer = layers.reduce((top, layer) => (!top || layer.z > top.z ? layer : top), null);
  const frameRatio = activeLayer?.ratio ?? frontLayer?.ratio ?? DEFAULT_RATIO;
  const isVideo = (activeLayer ?? frontLayer)?.kind === 'video';
  const rankOf = (layer) => layers.filter((other) => other.z < layer.z).length;
  const isSwitching = activeLayer?.url !== url;

  return (
    <Box
      {...{ [VIDEO_FRAME_ATTR]: '' }}
      onClick={
        (isPhotoSet && advanceItem) ||
        (isVideo && !isMobile && !isSwitching && togglePlay) ||
        undefined
      }
      sx={{
        position: 'relative',
        ...getFrameSizeSx(frameRatio),
        borderRadius: 1.75,
        overflow: 'hidden',
        bgcolor: '#26262B',
        cursor: isPhotoSet || (isVideo && !isMobile) ? 'pointer' : 'default',
        transition: 'width 200ms ease, height 200ms ease',
        '&:fullscreen': { width: 1, height: 1, borderRadius: 0, bgcolor: 'common.black' },
      }}
    >
      {layers.map((layer) => {
        const isActive = layer.id === activeLayer?.id;
        const fadeSx = {
          ...layerSx,
          zIndex: rankOf(layer),
          opacity: layer.ready && !layer.hidden ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease`,
        };

        if (layer.kind === 'photo') {
          return (
            <Box
              key={layer.id}
              component="img"
              src={layer.url}
              alt=""
              onLoad={(e) =>
                markReady(
                  layer.id,
                  layer.url,
                  e.currentTarget.naturalWidth / e.currentTarget.naturalHeight
                )
              }
              onError={() => markReady(layer.id, layer.url)}
              sx={fadeSx}
            />
          );
        }

        return (
          <VideoLayer
            key={layer.id}
            layer={layer}
            isActive={isActive}
            isMobile={isMobile}
            onReady={(ratio, duration) => markReady(layer.id, layer.url, ratio, duration)}
            sx={fadeSx}
          />
        );
      })}

      {/* Dims the old frame + spinner, only if the switch takes longer than LOADING_DELAY_MS */}
      {isSwitching && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: OVERLAY_Z,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(17, 17, 19, 0.45)',
            pointerEvents: 'none',
            animation: `${loadingFadeIn} 150ms ease ${LOADING_DELAY_MS}ms both`,
          }}
        >
          <CircularProgress size={28} sx={{ color: 'common.white' }} />
        </Box>
      )}

      {isVideo && <VersionArrows />}
      {isItemSet && <ItemPager noun={getItemNoun(submission)} />}
      {isVideo && !isMobile && activeLayer && <VideoControls submission={submission} />}
    </Box>
  );
}

ViewerMedia.propTypes = {
  submission: PropTypes.object.isRequired,
};

const thumbnailSx = {
  display: 'block',
  flexShrink: 0,
  width: 34,
  height: 46,
  borderRadius: 0.75,
  bgcolor: '#2A2A30',
  objectFit: 'cover',
};

// Latest upload of a submission, for the strip. There are no stored thumbnails,
// so videos render their own first frame (#t=0.1 nudges Safari to paint one).
function StripThumbnail({ submission }) {
  const { kind, urls } = getSubmissionMedia(submission);
  const url = urls[0];
  const videoRef = useRef(null);
  useReleaseMedia(videoRef);

  if (!url) return <Box sx={thumbnailSx} />;

  if (kind === 'photo') {
    return <Box component="img" src={url} alt="" loading="lazy" sx={thumbnailSx} />;
  }

  return (
    <Box
      ref={videoRef}
      component="video"
      src={`${url}#t=0.1`}
      preload="metadata"
      muted
      playsInline
      sx={{ ...thumbnailSx, pointerEvents: 'none' }}
    />
  );
}

StripThumbnail.propTypes = {
  submission: PropTypes.object.isRequired,
};

// Up/down creator buttons — beside the media on desktop, in the top bar on mobile
function CreatorNavButtons({ direction = 'column', sx }) {
  const { prevCreator, nextCreator, hasPrevCreator, hasNextCreator } = useViewerNavigation();

  return (
    <Stack direction={direction} gap={1.25} sx={sx}>
      <IconButton disabled={!hasPrevCreator} onClick={prevCreator} sx={roundButtonSx}>
        <Iconify icon="eva:arrow-upward-fill" width={16} />
      </IconButton>
      <IconButton disabled={!hasNextCreator} onClick={nextCreator} sx={roundButtonSx}>
        <Iconify icon="eva:arrow-downward-fill" width={16} />
      </IconButton>
    </Stack>
  );
}

CreatorNavButtons.propTypes = {
  direction: PropTypes.string,
  sx: PropTypes.object,
};

const COPIED_MS = 1500;

// Copies the URL of what's on screen: this upload, photo or clip
function CopyMediaLink() {
  const { submission } = useViewerData();
  const versionIndex = useCreatorSubmissionsStore((s) => s.versionIndex);
  const itemIndex = useCreatorSubmissionsStore((s) => s.itemIndex);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const url = submission && getShownUrl(submission, versionIndex, itemIndex);
  if (!url) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch (error) {
      // Clipboard blocked; nothing to confirm
    }
  };

  return (
    <Tooltip title={copied ? 'Copied' : 'Copy media link'}>
      <IconButton onClick={handleCopy} sx={{ ...darkButtonSx, flexShrink: 0 }}>
        <Iconify
          icon={copied ? 'eva:checkmark-fill' : 'eva:link-2-fill'}
          width={18}
          sx={{ color: copied ? '#22C55E' : 'inherit' }}
        />
      </IconButton>
    </Tooltip>
  );
}

export default function ViewerMediaPane() {
  const { creators, creator, creatorIndex, submission, submissionIndex, pendingTotal } =
    useViewerData();
  const { goToSubmission, goLeft, goRight, prevCreator, nextCreator } = useViewerNavigation();

  usePreloadNeighbours();
  // Scopes the strip's sliding highlight (same pattern as the cards' SubmissionList)
  const stripGroupId = useId();

  // Trackpad swipes mirror the arrow keys: vertical = creator, horizontal = upload version
  // Covers the whole pane; off in the stacked mobile layout so the page can scroll
  const paneRef = useRef(null);
  const isStacked = useResponsive('down', 'md');
  useSwipeNavigation(
    paneRef,
    { onUp: prevCreator, onDown: nextCreator, onLeft: goLeft, onRight: goRight },
    { enabled: !isStacked }
  );

  return (
    <Stack
      ref={paneRef}
      sx={{ minWidth: 0, minHeight: 0, color: 'common.white', overscrollBehavior: 'contain' }}
    >
      {/* Top bar */}
      <Stack
        direction="row"
        alignItems="center"
        gap={1.75}
        sx={{ height: 60, px: 2.5, flexShrink: 0 }}
      >
        <IconButton onClick={closeSubmissionViewer} sx={darkButtonSx}>
          <Iconify icon="eva:close-fill" width={18} />
        </IconButton>

        <Stack sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 500 }}>
            {submission?.campaign?.name}
          </Typography>
          <Typography noWrap sx={{ fontSize: 12, color: '#8A8A92' }}>
            Creator {creatorIndex + 1} of {creators.length} · {pendingTotal} need action
          </Typography>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          gap={1.5}
          sx={{
            ml: 'auto',
            display: { xs: 'none', md: 'flex' },
            fontFamily: 'monospace',
            fontSize: 11,
            color: '#6E6E76',
          }}
        >
          {getShortcuts(submission).map(([keys, label]) => (
            <Box key={label} component="span">
              <Box
                component="span"
                sx={{
                  border: '1px solid #2E2E34',
                  borderRadius: 0.625,
                  px: 0.75,
                  py: 0.25,
                  mr: 0.75,
                  color: '#9A9AA2',
                }}
              >
                {keys}
              </Box>
              {label}
            </Box>
          ))}
        </Stack>

        <CreatorNavButtons
          direction="row"
          sx={{ ml: 'auto', flexShrink: 0, display: { xs: 'flex', md: 'none' } }}
        />
        <CopyMediaLink />
      </Stack>

      {/* Media + creator navigation */}
      {/* Equal padding on both sides keeps the media centred; buttons sit inside the right padding */}
      <Box
        sx={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          px: { xs: 2, md: `${STAGE_SIDE}px` },
          overscrollBehavior: 'contain',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            containerType: 'size',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Stays mounted across switches so it can crossfade old → new */}
          {submission && <ViewerMedia submission={submission} />}
        </Box>

        <CreatorNavButtons
          sx={{
            position: 'absolute',
            right: NAV_GAP,
            top: '50%',
            transform: 'translateY(-50%)',
            display: { xs: 'none', md: 'flex' },
          }}
        />
      </Box>

      {/* Asset strip */}
      <Stack alignItems="center" sx={{ px: 2.5, pt: 1, pb: 2, flexShrink: 0 }}>
        {/* Mobile: one scrollable row instead of wrapping */}
        <Stack
          direction="row"
          gap={1}
          sx={{
            maxWidth: 1,
            flexWrap: { xs: 'nowrap', md: 'wrap' },
            justifyContent: { xs: 'flex-start', md: 'center' },
            overflowX: { xs: 'auto', md: 'visible' },
            scrollbarWidth: 'none',
            bgcolor: '#1B1B1F',
            border: '1px solid #2A2A30',
            borderRadius: 1.5,
            p: 1,
          }}
        >
          <LayoutGroup id={stripGroupId}>
            {creator?.submissions.map((item, index) => {
              const status = getStatusChip(item.status);
              const isCurrent = index === submissionIndex;

              return (
                <Stack
                  key={item.id}
                  direction="row"
                  alignItems="center"
                  gap={1}
                  onClick={() => goToSubmission(index)}
                  sx={{
                    position: 'relative',
                    flexShrink: 0,
                    p: 0.5,
                    pr: 1,
                    borderRadius: 1.125,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: isCurrent ? 'transparent' : 'rgba(255, 255, 255, 0.04)' },
                  }}
                >
                  {/* Shared layoutId slides this highlight to the current item */}
                  {isCurrent && (
                    <m.div
                      layoutId="active-strip-submission"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 9,
                        background: '#2C2C32',
                        boxShadow: 'inset 0 0 0 1.5px #fff',
                      }}
                    />
                  )}
                  <Box sx={{ position: 'relative' }}>
                    <StripThumbnail submission={item} />
                  </Box>
                  <Stack gap={0.25} sx={{ position: 'relative' }}>
                    <Typography sx={{ fontSize: 11.5, whiteSpace: 'nowrap' }}>
                      {getSubmissionLabel(item)}
                    </Typography>
                    <Typography sx={{ fontSize: 10.5, color: status.color }}>
                      {status.label}
                    </Typography>
                  </Stack>
                </Stack>
              );
            })}
          </LayoutGroup>
        </Stack>
      </Stack>
    </Stack>
  );
}
