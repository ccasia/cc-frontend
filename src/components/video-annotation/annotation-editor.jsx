import { useEffect } from 'react';
import PropTypes from 'prop-types';

import { Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import AnnotationCanvas from './annotation-canvas';
import AnnotationToolbar from './annotation-toolbar';
import { ANNOTATION_TOOLS } from './annotation-shapes';

// Shape types drawn with a line, so they have a thickness
const LINE_TYPES = ['freehand', 'arrow', 'rect'];

// M / P / A / R / T -> tool id
const TOOL_BY_KEY = Object.fromEntries(ANNOTATION_TOOLS.map((tool) => [tool.key, tool.id]));

const formatTime = (ms) => {
  const total = Math.floor(Math.max(0, ms || 0) / 1000);
  const pad = (value) => value.toString().padStart(2, '0');
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

const centredSx = {
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
};

/**
 * Drawing tools over a paused video frame, driven by useAnnotationDraft. Fills its
 * positioned parent. Keys while open: esc deselects (or closes when nothing is selected),
 * delete removes the selected shape, ⌘/ctrl+Z undoes, M/P/A/R/T pick a tool.
 */
export default function AnnotationEditor({ draft, aspect, zIndex = 5 }) {
  const { active, selected, undo, close, setTool, deleteShape, select } = draft;

  useEffect(() => {
    if (!active) return undefined;

    const onKeyDown = (event) => {
      if (['INPUT', 'TEXTAREA'].includes(event.target?.tagName)) return;
      const withModifier = event.metaKey || event.ctrlKey || event.altKey;
      const toolId = !withModifier && TOOL_BY_KEY[event.key.toUpperCase()];

      if (event.key === 'Escape') {
        event.preventDefault();
        // Keeps a surrounding dialog from closing too
        event.stopPropagation();
        if (selected != null) select(null);
        else close();
      } else if (['Delete', 'Backspace'].includes(event.key) && selected != null) {
        event.preventDefault();
        deleteShape(selected);
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      } else if (toolId) {
        event.preventDefault();
        setTool(toolId);
      }
    };

    // Capture phase, so it runs before a dialog's own esc handling
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [active, selected, undo, close, setTool, deleteShape, select]);

  if (!active) return null;

  const selectedShape = draft.shapes[selected];

  return (
    <>
      <AnnotationCanvas
        editable
        shapes={draft.shapes}
        aspect={aspect}
        tool={draft.tool}
        color={draft.color}
        textBg={draft.textBg}
        stroke={draft.stroke}
        selectedIndex={selected}
        onAddShape={draft.addShape}
        onChangeShape={draft.changeShape}
        onDeleteShape={draft.deleteShape}
        onSelect={select}
        sx={{ zIndex }}
      />
      <AnnotationToolbar
        tool={draft.tool}
        color={draft.color}
        textBg={draft.textBg}
        showTextBg={draft.tool === 'text' || selectedShape?.type === 'text'}
        stroke={draft.stroke}
        showStroke={
          ['pen', 'arrow', 'rect'].includes(draft.tool) || LINE_TYPES.includes(selectedShape?.type)
        }
        onStrokeChange={draft.setStroke}
        canUndo={draft.canUndo}
        canClear={draft.shapes.length > 0}
        onUndo={undo}
        onClear={draft.clear}
        onClose={close}
        onToolChange={setTool}
        onColorChange={draft.setColor}
        onTextBgChange={draft.setTextBg}
        sx={{ ...centredSx, top: 12, zIndex: zIndex + 1 }}
      />
      <Typography
        sx={{
          ...centredSx,
          bottom: 12,
          zIndex: zIndex + 1,
          px: 1,
          py: 0.375,
          borderRadius: 0.75,
          fontSize: 11.5,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          color: 'common.white',
          bgcolor: 'rgba(17, 17, 19, 0.6)',
          pointerEvents: 'none',
        }}
      >
        <Iconify icon="solar:pen-bold" width={12} sx={{ mr: 0.5, verticalAlign: '-1px' }} />
        Drawing at {formatTime(draft.frameMs)} · add a comment to attach drawing
      </Typography>
    </>
  );
}

AnnotationEditor.propTypes = {
  draft: PropTypes.object.isRequired,
  aspect: PropTypes.number,
  zIndex: PropTypes.number,
};
