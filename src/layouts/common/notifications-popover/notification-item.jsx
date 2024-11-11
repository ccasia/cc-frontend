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


export default function NotificationItem({ notification }) {
  const { user } = useAuthContext();
  const router = useRouter();

  const handleViewClick = () => {
    const { entity, campaignId, threadId, creatorId } = notification.notification ?? {};
  
    console.log("Noti", notification.notification);
  
    let link = '';
  
    // the cases are entity
    switch (entity) {
      case 'Pitch':
        link = user.role === 'admin'
          ? `/dashboard/campaign/discover/detail/${campaignId}`
          : `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage`;
        break;
  
      case 'Shortlist':
        link = `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        break;
  
      case 'Agreement':
        link = user.role === 'admin'
          ? `/dashboard/campaign/discover/detail/${campaignId}/creator/${creatorId}`
          : `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        break;

      case 'Draft':
        link = user.role === 'admin'
          ? `/dashboard/campaign/discover/detail/${campaignId}/creator/${creatorId}`
          : `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        break;
      case 'Post':
        link = user.role === 'admin'
          ? `/dashboard/campaign/discover/detail/${campaignId}/creator/${creatorId}`
          : `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        break;
  
      case 'Chat':
        link = `/dashboard/chat/thread/${threadId}`;
        break;
  
      case 'Campaign':
        link = `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        break;
  
      case 'Status':
        link = user.role === 'admin'
          ? `/dashboard/campaign/manage/${campaignId}`
          : `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        break;
  
      case 'Timeline':
        if (user.role === 'creator') {
          link = `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        }
        break;
  
      case 'Invoice':
        link = user.role === 'admin'
          ? `/dashboard/invoice/creator-list/${campaignId}`
          : `/dashboard/invoice/detail/${threadId}`;
        break;
  
      default:
        console.warn("Unknown notification entity type:", entity);
        break;
    }
  
    if (link) {
      router.push(link);
    } else {
      console.error("No valid route found for notification entity:", entity);
    }
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
    <Button onClick={handleViewClick} variant="outlined" color='secondary' size="small">
      Submit now
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
    </Stack>
  );

  return (
    <ListItemButton
    disableRipple
    sx={{
      p: 2.5,
      alignItems: 'flex-start',
      borderBottom: (theme) => `dashed 1px ${theme.palette.divider}`,
      position: 'relative',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      {/* Left side: Text and View button */}
      <Stack spacing={1} sx={{ flexGrow: 1 }}>
        {renderText}
        {renderViewButton}
      </Stack>

      {/* Right side: Time and Unread Badge */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          textAlign: 'right',
          gap: 1, 
        }}
      >
        {renderOther}
        {renderUnReadBadge}
      </Box>
    </Box>
  </ListItemButton>
  );
}

NotificationItem.propTypes = {
  notification: PropTypes.object,
};
