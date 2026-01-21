import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import { grey } from '@mui/material/colors';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import { Box, Chip, AppBar, Divider, Typography } from '@mui/material';

import { useOffSetTop } from 'src/hooks/use-off-set-top';
import { useResponsive } from 'src/hooks/use-responsive';

import { bgBlur } from 'src/theme/css';
import { useAuthContext } from 'src/auth/hooks';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';
// import ContactsPopover from '../common/contacts-popover';
import { varHover } from 'src/components/animate';
import { useSettingsContext } from 'src/components/settings';

import { HEADER } from '../config-layout';
import ChatPopover from '../common/chat-popover';
import AccountPopover from '../common/account-popover';
import NotificationsPopover from '../common/notifications-popover';
// import LanguagePopover from '../common/language-popover';

// ----------------------------------------------------------------------

export default function Header({ onOpenNav, isOnline }) {
  const theme = useTheme();

  const settings = useSettingsContext();

  const { user } = useAuthContext();

  const isNavHorizontal = settings.themeLayout === 'horizontal';

  const lgUp = useResponsive('up', 'lg');

  const offset = useOffSetTop(HEADER.H_DESKTOP);

  const offsetTop = offset && !isNavHorizontal;

  const renderHeader = (
    <Stack direction="row" alignItems="center" spacing={1}>
      {user?.isImpersonating && (
        <Chip
          variant="outlined"
          color="secondary"
          label={
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="caption">Impersonating mode</Typography>
              <Typography variant="caption">Initiated by {user.impersonatingBy}</Typography>
            </Box>
          }
          icon={<Iconify icon="fluent:important-12-regular" />}
          sx={{
            height: 'auto',
          }}
        />
      )}
      <NotificationsPopover />
      <ChatPopover />
      {/* </Card> */}
      <Divider
        orientation="vertical"
        sx={{
          height: '28px',
          borderColor: grey[200],
          mx: 1,
        }}
      />
      <AccountPopover isOnline={isOnline} />
    </Stack>
  );

  const renderContent = (
    <>
      {lgUp && isNavHorizontal && <Logo sx={{ mr: 2.5 }} />}

      {!lgUp && (
        <IconButton
          sx={{
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '6px 10px 9px',
            gap: '2px',
            width: '40px',
            height: '40px',
            background: '#FFFFFF',
            border: '1px solid #E8E8E8',
            boxShadow: 'inset 0px -3px 0px #E7E7E7',
            borderRadius: '8px',
            '& .MuiBadge-dot': {
              top: '5px',
              right: '5px',
              border: '1px solid #FFFFFF',
              borderRadius: '500px',
            },
          }}
          component={m.button}
          whileTap="tap"
          whileHover="hover"
          variants={varHover(1.05)}
          onClick={onOpenNav}
        >
          <Iconify icon="stash:burger-classic-duotone" width={20} color="blue" />
        </IconButton>
      )}

      <Stack
        flexGrow={1}
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        spacing={{ xs: 0.5, sm: 1 }}
      >
        {renderHeader}
      </Stack>
    </>
  );

  return (
    <>
      <AppBar
        sx={{
          position: 'absolute',
          borderBottom: 1,
          borderBottomColor: theme.palette.divider,
          height: HEADER.H_MOBILE,
          zIndex: theme.zIndex.appBar + 1,
          ...bgBlur({
            color: theme.palette.background.paper,
          }),
          transition: theme.transitions.create(['height'], {
            duration: theme.transitions.duration.shorter,
          }),
          ...(lgUp && {
            height: HEADER.H_DESKTOP,
            ...(offsetTop && {
              height: HEADER.H_DESKTOP_OFFSET,
            }),
            ...(isNavHorizontal && {
              width: 1,
              bgcolor: 'background.default',
              height: HEADER.H_DESKTOP_OFFSET,
              borderBottom: `dashed 1px ${theme.palette.divider}`,
            }),
          }),
        }}
      >
        <Toolbar
          sx={{
            height: 1,
            px: { lg: 5 },
          }}
        >
          {renderContent}
        </Toolbar>
      </AppBar>
      <Divider />
    </>
  );
}

Header.propTypes = {
  onOpenNav: PropTypes.func,
  isOnline: PropTypes.bool,
};
