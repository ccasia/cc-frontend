import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Chip,
  Stack,
  Button,
  Tooltip,
  Divider,
  TextField,
  FormLabel,
  IconButton,
  Typography,
  InputAdornment,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { interestsLists } from 'src/contants/interestLists';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

// eslint-disable-next-line react/prop-types
const FormField = ({ label, children, ...others }) => (
  <Stack spacing={1}>
    <FormLabel required sx={{ fontWeight: 600, color: 'black' }} {...others}>
      {label}
    </FormLabel>
    {children}
  </Stack>
);

const EditBrand = ({ brand, onClose }) => {
  const schema = Yup.object().shape({
    brandName: Yup.string().required('name is required'),
    brandEmail: Yup.string().required('Email is required'),
    brandPhone: Yup.string().required('Phone is required'),
    brandWebsite: Yup.string().required('Website is required'),
    brandAbout: Yup.string().required('About Description is required'),
    brandObjectives: Yup.array().of(
      Yup.object().shape({
        value: Yup.string().required('Value is required'),
      })
    ),
    brandInstagram: Yup.string().required('Brand Instagram is required'),
    brandTiktok: Yup.string().required('Brand Tiktok is required'),
    brandIndustries: Yup.array().min(1, 'Brand Industries is required'),
    companyId: Yup.string().required('Company is required'),
  });

  const defaultValues = {
    brandId: brand?.id || '',
    brandName: brand?.name || '',
    brandEmail: brand?.email || '',
    brandWebsite: brand?.website || '',
    brandPhone: brand?.phone || '',
    brandAbout: brand?.description || '',
    companyId: brand?.companyId || '',
    brandObjectives: brand?.objectives || [
      {
        value: '',
      },
    ],
    brandInstagram: brand?.instagram || '',
    brandTiktok: brand?.tiktok || '',
    brandIndustries: brand?.industries || [],
  };

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  });

  const {
    handleSubmit,
    reset,
    control,
    register,
    formState: { errors, isSubmitting },
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'brandObjectives',
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.company.editBrand, data);
      enqueueSnackbar(res?.data?.message);
      reset();
      mutate(`${endpoints.company.getCompany}/${brand?.companyId}`);
      onClose();
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  });

  return (
    <Box sx={{ my: 3 }}>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Box
          rowGap={2}
          columnGap={3}
          display="grid"
          mt={1}
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
          }}
          sx={{
            my: 5,
          }}
        >
          <Typography
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontSize: 25,
              fontWeight: 'normal', 
            }}
          >
            Brand Details
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <FormField label="Brand Name">
            <RHFTextField key="brandName" name="brandName" placeholder="Brand Name" />
          </FormField>
          <FormField label="Brand Email">
            <RHFTextField key="brandEmail" name="brandEmail" placeholder="Brand Email" />
          </FormField>
          <FormField label="Brand Phone">
            <RHFTextField key="brandPhone" name="brandPhone" placeholder="Brand Phone" />
          </FormField>
          <FormField label="Brand About">
            <RHFTextField key="brandAbout" name="brandAbout" placeholder="Brand About" />
          </FormField>

          <Box sx={{ gridColumn: { sm: 'span 2' } }}>
            <FormField label="Brand Industries">
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
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        variant="outlined"
                        sx={{
                          border: 1,
                          borderColor: '#EBEBEB',
                          boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                          py: 2,
                        }}
                        label={option}
                        key={key}
                        {...tagProps}
                      />
                    );
                  })
                }
              />
            </FormField>
          </Box>
        </Box>

        <Divider />

        <Stack mt={5}>
          <Typography
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontSize: 25,
              fontWeight: 'normal', 
            }}
          >
            Social Media
          </Typography>

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
            <FormField label="Instagram">
              <RHFTextField
                key="brandInstagram"
                name="brandInstagram"
                placeholder="Instagram"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="ant-design:instagram-filled" />
                    </InputAdornment>
                  ),
                }}
              />
            </FormField>

            <FormField label="Tiktok">
              <RHFTextField
                key="brandTiktok"
                name="brandTiktok"
                placeholder="Tiktok"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="ic:baseline-tiktok" />
                    </InputAdornment>
                  ),
                }}
              />
            </FormField>

            <FormField label="Website">
              <RHFTextField
                key="brandWebsite"
                name="brandWebsite"
                placeholder="Website"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="fluent-mdl2:website" />
                    </InputAdornment>
                  ),
                }}
              />
            </FormField>
          </Stack>
        </Stack>

        <Divider />

        <Stack mt={5}>
          <Typography
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontSize: 25,
              fontWeight: 'normal', 
            }}
          >
            Objectives
          </Typography>

          <Stack
            direction="column"
            spacing={3}
            my={2}
            sx={{
              flexWrap: {
                xs: 'wrap',
                md: 'nowrap',
              },
            }}
          >
            {fields.map((field, index) => (
              <Stack direction="row" gap={1} alignItems="center">
                <TextField
                  fullWidth
                  key={field.id}
                  name={`brandObjectives[${index}]`}
                  label={`Objective ${index + 1}`}
                  {...register(`brandObjectives.${index}.value`)}
                  error={errors?.brandObjectives && errors?.brandObjectives[index]}
                  helperText={
                    errors?.brandObjectives &&
                    errors?.brandObjectives[index] &&
                    errors?.brandObjectives[index]?.value?.message
                  }
                />
                <Tooltip title={`Remove objective ${index + 1}`}>
                  <IconButton onClick={() => remove(index)}>
                    <Iconify icon="material-symbols:remove" />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="contained" onClick={() => append({ value: '' })}>
              Add Objective
            </Button>
          </Stack>
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton variant="contained" type="submit" loading={isSubmitting}>
            Submit
          </LoadingButton>
        </Stack>
      </FormProvider>
    </Box>
  );
};

export default EditBrand;

EditBrand.propTypes = {
  brand: PropTypes.object,
  onClose: PropTypes.func,
};
