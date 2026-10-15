import PropTypes from 'prop-types';
import React, { useId, useRef, useMemo, useState } from 'react';

import { Box, Stack, Paper, Popper, InputBase, ButtonBase, Typography } from '@mui/material';

import { NoteAvatar, NOTE_COLORS } from './note-parts';
import { encodeMentions, getMentionQuery } from './mentions';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export default function NoteComposer({ participants, posting, onSubmit }) {
  const listId = useId();
  const inputRef = useRef(null);
  const boxRef = useRef(null);

  const [draft, setDraft] = useState('');
  const [pinDraft, setPinDraft] = useState(false);
  const [mention, setMention] = useState(null);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    if (!mention) return [];
    const query = mention.query.toLowerCase();
    return participants.filter((p) => p.name?.toLowerCase().includes(query)).slice(0, 6);
  }, [mention, participants]);

  const showMentions = matches.length > 0;
  const canPost = Boolean(draft.trim()) && !posting;

  const syncMention = (value, caret) => {
    setMention(getMentionQuery(value, caret));
    setActive(0);
  };

  const insertMention = (participant) => {
    const caret = inputRef.current?.selectionStart ?? draft.length;
    const inserted = `@${participant.name} `;
    setDraft(`${draft.slice(0, mention.start)}${inserted}${draft.slice(caret)}`);
    setMention(null);

    const position = mention.start + inserted.length;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(position, position);
    });
  };

  const submit = async () => {
    if (!canPost) return;
    const posted = await onSubmit({
      text: encodeMentions(draft.trim(), participants),
      pinned: pinDraft,
    });
    if (posted) {
      setDraft('');
      setPinDraft(false);
    }
  };

  const handleKeyDown = (event) => {
    if (showMentions) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActive((i) => (i + step + matches.length) % matches.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        insertMention(matches[active]);
        return;
      }
      if (event.key === 'Escape') {
        // Close the suggestions without closing the drawer.
        event.stopPropagation();
        setMention(null);
        return;
      }
    }

    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <Box sx={{ px: 3, pt: 1.75, pb: 2.5, borderTop: `1px solid ${NOTE_COLORS.border}` }}>
      <Box
        ref={boxRef}
        sx={{
          px: 1.5,
          py: 1.25,
          borderRadius: 1.25,
          border: `1px solid ${NOTE_COLORS.inputBorder}`,
          '&:focus-within': { borderColor: NOTE_COLORS.accent },
        }}
      >
        <InputBase
          inputRef={inputRef}
          multiline
          minRows={3}
          maxRows={8}
          fullWidth
          value={draft}
          placeholder="Add a note for campaign admins. Type @ to mention."
          onChange={(event) => {
            setDraft(event.target.value);
            syncMention(event.target.value, event.target.selectionStart);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setMention(null)}
          inputProps={{
            'aria-label': 'New note',
            'aria-autocomplete': 'list',
            'aria-controls': showMentions ? listId : undefined,
            'aria-expanded': showMentions,
            'aria-activedescendant': showMentions ? `${listId}-${active}` : undefined,
          }}
          sx={{ fontSize: 14, lineHeight: 1.45, p: 0 }}
        />

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.75 }}>
          <ButtonBase
            disableRipple
            aria-pressed={pinDraft}
            onClick={() => setPinDraft((v) => !v)}
            sx={{
              px: 1.125,
              py: 0.5,
              borderRadius: 999,
              fontSize: 12.5,
              border: `1px solid ${pinDraft ? NOTE_COLORS.accent : '#E5E5E5'}`,
              color: pinDraft ? NOTE_COLORS.accent : NOTE_COLORS.secondary,
            }}
          >
            Pin as sidenote
          </ButtonBase>
          <Box sx={{ flex: 1 }} />
          <Typography sx={{ fontSize: 12, color: NOTE_COLORS.secondary }}>
            {isMac ? '⌘↵' : 'Ctrl+↵'}
          </Typography>
          <ButtonBase
            disableRipple
            disabled={!canPost}
            onClick={submit}
            sx={{
              px: 2,
              py: 0.875,
              borderRadius: 0.875,
              fontSize: 13,
              fontWeight: 500,
              color: '#FFFFFF',
              bgcolor: NOTE_COLORS.accent,
              '&.Mui-disabled': { bgcolor: '#B8C4FF', color: '#FFFFFF' },
            }}
          >
            {posting ? 'Posting…' : 'Post'}
          </ButtonBase>
        </Stack>
      </Box>

      <Typography sx={{ mt: 1, fontSize: 12, color: NOTE_COLORS.secondary }}>
        Not visible to creators or clients.
      </Typography>

      <Popper
        open={showMentions}
        anchorEl={boxRef.current}
        placement="top-start"
        disablePortal
        sx={{ zIndex: 1, width: boxRef.current?.offsetWidth }}
      >
        <Paper
          id={listId}
          role="listbox"
          sx={{ mb: 0.5, p: 0.5, borderRadius: 1.5, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
        >
          {matches.map((participant, index) => (
            <Stack
              key={participant.id}
              id={`${listId}-${index}`}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              role="option"
              aria-selected={index === active}
              direction="row"
              alignItems="center"
              spacing={1}
              // Keep focus in the textarea while picking.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insertMention(participant)}
              onMouseEnter={() => setActive(index)}
              sx={{
                px: 1,
                py: 0.75,
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: index === active ? NOTE_COLORS.accentSoft : 'transparent',
              }}
            >
              <NoteAvatar user={participant} size={22} />
              <Typography sx={{ fontSize: 13.5, color: NOTE_COLORS.text }}>
                {participant.name}
              </Typography>
            </Stack>
          ))}
        </Paper>
      </Popper>
    </Box>
  );
}

NoteComposer.propTypes = {
  participants: PropTypes.array.isRequired,
  posting: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
};
