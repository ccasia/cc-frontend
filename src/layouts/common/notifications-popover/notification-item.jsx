import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

// import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fToNow } from 'src/utils/format-time';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------
// Entity types
// Live
// Campaign
// User
// Pitch
// Shortlist
// Timeline
// Feedback
// Draft
// Post
// Logistic
// Invoice
// Metrcis
// Agreement
// Chat

export default function NotificationItem({ notification }) {
  const { user } = useAuthContext();
  const router = useRouter();

  const handleViewClick = () => {
    const entity = notification.notification?.entity;
    const campaignId = notification.notification?.campaignId;
    const pitchId = notification.notification?.pitchId;
    const creatorId = notification.notification?.creatorId;
    console.log(notification);
    const adminId = notification.notification?.adminId;

    // console.log('User', user);
    // console.log('Notification', notification.notification?.campaignId);
    // console.log('Noti', notification.notification);
    // console.log('Noti user', notification.notification?.userId);
    // Determine the route based on the entity type
    let link;
    if (entity === 'Pitch') {
      if (user.role === 'admin') {
        link = `/dashboard/campaign/discover/detail/${campaignId}`; // Admin route
      } else {
        link = `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage`; // Creator route
      }
    } else if (entity === 'Shortlist') {
      // link = `/dashboard/campaign/details/${campaignId}`;
      link = `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
    } else if (entity === 'Agreement') {
      if (user.role === 'admin') {
        link = `/dashboard/campaign/discover/detail/${campaignId}/creator/${creatorId}`; // Admin route
      } else {
        link = `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`; // Creator route
      }
    } else if (entity === 'Draft') {
      //  link = `/campaign/discover/detail/${campaignId}/creator/${userId}`;
      if (user.role === 'admin') {
        link = `/dashboard/campaign/discover/detail/${campaignId}/creator/${creatorId}`; // Admin route
      } else {
        link = `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
      }
    } else if (entity === 'Post') {
      //  link = `/dashboard/campaign/details/${campaignId}`;
      link = `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
    } else if (entity === 'Chat') {
      link = `/dashboard/chat/details/${campaignId}`;
    } else if (entity === 'Campaign') {
      // This is for Agreement Approval
      // link = `/dashboard/campaign/discover/detail/${campaignId}`;
      link = `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
    } else if (entity === 'Live' && user.role === 'admin') {
      link = `/dashboard/campaign/discover/detail/${campaignId}`; // Adjust this route as needed
    }

    router.push(link);
  };
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

  const renderViewButton = (
    <Button onClick={handleViewClick} variant="outlined" size="small">
      View
    </Button>
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
        {renderViewButton}
        {renderOther}
      </Stack>
    </ListItemButton>
  );
}

NotificationItem.propTypes = {
  notification: PropTypes.object,
};
