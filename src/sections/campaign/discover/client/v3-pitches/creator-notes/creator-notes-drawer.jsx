import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import React, { useRef, useEffect } from 'react';
import { m, MotionConfig, AnimatePresence } from 'framer-motion';

import {
  Box,
  Stack,
  Drawer,
  Tooltip,
  ButtonBase,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

import NoteComposer from './note-composer';
import { NoteText, NoteAvatar, NOTE_COLORS, formatNoteTime } from './note-parts';
import {
  usePostCreatorNote,
  useCreatorNoteThread,
  useSetCreatorNotePinned,
  useSetCreatorNotesFollowing,
} from './api';

const labelSx = {
  fontSize: 11,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: NOTE_COLORS.secondary,
};

const EASE = [0.4, 0, 0.2, 1];

// Rises in with a short accent tint, so a note that lands mid-read is easy to spot.
const enterFrom = { opacity: 0, y: 8, backgroundColor: 'rgba(243, 245, 255, 1)' };
const enterTo = {
  opacity: 1,
  y: 0,
  backgroundColor: 'rgba(243, 245, 255, 0)',
  transition: {
    duration: 0.28,
    ease: EASE,
    backgroundColor: { duration: 1.4, delay: 0.3, ease: 'easeOut' },
  },
};
const exitTo = { opacity: 0, scale: 0.98, transition: { duration: 0.18 } };

const getHandle = (user) => {
  const creator = user?.creator;
  const username = creator?.instagramUser?.username || creator?.tiktokUser?.username;
  return username ? `@${username}` : '';
};

const MotionStack = m(Stack);

function NoteItem({ note, isMine, onPin }) {
  return (
    <MotionStack
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      direction="row"
      spacing={1.25}
      sx={{
        '& .note-pin': { opacity: 0 },
        '&:hover .note-pin, &:focus-within .note-pin': { opacity: 1 },
        '@media (hover: none)': { '& .note-pin': { opacity: 1 } },
      }}
    >
      <NoteAvatar user={note.author} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: NOTE_COLORS.text }}>
            {note.author?.name}
            {isMine && ' (you)'}
          </Typography>
          <Typography sx={{ fontSize: 12, color: NOTE_COLORS.secondary }}>
            {formatNoteTime(note.createdAt)}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <ButtonBase
            className="note-pin"
            disableRipple
            onClick={() => onPin(note)}
            sx={{
              fontSize: 12,
              color: NOTE_COLORS.secondary,
              transition: 'opacity 150ms ease',
              '&:hover': { color: NOTE_COLORS.accent },
            }}
          >
            Pin
          </ButtonBase>
        </Stack>
        <Typography
          sx={{
            mt: 0.375,
            fontSize: 14,
            lineHeight: 1.45,
            color: NOTE_COLORS.text,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          }}
        >
          <NoteText text={note.text} />
        </Typography>
      </Box>
    </MotionStack>
  );
}

NoteItem.propTypes = {
  note: PropTypes.object.isRequired,
  isMine: PropTypes.bool,
  onPin: PropTypes.func.isRequired,
};

