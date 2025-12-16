import { useState } from 'react';
import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import Iconify from '../iconify';
import { varFade } from '../animate';
import FileThumbnail, { fileData } from '../file-thumbnail';

// ----------------------------------------------------------------------

export default function MultiFilePreview({ thumbnail, files, onRemove, sx }) {
  const [openPreview, setOpenPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleOpenPreview = (file) => {
    setSelectedFile(file);
    setOpenPreview(true);
  };

  const handleClosePreview = () => {
    setOpenPreview(false);
    setSelectedFile(null);
  };

  const onDownload = (file) => {
    // Create an anchor element
    const link = document.createElement('a');

    // Set the download URL to the file URL provided
    link.href = file;

    // Set the filename for the download
    link.download = file || file.split('/').pop(); // Use the filename passed or extract from the URL

    // Trigger the click to start the download
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Remove the link after the download is triggered
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <>
      <AnimatePresence initial={false}>
        {files?.map((file) => {
          const { key, name = '', size = 0 } = fileData(file);
          const isNotFormatFile = typeof file === 'string';

          if (thumbnail) {
            return (
              <Stack
                key={key}
                component={m.div}
                {...varFade().inUp}
                alignItems="center"
                display="inline-flex"
                justifyContent="center"
                sx={{
                  m: 0.5,
                  width: 80,
                  height: 80,
                  borderRadius: 1.25,
                  overflow: 'hidden',
                  position: 'relative',
                  border: (theme) => `solid 1px ${alpha(theme.palette.grey[500], 0.16)}`,
                  ...sx,
                }}
              >
                <FileThumbnail
                  tooltip
                  imageView
                  file={file}
                  sx={{ position: 'absolute' }}
                  imgSx={{ position: 'absolute' }}
                  onDownload={() => onDownload(file)}
                />

                {onRemove && (
                  <IconButton
                    size="small"
                    onClick={() => onRemove(file)}
                    sx={{
                      p: 0.5,
                      top: 4,
                      right: 4,
                      zIndex: 1000,
                      position: 'absolute',
                      color: 'common.white',
                      bgcolor: (theme) => alpha(theme.palette.grey[900], 0.48),
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.grey[900], 0.72),
                      },
                    }}
                  >
                    <Iconify icon="mingcute:close-line" width={14} />
                  </IconButton>
                )}
              </Stack>
            );
          }

          return (
            <Stack
              key={key}
              component={m.div}
              {...varFade().inUp}
              sx={{
                position: 'relative',
                mb: 2,
              }}
            >
              <Stack
                spacing={2}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: '#e7e7e7',
                  borderRadius: 1.2,
                  bgcolor: '#ffffff',
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  flex={1}
                  sx={{
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                  }}
                >
                  <FileThumbnail
                    file={file}
                    sx={{
                      width: 64,
                      height: 64,
                      flexShrink: 0,
                      borderRadius: 1,
                    }}
                  />

                  <Box
                    sx={{
                      flexGrow: 1,
                      minWidth: { xs: '100%', sm: 'auto' },
                      mt: { xs: 1, sm: 0 },
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      noWrap
                      sx={{
                        color: 'text.primary',
                        fontWeight: 600,
                        fontSize: '1rem',
                        maxWidth: { xs: '100%', sm: '200px' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isNotFormatFile ? file : name}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        display: 'block',
                        mt: 0.5,
                        fontSize: '0.875rem',
                      }}
                    >
                      {formatFileSize(size)}
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{
                      width: { xs: '100%', sm: 'auto' },
                      justifyContent: { xs: 'flex-end' },
                      mt: { xs: 2, sm: 0 },
                    }}
                    flexWrap="wrap"
                  >
                    <Button
                      onClick={() => handleOpenPreview(file)}
                      variant="contained"
                      sx={{
                        bgcolor: 'white',
                        border: 1,
                        borderColor: '#e7e7e7',
                        borderBottom: 3,
                        borderBottomColor: '#e7e7e7',
                        color: '#221f20',
                        '&:hover': {
                          bgcolor: 'white',
                          borderColor: '#e7e7e7',
                        },
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        minWidth: '70px',
                        height: '45px',
                      }}
                    >
                      Preview
                    </Button>

                    {onRemove && (
                      <Button
                        onClick={() => onRemove(file)}
                        variant="contained"
                        sx={{
                          bgcolor: 'white',
                          border: 1,
                          borderColor: '#e7e7e7',
                          borderBottom: 3,
                          borderBottomColor: '#e7e7e7',
                          color: '#221f20',
                          '&:hover': {
                            bgcolor: 'white',
                            borderColor: '#e7e7e7',
                          },
                          textTransform: 'none',
                          fontSize: '0.875rem',
                          minWidth: '70px',
                          height: '45px',
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          );
        })}
      </AnimatePresence>

      <Dialog
        open={openPreview}
        onClose={handleClosePreview}
        maxWidth="md"
        sx={{
          '& .MuiDialog-paper': {
            p: 0,
            maxWidth: { xs: '95vw', sm: '85vw', md: '75vw' },
            margin: { xs: '16px', sm: '32px' },
          },
        }}
      >
        <DialogTitle sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" gap={2}>
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: { xs: '2rem', sm: '2.4rem' },
                fontWeight: 550,
                m: 0,
              }}
            >
              Preview {selectedFile?.type === 'application/pdf' ? 'PDF' : 'Draft'}
            </Typography>

            <IconButton
              onClick={handleClosePreview}
              sx={{
                ml: 'auto',
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Iconify icon="hugeicons:cancel-01" width={20} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Box
          sx={{
            width: '95%',
            mx: 'auto',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        />

        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            {selectedFile && (
              <>
                {selectedFile.type === 'application/pdf' ? (
                  <Box
                    component="iframe"
                    src={selectedFile.preview || selectedFile}
                    sx={{
                      width: '100%',
                      minHeight: '60vh',
                      borderRadius: 1,
                      bgcolor: 'background.neutral',
                    }}
                  />
                ) : (
                  <Box
                    component={selectedFile.type?.startsWith('video/') ? 'video' : 'img'}
                    src={selectedFile.preview || selectedFile}
                    autoPlay={selectedFile.type?.startsWith('video/')}
                    controls={selectedFile.type?.startsWith('video/')}
                    sx={{
                      width: '100%',
                      maxHeight: '60vh',
                      borderRadius: 1,
                      bgcolor: 'background.neutral',
                    }}
                  />
                )}
              </>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

MultiFilePreview.propTypes = {
  files: PropTypes.array,
  onRemove: PropTypes.func,
  sx: PropTypes.object,
  thumbnail: PropTypes.bool,
};
