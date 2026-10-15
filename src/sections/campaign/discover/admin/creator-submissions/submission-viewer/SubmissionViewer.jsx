import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';

import ViewerMediaPane from './components/ViewerMediaPane';
import ViewerReviewPanel from './components/ViewerReviewPanel';
import PanelResizeHandle from './components/PanelResizeHandle';
import useViewerNavigation from './hooks/use-viewer-navigation';
import {
  togglePlay,
  closeSubmissionViewer,
  useCreatorSubmissionsStore,
} from '../store/use-creator-submissions-store';

export default function SubmissionViewer() {
  const open = useCreatorSubmissionsStore((s) => s.viewerOpen);
  const panelWidth = useCreatorSubmissionsStore((s) => s.panelWidth);
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
      const handler = handlers[event.key];
      if (!handler) return;
      event.preventDefault();
      handler();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, goLeft, goRight, prevCreator, nextCreator]);

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={closeSubmissionViewer}
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
    </Dialog>
  );
}
