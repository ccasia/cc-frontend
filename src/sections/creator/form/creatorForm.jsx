import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { enqueueSnackbar, SnackbarProvider } from 'notistack';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Step from '@mui/material/Step';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Rating from '@mui/material/Rating';
import Stepper from '@mui/material/Stepper';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { countries } from 'src/assets/data';

import FormProvider, {
  RHFSelect,
  RHFTextField,
  RHFAutocomplete,
  //   RHFDatePicker,
} from 'src/components/hook-form';

const steps = ['Welcome !', 'Fill Form', 'Rate your Interests and Industries'];

export default function CreatorForm({ creator, open, onClose }) {
  const [activeStep, setActiveStep] = useState(0);
  const [newCreator, setNewCreator] = useState({});
  const [ratingInterst, setRatingInterst] = useState([]);
  const [ratingIndustries, setRatingIndustries] = useState([]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // const handleReset = () => {
  //   setActiveStep(0);
  // };

  const langList = ['English', 'Malay', 'Mandarin', 'Hindi', 'All of the above', 'Others'];
  const intersList = [
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

  // total 11 fields
  const CreatorSchema = Yup.object().shape({
    phone: Yup.string().required('Phone number is required'),
    tiktok: Yup.string()
      .matches(
        /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
        'Enter correct url!'
      )
      .required('Please enter Tiktok link!'),
    pronounce: Yup.string().required('pronounce is required'),
    location: Yup.string().required('location is required'),
    Interests: Yup.array().min(3, 'Choose at least three option'),
    lanaugages: Yup.array().min(1, 'Choose at least one option'),
    instagram: Yup.string()
      .matches(
        /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
        'Enter correct url!'
      )
      .required('Please enter Instagram link!'),
    industries: Yup.array().min(3, 'Choose at least three option'),
    employment: Yup.string().required('pronounce is required'),
    birthDate: Yup.mixed().nullable().required('birthDate date is required'),
    Nationality: Yup.string().required('Nationality is required'),
  });

  const defaultValues = useMemo(
    () => ({
      phone: creator?.phone || '',
      tiktok: creator?.tiktok || '',
      pronounce: creator?.pronounce || '',
      location: creator?.location || '',
      Interests: creator?.Interests || [],
      lanaugages: creator?.lanaugages || [],
      instagram: creator?.instagram || '',
      industries: creator?.industries || [],
      employment: creator?.employment || '',
      birthDate: creator?.birthDate || null,
      Nationality: creator?.Nationality || '',
    }),
    [creator]
  );

  const methods = useForm({
    resolver: yupResolver(CreatorSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setNewCreator(data);
  });

  function getStepContent(step) {
    switch (step) {
      // case 0:
      //   return 'Step 1: Please complete the following fields to update your info!';
      case 0:
        return formComponent();
      case 1:
        return ratingComponent(newCreator);
      default:
        return 'Unknown step';
    }
  }
  function formComponent() {
    return (
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Update your Info !</DialogTitle>

        <DialogContent>
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            mt={2}
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
            }}
          >
            <RHFTextField name="instagram" label="instagram Account" />
            <RHFTextField name="tiktok" label="tiktok Account" />

            <RHFAutocomplete
              name="Nationality"
              type="country"
              label="Nationality"
              placeholder="Choose your Nationality"
              fullWidth
              options={countries.map((option) => option.label)}
              getOptionLabel={(option) => option}
            />
            <RHFTextField name="location" label="Current location" />

            <RHFSelect name="employment" label="Employment Status" multiple={false}>
              <MenuItem value="fulltime">Full-time</MenuItem>
              <MenuItem value="freelance">Freelance</MenuItem>
              <MenuItem value="part-time">Part-time</MenuItem>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="in_between">In between jobs/transitioning </MenuItem>
              <MenuItem value="unemployed">Unemployed</MenuItem>
              <MenuItem value="others ">Others </MenuItem>
            </RHFSelect>
            <RHFTextField name="phone" label="phone" />

            <RHFSelect name="pronounce" label="Pronounce" multiple={false}>
              <MenuItem value="he/him">He/Him</MenuItem>
              <MenuItem value="she/her">She/Her</MenuItem>
              <MenuItem value="they/them">They/Them</MenuItem>
              <MenuItem value="others">Others</MenuItem>
            </RHFSelect>
            <RHFTextField name="birthDate" label="birthDate" type="date" />

            {/* <Controller
                name="birthDate"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <DatePicker
                    {...field}
                    format="dd/MM/yyyy"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!error,
                        helperText: error?.message,
                      },
                    }}
                  />
                )}
              /> */}

            {/* <RHFDatePicker name="birthDate"  helperText="enter your birthday" /> */}

            <RHFAutocomplete
              name="lanaugages"
              placeholder="+ lanaugages"
              multiple
              freeSolo={false}
              disableCloseOnSelect
              options={langList.map((option) => option)}
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
              name="Interests"
              placeholder="+ Interests"
              multiple
              freeSolo="true"
              disableCloseOnSelect
              options={intersList.map((option) => option)}
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
              name="industries"
              placeholder="+ Industries"
              multiple
              freeSolo="true"
              disableCloseOnSelect
              options={intersList.map((option) => option)}
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
        </DialogContent>

        <DialogActions>
          {/* <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button> */}

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Save
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    );
  }

  function ratingComponent(data) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', p: 2, m: 2 }}>
        <Typography variant="h4">Rate your interests and industries</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', m: 1 }}>
          <Typography variant="h6">Rate your Interests </Typography>
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            mt={2}
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
            }}
          >
            {Object.keys(data).length !== 0 ? (
              data?.Interests.map((value, index) => (
                <Box>
                  <Typography>{value}</Typography>
                  <Rating
                    name="simple-controlled"
                    value={ratingInterst[index]?.value}
                    onChange={(event, newValue) => {
                      setRatingInterst([...ratingInterst, { name: value, rank: newValue }]);
                    }}
                  />
                </Box>
              ))
            ) : (
              <Typography variant="h5" color="red">
                {' '}
                No interst added
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', m: 1 }}>
          <Typography variant="h6">Rate your industries</Typography>
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            mt={2}
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
            }}
          >
            {Object.keys(data).length !== 0 ? (
              data?.industries.map((value, index) => (
                <Box>
                  <Typography>{value}</Typography>
                  <Rating
                    name="simple-controlled"
                    value={ratingIndustries[index]?.value}
                    onChange={(event, newValue) => {
                      setRatingIndustries([...ratingIndustries, { name: value, rank: newValue }]);
                    }}
                  />
                </Box>
              ))
            ) : (
              <Typography variant="h5" color="red">
                No industries Added
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  const finalSubmit = async () => {
    // enqueueSnackbar('Please fill all the fields');
    onSubmit();
    if (!methods.formState.isValid) {
      enqueueSnackbar('Please fill all the fields');
      setActiveStep((prevActiveStep) => prevActiveStep - 2);
    } else {
      const data = {
        ...newCreator,
        Interests: ratingInterst,
        industries: ratingIndustries,
      };
      console.log(data);
      try {
        const response = await axiosInstance.put(endpoints.auth.updateCreator, data);
        console.log(response);
        enqueueSnackbar('Data updated successfully', { variant: 'success' });
        onClose();
      } catch (error) {
        console.error(error);
        enqueueSnackbar('Something went wrong', { variant: 'error' });
      }
    }
  };
  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      //   onClose={onClose}
      scroll="paper"
      PaperProps={{
        sx: { maxWidth: 720 },
      }}
    >
      <SnackbarProvider />
      <>
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
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>

              <Box sx={{ flexGrow: 1 }} />
              <Button
                onClick={() => {
                  reset();
                  setActiveStep((prevActiveStep) => prevActiveStep - 2);
                }}
              >
                Reset
              </Button>
              <Button onClick={finalSubmit} color="inherit">
                Submit
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Paper
              sx={{
                p: 1,
                my: 1,

                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
              }}
            >
              <Typography sx={{ my: 1 }}>{getStepContent(activeStep)}</Typography>
            </Paper>
            <Box sx={{ display: 'flex', m: 2 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Box sx={{ flexGrow: 1 }} />
              {/* {isStepOptional(activeStep) && (
              <Button color="inherit" onClick={handleSkip} sx={{ mr: 1 }}>
                Skip
              </Button>
            )} */}
              <Button variant="contained" onClick={handleNext}>
                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </Box>
          </>
        )}
      </>
    </Dialog>
  );
}

CreatorForm.propTypes = {
  creator: PropTypes.object,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
