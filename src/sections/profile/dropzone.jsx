import React from 'react';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';

import { Box, alpha, Stack, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

const UploadPhoto = ({ onDrop, children }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': [],
    },
  });

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
        color: 'common.white',
        bgcolor: (theme) => alpha(theme.palette.grey[900], 0.64),
        borderRadius: '50%',
        position: 'absolute',
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
  );
};

export default UploadPhoto;

UploadPhoto.propTypes = {
  onDrop: PropTypes.func,
  children: PropTypes.node,
};
