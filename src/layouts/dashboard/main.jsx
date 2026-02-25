import PropTypes from 'prop-types';
import { useRef, useMemo, useState, createContext } from 'react';

import Box from '@mui/material/Box';
import { IconButton } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import Image from 'src/components/image';
import { useSettingsContext } from 'src/components/settings';

import ChatModal from 'src/sections/client/modal/chat-modal';

import { HEADER } from '../config-layout';

// ----------------------------------------------------------------------

const SPACING = 8;

export const mainContext = createContext();

export default function Main({ children, sx, ...other }) {
  const settings = useSettingsContext();

  const lgUp = useResponsive('up', 'lg');

  const [anchorEl, setAnchorEl] = useState(null);

  const isChatopen = Boolean(anchorEl);

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
        {lgUp && 
          <Box
            sx={{
              position: 'absolute',
              zIndex: 100,
              bottom: 10,
              right: 25,
              textAlign: 'right',
            }}
          >
            <IconButton
              sx={{
                background: 'linear-gradient(231.34deg, #8A5AFE 14.73%, #3A3A3C 84.06%)',
                width: 60,
                height: 60,
                ':hover': {
                  background: 'linear-gradient(231.34deg, #8A5AFE 100%, #3A3A3C 100%)',
                },
              }}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <Image src="/assets/chat.svg" alt="Chat" sx={{ width: 30 }} />
            </IconButton>
          </Box>        
        }
        <ChatModal open={isChatopen} onClose={() => setAnchorEl(null)} anchorEl={anchorEl} />
      </Box>
    </mainContext.Provider>
  );
}

Main.propTypes = {
  children: PropTypes.node,
  sx: PropTypes.object,
};
