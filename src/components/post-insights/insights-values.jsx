import PropTypes from 'prop-types';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import { groupFields, METRIC_ICONS } from 'src/sections/insight-ocr/constants';

import { groupIcon, fieldLabel, groupTitle, formatDuration, HIGHLIGHT_KEYS } from './utils';

const numberSx = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };
// Views is not in METRIC_ICONS, because that list also decides the Interactions group.
const HIGHLIGHT_ICONS = { views: 'solar:play-circle-linear', ...METRIC_ICONS };

function Highlights({ fields }) {
  const highlights = HIGHLIGHT_KEYS.map((key) => fields.find((f) => f.key === key)).filter(Boolean);
  if (!highlights.length) return null;

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1,
        gridTemplateColumns: `repeat(${Math.min(highlights.length, 5)}, 1fr)`,
      }}
    >
      {highlights.map((field) => (
        <Box
          key={field.key}
          sx={{ px: 1.25, py: 1, borderRadius: '10px', bgcolor: '#FFFFFF', minWidth: 0 }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: '#636366' }}>
            <Iconify icon={HIGHLIGHT_ICONS[field.key]} width={14} sx={{ flexShrink: 0 }} />
            <Typography noWrap title={field.label} sx={{ fontSize: 12 }}>
              {field.key === 'views' ? 'Views' : fieldLabel(field)}
            </Typography>
          </Stack>
          <Typography
            noWrap
            sx={{ ...numberSx, mt: 0.25, fontSize: 18, fontWeight: 600, color: '#231F20' }}
          >
            {formatDuration(field.value)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

Highlights.propTypes = { fields: PropTypes.array.isRequired };

// Shadows appear only on the edge that still has content (CSS "local" vs "scroll" backgrounds).
const SCROLL_SHADOWS = {
  background: [
    'linear-gradient(#FFFFFF 30%, rgba(255,255,255,0)) top / 100% 32px no-repeat local',
    'linear-gradient(rgba(255,255,255,0), #FFFFFF 70%) bottom / 100% 32px no-repeat local',
    'radial-gradient(farthest-side at 50% 0, rgba(0,0,0,0.12), rgba(0,0,0,0)) top / 100% 10px no-repeat scroll',
    'radial-gradient(farthest-side at 50% 100%, rgba(0,0,0,0.12), rgba(0,0,0,0)) bottom / 100% 10px no-repeat scroll',
    '#FFFFFF',
  ].join(', '),
};

function ScrollList({ children }) {
  const ref = useRef(null);
  const [hasMore, setHasMore] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (el) setHasMore(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);

  useEffect(() => {
    update();
  }, [update, children]);

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        ref={ref}
        onScroll={update}
        sx={{ maxHeight: 280, overflowY: 'auto', borderRadius: '10px', px: 1.5, ...SCROLL_SHADOWS }}
      >
        {children}
      </Box>

      {hasMore && (
        <ButtonBase
          onClick={() => ref.current?.scrollBy({ top: 200, behavior: 'smooth' })}
          sx={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            gap: 0.5,
            px: 1.25,
            py: 0.5,
            borderRadius: 5,
            fontSize: 12,
            fontWeight: 600,
            color: '#FFFFFF',
            bgcolor: '#231F20',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.18)',
            '&:hover': { bgcolor: '#000000' },
          }}
        >
          More values
          <Iconify icon="eva:arrow-ios-downward-fill" width={14} />
        </ButtonBase>
      )}
    </Box>
  );
}

ScrollList.propTypes = { children: PropTypes.node };

export default function InsightsValues({ fields }) {
  const rest = fields.filter((f) => !HIGHLIGHT_KEYS.includes(f.key));

  return (
    <Stack spacing={2}>
      <Highlights fields={fields} />

      {!!rest.length && (
        <ScrollList>
          {groupFields(rest).map((group) => (
            <Box key={group.label} sx={{ py: 1.25, '& + &': { borderTop: '1px solid #EBEBEB' } }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.75}
                sx={{ mb: 0.75, color: '#1340FF' }}
              >
                <Iconify icon={groupIcon(group.label)} width={16} />
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#231F20' }}>
                  {groupTitle(group.label)}
                </Typography>
              </Stack>
              {group.fields.map((field) => (
                <Stack
                  key={field.key}
                  direction="row"
                  justifyContent="space-between"
                  spacing={2}
                  sx={{ py: 0.25 }}
                >
                  <Typography noWrap title={field.label} sx={{ fontSize: 13, color: '#636366' }}>
                    {fieldLabel(field)}
                  </Typography>
                  <Typography sx={{ ...numberSx, fontSize: 13, fontWeight: 600, color: '#231F20' }}>
                    {formatDuration(field.value)}
                  </Typography>
                </Stack>
              ))}
            </Box>
          ))}
        </ScrollList>
      )}
    </Stack>
  );
}

InsightsValues.propTypes = { fields: PropTypes.array.isRequired };
