import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

// import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fToNow } from 'src/utils/format-time';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function NotificationItem({ notification, markAsRead }) {
  const { user } = useAuthContext();
  const router = useRouter();

  const handleViewClick = () => {
    const { entity, campaignId, threadId, creatorId, invoiceId } = notification.notification ?? {};

    let link = '';

    // the cases are entity
    switch (entity) {
      case 'Pitch':
        link = user.role.includes('admin')
          ? `/dashboard/campaign/discover/detail/${campaignId}`
          : `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage`;
        break;

      case 'Shortlist':
        link = `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        break;

      case 'Agreement':
        link = user.role.includes('admin')
          ? `/dashboard/campaign/discover/detail/${campaignId}/creator/${creatorId}`
          : `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        break;

      case 'Draft':
        link = user.role.includes('admin')
          ? `/dashboard/campaign/discover/detail/${campaignId}/creator/${creatorId}`
          : `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        break;
      case 'Post':
        link = user.role.includes('admin')
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
        link = user.role.includes('admin')
          ? `/dashboard/campaign/manage/${campaignId}`
          : `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        break;

      case 'Timeline':
        if (user.role.includes('creator')) {
          link = `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        }
        break;

      case 'Invoice':
        link = user.role.includes('admin')
          ? `/dashboard/invoice/creator-list/${campaignId}`
          : `/dashboard/invoiceCreator/${invoiceId}`;
        break;

      default:
        console.warn('Unknown notification entity type:', entity);
        break;
    }

    if (notification.read === false) {
      markAsRead(notification.id);
    }

    if (link) {
      router.push(link);
    } else {
      console.error('No valid route found for notification entity:', entity);
    }
  };

  const renderTitle = (
    <ListItemText
      primary={notification.notification?.title}
      primaryTypographyProps={{
        variant: 'subtitle2',
        marginBottom: 0.5,
      }}
    />
  );

  const renderText = (
    <ListItemText
      secondary={notification.notification.message}
      secondaryTypographyProps={{
        variant: 'body2',
        marginBottom: 0.5,
      }}
    />
  );

  const renderViewSignUp = notification.notification?.entity === 'Timeline' && (
    <Typography variant="body2" color="secondary" sx={{ textAlign: 'left', width: '100px' }}>
      Submit now &gt;
    </Typography>
  );

  const renderUnReadBadge = !notification.read && (
    <Badge
      badgeContent={1}
      color="error"
      variant="dot"
      sx={{ marginRight: '1px' }}
     />
  );

  const renderReadStatus = notification.read && (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" color="textSecondary">
        Read
      </Typography>
      <Iconify
        icon="mdi:tick-all"
        width="24"
        height="24"
        style={{ color: 'black', marginRight: '4px' }}
      />
    </Box>
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
    <>
      <ListItemButton
        disableRipple
        sx={{
          p: 2.5,
          alignItems: 'flex-start',
          position: 'relative',
        }}
        onClick={handleViewClick}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-start' }}>
              {renderTitle}
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              {renderUnReadBadge}
              {renderOther}
            </Box>
          </Box>

          <Stack spacing={1} sx={{ flexGrow: 1 }}>
            {renderText}
            {renderViewSignUp}
            {/* {renderReadStatus} */}
          </Stack>
        </Box>
      </ListItemButton>
      <Divider sx={{ marginLeft: '16px', marginRight: '16px' }} />
    </>
  );
}

NotificationItem.propTypes = {
  notification: PropTypes.object,
  markAsRead: PropTypes.func,
};
