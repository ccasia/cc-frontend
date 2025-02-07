import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';
import { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import FormHelperText from '@mui/material/FormHelperText';

import { Upload, UploadBox, UploadAvatar } from '../upload';

// ----------------------------------------------------------------------

export function RHFUploadAvatar({ name, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div>
          <UploadAvatar error={!!error} file={field.value} {...other} />

          {!!error && (
            <FormHelperText error sx={{ px: 2, textAlign: 'center' }}>
              {error.message}
            </FormHelperText>
          )}
        </div>
      )}
    />
  );
}

RHFUploadAvatar.propTypes = {
  name: PropTypes.string,
};

// ----------------------------------------------------------------------

export function RHFUploadBox({ name, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <UploadBox files={field.value} error={!!error} {...other} />
      )}
    />
  );
}

RHFUploadBox.propTypes = {
  name: PropTypes.string,
};

// ----------------------------------------------------------------------

export function RHFUpload({ name, multiple, type, helperText, uploadType, ...other }) {
  const { control } = useFormContext();
  const [uploadProgress, setUploadProgress] = useState(0);


  // Only accept pdf and powerpoint filetype
  if (type === 'otherAttachment') {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Upload
            multiple
            accept={{
              'application/pdf': [], // Accept PDF files
              'application/vnd.ms-powerpoint': [], // Accept .ppt files
              'application/vnd.openxmlformats-officedocument.presentationml.presentation': [],
            }}
            files={field.value}
            error={!!error}
            helperText={
              (!!error || helperText) && (
                <FormHelperText error={!!error} sx={{ px: 2 }}>
                  {error ? error?.message : helperText}
                </FormHelperText>
              )
            }
            {...other}
          />
        )}
      />
    );
  }

  const accept = {
    file: { 'image/*': [] },
    video: { 'video/*': [] },
    doc: {
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    pdf: { 'application/pdf': [] },
  }[type];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Upload
          multiple={multiple}
          accept={accept}
          files={multiple ? field.value : undefined}
          file={multiple ? undefined : field.value}
          error={!!error}
          uploadType={uploadType}
          onDrop={(acceptedFiles) => {
            const newFiles = acceptedFiles.map((file) => {
              handleUploadProgress(file);
              return Object.assign(file, {
                preview: URL.createObjectURL(file),
              });
            });
            
            if (multiple) {
              field.onChange([...(field.value || []), ...newFiles]);
            } else {
              field.onChange(newFiles[0]);
            }
          }}
          uploadProgress={uploadProgress}
          renderProgress={() => (
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={30}
                  thickness={6}
                  sx={{ color: 'grey.300' }}
                />
                <CircularProgress
                  variant="determinate"
                  value={uploadProgress}
                  size={30}
                  thickness={6}
                  sx={{
                    color: '#5abc6f',
                    position: 'absolute',
                    left: 0,
                    strokeLinecap: 'round',
                  }}
                />
              </Box>
              <Button
                onClick={() => field.onChange(multiple ? [] : null)}
                variant="contained"
                sx={{
                  bgcolor: 'white',
                  border: 1,
                  borderColor: '#e7e7e7',
                  borderBottom: 3,
                  borderBottomColor: '#e7e7e7',
                  color: '#221f20',
                  '&:hover': {
                    bgcolor: 'white',
                    borderColor: '#e7e7e7',
                  },
                  textTransform: 'none',
                  px: 2,
                  py: 1.5,
                  fontSize: '0.875rem',
                  minWidth: '80px',
                  height: '45px',
                }}
              >
                Cancel
              </Button>
            </Stack>
          )}
          helperText={
            (!!error || helperText) && (
              <FormHelperText error={!!error} sx={{ px: 2 }}>
                {error ? error?.message : helperText}
              </FormHelperText>
            )
          }
          {...other}
        />
      )}
    />
  );
}

RHFUpload.propTypes = {
  helperText: PropTypes.string,
  multiple: PropTypes.bool,
  name: PropTypes.string,
  type: PropTypes.string,
  uploadType: PropTypes.string,
};
