import { useState } from 'react';

import Box from '@mui/material/Box';

import {
  setPanelWidth,
  savePanelWidth,
  resetPanelWidth,
} from '../../store/use-creator-submissions-store';

// Drag the review panel's left edge to resize it; double-click to reset
export default function PanelResizeHandle() {
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (event) => {
    event.preventDefault();
    // Keeps receiving moves even when the pointer passes over the video
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (event) => {
    if (!dragging) return;
    setPanelWidth(window.innerWidth - event.clientX);
  };

  const handlePointerUp = (event) => {
    if (!dragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    savePanelWidth();
  };

  return (
    <Box
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={resetPanelWidth}
      sx={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: -4,
        width: 8,
        zIndex: 2,
        cursor: 'col-resize',
        touchAction: 'none',
        display: { xs: 'none', md: 'block' },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 3,
          width: 2,
          bgcolor: dragging ? '#1304FF' : 'transparent',
          transition: 'background-color 0.15s',
        },
        '&:hover::after': { bgcolor: '#1304FF' },
      }}
    />
  );
}
