import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { useAuthContext } from 'src/auth/hooks';


// ----------------------------------------------------------------------

export default function ChatMessageItem({ message }) {
  const { user } = useAuthContext();

  const isMe = user?.id === message.senderId;
  const { content: body, sender, file } = message;

  const isAdmin = sender?.role === 'admin';
  const isSprAdmin = sender?.role === 'superadmin';

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
          {isAdmin && ` (Admin)`}
          {isSprAdmin && ` (Superadmin)`}
        </>
      )}
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

  const renderMediaBody = (fileType, fileURL) => {
    if (!fileType || !fileURL) return null;
   
    if (fileType.startsWith('image')) {
      // Render Image
      return (
        <img
          src={fileURL}
          alt="Image message"
          style={{ maxWidth: '320px', maxHeight: '200px', objectFit: 'cover' }}
        />
      );
    }
  
    if (fileType.startsWith('video')) {
      // Render Video
      return (
        <video width="320" controls>
          <source src={fileURL} type={fileType} />
          Your browser does not support the video tag.
        </video>
      );
    }
  
    if (fileType === 'application/pdf') {
      // Render PDF
      return (
        <iframe
          src={fileURL}
          width="320"
          height="240"
          title="PDF preview"
        >
          Your browser does not support PDFs.
        </iframe>
      );
    }
  
    return null;
  };
  
  const renderBody = body && (
    <Stack
      sx={{
        p: 1,
        minWidth: 48,
        maxWidth: 320,
        borderRadius: 1,
        typography: 'body2',
        bgcolor: 'background.neutral',
        ...(isMe && {
          color: 'grey.800',
          bgcolor: '#F5F5F5',
        }),
        ...(!isMe && {
          color: '#FFFFFF',
          bgcolor: '#1340FF',
          mr: 'auto',
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

  return (
    <Stack direction="row" justifyContent={isMe ? 'flex-end' : 'unset'} sx={{ mb: 2 }}>
      {!isMe && (
        <Avatar alt={sender?.name} src={sender?.photoURL} sx={{ width: 32, height: 32, mr: 2 }} />
      )}
      <Stack alignItems="start">
        {renderInfo}
        <Stack
          direction="column"
          alignItems="flex-end"
          sx={{
            position: 'relative',
            '&:hover': {
              '& .message-actions': {
                opacity: 1,
              },
            },
          }}
        >
          {renderMediaBody(message.fileType, message.file)}

          {renderBody && renderBody}
                  
        </Stack>
        {/* {renderTimestamp} */}
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
};
