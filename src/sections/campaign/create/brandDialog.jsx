import * as Yup from 'yup';
import { mutate } from 'swr';
import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { formatIncompletePhoneNumber } from 'libphonenumber-js';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { Stack, Typography, InputAdornment } from '@mui/material';

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
    control,
  } = methods;

  const handlePhoneChange = (event, onChange) => {
    const formattedNumber = formatIncompletePhoneNumber(event.target.value, 'MY');
    onChange(formattedNumber);
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.post(endpoints.company.createOneBrand, data);
      reset();
      onClose();
      mutate(endpoints.company.getOptions);
      setBrand(res?.data?.brand);
      enqueueSnackbar(res?.data?.message, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.message, {
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { maxWidth: 720 },
      }}
      fullWidth
    >
      <DialogTitle>
        <Typography
          variant="h4"
          sx={{
            mb: 2,
            mt: 3,
          }}
        >
          Create Brand for {client?.name}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          {/* <Box
            rowGap={2}
            columnGap={3}
            display="grid"
            mt={4}
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
            }}
          >
            <RHFTextField name="name" label="Name" fullWidth />
            <RHFTextField name="email" label="Email" fullWidth />
            <Controller
              name="phone"
              control={control}
              defaultValue=""
              rules={{ required: 'Phone number is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  placeholder="Phone Number"
                  variant="outlined"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error ? fieldState.error.message : ''}
                  onChange={(event) => handlePhoneChange(event, field.onChange)}
                />
              )}
            />
            <RHFTextField
              key="brandInstagram"
              name="brandInstagram"
              label="Instagram"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="mdi:instagram" width={20} />
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
                    <Iconify icon="ic:baseline-tiktok" width={20} />
                  </InputAdornment>
                ),
              }}
            />
            <RHFTextField
              key="brandFacebook"
              name="brandFacebook"
              label="Facebook"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="mage:facebook" width={20} />
                  </InputAdornment>
                ),
              }}
            />

            <RHFAutocomplete
              key="brandIndustries"
              name="brandIndustries"
              placeholder="+ Brand Industries"
              multiple
              freeSolo
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
          </Box> */}

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
            {/* <Box sx={{ flexGrow: 1 }} /> */}
            <RHFTextField key="brandName" name="name" label="Brand  Name" />
            <RHFTextField key="brandEmail" name="email" label="Brand Email" />
            <RHFTextField key="brandPhone" name="phone" label="Brand  Phone" />

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

          <Stack mt={5}>
            <Typography variant="h5">Social Media</Typography>

            <Stack
              direction="row"
              spacing={3}
              my={2}
              sx={{
                flexWrap: {
                  xs: 'wrap',
                  md: 'nowrap',
                },
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
            </Stack>
          </Stack>

          <DialogActions>
            <Button size="small" onClick={onClose}>
              Cancel
            </Button>
            <LoadingButton size="small" type="submit" variant="contained" loading={isSubmitting}>
              Create
            </LoadingButton>
          </DialogActions>
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
