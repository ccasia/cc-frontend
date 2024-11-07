/* eslint-disable */ 
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import { Icon } from '@iconify/react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Iconify from 'src/components/iconify';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetThreadById, archiveThread, unarchiveThread, useGetUnreadMessageCount } from 'src/api/chat';
import { useResponsive } from 'src/hooks/use-responsive';
import { useAuthContext } from 'src/auth/hooks';



// ----------------------------------------------------------------------

export default function ChatNavItem({ onArchive, selected, collapse, thread, latestMessage }) {
  const { user } = useAuthContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const mdUp = useResponsive('up', 'md');

  const router = useRouter();
  const { unreadCount, loading: unreadLoading} = useGetUnreadMessageCount(thread.id);
  const [otherUser, setOtherUser] = useState(null);
  const [userThreadData, setUserThreadData] = useState(null);
  const { thread: threadData } = useGetThreadById(thread.id);


  useEffect(() => {
    if (threadData && !threadData.isGroup && threadData.UserThread) {
      const otherUserInfo = threadData.UserThread.find(userThread => userThread.user.id !== user.id)?.user;
      setOtherUser(otherUserInfo);
    }
  }, [threadData, user]);

  useEffect(() => {
    if (threadData) {
      const userThread = threadData.UserThread.find(ut => ut.userId === user.id);
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

  const handleArchiveClick = async () => {
    try {
      if (userThreadData.archived) {
        await unarchiveThread(threadData.id);
      } else {
        await archiveThread(threadData.id);
      }
      onArchive(threadData.id);
      handleMenuClose();
    } catch (error) {
      console.error('Error archiving/unarchiving thread:', error);
    }
  };

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

  const latestMessageContent = latestMessage?.content;
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
            // secondary={latestMessageContent}
            // secondaryTypographyProps={{
            //   noWrap: true,
            //   component: 'span',
            // variant: conversation.unreadCount ? 'subtitle2' : 'body2',
            // color: conversation.unreadCount ? 'text.primary' : 'text.secondary',
            // }}  
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
            <Iconify width={16} icon="material-symbols:archive-outline" />
            <ListItemText> {userThreadData?.archived ? 'Unarchive' : 'Archive'} </ListItemText>
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
  latestMessage: PropTypes.object,
  onCloseMobile: PropTypes.func,
  selected: PropTypes.bool,
};
