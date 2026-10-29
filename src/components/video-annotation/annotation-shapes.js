// Shapes are stored with coordinates normalised 0-1 against the video frame, so a drawing
// renders the same at any player size. Mirrors cc-backend src/utils/annotationValidation.ts.

export const ANNOTATION_VERSION = 1;

// Google Sheets' palette: greys, the 10 base hues, then each hue in 3 lighter and 3 darker
// shades. Rows are shown as-is in the toolbar's 10-column grid.
// prettier-ignore
export const ANNOTATION_COLOR_ROWS = [
  ['#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF'],
  ['#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF'],
  ['#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC'],
  ['#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD'],
  ['#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0'],
  ['#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79'],
  ['#85200C', '#990000', '#B45F06', '#BF9000', '#38761D', '#134F5C', '#1155CC', '#0B5394', '#351C75', '#741B47'],
  ['#5B0F00', '#660000', '#783F04', '#7F6000', '#274E13', '#0C343D', '#1C4587', '#073763', '#20124D', '#4C1130'],
];

export const ANNOTATION_COLORS = ANNOTATION_COLOR_ROWS.flat();

export const DEFAULT_ANNOTATION_COLOR = '#FF0000';

// key: single-letter shortcut, shown in each tool's tooltip
export const ANNOTATION_TOOLS = [
  { id: 'move', icon: 'mdi:cursor-move', label: 'Move', key: 'M' },
  { id: 'pen', icon: 'solar:pen-bold', label: 'Freehand', key: 'P' },
  { id: 'arrow', icon: 'mdi:arrow-top-right', label: 'Arrow', key: 'A' },
  { id: 'rect', icon: 'mdi:rectangle-outline', label: 'Box', key: 'R' },
  { id: 'text', icon: 'mdi:format-text', label: 'Text', key: 'T' },
];

// Stored stroke widths (validator allows 1-20). Drawn relative to the frame's height
// (see getStrokeWidth), so a line keeps its weight on any player size.
export const STROKE_WIDTHS = [
  { value: 2, label: 'Thin' },
  { value: 3, label: 'Medium' },
  { value: 6, label: 'Thick' },
];

export const DEFAULT_STROKE = 3;

// Frame height a stroke's stored width is drawn at 1:1
const STROKE_REFERENCE_HEIGHT = 720;

export const getStrokeWidth = (shape, height) =>
  Math.max(1, ((shape.stroke || DEFAULT_STROKE) * height) / STROKE_REFERENCE_HEIGHT);
// Text height as a fraction of the frame height
export const TEXT_SIZE = 0.035;
export const MAX_TEXT_LENGTH = 300;

// Below this (normalised), a drag counts as a stray click and is dropped
const MIN_SHAPE_SIZE = 0.005;
// Padding around a text background, as a fraction of the font size
const TEXT_PADDING = 0.3;
// Extra px around a shape that still counts as a hit, so thin lines are easy to grab
const HIT_SLOP = 6;
// Gap between a selected shape and its outline
const SELECTION_GAP = 4;

export const clamp01 = (n) => Math.min(1, Math.max(0, n));

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export const getTextFontSize = (shape, height) => Math.max(12, (shape.size || TEXT_SIZE) * height);

export const getTextFont = (fontSize) => `600 ${fontSize}px Inter, sans-serif`;

export const getTextPadding = (fontSize) => fontSize * TEXT_PADDING;

// Shape started at `point`, before any drag
export const startShape = (tool, point, color, stroke = DEFAULT_STROKE) => {
  const base = { color, stroke };
  if (tool === 'pen') return { ...base, type: 'freehand', points: [[point.x, point.y]] };
  if (tool === 'rect') return { ...base, type: 'rect', x: point.x, y: point.y, w: 0, h: 0 };
  if (tool === 'arrow') {
    return { ...base, type: 'arrow', x1: point.x, y1: point.y, x2: point.x, y2: point.y };
  }
  return null;
};

// The shape being dragged, stretched to `point`
export const extendShape = (shape, start, point) => {
  if (shape.type === 'freehand') return { ...shape, points: [...shape.points, [point.x, point.y]] };
  if (shape.type === 'rect') {
    return {
      ...shape,
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      w: Math.abs(point.x - start.x),
      h: Math.abs(point.y - start.y),
    };
  }
  if (shape.type === 'arrow') return { ...shape, x2: point.x, y2: point.y };
  return shape;
};

export const isShapeTooSmall = (shape) => {
  if (shape.type === 'rect') return shape.w < MIN_SHAPE_SIZE && shape.h < MIN_SHAPE_SIZE;
  if (shape.type === 'arrow') {
    return (
      Math.abs(shape.x2 - shape.x1) < MIN_SHAPE_SIZE &&
      Math.abs(shape.y2 - shape.y1) < MIN_SHAPE_SIZE
    );
  }
  if (shape.type === 'freehand') return shape.points.length < 2;
  return false;
};

