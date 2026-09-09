import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';
import { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import { alpha } from '@mui/material/styles';
import { Box, Stack, Button, Dialog, Typography, DialogContent } from '@mui/material';

import {
  TEXT_ACTION_SX,
  DIALOG_PAPER_SX,
  PRIMARY_ACTION_SX,
  SECONDARY_ACTION_SX,
} from 'src/components/campaign/action-button-styles';

const BODY_FONT = 'InterDisplay';
const EASE = [0.16, 1, 0.3, 1];

// How long the success state stays up before the form closes behind it.
// Long enough to read the confirmation, not long enough to nag.
const SAVED_DWELL = 1800;

// Grace period before a discard actually runs. Long enough to change your mind.
const DISCARD_DELAY = 10000;

const GREEN = '#22C55E';
const RED = '#D4321C';
const BLUE = '#1340FF';

// The box resizes over the full beat; the text swaps inside that window so the
// two never look like separate events.
const HEIGHT_T = { duration: 0.42, ease: EASE };
const FADE_OUT_T = { duration: 0.16, ease: 'easeOut' };
const FADE_IN_T = { duration: 0.26, ease: EASE, delay: 0.12 };

const TITLE_SX = {
  fontFamily: 'Instrument Serif, serif',
  fontWeight: 400,
  fontSize: 36,
  lineHeight: '40px',
  textAlign: 'center',
  color: '#231F20',
};

const BODY_SX = {
  fontFamily: BODY_FONT,
  fontWeight: 400,
  fontSize: 16,
  lineHeight: '20px',
  textAlign: 'center',
  color: '#636366',
};

/**
 * Shown when the admin closes the campaign form while real work exists.
 *
 * Owns its own phases so the same dialog can morph in place rather than
 * vanishing -- a form that just disappears leaves the admin guessing whether
 * the draft landed, and a discard that fires instantly leaves no way back.
 */
export default function CloseDraftDialog({ open, onKeepEditing, onSaveDraft, onDiscard, onDone }) {
  // ask | saving | saved | discardPending | discarding
  const [phase, setPhase] = useState('ask');
  const [secondsLeft, setSecondsLeft] = useState(DISCARD_DELAY / 1000);
  const reduceMotion = useReducedMotion();

  const isSaved = phase === 'saved';
  const isPending = phase === 'discardPending';
  const isDiscarding = phase === 'discarding';
  const showDiscard = isPending || isDiscarding;
  const busy = phase === 'saving' || isDiscarding;

  let activePanel = 'ask';
  if (isSaved) activePanel = 'saved';
  else if (showDiscard) activePanel = 'discard';

  // Every open starts from the question again.
  useEffect(() => {
    if (open) setPhase('ask');
  }, [open]);

  // Let the confirmation be read, then hand control back to the form.
  useEffect(() => {
    if (!isSaved) return undefined;
    const id = setTimeout(onDone, SAVED_DWELL);
    return () => clearTimeout(id);
  }, [isSaved, onDone]);

  const runDiscard = useCallback(async () => {
    setPhase('discarding');
    try {
      await onDiscard();
      onDone();
    } catch (error) {
      setPhase('ask');
    }
  }, [onDiscard, onDone]);

  // The grace period. Leaving this phase for any reason cancels it.
  useEffect(() => {
    if (!isPending) return undefined;

    setSecondsLeft(DISCARD_DELAY / 1000);
    const tick = setInterval(() => setSecondsLeft((n) => Math.max(0, n - 1)), 1000);
    const fire = setTimeout(runDiscard, DISCARD_DELAY);

    return () => {
      clearInterval(tick);
      clearTimeout(fire);
    };
  }, [isPending, runDiscard]);

  const handleSave = async () => {
    setPhase('saving');
    try {
      await onSaveDraft();
      setPhase('saved');
    } catch (error) {
      setPhase('ask');
    }
  };

  // Every panel stays mounted so they can cross-fade through each other. The
  // active one is left in normal flow, which means the box has a correct
  // natural height even before the first measurement -- the inactive ones are
  // lifted out of flow so they cannot pad it out.
  const askRef = useRef(null);
  const savedRef = useRef(null);
  const discardRef = useRef(null);
  const [heights, setHeights] = useState({});

  useLayoutEffect(() => {
    if (!open) return undefined;

    // Refs sit on plain divs, so there is no component in between that could
    // swallow them.
    const nodes = { ask: askRef.current, saved: savedRef.current, discard: discardRef.current };

    const measure = () => {
      const measured = {};
      Object.entries(nodes).forEach(([key, node]) => {
        const height = node?.offsetHeight;
        if (height) measured[key] = height;
      });
      setHeights((current) => {
        const changed = Object.entries(measured).some(([key, h]) => current[key] !== h);
        return changed ? { ...current, ...measured } : current;
      });
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    Object.values(nodes).forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [open]);

  let accent = BLUE;
  if (isSaved) accent = GREEN;
  else if (showDiscard) accent = RED;

  const glyphs = [
    { key: 'draft', glyph: '\u{1F4DD}', on: activePanel === 'ask' },
    { key: 'done', glyph: '✅', on: isSaved },
    { key: 'bin', glyph: '\u{1F5D1}️', on: showDiscard },
  ];

  // Opacity and a few pixels of travel only. Animating `filter: blur()` is what
  // made this stutter -- it forces a full repaint every frame.
  const panelProps = (key) => {
    const on = activePanel === key;
    let transition = on ? FADE_IN_T : FADE_OUT_T;
    if (reduceMotion) transition = { duration: 0 };
    return {
      component: m.div,
      'aria-hidden': !on,
      initial: false,
      animate: reduceMotion ? { opacity: on ? 1 : 0 } : { opacity: on ? 1 : 0, y: on ? 0 : 6 },
      transition,
      sx: {
        width: '100%',
        // Only the active panel holds space; the rest float above it.
        ...(on ? {} : { position: 'absolute', top: 0, left: 0, right: 0 }),
        pointerEvents: on ? 'auto' : 'none',
      },
    };
  };

  const targetHeight = heights[activePanel];

  return (
    <Dialog
      open={open}
      onClose={phase === 'ask' ? onKeepEditing : undefined}
      aria-labelledby="close-draft-title"
      PaperProps={{ sx: DIALOG_PAPER_SX }}
    >
      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <Stack spacing={2} alignItems="center" sx={{ width: '100%' }}>
          {/* One circle throughout: it recolours and swaps its glyph rather than
              being replaced, so the dialog reads as a single object changing state. */}
          <Box
            component={m.div}
            initial={false}
            animate={{
              backgroundColor: accent,
              scale: (isSaved || isPending) && !reduceMotion ? [1, 1.12, 1] : 1,
            }}
            transition={{ duration: 0.45, ease: EASE }}
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '500px',
              fontFamily: 'Instrument Serif, serif',
              fontSize: 36,
              lineHeight: '40px',
              flexShrink: 0,
            }}
          >
            {/* Stacked, not swapped: the glyphs cross-fade through each other. */}
            {glyphs.map(({ key, glyph, on }) => (
              <Box
                key={key}
                component={m.span}
                aria-hidden={!on}
                initial={false}
                animate={
                  reduceMotion
                    ? { opacity: on ? 1 : 0 }
                    : { opacity: on ? 1 : 0, scale: on ? 1 : 0.7 }
                }
                transition={on ? FADE_IN_T : FADE_OUT_T}
                sx={{ position: 'absolute', lineHeight: 1 }}
              >
                {glyph}
              </Box>
            ))}
          </Box>

          <Box
            component={m.div}
            initial={false}
            animate={targetHeight ? { height: targetHeight } : {}}
            transition={reduceMotion ? { duration: 0 } : HEIGHT_T}
            sx={{ position: 'relative', width: '100%', overflow: 'hidden' }}
          >
            {/* Question */}
            <Box {...panelProps('ask')}>
              <div ref={askRef}>
                <Stack spacing={3}>
                  <Stack spacing={0.5}>
                    <Typography id="close-draft-title" component="h2" sx={TITLE_SX}>
                      Save your progress?
                    </Typography>

                    <Typography sx={BODY_SX}>
                      This campaign is not published yet. Save it as a draft and complete it
                      anytime.
                    </Typography>
                  </Stack>

                  <Stack spacing={1}>
                    <LoadingButton
                      fullWidth
                      autoFocus
                      onClick={handleSave}
                      loading={phase === 'saving'}
                      disabled={busy}
                      sx={PRIMARY_ACTION_SX}
                    >
                      Save as Draft
                    </LoadingButton>

                    <Button
                      fullWidth
                      onClick={onKeepEditing}
                      disabled={busy}
                      sx={SECONDARY_ACTION_SX}
                    >
                      Keep Editing
                    </Button>

                    <Button
                      fullWidth
                      onClick={() => setPhase('discardPending')}
                      disabled={busy}
                      sx={{ ...TEXT_ACTION_SX, '&:hover': { bgcolor: 'transparent', color: RED } }}
                    >
                      Discard this Campaign
                    </Button>
                  </Stack>
                </Stack>
              </div>
            </Box>

            {/* Saved confirmation */}
            <Box {...panelProps('saved')}>
              <div ref={savedRef}>
                <Stack spacing={0.5}>
                  <Typography component="h2" sx={TITLE_SX}>
                    Campaign Saved as Draft
                  </Typography>

                  <Typography sx={BODY_SX}>
                    Pick it up any time from your campaigns list.
                  </Typography>
                </Stack>
              </div>
            </Box>

            {/* Discard grace period -- runs itself out unless cancelled */}
            <Box {...panelProps('discard')}>
              <div ref={discardRef}>
                <Stack spacing={3}>
                  <Stack spacing={0.5}>
                    <Typography component="h2" sx={TITLE_SX}>
                      Discarding Campaign
                    </Typography>

                    <Typography sx={BODY_SX}>
                      Everything you filled in will be deleted. This cannot be undone.
                    </Typography>
                  </Stack>

                  <Stack spacing={1.5} alignItems="center">
                    <Typography
                      sx={{
                        fontFamily: BODY_FONT,
                        fontWeight: 600,
                        fontSize: 14,
                        lineHeight: '18px',
                        color: RED,
                      }}
                    >
                      {isDiscarding
                        ? 'Discarding…'
                        : `Discarding in ${secondsLeft} second${secondsLeft === 1 ? '' : 's'}`}
                    </Typography>

                    <Box
                      sx={{
                        width: '100%',
                        height: 4,
                        borderRadius: 2,
                        bgcolor: alpha(RED, 0.16),
                        overflow: 'hidden',
                      }}
                    >
                      {/* Drains over the grace period, then holds at empty while
                          the discard runs -- snapping back to full would read as
                          the countdown restarting. */}
                      <Box
                        component={m.div}
                        initial={false}
                        animate={{ scaleX: showDiscard ? 0 : 1 }}
                        transition={{
                          duration: isPending ? DISCARD_DELAY / 1000 : 0,
                          ease: 'linear',
                        }}
                        sx={{ height: 1, bgcolor: RED, transformOrigin: 'left center' }}
                      />
                    </Box>
                  </Stack>

                  <Stack spacing={1}>
                    <Button
                      fullWidth
                      onClick={() => setPhase('ask')}
                      disabled={isDiscarding}
                      sx={PRIMARY_ACTION_SX}
                    >
                      Cancel, Keep My Work
                    </Button>

                    <LoadingButton
                      fullWidth
                      onClick={runDiscard}
                      loading={isDiscarding}
                      sx={{
                        ...TEXT_ACTION_SX,
                        color: RED,
                        '&:hover': { bgcolor: alpha(RED, 0.08), color: RED },
                      }}
                    >
                      Discard now
                    </LoadingButton>
                  </Stack>
                </Stack>
              </div>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

CloseDraftDialog.propTypes = {
  open: PropTypes.bool,
  onKeepEditing: PropTypes.func,
  onSaveDraft: PropTypes.func,
  onDiscard: PropTypes.func,
  onDone: PropTypes.func,
};
