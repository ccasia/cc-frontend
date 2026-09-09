import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

const ITEM_HEIGHT = 55;

const VirtualizedListbox = React.forwardRef((props, ref) => {
  // eslint-disable-next-line react/prop-types
  const { children, onFetchNextPage, hasNextPage, isFetchingNextPage, ...other } = props;
  const items = React.Children.toArray(children);

  const parentRef = React.useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? items.length + 1 : items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    getItemKey: (index) => items[index]?.id,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Trigger next page when the last visible row is near the end
  React.useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    if (lastItem.index >= items.length - 1 && hasNextPage && !isFetchingNextPage) {
      onFetchNextPage?.();
    }
  }, [virtualItems, items.length, hasNextPage, isFetchingNextPage, onFetchNextPage]);

  return (
    <div ref={ref} {...other}>
      <div ref={parentRef} style={{ maxHeight: 400, overflow: 'auto' }}>
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            position: 'relative',
            width: '100%',
          }}
        >
          {virtualItems.map((virtualRow) => (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {items[virtualRow.index]}
            </div>
          ))}
        </div>
        {isFetchingNextPage && (
          <div style={{ padding: 8, textAlign: 'center', fontSize: 13 }}>Loading more...</div>
        )}
      </div>
    </div>
  );
});

export default VirtualizedListbox;