// ----------------------------------------------------------------------
// Geometry in canvas pixels. ctx is only used to measure text.

const boundsOfPoints = (points) => {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
};

// Box the shape covers on screen (text includes its background padding)
export const getShapeBounds = (ctx, shape, width, height) => {
  switch (shape.type) {
    case 'rect':
      return { x: shape.x * width, y: shape.y * height, w: shape.w * width, h: shape.h * height };
    case 'arrow':
      return boundsOfPoints([
        [shape.x1 * width, shape.y1 * height],
        [shape.x2 * width, shape.y2 * height],
      ]);
    case 'freehand':
      return boundsOfPoints(shape.points.map(([px, py]) => [px * width, py * height]));
    case 'text': {
      const fontSize = getTextFontSize(shape, height);
      ctx.font = getTextFont(fontSize);
      const pad = shape.bg ? getTextPadding(fontSize) : 0;
      return {
        x: shape.x * width - pad,
        y: shape.y * height - pad,
        w: ctx.measureText(shape.value || '').width + pad * 2,
        h: fontSize + pad * 2,
      };
    }
    default:
      return { x: 0, y: 0, w: 0, h: 0 };
  }
};

const distanceToSegment = (p, a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq, 0, 1) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};

const isInside = (point, bounds, slop) =>
  point.x >= bounds.x - slop &&
  point.x <= bounds.x + bounds.w + slop &&
  point.y >= bounds.y - slop &&
  point.y <= bounds.y + bounds.h + slop;

// point is in canvas px. Boxes and text are grabbed anywhere inside; lines near the stroke.
const hitTestShape = (ctx, shape, point, width, height) => {
  const reach = HIT_SLOP + getStrokeWidth(shape, height) / 2;
  const toPx = ([px, py]) => ({ x: px * width, y: py * height });

  switch (shape.type) {
    case 'rect':
    case 'text':
      return isInside(point, getShapeBounds(ctx, shape, width, height), HIT_SLOP);
    case 'arrow':
      return (
        distanceToSegment(point, toPx([shape.x1, shape.y1]), toPx([shape.x2, shape.y2])) <= reach
      );
    case 'freehand':
      return shape.points.some(
        (p, index) =>
          index > 0 && distanceToSegment(point, toPx(shape.points[index - 1]), toPx(p)) <= reach
      );
    default:
      return false;
  }
};

// Index of the top-most shape under `point` (canvas px), or null
export const findShapeAt = (ctx, shapes, point, width, height) => {
  for (let index = shapes.length - 1; index >= 0; index -= 1) {
    if (hitTestShape(ctx, shapes[index], point, width, height)) return index;
  }
  return null;
};

// `shape` shifted by (dx, dy) normalised, stopped at the frame's edges
export const translateShape = (ctx, shape, dx, dy, width, height) => {
  const bounds = getShapeBounds(ctx, shape, width, height);
  // Allow staying put even when the shape already pokes past an edge
  const nx = clamp(dx * width, Math.min(-bounds.x, 0), Math.max(width - bounds.x - bounds.w, 0));
  const ny = clamp(dy * height, Math.min(-bounds.y, 0), Math.max(height - bounds.y - bounds.h, 0));
  const sx = (x) => clamp01(x + nx / width);
  const sy = (y) => clamp01(y + ny / height);

  switch (shape.type) {
    case 'rect':
    case 'text':
      return { ...shape, x: sx(shape.x), y: sy(shape.y) };
    case 'arrow':
      return { ...shape, x1: sx(shape.x1), y1: sy(shape.y1), x2: sx(shape.x2), y2: sy(shape.y2) };
    case 'freehand':
      return { ...shape, points: shape.points.map(([px, py]) => [sx(px), sy(py)]) };
    default:
      return shape;
  }
};

// ----------------------------------------------------------------------
// Resize handles: a box's corners and an arrow's two ends (canvas px)

const HANDLE_SIZE = 8;
// Grab distance around a handle
const HANDLE_REACH = 9;

export const HANDLE_CURSORS = {
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  start: 'crosshair',
  end: 'crosshair',
};

const getHandles = (shape, width, height) => {
  if (shape.type === 'rect') {
    const [left, top] = [shape.x * width, shape.y * height];
    const [right, bottom] = [(shape.x + shape.w) * width, (shape.y + shape.h) * height];
    return [
      { id: 'nw', x: left, y: top },
      { id: 'ne', x: right, y: top },
      { id: 'sw', x: left, y: bottom },
      { id: 'se', x: right, y: bottom },
    ];
  }
  if (shape.type === 'arrow') {
    return [
      { id: 'start', x: shape.x1 * width, y: shape.y1 * height },
      { id: 'end', x: shape.x2 * width, y: shape.y2 * height },
    ];
  }
  return [];
};

