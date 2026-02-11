import { memo } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { getOutreachStatusConfig } from 'src/contants/outreach';

import Iconify from 'src/components/iconify';

import { formatLogTime, getCategoryMeta } from './campaign-log-utils';

// ---------------------------------------------------------------------------
// Static sx constants — avoids recreating on every render
// ---------------------------------------------------------------------------

const AVATAR_SIZE = 22;

const AVATAR_IMG_SX = {
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  minWidth: AVATAR_SIZE,
  borderRadius: '50%',
  objectFit: 'cover',
};

const AVATAR_FALLBACK_SX = {
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  minWidth: AVATAR_SIZE,
  borderRadius: '50%',
  bgcolor: '#E7E7E7',
  color: '#636366',
  fontSize: 11,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const CARD_SX = {
  bgcolor: '#FFFFFF',
  borderRadius: 1.5,
  borderLeft: '4px solid',
  px: 2.5,
  py: 1.5,
  cursor: 'pointer',
  transition: 'background-color 0.15s',
};

const TOP_ROW_SX = { display: 'flex', alignItems: 'center' };

const ICON_CIRCLE_SX = {
  width: 42,
  height: 42,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  mr: 1.5,
};

const ACTION_TEXT_BASE_SX = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  flex: 1,
  minWidth: 0,
  fontSize: 14,
  color: '#221F20',
  overflow: 'hidden',
};

const TIME_SX = { color: '#8e8e93', fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0, ml: 2 };


const STATUS_CHIP_SX = {
  textTransform: 'uppercase',
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  py: '2px',
  px: 0.75,
  fontSize: 10,
  border: '1px solid',
  borderBottom: '2px solid',
  borderRadius: 0.6,
  bgcolor: 'white',
  whiteSpace: 'nowrap',
  lineHeight: 1.4,
};

// Status outcome → { label, color } for inline status chips
// Only status outcomes get chips — plain verbs (sent, updated, etc.) stay as text
const ACTION_CHIP_MAP = {
  approved:           { label: 'Approved',          color: '#22C55E' },
  rejected:           { label: 'Rejected',          color: '#FF5630' },
  changes_requested:  { label: 'Changes Requested', color: '#FFAB00' },
  shortlisted:        { label: 'Shortlisted',       color: '#8E33FF' },
  maybe:              { label: 'Maybe',             color: '#F59E0B' },
};

// ---------------------------------------------------------------------------
// Inline avatar — 18px circle, shows photo if available, else initial
// ---------------------------------------------------------------------------

function NameAvatar({ name, photoURL }) {
  if (photoURL) {
    return <Box component="img" src={photoURL} alt={name} sx={AVATAR_IMG_SX} />;
  }

  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <Box component="span" sx={AVATAR_FALLBACK_SX}>
      {initial}
    </Box>
  );
}

NameAvatar.propTypes = { name: PropTypes.string, photoURL: PropTypes.string };

// ---------------------------------------------------------------------------
// Build action message as an array of flex children
// Uses pre-formatted message (formattedAction) instead of raw message
// ---------------------------------------------------------------------------

// Render a single chip (action or outreach)
function renderChip(key, label, color) {
  return (
    <Box key={key} component="span" sx={{ ...STATUS_CHIP_SX, color, borderColor: color }}>
      {label}
    </Box>
  );
}

// Split text on quoted names and render avatars
function renderQuotedNames(text, photoMap, keyPrefix) {
  const segments = text.split(/"([^"]+)"/g);
  if (segments.length <= 1) {
    return [<span key={`${keyPrefix}-t`} style={{ whiteSpace: 'pre' }}>{text}</span>];
  }

  return segments
    .map((segment, i) => {
      if (i % 2 === 1) {
        // Peek ahead: if the next text segment starts with 's, attach it to the name
        let possessive = '';
        const next = segments[i + 1];
        if (next && next.startsWith("'s")) {
          possessive = "'s";
          segments[i + 1] = next.slice(2);
        }

        const photoURL = photoMap?.get(segment);
        return (
          <Box key={`${keyPrefix}-${i}`} component="span" sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <NameAvatar name={segment} photoURL={photoURL} />
            <span style={{ fontWeight: 600, color: '#221F20', whiteSpace: 'nowrap' }}>
              {segment}{possessive}
            </span>
          </Box>
        );
      }
      if (!segment) return null;
      return (
        <span key={`${keyPrefix}-${i}`} style={{ whiteSpace: 'pre' }}>
          {segment}
        </span>
      );
    })
    .filter(Boolean);
}

