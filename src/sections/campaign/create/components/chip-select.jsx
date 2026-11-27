import PropTypes from 'prop-types';
import { useRef, useState, useLayoutEffect } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import {
  Box,
  Chip,
  Paper,
  Popper,
  SvgIcon,
  Checkbox,
  InputBase,
  IconButton,
  FormControl,
  Autocomplete,
  OutlinedInput,
  FormHelperText,
  ClickAwayListener,
} from '@mui/material';

import Iconify from 'src/components/iconify';

import { EASE_OUT } from './motion';

const ROW_HEIGHT = 36;
const CHIP_HEIGHT = 30;
const EXIT_MS = 120;
const SLIDE_MS = 200;

// The menu look shared by every dropdown in the create-campaign steps
export const menuPaperSx = {
  mt: 0.5,
  p: 0.5,
  bgcolor: '#fff',
  backgroundImage: 'none',
  backdropFilter: 'none',
  border: '1px solid #EBEBEB',
  borderRadius: 1.5,
  boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.08)',
  transformOrigin: 'top',
  '[data-popper-placement^="top"] &': { transformOrigin: 'bottom', mt: 0, mb: 0.5 },
  '@keyframes industryMenuIn': {
    from: { opacity: 0, transform: 'scale(0.97)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  animation: `industryMenuIn 150ms ${EASE_OUT}`,
  '@media (prefers-reduced-motion: reduce)': {
    '@keyframes industryMenuFade': { from: { opacity: 0 }, to: { opacity: 1 } },
    animation: 'industryMenuFade 150ms ease',
  },
  '& .MuiAutocomplete-listbox': {
    p: 0,
    maxHeight: ROW_HEIGHT * 8 + 4 * 7 + ROW_HEIGHT / 2,
  },
  '& .MuiAutocomplete-listbox .MuiAutocomplete-option': {
    minHeight: ROW_HEIGHT,
    px: 1,
    py: 0,
    fontSize: 14,
    borderRadius: 1,
    color: '#3A3A3C',
    '&.Mui-focused': { bgcolor: '#F5F5F5' },
    '&[aria-selected="true"]': { bgcolor: '#F5F7FF', color: '#1340FF', fontWeight: 600 },
    '&[aria-selected="true"].Mui-focused': { bgcolor: '#EBEFFF' },
    '&[aria-disabled="true"]': { opacity: 0.45 },
  },
  '& .MuiAutocomplete-listbox .MuiAutocomplete-option:has(.option-description)': { py: 0.75 },
  '& .MuiAutocomplete-noOptions': { fontSize: 14, px: 1, py: 1 },
};

// The inner Autocomplete draws its own paper; the outer one already has the look
const innerPaperSx = {
  m: 0,
  p: 0,
  border: 0,
  borderRadius: 0,
  boxShadow: 'none',
  bgcolor: 'transparent',
  backgroundImage: 'none',
  backdropFilter: 'none',
};

const searchSx = {
  width: 1,
  height: ROW_HEIGHT,
  px: 1,
  mb: 0.5,
  gap: 1,
  fontSize: 14,
  color: '#3A3A3C',
  borderBottom: '1px solid #F0F0F0',
  '& input::placeholder': { color: '#8E8E93', opacity: 1 },
};

// Few options need no search box. It stays in the DOM, unseen, so arrow keys still work.
const SEARCH_MIN_OPTIONS = 9;
const hiddenSearchSx = {
  position: 'absolute',
  width: 1,
  height: 1,
  opacity: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
};
const NAV_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageUp', 'PageDown'];

const describeSx = {
  display: 'block',
  fontSize: 12,
  lineHeight: '16px',
  fontWeight: 400,
  color: '#8E8E93',
};

// The chip look shared by every multi-pick field in the create-campaign steps
export const tagSx = {
  height: CHIP_HEIGHT,
  border: '1px solid #EBEBEB',
  bgcolor: '#fff',
  color: '#3A3A3C',
  boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
  fontSize: 14,
  transition: `opacity ${EXIT_MS}ms ${EASE_OUT}, transform ${EXIT_MS}ms ${EASE_OUT}`,
  '&:hover, &.Mui-focusVisible': { bgcolor: '#F8F8F8' },
  '& .MuiChip-icon': { ml: '6px', mr: '-2px' },
  '& .MuiChip-deleteIcon': {
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
    width: 18,
    height: 18,
    // Same footprint as the old 18px icon, so chips keep their width
    m: '0 3px 0 -4px',
    borderRadius: '50%',
    color: '#8E8E93',
    transition: `background-color 120ms ease, color 120ms ease, transform 120ms ${EASE_OUT}`,
    // A bigger click area than the circle you see
    '&::before': { content: '""', position: 'absolute', inset: -5 },
    '@media (hover: hover) and (pointer: fine)': {
      '&:hover': { bgcolor: 'rgba(255, 86, 48, 0.12)', color: '#FF5630' },
    },
    '&:active': { transform: 'scale(0.88)' },
  },
};

const leavingSx = {
  opacity: 0,
  transform: 'scale(0.9)',
  pointerEvents: 'none',
  '@media (prefers-reduced-motion: reduce)': { transform: 'none' },
};

const iconButtonSx = { p: 0.5, color: '#637381' };

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

export function CloseGlyph(props) {
  return (
    <Box component="span" {...props}>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </Box>
  );
}

function ArrowDownIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 16a1 1 0 0 1-.64-.23l-6-5a1 1 0 1 1 1.28-1.54L12 13.71l5.36-4.32a1 1 0 0 1 1.41.15 1 1 0 0 1-.14 1.46l-6 4.83A1 1 0 0 1 12 16z" />
    </SvgIcon>
  );
}

