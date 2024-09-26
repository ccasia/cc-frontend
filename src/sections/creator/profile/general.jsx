import * as Yup from 'yup';
import { useCallback, useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { Checkbox, InputAdornment, FormControlLabel } from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

import { fData } from 'src/utils/format-number';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { countries } from 'src/assets/data';
import { useAuthContext } from 'src/auth/hooks';
import { regions } from 'src/assets/data/regions';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
  RHFUploadAvatar,
  RHFAutocomplete
} from 'src/components/hook-form';

import RHFUploadSquare from 'src/components/hook-form/rhf-upload-square';

import 'croppie/croppie.css';
import Croppie from 'croppie';

// ----------------------------------------------------------------------

export default function AccountGeneral() {

  // Hooks
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();

  // State
  const [openCropDialog, setOpenCropDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.photoBackgroundURL || null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState(null);

  const croppieRef = useRef(null);
  const croppieContainerRef = useRef(null);

  const UpdateUserSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    photoURL: Yup.mixed().nullable(),
    photoBackgroundURL: Yup.mixed().nullable(),
    phoneNumber: Yup.string().required('Phone number is required'),
    country: Yup.string().required('Country is required'),
    address: Yup.string().required('Address is required'),
    state: Yup.string().required('State is required'),
    about: Yup.string().required('About is required'),
  });

  const defaultValues = {
    name: user?.name || '',
    email: user?.email || '',
    photoURL: user?.photoURL || null,
    photoBackgroundURL: user?.photoBackgroundURL || null,
    phoneNumber: user?.phoneNumber || '',
    country: user?.country || '',
    address: user?.creator?.address || '',
    state: user?.creator?.state || '',
    about: user?.creator?.mediaKit?.about || '',
  };

  const methods = useForm({
    resolver: yupResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    setValue,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (!openCropDialog) {
      if (croppieRef.current) {
        console.log('Cleaning up Croppie on dialog close');
        try {
          croppieRef.current.destroy();
        } catch (error) {
          console.error('Error cleaning up Croppie on dialog close:', error);
        }
        croppieRef.current = null;
      }
      setImageDataUrl(null);
    }
  }, [openCropDialog]);

  useEffect(() => {
    console.log('useEffect triggered', { openCropDialog, imageDataUrl, croppieContainerRef: !!croppieContainerRef.current, croppieRef: !!croppieRef.current });
    if (openCropDialog && imageDataUrl && croppieContainerRef.current && !croppieRef.current) {
      console.log('Initializing Croppie with imageDataUrl');
      setTimeout(() => {
        try {
          croppieRef.current = new Croppie(croppieContainerRef.current, {
            viewport: { width: 396, height: 199, type: 'square' },
            boundary: { width: 500, height: 300 },
            showZoomer: true,
            enableOrientation: true,
            enableResize: false,
            enableExif: true,
            mouseWheelZoom: 'ctrl'
          });
          croppieRef.current.bind({
            url: imageDataUrl,
            zoom: 0
          });
          console.log('Croppie initialized successfully');
        } catch (error) {
          console.error('Error initializing Croppie:', error);
        }
      }, 0);
    }

    return () => {
      if (croppieRef.current) {
        console.log('Cleaning up Croppie');
        try {
          croppieRef.current.destroy();
        } catch (error) {
          console.error('Error cleaning up Croppie:', error);
        }
        croppieRef.current = null;
      }
    };
  }, [openCropDialog, imageDataUrl]);

  useEffect(() => {
    if (openCropDialog && selectedFile) {
      console.log('Reading file');
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('FileReader onload', e.target.result.substring(0, 50) + '...');
        setIsLoading(false);
        setImageDataUrl(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }

    return () => {
      console.log('Cleanup: setting imageDataUrl to null');
      setImageDataUrl(null);
    };
  }, [openCropDialog, selectedFile]);

  const scaleImage = (file, maxWidth, maxHeight) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(resolve, 'image/png', 1);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCrop = () => {
    if (croppieRef.current) {
      croppieRef.current.result({
        type: 'blob',
        size: { width: 1584, height: 396 },
        format: 'png',
        quality: 1,
        circle: false
      }).then((blob) => {
        const newPreviewUrl = URL.createObjectURL(blob);
        setPreviewUrl(newPreviewUrl);
        setValue('photoBackgroundURL', blob, { shouldValidate: true });
        setOpenCropDialog(false);
      });
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();

    const newObj = { ...data, id: user?.id };

    formData.append('image', data?.photoURL);
    formData.append('backgroundImage', data?.photoBackgroundURL);
    formData.append('data', JSON.stringify(newObj));

    console.log('Form data:', Object.fromEntries(formData));

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const res = await axiosInstance.patch(endpoints.auth.updateProfileCreator, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      enqueueSnackbar(res?.data.message);
    } catch (error) {
      enqueueSnackbar('Error', {
        variant: 'error',
      });
    }
  });

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      if (file) {
        setValue('photoURL', newFile, { shouldValidate: true });
      }
    },
    [setValue]
  );

  const handleDropBackground = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      console.log('File selected', file);
      if (file) {
        if (croppieRef.current) {
          croppieRef.current.destroy();
          croppieRef.current = null;
        }
        const scaledBlob = await scaleImage(file, 1584, 396);
        setSelectedFile(new File([scaledBlob], file.name, { type: 'image/png' }));
        setOpenCropDialog(true);
      }
    },
    [setSelectedFile, setOpenCropDialog]
  );

  // const handleDropBackground = useCallback(
  //   (acceptedFiles) => {
  //     const file = acceptedFiles[0];

  //     const newFile = Object.assign(file, {
  //       preview: URL.createObjectURL(file),
  //     });

  //     if (file) {
  //       setValue('photoBackgroundURL', newFile, { shouldValidate: true });
  //     }
  //   },
  //   [setValue]
  // );

  const country = watch('country');
  const nationality = watch('country');

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Card sx={{ pt: 4, pb: 5, px: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Profile Picture
            </Typography>
            <RHFUploadAvatar
              name="photoURL"
              maxSize={3145728}
              onDrop={handleDrop}
              helperText={
                <Typography
                  variant="caption"
                  sx={{
                    mt: 3,
                    mx: 'auto',
                    display: 'block',
                    textAlign: 'center',
                    color: 'text.disabled',
                  }}
                >
                  Allowed *.jpeg, *.jpg, *.png, *.gif
                  <br /> max size of {fData(3145728)}
                </Typography>
              }
            />
            <Box sx={{ mt: 5 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Background Picture
              </Typography>
              <RHFUploadSquare
                name="photoBackgroundURL"
                maxSize={5242880}
                onDrop={handleDropBackground}
                previewUrl={previewUrl}
                sx={{ width: '100%', height: 200 }}
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 3,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    Allowed *.jpeg, *.jpg, *.png
                    <br /> max size of {fData(5242880)}
                  </Typography>
                }
              />
            </Box>
          </Card>
        </Grid>

        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <RHFTextField name="name" label="Name" />
              <RHFTextField name="email" label="Email Address" />

              <Stack>
                <RHFTextField name="address" label="Address" multiline />
                <FormControlLabel
                  control={<Checkbox defaultChecked size="small" />}
                  label="Same as current location"
                  onChange={(e, val) => {
                    if (val) {
                      setValue('address', user?.creator?.location);
                    } else {
                      setValue('address', '');
                    }
                  }}
                />
              </Stack>

              <RHFAutocomplete
                name="state"
                type="state"
                label="State/Region"
                placeholder="Choose a state/region"
                options={regions
                  .filter((elem) => elem.countryName === country)
                  .map((a) => a.regions)
                  .flatMap((b) => b)
                  .map((c) => c.name)}
                getOptionLabel={(option) => option}
              />

              <RHFAutocomplete
                name="country"
                type="country"
                label="Country"
                placeholder="Choose a country"
                options={countries.map((option) => option.label)}
                getOptionLabel={(option) => option}
              />

              <RHFTextField
                name="phoneNumber"
                label="Phone Number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      +{countries.filter((a) => a.label === nationality).map((e) => e.phone)}
                    </InputAdornment>
                  ),
                }}
              />

              {/* <RHFTextField name="state" label="State/Region" /> */}
              {/* <RHFTextField name="city" label="City" /> */}
              {/* <RHFTextField name="zipCode" label="Zip/Code" /> */}
            </Box>

            <Stack spacing={3} alignItems="flex-end" sx={{ mt: 3 }}>
              <RHFTextField name="about" multiline rows={7} label="About" />

              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                Save Changes
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
      <Dialog
        open={openCropDialog}
        onClose={() => {
          setOpenCropDialog(false);
          setImageDataUrl(null);
          if (croppieRef.current) {
            console.log('Cleaning up Croppie on dialog close');
            try {
              const elements = croppieContainerRef.current?.querySelectorAll('.cr-boundary, .cr-slider-wrap, .cr-viewport');
              elements?.forEach(el => el.remove());
              croppieRef.current.destroy();
            } catch (error) {
              console.error('Error cleaning up Croppie on dialog close:', error);
            }
            croppieRef.current = null;
          }
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '800px', // Adjust this value as needed
            height: 'auto',
            maxHeight: '80vh',
            m: 2,
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          Crop Image
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ flexGrow: 1, width: '100%', height: '100%', minHeight: '400px' }}>
                <div ref={croppieContainerRef} style={{ width: '100%', height: '100%' }} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', py: 2, px: 3 }}>
          <Button onClick={() => setOpenCropDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleCrop} variant="contained">
            Crop and Save
          </Button>
        </DialogActions>
      </Dialog>
    </FormProvider>
  );
}
