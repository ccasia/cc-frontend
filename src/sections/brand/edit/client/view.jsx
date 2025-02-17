import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Tab,
  Card,
  Tabs,
  Stack,
  alpha,
  Button,
  Dialog,
  Container,
  Typography,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetCompanyById from 'src/hooks/use-get-company-by-id';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';

import PackageCreateDialog from 'src/sections/packages/package-dialog';

import PICList from './pic/pic-list';
import CompanyEditForm from './edit-from';
import CreateBrand from './brands/create/create-brand';
import PackageHistoryList from './pakcage-history-list';
import CampaignClientList from './campaign-client/view/campaign-list';

const findLatestPackage = (packages) => {
  if (packages?.length === 0) {
    return null; // Return null if the array is empty
  }

  const latestPackage = packages.reduce((latest, current) => {
    const latestDate = new Date(latest.createdAt);
    const currentDate = new Date(current.createdAt);

    return currentDate > latestDate ? current : latest;
  });

  return latestPackage;
};

const defaultValues = {
  companyLogo: {},
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  companyWebsite: '',
  companyAbout: '',
  type: '',
  companyId: '',
  companyRegistrationNumber: '',
};

const companySchema = Yup.object().shape({
  companyName: Yup.string().required('Name is required'),
  // companyEmail: Yup.string()
  //   .required('Email is required')
  //   .email('Email must be a valid email address'),
  companyPhone: Yup.string().required('Phone is required'),
  // companyAddress: Yup.string().required('Address is required'),
  // companyWebsite: Yup.string().required('Website is required'),
  // companyAbout: Yup.string().required('About Description is required'),
  // companyRegistrationNumber: Yup.string().required('RegistrationNumber is required'),
  type: Yup.string().required('Client type is required'),
});

const CompanyEditView = ({ id }) => {
  const { data: company, isLoading, mutate } = useGetCompanyById(id);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dialog = useBoolean();
  const packageDialog = useBoolean();
  const [activeTab, setActiveTab] = useState('package');

  const campaigns = useMemo(() => {
    if (company?.type === 'agency' || company?.brand?.length) {
      return company?.brand?.flatMap((item) => item?.campaign);
    }
    return company?.campaign;
  }, [company]);

  const currentPackage = useMemo(
    () => (company?.subscriptions?.length ? findLatestPackage(company?.subscriptions) : null),
    [company]
  );

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
      companyId: company?.clientId,
      companyLogo: company?.logo,
      companyName: company?.name,
      companyEmail: company?.email,
      companyPhone: company?.phone,
      companyAddress: company?.address,
      companyWebsite: company?.website,
      companyAbout: company?.about,
      companyObjectives: company?.objectives,
      companyRegistrationNumber: company?.registration_number,
      type: company?.type,
    });
  }, [company, reset]);

  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();

    const newData = {
      ...data,
      companyId: company?.id,
      // companyObjectives: data.companyObjectives.filter((item) => item.value !== ''),
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

  if (isLoading) {
    return (
      <Box
        sx={{
          position: 'relative',
          top: 200,
          textAlign: 'center',
        }}
      >
        <CircularProgress
          thickness={7}
          size={25}
          sx={{
            color: (theme) => theme.palette.common.black,
            strokeLinecap: 'round',
          }}
        />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Button
        startIcon={<Iconify icon="ion:chevron-back" />}
        onClick={() => router.push(paths.dashboard.company.discover)}
        variant="outlined"
      >
        Back
      </Button>

      <Box
        sx={{
          bgcolor: (theme) => theme.palette.background.paper,
          p: 3,
          borderRadius: 2,
          mt: 3,
        }}
      >
        <Box
          mb={3}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontSize: 40,
              fontWeight: 'normal',
            }}
          >
            {company?.brand?.length ? 'Agency' : 'Client'} Information
          </Typography>

          {currentPackage && (
            <Label color="success">
              Remaining Credits: {currentPackage.totalCredits - currentPackage.creditsUsed || 0}
            </Label>
          )}
        </Box>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <CompanyEditForm company={company} fieldsArray={fieldsArray} methods={methods} />

          <Box textAlign="end" mt={2}>
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
        {/* {company?.brand?.length > 0 && (
          <Card sx={{ my: 3, p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography
                sx={{
                  fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                  fontSize: 30,
                  fontWeight: 'normal',
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
        )} */}

        <Card sx={{ borderRadius: 1, mt: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{
              px: 2.5,
              boxShadow: (theme) => `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
            }}
          >
            <Tab value="package" label="Package" />
            <Tab value="campaign" label="Campaign" />
            <Tab value="pic" label="Person In Charge" />
          </Tabs>

          <Box p={2}>
            {activeTab === 'package' && (
              <>
                {!currentPackage ? (
                  <Stack spacing={2} alignItems="center">
                    <Typography variant="subtitle1" color="text.secondary">
                      No package is connected
                    </Typography>
                    <Button
                      variant="outlined"
                      sx={{ boxShadow: '0px -3px 0px 0px #E7E7E7 inset' }}
                      startIcon={<Iconify icon="bx:package" width={22} />}
                      onClick={packageDialog.onTrue}
                    >
                      Connect package
                    </Button>
                  </Stack>
                ) : (
                  <>
                    <Stack direction="row" alignItems="center" justifyContent="end" mb={2}>
                      {/* <Typography
                      sx={{
                        fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                        fontSize: 30,
                        fontWeight: 'normal',
                        mb: 2,
                      }}
                    >
                      Package History
                    </Typography> */}

                      {/* <Button
                      variant="outlined"
                      sx={{
                        boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                      }}
                      // onClick={dialog.onTrue}
                      disabled={!(currentPackage?.status === 'inactive' && currentPackage)}
                    >
                      Renew Package
                    </Button> */}
                    </Stack>

                    <PackageHistoryList dataFiltered={company?.subscriptions} />
                  </>
                )}
              </>
            )}

            {activeTab === 'campaign' && <CampaignClientList campaigns={campaigns} />}

            {activeTab === 'pic' && <PICList personIncharge={company?.pic} />}
          </Box>
        </Card>
      </Box>

      {/* Create new brand dialog */}
      <Dialog open={dialog.value}>
        <DialogContent>
          <CreateBrand companyId={company?.id} onClose={onClose} />
        </DialogContent>
      </Dialog>

      {/* <PackageCreate open={packageDialog.value} onClose={packageDialog.onFalse} /> */}

      {/* <PackageCreateDialog packageDialog={packageDialog} companyId={id} /> */}
      <PackageCreateDialog
        open={packageDialog.value}
        onClose={packageDialog.onFalse}
        clientId={id}
      />
    </Container>
  );
};

export default CompanyEditView;

CompanyEditView.propTypes = {
  id: PropTypes.string,
};
