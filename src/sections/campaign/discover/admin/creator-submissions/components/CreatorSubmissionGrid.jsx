import PropTypes from 'prop-types';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';

import { Box } from '@mui/material';

import CreatorSubmissionCard from './CreatorSubmissionCard';
import { EASE_OUT_CSS, MIN_CARD_WIDTH } from '../utils/constants';

const ROW_GAP = 24;
const COLUMN_GAP = 24;
const ESTIMATED_CARD_HEIGHT = 480;
const ENTER_MS = 200;
const ENTER_STAGGER_MS = 40;
const FILTER_FADE_MS = 150;

// WAAPI runs off the main thread and never blocks clicks
const fadeIn = (element, duration, delay = 0) =>
  element.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration,
    delay,
    easing: EASE_OUT_CSS,
    fill: 'backwards',
  });

const getScrollParent = (node) => {
  let parent = node?.parentElement;
  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === 'auto' || overflowY === 'scroll') return parent;
    parent = parent.parentElement;
  }
  return document.scrollingElement;
};

const gridSx = (columns) => ({
  display: 'grid',
  gap: 3,
  alignItems: 'start',
  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
});

const CreatorSubmissionGrid = ({ creators, fadeKey }) => {
  const listRef = useRef(null);
  const [scrollElement, setScrollElement] = useState(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const [listWidth, setListWidth] = useState(0);

  // Columns follow the grid's own width, not the window: the side nav eats into it
  const columns = Math.max(1, Math.floor((listWidth + COLUMN_GAP) / (MIN_CARD_WIDTH + COLUMN_GAP)));
  const rowCount = Math.ceil(creators.length / columns);

  // Cards render below the toolbar, so the virtualizer needs the list's offset in the scroller
  useLayoutEffect(() => {
    const scroller = getScrollParent(listRef.current);
    const measure = () => {
      if (!listRef.current || !scroller) return;
      const offset =
        listRef.current.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop;
      setScrollMargin(Math.round(offset));
    };
    setScrollElement(scroller);
    setListWidth(listRef.current.clientWidth);
    measure();

    const observer = new ResizeObserver(() => {
      setListWidth(listRef.current?.clientWidth ?? 0);
      measure();
    });
    observer.observe(listRef.current);
    return () => observer.disconnect();
  }, []);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollElement,
    estimateSize: () => ESTIMATED_CARD_HEIGHT + ROW_GAP,
    overscan: 2,
    scrollMargin,
  });

  const virtualRows = virtualizer.getVirtualItems();

  // First load: the cards fade in after the skeletons, staggering the first row only
  const enteredRef = useRef(false);
  useLayoutEffect(() => {
    if (enteredRef.current || !virtualRows.length) return;
    enteredRef.current = true;
    listRef.current?.querySelectorAll('[data-index]').forEach((row) => {
      const isFirstRow = row.dataset.index === '0';
      [...row.children].forEach((card, index) =>
        fadeIn(card, ENTER_MS, isFirstRow ? index * ENTER_STAGGER_MS : 0)
      );
    });
  }, [virtualRows.length]);

  // Status/type filter change: a short fade so the swap reads as a change. Search typing
  // happens every keystroke, so it doesn't fade.
  const fadeKeyRef = useRef(fadeKey);
  useEffect(() => {
    if (fadeKeyRef.current === fadeKey) return;
    fadeKeyRef.current = fadeKey;
    if (listRef.current) fadeIn(listRef.current, FILTER_FADE_MS);
  }, [fadeKey]);

  return (
    <Box ref={listRef} sx={{ position: 'relative', height: virtualizer.getTotalSize() }}>
      {virtualRows.map((row) => {
        const rowCreators = creators.slice(row.index * columns, (row.index + 1) * columns);

        return (
          <Box
            key={row.key}
            data-index={row.index}
            ref={virtualizer.measureElement}
            sx={{
              ...gridSx(columns),
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1,
              // Each row is its own stacking context; earlier rows stay above so an expanded
              // caption can overlap the row below
              zIndex: rowCount - row.index,
              pb: `${ROW_GAP}px`,
              transform: `translateY(${row.start - scrollMargin}px)`,
            }}
          >
            {rowCreators.map(({ user, submissions }) => (
              <CreatorSubmissionCard key={user.id} creator={user} submissions={submissions} />
            ))}
          </Box>
        );
      })}
    </Box>
  );
};

export default CreatorSubmissionGrid;

CreatorSubmissionGrid.propTypes = {
  creators: PropTypes.array.isRequired,
  fadeKey: PropTypes.string,
};
