import { useMemo, useReducer } from 'react';

import {
  DEFAULT_STROKE,
  buildAnnotationPayload,
  DEFAULT_ANNOTATION_COLOR,
} from './annotation-shapes';

// A drawing in progress on one paused frame, before it's posted with a comment. Same
// editing rules as the admin viewer's store (creator-submissions/store), for players
// that don't use that store.

const initialState = {
  // The frame being drawn on; null when not drawing
  frameMs: null,
  shapes: [],
  // Earlier versions of `shapes`, for undo
  past: [],
  selected: null,
  tool: 'pen',
  color: DEFAULT_ANNOTATION_COLOR,
  textBg: null,
  stroke: DEFAULT_STROKE,
};

// Every change to the drawing goes through here, so undo can step back through it
const withShapes = (state, shapes, changes = {}) => ({
  ...state,
  past: [...state.past, state.shapes],
  shapes,
  ...changes,
});

// Restyles the selected shape, when there is one and the style differs
const restyleSelected = (state, restyle) => {
  const shape = state.shapes[state.selected];
  const next = shape && restyle(shape);
  if (!next || next === shape) return state;
  return withShapes(
    state,
    state.shapes.map((item, i) => (i === state.selected ? next : item))
  );
};

function reducer(state, action) {
  switch (action.type) {
    case 'start':
      return { ...state, frameMs: action.frameMs, shapes: [], past: [], selected: null };
    case 'close':
      return { ...state, frameMs: null, shapes: [], past: [], selected: null };
    case 'add':
      return withShapes(state, [...state.shapes, action.shape]);
    case 'change':
      return withShapes(
        state,
        state.shapes.map((item, i) => (i === action.index ? action.shape : item))
      );
    case 'delete':
      if (action.index == null || !state.shapes[action.index]) return state;
      return withShapes(
        state,
        state.shapes.filter((_, i) => i !== action.index),
        { selected: null }
      );
    case 'undo':
      if (!state.past.length) return state;
      return {
        ...state,
        shapes: state.past[state.past.length - 1],
        past: state.past.slice(0, -1),
        selected: null,
      };
    case 'clear':
      return state.shapes.length ? withShapes(state, [], { selected: null }) : state;
    case 'select': {
      // The toolbar switches to the picked shape's colours, so it shows what it has
      const shape = state.shapes[action.index];
      return {
        ...state,
        selected: action.index,
        ...(shape?.color && { color: shape.color }),
        ...(shape?.type === 'text' && { textBg: shape.bg ?? null }),
        ...(shape && shape.type !== 'text' && { stroke: shape.stroke ?? DEFAULT_STROKE }),
      };
    }
    // Selection belongs to the move tool
    case 'tool':
      return { ...state, tool: action.tool, selected: null };
    case 'color':
      return restyleSelected({ ...state, color: action.color }, (shape) =>
        shape.color === action.color ? shape : { ...shape, color: action.color }
      );
    case 'textBg':
      return restyleSelected({ ...state, textBg: action.textBg }, (shape) => {
        if (shape.type !== 'text' || (shape.bg ?? null) === action.textBg) return shape;
        const next = { ...shape, bg: action.textBg };
        if (!action.textBg) delete next.bg;
        return next;
      });
    case 'stroke':
      return restyleSelected({ ...state, stroke: action.stroke }, (shape) =>
        shape.type === 'text' || shape.stroke === action.stroke
          ? shape
          : { ...shape, stroke: action.stroke }
      );
    default:
      return state;
  }
}

export default function useAnnotationDraft() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = useMemo(
    () => ({
      start: (frameMs) => dispatch({ type: 'start', frameMs }),
      close: () => dispatch({ type: 'close' }),
      addShape: (shape) => dispatch({ type: 'add', shape }),
      changeShape: (index, shape) => dispatch({ type: 'change', index, shape }),
      deleteShape: (index) => dispatch({ type: 'delete', index }),
      undo: () => dispatch({ type: 'undo' }),
      clear: () => dispatch({ type: 'clear' }),
      select: (index) => dispatch({ type: 'select', index }),
      setTool: (tool) => dispatch({ type: 'tool', tool }),
      setColor: (color) => dispatch({ type: 'color', color }),
      setTextBg: (textBg) => dispatch({ type: 'textBg', textBg }),
      setStroke: (stroke) => dispatch({ type: 'stroke', stroke }),
    }),
    []
  );

  return useMemo(
    () => ({
      ...state,
      ...actions,
      active: state.frameMs != null,
      canUndo: state.past.length > 0,
      // The drawing to post with the comment, or null when nothing's drawn
      getPayload: (aspect) =>
        state.frameMs != null && state.shapes.length
          ? buildAnnotationPayload(state.shapes, state.frameMs, aspect)
          : null,
    }),
    [state, actions]
  );
}
