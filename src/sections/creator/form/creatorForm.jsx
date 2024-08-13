/* eslint-disable no-unused-vars */
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Step from '@mui/material/Step';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Stepper from '@mui/material/Stepper';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';
import { Stack, Slider, InputAdornment } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { countries } from 'src/assets/data';

import Iconify from 'src/components/iconify';
import FormProvider, {
  RHFSelect,
  RHFTextField,
  RHFDatePicker,
  RHFAutocomplete,
} from 'src/components/hook-form';

const steps = [
  'Fill in your details',
  'Provide your social media information',
  'Rate your Interests and Industries',
];

export const langList = ['English', 'Malay', 'Chinese', 'Tamil', 'All of the above', 'Others'];

export const interestsList = [
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

export default function CreatorForm({ creator, open, onClose }) {
  const [activeStep, setActiveStep] = useState(0);
  const [newCreator, setNewCreator] = useState({});
  const [ratingInterst, setRatingInterst] = useState([]);
  const [ratingIndustries, setRatingIndustries] = useState([]);

  // First step schema
  const firstSchema = Yup.object().shape({
    phone: Yup.string().required('Phone number is required'),
    pronounce: Yup.string().required('pronounce is required'),
    location: Yup.string().required('location is required'),
    Interests: Yup.array().min(3, 'Choose at least three option'),
    languages: Yup.array().min(1, 'Choose at least one option'),
    industries: Yup.array().min(3, 'Choose at least three option'),
    employment: Yup.string().required('pronounce is required'),
    birthDate: Yup.mixed().nullable().required('birthDate date is required'),
    Nationality: Yup.string().required('Nationality is required'),
  });

  // Second Step Schema
  const secondSchema = Yup.object().shape({
    // tiktok: Yup.string().required('Please enter your tiktok username'),
    instagram: Yup.string().required('Please enter your instagram username'),
  });

  const testSchema = Yup.object().shape({
    phone: Yup.string().required('Phone number is required'),
    pronounce: Yup.string().required('pronounce is required'),
    location: Yup.string().required('location is required'),
    interests: Yup.array().min(3, 'Choose at least three option'),
    languages: Yup.array().min(1, 'Choose at least one option'),
    industries: Yup.array().min(3, 'Choose at least three option'),
    employment: Yup.string().required('pronounce is required'),
    birthDate: Yup.mixed().nullable().required('birthDate date is required'),
    Nationality: Yup.string().required('Nationality is required'),
    instagram: Yup.string().required('Please enter your instagram username'),
  });

  const defaultValues = useMemo(
    () => ({
      phone: '',
      tiktok: '',
      pronounce: '',
      location: '',
      Interests: [],
      languages: [],
      instagram: '',
      industries: [],
      employment: '',
      birthDate: null,
      Nationality: '',
    }),
    []
  );

  const methods = useForm({
    resolver: yupResolver(testSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = methods;

  const nationality = watch('Nationality');

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const onSubmit = handleSubmit(async (data) => {
    if (ratingInterst.length < 3) {
      toast.error('Please rate all your interests.');
    } else if (ratingIndustries.length < 3) {
      toast.error('Please rate all your industries.');
    }

    const newData = {
      ...data,
      interests: ratingInterst,
      industries: ratingIndustries,
    };

    try {
      await axiosInstance.put(endpoints.auth.updateCreator, newData);
      enqueueSnackbar('Welcome !');

      onClose();
    } catch (error) {
      enqueueSnackbar('Something went wrong', {
        variant: 'error',
      });
    }
  });

  function getStepContent(step) {
    switch (step) {
      case 0:
        return formComponent();
      case 1:
        return socialMediaForm;
      case 2:
        return ratingComponent(newCreator);
      default:
        return 'Unknown step';
    }
  }

  function formComponent() {
    return (
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
          <RHFAutocomplete
            name="Nationality"
            type="country"
            // label="Nationality"
            placeholder="Choose your Nationality"
            fullWidth
            options={countries.map((option) => option.label)}
            getOptionLabel={(option) => option}
          />

          <RHFTextField name="location" label="Current location" />

          <RHFSelect name="employment" label="Employment Status" multiple={false}>
            <MenuItem value="fulltime">Full-time</MenuItem>
            <MenuItem value="freelance">Freelance</MenuItem>
            <MenuItem value="part_time">Part-time</MenuItem>
            <MenuItem value="student">Student</MenuItem>
            <MenuItem value="in_between">In between jobs/transitioning </MenuItem>
            <MenuItem value="unemployed">Unemployed</MenuItem>
            <MenuItem value="others ">Others </MenuItem>
          </RHFSelect>

          <RHFTextField
            name="phone"
            label="Phone Number"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  +
                  {countries.filter((country) => country.label === nationality).map((e) => e.phone)}
                </InputAdornment>
              ),
            }}
          />

          <RHFSelect name="pronounce" label="Pronounce" multiple={false}>
            <MenuItem value="he/him">He/Him</MenuItem>
            <MenuItem value="she/her">She/Her</MenuItem>
            <MenuItem value="they/them">They/Them</MenuItem>
            <MenuItem value="others">Others</MenuItem>
          </RHFSelect>

          <RHFDatePicker name="birthDate" label="Birth Date" />

          <RHFAutocomplete
            name="languages"
            placeholder="+ languages"
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
            name="interests"
            placeholder="Your interests"
            multiple
            freeSolo
            disableCloseOnSelect
            options={interestsList.map((option) => option)}
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
            placeholder="Favorite industries?"
            multiple
            freeSolo
            disableCloseOnSelect
            options={interestsList.map((option) => option)}
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
    );
  }

  const socialMediaForm = (
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
      <Stack gap={1}>
        <RHFTextField
          name="instagram"
          label="Instagram Username"
          placeholder="Eg: instagram/yourusername"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="mdi:instagram" width={20} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>
      <Stack gap={1}>
        <RHFTextField
          name="tiktok"
          label="Tiktok Username"
           placeholder="Eg: tiktok/yourusername"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="ic:baseline-tiktok" width={20} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>
    </Box>
  );

  function ratingComponent() {
    const interest = getValues('interests');
    const industries = getValues('industries');

    const handleChangeInterest = (elem, val) => {
      if (!ratingInterst.some((item) => item.name === elem)) {
        // If an item with the same name doesn't exist, add it to the array
        setRatingInterst((prevRatingInterst) => [...prevRatingInterst, { name: elem, rank: val }]);
      } else {
        // If the item exists, update its rank
        const updatedRatingInterst = ratingInterst.map((item) =>
          item.name === elem ? { ...item, rank: val } : item
        );
        setRatingInterst(updatedRatingInterst);
      }
    };

    const handleChangeIndustries = (elem, val) => {
      if (!ratingIndustries.some((item) => item.name === elem)) {
        // If an item with the same name doesn't exist, add it to the array
        setRatingIndustries((prevRatingIndustry) => [
          ...prevRatingIndustry,
          { name: elem, rank: val },
        ]);
      } else {
        // If the item exists, update its rank
        const updatedRatingIndustry = ratingIndustries.map((item) =>
          item.name === elem ? { ...item, rank: val } : item
        );
        setRatingIndustries(updatedRatingIndustry);
      }
    };

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', p: 2, m: 2 }}>
        <Typography variant="h4">Rate your interests and industries</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', m: 1 }}>
          <Typography variant="h6">Rate your Interests </Typography>
          <Box
            rowGap={3}
            columnGap={5}
            display="grid"
            mt={2}
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
            }}
          >
            {interest &&
              interest.map((elem, index) => (
                <Stack>
                  <Typography>{elem}</Typography>
                  <Slider
                    defaultValue={0}
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={0}
                    max={5}
                    value={ratingInterst[index]?.rank}
                    onChange={(event, val) => handleChangeInterest(elem, val)}
                  />
                </Stack>
              ))}
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
            {industries &&
              industries.map((elem, index) => (
                <Stack>
                  <Typography>{elem}</Typography>
                  <Slider
                    defaultValue={0}
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={0}
                    max={5}
                    value={ratingInterst[index]?.rank}
                    onChange={(event, val) => handleChangeIndustries(elem, val)}
                  />
                </Stack>
              ))}
          </Box>
        </Box>
      </Box>
    );
  }

  const finalSubmit = async () => {
    onSubmit();
    if (!methods.formState.isValid) {
      toast.error('Please fill all the required fields');
      // enqueueSnackbar('Please fill all the fields');
      setActiveStep((prevActiveStep) => prevActiveStep - 2);
    } else {
      const data = {
        ...newCreator,
        Interests: ratingInterst,
        industries: ratingIndustries,
      };
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      scroll="paper"
      PaperProps={{
        sx: { maxWidth: 720 },
      }}
    >
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
              <Box sx={{ my: 3 }}>
                <FormProvider methods={methods} onSubmit={onSubmit}>
                  {getStepContent(activeStep)}
                </FormProvider>
              </Box>
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
