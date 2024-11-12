/* eslint-disable */
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
// import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import ListItemButton from '@mui/material/ListItemButton';
import { useGetThreadById } from 'src/api/chat';
import { useAuthContext } from 'src/auth/hooks';
import { useBoolean } from 'src/hooks/use-boolean';

import axios from 'axios';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ChatRoomSingle({ thread }) {
  const { user } = useAuthContext();
  // const { thread, loading, error } = useGetThreadById(threadId);
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    if (thread && thread.UserThread) {
      // Find the user that is not the current user
      const otherUserInfo = thread.UserThread.find(
        (userThread) => userThread.user.id !== user.id
      )?.user;
      setOtherUser(otherUserInfo);
    }
  }, [thread, user]);

  if (!thread) {
    return <div>No thread data available</div>;
  }

  if (!otherUser) {
    return <div>Loading other user information...</div>;
  }

  return (
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
      <Avatar
        alt={otherUser.name}
        src={otherUser.photoURL}
        sx={{ alignContent: 'center', cursor: 'pointer', width: 108, height: 108, margin: 2 }}
      />

      <Typography variant="h6" align="center" sx={{ marginBottom: 2 }}>
        {otherUser.name}
      </Typography>
      {/* 
      <Typography variant="body2" align="center" sx={{ marginBottom: 2 }}>
        {otherUser.about}
      </Typography>
       */}

      <Stack
        spacing={4}
        sx={{
          px: 2,
          py: 2.5,
          '& svg': {
            mr: 1,
            flexShrink: 0,
            color: 'text.disabled',
          },
        }}
      >
        {/* <Stack direction="row">
      <Iconify icon="material-symbols:person" />
      <Typography variant="body2"> {otherUser.role}</Typography>
    </Stack>
     */}
        <Stack direction="row">
          <Iconify icon="material-symbols:globe" />
          <Typography variant="body2"> {otherUser.country}</Typography>
        </Stack>
        <Stack direction="row">
          <Iconify icon="solar:phone-bold" />
          <Typography variant="body2">{otherUser.phoneNumber}</Typography>
        </Stack>

        <Stack direction="row">
          <Iconify icon="fluent:mail-24-filled" />
          <Typography variant="body2">{otherUser.email}</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

ChatRoomSingle.propTypes = {
  id: PropTypes.string,
};
