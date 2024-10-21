import { useEffect } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import { grey } from '@mui/material/colors';
import { Avatar, Typography, IconButton } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSettingsContext } from 'src/components/settings';
import { NavSectionVertical } from 'src/components/nav-section';

import { NAV } from '../config-layout';
import { useNavData } from './config-navigation';

// ----------------------------------------------------------------------

export default function NavVertical({ openNav, onCloseNav }) {
  const { user } = useAuthContext();

  const settings = useSettingsContext();

  const pathname = usePathname();

  const lgUp = useResponsive('up', 'lg');

  const navData = useNavData();

  useEffect(() => {
    if (openNav) {
      onCloseNav();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const logo = (
    <Box
      component="div"
      sx={{
        position: 'relative',
        width: 55,
        height: 55,
        borderRadius: 10,
      }}
    >
      <Image
        src="/assets/icons/auth/Vector.svg"
        alt="Background Image"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 'inherit',
        }}
      />
      <Avatar
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 40,
          height: 40,
        }}
        src="/assets/icons/auth/test.svg"
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
        bgcolor: 'background.paper',
      }}
    >
      {/* <Logo sx={{ mt: 3, ml: 4, mb: 1 }} /> */}
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
          <Typography variant="body1" fontWeight={900}>
            CULT CREATIVE
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Creator
          </Typography>
        </Stack>
        <IconButton
          sx={{
            borderRadius: 1,
            border: 0.5,
            borderColor: grey[200],
          }}
          onClick={() =>
            settings.onUpdate(
              'themeLayout',
              settings.themeLayout === 'vertical' ? 'mini' : 'vertical'
            )
          }
        >
          <Iconify icon="radix-icons:double-arrow-left" color="black" width={18} />
        </IconButton>
      </Stack>

      <NavSectionVertical
        data={navData}
        slotProps={{
          currentRole: user?.role,
        }}
      />

      <Box sx={{ flexGrow: 1 }} />
    </Scrollbar>
  );

  return (
    <Box
      sx={{
        flexShrink: { lg: 0 },
        width: { lg: NAV.W_VERTICAL },
      }}
    >
      {/* <NavToggleButton /> */}

      {lgUp ? (
        <Stack
          sx={{
            height: 1,
            position: 'fixed',
            width: NAV.W_VERTICAL,
            // boxShadow: 5,
            // borderRight: (theme) => `dashed 1px ${theme.palette.divider}`,
          }}
        >
          {renderContent}
        </Stack>
      ) : (
        <Drawer
          open={openNav}
          onClose={onCloseNav}
          PaperProps={{
            sx: {
              width: NAV.W_VERTICAL,
            },
          }}
        >
          {renderContent}
        </Drawer>
      )}
    </Box>
  );
}

NavVertical.propTypes = {
  openNav: PropTypes.bool,
  onCloseNav: PropTypes.func,
};
