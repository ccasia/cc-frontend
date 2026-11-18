import { useMemo } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';
import { formatNumber } from 'src/utils/socialMetricsCalculator';

import Iconify from 'src/components/iconify';
import Lightbox, { useLightBox } from 'src/components/lightbox';

import { groupFields, METRIC_ICONS } from 'src/sections/insight-ocr/constants';

import {
  groupIcon,
  joinNames,
  formatDuration,
  groupTitle,
  fieldLabel,
  lastAddedAt,
  uploaderNames,
  toDisplayFields,
} from './utils';

const BLUE = '#1340FF';
const METRIC_MIN_WIDTH = 120;
const BAR_COLUMN_WIDTH = 220;
const numberSx = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };

// Plain counts follow the row's format (32.7K). Rates, times and percents stay as on screen.
const displayValue = (field) =>
  field.number != null && /^[\d,.\s]+$/.test(field.value)
    ? formatNumber(field.number)
    : formatDuration(field.value);

function Metric({ field, icon }) {
  return (
    <Box sx={{ minWidth: 0, pl: 1, borderLeft: `1px solid ${BLUE}` }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{ color: '#636366', minWidth: 0 }}
      >
        {icon && <Iconify icon={icon} width={14} sx={{ flexShrink: 0 }} />}
        <Typography noWrap title={field.label} fontFamily="Aileron" fontSize={13} fontWeight={600}>
          {fieldLabel(field)}
        </Typography>
      </Stack>
      <Typography noWrap fontFamily="Instrument Serif" fontSize={26} color={BLUE} lineHeight={1.15}>
        {displayValue(field)}
      </Typography>
    </Box>
  );
}

Metric.propTypes = { field: PropTypes.object.isRequired, icon: PropTypes.string };

function BarRow({ field }) {
  const percent = field.number != null ? Math.min(Math.max(field.number, 0), 100) : 0;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" spacing={1}>
        <Typography noWrap title={field.label} sx={{ fontSize: 13, color: '#636366' }}>
          {fieldLabel(field)}
        </Typography>
        <Typography sx={{ ...numberSx, fontSize: 13, fontWeight: 600, color: '#231F20' }}>
          {field.value}
        </Typography>
      </Stack>
      <Box sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: '#EEF2FF', overflow: 'hidden' }}>
        <Box sx={{ width: `${percent}%`, height: 1, borderRadius: 2, bgcolor: BLUE }} />
      </Box>
    </Box>
  );
}

BarRow.propTypes = { field: PropTypes.object.isRequired };

