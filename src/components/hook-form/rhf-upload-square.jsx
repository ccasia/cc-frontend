import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import Image from '../image';
import Iconify from '../iconify';
import RejectionFiles from '../upload/errors-rejection-files';

RHFUploadSquare.propTypes = {
  name: PropTypes.string,
  helperText: PropTypes.node,
  previewUrl: PropTypes.string,
};

export default function RHFUploadSquare({ name, helperText, previewUrl, ...other }) {
  const { control } = useFormContext();
  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    multiple: false,
    ...other,
    // onDrop: (acceptedFiles) => {
    //   if (acceptedFiles.length > 0) {
    //     field.onChange(acceptedFiles[0]);
    //     if (other.onDrop) {
    //       other.onDrop(acceptedFiles);
    //     }
    //   }
    // },
  });

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        // const checkError = !!error && !field.value;

        const hasFile = !!field.value || !!previewUrl;
        const hasError = isDragReject || !!error;
        const imgUrl =
          previewUrl || (typeof field.value === 'string' ? field.value : field.value?.preview);

        const renderPreview = hasFile && (
          <Image
            alt="background"
            src={imgUrl}
            sx={{
              width: 1,
              height: 1,
              borderRadius: 1,
              objectFit: 'cover',
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
              borderRadius: 1,
              position: 'absolute',
              color: 'text.disabled',
              bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
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
            <Typography variant="caption">{hasFile ? 'Update photo' : 'Upload photo'}</Typography>
          </Stack>
        );

        return (
          <>
            <Box
              {...getRootProps()}
              sx={{
                p: 1,
                m: 'auto',
                width: 1,
                height: 200,
                cursor: 'pointer',
                overflow: 'hidden',
                borderRadius: 1,
                position: 'relative',
                border: (theme) => `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
                ...(isDragActive && {
                  opacity: 0.72,
                }),
                ...(hasError && {
                  borderColor: 'error.main',
                }),
                ...(hasFile && {
                  '&:hover .upload-placeholder': {
                    opacity: 1,
                  },
                }),
              }}
            >
              <input {...getInputProps()} />

              {renderPreview}
              {renderPlaceholder}
            </Box>

            {helperText && helperText}

            <RejectionFiles fileRejections={fileRejections} />
          </>
        );
      }}
    />
  );
}
