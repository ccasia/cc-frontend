import PropTypes from 'prop-types';
import { useRef, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import FieldStatus from './field-status';
import { BORDER, METRIC_ICONS } from '../constants';

const ACTIVE_BG = '#F4F4F5';

const useScrollIntoView = (active) => {
  const ref = useRef(null);
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [active]);
  return ref;
};

const interactionProps = (onHover, onClick) => ({
  onMouseEnter: () => onHover(true),
  onMouseLeave: () => onHover(false),
  onClick,
});

const valueSx = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };

export function FieldTile({ field, active, onHover, onClick }) {
  const ref = useScrollIntoView(active);

  return (
    <Box
      ref={ref}
      {...interactionProps(onHover, onClick)}
      sx={{
        p: 1.5,
        cursor: 'pointer',
        borderRadius: 1.25,
        border: BORDER,
        borderColor: active ? '#C4C4C4' : '#E7E7E7',
        transition: 'border-color 120ms ease',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography variant="caption" noWrap sx={{ flex: 1, color: 'text.secondary' }}>
          {field.label}
        </Typography>
        <FieldStatus field={field} />
      </Stack>
      <Typography variant="h5" sx={{ ...valueSx, mt: 0.25 }}>
        {field.value}
      </Typography>
    </Box>
  );
}

FieldTile.propTypes = {
  field: PropTypes.object.isRequired,
  active: PropTypes.bool,
  onHover: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
};

export function FieldRow({ field, variant, active, onHover, onClick }) {
  const ref = useScrollIntoView(active);
  const icon = variant === 'icon' && METRIC_ICONS[field.key];
  const percent = variant === 'bar' && field.number != null ? Math.min(field.number, 100) : null;

  return (
    <Box
      ref={ref}
      {...interactionProps(onHover, onClick)}
      sx={{
        px: 1.5,
        py: 1,
        cursor: 'pointer',
        borderRadius: 1,
        bgcolor: active ? ACTIVE_BG : 'transparent',
        transition: 'background-color 120ms ease',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25}>
        {icon && (
          <Iconify
            icon={icon}
            width={18}
            sx={{ color: active ? 'text.primary' : 'text.secondary', flexShrink: 0, transition: 'color 120ms ease' }}
          />
        )}
        <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {field.label}
        </Typography>
        <FieldStatus field={field} />
        <Typography variant="subtitle2" sx={valueSx}>
          {field.value}
        </Typography>
      </Stack>

      {percent != null && (
        <Box sx={{ mt: 0.75, height: 4, borderRadius: 2, bgcolor: '#EFEFEF', overflow: 'hidden' }}>
          <Box
            sx={{
              height: 1,
              width: `${percent}%`,
              borderRadius: 2,
              bgcolor: active ? '#454F5B' : '#919EAB',
              transition: 'width 400ms cubic-bezier(0.23, 1, 0.32, 1), background-color 120ms ease',
            }}
          />
        </Box>
      )}
    </Box>
  );
}

FieldRow.propTypes = {
  field: PropTypes.object.isRequired,
  variant: PropTypes.oneOf(['icon', 'bar', 'row']).isRequired,
  active: PropTypes.bool,
  onHover: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
};
