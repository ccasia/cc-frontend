/* eslint-disable jsx-a11y/media-has-caption */
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Controller, useFormContext } from 'react-hook-form';

import { grey } from '@mui/material/colors';
import {
  Box,
  Stack,
  alpha,
  Button,
  Typography,
  ListItemText,
  CircularProgress,
} from '@mui/material';

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

  const renderPlaceholder = (
    <Box
      {...getRootProps()}
      sx={{
        display: 'flex',
        border: 1,
        borderColor: grey[300],
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        '&:hover': {
          opacity: 0.4,
        },
        minHeight: 250,
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
      <Stack gap={1}>
        {/* <Typography variant="caption">{progressName && progressName}</Typography> */}
        {/* <LinearProgress variant="determinate" value={progress} /> */}
        Uploading {sourceName}{' '}
      </Stack>
    </Stack>
  );

  const renderPreview = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        border: 1,
        gap: 2,
        borderColor: grey[300],
        justifyContent: 'center',
        alignItems: { xs: 'flex-start', sm: 'center' },
        minHeight: 250,
        borderRadius: 2,
        p: 2,
      }}
    >
      {source && (
        <Box
          sx={{
            height: 300,
            width: 250,
            flexGrow: 1,
            alignSelf: 'center',
          }}
        >
          <Box
            component="video"
            autoPlay
            controls
            sx={{
              width: 1,
              height: 1,
              border: 1,
              borderRadius: 2,
              borderColor: grey[300],
            }}
            onLoadedMetadata={handleLoadedMetadata}
          >
            <source src={source} />
          </Box>
        </Box>
      )}
      {!data?.progress ? (
        <Stack spacing={1} flexGrow={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Attached:
          </Typography>
          <Typography fontWeight="bold">{sourceName}</Typography>
          <ListItemText
            primary={`Duration: ${duration}s`}
            secondary={`Size: ${fData(size)}`}
            primaryTypographyProps={{
              variant: 'caption',
              color: 'text.secondary',
            }}
            secondaryTypographyProps={{
              variant: 'caption',
              color: 'text.secondary',
            }}
          />
          <Button variant="outlined" size="small" onClick={remove}>
            Change / Remove
          </Button>
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
};
