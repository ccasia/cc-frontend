import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import { grey } from '@mui/material/colors';
import { useTheme } from '@mui/material/styles';
import { AppBar, Divider } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import { useOffSetTop } from 'src/hooks/use-off-set-top';
import { useResponsive } from 'src/hooks/use-responsive';

import { bgBlur } from 'src/theme/css';

import Logo from 'src/components/logo';
// import ContactsPopover from '../common/contacts-popover';
import SvgColor from 'src/components/svg-color';
import { useSettingsContext } from 'src/components/settings';

import { HEADER } from '../config-layout';
import AccountPopover from '../common/account-popover';
import NotificationsPopover from '../common/notifications-popover';
// import LanguagePopover from '../common/language-popover';

// ----------------------------------------------------------------------

export default function Header({ onOpenNav, isOnline }) {
  const theme = useTheme();

  const settings = useSettingsContext();

  const isNavHorizontal = settings.themeLayout === 'horizontal';

  // const isNavMini = settings.themeLayout === 'mini';

  const lgUp = useResponsive('up', 'lg');

  const offset = useOffSetTop(HEADER.H_DESKTOP);

  const offsetTop = offset && !isNavHorizontal;

  const renderHeader = (
    <Stack direction="row" alignItems="center" spacing={2}>
      {/* <Card
        sx={{
          borderRadius: 1,
          boxShadow: theme.customShadows.z2,
        }}
      > */}
      <NotificationsPopover />
      {/* </Card> */}
      <Divider
        // variant="fullWidth"
        orientation="vertical"
        sx={{
          height: '24px',
          borderColor: grey[200],
        }}
      />
      <AccountPopover isOnline={isOnline} />
    </Stack>
  );

  const renderContent = (
    <>
      {lgUp && isNavHorizontal && <Logo sx={{ mr: 2.5 }} />}

      {!lgUp && (
        <IconButton onClick={onOpenNav}>
          <SvgColor src="/assets/icons/navbar/ic_menu_item.svg" />
        </IconButton>
      )}

      {/* <Searchbar /> */}

      <Stack
        flexGrow={1}
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        spacing={{ xs: 0.5, sm: 1 }}
      >
        {renderHeader}
        {/* <NotificationsPopover /> */}

        {/* <SettingsButton /> */}

        {/* <AccountPopover isOnline={isOnline} /> */}
      </Stack>
    </>
  );

  return (
    <AppBar
      sx={{
        position: lgUp && 'absolute',
        borderBottom: 1,
        borderColor: grey[200],
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
  );
}

Header.propTypes = {
  onOpenNav: PropTypes.func,
  isOnline: PropTypes.bool,
};
