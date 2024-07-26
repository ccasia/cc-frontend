import dayjs from 'dayjs';
import * as Yup from 'yup';
import { useState, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Step from '@mui/material/Step';
import Paper from '@mui/material/Paper';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import { alpha } from '@mui/material/styles';
import StepLabel from '@mui/material/StepLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Stack, Tooltip, IconButton, InputAdornment } from '@mui/material';

import useGetCompany from 'src/hooks/use-get-company';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import CreateCompany from './create-company';

const interestsLists = [
  'Art',
  'Beauty',
  'Business',
  'Fashion',
  'Fitness',
  'Food',
  'Gaming',
  'Health',
  'Lifestyle',
  'Music',
  'Sports',
  'Technology',
  'Travel',
];
const steps = ['Select or Create Company', 'Fill in Brand Information'];

dayjs.extend(localizedFormat);

function CompanyBrandBasic() {
  const [activeStep, setActiveStep] = useState(0);
  const { companies, getCompany } = useGetCompany();
  const [openCreate, setOpenCreate] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCompany();
  }, [openCreate, getCompany]);

  // If existing company is selected
  const schemaTwo = Yup.object().shape({
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
    brandIndustries: Yup.array().min(3, 'Brand Industries is required'),
    companyId: Yup.object().required('Company is required'),
    // companyId: Yup.string().required('Company is required'),
  });

  const defaultValuesOne = {
    brandName: '',
    brandEmail: '',
    brandWebsite: '',
    brandAbout: '',
    companyId: { name: '', value: '' },
    brandObjectives: [
      {
        value: '',
      },
    ],
    brandInstagram: '',
    brandTiktok: '',
    brandIndustries: [],
  };

  const methods = useForm({
    resolver: yupResolver(schemaTwo),
    defaultValues: defaultValuesOne,
  });

  const {
    handleSubmit,
    setValue,
    reset,
    control,
    register,
    formState: { errors },
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'brandObjectives',
  });

  const onSubmit = handleSubmit(async (data) => {
    const { companyId } = data;
    const updatedData = {
      ...data,
      companyId: companyId.value,
    };

    try {
      setLoading(true);
      await axiosInstance.post(endpoints.company.createBrand, updatedData);
      enqueueSnackbar('Brand created !! 😀 ', { variant: 'success' });
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
      reset();
    } catch (error) {
      enqueueSnackbar('Failed to create brand', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  });

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  function companyInfo() {
    const selectCompany = (
      <Stack gap={2}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            setOpenCreate(true);
          }}
          sx={{
            width: 200,
            p: 1,
            ml: 'auto',
          }}
        >
          Create a new company
        </Button>

        <RHFAutocomplete
          key="companyId"
          name="companyId"
          placeholder="Select a company"
          freeSolo
          options={
            companies.length > 0
              ? companies.map((item) => ({ name: item?.name, value: item?.id, logo: item?.logo }))
              : []
          }
          getOptionLabel={(option) => option?.name || ''}
          renderOption={(props, option) => (
            <li {...props}>
              <Stack direction="row" alignItems="center" gap={2}>
                <img
                  loading="lazy"
                  width="35"
                  height="35"
                  src={option?.logo || ''}
                  srcSet={option?.logo || ''}
                  alt={option?.name}
                  style={{
                    borderRadius: 50,
                  }}
                />
                <Typography>{option?.name}</Typography>
              </Stack>
            </li>
          )}
        />
      </Stack>
    );

    return (
      <Stack direction="column" gap={5}>
        {selectCompany}
      </Stack>
    );
  }

  function brandInfo() {
    return (
      <>
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
          <Typography
            variant="h4"
            sx={{
              mb: 2,
              mt: 3,
            }}
          >
            {' '}
            Brand Information
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <RHFTextField key="brandName" name="brandName" label="Brand  Name" />
          <RHFTextField key="brandEmail" name="brandEmail" label="Brand Email" />
          <RHFTextField key="brandPhone" name="brandPhone" label="Brand  Phone" />
          <RHFTextField key="brandAbout" name="brandAbout" label="Brand  About" />

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

        <Stack mt={5}>
          <Typography variant="h5">Objectives</Typography>

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
      </>
    );
  }

  function getStepContent(step) {
    switch (step) {
      case 0:
        return companyInfo();
      case 1:
        return brandInfo();
      default:
        return 'Unknown step';
    }
  }

  return (
    <Box
      sx={{
        borderRadius: '20px',
        mt: 3,
        bgcolor: 'background.paper',
      }}
    >
      <Stepper
        sx={{
          pt: 2,
          m: 2,
          my: 5,
        }}
        activeStep={activeStep}
        alternativeLabel
      >
        {steps.map((label, index) => {
          const stepProps = {};
          const labelProps = {};
          // labelProps.error = stepError.includes(index) && true;
          return (
            <Step key={label} {...stepProps}>
              <StepLabel {...labelProps}>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>

      {activeStep === steps.length ? (
        <>
          <Paper
            sx={{
              p: 3,
              my: 3,
              minHeight: 120,
              bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
            }}
          >
            <Typography sx={{ my: 1 }}>All steps completed - you&apos;re finished</Typography>
          </Paper>

          <Box sx={{ display: 'flex', m: 2 }}>
            <Button color="inherit" disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
              Back
            </Button>

            <Box sx={{ flexGrow: 1 }} />
            <Button
              onClick={() => {
                //   reset();
                setActiveStep((prevActiveStep) => prevActiveStep - 2);
              }}
            >
              Reset
            </Button>
            {/* <Button onClick={finalSubmit} color="inherit">
              Submit
            </Button> */}
          </Box>
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper
            sx={{
              p: 0.5,
              my: 0.5,
              mx: 1,
              // bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),

              width: '80%',
            }}
          >
            <Box sx={{ my: 1 }}>
              <FormProvider methods={methods} onSubmit={onSubmit}>
                {getStepContent(activeStep)}
              </FormProvider>
              <CreateCompany setOpenCreate={setOpenCreate} openCreate={openCreate} set={setValue} />
            </Box>
          </Paper>
          <Box sx={{ display: 'flex', m: 2 }}>
            <Button color="inherit" disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
              Back
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            {activeStep === steps.length - 1 ? (
              <LoadingButton loading={loading} variant="contained" onClick={onSubmit}>
                Submit
              </LoadingButton>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default CompanyBrandBasic;
