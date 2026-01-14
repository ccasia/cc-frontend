import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { grey } from '@mui/material/colors';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import Iconify from '../iconify';
import RejectionFiles from './errors-rejection-files';

// ----------------------------------------------------------------------

export default function UploadSingle({
  file,
  onDelete,
  onDrop,
  disabled,
  error,
  helperText,
  sx,
  ...other
}) {
  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections, open } =
    useDropzone({
      multiple: false,
      noClick: true,
      disabled,
      accept: { 'image/*': [] },
      onDrop,
      ...other,
    });

  const hasFile = !!file && (typeof file === 'string' || !!file?.preview);
  const hasError = isDragReject || !!error;
  const imgUrl = typeof file === 'string' ? file : file?.preview;

  const renderPlaceholder = (
    <Box
      component="div"
      {...getRootProps({
        className: 'dropzone',
      })}
      onClick={open}
      sx={{
        display: 'flex',
        border: 1,
        borderColor: grey[300],
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        bgcolor: 'white',
        transition: 'all .1s linear',
        '&:hover': {
          opacity: 0.4,
        },
        width: '100%',
        height: 225,
        borderRadius: 2,
        ...(isDragActive && {
          opacity: 0.3,
        }),
        ...(disabled && {
          opacity: 0.3,
          pointerEvents: 'none',
        }),
        ...(hasError && {
          color: 'error.main',
          borderColor: 'error.main',
          bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
        }),
      }}
    >
      <input {...getInputProps()} />

      <Stack alignItems="center" spacing={2}>
        <Box
          sx={{
            bgcolor: '#203ff5',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify
            icon="fluent:add-24-filled"
            width={26}
            sx={{
              color: '#fff',
            }}
          />
        </Box>

        <ListItemText
          primary="Choose a file or drag and drop here"
          secondary="Acceptable files: JPG, PNG | Max file size: 10MB"
          primaryTypographyProps={{
            textAlign: 'center',
            variant: 'h5',
          }}
          secondaryTypographyProps={{
            textAlign: 'center',
            variant: 'body1',
            color: '#8E8E93',
          }}
        />
      </Stack>
    </Box>
  );

  const renderImagePreview = (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxHeight: 225,
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        component="img"
        src={imgUrl}
        alt="campaign preview"
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </Box>
  );

  const renderRemoveButton = hasFile && onDelete && (
    <IconButton
      size="small"
      onClick={onDelete}
      sx={{
        top: 16,
        right: 16,
        zIndex: 9,
        position: 'absolute',
        padding: 0.3,
        borderRadius: 1,
        color: (theme) => alpha(theme.palette.common.white, 0.8),
        bgcolor: '#FFFFFF',
        border: '1px solid #EBEBEB',
        boxShadow: '0px 2px 0px #E7E7E7',
        '&:hover': {
          bgcolor: '#f2f2f2',
        },
      }}
    >
      <Iconify icon="mingcute:close-fill" width={20} color="#636366" />
    </IconButton>
  );

  return (
    <Box sx={{ width: 1, position: 'relative', ...sx }}>
      {hasFile ? (
        <Box sx={{ position: 'relative', width: '100%' }}>
          {renderImagePreview}
          {renderRemoveButton}
        </Box>
      ) : (
        renderPlaceholder
      )}

      {helperText && (
        <Typography variant="caption" color={hasError ? 'error' : 'text.secondary'} sx={{ mt: 1 }}>
          {helperText}
        </Typography>
      )}

      <RejectionFiles fileRejections={fileRejections} />
    </Box>
  );
}

UploadSingle.propTypes = {
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  file: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  helperText: PropTypes.string,
  onDelete: PropTypes.func,
  onDrop: PropTypes.func,
  sx: PropTypes.object,
};
