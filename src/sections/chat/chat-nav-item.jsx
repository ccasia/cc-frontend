/* eslint-disable */ 
import { useState } from 'react';
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
import { useRouter } from 'src/routes/hooks';
import { useGetAllThreads, archiveThread, unarchiveThread } from 'src/api/chat';
import { useResponsive } from 'src/hooks/use-responsive';
// import { useMockedUser } from 'src/hooks/use-mocked-user';
import { useAuthContext } from 'src/auth/hooks';
// import { clickConversation } from 'src/api/chat';

import { paths } from 'src/routes/paths';
// import { useGetNavItem } from './hooks';

// ----------------------------------------------------------------------

export default function ChatNavItem({  onArchive, selected, collapse, thread, onCloseMobile }) {
  const { user } = useAuthContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const mdUp = useResponsive('up', 'md');

  const router = useRouter();

  const { threads, loading: threadsLoading, error: threadsError } = useGetAllThreads();


  // const { group, displayName, displayText, participants, lastActivity, hasOnlineInGroup } =
  //   useGetNavItem({
  //     threads,
  //     currentUserId: `${user?.id}`,
  //   });

  // const singleParticipant = participants[0];

  // const { name, avatarUrl, status } = singleParticipant;

  if (threadsLoading) return <div>Loading threads...</div>;
  if (threadsError) return <div>Error loading threads: {threadsError.message}</div>;

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

  // const handleArchiveClick = () => {
  //   // event.stopPropagation(); 
  //   onArchive(thread.id); // Calls the parent's archive handler with thread id
  //   handleMenuClose();
  // };

  const handleClickThread = useCallback(async () => {
    try {
      if (!mdUp) {
        onCloseMobile();
      }

      const threadPath = paths.dashboard.chat.thread(thread.id);
      router.push(threadPath);

      // await clickThread(thread.id);
      
    } catch (error) {
      console.error(error);
    }
  }, [thread.id, mdUp, onCloseMobile, router]);


  // const handleClickConversation = useCallback(async () => {
  //   try {
  //     if (!mdUp) {
  //       onCloseMobile();
  //     }

  //     await clickConversation(conversation.id);

  //     router.push(`${paths.dashboard.chat}?id=${conversation.id}`);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }, [conversation.id, mdUp, onCloseMobile, router]);

  // const renderGroup = (
  //   <Stack>
  //   <Button variant="outlined">Outlined</Button>
  //   <Badge
  //     //variant={hasOnlineInGroup ? 'online' : 'invisible'}
  //     anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  //   >
  //     {/* <AvatarGroup variant="compact" sx={{ width: 48, height: 48 }}>
  //       {participants.slice(0, 2).map((participant) => (
  //         <Avatar key={participant.id} alt={participant.name} src={participant.avatarUrl} />
  //       ))}
  //     </AvatarGroup> */}
  //   </Badge>
  // </Stack>
  // );

  // use this to show the reciever images and details
  const renderSingle = (
    <Badge key={user?.status} variant={user?.status} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Avatar alt={user.name} src={user.photoURL} sx={{ width: 48, height: 48 }} />
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
        badgeContent={collapse ? thread.unreadCount : 0}
      >
         {renderSingle}
      </Badge>

      {!collapse && (
        <>
          <ListItemText
            sx={{ ml: 2 }}
            primary={thread.title}
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
              {/* {formatDistanceToNowStrict(new Date(lastActivity), {
                addSuffix: false,
              })} */}
            </Typography>

            {/* {!!conversation.unreadCount && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  bgcolor: 'info.main',
                  borderRadius: '50%',
                }}
              />
            )} */}
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
