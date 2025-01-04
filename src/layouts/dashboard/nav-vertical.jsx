import { useEffect } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import { Typography, IconButton } from '@mui/material';

import { usePathname } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
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

  // const { data } = useGetTokenExpiry();

  // const date = new Date(data?.lastRefreshToken || new Date());

  // const formatter = new Intl.DateTimeFormat('en-US', {
  //   day: '2-digit',
  //   month: '2-digit',
  //   year: 'numeric',
  // });
  // const formattedDate = formatter.format(date);

  // const handleActivateXero = async () => {
  //   try {
  //     const response = await axios.get(endpoints.invoice.xero, { withCredentials: true });
  //     window.location.href = response.data.url;
  //   } catch (error) {
  //     console.error('Error connecting to Xero:', error);
  //   }
  // };

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
        width: 50,
        height: 50,
        borderRadius: 1,
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
      {/* <Avatar
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 30,
          height: 30,
          borderRadius: 0,
        }}
        src="/assets/icons/navbar/ic_nav_logo.svg"
      /> */}
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
            borderRadius: 1.2,
            border: '1.8px solid',
            borderBottom: '4px solid',
            borderColor: '#e7e7e7',
            bgcolor: 'white',
            width: '46px',
            height: '38px',
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
            style={{ width: '20px', color: 'black' }}
          />
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
