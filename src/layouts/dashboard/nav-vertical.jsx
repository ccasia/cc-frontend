import axios from 'axios';
import { useEffect } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import { grey } from '@mui/material/colors';
import { Avatar, Typography, IconButton } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';
import useGetTokenExpiry from 'src/hooks/use-get-token-expiry';

import { endpoints } from 'src/utils/axios';

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

  const { data } = useGetTokenExpiry();

  const date = new Date(data?.lastRefreshToken || new Date());

  const formatter = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedDate = formatter.format(date);

  const handleActivateXero = async () => {
    try {
      const response = await axios.get(endpoints.invoice.xero, { withCredentials: true });
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error connecting to Xero:', error);
    }
  };

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
        borderRadius: 1,
      }}
    >
      <Image
        src="/logo/vector1.svg"
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
          width: 30,
          height: 30,
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
          <Typography variant="body1" fontWeight={800}>
            CULT CREATIVE
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {`${user?.role.slice(0, 1).toUpperCase()}${user?.role.slice(1)}`}
          </Typography>
        </Stack>
        <IconButton
          sx={{
            borderRadius: 1,
            border: 0.5,
            borderColor: grey[300],
            boxShadow: 3,
          }}
          onClick={() => {
            onCloseNav();
            settings.onUpdate(
              'themeLayout',
              settings.themeLayout === 'vertical' ? 'mini' : 'vertical'
            );
          }}
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
      {/* {!data?.tokenStatus && user.role === 'admin' && user.admin.role.name === 'Finance' ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: 1,
            borderTop: (theme) => `dashed 1px ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" sx={{ mx: 1, mb: 1 }}>
            Update xero
          </Typography>

          <Button
            onClick={handleActivateXero}
            variant="contained"
            color="info"
            sx={{
              mx: 1,
              mb: 1,
              width: 'calc(100% - 100px)',
            }}
          >
            Click me
          </Button>
          <p
            style={{
              opacity: 0.5,
            }}
          >
            {' '}
            Last modified {formattedDate}
          </p>
        </Box>
      ) : null} */}

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
