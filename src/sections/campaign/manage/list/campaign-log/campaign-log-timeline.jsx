import PropTypes from 'prop-types';
import { VariableSizeList } from 'react-window';
import { useRef, useMemo, useEffect, useCallback } from 'react';

import Typography from '@mui/material/Typography';

import { groupLogsByDate } from './campaign-log-utils';
import CampaignLogTimelineItem from './campaign-log-timeline-item';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HEADER_HEIGHT = 36;
const ITEM_HEIGHT = 72; // 64px card + 8px gap
const CONTAINER_HEIGHT_VH = 70; // matches DialogContent height

// ---------------------------------------------------------------------------
// Date header component
// ---------------------------------------------------------------------------

function DateHeader({ label }) {
  return (
    <Typography
      variant="overline"
      sx={{
        fontSize: 12,
        fontWeight: 700,
        color: '#8e8e93',
        letterSpacing: 1,
        display: 'flex',
        alignItems: 'flex-end',
        height: '100%',
        pb: 0.5,
      }}
    >
      {label}
    </Typography>
  );
}

DateHeader.propTypes = { label: PropTypes.string.isRequired };

// ---------------------------------------------------------------------------

export default function CampaignLogTimeline({ logs, photoMap, selectedLogId, onSelectLog }) {
  const groups = useMemo(() => groupLogsByDate(logs), [logs]);

  // Flatten groups into a renderable list: [{type:'header', label}, {type:'item', entry}]
  const flatItems = useMemo(() => {
    const items = [];
    groups.forEach((group) => {
      items.push({ type: 'header', label: group.label });
      group.items.forEach((entry) => items.push({ type: 'item', entry }));
    });
    return items;
  }, [groups]);

  const listRef = useRef(null);

  const getItemSize = useCallback(
    (index) => (flatItems[index].type === 'header' ? HEADER_HEIGHT : ITEM_HEIGHT),
    [flatItems]
  );

  // Reset sizes when list content changes (e.g. filtering)
  useEffect(() => {
    listRef.current?.resetAfterIndex(0);
  }, [flatItems]);

  // Calculate container height in pixels (fallback for SSR)
  const containerHeight =
    typeof window !== 'undefined'
      ? window.innerHeight * (CONTAINER_HEIGHT_VH / 100)
      : 600;

  return (
    <VariableSizeList
      ref={listRef}
      height={containerHeight}
      width="100%"
      itemCount={flatItems.length}
      itemSize={getItemSize}
      overscanCount={10}
    >
      {({ index, style }) => {
        const item = flatItems[index];
        return (
          <div style={{ ...style, paddingLeft: 20, paddingRight: 20 }}>
            {item.type === 'header' ? (
              <DateHeader label={item.label} />
            ) : (
              <CampaignLogTimelineItem
                entry={item.entry}
                photoMap={photoMap}
                isSelected={selectedLogId === item.entry.id}
                onSelect={() => onSelectLog(item.entry.id)}
              />
            )}
          </div>
        );
      }}
    </VariableSizeList>
  );
}

CampaignLogTimeline.propTypes = {
  logs: PropTypes.array.isRequired,
  photoMap: PropTypes.instanceOf(Map),
  selectedLogId: PropTypes.string,
  onSelectLog: PropTypes.func,
};
