import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';
import AvatarEditor from 'react-avatar-editor';

import {
  Box,
  alpha,
  Stack,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Slider,
} from '@mui/material';

import Iconify from 'src/components/iconify';

const UploadPhoto = ({ onDrop, children }) => {
  const [imageToCrop, setImageToCrop] = useState(null);
  const [zoom, setZoom] = useState(1);
  const editorRef = useRef(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setImageToCrop(acceptedFiles[0]);
      }
    },
    multiple: false,
    accept: {
      'image/*': [],
    },
  });

  const handleSave = () => {
    if (editorRef.current) {
      // Get the canvas with the cropped image
      const canvas = editorRef.current.getImageScaledToCanvas();

      // Convert canvas to a blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Canvas is empty');
            return;
          }

          const timestamp = Date.now();
          // Create a new File object from the blob
          const croppedFile = new File([blob], `cropped-avatar-${timestamp}.png`, {
            type: 'image/png',
          });
          // Call the parent onDrop with the new cropped file
          onDrop([croppedFile]);
          // Close the modal
          setImageToCrop(null);
        },
        'image/png', // format
        1 // quality
      );
    }
  };

  const handleCancel = () => {
    setImageToCrop(null);
    setZoom(1);
  };

  const renderPlaceHolder = (
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
        opacity: 0,
        borderRadius: '50%',
        position: 'absolute',
        color: 'common.white',
        bgcolor: (theme) => alpha(theme.palette.grey[900], 0.64),
        transition: (theme) =>
          theme.transitions.create(['opacity'], {
            duration: theme.transitions.duration.shorter,
          }),
        '&:hover': {
          opacity: 0.72,
        },
      }}
    >
      <Iconify icon="solar:camera-add-bold" width={32} />

      <Typography variant="caption">Upload photo</Typography>
    </Stack>
  );

  return (
    <>
      <Box
        {...getRootProps()}
        sx={{
          width: 144,
          height: 144,
          m: 'auto',
          borderStyle: 'dashed',
          overflow: 'hidden',
          borderWidth: 1,
          borderRadius: '50%',
          padding: 1,
          cursor: 'pointer',
          ...(isDragActive && {
            opacity: 0.72,
          }),
          borderColor: (theme) => (isDragActive ? 'green' : alpha(theme.palette.grey[500], 0.2)),
          position: 'relative',
          '&:hover .upload-placeholder': {
            opacity: 1,
          },
        }}
      >
        <input {...getInputProps()} />
        {renderPlaceHolder}
        {children}
      </Box>
      <Dialog open={!!imageToCrop} onClose={handleCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Crop Your Photo</DialogTitle>
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
};

export default UploadPhoto;

UploadPhoto.propTypes = {
  onDrop: PropTypes.func,
  children: PropTypes.node,
};
