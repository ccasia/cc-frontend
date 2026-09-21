import { useState } from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import { IconButton } from '@mui/material';
import Typography from '@mui/material/Typography';

import { useResponsive } from 'src/hooks/use-responsive';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Scrollbar from 'src/components/scrollbar';
import { useSettingsContext } from 'src/components/settings';
import { NavSectionMini, NavSectionVertical } from 'src/components/nav-section';

import { NAV } from '../config-layout';
import { useNavData } from './config-navigation';

const MotionBox = m(Box);

export default function NavUnified({ openNav, onCloseNav }) {
  const { user } = useAuthContext();
  const settings = useSettingsContext();
  const lgUp = useResponsive('up', 'lg');
  const navData = useNavData();
  const isNavOpen = localStorage.getItem('isNavOpen');
  const [open, setOpen] = useState(false);

  // const isMini = isNavOpen === 'false';
  const isMini = !open;

  const logo = (
    <Box
      component="div"
      sx={{
        position: 'relative',
        borderRadius: 1,
        width: 40,
        height: 40,
        // width: isMini ? 50 : 40,
        // height: isMini ? 50 : 40,
        // ...(isMini && { my: 2 }),
      }}
    >
      <Image
        src="/assets/icons/navbar/ic_navlogo.svg"
        alt="Cult Creative Logo"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 'inherit',
        }}
      />
    </Box>
  );

  const renderContent = (
    <Scrollbar
      sx={{
        height: 1,
        '& .simplebar-content': {
          height: 1,
          display: 'flex',
          flexDirection: 'column',
        },
        ...(isMini && {
          '& .simplebar-scrollbar': {
            display: 'none !important',
          },
          '& .simplebar-track': {
            display: 'none !important',
          },
        }),
      }}
    >
      <Stack
        sx={{
          p: 3,
          width: NAV.W_VERTICAL,
        }}
        direction="row"
        alignItems="center"
        spacing={1.5}
        mb={2}
      >
        {logo}
        {!isMini && (
          <Stack flexGrow={1}>
            <Typography fontSize="14px" fontWeight={800}>
              CULT CREATIVE
            </Typography>
            <Typography fontSize="12px" color="#636366" fontWeight={500}>
              {user?.role
                ?.split('_')
                .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
                .join(' ')}
            </Typography>
          </Stack>
        )}
      </Stack>

      {isMini ? (
        <NavSectionMini
          data={navData}
          slotProps={{
            currentRole: user?.role,
            onItemClick: onCloseNav,
          }}
        />
      ) : (
        <NavSectionVertical
          data={navData}
          slotProps={{
            currentRole: user?.role,
            onItemClick: onCloseNav,
          }}
        />
      )}

      <Box sx={{ flexGrow: 1 }} />
    </Scrollbar>
  );

  const renderDrawer = (
    <Scrollbar
      sx={{
        height: 1,
        '& .simplebar-content': {
          height: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Stack
        sx={{
          p: 2,
        }}
        direction="row"
        alignItems="center"
        spacing={1.5}
      >
        {logo}
        <Stack flexGrow={1}>
          <Typography fontSize="14px" fontWeight={800}>
            CULT CREATIVE
          </Typography>
          <Typography fontSize="12px" color="#636366" fontWeight={500}>
            {`${user?.role.slice(0, 1).toUpperCase()}${user?.role.slice(1)}`}
          </Typography>
        </Stack>
        <IconButton
          sx={{
            borderRadius: 1.2,
            border: '1.8px solid',
            borderBottom: '4px solid',
            borderColor: '#e7e7e7',
            bgcolor: 'white',
            width: '40px',
            height: '32px',
          }}
          onClick={() => {
            onCloseNav();
            settings.onUpdate(
              'themeLayout',
              settings.themeLayout === 'vertical' ? 'mini' : 'vertical'
            );
          }}
        >
          <img
            src="/assets/icons/navbar/ic_nav_collapse.svg"
            alt="CollapseButton"
            style={{ width: '16px', height: '16px', color: 'black' }}
          />
        </IconButton>
      </Stack>

      <NavSectionVertical
        data={navData}
        slotProps={{
          currentRole: user?.role,
          onItemClick: onCloseNav,
        }}
      />
      <Box sx={{ flexGrow: 1 }} />
    </Scrollbar>
  );

  if (!lgUp) {
    return (
      <Drawer
        open={openNav}
        onClose={onCloseNav}
        PaperProps={{
          sx: {
            width: NAV.W_VERTICAL,
          },
        }}
      >
        {renderDrawer}
      </Drawer>
    );
  }

  return (
    <MotionBox
      initial={false}
      animate={{
        width: isMini ? NAV.W_MINI : NAV.W_VERTICAL,
      }}
      onHoverStart={() => setOpen(true)}
      onHoverEnd={() => setOpen(false)}
      transition={{
        duration: 0.2,
        ease: 'easeInOut',
      }}
      sx={{
        flexShrink: { lg: 0 },
        position: 'relative',
        zIndex: 100,
      }}
    >
      <Stack
        sx={{
          height: 1,
          position: 'fixed',
          width: isMini ? NAV.W_MINI : NAV.W_VERTICAL,
        }}
      >
        {renderContent}
      </Stack>
    </MotionBox>
  );
}

NavUnified.propTypes = {
  openNav: PropTypes.bool,
  onCloseNav: PropTypes.func,
};
