import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';

import { Box, InputBase } from '@mui/material';

import {
  clamp01,
  TEXT_SIZE,
  startShape,
  extendShape,
  findShapeAt,
  getTextFont,
  resizeShape,
  findHandleAt,
  renderShapes,
  DEFAULT_STROKE,
  translateShape,
  getTextPadding,
  HANDLE_CURSORS,
  isShapeTooSmall,
  getTextFontSize,
  MAX_TEXT_LENGTH,
  DEFAULT_ANNOTATION_COLOR,
} from './annotation-shapes';

// Largest box with the video's shape (width / height) that fits the container, centred —
// the same box object-fit: contain paints the video into
const fitToAspect = (width, height, aspect) => {
  if (!aspect || !width || !height) return { left: 0, top: 0, width, height };
  const fitted =
    width / height > aspect
      ? { width: height * aspect, height }
      : { width, height: width / aspect };
  return { ...fitted, left: (width - fitted.width) / 2, top: (height - fitted.height) / 2 };
};

/**
 * Drawing layer over a video frame. Fills its positioned parent and lines itself up with
 * the video inside it. Controlled: the parent owns `shapes` and `selectedIndex`; new shapes
 * come back through `onAddShape`, moved / resized / re-typed ones through `onChangeShape`.
 * Read-only (and click-through) unless `editable`.
 *
 * Move tool: drag a shape to move it, drag a box's corners or an arrow's ends to resize,
 * double-click a text to re-type it. Text tool: click a text to re-type it, elsewhere to
 * add one.
 */
