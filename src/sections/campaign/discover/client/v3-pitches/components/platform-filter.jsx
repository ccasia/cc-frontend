import { useState } from 'react';
import PropTypes from 'prop-types';
import { m, AnimatePresence, useReducedMotion } from 'framer-motion';

import { Box, Menu, Button, Typography } from '@mui/material';

import { PLATFORMS, PLATFORM_LIST } from 'src/utils/platform-metric';

import Iconify from 'src/components/iconify';

import { getFilterPillSx, FilterPillEndIcons } from './filter-pill';

const MENU_PAPER_SX = {
  mt: 0.5,
  p: 1.25,
  bgcolor: 'white',
  boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
  borderRadius: 1.5,
  '& .MuiList-root': { display: 'flex', flexDirection: 'column', gap: 1, p: 0 },
};

const optionSx = (selected, color) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  minWidth: 180,
  py: 0.75,
  px: 1.5,
  fontSize: 13,
  fontWeight: 600,
  color: '#231F20',
  border: '1px solid',
  borderBottom: '3px solid',
  borderColor: selected ? color : '#E7E7E7',
  borderRadius: 0.8,
  bgcolor: 'white',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  boxShadow: selected
    ? `0px 1px 3px rgba(0, 0, 0, 0.08), 0 0 0 2px ${color}26`
    : '0px 1px 3px rgba(0, 0, 0, 0.08)',
  '&:hover': { bgcolor: '#F5F5F5' },
});

/** Two or more platforms show as icons only, so the label is empty. */
const labelOf = (selected) => {
  if (selected.length === 0) return 'Platform';
  if (selected.length === 1) return PLATFORMS[selected[0]]?.label ?? 'Platform';
  return null;
};

const PILL_RING = '#E7ECFF';
const PILL_RING_HOVER = '#D9E0FF';

const EASE_OUT = [0.23, 1, 0.32, 1];

const fadeMotion = (reduceMotion, hiddenScale) => {
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, transform: `scale(${hiddenScale})` };
  return {
    initial: hidden,
    animate: reduceMotion ? { opacity: 1 } : { opacity: 1, transform: 'scale(1)' },
    exit: { ...hidden, transition: { duration: 0.12, ease: EASE_OUT } },
    transition: { duration: 0.18, ease: EASE_OUT },
  };
};

function PlatformIconStack({ selected }) {
  const reduceMotion = useReducedMotion();
  const badges = PLATFORM_LIST.filter(({ value }) => selected.includes(value));

  return (
    <Box
      component="span"
      sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {badges.map(({ value, icon }, index) => (
          <Box
            key={value}
            component={m.span}
            {...fadeMotion(reduceMotion, 0.9)}
            className="platform-badge"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              ml: index === 0 ? 0 : '-6px',
              borderRadius: '50%',
              bgcolor: 'white',
              boxShadow: `0 0 0 2px ${PILL_RING}`,
              transition: 'box-shadow 0.15s ease',
            }}
          >
            <Iconify icon={icon} width={13} />
          </Box>
        ))}
      </AnimatePresence>
    </Box>
  );
}

function PillLabel({ label }) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {label && (
        <m.span key={label} {...fadeMotion(reduceMotion, 0.97)}>
          {label}
        </m.span>
      )}
    </AnimatePresence>
  );
}

PillLabel.propTypes = {
  label: PropTypes.string,
};

PlatformIconStack.propTypes = {
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const ariaLabelOf = (selected) =>
  `Platform filter: ${selected.map((value) => PLATFORMS[value]?.label ?? value).join(', ')}`;

export default function PlatformFilter({ selected, onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const isActive = selected.length > 0;

  const toggle = (value) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  const clear = () => {
    onChange([]);
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        variant="text"
        disableElevation
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-label={selected.length > 1 ? ariaLabelOf(selected) : undefined}
        endIcon={
          <FilterPillEndIcons
            isActive={isActive}
            isOpen={Boolean(anchorEl)}
            onClear={clear}
            clearLabel="Clear platform filters"
          />
        }
        startIcon={isActive ? <PlatformIconStack selected={selected} /> : null}
        sx={{
          ...getFilterPillSx(isActive),
          ...(isActive && { pl: 1 }),
          '& .MuiButton-startIcon': { ml: 0, mr: selected.length > 1 ? 0.5 : 0.75 },
          '&:hover .platform-badge': { boxShadow: `0 0 0 2px ${PILL_RING_HOVER}` },
        }}
      >
        <PillLabel label={labelOf(selected)} />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: MENU_PAPER_SX } }}
      >
        {PLATFORM_LIST.map(({ value, label, icon, color }) => {
          const isSelected = selected.includes(value);
          return (
            <Box
              key={value}
              role="menuitemcheckbox"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => toggle(value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  toggle(value);
                }
              }}
              sx={optionSx(isSelected, color)}
            >
              <Iconify icon={icon} width={18} sx={{ color, flexShrink: 0 }} />
              <Box component="span" sx={{ flex: 1 }}>
                {label}
              </Box>
              {isSelected && (
                <Iconify icon="eva:checkmark-fill" width={16} sx={{ color, flexShrink: 0 }} />
              )}
            </Box>
          );
        })}
        {isActive && (
          <Typography
            onClick={clear}
            sx={{
              fontSize: 12,
              fontWeight: 500,
              color: '#637381',
              cursor: 'pointer',
              textAlign: 'center',
              mt: 0.5,
              '&:hover': { color: '#212B36', textDecoration: 'underline' },
            }}
          >
            Clear all
          </Typography>
        )}
      </Menu>
    </>
  );
}

PlatformFilter.propTypes = {
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
};
