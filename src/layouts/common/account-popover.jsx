import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import { Badge } from '@mui/material';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';

import { varHover } from 'src/components/animate';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

const OPTIONS = [
  {
    label: 'Home',
    linkTo: paths.dashboard.overview.root,
  },
  {
    label: 'Profile',
    linkTo: paths.dashboard.user.profile,
  },
  // {
  //   label: 'Settings',
  //   linkTo: '/#2',
  // },
];

// ----------------------------------------------------------------------

export default function AccountPopover({ isOnline }) {
  const router = useRouter();

  const { logout, user } = useAuthContext();

  const popover = usePopover();

  const handleLogout = async () => {
    try {
      await logout();
      popover.onClose();
      router.replace('/');
    } catch (error) {
      console.error(error);
    }
  };

  const handleClickItem = (path, label) => {
    popover.onClose();
    if (label === 'Home' && user?.role === 'creator') {
      router.push(path);
    }
    if (label === 'Profile') {
      router.push(path);
    }
  };

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        onClick={popover.onOpen}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '4px',
          gap: '10px',
          isolation: 'isolate',
          width: 40,
          height: 40,
          border: '2px solid #EBEBEB',
          borderRadius: '500px',
          ...(popover.open && {
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          }),
        }}
      >
        <Badge
          color={isOnline ? 'success' : 'error'}
          variant="dot"
          sx={{
            position: 'relative',
            top: 0,
            right: 0,
            zIndex: 1,
            '& .MuiBadge-dot': {
              width: '12px',
              height: '12px',
              top: '8px',
              right: '5px',
              border: '2px solid #FFFFFF',
              borderRadius: '500px',
            },
          }}
        >
          <Avatar
            src={user?.photoURL}
            alt={user?.name}
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '5px',
              isolation: 'isolate',
              width: 40,
              height: 40,
              border: (theme) => `solid 2px ${theme.palette.background.default}`,
              borderRadius: '500px',
              position: 'relative',
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
        </Badge>
      </IconButton>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        hiddenArrow
        sx={{ mt: 0.5, ml: 0, p: 0, minWidth: '240px' }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              src={user?.photoURL}
              // sx={{
              //   width: 40,
              //   height: 40,
              //   border: (theme) => `solid 2px ${theme.palette.background.default}`,
              // }}
            />
            <Box>
              <Typography variant="subtitle2" noWrap>
                {user?.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                {user?.email}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack sx={{ p: 1 }}>
          {OPTIONS.map((option) => (
            <MenuItem
              key={option.label}
              sx={{ minHeight: '40px' }}
              onClick={() => handleClickItem(option.linkTo, option.label)}
            >
              {option.label}
            </MenuItem>
          ))}
        </Stack>

        <Divider sx={{ marginLeft: '10px', marginRight: '10px' }} />

        <MenuItem
          onClick={handleLogout}
          sx={{ m: 1, minHeight: '40px', fontWeight: 'fontWeightBold', color: 'error.main' }}
        >
          Log out
        </MenuItem>
      </CustomPopover>
    </>
  );
}

AccountPopover.propTypes = {
  isOnline: PropTypes.bool,
};
