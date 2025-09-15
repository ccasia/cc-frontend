/* eslint-disable */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Iconify from 'src/components/iconify';
import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
  useGetThreadById,
  archiveUserThread,
  unarchiveUserThread,
  useGetUnreadMessageCount,
} from 'src/api/chat';
import { useResponsive } from 'src/hooks/use-responsive';
import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export default function ChatNavItem({ onArchive, selected, collapse, thread, onClick }) {
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

  // const handleArchiveClick = async () => {
  //   try {
  //     if (userThreadData.archived) {
  //       await unarchiveUserThread(threadData.id);
  //     } else {
  //       await archiveUserThread(threadData.id);
  //     }
  //     onArchive(threadData.id);
  //     handleMenuClose();
  //   } catch (error) {
  //     console.error('Error archiving/unarchiving thread:', error);
  //   }
  // };

  const latestMessage = thread.latestMessage;

  //  console.log('messages', latestMessage)
  const renderInfo = (
    <>
      <Box position="relative">
        <Badge
          key={user?.status}
          variant={user?.status}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Avatar
            alt={''}
            src={avatarURL}
            sx={{
              width: 40,
              height: 40,
              border: '1px solid #EBEBEB',
            }}
          />
        </Badge>
        {otherUser?.role === 'superadmin' && 'admin' && (
          <Box
            sx={{
              position: 'absolute',
              top: 1,
              right: -1,
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: '#36B37E',
              border: '2px solid #fff',
              zIndex: 1,
            }}
          />
        )}
      </Box>

      <Stack
        direction="column"
        ml={1.5}
        sx={{ flexGrow: 1, overflow: 'hidden', width: 'calc(100% - 80px)' }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={0.5}
          sx={{ width: '100%' }}
        >
          {/* Left-aligned: Title */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ flexGrow: 1, overflow: 'hidden' }}
          >
            <Typography
              noWrap
              variant="subtitle2"
              sx={{
                flexShrink: 1,
                fontSize: '16px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {title}
              {otherUser?.role === 'superadmin' && 'admin' && (
                <Box
                  component="img"
                  src="/assets/icons/components/ic_chat_verified.svg"
                  sx={{
                    width: 16,
                    height: 16,
                    display: 'inline',
                    verticalAlign: 'middle',
                  }}
                />
              )}
            </Typography>
          </Stack>

          {/* Right-aligned: Badge, Timestamp and Arrow */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              flexShrink: 0,
              ml: 'auto',
              minWidth: 'fit-content',
            }}
          >
            <Badge
              color="error"
              overlap="circular"
              variant="dot"
              badgeContent={unreadLoading ? '...' : unreadCount}
              sx={{ mr: 1 }}
            />

            <Typography
              noWrap
              variant="body2"
              component="span"
              sx={{
                fontSize: 13,
                color: '#8E8E93',
                whiteSpace: 'nowrap',
                fontWeight: 550,
              }}
            >
              {latestMessage && latestMessage.createdAt
                ? format(new Date(latestMessage.createdAt), 'hh:mm a')
                : ''}
            </Typography>

            <Iconify
              icon="eva:arrow-ios-forward-fill"
              sx={{
                color: '#8E8E93',
                width: 20,
                height: 20,
                ml: -0.5,
              }}
            />
          </Stack>
        </Stack>

        {/* Latest Message Content*/}
        <Typography
          variant="body2"
          sx={{
            fontSize: 14,
            color: '#636366',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mt: 0.25,
            pr: 2,
            width: '100%',
          }}
        >
          {latestMessage && (
            <>
              {latestMessage.senderId === user.id && (
                <Box component="span" sx={{ color: '#636366', fontWeight: 500 }}>
                  You:{' '}
                </Box>
              )}
              {latestMessage.content}
            </>
          )}
        </Typography>
      </Stack>
    </>
  );

  const handleNav = () => {
    const threadPath = paths.dashboard.chat.thread(thread.id);
    router.push(threadPath);
  };

  return (
    <>
      <ListItemButton
        disableGutters
        onClick={onClick}
        sx={{
          py: 1.5,
          px: 1.5,
          mt: 1,
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: selected ? '#F5F5F5' : 'transparent',
          '&:hover': {
            bgcolor: '#F5F5F5',
            borderRadius: 1,
          },
          transition: (theme) =>
            theme.transitions.create(['background-color'], {
              duration: theme.transitions.duration.shorter,
            }),
        }}
      >
        {renderInfo}
      </ListItemButton>
    </>
  );
}

ChatNavItem.propTypes = {
  collapse: PropTypes.bool,
  //  onArchive: PropTypes.func,
  conversation: PropTypes.object,
  latestMessage: PropTypes.object,
  //  messages: PropTypes.array,
  onCloseMobile: PropTypes.func,
  selected: PropTypes.bool,
};
