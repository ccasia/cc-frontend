import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';

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

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) =>
        multiple ? (
          <Upload
            multiple
            accept={
              // eslint-disable-next-line no-nested-ternary
              type === 'file'
                ? { 'image/*': [] }
                : type === 'video'
                  ? { 'video/*': [] }
                  : { 'image/*': [] }
            }
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
        ) : (
          <Upload
            accept={
              // eslint-disable-next-line no-nested-ternary
              type === 'file'
                ? { 'image/*': [] }
                : // eslint-disable-next-line no-nested-ternary
                  type === 'video'
                  ? { 'video/*': [] }
                  : type === 'doc'
                    ? {
                        'application/msword': ['.doc'],
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
                          '.docx',
                        ],
                      }
                    : { 'application/pdf': [] }
            }
            file={field.value}
            error={!!error}
            uploadType={uploadType}
            helperText={
              (!!error || helperText) && (
                <FormHelperText error={!!error} sx={{ px: 2 }}>
                  {error ? error?.message : helperText}
                </FormHelperText>
              )
            }
            {...other}
          />
        )
      }
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
