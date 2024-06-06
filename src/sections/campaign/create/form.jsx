/* eslint-disable no-unused-vars */
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { useState, useCallback } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

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
import { useBrand } from 'src/hooks/zustands/useBrand';


import FormProvider, {
  RHFSelect,
  RHFTextField,
  RHFDatePicker,
  RHFAutocomplete,
} from 'src/components/hook-form';

import UploadPhoto from 'src/sections/profile/dropzone';

import CreateBrand from './brandDialog';

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
  const [image, setImage] = useState(null);
  const { brand } = useBrand();
  const [campaignDo, setcampaignDo] = useState(['']);
  const [campaignDont, setcampaignDont] = useState(['']);
  // const open = Boolean(anchorEl);

  // const handleClick = (event) => {
  //   setAnchorEl(event.currentTarget);
  // };

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
    campaignStartDate: Yup.mixed().nullable().required('birthDate date is required'),
    campaignEndDate: Yup.mixed().nullable().required('birthDate date is required'),
    campaignTitle: Yup.string().required('Campaign title is required'),
    campaginObjectives: Yup.string().required('Campaign objectives is required'),
    campaginCoverImage: Yup.string().required('Campaign cover image is required'),
    campaignSuccessMetrics: Yup.string().required('Campaign success metrics is required'),
    campaignDo: Yup.array()
      .min(2, 'insert at least three option')
      .required('Campaign do is required '),
    campaignDont: Yup.array()
      .min(2, 'insert at least three option')
      .required('Campaign dont is required '),
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
  };

  const methods = useForm({
    resolver: yupResolver(campaignSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = methods;

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

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignContent: 'center',
        }}
      >
        {' '}
        <RHFSelect name="campaignBrand" label="Brand">
          {brand?.map((option) => (
            <MenuItem key={option.name} value={option.name}>
              {option.name}
            </MenuItem>
          ))}
        </RHFSelect>{' '}
        <Box>
          <Button
            variant="contained"
            sx={{
              width: '90%',
              height: '90%',
              mx: 1,
            }}
            onClick={handleOpenCompanyDialog}
          >
            Create Brand
          </Button>
        </Box>
      </Box>

      {/* <RHFTextField name="campaignCompany" label="Company" /> */}
      {/* <RHFTextField name="campaignBrand" label="Brand" /> */}
      {/* <RHFSelect name="campaignBrand" label="Brand">
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
        <MenuItem value="1">Im launching a new product</MenuItem>
        <MenuItem value="2">Im launching a new service</MenuItem>
        <MenuItem value="3">I want to drive brand awareness</MenuItem>
        <MenuItem value="4">Want to drive product awareness</MenuItem>
      </RHFSelect>

      <Box flexGrow={1} />
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

  // function FormFirstStep() {
  //   return (
  //     <Box
  //       rowGap={2}
  //       columnGap={3}
  //       display="grid"
  //       mt={4}
  //       gridTemplateColumns={{
  //         xs: 'repeat(1, 1fr)',
  //         sm: 'repeat(2, 1fr)',
  //       }}
  //     >
  //       <RHFTextField name="campaignName" label="Campaign Name" />
  //       {/* <Box sx={{ flexGrow: 1 }} /> */}
  //       <Box
  //         sx={{
  //           display: 'flex',
  //           flexDirection: 'row',
  //           justifyContent: 'space-between',
  //           alignContent: 'center',
  //         }}
  //       >
  //         {' '}
  //         <RHFSelect name="campaignCompany" label="Company">
  //           {companies.map((option) => (
  //             <MenuItem key={option[0]} value={option[0]}>
  //               {option[1]}
  //             </MenuItem>
  //           ))}
  //         </RHFSelect>{' '}
  //         <Box>
  //           <Button
  //             variant="contained"
  //             sx={{
  //               width: '100%',
  //               height: '95%',
  //               mx: 1,
  //             }}
  //             onClick={handleClick}
  //           >
  //             Create Company
  //           </Button>
  //           <Menu
  //             id="basic-menu"
  //             anchorEl={anchorEl}
  //             open={open}
  //             onClose={handleClose}
  //             sx={{
  //               my: 1,
  //             }}
  //             MenuListProps={{
  //               'aria-labelledby': 'basic-button',
  //             }}
  //             anchorOrigin={{
  //               vertical: 'bottom',
  //               horizontal: 'bottom',
  //             }}
  //             transformOrigin={{
  //               vertical: 'top',
  //               horizontal: 'left',
  //             }}
  //           >
  //             <MenuItem
  //               onClick={() => {
  //                 handleOpenCompanyDialog();
  //               }}
  //             >
  //               <Stack direction="row" alignItems="center" gap={1}>
  //                 <Iconify icon="mdi:invite" />
  //                 <Typography variant="button">Create Company</Typography>
  //               </Stack>
  //             </MenuItem>
  //             <MenuItem>
  //               <Stack direction="row" alignItems="center" gap={1}>
  //                 <Iconify icon="material-symbols:add" />
  //                 <Typography variant="button">Create Brand</Typography>
  //               </Stack>
  //             </MenuItem>
  //             <MenuItem>
  //               <Stack direction="row" alignItems="center" gap={1}>
  //                 <Iconify icon="material-symbols:add" />
  //                 <Typography variant="button">Create sup-Brand</Typography>
  //               </Stack>
  //             </MenuItem>
  //             <MenuItem>
  //               <Stack direction="row" alignItems="center" gap={1}>
  //                 <Iconify icon="material-symbols:add" />
  //                 <Typography variant="button">Create sup-sup-Brand</Typography>
  //               </Stack>
  //             </MenuItem>
  //           </Menu>
  //         </Box>
  //       </Box>

  //       {/* <RHFTextField name="campaignCompany" label="Company" /> */}
  //       {/* <RHFTextField name="campaignBrand" label="Brand" /> */}
  //       <RHFSelect name="campaignBrand" label="Brand">
  //         {companies.map((option) => (
  //           <MenuItem key={option[0]} value={option[0]}>
  //             {option[1]}
  //           </MenuItem>
  //         ))}
  //       </RHFSelect>
  //       <RHFAutocomplete
  //         name="campaignInterests"
  //         placeholder="+ Interests"
  //         multiple
  //         freeSolo="true"
  //         disableCloseOnSelect
  //         options={intersList.map((option) => option)}
  //         getOptionLabel={(option) => option}
  //         renderOption={(props, option) => (
  //           <li {...props} key={option}>
  //             {option}
  //           </li>
  //         )}
  //         renderTags={(selected, getTagProps) =>
  //           selected.map((option, index) => (
  //             <Chip
  //               {...getTagProps({ index })}
  //               key={option}
  //               label={option}
  //               size="small"
  //               color="info"
  //               variant="soft"
  //             />
  //           ))
  //         }
  //       />
  //       <RHFAutocomplete
  //         name="campaignIndustries"
  //         placeholder="+ Industries"
  //         multiple
  //         freeSolo="true"
  //         disableCloseOnSelect
  //         options={intersList.map((option) => option)}
  //         getOptionLabel={(option) => option}
  //         renderOption={(props, option) => (
  //           <li {...props} key={option}>
  //             {option}
  //           </li>
  //         )}
  //         renderTags={(selected, getTagProps) =>
  //           selected.map((option, index) => (
  //             <Chip
  //               {...getTagProps({ index })}
  //               key={option}
  //               label={option}
  //               size="small"
  //               color="info"
  //               variant="soft"
  //             />
  //           ))
  //         }
  //       />

  //       {/* <RHFDatePicker name="campaignStartDate"  />
  //         <RHFDatePicker name="campaignEndDate" /> */}
  //     </Box>
  //   );
  // }

  function getStepContent(step) {
    switch (step) {
      case 0:
        return formFirstStep;
      case 1:
        return formSecondStep;
      case 2:
        return <h3>step 3</h3>;
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
      {/* <CreateCompany open={openCompanyDialog} onClose={handleCloseCompanyDialog} /> */}
      <CreateBrand open={openCompanyDialog} onClose={handleCloseCompanyDialog} />
    </Box>
  );
}
export default CreateCampaignForm;
