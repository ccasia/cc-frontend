/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import { useRef, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import Box from '@mui/material/Box';
import { Chip } from '@mui/material';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { grey } from '@mui/material/colors';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import Iconify from '../iconify';
import MultiFilePreview from './preview-multi-file';
import RejectionFiles from './errors-rejection-files';
import SingleFilePreview from './preview-single-file';

// ----------------------------------------------------------------------

export default function Upload({
  uploadType,
  disabled,
  multiple = false,
  error,
  helperText,
  //
  file,
  onDelete,
  //
  files,
  thumbnail,
  onUpload,
  onRemove,
  onRemoveAll,
  sx,
  height = 250,
  ...other
}) {
  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections, open } =
    useDropzone({
      multiple,
      noClick: true,

      disabled,
      ...other,
    });

  const [isHover, setIsHover] = useState(false);

  const hasFile = !!file && !multiple;

  const hasFiles = !!files && multiple && !!files.length;

  const hasError = isDragReject || !!error;

  const ref = useRef(null);

  useEffect(() => {
    if (!ref?.current) return;
    const currentRef = ref.current;

    const handleMouseOver = () => {
      setIsHover(true);
    };
    const handleMouseLeave = () => {
      setIsHover(false);
    };

    currentRef.addEventListener('mouseover', handleMouseOver);
    currentRef.addEventListener('mouseleave', handleMouseLeave);

    // eslint-disable-next-line consistent-return
    return () => {
      currentRef.removeEventListener('mouseover', handleMouseOver);
      currentRef.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

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
          opacity: 0.6,
        },
        height,
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
            borderRadius: '50%',
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom right, #203ff5, #6379F8)',
            ...(isHover && {
              scale: 1.1,
              transform: 'translateY(-3px)',
            }),
            transition: 'all ease .2s',
          }}
        >
          <Iconify
            icon="formkit:uploadcloud"
            width={30}
            sx={{
              color: '#fff',
            }}
          />
        </Box>

        {Object.keys(other.accept).includes('application/msword') ? (
          <ListItemText
            primary="Choose a file or drag and drop here"
            secondary="Acceptable files: PDF, Powerpoint"
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
        ) : Object.keys(other.accept)[0].includes('video') ? (
          <ListItemText
            primary="Drop your video here"
            secondary="or browse from your device"
            primaryTypographyProps={{
              textAlign: 'center',
              variant: 'subtitle1',
              letterSpacing: 0.4,
              fontSize: 17,
            }}
            secondaryTypographyProps={{
              textAlign: 'center',
              variant: 'subtitle2',
              color: '#8E8E93',
              fontWeight: 400,
              fontSize: 13,
            }}
          />
        ) : Object.keys(other.accept)[0].includes('application/pdf') ? (
          <ListItemText
            primary="Choose a file or drag and drop here"
            secondary="Acceptable files: PDF, JPEG, PNG"
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
        ) : (
          <ListItemText
            primary="Choose a file or drag and drop here"
            secondary={
              uploadType === 'pitch'
                ? 'Upload a video that does not exceed 30 seconds'
                : 'Acceptable files: JPG, PNG, SVG'
            }
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
        )}

        {!!Object.keys(other.accept)[0].includes('video') && (
          <Stack direction="row" gap={1}>
            <Chip
              label="MP4"
              size="small"
              sx={{
                borderRadius: 0.4,
                fontWeight: 'bold',
                bgcolor: '#BBC5FC',
                color: '#3754F6',
                borderColor: '#8F9FFA',
                fontSize: 11,
                minWidth: 50,
              }}
              variant="outlined"
              color="info"
            />
            <Chip
              label="MOV"
              size="small"
              sx={{
                borderRadius: 0.4,
                fontWeight: 'bold',
                bgcolor: '#BBC5FC',
                color: '#3754F6',
                borderColor: '#8F9FFA',
                fontSize: 11,
                minWidth: 50,
              }}
              variant="outlined"
              color="info"
            />
          </Stack>
        )}
      </Stack>
    </Box>
  );

  const renderSinglePreview = (
    <SingleFilePreview imgUrl={typeof file === 'string' ? file : file?.preview} />
  );

  const removeSinglePreview = hasFile && onDelete && (
    <IconButton
      size="small"
      onClick={onDelete}
      sx={{
        top: 16,
        right: 16,
        zIndex: 9,
        position: 'absolute',
        color: (theme) => alpha(theme.palette.common.white, 0.8),
        bgcolor: (theme) => alpha(theme.palette.grey[900], 0.72),
        '&:hover': {
          bgcolor: (theme) => alpha(theme.palette.grey[900], 0.48),
        },
      }}
    >
      <Iconify icon="mingcute:close-line" width={18} />
    </IconButton>
  );

  const renderMultiPreview = hasFiles && (
    <>
      <Box sx={{ my: 3 }}>
        <MultiFilePreview files={files} thumbnail={thumbnail} onRemove={onRemove} />
      </Box>

      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        {onRemoveAll && (
          <Button color="inherit" variant="outlined" size="small" onClick={onRemoveAll}>
            Remove All
          </Button>
        )}

        {onUpload && (
          <Button
            size="small"
            variant="contained"
            onClick={onUpload}
            startIcon={<Iconify icon="eva:cloud-upload-fill" />}
          >
            Upload
          </Button>
        )}
      </Stack>
    </>
  );

  return (
    <Box ref={ref} sx={{ width: 1, position: 'relative', ...sx }}>
      {hasFile ? renderSinglePreview : renderPlaceholder}

      {removeSinglePreview}

      {helperText && (
        <Typography variant="caption" color={hasError ? 'error' : 'text.secondary'} sx={{ mt: 1 }}>
          {helperText}
        </Typography>
      )}
      <RejectionFiles fileRejections={fileRejections} />
      {renderMultiPreview}
    </Box>
  );
}

Upload.propTypes = {
  disabled: PropTypes.object,
  error: PropTypes.bool,
  file: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  files: PropTypes.array,
  helperText: PropTypes.object,
  multiple: PropTypes.bool,
  onDelete: PropTypes.func,
  onRemove: PropTypes.func,
  onRemoveAll: PropTypes.func,
  onUpload: PropTypes.func,
  sx: PropTypes.object,
  height: PropTypes.object,
  thumbnail: PropTypes.bool,
  uploadType: PropTypes.string,
};
