import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';

import FormHelperText from '@mui/material/FormHelperText';

import UploadSingle from '../upload/upload-single';

// ----------------------------------------------------------------------

export function RHFUploadCover({ name, helperText, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        // Get the first file from array if it exists
        const fileArray = field.value || [];
        const displayFile = Array.isArray(fileArray) && fileArray.length > 0 ? fileArray[0] : null;

        return (
          <div>
            <UploadSingle
              file={displayFile}
              error={!!error}
              helperText={error?.message || helperText}
              onDelete={() => {
                field.onChange([]);
              }}
              onDrop={(acceptedFiles) => {
                if (acceptedFiles.length > 0) {
                  const file = acceptedFiles[0];
                  const fileWithPreview = Object.assign(file, {
                    preview: URL.createObjectURL(file),
                  });
                  // Store as array to match Yup schema
                  field.onChange([fileWithPreview]);
                }
              }}
              {...other}
            />

            {!!error && (
              <FormHelperText error sx={{ px: 2, mt: 1 }}>
                {error.message}
              </FormHelperText>
            )}
          </div>
        );
      }}
    />
  );
}

RHFUploadCover.propTypes = {
  name: PropTypes.string,
  helperText: PropTypes.string,
};