function GroupCard({ group }) {
  const isBar = group.variant === 'bar';
  const fields = isBar
    ? [...group.fields].sort((a, b) => (b.number ?? 0) - (a.number ?? 0))
    : group.fields;

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        bgcolor: '#FFFFFF',
        border: '1px solid #EBEBEB',
        minWidth: 0,
        // Cards grow with their number of values, so each group stays on one line when it fits.
        flex: isBar
          ? `${fields.length} 1 ${BAR_COLUMN_WIDTH + 26}px`
          : `${fields.length} 1 ${fields.length * (METRIC_MIN_WIDTH + 12) + 14}px`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.5, color: BLUE }}>
        <Iconify icon={groupIcon(group.label)} width={18} sx={{ flexShrink: 0 }} />
        <Typography sx={{ fontSize: 15, fontWeight: 600, lineHeight: '20px', color: '#231F20' }}>
          {groupTitle(group.label)}
        </Typography>
      </Stack>

      {isBar ? (
        // Wide cards flow their bars into columns (top to bottom), so long lists stay short.
        <Box
          sx={{
            columnWidth: BAR_COLUMN_WIDTH,
            columnGap: '24px',
            '& > *': { breakInside: 'avoid', mb: 1 },
          }}
        >
          {fields.map((field) => (
            <BarRow key={field.key} field={field} />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: `repeat(auto-fit, minmax(${METRIC_MIN_WIDTH}px, 1fr))`,
            // The first value starts the card, so it needs no divider.
            '& > :first-of-type': { borderLeft: 0, pl: 0 },
          }}
        >
          {fields.map((field) => (
            <Metric
              key={field.key}
              field={field}
              icon={group.variant === 'icon' ? METRIC_ICONS[field.key] : undefined}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

GroupCard.propTypes = { group: PropTypes.object.isRequired };

function SourceFooter({ insights }) {
  const screenshots = useMemo(() => insights.screenshots ?? [], [insights.screenshots]);
  const slides = useMemo(() => screenshots.map((s) => ({ src: s.url })), [screenshots]);
  const lightbox = useLightBox(slides);

  if (!screenshots.length) return null;

  const count = `${screenshots.length} insight screenshot${screenshots.length === 1 ? '' : 's'}`;
  const names = uploaderNames(insights);
  const date = lastAddedAt(insights);
  const added = [names.length && `Added by ${joinNames(names)}`, date && fDate(date)]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mt: 1.5, px: 0.5 }}>
        <ButtonBase
          aria-label="View insight screenshots"
          onClick={() => lightbox.setSelected(0)}
          sx={{ display: 'flex', borderRadius: 0.75, flexShrink: 0 }}
        >
          {screenshots.slice(0, 3).map((screenshot, i) => (
            <Box
              key={screenshot.url}
              component="img"
              src={screenshot.url}
              alt=""
              sx={{
                width: 22,
                height: 36,
                objectFit: 'cover',
                borderRadius: 0.75,
                border: '2px solid #FFFFFF',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.12)',
                ml: i ? -1 : 0,
              }}
            />
          ))}
        </ButtonBase>

        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#231F20' }}>
              From {count}
            </Typography>
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => lightbox.setSelected(0)}
              sx={{ fontSize: 13, fontWeight: 600, color: BLUE }}
            >
              View
            </Link>
          </Stack>
          {added && <Typography sx={{ fontSize: 12, color: '#8E8E93' }}>{added}</Typography>}
        </Box>
      </Stack>

      <Lightbox
        index={lightbox.selected}
        slides={slides}
        open={lightbox.open}
        close={lightbox.onClose}
        disabledVideo
        disabledSlideshow
        disabledTotal={slides.length < 2}
        disabledThumbnails={slides.length < 2}
      />
    </>
  );
}

SourceFooter.propTypes = { insights: PropTypes.object.isRequired };

export function PostInsightsPanel({ insights, excludeKeys = [] }) {
  const fields = toDisplayFields(insights).filter((field) => !excludeKeys.includes(field.key));
  const groups = groupFields(fields);
  const numberGroups = groups.filter((group) => group.variant !== 'bar');
  const barGroups = groups.filter((group) => group.variant === 'bar');

  return (
    <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#F7F7F8' }}>
      {groups.length ? (
        <Stack spacing={1.5}>
          {/* Number groups share a row, so they line up at the same height. */}
          {!!numberGroups.length && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {numberGroups.map((group) => (
                <GroupCard key={group.label} group={group} />
              ))}
            </Box>
          )}
          {/* Bar cards grow with their row count, so the row fills the width and heights stay close. */}
          {!!barGroups.length && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {barGroups.map((group) => (
                <GroupCard key={group.label} group={group} />
              ))}
            </Box>
          )}
        </Stack>
      ) : (
        <Typography sx={{ fontSize: 14, color: '#636366' }}>
          No extra values found on the screenshots.
        </Typography>
      )}

      <SourceFooter insights={insights} />
    </Box>
  );
}

PostInsightsPanel.propTypes = {
  insights: PropTypes.object.isRequired,
  excludeKeys: PropTypes.arrayOf(PropTypes.string),
};

export function PostInsightsToggle({ open, onClick }) {
  const title = open ? 'Hide insights' : 'Show insights';

  return (
    <Tooltip title={title} placement="left">
      <IconButton
        type="button"
        aria-label={title}
        aria-expanded={open}
        onClick={onClick}
        disableRipple
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          border: '1px solid #E7E7E7',
          borderBottomWidth: 3,
          bgcolor: open ? '#F5F5F5' : '#FFFFFF',
          transition: 'all 0.2s ease',
          '&:hover': { bgcolor: '#F5F5F5', borderColor: '#B4B8C2' },
        }}
      >
        <Iconify
          icon="eva:arrow-ios-downward-fill"
          width={18}
          color="#221f20"
          sx={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </IconButton>
    </Tooltip>
  );
}

PostInsightsToggle.propTypes = { open: PropTypes.bool, onClick: PropTypes.func };