// Renders the inner Autocomplete's list in place, inside our own popper
// MUI sizes its popper to the field; inside the padded menu that overflows the right edge
function InlineList({ disablePortal, anchorEl, open, style, ...other }) {
  return <div {...other} style={{ ...style, width: undefined }} />;
}

InlineList.propTypes = {
  disablePortal: PropTypes.bool,
  anchorEl: PropTypes.any,
  open: PropTypes.bool,
  style: PropTypes.object,
};

const passThrough = (option) => option;

// Inside, both modes work on an array; `single` reads and writes one string
const readValue = (raw, single) => {
  if (single) return raw ? [raw] : [];
  return Array.isArray(raw) ? raw : [];
};

// Multi-select with chips. The field only holds the chips, so it keeps its height
// when it opens or closes; the search box lives at the top of the menu instead.
// `max` caps the picks: the other options grey out once it is reached. `getTitle`
// gives the short text for chips and the menu, `getDescription` an optional grey line.
// `single` holds one pick as a plain string: a pick replaces the chip and closes the menu.
// `getIcon` adds an icon (e.g. a flag) to each chip and option.
// `clearable` gives a `single` field the end clear button too, for optional fields.
export default function ChipSelect({
  name,
  options,
  placeholder,
  max,
  single = false,
  clearable = false,
  noOptionsText = 'No matches',
  getTitle = passThrough,
  getDescription,
  getIcon,
}) {
  const { control } = useFormContext();
  const {
    field,
    fieldState: { error },
  } = useController({ name, control });
  const value = readValue(field.value, single);
  const full = !!max && value.length >= max;

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const anchorRef = useRef(null);
  const touchRef = useRef(false);
  // Enter only picks after the user moved the highlight or typed, so a fresh open
  // cannot toggle the option MUI highlights by itself
  const navigatedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const searchable = options.length >= SEARCH_MIN_OPTIONS;
  const [search, setSearch] = useState('');

  // A dismissed chip fades out first, then leaves the value
  const [leaving, setLeaving] = useState([]);
  const latest = useRef({ value, onChange: field.onChange });
  latest.current = { value, onChange: field.onChange };

  // FLIP: chip positions from before a change, so the others can slide to their new place
  const before = useRef(null);
  const committed = useRef(false);
  const commit = (next) => {
    committed.current = true;
    const chips = rootRef.current?.querySelectorAll('[data-chip]') ?? [];
    before.current = {
      height: rootRef.current?.offsetHeight ?? 0,
      rects: new Map(Array.from(chips, (el) => [el.dataset.chip, el.getBoundingClientRect()])),
    };
    latest.current.onChange(single ? (next[0] ?? '') : next);
  };

  const dismiss = (option) => {
    if (leaving.includes(option)) return;
    const remove = () => commit(latest.current.value.filter((item) => item !== option));
    if (reduceMotion()) {
      remove();
      return;
    }
    setLeaving((prev) => [...prev, option]);
    setTimeout(() => {
      setLeaving((prev) => prev.filter((item) => item !== option));
      remove();
    }, EXIT_MS);
  };

  const dismissAll = () => {
    const gone = [...value];
    const remove = () => commit(latest.current.value.filter((item) => !gone.includes(item)));
    if (reduceMotion()) {
      remove();
      return;
    }
    setLeaving(gone);
    setTimeout(() => {
      setLeaving([]);
      remove();
    }, EXIT_MS);
  };

  // A chip the form removes by itself (e.g. an option that no longer applies) fades out
  // like a dismissed one, so the user sees it go instead of it just vanishing
  const [ghosts, setGhosts] = useState([]);
  const shown = useRef(value);
  const valueKey = value.join('\u0000');
  useLayoutEffect(() => {
    const current = valueKey ? valueKey.split('\u0000') : [];
    const gone = shown.current.filter((option) => !current.includes(option));
    shown.current = current;
    const external = !committed.current;
    committed.current = false;
    if (external && gone.length && !reduceMotion()) setGhosts(gone);
  }, [valueKey]);

  useLayoutEffect(() => {
    if (!ghosts.length) return undefined;
    const fades = Array.from(rootRef.current?.querySelectorAll('[data-ghost]') ?? [], (el) =>
      el.animate(
        [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(0.9)' },
        ],
        { duration: EXIT_MS, easing: EASE_OUT, fill: 'forwards' }
      )
    );
    const id = setTimeout(() => setGhosts([]), EXIT_MS);
    return () => {
      clearTimeout(id);
      fades.forEach((fade) => fade.cancel());
    };
  }, [ghosts]);

  useLayoutEffect(() => {
    const snapshot = before.current;
    if (!snapshot) return;
    before.current = null;
    if (reduceMotion()) return;
    const { rects } = snapshot;

    // A chip row came or went: ease the field's height, so the content below glides
    // instead of jumping. Clipped, so a new row's chips stay inside the border.
    const root = rootRef.current;
    const height = root?.offsetHeight ?? 0;
    if (root && Math.abs(height - snapshot.height) > 1) {
      root.style.clipPath = 'inset(-6px -6px 0 -6px)';
      const grow = root.animate([{ height: `${snapshot.height}px` }, { height: `${height}px` }], {
        duration: SLIDE_MS,
        easing: EASE_OUT,
      });
      grow.onfinish = () => {
        root.style.clipPath = '';
      };
      grow.oncancel = grow.onfinish;
    }

    root?.querySelectorAll('[data-chip]').forEach((el) => {
      const was = rects.get(el.dataset.chip);
      if (!was) {
        el.animate(
          [
            { opacity: 0, transform: 'scale(0.9)' },
            { opacity: 1, transform: 'scale(1)' },
          ],
          { duration: 150, easing: EASE_OUT }
        );
        return;
      }
      const now = el.getBoundingClientRect();
      const dx = was.left - now.left;
      const dy = was.top - now.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], {
        duration: SLIDE_MS,
        easing: EASE_OUT,
      });
    });
  });

  const openMenu = () => {
    const el = rootRef.current;
    if (!el) return;
    // The menu stays where it opened: if picking wraps a new chip row, the field grows
    // behind the menu instead of pushing the options away from the mouse
    const openHeight = el.getBoundingClientRect().height;
    anchorRef.current = {
      contextElement: el,
      getBoundingClientRect: () => {
        const rect = el.getBoundingClientRect();
        return new DOMRect(rect.left, rect.top, rect.width, openHeight);
      },
    };
    touchRef.current = isTouch();
    navigatedRef.current = false;
    setOpen(true);
  };

  const closeMenu = ({ refocus = false } = {}) => {
    setOpen(false);
    setSearch('');
    field.onBlur();
    if (refocus) triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      openMenu();
    } else if (event.key === 'Backspace' && value.length) {
      commit(value.slice(0, -1));
    }
  };

  const handleSearchKeyDown = (event) => {
    if (NAV_KEYS.includes(event.key)) navigatedRef.current = true;
    if (event.key === 'Enter' && !navigatedRef.current && !search) {
      event.preventDefault();
      event.defaultMuiPrevented = true;
    }
    // Backspace in an empty search must not remove chips the user cannot see from here
    if (event.key === 'Backspace' && !search) event.defaultMuiPrevented = true;
    if (event.key === 'Tab') {
      event.preventDefault();
      closeMenu({ refocus: true });
    }
  };

  // The search box must stay inside the dialog, or its focus trap pulls focus back out
  const container = rootRef.current?.closest('.MuiDialog-container') ?? undefined;

  return (
    <>
      <FormControl fullWidth error={!!error}>
        <OutlinedInput
          ref={rootRef}
          readOnly
          size="small"
          inputRef={(node) => {
            triggerRef.current = node;
            field.ref(node);
          }}
          onClick={() => (open ? closeMenu({ refocus: true }) : openMenu())}
          // While open, keep focus in the search box so a click here closes, not reopens
          onMouseDown={(event) => open && event.preventDefault()}
          inputProps={{
            role: 'combobox',
            'aria-haspopup': 'listbox',
            'aria-expanded': open,
            onKeyDown: handleTriggerKeyDown,
          }}
          startAdornment={
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '6px',
                flex: 1,
                minWidth: 0,
              }}
            >
              {value.length === 0 && ghosts.length === 0 && (
                <Box component="span" sx={{ pl: '5px', fontSize: 14, color: '#919EAB' }}>
                  {placeholder}
                </Box>
              )}
              {value.map((option) => (
                <Chip
                  key={option}
                  size="small"
                  variant="outlined"
                  tabIndex={-1}
                  label={getTitle(option)}
                  icon={getIcon?.(option)}
                  data-chip={option}
                  deleteIcon={<CloseGlyph aria-label={`Remove ${getTitle(option)}`} />}
                  onDelete={() => dismiss(option)}
                  sx={{ ...tagSx, ...(leaving.includes(option) && leavingSx) }}
                />
              ))}
              {ghosts
                .filter((option) => !value.includes(option))
                .map((option) => (
                  <Chip
                    key={`ghost-${option}`}
                    aria-hidden
                    size="small"
                    variant="outlined"
                    tabIndex={-1}
                    label={getTitle(option)}
                    icon={getIcon?.(option)}
                    data-ghost
                    deleteIcon={<CloseGlyph />}
                    onDelete={() => {}}
                    sx={{ ...tagSx, pointerEvents: 'none' }}
                  />
                ))}
            </Box>
          }
          endAdornment={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                alignSelf: 'flex-start',
                height: CHIP_HEIGHT,
                ml: 0.5,
              }}
            >
              {/* With a small cap there is little to clear, and one slip loses every pick */}
              {(single ? clearable : !max) && value.length > 0 && (
                <IconButton
                  className="chip-select-clear"
                  aria-label={single ? 'Clear' : 'Clear all'}
                  onClick={(event) => {
                    event.stopPropagation();
                    dismissAll();
                  }}
                  sx={iconButtonSx}
                >
                  <Iconify icon="mingcute:close-line" width={18} />
                </IconButton>
              )}
              <ArrowDownIcon
                sx={{
                  width: 18,
                  height: 18,
                  mx: 0.5,
                  color: '#637381',
                  transform: open ? 'rotate(180deg)' : 'none',
                  transition: `transform 150ms ${EASE_OUT}`,
                }}
              />
            </Box>
          }
          sx={{
            minHeight: 50,
            py: '9px',
            pl: '9px',
            pr: 1,
            rowGap: '6px',
            cursor: 'pointer',
            '& .MuiOutlinedInput-input': {
              width: 0,
              minWidth: 0,
              flex: '0 0 0',
              p: 0,
              caretColor: 'transparent',
              cursor: 'pointer',
            },
            // The clear button shows on hover or focus, like other dropdowns
            '& .chip-select-clear': { visibility: 'hidden' },
            '&:hover .chip-select-clear, &.Mui-focused .chip-select-clear': {
              visibility: 'visible',
            },
            ...(open && {
              '& .chip-select-clear': { visibility: 'visible' },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: (theme) =>
                  error ? theme.palette.error.main : theme.palette.text.primary,
                borderWidth: 2,
              },
            }),
          }}
        />

        {(!!error || !!max) && (
          <FormHelperText>{error?.message ?? `${value.length} of ${max} selected`}</FormHelperText>
        )}
      </FormControl>

      {/* Outside the FormControl, so the search box is not a second input of this field */}
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        container={container}
        placement="bottom-start"
        style={{ width: rootRef.current?.offsetWidth }}
        // Above anything inside the dialog, e.g. the image's Replace button (zIndex 9)
        sx={{ zIndex: (theme) => theme.zIndex.modal }}
      >
        <ClickAwayListener
          // On touch the search box never takes focus, so blur cannot close the menu
          onClickAway={(event) => {
            if (!rootRef.current?.contains(event.target)) closeMenu();
          }}
        >
          <Paper
            sx={menuPaperSx}
            // Clicks on the menu's padding must not take focus from the search box
            onMouseDown={(event) => {
              if (event.target.tagName !== 'INPUT') event.preventDefault();
            }}
          >
            <Autocomplete
              open
              multiple
              autoHighlight={!!search}
              disableCloseOnSelect
              options={options}
              value={value}
              inputValue={search}
              onInputChange={(_, next, reason) => reason === 'input' && setSearch(next)}
              onChange={(_, next) => {
                if (single) {
                  // A pick replaces the chip; the current pick again just closes the menu
                  const picked = next.find((option) => !value.includes(option));
                  if (picked) commit([picked]);
                  closeMenu({ refocus: true });
                  return;
                }
                if (max && next.length > max) return;
                commit(next);
              }}
              onClose={(_, reason) => {
                if (reason === 'escape') closeMenu({ refocus: true });
                else if (reason === 'blur') closeMenu();
              }}
              noOptionsText={noOptionsText}
              getOptionDisabled={(option) => full && !value.includes(option)}
              renderTags={() => null}
              PopperComponent={InlineList}
              slotProps={{ paper: { sx: innerPaperSx } }}
              renderOption={(liProps, option, { selected }) => {
                const { key, ...optionProps } = liProps;
                const description = getDescription?.(option);
                return (
                  <li key={key} {...optionProps}>
                    {!single && (
                      <Checkbox
                        size="small"
                        checked={selected}
                        disableRipple
                        tabIndex={-1}
                        sx={{
                          p: 0,
                          mr: 1,
                          '& .MuiSvgIcon-root': { fontSize: 18 },
                          '&.Mui-checked': { color: '#1340FF' },
                        }}
                      />
                    )}
                    {getIcon && (
                      <Box component="span" sx={{ display: 'flex', mr: 1 }}>
                        {getIcon(option)}
                      </Box>
                    )}
                    {description ? (
                      <span>
                        <Box component="span" sx={{ fontWeight: 500 }}>
                          {getTitle(option)}
                        </Box>
                        <Box component="span" className="option-description" sx={describeSx}>
                          {description}
                        </Box>
                      </span>
                    ) : (
                      getTitle(option)
                    )}
                  </li>
                );
              }}
              renderInput={(params) => (
                <InputBase
                  ref={params.InputProps.ref}
                  inputProps={{ ...params.inputProps, readOnly: !searchable }}
                  // No focus on touch, so the phone keyboard does not cover the list
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus={!touchRef.current}
                  placeholder={searchable ? 'Search…' : undefined}
                  onKeyDown={handleSearchKeyDown}
                  startAdornment={
                    searchable && (
                      <Iconify icon="eva:search-fill" width={16} sx={{ color: '#8E8E93' }} />
                    )
                  }
                  sx={searchable ? searchSx : hiddenSearchSx}
                />
              )}
            />
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
}

ChipSelect.propTypes = {
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  placeholder: PropTypes.string,
  max: PropTypes.number,
  single: PropTypes.bool,
  clearable: PropTypes.bool,
  noOptionsText: PropTypes.string,
  getTitle: PropTypes.func,
  getDescription: PropTypes.func,
  getIcon: PropTypes.func,
};
