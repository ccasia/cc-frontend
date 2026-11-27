/* eslint-disable no-unused-vars */
import useSWR from 'swr';
import dayjs from 'dayjs';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { NumericFormat } from 'react-number-format';
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
  FormLabel,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetCompany from 'src/hooks/use-get-company';
import useGetPackages from 'src/hooks/use-get-packges';
import { useResponsive } from 'src/hooks/use-responsive';

import getCroppedImg from 'src/utils/cropImage';
import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import ImageCropDialog from 'src/components/upload/image-crop-dialog';
import FormProvider, { RHFSelect, RHFTextField, RHFDatePicker } from 'src/components/hook-form';
import { PRIMARY_ACTION_SX, SECONDARY_ACTION_SX } from 'src/components/campaign/action-button-styles';

import UploadPhoto from 'src/sections/profile/dropzone';

import DiscardCompanyDialog from './discard-company-dialog';
import {
  PackageStep,
  closeButtonSx,
  useSteadyHeight,
  CompanyDialogSteps,
  CompanyDetailsStep,
  PersonInChargeStep,
  companyDialogPaperSx,
} from './company-dialog-steps';

const COMPANY_STEPS = ['Company Information', 'Person In Charge', 'Package Information'];

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
  type: Yup.string().required('Type is required'),
});

const secondStepSchema = Yup.object().shape({
  personInChargeName: Yup.string().required('PIC name is required.'),
  personInChargeDesignation: Yup.string().required('PIC designation is required.'),
  personInChargeEmail: Yup.string()
    .required('PIC email is required')
    .email('Email must be a valid email address'),
});

const thirdStepSchema = Yup.object().shape({
  currency: Yup.string().required('Currency is required'),
  packageType: Yup.string().required('Package type is required '),
  packageValue: Yup.string().required('Package price is required'),
  totalUGCCredits: Yup.string().required('Total credits is required'),
  validityPeriod: Yup.string().required('Validity period is required'),
  invoiceDate: Yup.date()
    .required('Invoice date is required')
    .typeError('PackageInvoice must be a valid date'),
});

const validationSchema = [companySchema, secondStepSchema, thirdStepSchema];

const defaultValuesOne = {
  companyID: '',
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
  personInChargeEmail: '',
  packageId: '',
  subsID: '',
  packageType: '',
  packageValue: '',
  totalUGCCredits: '',
  validityPeriod: '',
  currency: '',
  invoiceDate: null,
};

const defaultValuesTwo = {
  personInChargeName: '',
  personInChargeDesignation: '',
};

const defaultValues = [defaultValuesOne, defaultValuesTwo];

// eslint-disable-next-line react/prop-types
const FormField = ({ label, children, ...others }) => (
  <Stack spacing={0.5} alignItems="start" width={1}>
    <FormLabel required sx={{ fontWeight: 500, color: '#636366', fontSize: '12px' }} {...others}>
      {label}
    </FormLabel>
    {children}
  </Stack>
);

// How the cropped logo reads at a large and a small size
const renderLogoPreview = (preview) => (
  <Stack spacing={1.5} alignItems="center">
    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#636366' }}>Preview</Typography>
    <Box
      sx={{
        width: 160,
        borderRadius: '16px',
        overflow: 'hidden',
        bgcolor: '#FFFFFF',
        border: '1px solid #E7E7E7',
      }}
    >
      {preview}
    </Box>
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box
        sx={{
          width: 32,
          borderRadius: '50%',
          overflow: 'hidden',
          bgcolor: '#FFFFFF',
          border: '1px solid #E7E7E7',
        }}
      >
        {preview}
      </Box>
      <Typography sx={{ fontSize: 13, color: '#8E8E93' }}>In lists</Typography>
    </Stack>
  </Stack>
);

