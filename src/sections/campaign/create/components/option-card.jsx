import PropTypes from 'prop-types';
import { useContext, createContext } from 'react';

import { Box, Switch, Collapse, Typography, useMediaQuery } from '@mui/material';

import Iconify from 'src/components/iconify';

import { EASE_OUT } from './motion';

export const BLUE = '#1340FF';

const hoverOnly = (styles) => ({ '@media (hover: hover) and (pointer: fine)': styles });

// A flat card with one border; blue when picked or on
export const cardSx = (active, { press = true } = {}) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-start',
  gap: 1.5,
  p: '14px 16px',
  borderRadius: '8px',
  border: '1px solid',
  borderColor: active ? BLUE : '#E8E8E8',
  bgcolor: active ? '#F5F7FF' : '#FFFFFF',
  cursor: 'pointer',
  userSelect: 'none',
  transition: `transform 140ms ${EASE_OUT}, border-color 150ms ease, background-color 150ms ease`,
  ...hoverOnly({
    '&:hover': { borderColor: active ? BLUE : '#D6D6D6', bgcolor: active ? '#F5F7FF' : '#F8F8F8' },
  }),
  ...(press && {
    '@media (prefers-reduced-motion: no-preference)': { '&:active': { transform: 'scale(0.99)' } },
  }),
  '&:has(input:focus-visible)': { outline: `2px solid ${BLUE}`, outlineOffset: 2 },
});

export const titleSx = (active) => ({
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
  color: active ? BLUE : '#231F20',
  transition: 'color 150ms ease',
});

export const descriptionSx = { fontSize: 13, lineHeight: '18px', color: '#636366', mt: 0.25 };

export const cardIconSx = (active) => ({
  flexShrink: 0,
  color: active ? BLUE : '#8E8E93',
  transition: 'color 150ms ease',
});

export const blueSwitchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: '#FFFFFF' },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: BLUE, opacity: 1 },
};

// An on/off setting as a card. Only the top row toggles, so links or buttons in
// `children` keep their own clicks. `footerOpen` slides the children in and out.
export function ToggleCard({
  icon,
  title,
  description,
  checked,
  onChange,
  children,
  footerOpen = true,
}) {
  return (
    <Box
      sx={{
        ...cardSx(checked, { press: false }),
        display: 'block',
        p: 0,
        cursor: 'default',
        ...hoverOnly({
          '&:has(> label:hover)': {
            borderColor: checked ? BLUE : '#D6D6D6',
            bgcolor: checked ? '#F5F7FF' : '#F8F8F8',
          },
        }),
      }}
    >
      <Box
        component="label"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: '14px 16px',
          cursor: 'pointer',
        }}
      >
        <Iconify icon={icon} width={20} sx={cardIconSx(checked)} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={titleSx(checked)}>{title}</Typography>
          {description && <Typography sx={descriptionSx}>{description}</Typography>}
        </Box>
        <Switch
          checked={!!checked}
          onChange={(event) => onChange(event.target.checked)}
          sx={{ my: -1, mr: -1, flexShrink: 0, ...blueSwitchSx }}
        />
      </Box>
      {children && (
        <Collapse in={footerOpen} timeout={200} easing={EASE_OUT}>
          <Box sx={{ pl: '52px', pr: 2, pb: 1.75, mt: -0.75 }}>{children}</Box>
        </Collapse>
      )}
    </Box>
  );
}

ToggleCard.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.node,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  children: PropTypes.node,
  footerOpen: PropTypes.bool,
};

// Rows inside a SettingsGroup get padding, a hover fill and a divider
const GroupContext = createContext(false);

// One bordered list of on/off settings, split by thin lines
export function SettingsGroup({ children }) {
  return (
    <GroupContext.Provider value>
      <Box
        sx={{
          border: '1px solid #E8E8E8',
          borderRadius: '8px',
          overflow: 'hidden',
          bgcolor: '#FFFFFF',
          '& > * + *': { borderTop: '1px solid #F0F0F0' },
          '&:has(input:focus-visible)': { borderColor: '#D6D6D6' },
        }}
      >
        {children}
      </Box>
    </GroupContext.Provider>
  );
}

