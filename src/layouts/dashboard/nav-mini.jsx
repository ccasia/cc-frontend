import Box from '@mui/material/Box';
import { Avatar } from '@mui/material';
import Stack from '@mui/material/Stack';

import { hideScroll } from 'src/theme/css';
import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import { NavSectionMini } from 'src/components/nav-section';

import { NAV } from '../config-layout';
import { useNavData } from './config-navigation';
import NavToggleButton from '../common/nav-toggle-button';

// ----------------------------------------------------------------------

export default function NavMini() {
  const { user } = useAuthContext();

  const logo = (
    <Box
      component="div"
      sx={{
        position: 'relative',
        width: 50,
        height: 50,
        borderRadius: 10,
        my: 2,
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

  const navData = useNavData();

  return (
    <Box
      sx={{
        flexShrink: { lg: 0 },
        width: { lg: NAV.W_MINI },
      }}
    >
      <NavToggleButton
        sx={{
          top: 22,
          left: NAV.W_MINI - 12,
        }}
      />

      <Stack
        sx={{
          pb: 2,
          height: 1,
          position: 'fixed',
          alignItems: 'center',
          width: NAV.W_MINI,
          borderRight: (theme) => `dashed 1px ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          ...hideScroll.x,
        }}
      >
        {logo}

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
