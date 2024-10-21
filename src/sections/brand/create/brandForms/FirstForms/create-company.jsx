/* eslint-disable no-unused-vars */
import * as Yup from 'yup';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useCallback } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Step,
  Stack,
  Avatar,
  Button,
  Dialog,
  Stepper,
  TextField,
  StepLabel,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

import UploadPhoto from 'src/sections/profile/dropzone';

const COMPANY_STEPS = ['Company Information', 'Company objectives'];

// eslint-disable-next-line react/prop-types
const CreateCompany = ({ setOpenCreate, openCreate, set }) => {
  const [image, setImage] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

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

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
    register,
    reset,
  } = methods;

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
      set('companyId', { id: res.data?.company.id, name: res?.data?.company?.name });
      setOpenCreate(false);
      reset();
      enqueueSnackbar(res?.data?.message, {
        variant: 'success',
      });
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
      // console.log(error);
    } finally {
      setLoading(false);
      setOpenCreate(false);
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'companyObjectives',
  });

  const companyObjectives = (
    <Stack mt={5} gap={2}>
      {fields.map((field, index) => (
        <Stack direction="row" gap={1} alignItems="center">
          <TextField
            fullWidth
            key={field.id}
            name={`companyObjectives[${index}]`}
            label={`Objective ${index + 1}`}
            {...register(`companyObjectives.${index}.value`)}
            error={errors?.companyObjectives && errors?.companyObjectives[index]}
            helperText={
              errors?.companyObjectives &&
              errors?.companyObjectives[index] &&
              errors?.companyObjectives[index]?.value?.message
            }
          />
          <IconButton onClick={() => remove(index)}>
            <Iconify icon="material-symbols:remove" />
          </IconButton>
        </Stack>
      ))}
      <Box sx={{ flexGrow: 1 }} />
      <Button variant="contained" onClick={() => append({ value: '' })}>
        Add Objective
      </Button>
    </Stack>
  );

  return (
    <Dialog
      fullWidth
      open={openCreate}
      onClose={() => setOpenCreate(false)}
      PaperProps={{
        sx: { maxWidth: 720 },
      }}
    >
      <DialogTitle>Create a new company</DialogTitle>
      <DialogContent>
        <FormProvider methods={methods}>
          <Stepper activeStep={activeStep}>
            {COMPANY_STEPS.map((label, index) => {
              const stepProps = {};
              const labelProps = {};
              return (
                <Step key={label} {...stepProps}>
                  <StepLabel {...labelProps}>{label}</StepLabel>
                </Step>
              );
            })}
          </Stepper>

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
                <Typography variant="h6">Company Logo</Typography>
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
            </Box>
          )}

          {/* Step 2 */}
          {activeStep === 1 && <>{companyObjectives}</>}

          <Stack direction="row" gap={2} justifyContent="end" my={3}>
            <Button onClick={() => setActiveStep(activeStep - 1)} disabled={activeStep === 0}>
              Back
            </Button>
            {activeStep === COMPANY_STEPS.length - 1 ? (
              <LoadingButton loading={loading} color="primary" onClick={onSubmit}>
                Create
              </LoadingButton>
            ) : (
              <Button onClick={() => setActiveStep(activeStep + 1)}>Next</Button>
            )}
          </Stack>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCompany;
