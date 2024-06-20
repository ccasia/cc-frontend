/* eslint-disable no-unused-vars */
import dayjs from 'dayjs';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { useState, useCallback } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Step from '@mui/material/Step';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import StepLabel from '@mui/material/StepLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useCompany } from 'src/hooks/zustands/useCompany';

import axiosInstance, { endpoints } from 'src/utils/axios';

import FormProvider, { RHFSelect, RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import UploadPhoto from 'src/sections/profile/dropzone';

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

const steps = [
  'choose company',
  'Fill in Brand Basic Information',
  'Fill in Brand Information',
  'Add company Objectives',
];

dayjs.extend(localizedFormat);

function BrandWithCompany() {
  const [activeStep, setActiveStep] = useState(0);
  const [objectives, setObjectives] = useState(['', '']);
  const [image, setImage] = useState(null);
  const { company } = useCompany();

  const handleAddObjective = () => {
    setObjectives([...objectives, '']);
  };

  const handleObjectiveChange = (index, event) => {
    const newObjectives = [...objectives];
    newObjectives[index] = event.target.value;
    setObjectives(newObjectives);
    setValue('brandObjectives', newObjectives);
  };

  const companyBrandSchema = Yup.object().shape({
    brandName: Yup.string().required('name is required'),
    brandEmail: Yup.string().required('Email is required'),
    brandPhone: Yup.string().required('Phone is required'),
    brandWebsite: Yup.string().required('Website is required'),
    brandAbout: Yup.string().required('About Description is required'),
    brandObjectives: Yup.array().min(2, 'Objectives is required'),
    brandRegistrationNumber: Yup.string().required('RegistrationNumber is required'),
    brandService_name: Yup.string().required('Brand Service Name is required'),
    brandInstagram: Yup.string().required('Brand Instagram is required'),
    brandTiktok: Yup.string().required('Brand Tiktok is required'),
    brandFacebook: Yup.string().required('Brand Facebook is required'),
    brandIntersts: Yup.array().min(3, 'Brand Interests is required'),
    brandIndustries: Yup.array().min(3, 'Brand Industries is required'),
    companyId: Yup.string().required('Company is required'),
  });

  const defaultValues = {
    brandName: '',
    brandEmail: '',
    brandPhone: '',
    brandWebsite: '',
    brandAbout: '',
    brandObjectives: [],
    brandRegistrationNumber: '',
    brandService_name: '',
    brandInstagram: '',
    brandTiktok: '',
    brandFacebook: '',
    brandIntersts: [],
    brandIndustries: [],
    companyId: '',
  };

  const methods = useForm({
    resolver: yupResolver(companyBrandSchema),
    defaultValues,
  });
  const {
    reset,
    handleSubmit,
    setValue,
    formState: { errors },
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
    setValue('brandObjectives', objectives);
    try {
      const res = await axiosInstance.post(endpoints.company.createBrand, data);
      enqueueSnackbar('Brand created !! 😀 ', { variant: 'success' });
      setObjectives(['', '']);
      setActiveStep((prevActiveStep) => prevActiveStep - 3);
      reset();
    } catch (error) {
      console.log(error);
    }
  });
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  const finalSubmit = async () => {
    console.log('first');
  };

  function companyInfo() {
    return (
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
          }}
        >
          {' '}
          Company Information
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: 2,
            p: 1,
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
          <Typography variant="h6">Brand Logo</Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <RHFTextField key="brandName" name="brandName" label="Brand  Name" />
        <RHFTextField key="brandEmail" name="brandEmail" label="Brand Email" />
        <RHFTextField key="brandPhone" name="brandPhone" label="Brand  Phone" />
        <RHFTextField key="brandWebsite" name="brandWebsite" label="Brand  Website" />
        <RHFTextField key="brandAbout" name="brandAbout" label="Brand  About" />
        <RHFTextField
          key="brandRegistrationNumber"
          name="brandRegistrationNumber"
          label="Brand  Registration Number"
        />
      </Box>
    );
  }

  function brandInfo() {
    return (
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
        <RHFTextField key="brandService_name" name="brandService_name" label="Brand Service Name" />
        <RHFTextField key="brandInstagram" name="brandInstagram" label="Brand Instagram" />
        <RHFTextField key="brandTiktok" name="brandTiktok" label="Brand Tiktok" />
        <RHFTextField key="brandFacebook" name="brandFacebook" label="Brand Facebook" />
        <RHFAutocomplete
          key="brandIntersts"
          name="brandIntersts"
          placeholder="+ Brand Interests"
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
    );
  }

  function companyObjectives() {
    return (
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
        <Typography variant="h4" sx={{}}>
          {' '}
          Company Objectives
        </Typography>
        <Box sx={{ flexGrow: 1 }} />

        {objectives.map((objective, index) => (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <TextField
              key={index}
              name={`companyObjectives[${index}]`}
              label={`Objective ${index + 1}`}
              value={objective}
              onChange={(event) => handleObjectiveChange(index, event)}
            />
          </>
        ))}
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" onClick={handleAddObjective}>
          Add Objective
        </Button>

        <Box />
      </Box>
    );
  }

  function chooseCompany() {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          p: 3,
          minHeight: 300,
        }}
      >
        <Typography variant="h6"> Choose Company </Typography>
        <RHFSelect name="companyId" label="Company" sx={{ width: '70%' }}>
          {company.map((comp) => (
            <MenuItem key={comp.id} value={comp.id}>
              {comp.name}
            </MenuItem>
          ))}
        </RHFSelect>
      </Box>
    );
  }

  function getStepContent(step) {
    switch (step) {
      case 0:
        return chooseCompany();
      // return <h1> choose </h1>
      case 1:
        return companyInfo();
      case 2:
        return brandInfo();
      // return <h1> choose </h1>
      case 3:
        return companyObjectives();
      // return <h1> choose </h1>
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
          m: 1,
        }}
        activeStep={activeStep}
        alternativeLabel
      >
        {steps.map((label, index) => {
          const stepProps = {};
          const labelProps = {};
          // labelProps.error = stepError.includes(index) && true;
          return (
            <Step key={index} {...stepProps}>
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
            <Button onClick={onSubmit} color="inherit">
              Submit
            </Button>
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
            </Box>
          </Paper>
          <Box sx={{ display: 'flex', m: 2 }}>
            <Button color="inherit" disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
              Back
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            {activeStep === steps.length - 1 ? (
              <Button variant="contained" onClick={onSubmit}>
                Submit
              </Button>
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

export default BrandWithCompany;
