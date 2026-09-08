import PropTypes from 'prop-types';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import Iconify from 'src/components/iconify';

// A horizontally-scrollable tab strip with click-to-scroll arrows, shown once there are
// more tabs than comfortably fit. Plain (tabs, value, onChange) contract so it can be reused
// anywhere a round of sub-tabs needs to scroll — no assumptions about what a tab represents.
export default function ScrollTabs({ tabs, value, onChange, arrowThreshold = 5 }) {
  const containerRef = useRef(null);
  const [isOffset, setIsOffset] = useState({ left: false, right: false });

  const updateOffset = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setIsOffset({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateOffset();
    const el = containerRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', updateOffset, { passive: true });
    window.addEventListener('resize', updateOffset);
    return () => {
      el.removeEventListener('scroll', updateOffset);
      window.removeEventListener('resize', updateOffset);
    };
  }, [updateOffset, tabs.length]);

  const scrollBy = (delta) => {
    containerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const showArrows = tabs.length > arrowThreshold;

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      {showArrows && (
        <IconButton
          size="small"
          onClick={() => scrollBy(-200)}
          disabled={!isOffset.left}
          sx={{ flexShrink: 0 }}
        >
          <Iconify icon="eva:arrow-ios-back-fill" width={18} />
        </IconButton>
      )}

      <Box
        ref={containerRef}
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {tabs.map((tab) => {
          const isActive = value === tab.value;
          return (
            <Button
              key={tab.value}
              onClick={() => onChange(tab.value)}
              sx={{
                px: 1.75,
                py: 0.5,
                height: 30,
                minHeight: 30,
                flexShrink: 0,
                whiteSpace: 'nowrap',
                border: '1px solid',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'none',
                gap: 0.5,
                ...(isActive
                  ? { color: '#fff', bgcolor: '#000', borderColor: '#000' }
                  : { color: '#454545', bgcolor: '#fff', borderColor: '#D9D9D9' }),
                '&:hover': {
                  bgcolor: isActive ? '#000' : '#f5f5f5',
                },
              }}
            >
              {tab.label}
              {tab.count != null && (
                <Box
                  component="span"
                  sx={{ color: isActive ? 'rgba(255,255,255,0.6)' : '#A0A0A0' }}
                >
                  {tab.count}
                </Box>
              )}
            </Button>
          );
        })}
      </Box>

      {showArrows && (
        <IconButton
          size="small"
          onClick={() => scrollBy(200)}
          disabled={!isOffset.right}
          sx={{ flexShrink: 0 }}
        >
          <Iconify icon="eva:arrow-ios-forward-fill" width={18} />
        </IconButton>
      )}
    </Stack>
  );
}

ScrollTabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
      count: PropTypes.number,
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  arrowThreshold: PropTypes.number,
};
