import { useState } from 'react';
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

import CampaignInvitationModal from '../campaign-invitation';

// ----------------------------------------------------------------------

export default function NotificationItem({ notification, markAsRead }) {
  const { user } = useAuthContext();
  const router = useRouter();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const isCreatorInviteNotification =
    user?.role?.includes('creator') &&
    notification?.notification?.entity === 'Pitch' &&
    notification?.notification?.title === 'Campaign Invitation' &&
    Boolean(notification?.notification?.campaignId);

  const campaignNameFromMessage = notification?.notification?.message?.match(/"([^"]+)"/)?.[1];
  const campaignName = notification?.notification?.campaign?.name || campaignNameFromMessage;

  const handleGoToInvitedCampaign = () => {
    const campaignId = notification?.notification?.campaignId;
    setInviteDialogOpen(false);

    if (!campaignId) return;

    const targetLink = `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage?tab=pending&campaignId=${campaignId}`;
    router.push('/dashboard/temp');
    setTimeout(() => router.push(targetLink), 0);
  };

  const handleViewClick = () => {
    const { entity, campaignId, threadId, creatorId, invoiceId } = notification.notification ?? {};

    let link = '';
    let tabToSet = null;

    if (isCreatorInviteNotification) {
      if (notification.read === false) {
        markAsRead(notification.id);
      }
      setInviteDialogOpen(true);
      return;
    }

    // the cases are entity
    switch (entity) {
      case 'Pitch':
        if (user.role.includes('admin')) {
          link = `/dashboard/campaign/discover/detail/${campaignId}`;
          tabToSet = 'creator-master-list';
        } else if (user.role.includes('client')) {
          link = `/dashboard/campaign/details/${campaignId}`;
          tabToSet = 'creator-master-list';
        } else {
          link = `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage`;
        }
        break;

      case 'Shortlist':
        link = `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        break;

      case 'Agreement':
        link = user.role.includes('admin')
          ? `/dashboard/campaign/discover/detail/${campaignId}`
          : `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        tabToSet = user.role.includes('admin') ? 'agreement' : null;
        break;

      case 'Draft':
        if (user.role.includes('admin')) {
          link = `/dashboard/campaign/discover/detail/${campaignId}`;
          tabToSet = 'submissions-v4';
        } else if (user.role.includes('client')) {
          link = `/dashboard/campaign/details/${campaignId}`;
          tabToSet = 'submissions-v4';
        } else {
          link = `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        }
        break;
      case 'Post':
        link = user.role.includes('admin')
          ? `/dashboard/campaign/discover/detail/${campaignId}`
          : `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        tabToSet = user.role.includes('admin') ? 'submissions-v4' : null;
        break;

      case 'Chat':
        link = `/dashboard/chat/thread/${threadId}`;
        break;

      case 'Campaign':
        link = user.role.includes('client')
          ? `/dashboard/campaign/details/${campaignId}`
          : `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        tabToSet = user.role.includes('client') ? 'overview' : null;
        break;

      case 'Status':
        if (user.role.includes('admin')) {
          link = `/dashboard/campaign/manage/${campaignId}`;
        } else if (user.role.includes('client')) {
          link = `/dashboard/campaign/details/${campaignId}`;
          tabToSet = 'overview';
        } else {
          link = `/dashboard/campaign/VUquQR/HJUboKDBwJi71KQ==/manage/detail/${campaignId}`;
        }
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

    // Set the appropriate tab for admin notifications
    if (tabToSet) {
      localStorage.setItem('campaigndetail', tabToSet);

      // For submissions-v4 tab, also store the creator ID to pre-select them
      if (tabToSet === 'submissions-v4' && creatorId) {
        localStorage.setItem('targetCreatorId', creatorId);
      }
    }

    if (link) {
      router.push('/dashboard/temp');
      setTimeout(() => router.push(link), 0);
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
    <Badge badgeContent={1} color="error" variant="dot" sx={{ marginRight: '1px' }} />
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

      <CampaignInvitationModal
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onGoToCampaign={handleGoToInvitedCampaign}
        campaignName={campaignName}
      />
    </>
  );
}

NotificationItem.propTypes = {
  notification: PropTypes.object,
  markAsRead: PropTypes.func,
};