export default function CreatorNotesDrawer({ campaignId, creator: creatorProp, onClose }) {
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  // Keep showing the last creator while the drawer slides out.
  const lastCreatorRef = useRef(creatorProp);
  if (creatorProp) lastCreatorRef.current = creatorProp;
  const creator = lastCreatorRef.current;
  const creatorId = creator?.id;
  const { thread, isLoading, error, refetch } = useCreatorNoteThread(campaignId, creatorId);
  const postNote = usePostCreatorNote(campaignId, creatorId);
  const setPinned = useSetCreatorNotePinned(campaignId, creatorId);
  const setFollowing = useSetCreatorNotesFollowing(campaignId, creatorId);
  const scrollRef = useRef(null);

  const notes = thread?.notes ?? [];
  const pinned = thread?.pinned ?? null;
  const participants = thread?.participants ?? [];
  const following = thread?.following ?? true;

  // Whatever was there when this creator's thread first loaded does not animate.
  const loadedRef = useRef({ creatorId: null, noteIds: new Set(), pinnedId: null });
  if (thread && loadedRef.current.creatorId !== creatorId) {
    loadedRef.current = {
      creatorId,
      noteIds: new Set([...notes, pinned].filter(Boolean).map((n) => n.id)),
      pinnedId: pinned?.id ?? null,
    };
  }
  const isFresh = (id) => !loadedRef.current.noteIds.has(id);

  const scrolledForRef = useRef(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !thread) return;
    // Jump on open, glide when a note arrives.
    const firstForCreator = scrolledForRef.current !== creatorId;
    scrolledForRef.current = creatorId;
    el.scrollTo({ top: el.scrollHeight, behavior: firstForCreator ? 'auto' : 'smooth' });
  }, [notes.length, creatorId, thread]);

  const fail = (message) => enqueueSnackbar(message, { variant: 'error' });

  const handlePost = async (body) => {
    try {
      await postNote.mutateAsync(body);
      return true;
    } catch {
      fail('Could not post the note. Try again.');
      return false;
    }
  };

  const handlePin = (note, pin) =>
    setPinned.mutate(
      { noteId: note.id, pinned: pin },
      { onError: () => fail(pin ? 'Could not pin the note.' : 'Could not unpin the note.') }
    );

  const handleFollow = () =>
    setFollowing.mutate(!following, {
      onError: () => fail('Could not update notifications for this thread.'),
    });

  const renderBody = () => {
    if (isLoading) {
      return <CircularProgress size={24} sx={{ m: 'auto' }} />;
    }

    if (error) {
      return (
        <Typography sx={{ m: 'auto', fontSize: 14, color: NOTE_COLORS.secondary }}>
          Could not load notes.{' '}
          <ButtonBase
            onClick={() => refetch()}
            sx={{ fontSize: 'inherit', color: NOTE_COLORS.accent, verticalAlign: 'baseline' }}
          >
            Retry
          </ButtonBase>
        </Typography>
      );
    }

    if (!pinned && notes.length === 0) {
      return (
        <Typography
          sx={{
            m: 'auto',
            textAlign: 'center',
            fontSize: 14,
            lineHeight: 1.5,
            color: NOTE_COLORS.secondary,
          }}
        >
          No notes on {creator?.name} yet.
          <br />
          Anything you write is visible to admins on this campaign only.
        </Typography>
      );
    }

    return (
      <AnimatePresence initial={false} mode="popLayout">
        {pinned && (
          <Box
            key={`pinned-${pinned.id}`}
            component={m.div}
            layout
            initial={
              pinned.id === loadedRef.current.pinnedId ? false : { opacity: 0, y: -6, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: EASE } }}
            exit={exitTo}
            sx={{ bgcolor: NOTE_COLORS.surface, borderRadius: 1.25, px: 1.75, py: 1.5 }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={labelSx}>Sidenote · Pinned</Typography>
              <ButtonBase
                disableRipple
                onClick={() => handlePin(pinned, false)}
                sx={{ fontSize: 12, color: NOTE_COLORS.accent }}
              >
                Unpin
              </ButtonBase>
            </Stack>
            <Typography
              sx={{
                mt: 0.75,
                fontSize: 14,
                lineHeight: 1.45,
                color: NOTE_COLORS.text,
                whiteSpace: 'pre-wrap',
              }}
            >
              <NoteText text={pinned.text} />
            </Typography>
            <Typography sx={{ mt: 0.75, fontSize: 12, color: NOTE_COLORS.secondary }}>
              {pinned.author?.name} · {formatNoteTime(pinned.pinnedAt || pinned.createdAt)}
            </Typography>
          </Box>
        )}

        {notes.map((note) => (
          <Box
            key={note.id}
            component={m.div}
            layout="position"
            initial={isFresh(note.id) ? enterFrom : false}
            animate={enterTo}
            exit={exitTo}
            // Room for the tint to show around the text.
            sx={{ mx: -1, px: 1, py: 0.5, borderRadius: 1 }}
          >
            <NoteItem
              note={note}
              isMine={note.author?.id === user?.id}
              onPin={(n) => handlePin(n, true)}
            />
          </Box>
        ))}
      </AnimatePresence>
    );
  };

  return (
    <Drawer
      anchor="right"
      open={Boolean(creatorProp)}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 440,
          maxWidth: '100vw',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.12)',
        },
      }}
      slotProps={{ backdrop: { sx: { bgcolor: 'rgba(20,20,24,0.18)' } } }}
    >
      <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: `1px solid ${NOTE_COLORS.border}` }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <NoteAvatar user={creator} size={40} sx={{ color: '#A0A0A6', bgcolor: '#EDEDEF' }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={labelSx}>Admin notes</Typography>
            <Typography noWrap sx={{ mt: 0.25, fontSize: 18, color: NOTE_COLORS.text }}>
              {creator?.name}
            </Typography>
            {getHandle(creator) && (
              <Typography sx={{ mt: 0.25, fontSize: 13, color: NOTE_COLORS.secondary }}>
                {getHandle(creator)}
              </Typography>
            )}
          </Box>
          <IconButton
            aria-label="Close notes"
            onClick={onClose}
            sx={{ width: 30, height: 30, borderRadius: 0.875, border: '1px solid #E5E5E5' }}
          >
            <Iconify icon="mingcute:close-line" width={16} />
          </IconButton>
        </Stack>

        {participants.length > 0 && (
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mt: 2 }}>
            <Stack direction="row" sx={{ pl: 0.75 }}>
              {participants.slice(0, 5).map((p) => (
                <Tooltip key={p.id} title={p.name} arrow>
                  <span>
                    <NoteAvatar
                      user={p}
                      size={26}
                      sx={{ ml: -0.75, border: '2px solid #FFFFFF' }}
                    />
                  </span>
                </Tooltip>
              ))}
            </Stack>
            <Typography sx={{ flex: 1, fontSize: 12.5, color: NOTE_COLORS.secondary }}>
              {participants.length} campaign {participants.length === 1 ? 'admin' : 'admins'} in
              this thread
            </Typography>
            <Tooltip
              title={following ? 'You get notified about new notes' : 'Only @mentions notify you'}
              arrow
            >
              <ButtonBase
                disableRipple
                aria-pressed={following}
                onClick={handleFollow}
                sx={{
                  px: 1.25,
                  py: 0.625,
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 500,
                  border: '1px solid #E5E5E5',
                  color: following ? '#1F8A70' : NOTE_COLORS.secondary,
                }}
              >
                {following ? 'Following' : 'Muted'}
              </ButtonBase>
            </Tooltip>
          </Stack>
        )}
      </Box>

      <MotionConfig reducedMotion="user">
        <Stack
          ref={scrollRef}
          spacing={1.25}
          // popLayout positions exiting notes against this box.
          sx={{ position: 'relative', flex: 1, overflowY: 'auto', px: 3, py: 2 }}
        >
          {renderBody()}
        </Stack>
      </MotionConfig>

      <NoteComposer
        key={creatorId}
        participants={participants}
        posting={postNote.isPending}
        onSubmit={handlePost}
      />
    </Drawer>
  );
}

CreatorNotesDrawer.propTypes = {
  campaignId: PropTypes.string,
  /** Null closes the drawer. */
  creator: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
