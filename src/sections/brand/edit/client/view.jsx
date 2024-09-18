import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
import { Box, Button, Skeleton, Container, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';

import CompanyEditForm from './edit-from';

const CompanyEditView = ({ id }) => {
  const [company, setCompany] = useState();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getCompany = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`${endpoints.company.getCompany}/${id}`);
        setCompany(res?.data);
        setLoading(false);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    getCompany();
  }, [id]);

  const companySchema = Yup.object().shape({
    companyName: Yup.string().required('Name is required'),
    companyEmail: Yup.string()
      .required('Email is required')
      .email('Email must be a valid email address'),
    companyPhone: Yup.string().required('Phone is required'),
    companyAddress: Yup.string().required('Address is required'),
    companyWebsite: Yup.string().required('Website is required'),
    companyAbout: Yup.string().required('About Description is required'),
    companyObjectives: Yup.array().of(
      Yup.object().shape({
        value: Yup.string().required('Value is required'),
      })
    ),
    companyRegistrationNumber: Yup.string().required('RegistrationNumber is required'),
  });

  const defaultValues = {
    companyLogo: {},
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    companyWebsite: '',
    companyAbout: '',
    companyObjectives: [
      {
        value: '',
      },
    ],
    companyRegistrationNumber: '',
  };

  const methods = useForm({
    resolver: yupResolver(companySchema),
    defaultValues,
  });

  const { handleSubmit, reset, control } = methods;

  const fieldsArray = useFieldArray({
    control,
    name: 'companyObjectives',
  });

  useEffect(() => {
    reset({
      companyLogo: company?.logo,
      companyName: company?.name,
      companyEmail: company?.email,
      companyPhone: company?.phone,
      companyAddress: company?.address,
      companyWebsite: company?.website,
      companyAbout: company?.about,
      companyObjectives: company?.objectives,
      companyRegistrationNumber: company?.registration_number,
    });
  }, [company, reset]);

  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();
    const newData = { ...data, companyId: company?.id };
    formData.append('data', JSON.stringify(newData));
    formData.append('companyLogo', data.companyLogo);
    try {
      setLoading(true);
      const res = await axiosInstance.patch(endpoints.company.edit, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      enqueueSnackbar(res?.data.message);
    } catch (error) {
      enqueueSnackbar('Error has occured', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  });

  return (
    <Container maxWidth="lg">
      <Button
        startIcon={<Iconify icon="ion:chevron-back" />}
        onClick={() => router.push(paths.dashboard.company.discover)}
        // href={paths.dashboard.company.discover}
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
          <Typography variant="h5">Company Information</Typography>
          <FormProvider methods={methods} onSubmit={onSubmit}>
            <CompanyEditForm company={company} fieldsArray={fieldsArray} methods={methods} />
            <Box textAlign="end">
              <LoadingButton
                loading={loading}
                type="submit"
                variant="outlined"
                color="primary"
                sx={{
                  width: 100,
                }}
              >
                Save
              </LoadingButton>
            </Box>
          </FormProvider>
        </Box>
      )}
    </Container>
  );
};

export default CompanyEditView;

CompanyEditView.propTypes = {
  id: PropTypes.string,
};
