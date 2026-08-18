import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import { alpha } from '@mui/material/styles';
import { Box, Stack, Button, Dialog, Typography, DialogContent } from '@mui/material';

import Iconify from 'src/components/iconify';

const BODY_FONT = 'Inter Display, Inter, sans-serif';
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE = [0.16, 1, 0.3, 1];

// How long the success state stays up before the form closes behind it.
// Long enough to actually read the draft summary, not long enough to nag.
const SAVED_DWELL = 1800;

// Grace period before a discard actually runs. Long enough to change your mind.
const DISCARD_DELAY = 10000;

const GREEN = '#22C55E';
const RED = '#FF5630';
const BLUE = '#1340FF';

const PRESSABLE = {
  textTransform: 'none',
  borderRadius: 1,
  fontFamily: BODY_FONT,
  fontWeight: 600,
  transition: `transform 160ms ${EASE_OUT}`,
  '&:active': { transform: 'scale(0.98)' },
};

const TITLE_SX = {
  color: '#221f20',
  fontFamily: 'Instrument Serif, serif',
  fontWeight: 550,
  fontSize: { xs: '2rem', sm: '2.3rem' },
  lineHeight: 1.05,
};

const BODY_SX = {
  fontFamily: BODY_FONT,
  fontSize: '16px',
  lineHeight: '22px',
  textAlign: 'center',
};

/**
 * Shown when the admin closes the campaign form while real work exists.
 *
 * Owns its own phases so the same dialog can morph in place rather than
 * vanishing -- a form that just disappears leaves the admin guessing whether
 * the draft landed, and a discard that fires instantly leaves no way back.
 */