export default function AnnotationCanvas({
  shapes,
  aspect,
  editable = false,
  tool = 'pen',
  color = DEFAULT_ANNOTATION_COLOR,
  textBg = null,
  stroke = DEFAULT_STROKE,
  selectedIndex = null,
  onAddShape,
  onChangeShape,
  onDeleteShape,
  onSelect,
  sx,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [rect, setRect] = useState(null);

  // Shape being dragged out, and where the drag started
  const [draftShape, setDraftShape] = useState(null);
  const draftRef = useRef(null);
  const startRef = useRef(null);

  // Shape being moved or resized: { index, start, original, handle }, and where it is
  // mid-drag ({ index, shape })
  const moveRef = useRef(null);
  const [movedShape, setMovedShape] = useState(null);
  const movedRef = useRef(null);
  // Move tool's cursor over a shape or one of its handles
  const [hoverCursor, setHoverCursor] = useState(null);

  // Text being typed: { x, y, value, index? } — index set when re-typing an existing text.
  // Mirrored in a ref so blur/Enter/Esc agree on it.
  const [textDraft, setTextDraft] = useState(null);
  const textDraftRef = useRef(null);

  const updateDraft = (shape) => {
    draftRef.current = shape;
    setDraftShape(shape);
  };

  const updateMoved = (moved) => {
    movedRef.current = moved;
    setMovedShape(moved);
  };

  const updateTextDraft = (draft) => {
    textDraftRef.current = draft;
    setTextDraft(draft);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const measure = () =>
      setRect(fitToAspect(container.clientWidth, container.clientHeight, aspect));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [aspect]);

  // The text being re-typed is hidden while its input box sits in its place
  const editingIndex = textDraft?.index ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rect?.width || !rect?.height) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const shown = movedShape
      ? shapes.map((shape, index) => (index === movedShape.index ? movedShape.shape : shape))
      : shapes;
    renderShapes(ctx, draftShape ? [...shown, draftShape] : shown, rect.width, rect.height, {
      selectedIndex: editable ? selectedIndex : null,
      hiddenIndex: editingIndex,
    });
  }, [rect, shapes, draftShape, movedShape, editable, selectedIndex, editingIndex]);

  // Leaving edit mode drops anything half-drawn, mid-move or being typed
  useEffect(() => {
    if (editable) return;
    updateDraft(null);
    updateMoved(null);
    updateTextDraft(null);
    startRef.current = null;
    moveRef.current = null;
  }, [editable]);

  const getContext = () => canvasRef.current.getContext('2d');

  const toPoint = (event) => {
    const bounds = canvasRef.current.getBoundingClientRect();
    return {
      x: clamp01((event.clientX - bounds.left) / bounds.width),
      y: clamp01((event.clientY - bounds.top) / bounds.height),
    };
  };

  const toPixels = (point) => ({ x: point.x * rect.width, y: point.y * rect.height });

  const shapeIndexAt = (point) =>
    findShapeAt(getContext(), shapes, toPixels(point), rect.width, rect.height);

  const textIndexAt = (point) => {
    const index = shapeIndexAt(point);
    return index != null && shapes[index].type === 'text' ? index : null;
  };

  // Handle of the selected shape under the pointer (move tool only)
  const handleAt = (point) => {
    const selected = shapes[selectedIndex];
    return selected ? findHandleAt(selected, toPixels(point), rect.width, rect.height) : null;
  };

  const startTextEdit = (index) => {
    const shape = shapes[index];
    updateTextDraft({ x: shape.x, y: shape.y, value: shape.value, index });
  };

  // Places a new text, or saves a re-typed one (clearing it deletes it)
  const commitText = () => {
    const draft = textDraftRef.current;
    updateTextDraft(null);
    if (!draft) return;
    const value = draft.value.trim();

    if (draft.index != null) {
      const original = shapes[draft.index];
      if (!original) return;
      if (!value) onDeleteShape?.(draft.index);
      else if (value !== original.value) onChangeShape?.(draft.index, { ...original, value });
      return;
    }

    if (!value) return;
    onAddShape?.({
      type: 'text',
      x: draft.x,
      y: draft.y,
      value,
      color,
      size: TEXT_SIZE,
      ...(textBg && { bg: textBg }),
    });
  };

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    const point = toPoint(event);

    if (tool === 'move') {
      // A handle resizes the selected shape; otherwise pick (or clear) what's under the pointer
      const handle = handleAt(point);
      const index = handle ? selectedIndex : shapeIndexAt(point);
      if (!handle) onSelect?.(index);
      if (index == null) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      moveRef.current = { index, start: point, original: shapes[index], handle };
      return;
    }

    if (tool === 'text') {
      // A click while typing just finishes that text
      if (textDraftRef.current) {
        commitText();
        return;
      }
      const index = textIndexAt(point);
      if (index != null) startTextEdit(index);
      else updateTextDraft({ x: point.x, y: point.y, value: '' });
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    startRef.current = point;
    updateDraft(startShape(tool, point, color, stroke));
  };

  const handlePointerMove = (event) => {
    const point = toPoint(event);
    const move = moveRef.current;

    if (move) {
      const shape = move.handle
        ? resizeShape(move.original, move.handle, point)
        : translateShape(
            getContext(),
            move.original,
            point.x - move.start.x,
            point.y - move.start.y,
            rect.width,
            rect.height
          );
      updateMoved({ index: move.index, shape });
      return;
    }

    if (tool === 'move') {
      const handle = handleAt(point);
      if (handle) setHoverCursor(HANDLE_CURSORS[handle]);
      else setHoverCursor(shapeIndexAt(point) != null ? 'move' : null);
      return;
    }

    if (tool === 'text') {
      setHoverCursor(textIndexAt(point) != null ? 'pointer' : null);
      return;
    }

    if (!startRef.current || !draftRef.current) return;
    updateDraft(extendShape(draftRef.current, startRef.current, point));
  };

  const handlePointerUp = () => {
    const move = moveRef.current;
    if (move) {
      const moved = movedRef.current;
      moveRef.current = null;
      updateMoved(null);
      // A click without a drag only selects; a resize down to nothing is dropped
      if (moved && !isShapeTooSmall(moved.shape)) onChangeShape?.(move.index, moved.shape);
      return;
    }

    const shape = draftRef.current;
    startRef.current = null;
    updateDraft(null);
    if (shape && !isShapeTooSmall(shape)) onAddShape?.(shape);
  };

  const handleDoubleClick = (event) => {
    if (tool !== 'move') return;
    const index = textIndexAt(toPoint(event));
    if (index != null) startTextEdit(index);
  };

  const defaultCursor = { move: 'default', text: 'text' }[tool] ?? 'crosshair';
  const cursor = hoverCursor ?? defaultCursor;

  // Re-typed text keeps its own look (live, so a recolour while typing shows)
  const editedShape = editingIndex != null ? shapes[editingIndex] : null;
  const inputColor = editedShape ? editedShape.color : color;
  const inputBg = editedShape ? (editedShape.bg ?? null) : textBg;
  const textFontSize = rect ? getTextFontSize(editedShape || { size: TEXT_SIZE }, rect.height) : 0;
  const textPadding = getTextPadding(textFontSize);

  return (
    <Box ref={containerRef} sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...sx }}>
      {rect && (
        <Box
          sx={{
            position: 'absolute',
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }}
        >
          <Box
            component="canvas"
            ref={canvasRef}
            {...(editable && {
              onPointerDown: handlePointerDown,
              onPointerMove: handlePointerMove,
              onPointerUp: handlePointerUp,
              onPointerCancel: handlePointerUp,
              onPointerLeave: () => setHoverCursor(null),
              onDoubleClick: handleDoubleClick,
              // Keeps focus in the text box that pointerdown just opened
              onMouseDown: (event) => event.preventDefault(),
              // Drawing never plays / pauses the video underneath
              onClick: (event) => event.stopPropagation(),
            })}
            sx={{
              display: 'block',
              width: 1,
              height: 1,
              pointerEvents: editable ? 'auto' : 'none',
              cursor,
              touchAction: 'none',
            }}
          />

          {editable && textDraft && (
            <InputBase
              autoFocus
              value={textDraft.value}
              placeholder="Type…"
              onChange={(event) => updateTextDraft({ ...textDraft, value: event.target.value })}
              onBlur={commitText}
              onFocus={(event) => event.target.select()}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                // Keep Enter / Esc / arrows from reaching the viewer's shortcuts
                event.stopPropagation();
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitText();
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  updateTextDraft(null);
                }
              }}
              inputProps={{
                maxLength: MAX_TEXT_LENGTH,
                size: Math.max(6, textDraft.value.length + 1),
                'aria-label': 'Annotation text',
              }}
              sx={{
                position: 'absolute',
                left: textDraft.x * rect.width,
                top: textDraft.y * rect.height,
                color: inputColor,
                // Preview of the background it'll be drawn with
                ...(inputBg && {
                  bgcolor: inputBg,
                  boxShadow: `0 0 0 ${textPadding}px ${inputBg}`,
                }),
                outline: '1px dashed rgba(255, 255, 255, 0.7)',
                outlineOffset: inputBg ? textPadding + 2 : 2,
                '& input': {
                  p: 0,
                  height: textFontSize,
                  font: getTextFont(textFontSize),
                  lineHeight: 1,
                  textShadow: inputBg ? 'none' : '0 0 4px rgba(0, 0, 0, 0.8)',
                },
                '& input::placeholder': { color: inputColor, opacity: 0.6 },
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );
}

AnnotationCanvas.propTypes = {
  shapes: PropTypes.array.isRequired,
  aspect: PropTypes.number,
  editable: PropTypes.bool,
  tool: PropTypes.string,
  color: PropTypes.string,
  textBg: PropTypes.string,
  stroke: PropTypes.number,
  selectedIndex: PropTypes.number,
  onAddShape: PropTypes.func,
  onChangeShape: PropTypes.func,
  onDeleteShape: PropTypes.func,
  onSelect: PropTypes.func,
  sx: PropTypes.object,
};
