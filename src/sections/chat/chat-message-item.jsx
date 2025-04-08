import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export default function ChatMessageItem({ message, isGrouped = false }) {
  const { user } = useAuthContext();

  const isMe = user?.id === message.senderId;
  const { content: body, sender } = message;

  const isAdmin = sender?.role === 'admin';
  const isSprAdmin = sender?.role === 'superadmin';

  const renderInfo = (
    <Typography
      noWrap
      variant="body2"
      sx={{
        color: 'text.disabled',
        ...(!isMe && {
          mb: 1,
          mr: 'auto',
          ml: '44px',
        }),
      }}
    >
      {!isMe && !isAdmin && !isSprAdmin && !isGrouped && sender?.name}
    </Typography>
  );

  // const renderTimestamp = (
  //   <Typography
  //     noWrap
  //     variant="caption"
  //     sx={{
  //       pt: 1,
  //       mb: 1,
  //       color: 'text.disabled',
  //       ...(!isMe && {
  //         mr: 'auto',
  //       }),
  //     }}
  //   >
  //     {message.createdAt
  //       ? formatDistanceToNowStrict(new Date(message.createdAt), {
  //           addSuffix: true,
  //         })
  //       : 'sent'}
  //   </Typography>
  // );

  const renderBody = (
    <Stack
      sx={{
        p: 1.5,
        minWidth: 48,
        maxWidth: 320,
        borderRadius: 1,
        typography: 'body2',
        fontWeight: 300,
        fontSize: 14,
        bgcolor: 'background.neutral',
        ...(isMe && {
          color: 'white',
          bgcolor: '#1340FF',
          borderTopRightRadius: 0,
        }),
        ...(!isMe && {
          color: '#231F20',
          bgcolor: '#F5F5F5',
          mr: 'auto',
          borderTopLeftRadius: isGrouped ? 1 : 0,
        }),
      }}
    >
      <Typography
        variant="inherit"
        textTransform="none"
        sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      >
        {body}
      </Typography>
    </Stack>
  );

  if (isGrouped && !isMe) {
    return (
      <Stack 
        direction="row" 
        justifyContent="unset" 
        sx={{ 
          mb: 0.5,
          ml: '44px',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            position: 'relative',
            '&:hover': {
              '& .message-actions': {
                opacity: 1,
              },
            },
          }}
        >
          {renderBody}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack sx={{ mb: isGrouped ? 0.5 : 1.5 }}>
      {!isMe && !isGrouped && !isAdmin && !isSprAdmin && (
        <Typography
          noWrap
          variant="body2"
          sx={{
            color: 'text.disabled',
            mb: 1,
            mr: 'auto',
            ml: '44px',
          }}
        >
          {sender?.name}
        </Typography>
      )}
      <Stack 
        direction="row" 
        justifyContent={isMe ? 'flex-end' : 'unset'} 
        alignItems="flex-start"
      >
        {!isMe && (
          <Avatar 
            alt={sender?.name} 
            src={sender?.photoURL} 
            sx={{ 
              width: 32, 
              height: 32, 
              mr: 1,
              mt: 0,
            }} 
          />
        )}
        
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            position: 'relative',
            '&:hover': {
              '& .message-actions': {
                opacity: 1,
              },
            },
          }}
        >
          {renderBody}
        </Stack>
      </Stack>
    </Stack>
  );
}

ChatMessageItem.propTypes = {
  message: PropTypes.shape({
    senderId: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    sender: PropTypes.shape({
      name: PropTypes.string.isRequired,
      photoURL: PropTypes.string,
      role: PropTypes.string,
    }),
  }).isRequired,
  isGrouped: PropTypes.bool,
};
