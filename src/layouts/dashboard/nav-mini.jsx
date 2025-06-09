import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { IconButton } from '@mui/material';

import { hideScroll } from 'src/theme/css';
import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import { NavSectionMini } from 'src/components/nav-section';
import { useSettingsContext } from 'src/components/settings';

import { NAV } from '../config-layout';
import { useNavData } from './config-navigation';

// ----------------------------------------------------------------------

export default function NavMini() {
  const { user } = useAuthContext();

  const settings = useSettingsContext();

  const logo = (
    <Box
      component="div"
      sx={{
        position: 'relative',
        width: 50,
        height: 50,
        borderRadius: 1,
        my: 3,
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
        }}
        src="/assets/icons/auth/test.svg"
      /> */}
    </Box>
  );

  const navData = useNavData();

  return (
    <Box
      sx={{
        flexShrink: { lg: 0 },
        width: { lg: NAV.W_MINI },
      }}
    >
      {/* <NavToggleButton
        sx={{
          top: 22,
          left: NAV.W_MINI - 12,
        }}
      /> */}

      <Stack
        sx={{
          pb: 2,
          height: 1,
          position: 'fixed',
          alignItems: 'center',
          width: NAV.W_MINI,
          // borderRight: (theme) => `dashed 1px ${theme.palette.divider}`,
          // bgcolor: 'background.paper',
          ...hideScroll.x,
        }}
      >
        <Stack alignItems="center" mb={2}>
          {logo}

          <IconButton
            sx={{
              borderRadius: 1.4,
              border: '1.8px solid',
              borderBottom: '4px solid',
              borderColor: '#e7e7e7',
              bgcolor: 'white',
              width: '50px',
              height: '42px',
              marginBottom: '-4px',
            }}
            onClick={() =>
              settings.onUpdate(
                'themeLayout',
                settings.themeLayout === 'vertical' ? 'mini' : 'vertical'
              )
            }
          >
            <img src="/assets/icons/navbar/ic_nav_expand.svg" alt="Collapse" style={{ width: '22px', color: 'black' }} />
          </IconButton>
        </Stack>

        <NavSectionMini
          data={navData}
          slotProps={{
            currentRole: user?.role,
          }}
        />
      </Stack>
    </Box>
  );
}
