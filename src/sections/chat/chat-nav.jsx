/* eslint-disable */
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { Box, Stack, Typography, IconButton, Tabs, Tab, Autocomplete, Avatar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';

import { useGetAllThreads } from 'src/api/chat';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useResponsive } from 'src/hooks/use-responsive';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import useSocketContext from 'src/socket/hooks/useSocketContext';
import { useCollapseNav } from './hooks';
import ChatNavItem from './chat-nav-item';
import { useAuthContext } from 'src/auth/hooks';
import axiosInstance, { endpoints } from 'src/utils/axios';
import { mutate } from 'swr';

// ----------------------------------------------------------------------

const NAV_WIDTH = 400;

const NAV_COLLAPSE_WIDTH = 96;

export default function ChatNav({ isClient, setThreadId }) {
  const theme = useTheme();
  const { user } = useAuthContext();
  const router = useRouter();
  const { socket } = useSocketContext();
  const mdUp = useResponsive('up', 'md');
  const [latestMessages, setLatestMessages] = useState({});
  const [sortedThread, setSortedThreads] = useState([]);
  const { threads, threadrefetch } = useGetAllThreads();
  const { id } = useParams();
  const [selectedThreadId, setSelectedThreadId] = useState(id || null);
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState('all');
  const [selectedContact, setSelectedContact] = useState();
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'superadmin';

  const handleToggle = (value) => {
    setSelected(value);
  };

  const handleClick = (threadId) => {
    if (isClient) {
      localStorage.setItem('threadId', threadId);
      setThreadId(threadId);
      return;
    }

    setSelectedThreadId(threadId);
    const threadPath = paths.dashboard.chat.thread(threadId);
    router.push(threadPath);
    if (!mdUp) {
      onCloseMobile();
    }
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

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await axiosInstance.get(endpoints.users.allusers);
        const filteredContacts = response.data.filter((a) => a.id !== user.id);
        setContacts(filteredContacts);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }
    fetchUsers();
  }, [user]);

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
                selected={thread.id === id}
                onCloseMobile={onCloseMobile}
                onClick={() => {
                  handleClick(thread.id);
                }}
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

  const createThread = async (recipient) => {
    if (!recipient || !recipient.id) {
      console.error('Invalid recipient:', recipient);
      return;
    }

    try {
      const recipientId = recipient.id;

      const existingThreadResponse = await axiosInstance.get(endpoints.threads.getAll);

      const existingThread = existingThreadResponse.data.find((thread) => {
        const userIdsInThread = thread.UserThread.map((userThread) => userThread.userId);

        return (
          userIdsInThread.includes(user?.id) &&
          userIdsInThread.includes(recipientId) &&
          !thread.isGroup
        );
      });

      if (existingThread) {
        if (isClient) {
          localStorage.setItem('threadId', existingThread.id);
          setThreadId(existingThread.id);
        } else {
          router.push(`/dashboard/chat/thread/${existingThread.id}`);
        }
      } else {
        const response = await axiosInstance.post(endpoints.threads.create, {
          title: ` Chat between ${user.name} & ${recipient.name}`,
          description: '',
          userIds: [user?.id, recipientId],
          isGroup: false,
        });

        mutate(endpoints.threads.getAll);

        if (isClient) {
          localStorage.setItem('threadId', response.data.id);
          setThreadId(response.data.id);
        } else {
          router.push(`/dashboard/chat/thread/${response.data.id}`);
        }
      }
      // router.push(threadPath);
    } catch (error) {
      console.error('Error creating thread:', error);
    }
  };

  const handleChange = (_event, newValue) => {
    setSelectedContact(newValue);
    createThread(newValue);
  };

  const renderContent = (
    <>
      <Box>
        <Tabs
          variant="fullWidth"
          value={selected}
          onChange={(_, val) => {
            setSelected(val);
          }}
          sx={{
            borderRadius: 1,
            minHeight: 36,
            width: '100%',
            mx: 'auto',
            '&.MuiTabs-root': {
              bgcolor: '#F4F4F4',
              p: 0.5,
            },
            '& .MuiTabs-indicator': {
              position: 'absolute',
              bgcolor: '#FFF',
              border: 1,
              height: 1,
              borderRadius: 1,
              boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
              borderColor: '#E7E7E7',
            },
          }}
        >
          <Tab
            value={'all'}
            label={`All (${countUnarchivedChats() || 0})`}
            sx={{
              '&.Mui-selected': {
                borderRadius: 1,
                fontWeight: 600,
                zIndex: 100,
              },
              '&:not(:last-of-type)': {
                mr: 0,
              },
              minHeight: 36,
              py: 0.5,
            }}
          />
          <Tab
            value={'archived'}
            label={`Archived (${countArchivedChats() || 0})`}
            sx={{
              '&.Mui-selected': {
                borderRadius: 1,
                fontWeight: 600,
                zIndex: 100,
              },
              '&:not(:last-of-type)': {
                mr: 0,
              },
              minHeight: 36,
              py: 0.5,
            }}
          />
        </Tabs>
      </Box>

      {(isAdmin || isSuperAdmin) && contacts.length > 0 && (
        <Box>
          <Autocomplete
            popupIcon={null}
            size="small"
            disablePortal
            noOptionsText={
              'No creator found'
              // <SearchNotFound query={contacts.length > 0 ? '' : 'No contacts found'} />
            }
            onChange={handleChange}
            options={contacts || []}
            getOptionLabel={(recipient) => recipient.name || ''}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search for creators"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <Iconify
                        icon="material-symbols:search-rounded"
                        style={{ color: 'black', marginRight: '8px' }}
                      />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, recipient, { selected }) => (
              <li {...props} key={recipient.id}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Avatar
                    alt={recipient.name}
                    src={recipient.photoURL}
                    sx={{ width: 32, height: 32, mr: 1 }}
                  />
                  <div>
                    <Typography variant="body1">{recipient.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {recipient.email}
                    </Typography>
                  </div>
                </Box>
              </li>
            )}
          />
        </Box>
      )}

      <Scrollbar sx={{ pb: 1, flex: 1, overflow: 'auto', height: '100%' }}>{renderList}</Scrollbar>
    </>
  );

  return (
    <>
      <Stack
        spacing={1}
        sx={{
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
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
    </>
  );
}

ChatNav.propTypes = {
  contacts: PropTypes.array,
  isClient: PropTypes.bool,
  // conversations: PropTypes.object,
  loading: PropTypes.bool,
  // selectedConversationId: PropTypes.string,
};
