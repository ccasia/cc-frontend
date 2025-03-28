/* eslint-disable jsx-a11y/media-has-caption */
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Controller, useFormContext } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
import { grey } from '@mui/material/colors';
import { Box, Stack, alpha, Typography, ListItemText, CircularProgress } from '@mui/material';

import { fData } from 'src/utils/format-number';

import Iconify from '../iconify';

const UploadPitch = ({
  disabled,
  name,
  type,
  helperText,
  handleProgress,
  source,
  sourceName,
  remove,
  size,
  removeVideo,
  ...other
}) => {
  const [duration, setDuration] = useState('');

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    disabled,
    accept: {
      'video/*': [],
    },
    ...other,
  });

  const methods = useFormContext();

  const {
    control,
    formState: { errors },
  } = methods;

  const handleLoadedMetadata = (event) => {
    const videoDuration = event.target.duration;
    setDuration(videoDuration);
  };

  const hasError = isDragReject || !!errors[name];

  const data = handleProgress();

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderPlaceholder = (
    <Box
      {...getRootProps()}
      sx={{
        display: 'flex',
        border: 1,
        borderColor: grey[300],
        bgcolor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        '&:hover': {
          opacity: 0.4,
        },
        minHeight: 250,
        width: '100%',
        borderRadius: 1.25,
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

      {helperText && helperText}

      <Stack alignItems="center">
        <Iconify icon="gridicons:add-outline" width={40} color="text.secondary" />
        <ListItemText
          primary="Choose a file or drag and drop here"
          secondary="Upload a video that does not exceed 30 seconds"
          primaryTypographyProps={{
            textAlign: 'center',
            variant: 'h5',
          }}
          secondaryTypographyProps={{
            textAlign: 'center',
            variant: 'body1',
            fontSize: '0.8rem',
          }}
        />
      </Stack>
    </Box>
  );

  const renderUploading = (
    <Stack justifyContent="center" alignItems="center" gap={1} alignSelf="center" flexGrow={1}>
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
        }}
      >
        <CircularProgress
          variant="determinate"
          thickness={5}
          value={parseInt(data?.progress, 10)}
          size={200}
          sx={{
            ' .MuiCircularProgress-circle': {
              stroke: (theme) =>
                theme.palette.mode === 'dark'
                  ? theme.palette.common.white
                  : theme.palette.common.black,
              strokeLinecap: 'round',
            },
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 'bolder', fontSize: 11 }}>
            {data?.progress}
          </Typography>
        </Box>
      </Box>
      <Stack gap={1}>Uploading {sourceName} </Stack>
    </Stack>
  );

  const renderPreview = (
    <Box
      sx={{
        mt: -2,
        display: 'flex',
        flexDirection: 'column',
        border: 1,
        borderColor: grey[300],
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 250,
        borderRadius: 1.25,
        p: 2,
        bgcolor: '#ffffff',
      }}
    >
      {source && (
        <Box
          sx={{
            width: '100%',
            aspectRatio: '16/9',
            mb: 2,
          }}
        >
          <Box
            component="video"
            autoPlay
            controls
            sx={{
              width: '100%',
              height: '100%',
              border: 1,
              borderRadius: 1.25,
              borderColor: grey[300],
              objectFit: 'cover',
            }}
            onLoadedMetadata={handleLoadedMetadata}
          >
            <source src={source} />
          </Box>
        </Box>
      )}

      {!data?.progress ? (
        <Stack spacing={1} width="100%" sx={{ml: 1.5}}>
          <Typography variant="subtitle2" color="text.secondary" sx={{mb: -1}}>
            Attached:
          </Typography>
          <Typography fontWeight="bold">{sourceName}</Typography>
          <ListItemText
            primary={`Duration: ${formatDuration(duration)}`}
            secondary={`Size: ${fData(size)}`}
            primaryTypographyProps={{
              variant: 'caption',
              color: 'text.secondary',
              fontWeight: 550,
            }}
            secondaryTypographyProps={{
              variant: 'caption',
              color: 'text.secondary',
              fontWeight: 550,
            }}
          />
          <LoadingButton
            variant="outlined"
            size="medium"
            onClick={remove}
            loading={removeVideo.value}
            sx={{
              alignSelf: 'flex-start',
              bgcolor: '#ffffff',
              borderColor: '#E7E7E7',
              borderWidth: '1px',
              borderBottom: '3px solid #E7E7E7',
              '&:hover': {
                borderColor: '#E7E7E7',
                borderBottom: '3px solid #E7E7E7',
                bgcolor: '#ffffff',
              }
            }}
          >
            Change
          </LoadingButton>
        </Stack>
      ) : (
        renderUploading
      )}
    </Box>
  );

  return (
    <Controller
      name={name}
      control={control}
      render={() => (
        <>
          {source ? renderPreview : renderPlaceholder}
          {helperText && (
            <Typography
              variant="caption"
              color={hasError ? 'error' : 'text.secondary'}
              sx={{ mt: 1 }}
            >
              {helperText}
            </Typography>
          )}
          {hasError && <Typography color="error">{errors[name]?.message}</Typography>}
        </>
      )}
    />
  );
};

export default UploadPitch;

UploadPitch.propTypes = {
  disabled: PropTypes.bool,
  helperText: PropTypes.string,
  multiple: PropTypes.bool,
  name: PropTypes.string,
  type: PropTypes.string,
  handleProgress: PropTypes.func,
  source: PropTypes.string,
  sourceName: PropTypes.string,
  remove: PropTypes.func,
  size: PropTypes.number,
  removeVideo: PropTypes.object,
};
