import PropTypes from 'prop-types';
import { cloneElement, useState } from 'react';

import Box from '@mui/material/Box';

import DiaTextReveal from './dia-text-reveal';
import useJustFinished from './use-just-finished';

const FIELD_TEXT_STYLE = {
  fontSize: 14,
  fontWeight: 400,
  lineHeight: '18px',
};

/**
 * Holds `useJustFinished` above a loading/ready swap, so the reveal still
 * fires when the TextField unmounts during the skeleton.
 */
export function ScrapeRevealGate({ loading, children }) {
  return children(useJustFinished(loading));
}

ScrapeRevealGate.propTypes = {
  loading: PropTypes.bool,
  children: PropTypes.func.isRequired,
};

/** Overlay Dia text on a TextField for one sweep, then show the real input. */
export default function ScrapeTextFieldReveal({
  reveal,
  text,
  textColor = '#231F20',
  height,
  overlayPaddingLeft = 12,
  overlayPaddingRight = 12,
  children,
}) {
  const [playing, setPlaying] = useState(Boolean(reveal));
  const [prevReveal, setPrevReveal] = useState(Boolean(reveal));

  if (reveal !== prevReveal) {
    setPrevReveal(reveal);
    if (reveal) setPlaying(true);
  }

  const displayText = text == null ? '' : String(text);
  const showOverlay = Boolean(reveal && playing && displayText);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {cloneElement(children, {
        sx: [children.props.sx, showOverlay && overlayInputSx],
      })}
      {showOverlay && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height,
            display: 'flex',
            alignItems: 'center',
            pl: `${overlayPaddingLeft}px`,
            pr: `${overlayPaddingRight}px`,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 1,
          }}
        >
          <DiaTextReveal
            text={displayText}
            textColor={textColor}
            duration={1.5}
            delay={0.05}
            onComplete={() => setPlaying(false)}
            style={FIELD_TEXT_STYLE}
          />
        </Box>
      )}
    </Box>
  );
}

const overlayInputSx = {
  '& .MuiOutlinedInput-input': {
    color: 'transparent !important',
    WebkitTextFillColor: 'transparent',
    caretColor: 'transparent',
  },
};

ScrapeTextFieldReveal.propTypes = {
  reveal: PropTypes.bool,
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  textColor: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  overlayPaddingLeft: PropTypes.number,
  overlayPaddingRight: PropTypes.number,
  children: PropTypes.element.isRequired,
};
