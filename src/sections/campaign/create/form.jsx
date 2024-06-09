/* eslint-disable no-unused-vars */
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Chip from '@mui/material/Chip';
import Step from '@mui/material/Step';
import { Stack } from '@mui/material';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';

import { useGetTimeline } from 'src/hooks/use-get-timeline';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import CreateCompany from './companyDialog';
import SelectTimeline from './steps/select-timeline';
import NotificationReminder from './steps/notification-reminder';

const steps = [
  'Fill in campaign information',
  'Fill in campaign brief form',
  'Select timeline',
  'Select notification reminders dates',
  'Select Admin Manager',
  'Fill in  agreement form',
];

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

function CreateCampaignForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [openCompanyDialog, setOpenCompanyDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { defaultTimeline, loading, error } = useGetTimeline();
  const [timeline, setTimeline] = useState('defaultTimeline');

  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCloseCompanyDialog = () => {
    setOpenCompanyDialog(false);
  };

  const handleOpenCompanyDialog = () => {
    setOpenCompanyDialog(true);
    handleClose();
  };

  const companies = [
    ['nexea', 'Nexea'],
    ['myeg', 'MyEG'],
    ['mymdec', 'MDEC'],
    ['pg', 'P&G'],
  ];

  const campaignSchema = Yup.object().shape({
    campaignName: Yup.string().required('Campaign name is required'),
    campaignInterests: Yup.array().min(3, 'Choose at least three option'),
    campaignIndustries: Yup.array().min(3, 'Choose at least three option'),
    campaignCompany: Yup.string().required('Company name is required'),
    campaignBrand: Yup.string().required('Brand name is required'),
    // defaultTimeline: Yup.object().shape({
    //   openForPitch: Yup.number('Must be a number').min(1),
    //   agreementSign: Yup.number('Must be a number').min(1),
    //   feedBackFinalDraft: Yup.number('Must be a number').min(1),
    //   feedBackFirstDraft: Yup.number('Must be a number').min(1),
    //   filterPitch: Yup.number('Must be a number').min(1),
    //   finalDraft: Yup.number('Must be a number').min(1),
    //   firstDraft: Yup.number('Must be a number').min(1),
    //   qc: Yup.number('Must be a number').min(1),
    //   shortlistCreator: Yup.number('Must be a number').min(1),
    //   posting: Yup.number('Must be a number').min(1),
    // }),

    timeline: Yup.object().shape({
      openForPitch: Yup.number('Must be a number')
        .min(14, 'Minumum is 14 days')
        .max(30, 'Maximum is 30 days')
        .required('Open for pitch timeline is required'),
      filterPitch: Yup.number('Must be a number')
        .min(2, 'Minumum is 2 days')
        .max(3, 'Maximum is 3 days')
        .required('Filtering timeline is required'),
      shortlistCreator: Yup.number('Must be a number')
        .min(1, 'Minumum is 1 days')
        .max(2, 'Maximum is 2 days')
        .required('Shortlist creator timeline is required'),
      agreementSign: Yup.number('Must be a number')
        .min(1, 'Minumum is 1 days')
        .max(2, 'Maximum is 2 days')
        .required('Sign of agreement timeline is required'),
      firstDraft: Yup.number('Must be a number')
        .min(3, 'Minumum is 3 days')
        .max(5, 'Maximum is 5 days')
        .required('First draft timeline is required'),
      feedBackFirstDraft: Yup.number('Must be a number')
        .min(2, 'Minumum is 2 days')
        .max(3, 'Maximum is 3 days')
        .required('Feedback first draft timeline is required'),
      finalDraft: Yup.number('Must be a number')
        .min(2, 'Minumum is 2 days')
        .max(4, 'Maximum is 4 days')
        .required('Final draft timeline is required'),
      feedBackFinalDraft: Yup.number('Must be a number')
        .min(1, 'Minumum is 1 days')
        .max(2, 'Maximum is 2 days')
        .required('Feedback final draft timeline is required'),
      posting: Yup.number('Must be a number')
        .max(2, 'Maximum is 2 days')
        .required('Posting social media timeline is required'),
      qc: Yup.number('Must be a number').required('QC timeline is required'),
    }),
  });

  const defaultValues = {
    campaignName: '',
    campaignInterests: [],
    campaignIndustries: [],
    campaignCompany: '',
    campaignBrand: '',
    timeline: {},
  };

  const methods = useForm({
    resolver: yupResolver(campaignSchema),
    defaultValues,
    reValidateMode: 'onChange',
    mode: 'onChange',
  });

  const {
    handleSubmit,
    getValues,
    control,
    setValue,
    register,
    formState: { errors, isDirty },
  } = methods;

  useEffect(() => {
    if (timeline === 'defaultTimeline') {
      setValue('timeline', defaultTimeline);
    }
  }, [defaultTimeline, setValue, timeline]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const onSubmit = handleSubmit(async (data) => {
    console.log(data);
  });

  const finalSubmit = async () => {
    console.log('first');
  };

  const formFirstStep = (
    <Box
      rowGap={2}
      columnGap={3}
      display="grid"
      mt={4}
      gridTemplateColumns={{
        xs: 'repeat(1, 1fr)',
        sm: 'repeat(2, 1fr)',
      }}
    >
      <RHFTextField name="campaignName" label="Campaign Name" />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignContent: 'center',
        }}
      >
        {' '}
        <RHFSelect name="campaignCompany" label="Company">
          {companies.map((option) => (
            <MenuItem key={option[0]} value={option[0]}>
              {option[1]}
            </MenuItem>
          ))}
        </RHFSelect>{' '}
        <Box>
          <Button
            variant="contained"
            sx={{
              width: '100%',
              height: '95%',
              mx: 1,
            }}
            onClick={handleClick}
          >
            Create Company
          </Button>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            sx={{
              my: 1,
            }}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'bottom',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <MenuItem
              onClick={() => {
                handleOpenCompanyDialog();
              }}
            >
              <Stack direction="row" alignItems="center" gap={1}>
                <Iconify icon="mdi:invite" />
                <Typography variant="button">Create Company</Typography>
              </Stack>
            </MenuItem>
            <MenuItem>
              <Stack direction="row" alignItems="center" gap={1}>
                <Iconify icon="material-symbols:add" />
                <Typography variant="button">Create Brand</Typography>
              </Stack>
            </MenuItem>
            <MenuItem>
              <Stack direction="row" alignItems="center" gap={1}>
                <Iconify icon="material-symbols:add" />
                <Typography variant="button">Create sup-Brand</Typography>
              </Stack>
            </MenuItem>
            <MenuItem>
              <Stack direction="row" alignItems="center" gap={1}>
                <Iconify icon="material-symbols:add" />
                <Typography variant="button">Create sup-sup-Brand</Typography>
              </Stack>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <RHFSelect name="campaignBrand" label="Brand">
        {companies.map((option) => (
          <MenuItem key={option[0]} value={option[0]}>
            {option[1]}
          </MenuItem>
        ))}
      </RHFSelect>
      <RHFAutocomplete
        name="campaignInterests"
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
        name="campaignIndustries"
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
  );

  function getStepContent(step) {
    switch (step) {
      case 0:
        return formFirstStep;
      case 1:
        return <h3>step 2</h3>;
      case 2:
        return (
          <SelectTimeline
            control={control}
            defaultTimeline={defaultTimeline}
            getValues={getValues}
            setValue={setValue}
            errors={errors}
            timeline={timeline}
            setTimeline={setTimeline}
          />
        );
      case 3:
        return <NotificationReminder />;
      case 4:
        return <h3>step 5</h3>;
      case 5:
        return <h3>step 6</h3>;
      default:
        return 'Unknown step';
    }
  }

  return (
    <Box
      sx={{
        boxShadow: (theme) => theme.customShadows.z20,
        borderRadius: '20px',
        mt: 3,
        bgcolor: 'background.paper',
        p: 3,
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
            <Button onClick={finalSubmit} color="inherit">
              Submit
            </Button>
          </Box>
        </>
      ) : (
        <>
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
                width: '100%',
                // bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
                // width: '80%',
              }}
            >
              <Box sx={{ my: 1 }}>
                <FormProvider methods={methods} onSubmit={onSubmit}>
                  {getStepContent(activeStep)}
                </FormProvider>
              </Box>
            </Paper>
          </Box>

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
        </>
      )}
      <CreateCompany open={openCompanyDialog} onClose={handleCloseCompanyDialog} />
    </Box>
  );
}
export default CreateCampaignForm;
