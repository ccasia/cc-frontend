import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Step from '@mui/material/Step';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import { alpha } from '@mui/material/styles';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import StepLabel from '@mui/material/StepLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Stack } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Iconify from 'src/components/iconify/iconify';

import { useBrand } from 'src/hooks/zustands/useBrand';
import { useGetTimeline } from 'src/hooks/use-get-timeline';
import { useAdmins } from 'src/hooks/zustands/useAdmins';

import FormProvider, {
  RHFSelect,
  RHFTextField,
  RHFDatePicker,
  RHFAutocomplete,
} from 'src/components/hook-form';

import UploadPhoto from 'src/sections/profile/dropzone';
import { Upload } from 'src/components/upload';

import CreateBrand from './brandDialog';
import SelectTimeline from './steps/select-timeline';
// import NotificationReminder from './steps/notification-reminder';

const steps = [
  'Fill in campaign information',
  'Fill in campaign brief form',
  'Select timeline',
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
  const open = Boolean(anchorEl);
  const [image, setImage] = useState(null);
  const { brand } = useBrand();
  const [brandState, setBrandState] = useState('');
  const [campaignDo, setcampaignDo] = useState(['']);
  const [campaignDont, setcampaignDont] = useState(['']);
  const { defaultTimeline, loading, error } = useGetTimeline();
  const [timeline, setTimeline] = useState('defaultTimeline');
  const { admins } = useAdmins();


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

  const campaignSchema = Yup.object().shape({
    campaignName: Yup.string().required('Campaign name is required'),
    campaignInterests: Yup.array().min(3, 'Choose at least three option'),
    campaignIndustries: Yup.array().min(3, 'Choose at least three option'),
    campaignCompany: Yup.string().required('Company name is required'),
    campaignBrand: Yup.string().required('Brand name is required'),
    campaignStartDate: Yup.mixed().nullable().required('birthDate date is required'),
    campaignEndDate: Yup.mixed().nullable().required('birthDate date is required'),
    campaignTitle: Yup.string().required('Campaign title is required'),
    campaginObjectives: Yup.string().required('Campaign objectives is required'),
    campaginCoverImage: Yup.string().required('Campaign cover image is required'),
    campaignSuccessMetrics: Yup.string().required('Campaign success metrics is required'),
    audienceAge: Yup.string().required('Audience age is required'),
    audienceGender: Yup.string().required('Audience Gender is required'),
    audienceLocation: Yup.string().required('Audience location is required'),
    audienceLanguage: Yup.string().required('Audience language is required'),
    audienceCreatorPersona: Yup.string().required('Audience creator persona is required'),
    audienceUserPersona: Yup.string().required('Audience influencer persona is required'),
    campaignDo: Yup.array()
      .min(2, 'insert at least three option')
      .required('Campaign do is required '),
    campaignDont: Yup.array()
      .min(2, 'insert at least three option')
      .required('Campaign dont is required '),

    adminManager: Yup.string().required('Admin Manager is required'),

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
    }),
  });

  const defaultValues = {
    campaignName: '',
    campaignInterests: [],
    campaignIndustries: [],
    campaignCompany: '',
    campaignBrand: '',
    campaignStartDate: null,
    campaignEndDate: null,
    campaignTitle: '',
    campaginObjectives: '',
    campaginCoverImage: '',
    campaignSuccessMetrics: '',
    campaignDo: [],
    campaignDont: [],
    defaultTimeline: {},
    customTimeline: {},
    audienceAge: '',
    audienceGender: '',
    audienceLocation: '',
    audienceLanguage: '',
    audienceCreatorPersona: '',
    audienceUserPersona: '',
    timeline: {},
    adminManager: '',
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

  useEffect(() => {
    if (brandState !== '') {
      setValue('campaignBrand', brandState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandState]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  const onDrop = useCallback(
    (e) => {
      const preview = URL.createObjectURL(e[0]);
      setImage(preview);
      setValue('image', e[0]);
    },
    [setValue]
  );

  const handleCampaginDontAdd = () => {
    setcampaignDont([...campaignDont, '']);
  };
  const handleCampaginDontChange = (index, event) => {
    const newDont = [...campaignDont];
    newDont[index] = event.target.value;
    setcampaignDont(newDont);
    setValue('campaignDont', newDont);
  };

  const handleAddObjective = () => {
    setcampaignDo([...campaignDo, '']);
  };

  const handleObjectiveChange = (index, event) => {
    const newObjectives = [...campaignDo];
    newObjectives[index] = event.target.value;
    setcampaignDo(newObjectives);
    setValue('campaignDo', newObjectives);
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
      <RHFTextField name="campaignName" label="Campaign Title" />

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
        <RHFAutocomplete
          fullWidth
          name="campaignBrand"
          placeholder="Brand"
          options={brandState ? [brandState] : brand.map((option) => option.name)}
          freeSolo
        />
        <Box
          sx={{
            alignContent: 'center',
          }}
        >
          <IconButton
            sx={{
              mx: 1,
              mb: 1,
              bgcolor: 'whitesmoke',
            }}
            onClick={handleClick}
          >
            <Iconify icon="mingcute:add-line" />
          </IconButton>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
            anchorOrigin={{
              vertical: 'center',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem
              onClick={() => {
                handleOpenCompanyDialog();
              }}
            >
              <Stack direction="row" alignItems="center" gap={1}>
                <Iconify icon="mdi:invite" />
                <Typography variant="button">Create Brand</Typography>
              </Stack>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* <RHFTextField name="campaignCompany" label="Company" /> */}
      {/* <RHFTextField name="campaignBrand" label="Brand" /> */}
      {/* <RHFSelect name="campaignBrand" label="Brand">
      <RHFSelect name="campaignBrand" label="Brand">
        {companies.map((option) => (
          <MenuItem key={option[0]} value={option[0]}>
            {option[1]}
          </MenuItem>
        ))}
      </RHFSelect> */}

      <RHFDatePicker name="campaignStartDate" label="Start Date" placeholder="start" />
      <RHFDatePicker name="campaignEndDate" label="End Date" />
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

  const formSecondStep = (
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
        <Typography variant="h6">Campaign Logo</Typography>
      </Box>
      <Box sx={{ flexGrow: 1 }} />

      <RHFTextField name="campaignTitle" label="Campaign Title" />

      <RHFTextField
        name="campaignSuccessMetrics"
        label="What does campaign success look like to you?"
      />

      <RHFSelect name="campaginObjectives" label="Campagin Objectives">
        <MenuItem value="newProduct">Im launching a new product</MenuItem>
        <MenuItem value="newService">Im launching a new service</MenuItem>
        <MenuItem value="brandAwareness">I want to drive brand awareness</MenuItem>
        <MenuItem value="productAwareness">Want to drive product awareness</MenuItem>
      </RHFSelect>

      <Box flexGrow={1} />
      <Typography variant="h4">Audience Requirements</Typography>
      <Box flexGrow={1} />
      <RHFSelect name="audienceGender" label="Audience Gender">
        <MenuItem value="female">Female</MenuItem>
        <MenuItem value="male">Male </MenuItem>
        <MenuItem value="nonbinary">Non-Binary</MenuItem>
      </RHFSelect>

      <RHFSelect name="audienceAge" label="Audience Age">
        <MenuItem value="18-25">18-25</MenuItem>
        <MenuItem value="26-34">26-34</MenuItem>
        <MenuItem value="35-40">35-40</MenuItem>
        <MenuItem value=">40"> &gt; 40</MenuItem>
      </RHFSelect>

      <RHFSelect
        name="audienceLocation"
        label="Audience Geo Location"
        helperText=" if others please specify "
      >
        <MenuItem value="KlangValley">Klang Valley </MenuItem>
        <MenuItem value="Selangor">Selangor</MenuItem>
        <MenuItem value="KualaLumpur">Kuala Lumpur</MenuItem>
        <MenuItem value="MainCities">Main cities in Malaysia</MenuItem>
        <MenuItem value="EastMalaysia">East Malaysia</MenuItem>
        <MenuItem value="Others">Others</MenuItem>
      </RHFSelect>

      <RHFSelect name="audienceLanguage" label="Audience Language">
        <MenuItem value="Malay">Malay</MenuItem>
        <MenuItem value="English">English</MenuItem>
        <MenuItem value="Chinese">Chinese</MenuItem>
        <MenuItem value="Tamil">Tamil</MenuItem>
        <MenuItem value="Korean">Korean</MenuItem>
        <MenuItem value="MalayEnglish">Malay + English</MenuItem>
        <MenuItem value="EnglishChinese">English + Chinese </MenuItem>
      </RHFSelect>

      <RHFSelect name="audienceCreatorPersona" label="Audience Creator Persona">
        <MenuItem value="lifeStyle">LifeStyle</MenuItem>
        <MenuItem value="Foodie">Foodie</MenuItem>
        <MenuItem value="fashion">Fashion</MenuItem>
        <MenuItem value="beauty">Beauty</MenuItem>
        <MenuItem value="tech">Tech</MenuItem>
        <MenuItem value="sports">Sports & Fitness</MenuItem>
        <MenuItem value="health">Health & wellness</MenuItem>
        <MenuItem value="family">Family & motherhood</MenuItem>
        <MenuItem value="finance">Finance</MenuItem>
        <MenuItem value="education">Education</MenuItem>
        <MenuItem value="music">Music</MenuItem>
        <MenuItem value="gamer">Gamer</MenuItem>
        <MenuItem value="entertainment">Entertainment</MenuItem>
        <MenuItem value="travel">Travel</MenuItem>
      </RHFSelect>

      <RHFTextField
        name="audienceUserPersona"
        label="User Persona"
        placeholder=" let us know who you want your campaign to reach!"
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignContent: 'center',
          gap: 0.8,
        }}
      >
        {campaignDont.map((objective, index) => (
          <TextField
            key={index}
            name={`companyDon't[${index}]`}
            label={`campaignDon't ${index + 1}`}
            value={objective}
            onChange={(event) => handleCampaginDontChange(index, event)}
          />
        ))}

        <Button variant="contained" onClick={handleCampaginDontAdd}>
          Add Dont
        </Button>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignContent: 'center',
          gap: 0.8,
        }}
      >
        {campaignDo.map((objective, index) => (
          <TextField
            key={index}
            name={`companyDo[${index}]`}
            label={`campaignDo ${index + 1}`}
            value={objective}
            onChange={(event) => handleObjectiveChange(index, event)}
          />
        ))}

        <Button variant="contained" onClick={handleAddObjective}>
          Add Do
        </Button>
      </Box>
    </Box>
  );

  const formSelectAdminManager = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignContent: 'center',
        gap: 2,
        p: 3,
      }}
    >
      <Typography variant="h4">Select Admin Manager</Typography>
      {/* <RHFSelect name="adminManager" label="Admin Manager" defaultValue="default" /> */}
      <RHFAutocomplete
        name="adminManager"
        placeholder="Admin Manager"
        options={admins ? admins.map((option) => option.name) : 'No admin found'}
        freeSolo
      />
    </Box>
  );

  const formUpload = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignContent: 'center',
        gap: 3,
        p: 3,
      }}
    >
      <Typography variant="h4">Upload Agreement</Typography>
      <Upload />
    </Box>
  );

  function getStepContent(step) {
    switch (step) {
      case 0:
        return formFirstStep;
      case 1:
        return formSecondStep;
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
      // case 3:
      //   return <NotificationReminder />;
      case 3:
        return formSelectAdminManager;
      case 4:
        return formUpload;
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
      {/* <CreateCompany open={openCompanyDialog} onClose={handleCloseCompanyDialog} /> */}
      <CreateBrand
        open={openCompanyDialog}
        onClose={handleCloseCompanyDialog}
        setBrand={setBrandState}
      />
    </Box>
  );
}
export default CreateCampaignForm;
