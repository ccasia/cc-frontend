import { memo } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import { renderActionParts } from './campaign-log-render-utils';
import { formatLogTime, getCategoryMeta } from './campaign-log-utils';

// ---------------------------------------------------------------------------
// Static sx constants — avoids recreating on every render
// ---------------------------------------------------------------------------

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
