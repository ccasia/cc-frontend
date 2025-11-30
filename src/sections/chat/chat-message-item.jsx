/* eslint-disable jsx-a11y/media-has-caption */
import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import FileThumbnail from 'src/components/file-thumbnail';

// ----------------------------------------------------------------------

export default function ChatMessageItem({ message, isGrouped = false }) {
  const { user } = useAuthContext();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const isMe = user?.id === message.senderId;
  const { content: body, sender, file, fileType, isOptimistic, isOptimisticFile } = message;

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

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const getFileName = (url) => {
    if (!url) return 'File';
    const parts = url.split('/');
    return parts[parts.length - 1] || 'File';
  };

  const handleImageClick = () => {
    setImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setImageModalOpen(false);
  };

  const handleVideoClick = () => {
    setVideoModalOpen(true);
  };

  const handleCloseVideoModal = () => {
    setVideoModalOpen(false);
  };

  const renderAttachment = () => {
    if (!file) return null;

    const isImage = fileType?.startsWith('image/');
    const isVideo = fileType?.startsWith('video/');
    const isAudio = fileType?.startsWith('audio/');

    if (isImage) {
      return (
        <>
          <Box sx={{ mt: 1, maxWidth: 300, position: 'relative' }}>
            <Image
              src={file}
              alt="attachment"
              sx={{
                borderRadius: 1,
                cursor: 'pointer',
                maxHeight: 200,
                width: 'auto',
                transition: 'opacity 0.2s',
                opacity: isOptimisticFile ? 0.7 : 1,
                '&:hover': {
                  opacity: isOptimisticFile ? 0.5 : 0.8,
                },
              }}
              onClick={handleImageClick}
            />

            {/* Loading indicator for optimistic files */}
            {isOptimisticFile && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress size={20} sx={{ color: 'white' }} />
              </Box>
            )}
          </Box>

          {/* Image Modal */}
          <Dialog
            open={imageModalOpen}
            onClose={handleCloseImageModal}
            maxWidth="lg"
            fullWidth
            sx={{
              '& .MuiDialog-paper': {
                bgcolor: 'transparent',
                boxShadow: 'none',
              },
            }}
          >
            <DialogContent
              sx={{
                p: 0,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '50vh',
                bgcolor: 'transparent',
              }}
            >
              <IconButton
                onClick={handleCloseImageModal}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: 'text.primary',
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  zIndex: 1,
                  '&:hover': {
                    bgcolor: 'background.neutral',
                  },
                }}
              >
                <Iconify icon="eva:close-fill" />
              </IconButton>

              <Image
                src={file}
                alt="attachment"
                sx={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  borderRadius: 1,
                  boxShadow: 3,
                }}
              />
            </DialogContent>
          </Dialog>
        </>
      );
    }

    if (isVideo) {
      return (
        <>
          <Box sx={{ mt: 1, maxWidth: 300, position: 'relative' }}>
            <Box
              sx={{
                position: 'relative',
                cursor: 'pointer',
                borderRadius: 1,
                overflow: 'hidden',
                transition: 'opacity 0.2s',
                opacity: isOptimisticFile ? 0.7 : 1,
                '&:hover': {
                  opacity: isOptimisticFile ? 0.5 : 0.8,
                },
                '&:hover .play-overlay': {
                  opacity: 1,
                },
              }}
              onClick={handleVideoClick}
            >
              <video
                style={{
                  width: '100%',
                  maxHeight: 200,
                  borderRadius: 8,
                  display: 'block',
                }}
                muted
              >
                <source src={file} type={fileType} />
                Your browser does not support the video tag.
              </video>

              {/* Play overlay */}
              <Box
                className="play-overlay"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: '50%',
                  p: 1,
                  opacity: 0.8,
                  transition: 'opacity 0.2s',
                }}
              >
                <Iconify icon="eva:play-circle-fill" sx={{ color: 'white', fontSize: 40 }} />
              </Box>
            </Box>

            {/* Loading indicator for optimistic files */}
            {isOptimisticFile && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '50%',
                  p: 1,
                }}
              >
                <CircularProgress size={20} sx={{ color: 'white' }} />
              </Box>
            )}
          </Box>

          {/* Video Modal */}
          <Dialog
            open={videoModalOpen}
            onClose={handleCloseVideoModal}
            maxWidth="lg"
            fullWidth
            sx={{
              '& .MuiDialog-paper': {
                bgcolor: 'transparent',
                boxShadow: 'none',
              },
            }}
          >
            <DialogContent
              sx={{
                p: 0,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '50vh',
                bgcolor: 'transparent',
              }}
            >
              <IconButton
                onClick={handleCloseVideoModal}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: 'text.primary',
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  zIndex: 1,
                  '&:hover': {
                    bgcolor: 'background.neutral',
                  },
                }}
              >
                <Iconify icon="eva:close-fill" />
              </IconButton>

              <video
                controls
                autoPlay
                style={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  borderRadius: 8,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <source src={file} type={fileType} />
                Your browser does not support the video tag.
              </video>
            </DialogContent>
          </Dialog>
        </>
      );
    }

    if (isAudio) {
      return (
        <Box sx={{ mt: 1, maxWidth: 300, position: 'relative' }}>
          <audio
            controls
            style={{
              width: '100%',
              opacity: isOptimisticFile ? 0.7 : 1,
            }}
          >
            <source src={file} type={fileType} />
            Your browser does not support the audio tag.
          </audio>

          {/* Loading indicator for optimistic files */}
          {isOptimisticFile && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                right: 8,
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress size={16} sx={{ color: 'white' }} />
            </Box>
          )}
        </Box>
      );
    }

    // For other file types, show a download link with thumbnail
    return (
      <Box
        sx={{
          mt: 1,
          p: 1,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          maxWidth: 300,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          opacity: isOptimisticFile ? 0.7 : 1,
          position: 'relative',
        }}
      >
        <FileThumbnail file={fileType} sx={{ width: 32, height: 32, flexShrink: 0 }} />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap>
            {getFileName(file)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {fileType}
          </Typography>
        </Box>

        {isOptimisticFile ? (
          <CircularProgress size={16} />
        ) : (
          <IconButton
            size="small"
            onClick={() => window.open(file, '_blank')}
            sx={{ flexShrink: 0 }}
          >
            <Iconify icon="eva:download-outline" width={16} />
          </IconButton>
        )}
      </Box>
    );
  };

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
        opacity: isOptimistic ? 0.8 : 1,
        position: 'relative',
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
      {body && (
        <Typography
          variant="inherit"
          textTransform="none"
          sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {body}
        </Typography>
      )}
      {renderAttachment()}

      {/* Sending indicator for optimistic messages */}
      {isOptimistic && !file && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 4,
            right: 8,
          }}
        >
          <CircularProgress size={12} sx={{ color: isMe ? 'white' : 'primary.main' }} />
        </Box>
      )}
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
      <Stack direction="row" justifyContent={isMe ? 'flex-end' : 'unset'} alignItems="flex-start">
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
    file: PropTypes.string,
    fileType: PropTypes.string,
    isOptimistic: PropTypes.bool,
    isOptimisticFile: PropTypes.bool,
    sender: PropTypes.shape({
      name: PropTypes.string.isRequired,
      photoURL: PropTypes.string,
      role: PropTypes.string,
    }),
  }).isRequired,
  isGrouped: PropTypes.bool,
};
