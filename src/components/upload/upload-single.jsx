import { useState } from 'react';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { grey } from '@mui/material/colors';
import { alpha } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import Iconify from '../iconify';
import RejectionFiles from './errors-rejection-files';

// ----------------------------------------------------------------------

const actionButtonSx = {
  minWidth: 28,
  height: 28,
  borderRadius: 1,
  fontSize: 13,
  fontWeight: 600,
  color: '#3A3A3C',
  bgcolor: 'rgba(255, 255, 255, 0.92)',
  border: '1px solid #EBEBEB',
  boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
  backdropFilter: 'blur(8px)',
  transition: 'background-color 150ms ease, transform 160ms cubic-bezier(0.23, 1, 0.32, 1)',
  '@media (hover: hover) and (pointer: fine)': { '&:hover': { bgcolor: '#F5F5F5' } },
  '@media (prefers-reduced-motion: no-preference)': { '&:active': { transform: 'scale(0.97)' } },
  '&.Mui-focusVisible': { outline: '2px solid #1340FF', outlineOffset: 2 },
};

export default function UploadSingle({
  file,
  onDelete,
  onDrop,
  disabled,
  error,
  helperText,
  sx,
  height = 228,
  iconSize = 26,
  iconBox = 40,
  placeholderPrimary = 'Choose a file or drag and drop here',
  placeholderSecondary = 'Acceptable files: JPG, PNG | Max file size: 10MB',
  placeholderPrimaryTypographyProps,
  placeholderSecondaryTypographyProps,
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
  const [loadedUrl, setLoadedUrl] = useState(null);
  const isImageLoaded = loadedUrl === imgUrl;

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
        transition: 'border-color 150ms ease, background-color 150ms ease',
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover': { borderColor: '#1340FF', bgcolor: '#F5F7FF' },
        },
        '&:focus-visible': { outline: '2px solid #1340FF', outlineOffset: 2 },
        width: '100%',
        height,
        borderRadius: 1,
        ...(isDragActive && {
          borderColor: '#1340FF',
          borderStyle: 'dashed',
          bgcolor: '#EEF2FF',
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
      <Stack alignItems="center" spacing={1} px={2}>
        <Box
          sx={{
            bgcolor: '#203ff5',
            borderRadius: '50%',
            width: iconBox,
            height: iconBox,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify
            icon="fluent:add-24-filled"
            width={iconSize}
            sx={{
              color: '#fff',
            }}
          />
        </Box>

        <ListItemText
          primary={placeholderPrimary}
          secondary={placeholderSecondary}
          primaryTypographyProps={{
            textAlign: 'center',
            ...placeholderPrimaryTypographyProps,
          }}
          secondaryTypographyProps={{
            textAlign: 'center',
            variant: 'body1',
            color: '#8E8E93',
            ...placeholderSecondaryTypographyProps,
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
        height,
        borderRadius: 1,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F4F4F6',
        // The frame sits on top, so light images still show where they end
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box
        component="img"
        src={imgUrl}
        alt="campaign preview"
        onLoad={() => setLoadedUrl(imgUrl)}
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isImageLoaded ? 1 : 0,
          transform: isImageLoaded ? 'scale(1)' : 'scale(0.98)',
          transition:
            'opacity 200ms cubic-bezier(0.23, 1, 0.32, 1), transform 200ms cubic-bezier(0.23, 1, 0.32, 1)',
          '@media (prefers-reduced-motion: reduce)': {
            transform: 'none',
            transition: 'opacity 200ms ease',
          },
        }}
      />
    </Box>
  );

  const renderActions = hasFile && !disabled && (
    <Stack
      direction="row"
      spacing={0.75}
      sx={{ position: 'absolute', top: 10, right: 10, zIndex: 9 }}
    >
      <ButtonBase onClick={open} sx={{ ...actionButtonSx, px: 1, gap: 0.5 }}>
        <Iconify icon="eva:sync-fill" width={16} />
        Replace
      </ButtonBase>
      {onDelete && (
        <ButtonBase onClick={onDelete} aria-label="Remove image" sx={actionButtonSx}>
          <Iconify icon="mingcute:close-fill" width={16} />
        </ButtonBase>
      )}
    </Stack>
  );

  return (
    <Box data-field-error={hasError} sx={{ width: 1, position: 'relative', ...sx }}>
      <input {...getInputProps()} />
      {hasFile ? (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          {renderImagePreview}
          {renderActions}
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
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  iconSize: PropTypes.number,
  iconBox: PropTypes.number,
  placeholderPrimary: PropTypes.node,
  placeholderSecondary: PropTypes.node,
  placeholderPrimaryTypographyProps: PropTypes.object,
  placeholderSecondaryTypographyProps: PropTypes.object,
};
