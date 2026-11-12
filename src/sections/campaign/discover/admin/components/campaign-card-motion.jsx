import PropTypes from 'prop-types';
import { useRef, useLayoutEffect } from 'react';

import { Box } from '@mui/material';

import { EASE_OUT, EASE_IN_OUT } from 'src/sections/campaign/create/components/motion';

const GRID_GAP = 16;
const MOVE_MS = 500;
const ENTER_MS = 450;
const SHINE_MS = 1100;
// Gentle in-out: the band spends its time crossing the card, not off its edges
const SHINE_EASE = 'cubic-bezier(0.45, 0, 0.55, 1)';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Slides the cards that changed place when the list changes, while `active`.
// A card's old place comes from its old index, so it works for cards that moved
// to another row (and so were mounted again) and does not depend on scroll.
export function useCardShuffle({ listRef, ids, columns, rowStride, active, delayMs = 0 }) {
  const previous = useRef(null);

  useLayoutEffect(() => {
    const order = new Map(ids.map((id, index) => [String(id), index]));
    const before = previous.current;
    previous.current = { order, columns };

    if (!active || !before || before.columns !== columns || !listRef.current) return;
    if (reducedMotion()) return;

    listRef.current.querySelectorAll('[data-campaign-id]').forEach((card) => {
      const id = card.dataset.campaignId;
      const from = before.order.get(id);
      const to = order.get(id);
      if (from === undefined || to === undefined || from === to) return;

      const dx = ((from % columns) - (to % columns)) * (card.offsetWidth + GRID_GAP);
      const dy = (Math.floor(from / columns) - Math.floor(to / columns)) * rowStride;
      card.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
        duration: MOVE_MS,
        delay: delayMs,
        easing: EASE_IN_OUT,
        fill: 'backwards',
      });
    });
    // The list order is the trigger; the other values are read at that moment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
}

const newCardSx = {
  '@keyframes publishEnter': {
    from: { opacity: 0, transform: 'scale(0.94)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  '@keyframes publishFade': { from: { opacity: 0 }, to: { opacity: 1 } },
  '@keyframes publishShine': {
    from: { transform: 'translate(-35%, -35%)' },
    to: { transform: 'translate(35%, 35%)' },
  },
  '& > .card-body': {
    display: 'grid',
    animation: `publishEnter ${ENTER_MS}ms ${EASE_OUT} var(--enter-delay) both`,
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'publishFade 250ms ease var(--enter-delay) both',
    },
  },
  // A bright band twice the card's size, so it starts past the top-left corner
  // and leaves past the bottom-right one
  '& > .card-shine': {
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    borderRadius: '15px',
    overflow: 'hidden',
    pointerEvents: 'none',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '-50%',
      left: '-50%',
      width: '200%',
      height: '200%',
      background:
        'linear-gradient(135deg, transparent 44%, rgba(255, 255, 255, 0.7) 50%, transparent 56%)',
      animation: `publishShine ${SHINE_MS}ms ${SHINE_EASE} var(--shine-delay) both`,
    },
    '@media (prefers-reduced-motion: reduce)': { display: 'none' },
  },
};

// The card root is a link (inline). A grid parent makes it a block again,
// as it was when it sat in the list grid directly.
const cardSx = { position: 'relative', '& > .card-body': { display: 'grid' } };
const newCardWrapSx = { ...cardSx, ...newCardSx };

// One campaign card in the list. The just-published card (`isNew`) fades and
// grows in after the others start to move, then a shine sweeps across it.
export default function CampaignCardMotion({ id, isNew, delayMs = 0, onEntered, children }) {
  const handleEnd = (event) => {
    const done = reducedMotion() ? 'publishFade' : 'publishShine';
    if (event.animationName === done) onEntered?.();
  };

  return (
    <Box
      data-campaign-id={id}
      onAnimationEnd={isNew ? handleEnd : undefined}
      sx={isNew ? newCardWrapSx : cardSx}
      style={
        isNew
          ? {
              '--enter-delay': `${delayMs + 120}ms`,
              '--shine-delay': `${delayMs + 120 + ENTER_MS}ms`,
            }
          : undefined
      }
    >
      <div className="card-body">{children}</div>
      {isNew && <div className="card-shine" aria-hidden />}
    </Box>
  );
}

CampaignCardMotion.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isNew: PropTypes.bool,
  delayMs: PropTypes.number,
  onEntered: PropTypes.func,
  children: PropTypes.node,
};
