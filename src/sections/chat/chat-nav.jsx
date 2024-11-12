/* eslint-disable */
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import { Box, Button, Stack, Typography, Drawer, IconButton, Tabs, Tab } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { Icon } from '@iconify/react';

import { useGetAllThreads } from 'src/api/chat';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useResponsive } from 'src/hooks/use-responsive';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import useSocketContext from 'src/socket/hooks/useSocketContext';
import { useCollapseNav } from './hooks';
import ChatNavItem from './chat-nav-item';
import ChatNavAccount from './chat-nav-account';
import { useAuthContext } from 'src/auth/hooks';

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
  const [selected, setSelected] = useState('all');

  const handleToggle = (value) => {
    setSelected(value);
  };

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
      {threads &&
        sortedThreads.map((thread) => {
          const userThread = thread.UserThread.find((ut) => ut.userId === user.id);

          if (!userThread) return null;

          const isArchived = userThread.archived;

          if ((selected === 'archived' && isArchived) || (selected === 'all' && !isArchived)) {
            return (
              <ChatNavItem
                key={thread.id}
                collapse={collapseDesktop}
                thread={thread}
                selected={thread.id === selectedThreadId}
                onCloseMobile={onCloseMobile}
                onClick={() => handleClick(thread.id)}
                // onArchive={() => handleArchive(thread.id)}
                latestMessage={latestMessages?.[thread.id]}
              />
            );
          }

          return null;
        })}
    </>
  );

  const countArchivedChats = () => {
    return threads?.filter((thread) => {
      const userThread = thread.UserThread.find((ut) => ut.userId === user.id);
      return userThread && userThread.archived;
    }).length;
  };

  const countUnarchivedChats = () => {
    return threads?.filter((thread) => {
      const userThread = thread.UserThread.find((ut) => ut.userId === user.id);
      return userThread && !userThread.archived;
    }).length;
  };

  const renderContent = (
    <>
      {/* <Stack direction="row" alignItems="center" justifyContent="center" sx={{ p: 2.5, pb: 0 }}>
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
            <Iconify width={24} icon="solar:user-plus-bold" />
          </IconButton>
        )}
      </Stack> */}

      {/* <Box sx={{ p: 2.5, pt: 0 }}>{!collapseDesktop && renderSearchInput}</Box> */}

      <Box>
        <Tabs
          variant="fullWidth"
          value={selected}
          onChange={(e, val) => {
            setSelected(val);
          }}
          // TabIndicatorProps={{
          //   children: <Box component={'span'} />,
          //   // children: <span />,
          //   sx: {
          //     height: 1,
          //     py: 1,
          //     zIndex: -10000,
          //     bgcolor: 'transparent',
          //     transition: 'all .3s ease-in-out',
          //     '&.MuiTabs-indicator > span': {
          //       bgcolor: '#FFF',
          //       borderColor: '#E7E7E7',
          //       width: '100%',
          //       height: '100%',
          //       display: 'inline-flex',
          //       borderRadius: 1,
          //       boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
          //     },
          //   },
          // }}
          sx={{
            borderRadius: 2,
            m: 1,
            '&.MuiTabs-root': {
              bgcolor: '#F4F4F4',
              p: 1,
            },
            '& .MuiTabs-indicator': {
              position: 'absolute',
              bgcolor: '#FFF',
              border: 1,
              height: 1,
              borderRadius: 1.5,
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              borderColor: '#E7E7E7',
            },
          }}
        >
          <Tab
            value={'all'}
            label="All"
            sx={{
              '&.Mui-selected': {
                borderRadius: 2,
                fontWeight: 600,
                zIndex: 100,
              },
              '&:not(:last-of-type)': {
                mr: 0,
              },
            }}
          />
          <Tab
            value={'archived'}
            label="Archived"
            sx={{
              '&.Mui-selected': {
                borderRadius: 2,
                fontWeight: 600,
                zIndex: 100,
              },
              '&:not(:last-of-type)': {
                mr: 0,
              },
            }}
          />
        </Tabs>
      </Box>

      {/* Archive Button */}
      {/* <Box
        sx={{
          mx: 'auto',
          mt: 4,
          mb: 4,
          textAlign: 'center',
          backgroundColor: '#F4F4F4',
          width: 'fit-content',
          borderRadius: '8px',
          p: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '250px',
            borderRadius: '4px',
            // boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            backgroundColor: '#f4f4f4',
          }}
        >
          <button
            onClick={() => handleToggle('all')}
            style={{
              flex: 1,
              padding: '8px 16px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: selected === 'all' ? 'bold' : 'normal',
              backgroundColor: selected === 'all' ? '#ffffff' : '#f4f4f4',
              borderRadius: '4px 0 0 4px',
            }}
          >
            All ({countUnarchivedChats()})
          </button>
          <button
            onClick={() => handleToggle('archived')}
            style={{
              flex: 1,
              padding: '8px 16px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: selected === 'archived' ? 'bold' : 'normal',
              backgroundColor: selected === 'archived' ? '#ffffff' : '#f4f4f4',
              borderRadius: '0 4px 4px 0',
            }}
          >
            Archived ({countArchivedChats()})
          </button>
        </div>
      </Box> */}

      <Scrollbar sx={{ pb: 1 }}>{renderList}</Scrollbar>
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
            // borderRight: `solid 1px ${theme.palette.divider}`,
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
