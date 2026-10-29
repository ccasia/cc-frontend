import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';

import { ANNOTATION_TOOLS } from 'src/components/video-annotation/annotation-shapes';

import ViewerMediaPane from './components/ViewerMediaPane';
import ViewerReviewPanel from './components/ViewerReviewPanel';
import PanelResizeHandle from './components/PanelResizeHandle';
import useViewerNavigation from './hooks/use-viewer-navigation';
import DecisionConfirmDialog from './components/DecisionConfirmDialog';
import {
  togglePlay,
  undoAnnotation,
  closeAnnotation,
  setAnnotationTool,
  cancelDrawingDiscard,
  selectAnnotationShape,
  closeSubmissionViewer,
  confirmDrawingDiscard,
  useCreatorSubmissionsStore,
  deleteSelectedAnnotationShape,
} from '../store/use-creator-submissions-store';

// M / P / A / R / T -> tool id
const TOOL_BY_KEY = Object.fromEntries(ANNOTATION_TOOLS.map((tool) => [tool.key, tool.id]));

export default function SubmissionViewer() {
  const open = useCreatorSubmissionsStore((s) => s.viewerOpen);
  const panelWidth = useCreatorSubmissionsStore((s) => s.panelWidth);
  const annotationMode = useCreatorSubmissionsStore((s) => s.annotationMode);
  const discardPending = useCreatorSubmissionsStore((s) => Boolean(s.pendingDrawingDiscard));
  const { goLeft, goRight, prevCreator, nextCreator } = useViewerNavigation();

  useEffect(() => {
    if (!open) return undefined;

    const handlers = {
      ArrowUp: prevCreator,
      ArrowDown: nextCreator,
      ArrowLeft: goLeft,
      ArrowRight: goRight,
      ' ': togglePlay,
    };

    const onKeyDown = (event) => {
      if (['INPUT', 'TEXTAREA'].includes(event.target?.tagName)) return;
      // "Discard your drawing?" handles its own keys
      if (discardPending) return;

      // While drawing: esc deselects, or discards the drawing when nothing is selected;
      // delete removes the selected shape; ⌘/ctrl+Z undoes; M/P/A/R/T pick a tool.
      // Navigation and play stay off so the frame can't change underneath.
      if (annotationMode) {
        const hasSelection = useCreatorSubmissionsStore.getState().annotationSelected != null;
        const withModifier = event.metaKey || event.ctrlKey || event.altKey;
        const toolId = !withModifier && TOOL_BY_KEY[event.key.toUpperCase()];

        if (event.key === 'Escape') {
          event.preventDefault();
          if (hasSelection) selectAnnotationShape(null);
          else closeAnnotation();
        } else if (['Delete', 'Backspace'].includes(event.key) && hasSelection) {
          event.preventDefault();
          deleteSelectedAnnotationShape();
        } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
          event.preventDefault();
          undoAnnotation();
        } else if (toolId) {
          event.preventDefault();
          setAnnotationTool(toolId);
        }
        return;
      }

      const handler = handlers[event.key];
      if (!handler) return;
      event.preventDefault();
      handler();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, annotationMode, discardPending, goLeft, goRight, prevCreator, nextCreator]);

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={closeSubmissionViewer}
      // Esc leaves drawing mode (handled above) rather than closing the viewer
      disableEscapeKeyDown={annotationMode}
      PaperProps={{
        sx: {
          bgcolor: '#111113',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: `minmax(0, 1fr) ${panelWidth}px` },
          gridTemplateRows: { xs: 'minmax(0, 75svh) auto', md: 'minmax(0, 1fr)' },
          overflowY: { xs: 'auto', md: 'hidden' },
        },
      }}
    >
      <ViewerMediaPane />
      <Box sx={{ position: 'relative', display: 'flex', minWidth: 0, minHeight: 0 }}>
        <PanelResizeHandle />
        <ViewerReviewPanel />
      </Box>

      {/* Switching media or closing with an unposted drawing */}
      <DecisionConfirmDialog
        open={discardPending}
        title="Discard your drawing?"
        description="It hasn't been posted yet. To keep it, cancel and add a note in Your feedback, then post it."
        confirmLabel="Discard"
        onConfirm={confirmDrawingDiscard}
        onClose={cancelDrawingDiscard}
      />
    </Dialog>
  );
}
