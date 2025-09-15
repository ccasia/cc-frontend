import PropTypes from 'prop-types';
import { useRef, useMemo, createContext } from 'react';

import Box from '@mui/material/Box';

import { useResponsive } from 'src/hooks/use-responsive';

import { useSettingsContext } from 'src/components/settings';

import { HEADER } from '../config-layout';

// ----------------------------------------------------------------------

const SPACING = 8;

export const mainContext = createContext();

export default function Main({ children, sx, ...other }) {
  const settings = useSettingsContext();

  const lgUp = useResponsive('up', 'lg');

  const isNavHorizontal = settings.themeLayout === 'horizontal';

  const mainRef = useRef(null);

  const memoizedValue = useMemo(() => ({ mainRef }), []);

  if (isNavHorizontal) {
    return (
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: 1,
          display: 'flex',
          overflow: 'auto',
          flexDirection: 'column',
          pt: `${HEADER.H_MOBILE + 24}px`,
          // pb: 10,
          ...(lgUp && {
            pt: `${HEADER.H_MOBILE * 2 + 40}px`,
            pb: 15,
          }),
        }}
        {...other}
      >
        {children}
      </Box>
    );
  }

  return (
    <mainContext.Provider value={memoizedValue}>
      <Box
        ref={mainRef}
        component="main"
        sx={{
          display: 'flex',
          flexGrow: 1,
          height: 1,
          overflow: 'auto',
          flexDirection: 'column',
          py: `${HEADER.H_MOBILE + SPACING}px`,
          ...(lgUp && {
            px: 2,
            py: `${HEADER.H_DESKTOP + SPACING}px`,
          }),
          ...sx,
        }}
        {...other}
      >
        {children}
      </Box>
    </mainContext.Provider>
  );
}

Main.propTypes = {
  children: PropTypes.node,
  sx: PropTypes.object,
};
