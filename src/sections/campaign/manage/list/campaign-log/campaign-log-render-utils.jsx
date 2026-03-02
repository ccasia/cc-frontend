import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import { getOutreachStatusConfig } from 'src/contants/outreach';

// ---------------------------------------------------------------------------
// Static sx constants — avoids recreating on every render
// ---------------------------------------------------------------------------

export const AVATAR_SIZE = 22;

export const AVATAR_IMG_SX = {
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  minWidth: AVATAR_SIZE,
  borderRadius: '50%',
  objectFit: 'cover',
};

export const AVATAR_FALLBACK_SX = {
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

export const STATUS_CHIP_SX = {
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
export const ACTION_CHIP_MAP = {
  approved:           { label: 'Approved',          color: '#22C55E' },
  rejected:           { label: 'Rejected',          color: '#FF5630' },
  changes_requested:  { label: 'Changes Requested', color: '#FFAB00' },
  shortlisted:        { label: 'Shortlisted',       color: '#8E33FF' },
  maybe:              { label: 'Maybe',             color: '#F59E0B' },
};

// ---------------------------------------------------------------------------
// Inline avatar — shows photo if available, else initial
// ---------------------------------------------------------------------------

export function NameAvatar({ name, photoURL, size }) {
  const s = size || AVATAR_SIZE;

  const imgSx = s === AVATAR_SIZE ? AVATAR_IMG_SX : {
    width: s, height: s, minWidth: s, borderRadius: '50%', objectFit: 'cover',
  };

  const fallbackSx = s === AVATAR_SIZE ? AVATAR_FALLBACK_SX : {
    ...AVATAR_FALLBACK_SX, width: s, height: s, minWidth: s, fontSize: Math.round(s / 2),
  };

  if (photoURL) {
    return <Box component="img" src={photoURL} alt={name} sx={imgSx} />;
  }

  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <Box component="span" sx={fallbackSx}>
      {initial}
    </Box>
  );
}

NameAvatar.propTypes = { name: PropTypes.string, photoURL: PropTypes.string, size: PropTypes.number };

// ---------------------------------------------------------------------------
// Render a single chip (action or outreach)
// ---------------------------------------------------------------------------

export function renderChip(key, label, color) {
  return (
    <Box key={key} component="span" sx={{ ...STATUS_CHIP_SX, color, borderColor: color }}>
      {label}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Split text on quoted names and render avatars
// ---------------------------------------------------------------------------

export function renderQuotedNames(text, photoMap, keyPrefix, avatarSize) {
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
            <NameAvatar name={segment} photoURL={photoURL} size={avatarSize} />
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

// ---------------------------------------------------------------------------
// Split formatted message into tokens and render chips + avatars
// ---------------------------------------------------------------------------

export function renderActionParts(formattedMessage, photoMap, avatarSize) {
  const tokenPattern = /\[action:(\w+)]|\[outreach:(\w+)]/g;
  const result = [];
  let lastIndex = 0;
  let chipIdx = 0;
  let match = tokenPattern.exec(formattedMessage);

  while (match) {
    // Text before this token
    if (match.index > lastIndex) {
      const text = formattedMessage.slice(lastIndex, match.index);
      result.push(...renderQuotedNames(text, photoMap, `p${chipIdx}`, avatarSize));
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
    result.push(...renderQuotedNames(text, photoMap, `e${chipIdx}`, avatarSize));
  }

  return result.length > 0 ? result : [<span key="t">{formattedMessage}</span>];
}
