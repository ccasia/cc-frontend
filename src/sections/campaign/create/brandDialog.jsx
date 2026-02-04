import * as Yup from 'yup';
import { mutate } from 'swr';
import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { Stack, Typography, IconButton, InputAdornment } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { interestsLists } from 'src/contants/interestLists';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

export default function CreateBrand({ setBrand, open, onClose, brandName, client }) {
  const NewUserSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Must be a valid email').required('Email is required'),
    phone: Yup.string().required('Phone is required'),
    brandInstagram: Yup.string(),
    brandTiktok: Yup.string(),
    brandFacebook: Yup.string(),
    brandIndustries: Yup.array()
      .min(1, 'At least one Brand Interests is required')
      .max(3, 'Maximum of three Brand Interests is required')
      .required('BrandIndustries is required'),
  });

  const defaultValues = {
    name: brandName || '',
    email: '',
    phone: '',
    client: client || {},
    brandInstagram: '',
    brandTiktok: '',
    brandFacebook: '',
    brandIndustries: [],
  };

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.post(endpoints.company.createOneBrand, data);
      enqueueSnackbar(res?.data?.message, { variant: 'success' });
      mutate(endpoints.company.getOptions);
      if (setBrand) {
        await setBrand(res?.data?.brand);
      }
      reset();
      onClose();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create brand';
      enqueueSnackbar(errorMessage, {
        variant: 'error',
      });
    }
  });

  useEffect(() => {
    if (brandName) {
      setValue('name', brandName);
    }
  }, [brandName, setValue]);

  useEffect(() => {
    if (client) {
      setValue('client', client);
    }
  }, [client, setValue]);

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      PaperProps={{
        sx: { maxWidth: 720, borderRadius: 0.8 },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="mdi:store" width={28} />
          <Typography
            sx={{ fontFamily: (theme) => theme.typography.fontSecondaryFamily, flexGrow: 1 }}
            fontSize={30}
          >
            Create Brand for {client?.name}
          </Typography>
          <IconButton
            type="button"
            size="small"
            sx={{ borderRadius: 1 }}
            onClick={handleClose}
            aria-label="close"
          >
            <Iconify icon="material-symbols:close-rounded" width={24} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <FormProvider methods={methods}>
          <Box
            rowGap={2}
            columnGap={3}
            display="grid"
            mt={1}
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
            }}
          >
            <RHFTextField key="brandName" name="name" label="Brand Name" />
            <RHFTextField key="brandEmail" name="email" label="Brand Email" />
            <RHFTextField key="brandPhone" name="phone" label="Brand Phone" />

            <RHFAutocomplete
              key="brandIndustries"
              name="brandIndustries"
              placeholder="+ Brand Industries"
              multiple
              freeSolo="true"
              disableCloseOnSelect
              options={interestsLists.map((option) => option)}
              getOptionLabel={(option) => option}
              renderOption={(props, option) => (
                <li {...props} key={option}>
                  {option}
                </li>
              )}
              renderTags={(selected, getTagProps) =>
                selected.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    size="small"
                    color="info"
                    variant="soft"
                  />
                ))
              }
            />
          </Box>

          <Stack mt={3}>
            <Typography
              variant="h5"
              sx={{ fontFamily: (theme) => theme.typography.fontSecondaryFamily, mb: 2 }}
              letterSpacing={0.5}
            >
              Social Media
            </Typography>

            <Box
              rowGap={2}
              columnGap={3}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(3, 1fr)',
              }}
            >
              <RHFTextField
                key="brandInstagram"
                name="brandInstagram"
                label="Instagram"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="ant-design:instagram-filled" />
                    </InputAdornment>
                  ),
                }}
              />
              <RHFTextField
                key="brandTiktok"
                name="brandTiktok"
                label="Tiktok"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="ic:baseline-tiktok" />
                    </InputAdornment>
                  ),
                }}
              />
              <RHFTextField
                key="brandWebsite"
                name="brandWebsite"
                label="Website"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="fluent-mdl2:website" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} justifyContent="end" my={3}>
            <Button size="small" type="button" onClick={handleClose} sx={{ borderRadius: 0.6 }}>
              Cancel
            </Button>
            <LoadingButton
              size="small"
              type="button"
              variant="contained"
              loading={isSubmitting}
              onClick={onSubmit}
              sx={{ borderRadius: 0.6 }}
            >
              Create
            </LoadingButton>
          </Stack>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

CreateBrand.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  setBrand: PropTypes.func,
  brandName: PropTypes.string,
  client: PropTypes.string,
};