// Id of the handle of `shape` under `point` (canvas px), or null
export const findHandleAt = (shape, point, width, height) =>
  getHandles(shape, width, height).find(
    (handle) => Math.hypot(point.x - handle.x, point.y - handle.y) <= HANDLE_REACH
  )?.id ?? null;

// `shape` with handle `handleId` dragged to `point` (normalised). A box keeps the
// opposite corner fixed and can be dragged through it.
export const resizeShape = (shape, handleId, point) => {
  if (shape.type === 'arrow') {
    return handleId === 'start'
      ? { ...shape, x1: point.x, y1: point.y }
      : { ...shape, x2: point.x, y2: point.y };
  }
  if (shape.type !== 'rect') return shape;

  const fixedX = handleId.includes('w') ? shape.x + shape.w : shape.x;
  const fixedY = handleId.includes('n') ? shape.y + shape.h : shape.y;
  return {
    ...shape,
    x: Math.min(fixedX, point.x),
    y: Math.min(fixedY, point.y),
    w: Math.abs(point.x - fixedX),
    h: Math.abs(point.y - fixedY),
  };
};

// ----------------------------------------------------------------------
// Drawing

const drawArrowhead = (ctx, x1, y1, x2, y2, headLength) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 6),
    y2 - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 6),
    y2 - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
};

const drawShape = (ctx, shape, width, height) => {
  const color = shape.color || DEFAULT_ANNOTATION_COLOR;
  const lineWidth = getStrokeWidth(shape, height);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (shape.type) {
    case 'rect':
      ctx.strokeRect(shape.x * width, shape.y * height, shape.w * width, shape.h * height);
      break;
    case 'arrow': {
      const x1 = shape.x1 * width;
      const y1 = shape.y1 * height;
      const x2 = shape.x2 * width;
      const y2 = shape.y2 * height;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      drawArrowhead(ctx, x1, y1, x2, y2, Math.max(6, lineWidth * 4));
      break;
    }
    case 'freehand': {
      if (!shape.points?.length) break;
      ctx.beginPath();
      shape.points.forEach(([px, py], index) => {
        if (index === 0) ctx.moveTo(px * width, py * height);
        else ctx.lineTo(px * width, py * height);
      });
      ctx.stroke();
      break;
    }
    case 'text': {
      // (x, y) is the text's top-left, so the inline input lines up with what's drawn
      const fontSize = getTextFontSize(shape, height);
      ctx.font = getTextFont(fontSize);
      ctx.textBaseline = 'top';
      if (shape.bg) {
        const { x, y, w, h } = getShapeBounds(ctx, shape, width, height);
        ctx.fillStyle = shape.bg;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = color;
      } else {
        // No background: a shadow keeps it readable on any frame
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
      }
      ctx.fillText(shape.value || '', shape.x * width, shape.y * height);
      ctx.shadowBlur = 0;
      break;
    }
    default:
      break;
  }
};

// Dashed outline (dark under light so it shows on any frame), plus resize handles
const drawSelection = (ctx, shape, width, height) => {
  const { x, y, w, h } = getShapeBounds(ctx, shape, width, height);
  const gap = SELECTION_GAP + (shape.type === 'text' ? 0 : getStrokeWidth(shape, height) / 2);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.strokeRect(x - gap, y - gap, w + gap * 2, h + gap * 2);
  ctx.lineDashOffset = 4.5;
  ctx.strokeStyle = '#FFFFFF';
  ctx.strokeRect(x - gap, y - gap, w + gap * 2, h + gap * 2);
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;

  getHandles(shape, width, height).forEach((handle) => {
    const half = HANDLE_SIZE / 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(handle.x - half, handle.y - half, HANDLE_SIZE, HANDLE_SIZE);
    ctx.strokeRect(handle.x - half, handle.y - half, HANDLE_SIZE, HANDLE_SIZE);
  });
};

// hiddenIndex: a shape not to draw (a text being re-typed in its input box)
export const renderShapes = (
  ctx,
  shapes,
  width,
  height,
  { selectedIndex = null, hiddenIndex = null } = {}
) => {
  ctx.clearRect(0, 0, width, height);
  shapes.forEach((shape, index) => {
    if (index !== hiddenIndex) drawShape(ctx, shape, width, height);
  });
  if (shapes[selectedIndex] && selectedIndex !== hiddenIndex) {
    drawSelection(ctx, shapes[selectedIndex], width, height);
  }
};

// aspect: the video's width / height
export const buildAnnotationPayload = (shapes, frameTimeMs, aspect) => ({
  v: ANNOTATION_VERSION,
  frameTimeMs: Math.max(0, Math.round(frameTimeMs)),
  canvas: { aspect: Number.isFinite(aspect) && aspect > 0 ? aspect : null },
  shapes,
});
