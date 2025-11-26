/* eslint-disable */
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Stack,
  Modal,
  Badge,
  Avatar,
  Divider,
  IconButton,
  Typography,
  InputBase,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';
import { useHandleThread } from 'src/hooks/zustands/useHandleThread';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import FileThumbnail from 'src/components/file-thumbnail';

import {
  useGetAllThreads,
  useGetThreadById,
  markMessagesAsSeen,
  useTotalUnreadCount,
  sendMessageInThread,
  archiveUserThread,
  unarchiveUserThread,
} from 'src/api/chat';

import ChatMessageList from 'src/sections/chat/chat-message-list';
import ChatNavItem from 'src/sections/chat/chat-nav-item';

// ----------------------------------------------------------------------

const ChatModalMobile = ({ open, onClose }) => {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();
  const threadId = useHandleThread((state) => state.threadId);
  const setThreadId = useHandleThread((state) => state.setThreadId);

  useEffect(() => {
    const id = localStorage.getItem('threadId');
    setThreadId(id);
  }, [setThreadId]);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {threadId ? (
          <MobileThreadMessages
            threadId={threadId}
            onBack={() => {
              setThreadId(null);
              localStorage.removeItem('threadId');
            }}
            onClose={onClose}
          />
        ) : (
          <MobileChatNav onClose={onClose} setThreadId={setThreadId} />
        )}
      </Box>
    </Modal>
  );
};

// ----------------------------------------------------------------------
// Mobile Chat Nav (Thread List)
// ----------------------------------------------------------------------

