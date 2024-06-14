import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';

import { Box, Button, Skeleton, Container, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';

import { intersList } from 'src/sections/creator/form/creatorForm';

import BrandEditForm from './edit-from';

const BrandEditView = ({ id }) => {
  const [brand, setBrand] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getCompany = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`${endpoints.company.brandDetail(id)}`);
        setBrand(res?.data);
        setLoading(false);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    getCompany();
  }, [id]);

  const brandSchema = Yup.object().shape({
    brandName: Yup.string().required('Name is required'),
    brandEmail: Yup.string()
      .required('Email is required')
      .email('Email must be a valid email address'),
    brandPhone: Yup.string().required('Phone is required'),
    brandInstagram: Yup.string().required('Instagram is required'),
    brandTiktok: Yup.string(),
    brandWebsite: Yup.string().required('Website is required'),
    brandAbout: Yup.string().required('About Description is required'),
    brandIndustries: Yup.array().min(3, 'Please choose at least 3 industries'),
    brandObjectives: Yup.array().of(
      Yup.object().shape({
        value: Yup.string().required('Value is required'),
      })
    ),
  });

  const defaultValues = {
    brandName: '',
    brandEmail: '',
    brandPhone: '',
    brandInstagram: '',
    brandTiktok: '',
    brandWebsite: '',
    brandAbout: '',
    brandIndustries: [],
    brandObjectives: [
      {
        value: '',
      },
    ],
  };

  const methods = useForm({
    resolver: yupResolver(brandSchema),
    defaultValues,
  });

  const { handleSubmit, reset, control } = methods;

  const fieldsArray = useFieldArray({
    control,
    name: 'brandObjectives',
  });

  useEffect(() => {
    reset({
      brandName: brand?.name,
      brandEmail: brand?.email,
      brandPhone: brand?.phone,
      brandInstagram: brand?.instagram,
      brandTiktok: brand?.tiktok,
      brandWebsite: brand?.website,
      brandAbout: brand?.description,
      brandIndustries: intersList.filter((elem) => brand?.industries.includes(elem)),
      brandObjectives: brand?.objectives,
    });
  }, [brand, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.company.editBrand, {
        ...data,
        brandId: brand?.id,
      });
      enqueueSnackbar(res?.data.message);
    } catch (error) {
      enqueueSnackbar('Error has occured', {
        variant: 'error',
      });
    }
  });

  return (
    <Container maxWidth="lg">
      <Button
        startIcon={<Iconify icon="ion:chevron-back" />}
        href={paths.dashboard.company.discover}
      >
        Back
      </Button>
      {loading ? (
        <Skeleton
          sx={{
            height: 200,
          }}
        />
      ) : (
        <Box
          sx={{
            bgcolor: (theme) => theme.palette.background.paper,
            p: 3,
            borderRadius: 2,
            mt: 3,
          }}
        >
          <Typography variant="h5" mb={4}>
            Brand Information
          </Typography>
          <FormProvider methods={methods} onSubmit={onSubmit}>
            <BrandEditForm fieldsArray={fieldsArray} methods={methods} />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{
                width: 50,
                mx: 'auto',
              }}
            >
              Save
            </Button>
          </FormProvider>
        </Box>
      )}
    </Container>
  );
};

export default BrandEditView;

BrandEditView.propTypes = {
  id: PropTypes.string,
};