export default function CloseDraftDialog({
  open,
  campaignName,
  onKeepEditing,
  onSaveDraft,
  onDiscard,
  onDone,
}) {
  // ask | saving | saved | discardPending | discarding
  const [phase, setPhase] = useState('ask');
  const [secondsLeft, setSecondsLeft] = useState(DISCARD_DELAY / 1000);
  const [savedAt, setSavedAt] = useState(null);
  const reduceMotion = useReducedMotion();

  const isSaved = phase === 'saved';
  const isPending = phase === 'discardPending';
  const isDiscarding = phase === 'discarding';
  const showDiscard = isPending || isDiscarding;
  const busy = phase === 'saving' || isDiscarding;

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
      setSavedAt(new Date());
      setPhase('saved');
    } catch (error) {
      setPhase('ask');
    }
  };

  // Both panels stay mounted and cross-fade in place. Swapping them with
  // AnimatePresence would fade one out before the other starts, and would
  // resize the Paper as the buttons leave -- this keeps the box still.
  const fade = (visible, lift) => {
    if (reduceMotion) return { opacity: visible ? 1 : 0 };
    return {
      opacity: visible ? 1 : 0,
      y: visible ? 0 : lift,
      filter: visible ? 'blur(0px)' : 'blur(4px)',
    };
  };

  const CROSSFADE = { duration: 0.32, ease: EASE };

  let accent = BLUE;
  if (isSaved) accent = GREEN;
  else if (showDiscard) accent = RED;

  const glyphs = [
    { key: 'draft', glyph: '\u{1F4DD}', on: !isSaved && !showDiscard },
    { key: 'done', glyph: '✅', on: isSaved },
    { key: 'bin', glyph: '\u{1F5D1}️', on: showDiscard },
  ];

  const dismissable = phase === 'ask';

  return (
    <Dialog
      open={open}
      onClose={dismissable ? onKeepEditing : undefined}
      maxWidth="xs"
      fullWidth
      aria-labelledby="close-draft-title"
      PaperProps={{ sx: { borderRadius: 3, textAlign: 'center', overflow: 'hidden' } }}
    >
      <DialogContent sx={{ px: 4, pt: 4, pb: 3 }}>
        <Stack spacing={2} alignItems="center">
          {/* One circle throughout: it recolours and swaps its glyph rather than
              being replaced, so the dialog reads as a single object changing state. */}
          <Box
            component={m.div}
            animate={{
              backgroundColor: accent,
              scale: (isSaved || isPending) && !reduceMotion ? [1, 1.12, 1] : 1,
            }}
            transition={{ duration: 0.45, ease: EASE }}
            sx={{
              position: 'relative',
              width: 72,
              height: 72,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              flexShrink: 0,
            }}
          >
            {/* Stacked, not swapped: the glyphs cross-fade through each other. */}
            {glyphs.map(({ key, glyph, on }) => (
              <Box
                key={key}
                component={m.span}
                aria-hidden={!on}
                animate={
                  reduceMotion
                    ? { opacity: on ? 1 : 0 }
                    : { opacity: on ? 1 : 0, scale: on ? 1 : 0.7 }
                }
                transition={CROSSFADE}
                sx={{ position: 'absolute', lineHeight: 1 }}
              >
                {glyph}
              </Box>
            ))}
          </Box>

          {/* The question panel stays in flow, so it sets the height the box
              keeps in every state. The others are overlaid on top of it. */}
          <Box sx={{ position: 'relative', width: 1 }}>
            <Stack
              component={m.div}
              aria-hidden={isSaved || showDiscard}
              animate={fade(!isSaved && !showDiscard, -8)}
              transition={CROSSFADE}
              spacing={2}
              alignItems="center"
              sx={{ width: 1, pointerEvents: isSaved || showDiscard ? 'none' : 'auto' }}
            >
              <Typography id="close-draft-title" sx={TITLE_SX}>
                Save your progress?
              </Typography>

              <Typography color="text.secondary" sx={BODY_SX}>
                {campaignName ? (
                  <>
                    <Box component="span" sx={{ color: '#221f20', fontWeight: 600 }}>
                      {campaignName}
                    </Box>{' '}
                    is not published yet. Keep it as a draft and finish it any time.
                  </>
                ) : (
                  'This campaign is not published yet. Keep it as a draft and finish it any time.'
                )}
              </Typography>

              <Stack spacing={1} sx={{ width: 1, pt: 1 }}>
                <LoadingButton
                  fullWidth
                  autoFocus
                  variant="contained"
                  onClick={handleSave}
                  loading={phase === 'saving'}
                  disabled={busy || isSaved || showDiscard}
                  sx={{
                    ...PRESSABLE,
                    bgcolor: '#1a1a1a',
                    color: 'white',
                    fontSize: '16px',
                    height: 48,
                    borderBottom: '3px solid #000',
                    '&:hover': { bgcolor: '#000' },
                  }}
                >
                  Save as draft
                </LoadingButton>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={onKeepEditing}
                  disabled={busy || isSaved || showDiscard}
                  sx={{
                    ...PRESSABLE,
                    fontSize: '16px',
                    height: 44,
                    color: '#221f20',
                    borderColor: '#e7e7e7',
                    borderBottom: '3px solid #e7e7e7',
                    '&:hover': { borderColor: '#b0b0b0', bgcolor: 'transparent' },
                  }}
                >
                  Keep editing
                </Button>
              </Stack>

              <Button
                onClick={() => setPhase('discardPending')}
                disabled={busy || isSaved || showDiscard}
                sx={{
                  ...PRESSABLE,
                  fontSize: '14px',
                  color: '#8E8E93',
                  textDecorationColor: 'currentColor',
                  '&:hover': {
                    bgcolor: 'transparent',
                    color: RED,
                    textDecoration: 'underline',
                  },
                }}
              >
                Discard this campaign
              </Button>
            </Stack>

            {/* Saved confirmation */}
            <Stack
              component={m.div}
              aria-hidden={!isSaved}
              animate={fade(isSaved, 8)}
              transition={CROSSFADE}
              alignItems="center"
              justifyContent="center"
              spacing={2.5}
              sx={{ position: 'absolute', inset: 0, px: 1, pointerEvents: 'none' }}
            >
              <Stack spacing={1.5} alignItems="center">
                <Typography
                  component={m.p}
                  animate={fade(isSaved, 10)}
                  transition={{ ...CROSSFADE, delay: isSaved ? 0.06 : 0 }}
                  sx={TITLE_SX}
                >
                  Campaign Saved as Draft
                </Typography>

                <Typography
                  component={m.p}
                  color="text.secondary"
                  animate={fade(isSaved, 10)}
                  transition={{ ...CROSSFADE, delay: isSaved ? 0.12 : 0 }}
                  sx={BODY_SX}
                >
                  Pick it up any time from your campaigns list.
                </Typography>
              </Stack>

              {/* Names what was stored and where to find it again. Kept flat --
                  the green circle above already carries the status colour. */}
              <Stack
                component={m.div}
                animate={fade(isSaved, 12)}
                transition={{ ...CROSSFADE, delay: isSaved ? 0.18 : 0 }}
                spacing={1.25}
                sx={{
                  width: 1,
                  px: 1.75,
                  py: 1.5,
                  borderRadius: 1.5,
                  border: '1px solid #E7E7E7',
                  textAlign: 'left',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.25}>
                  <Iconify
                    icon="solar:document-bold"
                    width={20}
                    sx={{ color: '#637381', flexShrink: 0 }}
                  />

                  <Typography
                    noWrap
                    sx={{
                      flexGrow: 1,
                      minWidth: 0,
                      fontFamily: BODY_FONT,
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#221f20',
                    }}
                  >
                    {campaignName || 'Untitled campaign'}
                  </Typography>

                  <Stack direction="row" alignItems="center" spacing={0.625} sx={{ flexShrink: 0 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: GREEN }} />
                    <Typography
                      sx={{
                        fontFamily: BODY_FONT,
                        fontWeight: 600,
                        fontSize: 12,
                        color: '#118D57',
                      }}
                    >
                      Draft
                    </Typography>
                  </Stack>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ color: '#919EAB' }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Iconify icon="solar:clock-circle-outline" width={14} />
                    <Typography sx={{ fontFamily: BODY_FONT, fontSize: 12 }}>
                      {savedAt
                        ? savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Just now'}
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
                    <Iconify icon="solar:folder-outline" width={14} sx={{ flexShrink: 0 }} />
                    <Typography noWrap sx={{ fontFamily: BODY_FONT, fontSize: 12 }}>
                      Campaigns / Drafts
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>

            {/* Discard grace period -- runs itself out unless cancelled */}
            <Stack
              component={m.div}
              aria-hidden={!showDiscard}
              animate={fade(showDiscard, 8)}
              transition={CROSSFADE}
              alignItems="center"
              justifyContent="space-between"
              sx={{
                position: 'absolute',
                inset: 0,
                px: 1,
                pointerEvents: showDiscard ? 'auto' : 'none',
              }}
            >
              <Stack spacing={1.5} alignItems="center">
                <Typography sx={TITLE_SX}>Discarding campaign</Typography>

                <Typography color="text.secondary" sx={BODY_SX}>
                  Everything you filled in will be deleted. This cannot be undone.
                </Typography>
              </Stack>

              <Stack spacing={1.5} alignItems="center" sx={{ width: 1 }}>
                <Typography
                  sx={{
                    fontFamily: BODY_FONT,
                    fontWeight: 600,
                    fontSize: 14,
                    color: RED,
                  }}
                >
                  {isDiscarding
                    ? 'Discarding...'
                    : `Discarding in ${secondsLeft} second${secondsLeft === 1 ? '' : 's'}`}
                </Typography>

                <Box
                  sx={{
                    width: 1,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: alpha(RED, 0.16),
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component={m.div}
                    animate={{ scaleX: isPending ? 0 : 1 }}
                    transition={{ duration: isPending ? DISCARD_DELAY / 1000 : 0, ease: 'linear' }}
                    sx={{ height: 1, bgcolor: RED, transformOrigin: 'left center' }}
                  />
                </Box>

                <Stack spacing={1} sx={{ width: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setPhase('ask')}
                    disabled={isDiscarding}
                    sx={{
                      ...PRESSABLE,
                      bgcolor: '#1a1a1a',
                      color: 'white',
                      fontSize: '16px',
                      height: 48,
                      borderBottom: '3px solid #000',
                      '&:hover': { bgcolor: '#000' },
                    }}
                  >
                    Cancel, keep my work
                  </Button>

                  <LoadingButton
                    fullWidth
                    onClick={runDiscard}
                    loading={isDiscarding}
                    sx={{
                      ...PRESSABLE,
                      fontSize: '14px',
                      height: 40,
                      color: RED,
                      textDecorationColor: 'currentColor',
                      '&:hover': { bgcolor: alpha(RED, 0.08), textDecoration: 'underline' },
                    }}
                  >
                    Discard now
                  </LoadingButton>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

CloseDraftDialog.propTypes = {
  open: PropTypes.bool,
  campaignName: PropTypes.string,
  onKeepEditing: PropTypes.func,
  onSaveDraft: PropTypes.func,
  onDiscard: PropTypes.func,
  onDone: PropTypes.func,
};
