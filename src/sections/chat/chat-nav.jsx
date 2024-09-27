/* eslint-disable */
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import { Box, Button, Stack, Typography, Drawer } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { Icon } from '@iconify/react';

import { useGetAllThreads } from 'src/api/chat';
// import ThreadsList from './view/threadlist';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import useSocketContext from 'src/socket/hooks/useSocketContext';
import { useCollapseNav } from './hooks';
import ChatNavItem from './chat-nav-item';
import ChatNavAccount from './chat-nav-account';
import { ChatNavItemSkeleton } from './chat-skeleton';
import { useAuthContext } from 'src/auth/hooks';
// import ChatNavSearchResults from './chat-nav-search-results';

// ----------------------------------------------------------------------

const NAV_WIDTH = 320;

const NAV_COLLAPSE_WIDTH = 96;

export default function ChatNav({}) {
  const theme = useTheme();
  const { user } = useAuthContext();
  const router = useRouter();
  const { socket } = useSocketContext();
  const mdUp = useResponsive('up', 'md');
  const [latestMessages, setLatestMessages] = useState({});
  const [sortedThread, setSortedThreads] = useState([]);
  const { threads, threadrefetch } = useGetAllThreads();
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [archivedChats, setArchivedChats] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  const handleClick = () => {
    onSelectThread(threads.id);
  };

  const {
    collapseDesktop,
    onCloseDesktop,
    onCollapseDesktop,
    //
    openMobile,
    onOpenMobile,
    onCloseMobile,
  } = useCollapseNav();

  useEffect(() => {
    if (!mdUp) {
      onCloseDesktop();
    }
  }, [onCloseDesktop, mdUp]);

  const handleLatestMessage = (message) => {
    console.log('Received latest message:', message);
    setLatestMessages((prevMessages) => ({
      ...prevMessages,
      [message.threadId]: message,
    }));
  };

  useEffect(() => {
    socket?.on('latestMessage', handleLatestMessage);
    return () => {
      socket?.off('latestMessage', handleLatestMessage);
    };
  }, [socket]);

  useEffect(() => {
    const sorted = sortThreadsByLatestMessage(threads || []);
    setSortedThreads(sorted);
    threadrefetch();
  }, [threads, latestMessages]);

  const sortThreadsByLatestMessage = (threads) => {
    return threads.slice().sort((a, b) => {
      const aLastMessageTime = new Date(latestMessages[a.id]?.createdAt).getTime();
      const bLastMessageTime = new Date(latestMessages[b.id]?.createdAt).getTime();
      return bLastMessageTime - aLastMessageTime;
    });
  };

  const handleToggleNav = useCallback(() => {
    if (mdUp) {
      onCollapseDesktop();
    } else {
      onCloseMobile();
    }
  }, [mdUp, onCloseMobile, onCollapseDesktop]);

  const handleClickCompose = useCallback(() => {
    if (!mdUp) {
      onCloseMobile();
    }
    router.push(paths.dashboard.chat);
  }, [mdUp, onCloseMobile, router]);

  const handleArchive = (threadId) => {
    if (archivedChats.includes(threadId)) {
      setArchivedChats(archivedChats.filter((id) => id !== threadId));
    } else {
      setArchivedChats([...archivedChats, threadId]);
    }
  };

  const handleToggleArchive = () => {
    setShowArchived((prevState) => !prevState);
  };

  const renderToggleBtn = (
    <IconButton
      onClick={onOpenMobile}
      sx={{
        left: 0,
        top: 84,
        zIndex: 9,
        width: 32,
        height: 32,
        position: 'absolute',
        borderRadius: `0 12px 12px 0`,
        bgcolor: theme.palette.primary.main,
        boxShadow: theme.customShadows.primary,
        color: theme.palette.primary.contrastText,
        '&:hover': {
          bgcolor: theme.palette.primary.dark,
        },
      }}
    >
      <Iconify width={16} icon="solar:users-group-rounded-bold" />
    </IconButton>
  );

  const sortedThreads = sortThreadsByLatestMessage(threads || []);

  const renderList = (
    <>
      {(!threads || threads.length === 0) && (
        <Typography variant="body2" color="textSecondary">
          No chat groups available
        </Typography>
      )}
      {threads &&
        sortedThreads.map((thread) => {
          const userThread = thread.UserThread.find((ut) => ut.userId === user.id);

          if (!userThread) return null;

          const isArchived = userThread.archived;

          if ((showArchived && isArchived) || (!showArchived && !isArchived)) {
            return (
              <ChatNavItem
                key={thread.id}
                collapse={collapseDesktop}
                thread={thread}
                selected={thread.id === selectedThreadId}
                onCloseMobile={onCloseMobile}
                onClick={() => handleClick(thread.id)}
                onArchive={() => handleArchive(thread.id)}
                latestMessage={latestMessages?.[thread.id]}
              />
            );
          }

          return null;
        })}
    </>
  );

  const renderContent = (
    <>
      <Stack direction="row" alignItems="center" justifyContent="center" sx={{ p: 2.5, pb: 0 }}>
        {!collapseDesktop && (
          <>
            <ChatNavAccount />
            <Box sx={{ flexGrow: 1 }} />
          </>
        )}

        <IconButton onClick={handleToggleNav}>
          <Iconify
            icon={collapseDesktop ? 'eva:arrow-ios-forward-fill' : 'eva:arrow-ios-back-fill'}
          />
        </IconButton>

        {!collapseDesktop && (
          <IconButton onClick={handleClickCompose}>
            {/* <Iconify width={24} icon="solar:user-plus-bold" /> */}
          </IconButton>
        )}
      </Stack>

      {/* <Box sx={{ p: 2.5, pt: 0 }}>{!collapseDesktop && renderSearchInput}</Box> */}
  

  {/* Archive Button */}
  <Button
  sx={{
    p: collapseDesktop ? 1 : 2,
    mt: 4,
    justifyContent: 'center', 
    display: 'flex', 
    alignItems: 'center', 
    width: collapseDesktop ? 'auto' : '100%',
    transition: theme.transitions.create('width', {
      duration: theme.transitions.duration.shorter,
    }),
    ...(collapseDesktop && {
      minWidth: 0,
      borderRadius: '50%',
      '& .MuiButton-startIcon': {
        margin: 0,
      },
      '&:hover': {
        bgcolor: theme.palette.action.hover,
        borderRadius: '50%',
      },
    }),
  }}
  variant="text"
  startIcon={<Icon icon="ic:outline-archive" />}
  onClick={handleToggleArchive}
>
  {!collapseDesktop && (showArchived ? 'Back' : 'Archived Chats')}
</Button>


      <Stack direction="column" alignItems="center" justifyContent="center" sx={{ p: 2.5, pb: 0, mt: 2, }}> 
      </Stack>
      <Scrollbar sx={{ pb: 1 }}>
        {renderList}
        {/* {searchContacts.query && renderListResults}

        {loading && renderSkeleton}

        {!searchContacts.query && !!conversations.allIds.length && renderList} */}
      </Scrollbar>
    </>
  );

  return (
    <>
      {!mdUp && renderToggleBtn}

      {mdUp ? (
        <Stack
          sx={{
            height: 1,
            flexShrink: 0,
            width: NAV_WIDTH,
            borderRight: `solid 1px ${theme.palette.divider}`,
            transition: theme.transitions.create(['width'], {
              duration: theme.transitions.duration.shorter,
            }),
            ...(collapseDesktop && {
              width: NAV_COLLAPSE_WIDTH,
            }),
          }}
        >
          {renderContent}
        </Stack>
      ) : (
        <Drawer
          open={openMobile}
          onClose={onCloseMobile}
          slotProps={{
            backdrop: { invisible: true },
          }}
          PaperProps={{
            sx: { width: NAV_WIDTH },
          }}
        >
          {renderContent}
        </Drawer>
      )}
    </>
  );
}

ChatNav.propTypes = {
  contacts: PropTypes.array,
  // conversations: PropTypes.object,
  loading: PropTypes.bool,
  // selectedConversationId: PropTypes.string,
};
