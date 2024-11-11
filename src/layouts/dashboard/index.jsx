import { mutate } from 'swr';
import { useEffect } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import { useSettingsContext } from 'src/components/settings';

import Main from './main';
import Header from './header';
import NavMini from './nav-mini';
import NavVertical from './nav-vertical';
import NavHorizontal from './nav-horizontal';

// ----------------------------------------------------------------------

export default function DashboardLayout({ children }) {
  const settings = useSettingsContext();

  const { user } = useAuthContext();
  const { socket, isOnline } = useSocketContext();

  // eslint-disable-next-line react-hooks/exhaustive-deps

  useEffect(() => {
    socket?.on('notification', (data) =>
      mutate(endpoints.notification.root, (currentData) => ({
        ...currentData,
        data,
      }))
    );

    return () => {
      socket?.off('notification');
    };
  }, [user, socket]);

  const lgUp = useResponsive('up', 'lg');

  const nav = useBoolean();

  const isHorizontal = settings.themeLayout === 'horizontal';

  const isMini = settings.themeLayout === 'mini';

  const renderNavMini = <NavMini />;

  const renderHorizontal = <NavHorizontal />;

  const renderNavVertical = <NavVertical openNav={nav.value} onCloseNav={nav.onFalse} />;

  if (isHorizontal) {
    return (
      <>
        <Header onOpenNav={nav.onTrue} isOnline={isOnline} />

        {lgUp ? renderHorizontal : renderNavVertical}

        <Main>{children}</Main>
      </>
    );
  }

  if (isMini) {
    return (
      <>
        {/* <Header onOpenNav={nav.onTrue} isOnline={isOnline} />

        <Box
          sx={{
            minHeight: 1,
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
          }}
        >
          {lgUp ? renderNavMini : renderNavVertical}

          <Main>{children}</Main>
        </Box> */}
        <Box
          sx={{
            minHeight: 1,
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
          }}
        >
          {lgUp ? renderNavMini : renderNavVertical}

          {/* <Box
            sx={{
              flexGrow: 1,
              bgcolor: (theme) => theme.palette.background.default,
              height: '100vh',
              width: '100%',
              py: lgUp && 2,
              pr: lgUp && 2,
            }}
          >
            <Box
              sx={{
                bgcolor: (theme) => theme.palette.background.paper,
                width: 1,
                height: 1,
                borderRadius: 2,
                overflow: 'auto',
              }}
            >
              <Header onOpenNav={nav.onTrue} isOnline={isOnline} />

              <Main sx={{ mt: 2 }}>{children}</Main>
            </Box>
          </Box> */}
          <Box
            sx={{
              width: 1,
              height: '95vh',
              borderRadius: 2,
              my: 'auto',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Header onOpenNav={nav.onTrue} isOnline={isOnline} />

            <Box
              sx={{
                scrollbarWidth: 'none',
                overflow: 'auto',
                height: 1,
              }}
            >
              <Main sx={{ py: 2 }}>{children}</Main>
            </Box>
          </Box>
        </Box>
      </>
    );
  }

  return (
    <>
      {/* <Header onOpenNav={nav.onTrue} isOnline={isOnline} /> */}

      <Box
        sx={{
          minHeight: 1,
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          pr: 2,
        }}
      >
        {renderNavVertical}

        <Box
          sx={{
            width: 1,
            height: '95vh',
            borderRadius: 2,
            my: 'auto',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Header onOpenNav={nav.onTrue} isOnline={isOnline} />

          <Box
            sx={{
              scrollbarWidth: 'none',
              overflow: 'auto',
              height: 1,
            }}
          >
            <Main sx={{ py: 2 }}>{children}</Main>
          </Box>
        </Box>

        {/* <Box
          sx={{
            // bgcolor: (theme) => theme.palette.background.default,
            height: 1,
            width: '100%',
            p: lgUp && 2,
            // bgcolor: 'black',
          }}
        >
          <Box
            sx={{
              bgcolor: (theme) => theme.palette.background.paper,
              height: 1,
              width: 1,
              borderRadius: 2,
              scrollbarWidth: 'none',
              overflow: 'auto',
              pt: 10,
            }}
          >
            <Header onOpenNav={nav.onTrue} isOnline={isOnline} />

            <Main>{children}</Main>
          </Box>
        </Box> */}
      </Box>
    </>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node,
};
