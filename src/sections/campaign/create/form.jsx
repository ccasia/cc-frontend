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
import FormProvider, { RHFSelect, RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import CreateCompany from './companyDialog';
import SelectTimeline from './steps/select-timeline';

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
    defaultTimeline: Yup.object().shape({
      openForPitch: Yup.number('Must be a number').min(1),
      agreementSign: Yup.number('Must be a number').min(1),
      feedBackFinalDraft: Yup.number('Must be a number').min(1),
      feedBackFirstDraft: Yup.number('Must be a number').min(1),
      filterPitch: Yup.number('Must be a number').min(1),
      finalDraft: Yup.number('Must be a number').min(1),
      firstDraft: Yup.number('Must be a number').min(1),
      qc: Yup.number('Must be a number').min(1),
      shortlistCreator: Yup.number('Must be a number').min(1),
    }),
    customTimeline: Yup.object().shape({
      openForPitch: Yup.number('Must be a number').min(1),
      agreementSign: Yup.number('Must be a number').min(1),
      feedBackFinalDraft: Yup.number('Must be a number').min(1),
      feedBackFirstDraft: Yup.number('Must be a number').min(1),
      filterPitch: Yup.number('Must be a number').min(1),
      finalDraft: Yup.number('Must be a number').min(1),
      firstDraft: Yup.number('Must be a number').min(1),
      qc: Yup.number('Must be a number').min(1),
      shortlistCreator: Yup.number('Must be a number').min(1),
    }),
  });

  const defaultValues = {
    campaignName: '',
    campaignInterests: [],
    campaignIndustries: [],
    campaignCompany: '',
    campaignBrand: '',
    defaultTimeline: {},
    customTimeline: {},
  };

  const methods = useForm({
    resolver: yupResolver(campaignSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    getValues,
    control,
    setValue,
    formState: { errors },
  } = methods;

  useEffect(() => {
    setValue('defaultTimeline', defaultTimeline);
  }, [defaultTimeline, setValue]);

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
      {/* <Box sx={{ flexGrow: 1 }} /> */}
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

      {/* <RHFTextField name="campaignCompany" label="Company" /> */}
      {/* <RHFTextField name="campaignBrand" label="Brand" /> */}
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

      {/* <RHFDatePicker name="campaignStartDate"  />
          <RHFDatePicker name="campaignEndDate" /> */}
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
          />
        );
      case 3:
        return <h3>step 4</h3>;
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
