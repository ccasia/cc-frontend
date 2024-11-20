import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';

import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { fData } from 'src/utils/format-number';

import Iconify from '../iconify';
import { varFade } from '../animate';
import FileThumbnail, { fileData } from '../file-thumbnail';

// ----------------------------------------------------------------------

export default function MultiFilePreview({ thumbnail, files, onRemove, sx }) {
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

  return (
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
            spacing={2}
            direction="row"
            alignItems="center"
            sx={{
              my: 1,
              py: 1,
              px: 1.5,
              borderRadius: 1,
              border: (theme) => `solid 1px ${alpha(theme.palette.grey[500], 0.16)}`,
              ...sx,
            }}
          >
            <FileThumbnail file={file} />

            <ListItemText
              primary={isNotFormatFile ? file : name}
              secondary={isNotFormatFile ? '' : fData(size)}
              secondaryTypographyProps={{
                component: 'span',
                typography: 'caption',
              }}
            />

            {onRemove && (
              <IconButton size="small" onClick={() => onRemove(file)}>
                <Iconify icon="mingcute:close-line" width={16} />
              </IconButton>
            )}
          </Stack>
        );
      })}
    </AnimatePresence>
  );
}

MultiFilePreview.propTypes = {
  files: PropTypes.array,
  onRemove: PropTypes.func,
  sx: PropTypes.object,
  thumbnail: PropTypes.bool,
};
