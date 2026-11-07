import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';
import { m, AnimatePresence, useReducedMotion } from 'framer-motion';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import Iconify from 'src/components/iconify';
import { SECONDARY_ACTION_SX } from 'src/components/campaign/action-button-styles';

import DraftSaveIndicator, { hasDraftStatus } from '../draft-save-indicator';

const EDGE = 3;
const SIZE = 40;
const RADIUS = 8;
const BORDER = 1;
const EASE_OUT = [0.23, 1, 0.32, 1];
// 'local' is the normal wait before the server save, so only real failures count
const PROBLEM = new Set(['error', 'conflict']);

const TINT = {
  error: '#FFF1EE',
  conflict: '#FFF1EE',
};

const closeSx = (joined) => ({
  ...SECONDARY_ACTION_SX,
  width: SIZE,
  minWidth: SIZE,
  height: SIZE,
  p: 0,
  pb: `${EDGE}px`,
  flexShrink: 0,
  // The X sits in the middle of the face, above the raised edge
  '&:active': { ...SECONDARY_ACTION_SX['&:active'], pb: '1px' },
  ...(joined && { borderTopRightRadius: 0, borderBottomRightRadius: 0 }),
});

export default function CloseSaveGroup({
  onClose,
  disabled,
  status,
  lastSavedAt,
  onRetry,
  showStatus,
}) {
  const reduceMotion = useReducedMotion();
  const contentRef = useRef(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const previousStatus = useRef(null);
  const hasSaved = useRef(false);

  const visible = showStatus && hasDraftStatus(status);

  // The box glides open and shut, but snaps between labels: autosave changes the
  // label often, and a width animation each time is noise that also costs layout
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!visible) setSettled(false);
  }, [visible]);
  const slide = reduceMotion ? { duration: 0 } : { duration: 0.25, ease: EASE_OUT };

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(() => setContentWidth(node.offsetWidth));
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  // Green flash for the first save and for a save that recovers from a problem,
  // not for every autosave, so it still means something when it shows
  useEffect(() => {
    const before = previousStatus.current;
    previousStatus.current = status;
    if (status !== 'saved' || before === 'saved') return;
    if (!hasSaved.current || PROBLEM.has(before)) setFlashKey((key) => key + 1);
    hasSaved.current = true;
  }, [status]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
      <IconButton aria-label="Close" sx={closeSx(visible)} disabled={disabled} onClick={onClose}>
        <Iconify icon="material-symbols:close" width={18} color="#231F20" />
      </IconButton>

      <AnimatePresence initial={false}>
        {visible && (
          // The box itself (fill, border, edge) is what animates, so it grows in and
          // shrinks away whole; the content inside only measures the label
          <Box
            component={m.div}
            key="save-status"
            initial={{ width: 0 }}
            animate={{ width: contentWidth ? contentWidth + BORDER : 'auto' }}
            exit={{ width: 0, transition: slide }}
            transition={settled ? { duration: 0 } : slide}
            // The exit (width 0) also completes; only a finished entrance counts
            onAnimationComplete={(target) => target?.width !== 0 && setSettled(true)}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
              height: SIZE,
              boxSizing: 'border-box',
              bgcolor: TINT[status] ?? '#FFFFFF',
              border: `${BORDER}px solid #E8E8E8`,
              borderLeft: 0,
              borderRadius: `0 ${RADIUS}px ${RADIUS}px 0`,
              boxShadow: `inset 0px -${EDGE}px 0px #E7E7E7`,
              transition: 'background-color 200ms ease',
            }}
          >
            <Box
              ref={contentRef}
              sx={{
                position: 'relative',
                width: 'max-content',
                height: 1,
                display: 'flex',
                alignItems: 'center',
                pl: 1.25,
                pr: 1.5,
                pb: `${EDGE - BORDER}px`,
              }}
            >
              {flashKey > 0 && (
                <Box
                  key={flashKey}
                  component={m.div}
                  aria-hidden
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.25 }}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bottom: EDGE,
                    bgcolor: 'rgba(34, 197, 94, 0.12)',
                    borderRadius: `0 ${RADIUS}px 0 0`,
                    pointerEvents: 'none',
                  }}
                />
              )}
              <Box sx={{ position: 'relative' }}>
                <DraftSaveIndicator
                  bare
                  status={status}
                  lastSavedAt={lastSavedAt}
                  onRetry={onRetry}
                />
              </Box>
            </Box>
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}

CloseSaveGroup.propTypes = {
  onClose: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  status: PropTypes.string,
  lastSavedAt: PropTypes.instanceOf(Date),
  onRetry: PropTypes.func,
  showStatus: PropTypes.bool,
};
