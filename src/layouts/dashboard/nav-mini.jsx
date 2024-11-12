import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { grey } from '@mui/material/colors';
import { Avatar, IconButton } from '@mui/material';

import { hideScroll } from 'src/theme/css';
import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import { NavSectionMini } from 'src/components/nav-section';
import { useSettingsContext } from 'src/components/settings';

import { NAV } from '../config-layout';
import { useNavData } from './config-navigation';

// ----------------------------------------------------------------------

export default function NavMini() {
  const { user } = useAuthContext();
  // const { user } = useMockedUser();
  console.log("mohand stash");
  const settings = useSettingsContext();

  const logo = (
    <Box
      component="div"
      sx={{
        position: 'relative',
        width: 50,
        height: 50,
        borderRadius: 1,
        my: 2,
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
              borderRadius: 1,
              border: 0.5,
              borderColor: grey[300],
              boxShadow: 3,
            }}
            onClick={() =>
              settings.onUpdate(
                'themeLayout',
                settings.themeLayout === 'vertical' ? 'mini' : 'vertical'
              )
            }
          >
            <Iconify icon="radix-icons:double-arrow-right" color="black" width={18} />
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
