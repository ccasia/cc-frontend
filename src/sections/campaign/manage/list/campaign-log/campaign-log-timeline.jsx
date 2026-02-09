import PropTypes from 'prop-types';
import { VariableSizeList } from 'react-window';
import { useRef, useMemo, useState, useCallback } from 'react';

import Typography from '@mui/material/Typography';

import { groupLogsByDate } from './campaign-log-utils';
import CampaignLogTimelineItem from './campaign-log-timeline-item';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HEADER_HEIGHT = 36;
const COLLAPSED_HEIGHT = 72; // 64px card + 8px gap
const EXPANDED_HEIGHT = 112; // ~104px card + 8px gap
const CONTAINER_HEIGHT_VH = 60; // matches DialogContent height

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

export default function CampaignLogTimeline({ logs, photoMap }) {
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

  // Expand state — lifted from individual items for react-window compat
  const listRef = useRef(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const getItemSize = useCallback(
    (index) => {
      const item = flatItems[index];
      if (item.type === 'header') return HEADER_HEIGHT;
      return expandedIds.has(item.entry.id) ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
    },
    [flatItems, expandedIds]
  );

  const handleToggle = useCallback(
    (entryId, flatIndex) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(entryId)) next.delete(entryId);
        else next.add(entryId);
        return next;
      });
      // Tell react-window to recalculate sizes from this index onward
      listRef.current?.resetAfterIndex(flatIndex);
    },
    []
  );

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
                isExpanded={expandedIds.has(item.entry.id)}
                onToggle={() => handleToggle(item.entry.id, index)}
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
};
