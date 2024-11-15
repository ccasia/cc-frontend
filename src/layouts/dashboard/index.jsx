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

  // const isHorizontal = settings.themeLayout === 'horizontal';

  const isMini = settings.themeLayout === 'mini';

  const renderNavMini = <NavMini />;

  // const renderHorizontal = <NavHorizontal />;

  const renderNavVertical = <NavVertical openNav={nav.value} onCloseNav={nav.onFalse} />;

  // if (isHorizontal) {
  //   return (
  //     <>
  //       <Header onOpenNav={nav.onTrue} isOnline={isOnline} />

  //       {lgUp ? renderHorizontal : renderNavVertical}

  //       <Main>{children}</Main>
  //     </>
  //   );
  // }

  if (isMini) {
    return (
      <Box
        sx={{
          minHeight: 1,
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          pr: lgUp && 2,
        }}
      >
        {lgUp ? renderNavMini : renderNavVertical}

        <Box
          sx={{
            ...(lgUp && {
              width: 1,
              height: '95vh',
              borderRadius: 2,
              my: 'auto',
              overflow: 'auto',
              position: 'relative',
              bgcolor: (theme) => theme.palette.background.paper,
            }),
          }}
        >
          <Header onOpenNav={nav.onTrue} isOnline={isOnline} />

          <Main sx={{ py: 2 }}>{children}</Main>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: 1,
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        pr: lgUp && 2,
      }}
    >
      {renderNavVertical}

      <Box
        sx={{
          ...(lgUp && {
            width: 1,
            height: '95vh',
            borderRadius: 2,
            my: 'auto',
            overflow: 'auto',
            position: 'relative',
            bgcolor: (theme) => theme.palette.background.paper,
          }),
        }}
      >
        <Header onOpenNav={nav.onTrue} isOnline={isOnline} />

        {/* <Box
            sx={{
              scrollbarWidth: 'none',
              overflow: 'auto',
              height: 1,
              bgcolor: 'wheat',
              p: 2,
              m: 2,
            }}
          > */}
        <Main sx={{ py: 2 }}>{children}</Main>
        {/* </Box> */}
      </Box>
    </Box>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node,
};
