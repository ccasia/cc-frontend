/* eslint-disable */
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import { Icon } from '@iconify/react';
import { mutate } from 'swr';
import { useNavigate } from 'react-router-dom';
import { IconButton, Button, Alert, Snackbar, Stack, Divider } from '@mui/material';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useGetThreadById } from 'src/api/chat';
import Autocomplete from '@mui/material/Autocomplete';
import { useAuthContext } from 'src/auth/hooks';
import Iconify from 'src/components/iconify';
import SearchNotFound from 'src/components/search-not-found';
import { archiveUserThread, unarchiveUserThread, useGetAllThreads } from 'src/api/chat';
import axiosInstance, { endpoints } from 'src/utils/axios';
import ThreadInfoModal from './threadinfoModal';
import ChatArchiveModal from './chatArchiveModal';
import { useResponsive } from 'src/hooks/use-responsive';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useHandleThread } from 'src/hooks/zustands/useHandleThread';
//  import { toast } from 'react-toastify';

// ----------------------------------------------------------------------

export default function ChatHeaderCompose({ currentUserId, threadId, isClient }) {
  const { user } = useAuthContext();
  const { thread, error } = useGetThreadById(threadId);
  const [archivedChats, setArchivedChats] = useState([]);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [previousArchivedChats, setPreviousArchivedChats] = useState([]);
  const [selectedContact, setSelectedContact] = useState();
  const [loading, setLoading] = useState(true);
  const [openInfoModal, setOpenInfoModal] = useState(false);
  const [autoHideDuration, setAutoHideDuration] = useState(3000);
  const [openArchiveModal, setOpenArchiveModal] = useState(false);
  const { threads } = useGetAllThreads();
  const smDown = useResponsive('down', 'sm');
  const router = useRouter();
  const setThreadId = useHandleThread((state) => state.setThreadId);

  useEffect(() => {
    if (threads) {
      // Extract archived status from threads
      const archivedThreadIds = threads
        .filter((thread) => thread.UserThread.some((ut) => ut.userId === user.id && ut.archived))
        .map((thread) => thread.id);

      setArchivedChats(archivedThreadIds);
      console.log('Archvied', archivedThreadIds);
    }
  }, [threads]);

  const handleOpenInfoModal = () => {
    setOpenInfoModal(true);
  };

  const handleCloseInfoModal = () => {
    setOpenInfoModal(false);
  };

  const handleOpenArchiveModal = () => {
    setOpenArchiveModal(true);
  };

  const handleCloseArchiveModal = () => {
    setOpenArchiveModal(false);
  };

  const handleArchive = async (threadId) => {
    try {
      setPreviousArchivedChats([...archivedChats]);

      if (archivedChats.includes(threadId)) {
        setArchivedChats(archivedChats.filter((id) => id !== threadId));
        await unarchiveUserThread(threadId);
        console.log(`Unarchived Chat ${threadId}`);
        setAlertMessage('Chat unarchived');
        setAlertSeverity('success');
        setLastAction({ action: 'unarchive', threadId });
      } else {
        setArchivedChats([...archivedChats, threadId]);
        await archiveUserThread(threadId);
        console.log(`Archived Chat ${threadId}`);
        setAlertMessage('Chat archived');
        setAlertSeverity('success');
        setLastAction({ action: 'archive', threadId });
      }

      setOpenAlert(true);
      setOpenArchiveModal(false);
    } catch (error) {
      console.error('Error archiving/unarchiving chat:', error);
      setAlertMessage('Error archiving/unarchiving chat.');
      setAlertSeverity('error');
      setOpenAlert(true);
    }
  };

  const handleUndo = () => {
    setAutoHideDuration(5000);
    if (lastAction) {
      // Undo the last action
      setArchivedChats(previousArchivedChats);

      if (lastAction.action === 'archive') {
        unarchiveUserThread(lastAction.threadId);
        setAlertMessage('Undo: Chat unarchived!');
      } else if (lastAction.action === 'unarchive') {
        archiveUserThread(lastAction.threadId);
        setAlertMessage('Undo: Chat archived!');
      }

      setAlertSeverity('success');
      setOpenAlert(true);
      setLastAction(null);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'superadmin';

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await axiosInstance.get(endpoints.users.allusers);
        const filteredContacts = response.data.filter((user) => user.id !== currentUserId);
        setContacts(filteredContacts);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [currentUserId]);

  const otherUser = thread?.UserThread.find((u) => u.userId !== currentUserId);
  const otherUserName = otherUser ? otherUser.user.name : 'Unknown User';

  useEffect(() => {}, [selectedContact]);

  const handleChange = (_event, newValue) => {
    setSelectedContact(newValue);
    createThread(newValue);
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
          userIdsInThread.includes(currentUserId) &&
          userIdsInThread.includes(recipientId) &&
          !thread.isGroup
        );
      });

      if (existingThread) {
        navigate(`/dashboard/chat/thread/${existingThread.id}`);
      } else {
        const response = await axiosInstance.post(endpoints.threads.create, {
          title: ` Chat between ${user.name} & ${recipient.name}`,
          description: '',
          userIds: [currentUserId, recipientId],
          isGroup: false,
        });

        mutate(endpoints.threads.getAll);

        navigate(`/dashboard/chat/thread/${response.data.id}`);
      }
      router.push(threadPath);
    } catch (error) {
      console.error('Error creating thread:', error);
    }
  };

  return (
    <>
      <Snackbar
        open={openAlert}
        autoHideDuration={autoHideDuration}
        onClose={() => setOpenAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={alertSeverity}
          iconMapping={{
            success: (
              <Icon
                icon="tdesign:wave-bye-filled"
                width="24"
                height="24"
                style={{ color: '#ffae00' }}
              />
            ),
          }}
          sx={
            alertSeverity === 'success' && {
              backgroundColor: '#ffffff',
              color: '#000000',
              '& .MuiAlert-message': { fontWeight: 'bold' },
            }
          }
          action={
            <Button onClick={handleUndo} color="secondary" size="small">
              UNDO
            </Button>
          }
        >
          {alertMessage}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: !smDown && 2,
          py: 2,
        }}
      >
        {/* Flex Start: Thread information */}
        <Box width="200px" sx={{ display: 'flex', alignItems: 'center' }}>
          {thread ? (
            <>
              {isClient && (
                <IconButton
                  onClick={() => {
                    setThreadId(null);
                    localStorage.removeItem('threadId');
                  }}
                  sx={{ marginRight: 1 }}
                >
                  <Iconify icon="ep:arrow-left-bold" />
                </IconButton>
              )}
              {/* Display group chat title or single chat other user name */}
              {smDown && !isClient && (
                <IconButton onClick={() => router.push(paths.dashboard.chat.root)}>
                  <Iconify icon="iconamoon:arrow-left-2-light" width={20} />
                </IconButton>
              )}
              {thread.isGroup || thread.campaign ? (
                <>
                  <Avatar
                    alt={thread.campaign?.name || thread.title}
                    src={thread.campaign?.campaignBrief?.images?.[0] || thread.campaign?.photoURL || thread.photoURL}
                    sx={{ width: 32, height: 32, mr: 1 }}
                  />
                  <Typography variant="subtitle2">{thread.campaign?.name || thread.title}</Typography>
                </>
              ) : (
                <>
                  <Avatar
                    alt={otherUserName}
                    src={otherUser?.user?.photoURL}
                    sx={{ width: 40, height: 40, mr: 1 }}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography
                      variant="body"
                      paddingRight={2}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}
                    >
                      <Stack direction={'row'} alignItems={'center'} spacing={0.5}>
                        <Typography variant="subtitle1">{otherUserName}</Typography>
                      </Stack>
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontSize: '12px', color: 'text.secondary' }}
                    >
                      Available
                    </Typography>
                  </Box>
                </>
              )}
            </>
          ) : (
            <Typography variant="h6">Thread not found</Typography>
          )}
        </Box>
        {/* Flex End: Icon buttons */}
        <Box paddingLeft={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!smDown ? (
            <Button
              sx={{
                border: 1,
                borderRadius: 1,
                borderColor: '#E7E7E7',
                px: 2,
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              }}
              startIcon={<Iconify icon="tabler:archive" style={{ color: 'black' }} />}
              onClick={handleOpenArchiveModal}
            >
              {archivedChats.includes(threadId) ? 'Unarchive' : 'Archive'}
            </Button>
          ) : (
            <IconButton
              sx={{
                border: 1,
                borderRadius: 1,
                borderColor: '#E7E7E7',
                height: 38,
                width: 38,
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              }}
              onClick={handleOpenInfoModal}
            >
              <Iconify icon="tabler:archive" style={{ color: 'black' }} />
            </IconButton>
          )}
          <IconButton
            sx={{
              border: 1,
              borderRadius: 1,
              borderColor: '#E7E7E7',
              height: 38,
              width: 38,
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              display: isClient && 'none',
            }}
            onClick={handleOpenInfoModal}
          >
            <Iconify icon="tabler:info-circle" sx={{ color: 'black' }} width={20} />
          </IconButton>

          <ThreadInfoModal
            open={openInfoModal}
            onClose={handleCloseInfoModal}
            threadId={threadId}
          />

          <ChatArchiveModal
            open={openArchiveModal}
            onClose={handleCloseArchiveModal}
            onArchive={() => handleArchive(threadId)}
            archivedChats={archivedChats}
            threadId={threadId}
          />
        </Box>
      </Box>
    </>
  );
}

ChatHeaderCompose.propTypes = {
  currentUserId: PropTypes.string,
  isClient: PropTypes.bool,
};
