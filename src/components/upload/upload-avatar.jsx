import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';
import AvatarEditor from 'react-avatar-editor';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';

import Image from '../image';
import Iconify from '../iconify';
import RejectionFiles from './errors-rejection-files';

// ----------------------------------------------------------------------

export default function UploadAvatar({ error, file, disabled, helperText, sx, onDrop, ...other }) {
  const [imageToCrop, setImageToCrop] = useState(null);
  const [zoom, setZoom] = useState(1);
  const editorRef = useRef(null);

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    multiple: false,
    disabled,
    accept: {
      'image/*': [],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setImageToCrop(acceptedFiles[0]);
      }
    },
    ...other,
  });

  const hasFile = !!file;

  const hasError = isDragReject || !!error;

  const imgUrl = typeof file === 'string' ? file : file?.preview;

  const handleSave = () => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas();

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Canvas is empty');
            return;
          }
          const timestamp = Date.now();

          const croppedFile = new File([blob], `cropped-avatar-${timestamp}.png`, {
            type: 'image/png',
          });

          const croppedFileWithPreview = Object.assign(croppedFile, {
            preview: URL.createObjectURL(blob),
          });

          if (onDrop) {
            onDrop([croppedFileWithPreview]);
          }

          setImageToCrop(null);
          setZoom(1);
        },
        'image/png',
        1
      );
    }
  };

  const handleCancel = () => {
    setImageToCrop(null);
    setZoom(1);
  };

  const renderPreview = hasFile && (
    <Image
      alt="avatar"
      src={imgUrl}
      sx={{
        width: 1,
        height: 1,
        borderRadius: '50%',
      }}
    />
  );

  const renderPlaceholder = (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1}
      className="upload-placeholder"
      sx={{
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        zIndex: 9,
        borderRadius: '50%',
        position: 'absolute',
        color: 'text.disabled',
        bgcolor: (theme) => alpha(theme.palette.grey[900], 0.64),
        transition: (theme) =>
          theme.transitions.create(['opacity'], {
            duration: theme.transitions.duration.shorter,
          }),
        '&:hover': {
          opacity: 0.72,
        },
        ...(hasError && {
          color: 'error.main',
          bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
        }),
        ...(hasFile && {
          zIndex: 9,
          opacity: 0,
          color: 'common.white',
          bgcolor: (theme) => alpha(theme.palette.grey[900], 0.64),
        }),
      }}
    >
      <Iconify icon="solar:camera-add-bold" width={32} />

      <Typography variant="caption">{file ? 'Update photo' : 'Upload photo'}</Typography>
    </Stack>
  );

  const renderContent = (
    <Box
      sx={{
        width: 1,
        height: 1,
        overflow: 'hidden',
        borderRadius: '50%',
        position: 'relative',
      }}
    >
      {renderPreview}
      {renderPlaceholder}
    </Box>
  );

  return (
    <>
      <Box
        {...getRootProps()}
        sx={{
          p: 1,
          m: 'auto',
          width: 144,
          height: 144,
          cursor: 'pointer',
          overflow: 'hidden',
          borderRadius: '50%',
          border: (theme) => `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
          ...(isDragActive && {
            opacity: 0.72,
          }),
          ...(disabled && {
            opacity: 0.48,
            pointerEvents: 'none',
          }),
          ...(hasError && {
            borderColor: 'error.main',
          }),
          ...(hasFile && {
            ...(hasError && {
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
            }),
            '&:hover .upload-placeholder': {
              opacity: 1,
            },
          }),
          ...sx,
        }}
      >
        <input {...getInputProps()} />

        {renderContent}
      </Box>

      {helperText && helperText}

      <RejectionFiles fileRejections={fileRejections} />

      <Dialog open={!!imageToCrop} onClose={handleCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Crop Your Avatar</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <AvatarEditor
            ref={editorRef}
            image={imageToCrop}
            width={250}
            height={250}
            border={50}
            borderRadius={150} // Make it a circle
            color={[0, 0, 50, 0.6]} // RGBA color of the border
            scale={zoom}
            rotate={0}
            style={{ margin: 'auto' }}
          />
          <Stack spacing={2} direction="row" sx={{ my: 2, width: '100%' }} alignItems="center">
            <Iconify icon="eva:zoom-out-fill" />
            <Slider
              aria-label="Zoom"
              value={zoom}
              min={0.1}
              max={2}
              step={0.1}
              onChange={(e, newValue) => setZoom(newValue)}
            />
            <Iconify icon="eva:zoom-in-fill" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

UploadAvatar.propTypes = {
  disabled: PropTypes.object,
  error: PropTypes.bool,
  file: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  helperText: PropTypes.object,
  sx: PropTypes.object,
};
