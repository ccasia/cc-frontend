import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import React, { useRef, useState, useLayoutEffect } from 'react';

import { Box, Link, Typography, ClickAwayListener } from '@mui/material';

import { COLORS } from '../constants';

const ExpandableText = ({ text, lines = 2, maxHeight = 240, sx, expandedSx }) => {
  const ref = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [clampOn, setClampOn] = useState(true);
  const [clamped, setClamped] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState('auto');

  useLayoutEffect(() => {
    if (!clampOn) return undefined;

    const element = ref.current;
    const measure = () => {
      setClamped(element.scrollHeight > element.clientHeight);
      setCollapsedHeight(element.clientHeight);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text, clampOn]);

  const toggle = () => {
    if (!expanded) setClampOn(false);
    setExpanded((prev) => !prev);
  };

  return (
    <ClickAwayListener onClickAway={() => expanded && setExpanded(false)}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          ...(expanded && { zIndex: 2, ...expandedSx }),
        }}
      >
        <m.div
          initial={false}
          animate={{ height: expanded ? 'auto' : collapsedHeight }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={() => !expanded && setClampOn(true)}
          style={{ maxHeight, overflowY: expanded ? 'auto' : 'hidden' }}
        >
          <Typography
            ref={ref}
            sx={{
              wordBreak: 'break-word',
              whiteSpace: 'pre-line',
              ...(clampOn && {
                display: '-webkit-box',
                WebkitLineClamp: lines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }),
              ...sx,
            }}
          >
            {text}
          </Typography>
        </m.div>
        {clamped && (
          <Link
            component="button"
            onClick={toggle}
            underline="hover"
            sx={{ mt: 0.5, fontSize: 12, fontWeight: 600, color: COLORS.link }}
          >
            {expanded ? 'See less' : 'See more'}
          </Link>
        )}
      </Box>
    </ClickAwayListener>
  );
};

export default ExpandableText;

ExpandableText.propTypes = {
  text: PropTypes.string.isRequired,
  lines: PropTypes.number,
  maxHeight: PropTypes.number,
  sx: PropTypes.object,
  expandedSx: PropTypes.object,
};
