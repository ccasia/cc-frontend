// import { sub } from 'date-fns';
import PropTypes from 'prop-types';
import { useRef, useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';

//  import { paths } from 'src/routes/paths';
//  import { socket } from 'src/socket';
//  import { useRouter } from 'src/routes/hooks';
//  import { useAuthContext } from 'src/auth/hooks';
//  import uuidv4 from 'src/utils/uuidv4';

import { sendMessageInThread } from 'src/api/chat';

import Iconify from 'src/components/iconify';
// import axiosInstance, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export default function ChatMessageInput({
  // recipients,
  // onAddRecipients,
  disabled,
  threadId
  // selectedConversationId,
}) {
  //  const router = useRouter();

  //  const { user } = useAuthContext();

  const fileRef = useRef(null);

  const [message, setMessage] = useState('');

  // const myContact = useMemo(
  //   () => ({
  //     id: `${user?.id}`,
  //     role: `${user?.role}`,
  //     email: `${user?.email}`,
  //     address: `${user?.address}`,
  //     name: `${user?.name}`,
  //     lastActivity: new Date(),
  //     avatarUrl: `${user?.photoURL}`,
  //     phoneNumber: `${user?.phoneNumber}`,
  //     status: 'online',
  //   }),
  //   [user]
  // );

  // const messageData = useMemo(
  //   () => ({
  //     id: uuidv4(),
  //     attachments: [],
  //     body: message,
  //     contentType: 'text',
  //     createdAt: sub(new Date(), { minutes: 1 }),
  //     senderId: user.id,
  //   }),
  //   [message, user.id]
  // );


  const handleSendMessage = useCallback(async (event) => {
    if (event.key === 'Enter' && message) {
      try {
        await sendMessageInThread(parseInt(threadId, 10), message);
        setMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }, [message, threadId]);
  
  

  // const handleAttach = useCallback(() => {
  //   if (fileRef.current) {
  //     fileRef.current.click();
  //   }
  // }, []);

  const handleChangeMessage = useCallback((event) => {
    setMessage(event.target.value);
  }, []);

  return (
    <>
      <InputBase
        value={message}
        onKeyUp={handleSendMessage}
        onChange={handleChangeMessage}
        placeholder="Type a message"
        disabled={disabled}
        startAdornment={
          <IconButton>
            <Iconify icon="eva:smiling-face-fill" />
          </IconButton>
        }
        endAdornment={
          <Stack direction="row" sx={{ flexShrink: 0 }}>
            {/* <IconButton onClick={handleAttach}>
              <Iconify icon="solar:gallery-add-bold" />
            </IconButton>
            <IconButton onClick={handleAttach}>
              <Iconify icon="eva:attach-2-fill" />
            </IconButton> */}
            {/* <IconButton>
              <Iconify icon="solar:microphone-bold" />
            </IconButton> */}
          </Stack>
        }
        sx={{
          px: 1,
          height: 56,
          flexShrink: 0,
          borderTop: (theme) => `solid 1px ${theme.palette.divider}`,
        }}
      />

      <input type="file" ref={fileRef} style={{ display: 'none' }} />
    </>
  );
}

ChatMessageInput.propTypes = {
  disabled: PropTypes.bool,
  threadId: PropTypes.string,
  // onAddRecipients: PropTypes.func,
  // recipients: PropTypes.array,
  // selectedConversationId: PropTypes.string,
};
