/* eslint-disable no-unused-vars */
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Step,
  Stack,
  Avatar,
  Button,
  Dialog,
  Stepper,
  MenuItem,
  StepLabel,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetCompany from 'src/hooks/use-get-company';
import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import FormProvider, { RHFSelect, RHFTextField } from 'src/components/hook-form';

import UploadPhoto from 'src/sections/profile/dropzone';

const COMPANY_STEPS = ['Company Information', 'Person In Charge'];

const companySchema = Yup.object().shape({
  companyName: Yup.string().required('Name is required'),
  companyEmail: Yup.string()
    .required('Email is required')
    .email('Email must be a valid email address'),
  companyPhone: Yup.string().required('Phone is required'),
  companyAddress: Yup.string().required('Address is required'),
  companyWebsite: Yup.string().required('Website is required'),
  companyAbout: Yup.string().required('About Description is required'),
  companyRegistrationNumber: Yup.string().required('RegistrationNumber is required'),
  type: Yup.string().required('Type is required'),
});

const secondStepSchema = Yup.object().shape({
  personInChargeName: Yup.string().required('PIC name is required.'),
  personInChargeDesignation: Yup.string().required('PIC designation is required.'),
});

const validationSchema = [companySchema, secondStepSchema];

const defaultValuesOne = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  companyWebsite: '',
  companyAbout: '',
  companyRegistrationNumber: '',
  type: '',
  personInChargeName: '',
  personInChargeDesignation: '',
};

const defaultValuesTwo = {
  personInChargeName: '',
  personInChargeDesignation: '',
};

const defaultValues = [defaultValuesOne, defaultValuesTwo];

