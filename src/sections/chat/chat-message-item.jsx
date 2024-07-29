import PropTypes from 'prop-types';
import { formatDistanceToNowStrict } from 'date-fns';

import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
//  import Badge from '@mui/material/Badge';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export default function ChatMessageItem({ message }) {
  const { user } = useAuthContext();

  const isMe = user?.id === message.senderId;
  const { content: body, sender } = message;

  const isAdmin = sender?.role === 'admin';
  const isSprAdmin = sender?.role === 'superadmin';

  console.log("Message CreatedAt", message.createdAt); 
  const renderInfo = (
    <Typography
      noWrap
      variant="body2"
      sx={{
        mb: 1,
        color: 'text.disabled',
        ...(!isMe && {
          mr: 'auto',
        }),
      }}
    >
    
      {!isMe && (
        <>
        {sender?.name}
        {(isAdmin || isSprAdmin)  && (
          <Typography
            variant="caption"
            component="span"
            sx={{
              ml: 1,
              py: 0.5,
              px: 2,
              backgroundColor: ' #d8b400 ',
              color: 'black',
              borderRadius: 4,
            }}
          >
            Admin
          </Typography>
        )}
        {`  `}
        </>

      )} 
  
    </Typography>
  );

  const renderTimestamp = (
    <Typography
      noWrap
      variant="caption"
      sx={{
        pt: 1,
        mb: 1,
        color: 'text.disabled',
        ...(!isMe && {
          mr: 'auto',
        }),
      }}
    >
       {message.createdAt ? formatDistanceToNowStrict(new Date(message.createdAt), {
        addSuffix: true,
      }) : 'sent'}
    </Typography>
  );

  const renderBody = (
    <Stack
      sx={{
        p: 1.5,
        minWidth: 48,
        maxWidth: 320,
        borderRadius: 1,
        typography: 'body2',
        bgcolor: 'background.neutral',
        ...(isMe && {
          color: 'grey.800',
          bgcolor: 'primary.lighter',
        }),
        ...(isAdmin && {
          bgcolor:  '#efc800' ,
          color: 'black'
        }),
        ...(isSprAdmin && {
          bgcolor: ' #FFC300 ',
          color: 'black'
        }),
      }}
    >
      {body}
    </Stack>
  );

  return (
    <Stack direction="row" justifyContent={isMe ? 'flex-end' : 'unset'} sx={{ mb: 5 }}>
      {!isMe && <Avatar alt={sender?.name} src={sender?.photoURL} sx={{ width: 32, height: 32, mr: 2 }} />}
      <Stack alignItems="flex-end">
        {renderInfo}
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
         {renderTimestamp}
      </Stack>
    </Stack>
  );
}

ChatMessageItem.propTypes = {
  message: PropTypes.shape({
    senderId: PropTypes.string,
    content: PropTypes.string,
    createdAt: PropTypes.string,
    sender: PropTypes.shape({
      name: PropTypes.string,
      photoURL: PropTypes.string,
      role: PropTypes.string
    }),
  }),
  // onOpenLightbox: PropTypes.func,
};
