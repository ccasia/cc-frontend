import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { CHART_MARGIN, CHART_HEIGHT } from 'src/sections/analytics/view/v2/chart-config';

const DEFAULT_MIN_WINDOW = 2.5;
const LERP_FACTOR = 0.18;
const SNAP_THRESHOLD = 0.005;
// Max zoom change per wheel tick (scaled by deltaY magnitude for trackpad sensitivity)
const ZOOM_SENSITIVITY = 0.06;
const MAX_DELTA = 50;

export default function useChartZoom(dataLength, options = {}) {
  const {
    minWindow = DEFAULT_MIN_WINDOW,
    marginLeft = CHART_MARGIN.left,
    marginRight = CHART_MARGIN.right,
    marginTop = CHART_MARGIN.top,
    marginBottom = CHART_MARGIN.bottom,
    chartHeight = CHART_HEIGHT,
    yPadding = 0.15,
  } = options;

  const containerRef = useRef(null);
  const maxIndex = dataLength - 1;

  // --- Single source of truth (never triggers renders) ---
  const viewportRef = useRef({ xMin: 0, xMax: maxIndex, yMin: null, yMax: null });

  // --- React-renderable snapshot (flushed via rAF at most 60fps) ---
  const [viewport, setViewport] = useState({ xMin: 0, xMax: maxIndex, yMin: null, yMax: null });

  // --- rAF scheduling — coalesces rapid events ---
  const rafPendingRef = useRef(false);
  const scheduleUpdate = useCallback(() => {
    if (rafPendingRef.current) return;
    rafPendingRef.current = true;
    requestAnimationFrame(() => {
      rafPendingRef.current = false;
      setViewport({ ...viewportRef.current });
    });
  }, []);

  // Y data sources registered by chart components
  const ySourcesRef = useRef([]);

  // Drag state
  const dragRef = useRef({ active: false, startX: 0, startY: 0, viewportAtStart: null });

  // LERP animation state (used for zoom + reset)
  const lerpActiveRef = useRef(false);
  const lerpTargetRef = useRef(null);
  const lerpRafRef = useRef(null);

  // Reset when dataLength changes
  useEffect(() => {
    const fullView = { xMin: 0, xMax: dataLength - 1, yMin: null, yMax: null };
    viewportRef.current = { ...fullView };
    lerpActiveRef.current = false;
    if (lerpRafRef.current) cancelAnimationFrame(lerpRafRef.current);
    setViewport({ ...fullView });
  }, [dataLength]);

  // Compute y-axis target from visible data
  const computeYTarget = useCallback(
    (xMin, xMax) => {
      const sources = ySourcesRef.current;
      if (!sources || sources.length === 0) return { yMin: null, yMax: null };

      // When showing full range, don't constrain y
      const isFullRange = xMin <= 0.01 && xMax >= maxIndex - 0.01;
      if (isFullRange) return { yMin: null, yMax: null };

      const iStart = Math.max(0, Math.floor(xMin));
      const iEnd = Math.min(maxIndex, Math.ceil(xMax));

      const visibleValues = [];
      for (let si = 0; si < sources.length; si += 1) {
        const arr = sources[si];
        for (let i = iStart; i <= iEnd; i += 1) {
          const v = arr[i];
          if (v != null && !Number.isNaN(v)) visibleValues.push(v);
        }
      }

      if (visibleValues.length === 0) return { yMin: null, yMax: null };

      let dataMin = visibleValues[0];
      let dataMax = visibleValues[0];
      for (let i = 1; i < visibleValues.length; i += 1) {
        if (visibleValues[i] < dataMin) dataMin = visibleValues[i];
        if (visibleValues[i] > dataMax) dataMax = visibleValues[i];
      }

      const span = dataMax - dataMin || 1;
      return {
        yMin: dataMin - span * yPadding,
        yMax: dataMax + span * yPadding,
      };
    },
    [maxIndex, yPadding]
  );

  // Clamp viewport to valid bounds
  const clampViewport = useCallback(
    (xMin, xMax) => {
      let lo = xMin;
      let hi = xMax;
      const windowSize = hi - lo;

      // Enforce minimum window
      if (windowSize < minWindow) {
        const mid = (lo + hi) / 2;
        lo = mid - minWindow / 2;
        hi = mid + minWindow / 2;
      }

      // Enforce bounds [0, maxIndex]
      if (lo < 0) {
        hi = Math.min(hi - lo, maxIndex);
        lo = 0;
      }
      if (hi > maxIndex) {
        lo = Math.max(lo - (hi - maxIndex), 0);
        hi = maxIndex;
      }

      return { xMin: lo, xMax: hi };
    },
    [maxIndex, minWindow]
  );

  // --- LERP animation loop (used for zoom + reset) ---
  const startLerp = useCallback(() => {
    // If already running, the loop will pick up the updated target
    if (lerpActiveRef.current) return;
    lerpActiveRef.current = true;

    // Cancel any stale frame
    if (lerpRafRef.current) cancelAnimationFrame(lerpRafRef.current);

    const tick = () => {
      if (!lerpActiveRef.current) return;

      const cur = viewportRef.current;
      const tgt = lerpTargetRef.current;
      let changed = false;

      const lerp = (from, to) => {
        if (to === null) return null;
        if (from === null) return to;
        const diff = to - from;
        if (Math.abs(diff) < SNAP_THRESHOLD) return to;
        changed = true;
        return from + diff * LERP_FACTOR;
      };

      const next = {
        xMin: lerp(cur.xMin, tgt.xMin),
        xMax: lerp(cur.xMax, tgt.xMax),
        yMin: lerp(cur.yMin, tgt.yMin),
        yMax: lerp(cur.yMax, tgt.yMax),
      };

      viewportRef.current = next;
      scheduleUpdate();

      if (changed) {
        lerpRafRef.current = requestAnimationFrame(tick);
      } else {
        lerpActiveRef.current = false;
        lerpRafRef.current = null;
      }
    };

    lerpRafRef.current = requestAnimationFrame(tick);
  }, [scheduleUpdate]);

  // Cleanup LERP rAF on unmount
  useEffect(
    () => () => {
      if (lerpRafRef.current) cancelAnimationFrame(lerpRafRef.current);
    },
    []
  );

  // --- Wheel zoom — LERP-animated, center-anchored ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const handleWheel = (e) => {
      e.preventDefault();

      // Stop drag if active
      dragRef.current.active = false;

      // Read from LERP target if animating, otherwise from current viewport
      const base = lerpActiveRef.current && lerpTargetRef.current
        ? lerpTargetRef.current
        : viewportRef.current;

      const currentWindow = base.xMax - base.xMin;
      // Scale zoom by deltaY magnitude — trackpads send small values for fine control
      const clampedDelta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), MAX_DELTA);
      const zoomFactor = 1 + (clampedDelta / MAX_DELTA) * ZOOM_SENSITIVITY;
      const newWindow = currentWindow * zoomFactor;

      // Cursor-anchored zoom — zoom into wherever the mouse is hovering
      const rect = el.getBoundingClientRect();
      const plotLeft = marginLeft;
      const plotRight = rect.width - marginRight;
      const plotWidth = plotRight - plotLeft;
      const cursorX = e.clientX - rect.left;
      const fraction = Math.max(0, Math.min(1, (cursorX - plotLeft) / plotWidth));

      // The cursor position in data space stays fixed during zoom
      const cursorValue = base.xMin + currentWindow * fraction;
      const newXMin = cursorValue - newWindow * fraction;
      const newXMax = cursorValue + newWindow * (1 - fraction);

      const clamped = clampViewport(newXMin, newXMax);
      const yTarget = computeYTarget(clamped.xMin, clamped.xMax);

      lerpTargetRef.current = { ...clamped, ...yTarget };
      startLerp();
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [dataLength, minWindow, marginLeft, marginRight, clampViewport, computeYTarget, startLerp]);

  // --- Touch pinch zoom ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    let lastPinchDist = null;

    const getTouchDist = (touches) => {
      if (touches.length < 2) return null;
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchMove = (e) => {
      // Pinch zoom (2 fingers) — center-anchored via LERP
      if (e.touches.length === 2) {
        e.preventDefault();

        const dist = getTouchDist(e.touches);
        if (lastPinchDist !== null && dist !== null) {
          const scale = dist / lastPinchDist;
          const base = lerpActiveRef.current && lerpTargetRef.current
            ? lerpTargetRef.current
            : viewportRef.current;
          const currentWindow = base.xMax - base.xMin;
          const newWindow = currentWindow / scale;
          const mid = (base.xMin + base.xMax) / 2;
          const newXMin = mid - newWindow / 2;
          const newXMax = mid + newWindow / 2;
          const clamped = clampViewport(newXMin, newXMax);
          const yTarget = computeYTarget(clamped.xMin, clamped.xMax);

          lerpTargetRef.current = { ...clamped, ...yTarget };
          startLerp();
        }
        lastPinchDist = dist;
      }

      // Single-finger drag pan — immediate (no LERP), pans both axes
      if (e.touches.length === 1 && dragRef.current.active) {
        e.preventDefault();
        // Cancel LERP during drag
        lerpActiveRef.current = false;

        const prev = dragRef.current.viewportAtStart;

        // X pan
        const deltaX = e.touches[0].clientX - dragRef.current.startX;
        const rect = el.getBoundingClientRect();
        const plotWidth = rect.width - marginLeft - marginRight;
        const xWindow = prev.xMax - prev.xMin;
        const xUnitDelta = -deltaX / (plotWidth / xWindow);
        const clamped = clampViewport(prev.xMin + xUnitDelta, prev.xMax + xUnitDelta);

        // Y pan (only when zoomed with explicit y range)
        let { yMin, yMax } = prev;
        if (yMin !== null && yMax !== null) {
          const deltaY = e.touches[0].clientY - dragRef.current.startY;
          const plotHeight = chartHeight - marginTop - marginBottom;
          const yWindow = yMax - yMin;
          const yUnitDelta = deltaY / (plotHeight / yWindow);
          yMin = prev.yMin + yUnitDelta;
          yMax = prev.yMax + yUnitDelta;
        }

        viewportRef.current = { ...clamped, yMin, yMax };
        scheduleUpdate();
      }
    };

    const handleTouchEnd = () => {
      lastPinchDist = null;
      dragRef.current.active = false;
    };

    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [dataLength, minWindow, marginLeft, marginRight, marginTop, marginBottom, chartHeight, clampViewport, computeYTarget, scheduleUpdate, startLerp]);

  // --- Mouse handlers (stable identity — read from viewportRef, not state) ---
  const onMouseDown = useCallback(
    (e) => {
      // Cancel LERP during drag
      lerpActiveRef.current = false;
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        viewportAtStart: { ...viewportRef.current },
      };
    },
    []
  );

  const onMouseMove = useCallback(
    (e) => {
      if (!dragRef.current.active) return;
      const el = containerRef.current;
      if (!el) return;

      const prev = dragRef.current.viewportAtStart;

      // X pan
      const deltaX = e.clientX - dragRef.current.startX;
      const rect = el.getBoundingClientRect();
      const plotWidth = rect.width - marginLeft - marginRight;
      const xWindow = prev.xMax - prev.xMin;
      const xUnitDelta = -deltaX / (plotWidth / xWindow);
      const clamped = clampViewport(prev.xMin + xUnitDelta, prev.xMax + xUnitDelta);

      // Y pan (only when zoomed with explicit y range)
      let { yMin, yMax } = prev;
      if (yMin !== null && yMax !== null) {
        const deltaY = e.clientY - dragRef.current.startY;
        const plotHeight = chartHeight - marginTop - marginBottom;
        const yWindow = yMax - yMin;
        // Screen Y is inverted (down = positive), data Y is up = positive
        const yUnitDelta = deltaY / (plotHeight / yWindow);
        yMin = prev.yMin + yUnitDelta;
        yMax = prev.yMax + yUnitDelta;
      }

      viewportRef.current = { ...clamped, yMin, yMax };
      scheduleUpdate();
    },
    [marginLeft, marginRight, marginTop, marginBottom, chartHeight, clampViewport, scheduleUpdate]
  );

  const onMouseUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  const onTouchStart = useCallback(
    (e) => {
      if (e.touches.length === 1) {
        // Cancel LERP during drag
        lerpActiveRef.current = false;
        dragRef.current = {
          active: true,
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          viewportAtStart: { ...viewportRef.current },
        };
      }
    },
    []
  );

  const resetZoom = useCallback(() => {
    lerpTargetRef.current = { xMin: 0, xMax: dataLength - 1, yMin: null, yMax: null };
    lerpActiveRef.current = false; // Force restart
    startLerp();
  }, [dataLength, startLerp]);

  const setYSources = useCallback((arrays) => {
    ySourcesRef.current = arrays;
  }, []);

  const isZoomed = viewport.xMin > 0.1 || viewport.xMax < maxIndex - 0.1 || viewport.yMin !== null;

  // Build xAxis domain object
  const xAxis = useMemo(
    () => ({
      min: viewport.xMin,
      max: viewport.xMax,
    }),
    [viewport.xMin, viewport.xMax]
  );

  // Build yDomain object — always floor at 0 so data sits on the x-axis line
  const yDomain = useMemo(() => {
    if (viewport.yMin === null || viewport.yMax === null) return { min: 0 };
    return { min: Math.max(0, viewport.yMin), max: viewport.yMax };
  }, [viewport.yMin, viewport.yMax]);

  const containerProps = useMemo(
    () => ({
      ref: containerRef,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave: onMouseUp,
      onTouchStart,
    }),
    [onMouseDown, onMouseMove, onMouseUp, onTouchStart]
  );

  return { xAxis, yDomain, isZoomed, resetZoom, containerProps, setYSources };
}
