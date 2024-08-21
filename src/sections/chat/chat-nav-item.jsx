/* eslint-disable */ 
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import AvatarGroup from '@mui/material/AvatarGroup';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import { Icon } from '@iconify/react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon'; 
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Iconify from 'src/components/iconify';


// import { paths } from 'src/routes/paths';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetAllThreads, archiveThread, unarchiveThread, useGetUnreadMessageCount } from 'src/api/chat';
import { useResponsive } from 'src/hooks/use-responsive';

// import { useMockedUser } from 'src/hooks/use-mocked-user';
import { useAuthContext } from 'src/auth/hooks';
// import { clickConversation } from 'src/api/chat';


// ----------------------------------------------------------------------

export default function ChatNavItem({ photoURL, onArchive, selected, collapse, thread, onCloseMobile }) {
  const { user } = useAuthContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const mdUp = useResponsive('up', 'md');

  const router = useRouter();
  const { unreadCount, loading: unreadLoading, error: unreadError } = useGetUnreadMessageCount(thread.id);
  const [otherUser, setOtherUser] = useState(null);

  // useEffect(() => {
  //   if (!thread.isGroup && thread.UserThread) {
  //     // Find the user that is not the current user
  //     const otherUserInfo = thread.UserThread.find(userThread => userThread.userId !== user.id)?.user;
  //     setOtherUser(otherUserInfo);
  //     console.log("user info", otherUserInfo)
  //   }
  // }, [thread, user]);

  useEffect(() => {
    if (!thread.isGroup && thread.UserThread) {
      // Find the user that is not the current user
      const otherUserInfo = thread.UserThread.find(userThread => userThread.user.id !== user.id)?.user;
      setOtherUser(otherUserInfo);
      console.log("user info", otherUserInfo)
    }
  }, [thread, user]);

  //  const isGroupChat = thread.isGroup;
  // const avatarURL = thread.photoURL

  const avatarURL = thread.isGroup ? thread.photoURL : otherUser?.photoURL;
  const title = thread.isGroup ? thread.title : otherUser?.name;

  //  const { threads, loading: threadsLoading, error: threadsError } = useGetAllThreads();

  // if (threadsLoading) return <div>Loading threads...</div>;
  // if (threadsError) return <div>Error loading threads: {threadsError.message}</div>;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget); // Set anchor element to ellipses IconButton
  };

  const handleMenuClose = () => {
    setAnchorEl(null); // Close the menu
  };

  
  const handleArchiveClick = async () => {
    try {
      if (thread.archived) {
        await unarchiveThread(thread.id); 
      } else {
        await archiveThread(thread.id);
      }
      onArchive(thread.id);
      handleMenuClose();
    } catch (error) {
      console.error('Error archiving/unarchiving thread:', error);
    }
  };


  // const handleClickThread = useCallback(async () => {
  //   try {
  //     if (!mdUp) {
  //       onCloseMobile();
  //     }

  //     const threadPath = paths.dashboard.chat.thread(thread.id);
  //     router.push(threadPath);

  //     // await clickThread(thread.id);
      
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }, [thread.id, mdUp, onCloseMobile, router]);


 

  // use this to show the reciever images and details
  const renderSingle = (
    <Badge key={user?.status} variant={user?.status} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Avatar alt={''} src={avatarURL} sx={{ width: 48, height: 48 }} />
    </Badge>
  );

  const  handleNav = () => {
    const threadPath = paths.dashboard.chat.thread(thread.id)
   // console.log(threadPath);
    router.push(threadPath);
  }

  return (
    <ListItemButton
      disableGutters
      onClick={handleNav}
      sx={{
        py: 1.5,
        px: 2.5,
        ...(selected && {
          bgcolor: 'action.selected',
        }),
      }}
    >
       <Badge
        color="error"
        overlap="circular"
        badgeContent={unreadLoading ? '...' : unreadCount}
      >
         {renderSingle}
      </Badge>

      {!collapse && (
        <>
          <ListItemText
            sx={{ ml: 2 }}
            primary={title}
            primaryTypographyProps={{
              noWrap: true,
              variant: 'subtitle2',
            }}
            secondary={thread.description}
            secondaryTypographyProps={{
              noWrap: true,
              component: 'span',
              // variant: conversation.unreadCount ? 'subtitle2' : 'body2',
              // color: conversation.unreadCount ? 'text.primary' : 'text.secondary',
            }}
          />

          <Stack alignItems="flex-end" sx={{ ml: 2, height: 44 }}>
            <Typography
              noWrap
              variant="body2"
              component="span"
              sx={{
                mb: 1.5,
                fontSize: 12,
                color: 'text.disabled',
              }}
            >
            </Typography>

          </Stack>
          
         {/* Menu for Actions */}
         <IconButton
            onClick={handleMenuOpen}
          >
            <Icon icon="bi:three-dots-vertical" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
             PaperProps={{
              style: {
              width: 100, 
        },
      }}
          >
            <MenuItem onClick={handleArchiveClick}>
            <ListItemText> {thread.archived ? 'Unarchive' : 'Archive'} </ListItemText>
            <Iconify width={16} icon="material-symbols:archive-outline" />
            </MenuItem>

            {/* <MenuItem>
            <ListItemText> Mute </ListItemText>
            {/* <ListItemIcon style={{ justifyContent: 'flex-end' }}> */}
            {/* <Iconify width={16} icon="tabler:bell-off" /> */}
            {/* </ListItemIcon> 
            </MenuItem> */}
          </Menu>

        </>
      )}
    </ListItemButton>
  );
}

ChatNavItem.propTypes = {
  collapse: PropTypes.bool,
  onArchive: PropTypes.func.isRequired,
  conversation: PropTypes.object,
  onCloseMobile: PropTypes.func,
  selected: PropTypes.bool,
};