// Split formatted message into tokens: [action:KEY], [outreach:STATUS], "quoted names", plain text
// Renders chips for actions/outreach, avatars for quoted names
function renderActionParts(formattedMessage, photoMap) {
  // Single regex to split on both [action:KEY] and [outreach:STATUS] tokens
  const tokenPattern = /\[action:(\w+)]|\[outreach:(\w+)]/g;
  const result = [];
  let lastIndex = 0;
  let chipIdx = 0;
  let match = tokenPattern.exec(formattedMessage);

  while (match) {
    // Text before this token
    if (match.index > lastIndex) {
      const text = formattedMessage.slice(lastIndex, match.index);
      result.push(...renderQuotedNames(text, photoMap, `p${chipIdx}`));
    }

    if (match[1]) {
      // [action:KEY]
      const config = ACTION_CHIP_MAP[match[1]];
      if (config) {
        result.push(renderChip(`a${chipIdx}`, config.label, config.color));
      } else {
        result.push(<span key={`a${chipIdx}`}>{match[1]}</span>);
      }
    } else if (match[2]) {
      // [outreach:STATUS]
      const config = getOutreachStatusConfig(match[2]);
      if (config) {
        result.push(renderChip(`o${chipIdx}`, config.label, config.color));
      } else {
        result.push(<span key={`o${chipIdx}`}>{match[2]}</span>);
      }
    }

    lastIndex = match.index + match[0].length;
    chipIdx += 1;
    match = tokenPattern.exec(formattedMessage);
  }

  // Remaining text after last token
  if (lastIndex < formattedMessage.length) {
    const text = formattedMessage.slice(lastIndex);
    result.push(...renderQuotedNames(text, photoMap, `e${chipIdx}`));
  }

  return result.length > 0 ? result : [<span key="t">{formattedMessage}</span>];
}

// ---------------------------------------------------------------------------

const CampaignLogTimelineItem = memo(({
  entry,
  photoMap,
  isSelected,
  onSelect,
}) => {
  const meta = getCategoryMeta(entry.category);

  return (
    <Box
      onClick={onSelect}
      sx={{
        ...CARD_SX,
        borderLeftColor: meta.color,
        ...(!isSelected && {
          '&:hover': { bgcolor: '#FAFAFA' },
        }),
        ...(isSelected && {
          bgcolor: '#EBF0FF',
          boxShadow: 'inset 0 0 0 1px #1340FF',
        }),
      }}
    >
      <Box sx={TOP_ROW_SX}>
        {/* Category icon */}
        <Box sx={{ ...ICON_CIRCLE_SX, bgcolor: meta.bg }}>
          <Iconify icon={meta.icon} width={20} sx={{ color: meta.color }} />
        </Box>

        {/* Action text */}
        <Box sx={{ ...ACTION_TEXT_BASE_SX, flexWrap: 'nowrap' }}>
          {renderActionParts(entry.formattedAction, photoMap)}
        </Box>

        {/* Time */}
        <Typography variant="caption" sx={TIME_SX}>
          {formatLogTime(entry.createdAt)}
        </Typography>
      </Box>
    </Box>
  );
});

CampaignLogTimelineItem.propTypes = {
  entry: PropTypes.shape({
    id: PropTypes.string,
    action: PropTypes.string,
    formattedAction: PropTypes.string,
    category: PropTypes.string,
    performedBy: PropTypes.string,
    performerRole: PropTypes.string,
    createdAt: PropTypes.string,
  }).isRequired,
  photoMap: PropTypes.instanceOf(Map),
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func,
};

export default CampaignLogTimelineItem;
