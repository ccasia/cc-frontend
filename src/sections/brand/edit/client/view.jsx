import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';
import React, { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Stack,
  Button,
  Dialog,
  Skeleton,
  Container,
  Typography,
  DialogContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetCompanyById from 'src/hooks/use-get-company-by-id';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';

import CompanyEditForm from './edit-from';
import CreateBrand from './brands/create/create-brand';
import BrandEditLists from './brands/brands-edit-lists';

const CompanyEditView = ({ id }) => {
  // const [company, setCompany] = useState();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dialog = useBoolean();
  const { data: company, isLoading, mutate } = useGetCompanyById(id);

  // useEffect(() => {
  //   const getCompany = async () => {
  //     setLoading(true);
  //     try {
  //       const res = await axiosInstance.get(`${endpoints.company.getCompany}/${id}`);
  //       setCompany(res?.data);
  //       setLoading(false);
  //     } catch (error) {
  //       enqueueSnackbar('Client data not found.', {
  //         variant: 'error',
  //       });
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   getCompany();
  // }, [id]);

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

    const newData = {
      ...data,
      companyId: company?.id,
      companyObjectives: data.companyObjectives.filter((item) => item.value !== ''),
    };

    formData.append('data', JSON.stringify(newData));
    formData.append('companyLogo', data.companyLogo);
    try {
      setLoading(true);
      const res = await axiosInstance.patch(endpoints.company.edit, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      mutate();
      enqueueSnackbar(res?.data.message);
    } catch (error) {
      enqueueSnackbar('Error has occured', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  });

  const onClose = useCallback(() => {
    dialog.onFalse();
  }, [dialog]);

  return (
    <Container maxWidth="lg">
      <Button
        startIcon={<Iconify icon="ion:chevron-back" />}
        onClick={() => router.push(paths.dashboard.company.discover)}
      >
        Back
      </Button>
      {isLoading ? (
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
          <Typography
            // variant="h5"
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            {company?.brand?.length ? 'Agency' : 'Client'} Information
          </Typography>
          <FormProvider methods={methods} onSubmit={onSubmit}>
            <CompanyEditForm company={company} fieldsArray={fieldsArray} methods={methods} />
            <Box textAlign="end">
              <LoadingButton
                loading={loading}
                type="submit"
                variant="contained"
                sx={{
                  width: 100,
                }}
              >
                Save
              </LoadingButton>
            </Box>
          </FormProvider>
          {company?.brand?.length > 0 && (
            <Card sx={{ my: 3, p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography
                  sx={{
                    fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                    fontSize: 30,
                    fontWeight: 800,
                    mb: 2,
                  }}
                >
                  Brand Information
                </Typography>
                <Button
                  variant="outlined"
                  sx={{
                    boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                  }}
                  onClick={dialog.onTrue}
                >
                  Create new brand
                </Button>
              </Stack>

              <BrandEditLists dataFiltered={company?.brand} onClose={onClose} />
            </Card>
          )}
        </Box>
      )}

      {/* Create new brand dialog */}
      <Dialog open={dialog.value}>
        <DialogContent>
          <CreateBrand companyId={company?.id} onClose={onClose} />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default CompanyEditView;

CompanyEditView.propTypes = {
  id: PropTypes.string,
};
