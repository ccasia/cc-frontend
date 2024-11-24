/* eslint-disable */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import ListItemButton from '@mui/material/ListItemButton';
import Iconify from 'src/components/iconify';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
  useGetThreadById,
  useGetUnreadMessageCount,
} from 'src/api/chat';
import { useResponsive } from 'src/hooks/use-responsive';
import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export default function ChatNavItem({ onArchive, selected, collapse, thread }) {
  const { user } = useAuthContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const mdUp = useResponsive('up', 'md');

  const router = useRouter();
  const { unreadCount, loading: unreadLoading } = useGetUnreadMessageCount(thread.id);
  const [otherUser, setOtherUser] = useState(null);
  const [userThreadData, setUserThreadData] = useState(null);
  const { thread: threadData } = useGetThreadById(thread.id);

  useEffect(() => {
    if (threadData && !threadData.isGroup && threadData.UserThread) {
      const otherUserInfo = threadData.UserThread.find(
        (userThread) => userThread.user.id !== user.id
      )?.user;
      setOtherUser(otherUserInfo);
    }
  }, [threadData, user]);

  useEffect(() => {
    if (threadData) {
      const userThread = threadData.UserThread.find((ut) => ut.userId === user.id);
      setUserThreadData(userThread);
    }
  }, [threadData, user]);

  const avatarURL = thread.isGroup ? thread.photoURL : otherUser?.photoURL;
  const title = thread.isGroup ? thread.title : otherUser?.name;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };


  const latestMessage = thread.latestMessage;

  console.log("Latest message", latestMessage)
  const renderInfo = (
    <>
      <Badge
        key={user?.status}
        variant={user?.status}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Avatar alt={''} src={avatarURL} sx={{ width: 48, height: 48 }} />
      </Badge>

      <Stack direction="column" ml={2} sx={{ flexGrow: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={0.5}
          sx={{ width: '100%' }}
        >
          {/* Left-aligned: Title and Verified Icon */}
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexGrow: 1 }}>
            <Typography noWrap variant="subtitle2" sx={{ flexShrink: 0 }}>
              {title}
            </Typography>

            {/* Show verified icon only for single chats */}
            {/* {!thread.isGroup && (
              <Iconify icon="material-symbols:verified" style={{ color: '#1340FF' }} />
            )} */}
          </Stack>

          {/* Right-aligned: Badge and Timestamp */}
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
            <Badge
              color="error"
              overlap="circular"
              variant="dot"
              badgeContent={unreadLoading ? '...' : unreadCount}
            />

            <Typography
              noWrap
              variant="body2"
              component="span"
              sx={{
                fontSize: 10,
                color: 'text.disabled',
                minWidth: '60px', // Fixed width to prevent pushing out
                textAlign: 'right', // Right-align within its box
                whiteSpace: 'nowrap',
              }}
            >
              {latestMessage && latestMessage.createdAt
                ? format(new Date(latestMessage.createdAt), 'hh:mm a')
                : ''}
            </Typography>
          </Stack>
        </Stack>

        {/* Latest Message Content*/}
        <Typography
          variant="body2"
          sx={{
            fontSize: 12,
            color: 'text.secondary',
            maxWidth: '150px',
            maxHeight: '36px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mt: 0.5,
          }}
        >
          {latestMessage && latestMessage.content}
        </Typography>

        {latestMessage?.file && (
        <Typography
          variant="body2"
          sx={{
            fontSize: 12,
            color: 'text.secondary',
            mt: 0.5,
          }}
        >
          Attachment Sent
        </Typography>
        )}
        
      </Stack>
    </>
  );

  const handleNav = () => {
    const threadPath = paths.dashboard.chat.thread(thread.id);
    // console.log(threadPath);
    router.push(threadPath);
  };

  return (
    <>
      <ListItemButton
        disableGutters
        onClick={handleNav}
        sx={{
          py: 1.5,
          px: 2.5,
          ...(selected && {
            bgcolor: 'action.selected',
          }),
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {renderInfo}
      </ListItemButton>

    </>
  );
}

ChatNavItem.propTypes = {
  collapse: PropTypes.bool,
  conversation: PropTypes.object,
  latestMessage: PropTypes.object,
  onCloseMobile: PropTypes.func,
  selected: PropTypes.bool,
};
