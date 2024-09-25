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
    if (imageDataUrl && croppieContainerRef.current && !croppieRef.current) {
      console.log('Initializing Croppie with imageDataUrl');
      croppieRef.current = new Croppie(croppieContainerRef.current, {
        viewport: { width: 400, height: 100, type: 'square' },
        boundary: { width: 450, height: 150 },
        showZoomer: true,
        enableOrientation: true
      });
      croppieRef.current.bind({ url: imageDataUrl });
    }
  
    return () => {
      if (croppieRef.current) {
        console.log('Cleaning up Croppie');
        try {
          // Attempt to remove Croppie-generated elements manually
          const elements = croppieContainerRef.current?.querySelectorAll('.cr-boundary, .cr-slider-wrap, .cr-viewport');
          elements?.forEach(el => el.remove());
          croppieRef.current.destroy();
        } catch (error) {
          console.error('Error cleaning up Croppie:', error);
        }
        croppieRef.current = null;
      }
    };
  }, [imageDataUrl]);

  useEffect(() => {
    return () => {
      if (croppieRef.current) {
        console.log('Component unmounting, cleaning up Croppie');
        try {
          const elements = croppieContainerRef.current?.querySelectorAll('.cr-boundary, .cr-slider-wrap, .cr-viewport');
          elements?.forEach(el => el.remove());
          croppieRef.current.destroy();
        } catch (error) {
          console.error('Error cleaning up Croppie on component unmount:', error);
        }
        croppieRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (openCropDialog && selectedFile) {
      console.log('Reading file');
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('FileReader onload');
        setIsLoading(false);
        setImageDataUrl(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }

    return () => {
      setImageDataUrl(null);
    };
  }, [openCropDialog, selectedFile]);

  const handleCrop = () => {
    if (croppieRef.current) {
      croppieRef.current.result('blob').then((blob) => {
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
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      console.log('File selected', file);
      if (file) {
        setSelectedFile(file);
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
        // Attempt to remove Croppie-generated elements manually
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
>
        <DialogTitle>Crop Image</DialogTitle>
        <DialogContent>
          <Box sx={{ width: '100%', height: 400, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {isLoading ? (
              <CircularProgress />
            ) : (
              <div ref={croppieContainerRef} style={{ width: '100%', height: '100%' }}>
                {!croppieRef.current && 'Croppie not initialized'}
              </div>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCropDialog(false)}>Cancel</Button>
          <Button onClick={handleCrop}>Crop and Save</Button>
        </DialogActions>
      </Dialog>
    </FormProvider>
  );
}