// eslint-disable-next-line react/prop-types
const CreateCompany = ({ setOpenCreate, openCreate, set }) => {
  const [image, setImage] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [companySteps, setCompanySteps] = useState(COMPANY_STEPS);
  const { mutate } = useGetCompany();
  const openConfirmation = useBoolean();
  const smUp = useResponsive('up', 'sm');

  const methods = useForm({
    resolver: yupResolver(validationSchema[activeStep]),
    defaultValues: defaultValuesOne,
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const {
    handleSubmit,
    setValue,
    reset,
    trigger,
    watch,
    formState: { errors },
  } = methods;

  const values = watch();

  const { type } = values;
  const hasTruthyValues = Object.values(values).some((value) => Boolean(value));

  const onDrop = useCallback(
    (e) => {
      const preview = URL.createObjectURL(e[0]);
      setImage(preview);
      setValue('image', e[0]);
    },
    [setValue]
  );

  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();

    formData.append('data', JSON.stringify(data));
    formData.append('companyLogo', data.image);

    try {
      setLoading(true);
      const res = await axiosInstance.post(endpoints.company.create, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      set(
        'companyId',
        { value: res.data?.company.id, name: res?.data?.company?.name },
        { shouldValidate: true }
      );
      setOpenCreate(false);
      setActiveStep(0);
      reset();
      mutate();
      enqueueSnackbar(res?.data?.message, {
        variant: 'success',
      });
    } catch (error) {
      console.log(error);
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  });

  const handleClose = () => {
    if (hasTruthyValues) {
      openConfirmation.onTrue();
      return;
    }

    setOpenCreate(false);
  };

  const confirmClose = () => {
    reset();
    openConfirmation.onFalse();
    setOpenCreate(false);
  };

  const onNext = async () => {
    const isFilled = await trigger(); // Validate current step
    if (isFilled) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const renderPICForm = (
    <Stack direction="row" alignItems="center" mt={3} gap={2}>
      <RHFTextField name="personInChargeName" label="PIC Name" />
      <RHFTextField name="personInChargeDesignation" label="PIC Designation" />
    </Stack>
  );

  useEffect(() => {
    if (type && type !== 'agency') {
      setCompanySteps((prev) => [...prev, 'Package Information']);
      return;
    }
    setCompanySteps(COMPANY_STEPS);
  }, [type]);

  return (
    <>
      <Dialog
        fullWidth
        open={openCreate}
        fullScreen={!smUp}
        PaperProps={{
          sx: { maxWidth: 720, borderRadius: 0.8 },
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="mdi:company" width={28} />
            <Typography
              sx={{ fontFamily: (theme) => theme.typography.fontSecondaryFamily, flexGrow: 1 }}
              fontSize={30}
            >
              Create a new company
            </Typography>
            <IconButton size="small" sx={{ borderRadius: 1 }} onClick={handleClose}>
              <Iconify icon="material-symbols:close-rounded" width={24} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <FormProvider methods={methods}>
            {type && (
              <Stepper activeStep={activeStep}>
                {companySteps.map((label, index) => {
                  const stepProps = {};
                  const labelProps = {};

                  return (
                    <Step
                      key={label}
                      {...stepProps}
                      sx={{
                        '& .MuiStepIcon-root.Mui-completed': {
                          color: 'black',
                        },
                        '& .MuiStepIcon-root.Mui-active': {
                          color: 'black',
                        },
                        '& .MuiStepIcon-root.Mui-error': {
                          color: 'red',
                        },
                      }}
                    >
                      <StepLabel {...labelProps}>{label}</StepLabel>
                    </Step>
                  );
                })}
              </Stepper>
            )}

            {/* Step 1  */}
            {activeStep === 0 && (
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
                <Box sx={{ flexGrow: 1 }} />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    gap: 2,
                    p: 1,
                    gridColumn: '1 / -1',
                  }}
                >
                  <UploadPhoto onDrop={onDrop}>
                    <Avatar
                      sx={{
                        width: 1,
                        height: 1,
                        borderRadius: '50%',
                      }}
                      src={image || null}
                    />
                  </UploadPhoto>
                  <Typography
                    variant="h4"
                    sx={{ fontFamily: (theme) => theme.typography.fontSecondaryFamily }}
                    letterSpacing={0.5}
                  >
                    Company Logo
                  </Typography>
                </Box>

                <RHFTextField key="companyName" name="companyName" label="Company Name" />
                <RHFTextField key="companyEmail" name="companyEmail" label="Company Email" />
                <RHFTextField key="companyPhone" name="companyPhone" label="Company Phone" />
                <RHFTextField
                  key="companyAddress"
                  name="companyAddress"
                  label="Company Address"
                  multiline
                />
                <RHFTextField key="companyWebsite" name="companyWebsite" label="Company Website" />
                <RHFTextField
                  key="companyAbout"
                  name="companyAbout"
                  label="Company About"
                  multiline
                />
                <RHFTextField
                  key="companyRegistrationNumber"
                  name="companyRegistrationNumber"
                  label="Company Registration Number"
                />
                <RHFSelect name="type" label="Client type">
                  <MenuItem disabled>Select an option</MenuItem>
                  <MenuItem value="agency">Agency</MenuItem>
                  <MenuItem value="directClient">Direct Client</MenuItem>
                </RHFSelect>
              </Box>
            )}

            {activeStep === 1 && renderPICForm}

            {/* For Mohand to handle the package forms */}
            {activeStep === 2 && <Typography>For Mohand</Typography>}

            <Stack direction="row" spacing={1} justifyContent="end" my={3}>
              {activeStep > 0 && (
                <Button
                  onClick={() => setActiveStep(activeStep - 1)}
                  disabled={activeStep === 0}
                  variant="outlined"
                  sx={{ borderRadius: 0.6 }}
                >
                  Back
                </Button>
              )}

              {activeStep === companySteps.length - 1 ? (
                <LoadingButton
                  loading={loading}
                  variant="contained"
                  onClick={onSubmit}
                  sx={{ borderRadius: 0.6 }}
                >
                  Create
                </LoadingButton>
              ) : (
                <Button variant="contained" sx={{ borderRadius: 0.6 }} onClick={() => onNext()}>
                  Next
                </Button>
              )}
            </Stack>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        title="Unsaved Changes"
        content="You have unsaved changes. Are you sure you want to leave?"
        open={openConfirmation.value}
        onClose={openConfirmation.onFalse}
        action={
          <Button variant="contained" onClick={confirmClose}>
            Confirm
          </Button>
        }
      />
    </>
  );
};

export default CreateCompany;