const CreateCompany = ({
  setOpenCreate,
  openCreate,
  set,
  isDialog = true,
  isForCampaign = false,
  companyName = '',
}) => {
  const { data: packages, isLoading } = useGetPackages();
  const [image, setImage] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [companySteps, setCompanySteps] = useState(COMPANY_STEPS);
  const { data, mutate, isLoading: companyLoading } = useGetCompany();
  const openConfirmation = useBoolean();
  const smUp = useResponsive('up', 'sm');
  const { data: subscriptions } = useSWR('/api/subscription/', fetcher);

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

  const packageType = watch('packageType');
  const currency = watch('currency');
  const invoiceDate = watch('invoiceDate');
  const validitiyPeriod = watch('validityPeriod');
  const packageValue = watch('packageValue');

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

  // The dialog crops every logo first. `logoSource` keeps the uncropped original, so
  // Edit can crop again from it; `cropSource` is the image open in the crop dialog.
  const [logoSource, setLogoSource] = useState(null);
  const [cropSource, setCropSource] = useState(null);
  const [applyingCrop, setApplyingCrop] = useState(false);

  const pickLogo = (file) => setCropSource(URL.createObjectURL(file));
  const editLogo = () => setCropSource(logoSource);

  const closeCrop = () => {
    if (cropSource && cropSource !== logoSource) URL.revokeObjectURL(cropSource);
    setCropSource(null);
  };

  const applyCrop = async (pixels) => {
    setApplyingCrop(true);
    try {
      const file = await getCroppedImg(cropSource, pixels, 'company-logo.jpg');
      if (logoSource && logoSource !== cropSource) URL.revokeObjectURL(logoSource);
      setLogoSource(cropSource);
      setImage(file.preview);
      setValue('image', file, { shouldDirty: true });
      setCropSource(null);
    } finally {
      setApplyingCrop(false);
    }
  };

  const clearLogo = () => {
    if (logoSource) URL.revokeObjectURL(logoSource);
    setLogoSource(null);
    setImage(null);
    setValue('image', undefined);
  };

  const [stepBodyRef, stepBodyMinHeight] = useSteadyHeight(!!openCreate);

  // eslint-disable-next-line
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

      if (isDialog) {
        if (isForCampaign) {
          // Refresh company list first to get the latest data
          const updatedCompanyList = await mutate();
          
          // Find the newly created company in the refreshed list
          const newCompany = updatedCompanyList?.find((c) => c.id === res.data?.company.id);
          
          // Set the full company object (with creditSummary, type, brand, etc.)
          set('client', newCompany || res.data?.company, { shouldValidate: true });
          setOpenCreate();
        } else {
          set(
            'companyId',
            { value: res.data?.company.id, name: res?.data?.company?.name },
            { shouldValidate: true }
          );
          setOpenCreate();
        }
      }

      setActiveStep(0);
      reset();
      clearLogo();
      mutate();
      enqueueSnackbar('Company created successfully', {
        variant: 'success',
      });
    } catch (error) {
      console.log(error);
      console.error("API call failed:", error)
      
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
  
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  });

  const handleClose = () => {
    if (hasTruthyValues) {
      openConfirmation.onTrue();
      return;
    }
    
    // Clear invalid autocomplete value if user typed but didn't create
    if (isForCampaign && set) {
      set('client', null, { shouldValidate: false });
    }
    
    reset();
    
    clearLogo();
    setActiveStep(0);
    setOpenCreate();
  };

  const confirmClose = () => {
    // Clear invalid autocomplete value if user typed but didn't create
    if (isForCampaign && set) {
      set('client', null, { shouldValidate: false });
    }
    
    reset();
    
    clearLogo();
    openConfirmation.onFalse();
    setActiveStep(0);
    setOpenCreate();
  };

  const renderPICForm = (
    <Stack direction="row" alignItems="center" mt={3} gap={2} flexWrap="wrap">
      <RHFTextField name="personInChargeName" label="PIC Name" />
      <RHFTextField name="personInChargeDesignation" label="PIC Designation" />
      <RHFTextField name="personInChargeEmail" label="PIC Email" />
    </Stack>
  );

  const companyPackage = (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(1,1fr)', sm: 'repeat(2, 1fr)' },
        gap: 2,
        mt: 2,
      }}
    >
      <FormField required={false} label="Package Type">
        <RHFSelect name="packageType">
          {packages
            ?.filter((item) => item.name.toLowerCase() !== 'custom')
            .map((item) => (
              <MenuItem
                key={item.id}
                value={item.id}
                disabled={item.name === 'Basic'}
                sx={{
                  ...(item.name === 'Basic' && {
                    color: 'text.disabled',
                    fontStyle: 'italic',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }),
                }}
              >
                {item.name}
                {item.name === 'Basic' && <span style={{ fontSize: '0.75rem' }}>(2025)</span>}
              </MenuItem>
            ))}
          <MenuItem key="custom" value="Custom">
            Custom
          </MenuItem>
        </RHFSelect>
      </FormField>

      <FormField required={false} label="Currency">
        <RHFSelect name="currency">
          <MenuItem disabled sx={{ fontStyle: 'italic' }}>
            Select currency
          </MenuItem>
          {['MYR', 'SGD'].map((e) => (
            <MenuItem key={e} value={e}>
              {e}
            </MenuItem>
          ))}
        </RHFSelect>
      </FormField>

      {packageType && currency && (
        <>
          <FormField required={false} label="Package ID">
            <RHFTextField
              name="subsID"
              disabled={packageType !== 'Custom'}
              placeholder="Package ID"
            />
          </FormField>
          <FormField required={false} label="Package Value">
            <NumericFormat
              value={packageValue}
              disabled={packageType !== 'Custom'}
              customInput={TextField}
              thousandSeparator
              prefix={currency === 'MYR' ? 'RM ' : '$ '}
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              onValueChange={(items) => setValue('packageValue', items.value)}
              placeholder={currency === 'MYR' ? 'Price in MYR' : 'Price in SGD'}
              variant="outlined"
              fullWidth
              error={errors.packageValue}
              helperText={errors.packageValue && errors.packageValue.message}
            />
          </FormField>
          <FormField required={false} label="Total UGC Credits">
            <RHFTextField
              name="totalUGCCredits"
              disabled={packageType !== 'Custom'}
              placeholder="Total UGC Credits"
              type={packageType === 'Custom' ? 'number' : ''}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e') {
                  e.preventDefault();
                }
              }}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </FormField>

          <FormField required={false} label="Validity Period">
            <RHFTextField
              name="validityPeriod"
              disabled={packageType !== 'Custom'}
              placeholder="Validity Period"
              type={packageType === 'Custom' ? 'number' : ''}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e') {
                  e.preventDefault();
                }
              }}
              InputProps={{ inputProps: { min: 1 } }}
              helperText={
                invoiceDate
                  ? `Valid until ${dayjs(invoiceDate).add(validitiyPeriod, 'month').format('LL')}`
                  : ''
              }
            />
          </FormField>

          <FormField label="Invoice Date">
            <RHFDatePicker name="invoiceDate" />
          </FormField>
        </>
      )}
    </Box>
  );

  const onNext = async () => {
    const isFilled = await trigger();
    // Validate current step
    if (isFilled) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const getUniqueId = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/api/company/getUniqueCompanyId?type=${type}`);
      setValue('companyID', res.data, {
        shouldValidate: true,
        shouldTouch: true,
      });
      return res.data;
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
      return error;
    }
  }, [type, setValue]);

  useEffect(() => {
    if (packageType && currency) {
      if (packageType !== 'Custom') {
        const item = packages.find((c) => c.id === packageType);

        const amount = item.prices.find((c) => c.currency === currency)?.amount;
        setValue('packageId', item.id);
        setValue('validityPeriod', item.validityPeriod);
        setValue('packageValue', parseFloat(amount));
        setValue('totalUGCCredits', item.credits);
      } else {
        setValue('packageId', '');
        setValue('validityPeriod', '');
        setValue('packageValue', '');
        setValue('totalUGCCredits', '');
      }
      setValue('subsID', `P000${subscriptions.length + 1}`);
    }
  }, [setValue, packageType, currency, packages, subscriptions]);

  useEffect(() => {
    if (type) {
      getUniqueId();
    }
  }, [setValue, type, getUniqueId]);

  // Pre-populate company name when provided
  useEffect(() => {
    if (companyName && setValue) {
      setValue('companyName', companyName);
    }
  }, [companyName, setValue]);

  useEffect(() => {
    if (packageType && currency) {
      getUniqueId();
    }
  }, [setValue, packageType, currency, getUniqueId]);

  if (!isDialog && (companyLoading || isLoading)) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
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
    <>
      {isDialog ? (
        <Dialog
          open={!!openCreate}
          fullScreen={!smUp}
          onClose={handleClose}
          aria-labelledby="create-company-title"
          PaperProps={{
            sx: smUp
              ? companyDialogPaperSx
              : { ...companyDialogPaperSx, width: 1, m: 0, borderRadius: 0 },
          }}
        >
          <IconButton aria-label="Close" onClick={handleClose} sx={closeButtonSx}>
            <Iconify icon="mingcute:close-line" width={24} />
          </IconButton>

          <FormProvider methods={methods}>
            <Stack spacing={3}>
              <Stack spacing={0.75} sx={{ pr: 5 }}>
                <Typography
                  id="create-company-title"
                  sx={{
                    fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                    fontSize: 32,
                    lineHeight: '36px',
                    color: '#231F20',
                  }}
                >
                  Create a new company
                </Typography>
                {/* The ID comes from the client type, so it shows once one is picked */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ minHeight: 24 }}>
                  <Typography variant="caption" color="#8E8E93">
                    Company ID
                  </Typography>
                  {values.companyID ? (
                    <Label color="info">{values.companyID}</Label>
                  ) : (
                    <Typography variant="caption" color="#C7C7CC">
                      Set by the client type
                    </Typography>
                  )}
                </Stack>
              </Stack>

              <CompanyDialogSteps activeStep={activeStep} onStepClick={setActiveStep} />

              {/* Keeps the tallest step's height, so Next and Back never move */}
              <Box sx={{ minHeight: stepBodyMinHeight }}>
                <Box ref={stepBodyRef} key={activeStep}>
                  {activeStep === 0 && (
                    <CompanyDetailsStep
                      image={image}
                      onPickLogo={pickLogo}
                      onEditLogo={editLogo}
                      onRemoveLogo={clearLogo}
                    />
                  )}
                  {activeStep === 1 && <PersonInChargeStep />}
                  {activeStep === 2 && <PackageStep packages={packages} />}
                </Box>
              </Box>

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                {activeStep > 0 && (
                  <Button
                    type="button"
                    onClick={() => setActiveStep(activeStep - 1)}
                    sx={SECONDARY_ACTION_SX}
                  >
                    Back
                  </Button>
                )}
                {activeStep === companySteps.length - 1 ? (
                  <LoadingButton
                    type="button"
                    loading={loading}
                    onClick={onSubmit}
                    sx={PRIMARY_ACTION_SX}
                  >
                    Create company
                  </LoadingButton>
                ) : (
                  <Button type="button" onClick={onNext} sx={PRIMARY_ACTION_SX}>
                    Next
                  </Button>
                )}
              </Stack>
            </Stack>
          </FormProvider>

          <ImageCropDialog
            image={cropSource}
            aspect={1}
            title="Crop company logo"
            minOutputWidth={200}
            lowResNote="This logo may look blurry. Zoom out or use a larger image."
            applying={applyingCrop}
            onCancel={closeCrop}
            onApply={applyCrop}
            renderPreview={renderLogoPreview}
          />
        </Dialog>
      ) : (
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
              <RHFTextField key="companyID" name="companyID" label="Company ID" disabled />
              <RHFTextField key="companyName" name="companyName" label="Company Name" />
              {/* <RHFTextField key="companyEmail" name="companyEmail" label="Company Email" /> */}
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
          {activeStep === 2 && companyPackage}

          <Stack direction="row" spacing={1} justifyContent="end" my={3}>
            {activeStep > 0 && (
              <Button
                type="button"
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
                type="button"
                loading={loading}
                variant="contained"
                onClick={onSubmit}
                sx={{ borderRadius: 0.6 }}
              >
                Create
              </LoadingButton>
            ) : (
              <Button
                type="button"
                variant="contained"
                sx={{ borderRadius: 0.6 }}
                onClick={onNext}
                // onClick={() => setActiveStep(activeStep + 1)}
              >
                Next
              </Button>
            )}
          </Stack>
        </FormProvider>
      )}

      <DiscardCompanyDialog
        open={openConfirmation.value}
        onKeepEditing={openConfirmation.onFalse}
        onDiscard={confirmClose}
      />
    </>
  );
};

export default CreateCompany;

CreateCompany.propTypes = {
  setOpenCreate: PropTypes.func,
  openCreate: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  set: PropTypes.func,
  isDialog: PropTypes.bool,
  isForCampaign: PropTypes.bool,
  companyName: PropTypes.string,
};