SettingsGroup.propTypes = { children: PropTypes.node };

// A setting without a card: title, grey note and switch. In a SettingsGroup it
// becomes one row of the list.
export function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
  children,
  footerOpen = true,
}) {
  const grouped = useContext(GroupContext);
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  return (
    <Box
      sx={
        grouped
          ? {
              transition: 'background-color 150ms ease',
              ...hoverOnly({ '&:has(> label:hover)': { bgcolor: '#FAFAFA' } }),
            }
          : undefined
      }
    >
      <Box
        component="label"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          ...(grouped && { p: '10px 12px' }),
        }}
      >
        {icon && <Iconify icon={icon} width={20} sx={{ flexShrink: 0, color: '#8E8E93' }} />}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={
              grouped
                ? { fontSize: 14, fontWeight: 600, lineHeight: '20px', color: '#231F20' }
                : { fontWeight: 700, fontSize: '0.875rem', lineHeight: '22px', color: 'black' }
            }
          >
            {title}
          </Typography>
          {description && (
            <Typography sx={{ ...descriptionSx, mt: 0, color: '#8E8E93' }}>
              {description}
            </Typography>
          )}
        </Box>
        <Switch
          checked={!!checked}
          onChange={(event) => onChange(event.target.checked)}
          size={grouped ? 'small' : 'medium'}
          sx={{ my: grouped ? 0 : -0.75, mr: grouped ? -0.5 : -1, flexShrink: 0 }}
        />
      </Box>
      {children && (
        // Closing is a response, so it is quicker than opening. The note fades as its
        // row moves, and with reduced motion it only fades.
        <Collapse
          in={footerOpen}
          timeout={reduceMotion ? 0 : { enter: 200, exit: 150 }}
          easing={EASE_OUT}
        >
          <Box
            sx={{
              opacity: footerOpen ? 1 : 0,
              transition: `opacity ${footerOpen ? 200 : 150}ms ease`,
              ...(grouped ? { pr: 1.5, pb: 1.25, mt: -0.25, pl: 1.5 } : { pt: 1 }),
              ...(icon && { pl: grouped ? '44px' : '32px' }),
            }}
          >
            {children}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}
ToggleRow.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.node,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  children: PropTypes.node,
  footerOpen: PropTypes.bool,
};

// A link inside a ToggleRow's text. A span, not a button, so the row's label still
// toggles the switch; the link stops its own click from reaching the label.
export function InlineAction({ children, onClick, sx }) {
  const run = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  };

  return (
    <Box
      component="span"
      role="button"
      tabIndex={0}
      onClick={run}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') run(event);
      }}
      sx={{
        color: BLUE,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        borderRadius: '4px',
        ...hoverOnly({ '&:hover': { textDecoration: 'underline' } }),
        '&:focus-visible': { outline: `2px solid ${BLUE}`, outlineOffset: 1 },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

InlineAction.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func.isRequired,
  sx: PropTypes.object,
};

const AMBER = '#FFAB00';
const AMBER_TEXT = '#7A4A00';

// A note under a setting: what is wrong and why it matters.
// White, with an amber line on the left.
export function SettingNote({ title, children }) {
  return (
    <Box
      role="note"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: '8px 8px 8px 12px',
        borderRadius: '8px',
        border: '1px solid #F0E3C4',
        borderLeft: `3px solid ${AMBER}`,
        bgcolor: '#FFFDF7',
        color: AMBER_TEXT,
      }}
    >
      <Typography sx={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: '18px', color: 'inherit' }}>
        <Box component="span" sx={{ fontWeight: 600 }}>
          {title}
        </Box>{' '}
        {children}
      </Typography>
    </Box>
  );
}

SettingNote.propTypes = {
  title: PropTypes.node.isRequired,
  children: PropTypes.node,
};
