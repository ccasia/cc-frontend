//  import uniq from 'lodash/uniq';
import PropTypes from 'prop-types';
//  import flatten from 'lodash/flatten';
import { useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

import { useResponsive } from 'src/hooks/use-responsive';

import { useGetThreadById } from 'src/api/chat';

import Iconify from 'src/components/iconify';

import { useCollapseNav } from './hooks';
import ChatRoomGroup from './chat-room-group';
import ChatRoomSingle from './chat-room-single';
//  import ChatRoomAttachments from './chat-room-attachments';

// ----------------------------------------------------------------------

const NAV_WIDTH = 250;

export default function ChatRoom({ participants, conversation, threadId }) {
  const theme = useTheme();
  //  const [threadDetails, setThreadDetails] = useState(null);
  const { thread, loading, error } = useGetThreadById(threadId);
  // const [thread, setThread] = useState(null);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);
  const lgUp = useResponsive('up', 'lg');

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
    if (!lgUp) {
      onCloseDesktop();
    }
  }, [onCloseDesktop, lgUp]);

  useEffect(() => {
    if (thread) {
      console.log('Fetched Thread Data:', thread);
    }
  }, [thread]);

  const handleToggleNav = useCallback(() => {
    if (lgUp) {
      onCollapseDesktop();
    } else {
      onOpenMobile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lgUp]);

  if (!thread) {
    return null;
  }

  // const group = participants.length > 1;

  // const attachments = uniq(flatten(conversation.messages.map((messages) => messages.attachments)));

  // Update this soon

  const renderContent = thread.isGroup ? (
    <ChatRoomGroup thread={thread} />
  ) : (
    <ChatRoomSingle thread={thread} />
  );

  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      margin: 2,
      padding: 1,
    }}
  >
    <Typography variant="h5" align="center" sx={{ marginBottom: 15 }}>
      {' '}
      Chat Details{' '}
    </Typography>

    {/* <Avatar
      src={thread.photoURL}
      alt={thread.name}
      sx={{  cursor: 'pointer', width: 108, height: 108, marginBottom: 2 }}
    />
    <Typography variant="h6" align="center" sx={{ marginBottom: 2 }}>
      {thread.title}
    </Typography>
    <Typography variant="body1" align="center" sx={{ marginBottom: 2 }}>
      {thread.description}
    </Typography>
    <Stack
      direction="row"
      alignItems="center"
      spacing={1} 
      justifyContent="center"
    >
      <Iconify
        width={24}
        icon="material-symbols:groups"
      />
      <Typography variant="body2">
        Total Participants: {thread.userCount}
      </Typography>
    </Stack> */}
  </Box>;

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  if (!thread) {
    return <div>No thread found</div>;
  }

  const renderToggleBtn = (
    <IconButton
      onClick={handleToggleNav}
      sx={{
        top: 12,
        right: 0,
        zIndex: 9,
        width: 32,
        height: 32,
        borderRight: 0,
        position: 'absolute',
        borderRadius: `12px 0 0 12px`,
        boxShadow: theme.customShadows.z8,
        bgcolor: theme.palette.background.paper,
        border: `solid 1px ${theme.palette.divider}`,
        '&:hover': {
          bgcolor: theme.palette.background.neutral,
        },
        ...(lgUp && {
          ...(!collapseDesktop && {
            right: NAV_WIDTH,
          }),
        }),
      }}
    >
      {lgUp ? (
        <Iconify
          width={16}
          icon={collapseDesktop ? 'eva:arrow-ios-back-fill' : 'eva:arrow-ios-forward-fill'}
        />
      ) : (
        <Iconify width={16} icon="eva:arrow-ios-back-fill" />
      )}
    </IconButton>
  );

  return (
    <Box sx={{ position: 'relative' }}>
      {renderToggleBtn}

      {lgUp ? (
        <Stack
          sx={{
            height: 1,
            flexShrink: 0,
            width: NAV_WIDTH,
            borderLeft: `solid 1px ${theme.palette.divider}`,
            transition: theme.transitions.create(['width'], {
              duration: theme.transitions.duration.shorter,
            }),
            ...(collapseDesktop && {
              width: 0,
            }),
          }}
        >
          {!collapseDesktop && renderContent}
        </Stack>
      ) : (
        <Drawer
          anchor="right"
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
    </Box>
  );
}

ChatRoom.propTypes = {
  conversation: PropTypes.object,
  participants: PropTypes.array,
  threadId: PropTypes.string,
};