function MobileChatNav({ onClose, setThreadId }) {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();
  const { threads, threadrefetch } = useGetAllThreads();
  const [latestMessages, setLatestMessages] = useState({});
  const [selected, setSelected] = useState('all');

  const handleLatestMessage = (message) => {
    setLatestMessages((prev) => ({
      ...prev,
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
    threadrefetch();
  }, [threads, latestMessages]);

  const sortThreadsByLatestMessage = (threadsList) => {
    return threadsList.slice().sort((a, b) => {
      const aLastMessageTime = new Date(latestMessages[a.id]?.createdAt).getTime();
      const bLastMessageTime = new Date(latestMessages[b.id]?.createdAt).getTime();
      return bLastMessageTime - aLastMessageTime;
    });
  };

  const handleClick = (id) => {
    localStorage.setItem('threadId', id);
    setThreadId(id);
  };

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

  const sortedThreads = sortThreadsByLatestMessage(threads || []);

  return (
    <>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Messages
        </Typography>
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" width={24} />
        </IconButton>
      </Stack>

      {/* Tabs */}
      <Box sx={{ px: 1, pt: 1 }}>
        <Tabs
          variant="fullWidth"
          value={selected}
          onChange={(_, val) => setSelected(val)}
          sx={{
            borderRadius: 1,
            minHeight: 36,
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
            value="all"
            label={`All (${countUnarchivedChats() || 0})`}
            sx={{
              '&.Mui-selected': { borderRadius: 1, fontWeight: 600, zIndex: 100 },
              minHeight: 36,
              py: 0.5,
            }}
          />
          <Tab
            value="archived"
            icon={<Iconify icon="tabler:archive" width={18} />}
            iconPosition="start"
            label={countArchivedChats() || 0}
            sx={{
              '&.Mui-selected': { borderRadius: 1, fontWeight: 600, zIndex: 100 },
              minHeight: 36,
              py: 0.5,
            }}
          />
        </Tabs>
      </Box>

      {/* Thread List */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        <Scrollbar sx={{ height: '100%' }}>
          {sortedThreads.map((thread) => {
            const userThread = thread.UserThread.find((ut) => ut.userId === user.id);
            if (!userThread) return null;

            const isArchived = userThread.archived;
            if ((selected === 'archived' && isArchived) || (selected === 'all' && !isArchived)) {
              return (
                <ChatNavItem
                  key={thread.id}
                  thread={thread}
                  selected={false}
                  onClick={() => handleClick(thread.id)}
                  latestMessage={latestMessages?.[thread.id]}
                />
              );
            }
            return null;
          })}
        </Scrollbar>
      </Box>
    </>
  );
}

// ----------------------------------------------------------------------
// Mobile Thread Messages (Chat Room)
// ----------------------------------------------------------------------

function MobileThreadMessages({ threadId, onBack, onClose }) {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();
  const { thread } = useGetThreadById(threadId);
  const { threads } = useGetAllThreads();
  const { triggerRefetch } = useTotalUnreadCount();

  const [threadMessages, setThreadMessages] = useState({});
  const [optimisticMessages, setOptimisticMessages] = useState({});
  const [archivedChats, setArchivedChats] = useState([]);

  // Message input state
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);

  useEffect(() => {
    if (threads) {
      const archivedThreadIds = threads
        .filter((t) => t.UserThread.some((ut) => ut.userId === user.id && ut.archived))
        .map((t) => t.id);
      setArchivedChats(archivedThreadIds);
    }
  }, [threads, user.id]);

  useEffect(() => {
    socket?.on('existingMessages', ({ threadId: tid, oldMessages }) => {
      setThreadMessages((prev) => ({ ...prev, [tid]: oldMessages }));
    });

    socket?.emit('room', threadId);

    socket?.on('message', (msg) => {
      setThreadMessages((prev) => {
        const { threadId: msgThreadId } = msg;
        const current = prev[msgThreadId] || [];
        const exists = current.some(
          (m) =>
            (m.id && msg.id && m.id === msg.id) ||
            (m.content === msg.content &&
              m.senderId === msg.senderId &&
              Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 3000)
        );
        if (exists) return prev;
        return { ...prev, [msgThreadId]: [...current, msg] };
      });

      if (msg.senderId === user.id) {
        setOptimisticMessages((prev) => {
          const threadOpt = prev[msg.threadId] || [];
          const filtered = threadOpt.filter(
            (opt) =>
              !(
                opt.content === msg.content &&
                opt.senderId === msg.senderId &&
                Math.abs(new Date(opt.createdAt).getTime() - new Date(msg.createdAt).getTime()) <
                  10000
              )
          );
          return { ...prev, [msg.threadId]: filtered };
        });
      }

      if (msg.threadId === threadId) {
        markMessagesAsSeen(threadId).then(() => triggerRefetch());
      }
    });

    markMessagesAsSeen(threadId).then(() => triggerRefetch());

    return () => {
      socket?.off('message');
      socket?.off('existingMessages');
    };
  }, [socket, threadId, user.id, triggerRefetch]);

  const handleSendMessage = useCallback(() => {
    const trimmedMessage = message.trim();
    if (trimmedMessage === '' && attachedFiles.length === 0) return;

    const { id: senderId, role, name, photoURL } = user;
    const createdAt = new Date().toISOString();

    const optimisticMessage = {
      id: `optimistic-${Date.now()}-${Math.random()}`,
      content: trimmedMessage,
      senderId,
      threadId,
      createdAt,
      sender: { role, name, photoURL },
      isOptimistic: true,
    };

    if (attachedFiles.length > 0) {
      const firstAttachment = attachedFiles[0];
      optimisticMessage.file = firstAttachment.preview || URL.createObjectURL(firstAttachment.file);
      optimisticMessage.fileType = firstAttachment.type;
      optimisticMessage.isOptimisticFile = true;
    }

    setOptimisticMessages((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), optimisticMessage],
    }));

    if (attachedFiles.length > 0) {
      sendMessageInThread(threadId, { content: trimmedMessage, attachments: attachedFiles })
        .then(() => {
          setTimeout(() => {
            setOptimisticMessages((prev) => ({
              ...prev,
              [threadId]: (prev[threadId] || []).filter((m) => m.id !== optimisticMessage.id),
            }));
          }, 2000);
        })
        .catch(() => {
          setOptimisticMessages((prev) => ({
            ...prev,
            [threadId]: (prev[threadId] || []).filter((m) => m.id !== optimisticMessage.id),
          }));
        });
    } else {
      socket?.emit('sendMessage', {
        senderId,
        threadId,
        content: trimmedMessage,
        role,
        name,
        photoURL,
        createdAt,
      });
    }

    setMessage('');
    setAttachedFiles([]);
  }, [message, attachedFiles, socket, threadId, user]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleArchive = async () => {
    if (archivedChats.includes(threadId)) {
      await unarchiveUserThread(threadId);
    } else {
      await archiveUserThread(threadId);
    }
  };

  const realMessages = threadMessages[threadId] || [];
  const optimisticMessagesForThread = optimisticMessages[threadId] || [];
  const allMessages = [...realMessages, ...optimisticMessagesForThread].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const otherUser = thread?.UserThread?.find((u) => u.userId !== user.id);
  const otherUserName = otherUser ? otherUser.user.name : 'Unknown User';
  
  // Determine display name: campaign name > thread title > other user name
  const getDisplayName = () => {
    if (thread?.campaign?.name) {
      return thread.campaign.name;
    }
    if (thread?.isGroup) {
      return thread.title;
    }
    return otherUserName;
  };
  
  // Get avatar URL: campaign brief images > thread photoURL > other user photoURL
  const getAvatarURL = () => {
    if (thread?.campaign) {
      const campaignImage = thread.campaign.campaignBrief?.images?.[0];
      if (campaignImage) {
        return campaignImage;
      }
      if (thread.campaign.photoURL) {
        return thread.campaign.photoURL;
      }
    }
    if (thread?.isGroup) {
      return thread.photoURL;
    }
    return otherUser?.user?.photoURL;
  };

  const avatarURL = getAvatarURL();
  const displayName = getDisplayName();
  const isCampaignThread = !!thread?.campaign;

  return (
    <>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ pl: -2, pr: 1.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          <IconButton onClick={onBack}>
            <Iconify icon="eva:arrow-ios-back-fill" width={24} />
          </IconButton>
          <Avatar alt={displayName} src={avatarURL} sx={{ width: 40, height: 40, ml: -1 }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography
                variant="subtitle1"
                noWrap
                sx={{ fontWeight: 600, fontSize: '14px', maxWidth: 150 }}
              >
                {displayName}
              </Typography>
              {(otherUser?.user?.role === 'superadmin' || otherUser?.user?.role === 'admin') && (
                <Box
                  component="img"
                  src="/assets/icons/components/ic_chat_verified.svg"
                  sx={{ width: 16, height: 16 }}
                />
              )}
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Available
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.5}>
          <IconButton
            onClick={handleArchive}
            sx={{
              border: 1,
              borderRadius: 1,
              borderColor: '#E7E7E7',
              width: 38,
              height: 38,
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
            }}
          >
            <Iconify
              icon={archivedChats.includes(threadId) ? 'tabler:archive-off' : 'tabler:archive'}
              width={20}
              sx={{ color: 'black' }}
            />
          </IconButton>
          <IconButton
            sx={{
              border: 1,
              borderRadius: 1,
              borderColor: '#E7E7E7',
              width: 38,
              height: 38,
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
            }}
          >
            <Iconify icon="tabler:info-circle" width={20} sx={{ color: 'black' }} />
          </IconButton>
        </Stack>
      </Stack>

      {/* Messages */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Empty state: Beginning of chat */}
        {allMessages.length === 0 && (
          <Box sx={{ textAlign: 'center', pt: 3, pb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
              This is the beginning of your chat with {displayName}.
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1.5,
                color: 'text.disabled',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              TODAY
            </Typography>
          </Box>
        )}
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <ChatMessageList messages={allMessages} />
        </Box>
      </Box>

      {/* File Attachments Preview */}
      {attachedFiles.length > 0 && (
        <Box
          sx={{
            px: 2,
            pt: 1,
            pb: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.neutral',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Attachments ({attachedFiles.length})
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {attachedFiles.map((file, index) => (
              <Chip
                key={index}
                avatar={<FileThumbnail file={file.type} sx={{ width: 12, height: 12 }} />}
                label={file.name}
                onDelete={() => handleRemoveFile(index)}
                variant="outlined"
                size="small"
                sx={{ maxWidth: 150, p: 1 }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Input Area */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Attachment Button */}
          <IconButton
            component="label"
            sx={{
              border: 1,
              borderRadius: 1,
              borderColor: '#E7E7E7',
              width: 44,
              height: 44,
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              bgcolor: '#FFF',
              flexShrink: 0,
            }}
          >
            <Iconify icon="eva:plus-fill" width={22} />
            <input
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </IconButton>

          {/* Text Input */}
          <Box
            sx={{
              flex: 1,
              border: 1,
              borderRadius: 1,
              borderColor: '#E7E7E7',
              bgcolor: '#FFF',
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <InputBase
              multiline
              maxRows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              sx={{ flex: 1, fontSize: 14 }}
            />
          </Box>
        </Stack>
      </Box>
    </>
  );
}

// ----------------------------------------------------------------------

export default ChatModalMobile;

ChatModalMobile.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
