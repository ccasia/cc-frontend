import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Cropper from 'react-easy-crop';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import Iconify from '../iconify';
import UploadSingle from '../upload/upload-single';
import getCroppedImg from '../../utils/cropImage';

// ----------------------------------------------------------------------

export function RHFUploadCover({ name, helperText, ...other }) {
  const { control } = useFormContext();

  const [rawImage, setRawImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

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

        const handleConfirm = async () => {
          const croppedFile = await getCroppedImg(rawImage, croppedAreaPixels);
          field.onChange([croppedFile]);
          setRawImage(null);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
        };

        const handleCancel = () => {
          setRawImage(null);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
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

            <Dialog open={!!rawImage} onClose={handleCancel} maxWidth="sm" fullWidth>
              <DialogTitle sx={{ pb: 1 }}>
                Crop Campaign Image
                <IconButton
                  onClick={handleCancel}
                  sx={{ position: 'absolute', right: 12, top: 12 }}
                >
                  <Iconify icon="mingcute:close-line" />
                </IconButton>
              </DialogTitle>

              <DialogContent>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Drag to reposition. Use the slider to zoom in or out.
                </Typography>

                {/* Crop canvas area */}
                <Box
                  sx={{
                    position: 'relative',
                    height: 340,
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    bgcolor: 'grey.900',
                  }}
                >
                  <Cropper
                    image={rawImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={16 / 9}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </Box>

                {/* Zoom slider */}
                <Box sx={{ mt: 2.5 }}>
                  <Typography variant="subtitle2" mb={0.5}>
                    Zoom
                  </Typography>
                  <Slider
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.05}
                    onChange={(_, value) => setZoom(value)}
                    sx={{
                      color: '#3A3A3C',
                      '& .MuiSlider-thumb': {
                        width: 16,
                        height: 16,
                      },
                    }}
                  />
                </Box>
              </DialogContent>

              <DialogActions>
                <Button variant="outlined" color="inherit" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="contained" color="inherit" onClick={handleConfirm}>
                  Apply
                </Button>
              </DialogActions>
            </Dialog>
          </>
        );
      }}
    />
  );
}

RHFUploadCover.propTypes = {
  name: PropTypes.string,
  helperText: PropTypes.string,
};
