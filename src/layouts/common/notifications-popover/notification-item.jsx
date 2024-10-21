import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
// import { Button } from '@mui/material';
import Stack from '@mui/material/Stack';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

// import { paths } from 'src/routes/paths';
// import { useRouter } from 'src/routes/hooks';

import { fToNow } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export default function NotificationItem({ notification }) {
  // const router = useRouter();

  const renderText = (
    <ListItemText
      primary={notification.notification?.title}
      secondary={notification.notification.message}
      primaryTypographyProps={{
        variant: 'subtitle2',
        marginBottom: 0.5,
      }}
      secondaryTypographyProps={{
        variant: 'body2',
        marginBottom: 0.5,
      }}
    />
  );

  const renderUnReadBadge = !notification.read && (
    <Box
      sx={{
        top: 26,
        width: 8,
        height: 8,
        right: 20,
        borderRadius: '50%',
        bgcolor: 'info.main',
        position: 'absolute',
      }}
    />
  );

  // const friendAction = (
  //   <Stack spacing={1} direction="row" sx={{ mt: 1.5 }}>
  //     <Button
  //       size="small"
  //       variant="contained"
  //       onClick={() =>
  //         router.push(
  //           paths.dashboard.campaign.adminCampaignManageDetail(
  //             notification?.notification?.campaignId
  //           )
  //         )
  //       }
  //     >
  //       View
  //     </Button>
  //   </Stack>
  // );

  // const chatAction = (
  //   <Stack spacing={1} direction="row" sx={{ mt: 1.5 }}>
  //     <Button
  //       size="small"
  //       variant="contained"
  //       onClick={() => router.push(paths.dashboard.chat.root)}
  //     >
  //       View
  //     </Button>
  //   </Stack>
  // );

  const renderOther = (
    <Stack
      direction="row"
      alignItems="center"
      sx={{ typography: 'caption', color: 'text.disabled' }}
      divider={
        <Box
          sx={{
            width: 2,
            height: 2,
            bgcolor: 'currentColor',
            mx: 0.5,
            borderRadius: '50%',
          }}
        />
      }
    >
      {fToNow(notification.notification.createdAt)}
      {notification.notification?.entity}
    </Stack>
  );

  return (
    <ListItemButton
      disableRipple
      sx={{
        p: 2.5,
        alignItems: 'flex-start',
        borderBottom: (theme) => `dashed 1px ${theme.palette.divider}`,
      }}
    >
      {renderUnReadBadge}
      <Stack sx={{ flexGrow: 1 }}>
        {renderText}
        {/* {['Campaign'].includes(notification?.notification.entity) && friendAction} */}
        {/* {['Shortlist'].includes(notification?.notification.entity) && chatAction} */}
        {/* {notification?.notification.entity === 'Campaign' && friendAction} */}
        {renderOther}
      </Stack>
    </ListItemButton>
  );
}

NotificationItem.propTypes = {
  notification: PropTypes.object,
};
