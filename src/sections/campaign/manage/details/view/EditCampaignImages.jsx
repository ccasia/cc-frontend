import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Cropper from 'react-easy-crop';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Dialog,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  Button,
  Slider,
  Stack,
  IconButton,
  alpha,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

// import { RHFUpload } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';
import Iconify from 'src/components/iconify';
import CustomImage from 'src/components/image';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      'image/png',
      1
    );
  });
};

const EditCampaignImages = ({ open, campaign, onClose }) => {
  const campaignImages = useMemo(() => campaign?.campaignBrief?.images, [campaign]);

  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  const methods = useForm({
    defaultValues: {
      campaignImages: campaignImages || [],
    },
    reValidateMode: 'onChange',
    mode: 'onChange',
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, dirtyFields },
  } = methods;

  const values = watch();
  const images = values.campaignImages || [];

  //   const handleDropMultiFile = useCallback(
  //     (acceptedFiles) => {
  //       const files = values.campaignImages || [];
  //       const newFiles = acceptedFiles.map((file) =>
  //         Object.assign(file, {
  //           preview: URL.createObjectURL(file),
  //         })
  //       );

  //       setValue('campaignImages', [...files, ...newFiles]);
  //     },
  //     [setValue, values.campaignImages]
  //   );

  const handleDropMultiFile = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        const fileWithPreview = Object.assign(file, {
          preview: URL.createObjectURL(file),
          originalFile: file,
          isOriginal: true,
        });

        setImageToCrop(fileWithPreview);
        setCurrentImageIndex(images.length);
        setIsEditingExisting(false);
        setCrop({ x: 0, y: 0 });
        setZoom(1.5);
      }
    },
    [images.length]
  );

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = useCallback(async () => {
    if (!imageToCrop) return;

    try {
      const imageSource = imageToCrop.preview || imageToCrop;
      const croppedImage = await getCroppedImg(imageSource, croppedAreaPixels);

      if (!croppedImage) {
        enqueueSnackbar('Failed to process image. Please try again.', {
          variant: 'error',
        });
        return;
      }

      const timestamp = Date.now();
      const croppedFile = new File([croppedImage], `campaign-${timestamp}.png`, {
        type: 'image/png',
      });

      const croppedFileWithPreview = Object.assign(croppedFile, {
        preview: URL.createObjectURL(croppedFile),
        originalFile: imageToCrop.originalFile || imageToCrop,
        cropData: {
          crop,
          zoom,
          croppedAreaPixels,
        },
        isOriginal: false,
      });

      let newFiles;

      if (isEditingExisting) {
        newFiles = [...images];
        newFiles[currentImageIndex] = croppedFileWithPreview;
      } else {
        newFiles = [...images, croppedFileWithPreview];
      }

      setValue('campaignImages', newFiles, { shouldValidate: true });

      setImageToCrop(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1.5);
      setCroppedAreaPixels(null);
      setCurrentImageIndex(null);
      setIsEditingExisting(false);
    } catch (error) {
      console.error('Error saving cropped image:', error);
      enqueueSnackbar('Failed to process image. Please try again.', {
        variant: 'error',
      });
    }
  }, [
    imageToCrop,
    croppedAreaPixels,
    setValue,
    images,
    currentImageIndex,
    isEditingExisting,
    crop,
    zoom,
  ]);

  const handleCancel = useCallback(() => {
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1.5);
    setCroppedAreaPixels(null);
    setCurrentImageIndex(null);
    setIsEditingExisting(false);
  }, []);

  const handleRemove = useCallback(
    (fileToRemove) => {
      const filtered = images.filter((file) => file !== fileToRemove);
      setValue('campaignImages', filtered, { shouldValidate: true });
    },
    [images, setValue]
  );

  const handleRemoveAll = useCallback(() => {
    setValue('campaignImages', [], { shouldValidate: true });
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    multiple: true,
    disabled: false,
    accept: {
      'image/*': [],
    },
    maxSize: 3145728,
    onDrop: handleDropMultiFile,
  });

  const hasFile = images.length > 0;
  const hasError = isDragReject;

  const renderPreview = hasFile && (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle2">Preview ({images.length}/3)</Typography>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        {images.map((file, index) => {
          const imgUrl = typeof file === 'string' ? file : file.preview;

          return (
            <Box key={index} sx={{ position: 'relative' }}>
              <Box sx={{ position: 'relative' }}>
                <CustomImage
                  alt={file.name}
                  src={imgUrl}
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 1,
                    objectFit: 'cover',
                    border: 1,
                    borderColor: 'divider',
                  }}
                />

                <IconButton
                  size="small"
                  onClick={() => handleRemove(file)}
                  sx={{
                    position: 'absolute',
                    top: 5,
                    right: 5,
                    zIndex: 9,
                    width: 25,
                    height: 25,
                    color: (theme) => alpha(theme.palette.common.white, 0.8),
                    bgcolor: (theme) => alpha(theme.palette.grey[900], 0.72),
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.grey[900], 0.48),
                    },
                  }}
                >
                  <Iconify icon="mingcute:close-line" width={18} />
                </IconButton>
              </Box>
            </Box>
          );
        })}
      </Stack>
      <Stack direction="row" justifyContent="flex-end">
        <Button size="small" onClick={handleRemoveAll} variant="outlined" sx={{ mt: 2 }}>
          Remove all
        </Button>
      </Stack>
    </Box>
  );

  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();

    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (const i in data.campaignImages) {
      formData.append('campaignImages', data.campaignImages[i]);
    }

    formData.append('campaignId', campaign?.id);

    try {
      const res = await axiosInstance.patch(
        endpoints.campaign.editCampaignImages(campaign?.id),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      mutate(endpoints.campaign.getCampaignById(campaign.id));
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  });

  //   return (
  //     <Dialog open={open.campaignImages}>
  //       <FormProvider methods={methods} onSubmit={onSubmit}>
  //         <DialogTitle>Edit Campaign Images</DialogTitle>
  //         <DialogContent>
  //           <Box
  //             sx={{
  //               display: 'flex',
  //               flexDirection: 'column',
  //               justifyContent: 'center',
  //               alignContent: 'center',
  //               gap: 3,
  //               p: 3,
  //             }}
  //           >
  //             <Typography variant="h4">Upload Campaign Images</Typography>

  //             <RHFUpload
  //               multiple
  //               type="file"
  //               thumbnail
  //               name="campaignImages"
  //               maxSize={3145728}
  //               onDrop={handleDropMultiFile}
  //               onRemove={(inputFile) =>
  //                 setValue(
  //                   'campaignImages',
  //                   values.campaignImages &&
  //                     values.campaignImages?.filter((file, index) => file !== inputFile),
  //                   { shouldValidate: true }
  //                 )
  //               }
  //               onRemoveAll={() => setValue('campaignImages', [], { shouldValidate: true })}
  //             />
  //           </Box>
  //         </DialogContent>
  //         <DialogActions>
  //           <LoadingButton size="small" onClick={() => onClose('campaignImages')} variant="outlined">
  //             Close
  //           </LoadingButton>
  //           <LoadingButton
  //             size="small"
  //             type="submit"
  //             variant="contained"
  //             loading={isSubmitting}
  //             // disabled={!isDirty}
  //           >
  //             Save
  //           </LoadingButton>
  //         </DialogActions>
  //       </FormProvider>
  //     </Dialog>
  //   );
  // };
  return (
    <>
      <Dialog open={open.campaignImages}>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <DialogTitle>Edit Campaign Images</DialogTitle>
          <DialogContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignContent: 'center',
                gap: 3,
                p: 3,
              }}
            >
              <Typography variant="h4">Upload Campaign Images</Typography>

              <Box
                {...getRootProps()}
                sx={{
                  width: 1,
                  height: 200,
                  flexShrink: 0,
                  display: 'flex',
                  borderRadius: 1,
                  cursor: 'pointer',
                  alignItems: 'center',
                  color: 'text.disabled',
                  justifyContent: 'center',
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                  border: (theme) => `dashed 1px ${theme.palette.divider}`,
                  ...(isDragActive && {
                    opacity: 0.72,
                  }),
                  ...(images.length >= 3 && {
                    opacity: 0.48,
                    pointerEvents: 'none',
                  }),
                  ...(hasError && {
                    color: 'error.main',
                    borderColor: 'error.main',
                    bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                  }),
                  '&:hover': {
                    opacity: 0.72,
                  },
                }}
              >
                <input {...getInputProps()} />

                <Stack spacing={2} alignItems="center">
                  <Box
                    sx={{
                      bgcolor: '#203ff5',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Iconify
                      icon="fluent:add-24-filled"
                      width={26}
                      sx={{
                        color: '#fff',
                      }}
                    />
                  </Box>
                  <Stack spacing={1} alignItems="center">
                    <Typography variant="h6" color="text.primary">
                      {images.length >= 3
                        ? 'Maximum 3 images reached'
                        : 'Choose a file or drag and drop here'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {images.length < 3 ? (
                        <>Acceptable files: JPG, PNG, SVG</>
                      ) : (
                        'Remove some images to add more'
                      )}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>

              {renderPreview}
            </Box>
          </DialogContent>
          <DialogActions>
            <LoadingButton
              size="small"
              onClick={() => onClose('campaignImages')}
              variant="outlined"
            >
              Close
            </LoadingButton>
            <LoadingButton
              size="small"
              type="submit"
              variant="contained"
              loading={isSubmitting}
              // disabled={!isDirty}
            >
              Save
            </LoadingButton>
          </DialogActions>
        </FormProvider>
      </Dialog>

      <Dialog open={!!imageToCrop} onClose={handleCancel} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditingExisting ? 'Edit Campaign Image' : 'Adjust Campaign Image'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ position: 'relative', height: 400, width: '100%' }}>
            {imageToCrop && (
              <Cropper
                image={imageToCrop?.preview || imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                showGrid={false}
                cropShape="rect"
                objectFit="contain"
                restrictPosition={false}
                style={{
                  containerStyle: {
                    background: 'rgba(0, 0, 0, 0.5)',
                  },
                  cropAreaStyle: {
                    border: '2px solid #fff',
                  },
                }}
              />
            )}
          </Box>

          <Stack spacing={2} direction="row" sx={{ mt: 2, width: '100%' }} alignItems="center">
            <Iconify icon="eva:zoom-out-fill" />
            <Slider
              aria-label="Zoom"
              value={zoom}
              min={0.1}
              max={3}
              step={0.01}
              onChange={(e, newValue) => setZoom(newValue)}
            />
            <Iconify icon="eva:zoom-in-fill" />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
            Position and zoom the image
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {isEditingExisting ? 'Save Changes' : 'Save Image'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditCampaignImages;

EditCampaignImages.propTypes = {
  open: PropTypes.object,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
