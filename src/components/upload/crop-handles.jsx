import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';

const CORNERS = [
  { key: 'nw', x: -1, y: -1, cursor: 'nwse-resize' },
  { key: 'ne', x: 1, y: -1, cursor: 'nesw-resize' },
  { key: 'sw', x: -1, y: 1, cursor: 'nesw-resize' },
  { key: 'se', x: 1, y: 1, cursor: 'nwse-resize' },
];
const DOT = 12;
const HIT = 40;
const SETTLE_MS = 260;

// Close to cubic-bezier(0.23, 1, 0.32, 1)
const easeOut = (t) => 1 - (1 - t) ** 4;

/**
 * Corner dot handles for a fixed-frame cropper:
 * the frame follows the corner while you drag, then glides back to full size
 * and the image zooms so the chosen area fills it.
 */
export default function CropHandles({ cropSize, aspect, zoom, crop, minZoom, maxZoom, onChange }) {
  const layerRef = useRef(null);
  const frameRef = useRef(null);
  const [selection, setSelection] = useState(null);
  const [dragging, setDragging] = useState(false);

  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  useEffect(() => {
    const node = layerRef.current;
    if (!node) return undefined;
    const measure = () => setSize({ width: node.clientWidth, height: node.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const { width, height } = size;
  const ready = !!cropSize && width > 0;
  const frame = ready
    ? {
        left: (width - cropSize.width) / 2,
        top: (height - cropSize.height) / 2,
        width: cropSize.width,
        height: cropSize.height,
      }
    : null;
  const rect = selection ?? frame;

  const settle = (picked) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Offset of the picked area's centre from the frame centre
    const dx = picked.left + picked.width / 2 - width / 2;
    const dy = picked.top + picked.height / 2 - height / 2;
    // The image point under that centre, in unzoomed image pixels from the image centre
    const qx = (dx - crop.x) / zoom;
    const qy = (dy - crop.y) / zoom;

    const at = (e) => {
      const w = picked.width + (frame.width - picked.width) * e;
      const scale = (zoom * w) / picked.width;
      return {
        zoom: scale,
        crop: { x: dx * (1 - e) - qx * scale, y: dy * (1 - e) - qy * scale },
        rect: {
          width: w,
          height: w / aspect,
          left: width / 2 + dx * (1 - e) - w / 2,
          top: height / 2 + dy * (1 - e) - w / aspect / 2,
        },
      };
    };

    if (reduceMotion) {
      const end = at(1);
      onChange({ zoom: end.zoom, crop: end.crop });
      setSelection(null);
      return;
    }

    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / SETTLE_MS);
      const next = at(easeOut(t));
      onChange({ zoom: next.zoom, crop: next.crop });
      if (t < 1) {
        setSelection(next.rect);
        frameRef.current = requestAnimationFrame(step);
      } else {
        setSelection(null);
      }
    };
    frameRef.current = requestAnimationFrame(step);
  };

  const handlePointerDown = (corner) => (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    cancelAnimationFrame(frameRef.current);

    const target = event.currentTarget;
    try {
      target.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointers cannot be captured; moves still arrive while over the handle
    }
    const bounds = layerRef.current.getBoundingClientRect();
    // The opposite corner stays put
    const anchorX = corner.x > 0 ? frame.left : frame.left + frame.width;
    const anchorY = corner.y > 0 ? frame.top : frame.top + frame.height;
    const roomX = corner.x > 0 ? width - anchorX : anchorX;
    const roomY = corner.y > 0 ? height - anchorY : anchorY;
    const minWidth = (frame.width * zoom) / maxZoom;
    const maxWidth = Math.min((frame.width * zoom) / minZoom, roomX, roomY * aspect);
    let latest = null;

    const move = (moveEvent) => {
      // Screen pixels to layout pixels, in case a parent is scaled (e.g. the dialog open animation)
      const px = ((moveEvent.clientX - bounds.left) * width) / bounds.width;
      const py = ((moveEvent.clientY - bounds.top) * height) / bounds.height;
      // Average the two axes so the frame follows the pointer smoothly at a locked ratio
      const raw = ((px - anchorX) * corner.x + (py - anchorY) * corner.y * aspect) / 2;
      const w = Math.min(maxWidth, Math.max(minWidth, raw));
      const h = w / aspect;
      latest = {
        width: w,
        height: h,
        left: corner.x > 0 ? anchorX : anchorX - w,
        top: corner.y > 0 ? anchorY : anchorY - h,
      };
      setSelection(latest);
    };

    const end = (endEvent) => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', end);
      target.removeEventListener('pointercancel', end);
      setDragging(false);
      // A cancelled pointer (e.g. the browser took over the touch) leaves the crop as it was
      const applies = endEvent.type === 'pointerup' && latest;
      if (applies && Math.abs(latest.width - frame.width) > 1) settle(latest);
      else setSelection(null);
    };

    setDragging(true);
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', end);
    target.addEventListener('pointercancel', end);
  };

  return (
    <Box
      ref={layerRef}
      aria-hidden
      sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}
    >
      {selection && (
        <Box
          sx={{
            position: 'absolute',
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            border: '2px solid #FFFFFF',
            borderRadius: '4px',
            boxShadow: '0 0 0 9999px rgba(35, 31, 32, 0.35)',
          }}
        />
      )}

      {ready &&
        CORNERS.map((corner) => (
          <Box
            key={corner.key}
            onPointerDown={handlePointerDown(corner)}
            sx={{
              position: 'absolute',
              width: HIT,
              height: HIT,
              // Most of the hit area sits inside the frame, so it still works at the canvas edge
              left: rect.left + (corner.x > 0 ? rect.width - HIT + 12 : -12),
              top: rect.top + (corner.y > 0 ? rect.height - HIT + 12 : -12),
              pointerEvents: 'auto',
              touchAction: 'none',
              cursor: corner.cursor,
              // A white dot centred on the frame corner, with a dark ring so it shows on light images too
              '&::before': {
                content: '""',
                position: 'absolute',
                width: DOT,
                height: DOT,
                [corner.x > 0 ? 'right' : 'left']: 12 - DOT / 2,
                [corner.y > 0 ? 'bottom' : 'top']: 12 - DOT / 2,
                borderRadius: '50%',
                bgcolor: '#FFFFFF',
                border: '2px solid #1340FF',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.35)',
                transform: dragging ? 'scale(1.25)' : 'none',
                transition: 'transform 120ms cubic-bezier(0.23, 1, 0.32, 1)',
              },
              '@media (hover: hover) and (pointer: fine)': {
                '&:hover::before': { transform: 'scale(1.25)' },
              },
            }}
          />
        ))}
    </Box>
  );
}

CropHandles.propTypes = {
  cropSize: PropTypes.shape({ width: PropTypes.number, height: PropTypes.number }),
  aspect: PropTypes.number.isRequired,
  zoom: PropTypes.number.isRequired,
  crop: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }).isRequired,
  minZoom: PropTypes.number.isRequired,
  maxZoom: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};
