import { useState } from 'react';
import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';

import getCroppedImg from '../../utils/cropImage';
import UploadSingle from '../upload/upload-single';
import ImageCropDialog from '../upload/image-crop-dialog';

// ----------------------------------------------------------------------

export function RHFUploadCover({ name, helperText, renderPreview, ...other }) {
  const { control } = useFormContext();

  const [rawImage, setRawImage] = useState(null);
  const [applying, setApplying] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const fileArray = field.value || [];
        const displayFile = Array.isArray(fileArray) && fileArray.length > 0 ? fileArray[0] : null;

        const handleDrop = (acceptedFiles) => {
          if (acceptedFiles.length > 0) {
            setRawImage(URL.createObjectURL(acceptedFiles[0]));
          }
        };

        const closeCropper = () => {
          URL.revokeObjectURL(rawImage);
          setRawImage(null);
        };

        const handleApply = async (areaPixels) => {
          setApplying(true);
          try {
            const croppedFile = await getCroppedImg(rawImage, areaPixels);
            field.onChange([croppedFile]);
            closeCropper();
          } finally {
            setApplying(false);
          }
        };

        return (
          <>
            <UploadSingle
              file={displayFile}
              error={!!error}
              helperText={error?.message || helperText}
              onDelete={() => field.onChange([])}
              onDrop={handleDrop}
              {...other}
            />

            <ImageCropDialog
              key={rawImage}
              image={rawImage}
              applying={applying}
              onCancel={closeCropper}
              onApply={handleApply}
              renderPreview={renderPreview}
            />
          </>
        );
      }}
    />
  );
}

RHFUploadCover.propTypes = {
  name: PropTypes.string,
  helperText: PropTypes.string,
  renderPreview: PropTypes.func,
};
