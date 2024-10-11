/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-vars */
import dayjs from 'dayjs';
import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { PDFDocument } from 'pdf-lib';
import { pdf } from '@react-pdf/renderer';
import { BarLoader } from 'react-spinners';
import 'react-pdf/dist/Page/TextLayer.css';
import { enqueueSnackbar } from 'notistack';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { Page, pdfjs, Document } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Paper from '@mui/material/Paper';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import MenuItem from '@mui/material/MenuItem';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import {
  Grid,
  Chip,
  Stack,
  Alert,
  Dialog,
  Divider,
  IconButton,
  StepContent,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetTemplate } from 'src/hooks/use-get-template';
import useGetDefaultTimeLine from 'src/hooks/use-get-default-timeline';
import { useGetCampaignBrandOption } from 'src/hooks/use-get-company-brand';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { langList } from 'src/contants/language';
import AgreementTemplate from 'src/template/agreement';

import Iconify from 'src/components/iconify';
import PDFEditor from 'src/components/pdf/pdf-editor';
import FormProvider, {
  RHFUpload,
  RHFSelect,
  RHFTextField,
  RHFMultiSelect,
  RHFAutocomplete,
} from 'src/components/hook-form';

import CreateBrand from './brandDialog';
import CreateCompany from './companyDialog';
import { useGetAdmins } from './hooks/get-am';
import SelectBrand from './steps/select-brand';
import SelectTimeline from './steps/select-timeline';
import TimelineTypeModal from './steps/timeline-type-modal';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const steps = [
  'Select Client or Brand',
  'General Campaign Information',
  'Campaign Details',
  'Campaign Images',
  'Timeline',
  'Admin Manager',
  'Agreement Form',
];

export const interestsLists = [
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
  'Entertainment',
];

const videoAngle = [
  'Product Demo/Review',
  'Service Demo/Review',
  'Testimonial',
  'Story Telling',
  'Organic (soft sell)',
  'Point Of View (experience with product/service)',
  'Walkthrough',
  'Problem vs Solution',
  'Trends',
  'Up to cult creative to decide',
];

function CreateCampaignForm() {
  const active = localStorage.getItem('activeStep');
  const { data: options, companyLoading } = useGetCampaignBrandOption();
  const { data: defaultTimelines, isLoading: defaultTimelineLoading } = useGetDefaultTimeLine();
  const { data: admins } = useGetAdmins('active');
  const { user } = useAuthContext();
  const openCompany = useBoolean();
  const openBrand = useBoolean();
  const modal = useBoolean();

  const [activeStep, setActiveStep] = useState(0 || parseInt(active, 10));
  const [openCompanyDialog, setOpenCompanyDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [brandState, setBrandState] = useState('');
  const [campaignDo, setcampaignDo] = useState(['']);
  const [campaignDont, setcampaignDont] = useState(['']);
  const [pages, setPages] = useState(0);

  const pdfModal = useBoolean();

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
    campaignIndustries: Yup.string().required('Campaign Industry is required.'),
    campaignDescription: Yup.string().required('Campaign Description is required.'),
    campaignTitle: Yup.string().required('Campaign title is required'),
    campaignObjectives: Yup.string().required('Campaign objectives is required'),
    brandTone: Yup.string().required('Brand tone is required'),
    productName: Yup.string().required('Product or Service name is required.'),
    audienceAge: Yup.array().min(1, 'At least one option').required('Audience age is required'),
    audienceGender: Yup.array()
      .min(1, 'At least one option')
      .required('Audience Gender is required'),
    audienceLocation: Yup.array()
      .min(1, 'At least one option')
      .required('Audience location is required'),
    othersAudienceLocation: Yup.string(),
    audienceLanguage: Yup.array()
      .min(1, 'At least one option')
      .required('Audience language is required'),
    audienceCreatorPersona: Yup.array()
      .min(1, 'At least one option')
      .required('Audience creator persona is required'),
    audienceUserPersona: Yup.string().required('Audience influencer persona is required'),
    campaignDo: Yup.array()
      .min(1, 'At least one option')
      .of(
        Yup.object().shape({
          value: Yup.string(),
        })
      ),
    campaignDont: Yup.array()
      .min(1, 'At least one option')
      .of(
        Yup.object().shape({
          value: Yup.string(),
        })
      ),
    campaignImages: Yup.array()
      .min(1, 'Must have at least 1 image')
      .max(3, 'Must have at most 3 images'),
    adminManager: Yup.array()
      .min(1, 'At least One Admin is required')
      .required('Admin Manager is required'),
  });

  const campaignInformationSchema = Yup.object().shape({
    campaignIndustries: Yup.string().required('Campaign Industry is required.'),
    campaignDescription: Yup.string().required('Campaign Description is required.'),
    campaignTitle: Yup.string().required('Campaign title is required'),
    campaignObjectives: Yup.string().required('Campaign objectives is required'),
    brandTone: Yup.string().required('Brand tone is required'),
    productName: Yup.string().required('Product or Service name is required.'),
  });

  const campaignRequirementSchema = Yup.object().shape({
    audienceAge: Yup.array().min(1, 'At least one option').required('Audience age is required'),
    audienceGender: Yup.array()
      .min(1, 'At least one option')
      .required('Audience Gender is required'),
    audienceLocation: Yup.array()
      .min(1, 'At least one option')
      .required('Audience location is required'),
    othersAudienceLocation: Yup.string(),
    audienceLanguage: Yup.array()
      .min(1, 'At least one option')
      .required('Audience language is required'),
    audienceCreatorPersona: Yup.array()
      .min(1, 'At least one option')
      .required('Audience creator persona is required'),
    audienceUserPersona: Yup.string().required('Audience influencer persona is required'),
    campaignDo: Yup.array()
      .min(1, 'At least one option')
      .of(
        Yup.object().shape({
          value: Yup.string(),
        })
      ),
    campaignDont: Yup.array()
      .min(1, 'At least one option')
      .of(
        Yup.object().shape({
          value: Yup.string(),
        })
      ),
  });

  const campaignImagesSchema = Yup.object().shape({
    campaignImages: Yup.array()
      .min(1, 'Must have at least 1 image')
      .max(3, 'Must have at most 3 images'),
  });

  const campaignAdminSchema = Yup.object().shape({
    adminManager: Yup.array()
      .min(1, 'At least One Admin is required')
      .required('Admin Manager is required'),
  });

  const timelineSchema = Yup.object().shape({
    campaignStartDate: Yup.string().required('Campaign Start Date is required.'),
  });

  const clientSchema = Yup.object().shape({
    client: Yup.object().required('Client is required.'),
    hasBrand: Yup.bool(),
    campaignBrand: Yup.object()
      .nullable()
      .when('hasBrand', {
        is: true,
        then: (s) => s.required('Brand is required.'),
        otherwise: (s) => s,
      }),
  });

  const getSchemaForStep = (step) => {
    switch (step) {
      case 0:
        return clientSchema;
      case 1:
        return campaignInformationSchema;
      case 2:
        return campaignRequirementSchema;
      case 3:
        return campaignImagesSchema;
      case 4:
        return timelineSchema;
      case 5:
        return campaignAdminSchema;
      default:
        return campaignSchema; // Assuming step 3 is the default or final step
    }
  };

  const savedData = localStorage.getItem('formData');

  const defaultValues = savedData ?? {
    hasBrand: false,
    campaignTitle: '',
    client: null,
    campaignBrand: null,
    campaignStartDate: null,
    campaignEndDate: null,
    campaignIndustries: null,
    campaignObjectives: '',
    campaignDescription: '',
    audienceGender: [],
    audienceAge: [],
    audienceLocation: [],
    audienceLanguage: [],
    audienceCreatorPersona: [],
    audienceUserPersona: '',
    socialMediaPlatform: [],
    videoAngle: [],

    campaignDo: [
      {
        value: '',
      },
    ],
    campaignDont: [
      {
        value: '',
      },
    ],
    campaignImages: [],
    adminManager: [],
    agreementFrom: null,
    timeline: [
      {
        timeline_type: {},
        id: '',
        duration: undefined,
        for: 'creator',
        startDate: '',
        endDate: '',
        isSubmissionNeeded: false,
      },
    ],
    campaignTasksAdmin: [],
    campaignTasksCreator: [{ id: '', name: '', dependency: '', dueDate: null, status: '' }],
  };

  const methods = useForm({
    resolver: yupResolver(getSchemaForStep(activeStep)),
    defaultValues,
    reValidateMode: 'onChange',
    mode: 'onChange',
  });

  const {
    handleSubmit,
    getValues,
    reset,
    control,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = methods;

  const values = watch();

  useEffect(() => {
    const data = JSON.stringify(values);

    localStorage.setItem('formData', data);
  }, [values]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();

      e.returnValue = ''; // Required for Chrome to show the alert
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const {
    append: doAppend,
    fields: doFields,
    remove: doRemove,
  } = useFieldArray({
    name: 'campaignDo',
    control,
  });

  const {
    append: dontAppend,
    fields: dontFields,
    remove: dontRemove,
  } = useFieldArray({
    name: 'campaignDont',
    control,
  });

  const timelineMethods = useFieldArray({
    name: 'timeline',
    control,
  });

  const audienceGeoLocation = watch('audienceLocation');

  const handleDropMultiFile = useCallback(
    (acceptedFiles) => {
      const files = values.campaignImages || [];

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue('campaignImages', [...files, ...newFiles]);
    },
    [setValue, values.campaignImages]
  );

  useEffect(() => {
    if (brandState !== '') {
      setValue('campaignBrand', brandState);
    }
  }, [brandState, setValue]);

  const handleNext = async () => {
    const result = await trigger();
    console.log(errors);

    if (result) {
      localStorage.setItem('activeStep', activeStep + 1);
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    localStorage.setItem('activeStep', activeStep - 1);
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

  function hasEmptyValue(obj) {
    // eslint-disable-next-line no-restricted-syntax
    for (const key in obj) {
      if (obj[key] === null || obj[key] === '') {
        return true;
      }
    }
    return false;
  }

  const onSubmit = handleSubmit(async (data, stage) => {
    const formData = new FormData();

    const adjustedData = {
      ...data,
      audienceLocation: data.audienceLocation.filter((item) => item !== 'Others'),
    };

    delete adjustedData.othersAudienceLocation;

    const combinedData = { ...adjustedData, ...{ campaignStage: stage } };

    formData.append('data', JSON.stringify(combinedData));
    // formData.append('agreementForm', data.agreementFrom);

    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (const i in data.campaignImages) {
      formData.append('campaignImages', data.campaignImages[i]);
    }

    try {
      setIsLoading(true);
      const res = await axiosInstance.post(endpoints.campaign.createCampaign, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setIsLoading(false);
      enqueueSnackbar(res?.data?.message, {
        variant: 'success',
      });
      reset();
      setActiveStep(0);
      localStorage.setItem('activeStep', 0);
    } catch (error) {
      enqueueSnackbar('Error creating campaign. Contact our admin', {
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  });

  const formFirstStep = (
    <Box
      gap={2}
      display="grid"
      mt={4}
      gridTemplateColumns={{
        xs: 'repeat(1, 1fr)',
        sm: 'repeat(2, 1fr)',
      }}
    >
      <RHFTextField name="campaignTitle" label="Campaign Title" />

      <RHFTextField
        name="campaignDescription"
        label="let us know more about the campaign"
        multiline
      />

      {/* <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {!companyLoading && (
          <RHFAutocomplete
            fullWidth
            name="campaignBrand"
            placeholder="Brand"
            options={!companyLoading ? (brandState ? [brandState] : options) : []}
            getOptionLabel={(option) => option.name || ''}
            noOptionsText={
              <Button
                variant="contained"
                size="small"
                fullWidth
                sx={{ mt: 2 }}
                onClick={handleOpenCompanyDialog}
              >
                Create client
              </Button>
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option) => {
              // eslint-disable-next-line react/prop-types
              const { key, ...optionProps } = props;

              if (!option.id) {
                return null;
              }

              return (
                <Stack component="li" key={key} direction="row" spacing={1} p={1} {...optionProps}>
                  <Avatar src={option?.logo} sx={{ width: 35, height: 35 }} />
                  <ListItemText primary={option.name} />
                </Stack>
              );
            }}
          />
        )}
      </Box> */}

      <RHFSelect name="campaignObjectives" label="Campaign Objectives">
        <MenuItem value="I'm launching a new product">I&apos;m launching a new product</MenuItem>
        <MenuItem value="I'm launching a new service">I&apos;m launching a new service</MenuItem>
        <MenuItem value="I want to drive brand awareness">I want to drive brand awareness</MenuItem>
        <MenuItem value="Want to drive product awareness">Want to drive product awareness</MenuItem>
      </RHFSelect>

      <RHFAutocomplete
        name="campaignIndustries"
        placeholder="Industries"
        disableCloseOnSelect
        options={interestsLists}
        // getOptionLabel={(option) => option || ''}
        // renderOption={(props, option) => (
        //   <li {...props} key={option}>
        //     {option}
        //   </li>
        // )}
        // renderTags={(selected, getTagProps) =>
        //   selected.map((option, index) => (
        //     <Chip
        //       {...getTagProps({ index })}
        //       key={option}
        //       label={option}
        //       size="small"
        //       color="info"
        //       variant="soft"
        //     />
        //   ))
        // }
      />

      <RHFTextField name="brandTone" label="Brand Tone" multiline />
      <RHFTextField name="productName" label="Product/Service Name" multiline />
    </Box>
  );

  const formSecondStep = (
    <Stack spacing={3}>
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
        <Typography variant="h4">Target Audience</Typography>
        <Box flexGrow={1} />
        <RHFMultiSelect
          name="audienceGender"
          checkbox
          chip
          options={[
            { value: 'female', label: 'Female' },
            { value: 'male', label: 'Male' },
            { value: 'nonbinary', label: 'Non-Binary' },
          ]}
          label="Audience Gender"
        />

        <RHFMultiSelect
          name="audienceAge"
          checkbox
          chip
          options={[
            { value: '18-25', label: '18-25' },
            { value: '26-34', label: '26-34' },
            { value: '35-40', label: '35-40' },
            { value: '>40', label: '>40' },
          ]}
          label="Audience Age"
        />

        <RHFMultiSelect
          name="audienceLocation"
          label="Audience City/Area"
          checkbox
          chip
          options={[
            { value: 'KlangValley', label: 'Klang Valley' },
            { value: 'Selangor', label: 'Selangor' },
            { value: 'KualaLumpur', label: 'Kuala Lumpur' },
            { value: 'MainCities', label: 'Main cities in Malaysia' },
            { value: 'EastMalaysia', label: 'East Malaysia' },
            { value: 'Others', label: 'Others' },
          ]}
        />

        {audienceGeoLocation?.includes('Others') && (
          <RHFTextField
            name="othersAudienceLocation"
            label="Specify Other Location"
            variant="outlined"
          />
        )}

        <RHFAutocomplete
          multiple
          disableCloseOnSelect
          name="audienceLanguage"
          label="Audience Language"
          options={langList.sort()}
          getOptionLabel={(option) => option || ''}
        />

        <RHFMultiSelect
          name="audienceCreatorPersona"
          label="Audience Creator Persona"
          checkbox
          chip
          options={interestsLists.map((item) => ({
            value: item.toLowerCase(),
            label: item,
          }))}
        />

        <RHFTextField
          name="audienceUserPersona"
          label="User Persona"
          placeholder=" let us know who you want your campaign to reach!"
        />

        {audienceGeoLocation === 'Others' && <Box flexGrow={1} />}
      </Box>

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      <RHFMultiSelect
        name="socialMediaPlatform"
        label="Social Media Platform"
        checkbox
        chip
        options={[
          { value: 'instagram', label: 'Instagram' },
          { value: 'tiktok', label: 'Tikok' },
        ]}
      />

      <RHFMultiSelect
        name="videoAngle"
        label="Video Angle"
        checkbox
        chip
        options={videoAngle.map((angle) => ({ value: angle, label: angle }))}
      />

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h5">Dos and Don&apos;ts</Typography>
        <Typography variant="caption" color="text.secondary">
          ( optional )
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Stack direction="column" spacing={2}>
            {doFields.map((item, index) => (
              <Stack key={item.id} direction="row" spacing={1} alignItems="center">
                <RHFTextField
                  name={`campaignDo[${index}].value`}
                  label={`Campaign Do's ${index + 1}`}
                />
                {index !== 0 && (
                  <IconButton color="error" onClick={() => doRemove(index)}>
                    <Iconify icon="ic:outline-delete" color="error.main" />
                  </IconButton>
                )}
              </Stack>
            ))}

            <Button variant="contained" onClick={() => doAppend({ value: '' })}>
              Add Do
            </Button>
          </Stack>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Stack direction="column" spacing={2}>
            {dontFields.map((item, index) => (
              <Stack key={item.id} direction="row" spacing={1} alignItems="center">
                <RHFTextField
                  name={`campaignDont[${index}].value`}
                  label={`Campaign Dont's ${index + 1}`}
                />
                {index !== 0 && (
                  <IconButton color="error" onClick={() => dontRemove(index)}>
                    <Iconify icon="ic:outline-delete" color="error.main" />
                  </IconButton>
                )}
              </Stack>
            ))}

            <Button variant="contained" onClick={() => dontAppend({ value: '' })}>
              Add Don&apos;t
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
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
      <Typography variant="h5">Select Admin Manager</Typography>

      <RHFAutocomplete
        name="adminManager"
        multiple
        placeholder="Admin Manager"
        options={
          (admins &&
            admins.map((admin) => ({
              id: admin?.id,
              name: admin?.name,
              role: admin?.admin?.role?.name,
            }))) ||
          []
        }
        freeSolo
        isOptionEqualToValue={(option, value) => option.id === value.id}
        getOptionLabel={(option) => `${option.name} - ${option.role}`}
        renderTags={(selected, getTagProps) =>
          selected.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option?.id}
              label={option?.id === user?.id ? 'Me' : option?.name || ''}
              size="small"
              color="info"
              variant="soft"
            />
          ))
        }
      />
    </Box>
  );

  const imageUpload = (
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
      <Typography variant="h4">Upload Campaign Images</Typography>
      <RHFUpload
        multiple
        thumbnail
        name="campaignImages"
        maxSize={3145728}
        onDrop={handleDropMultiFile}
        onRemove={(inputFile) =>
          setValue(
            'campaignImages',
            values.campaignImages && values.campaignImages?.filter((file) => file !== inputFile),
            { shouldValidate: true }
          )
        }
        onRemoveAll={() => setValue('campaignImages', [], { shouldValidate: true })}
        // onUpload={() => console.info('ON UPLOAD')}
      />
    </Box>
  );

  const handleDropSingleFile = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      if (newFile) {
        setValue('agreementFrom', newFile, { shouldValidate: true });
      }
    },
    [setValue]
  );

  const a = watch('agreementFrom');

  // const formUpload = (
  //   // <Box
  //   //   sx={{
  //   //     display: 'flex',
  //   //     flexDirection: 'column',
  //   //     justifyContent: 'center',
  //   //     alignContent: 'center',
  //   //     gap: 3,
  //   //     p: 3,
  //   //   }}
  //   // >
  //   //   <Stack direction="row" spacing={1} alignItems="center">
  //   //     <Typography variant="h5">Upload Template Agreement</Typography>
  //   //     <Typography variant="caption" color="text.secondary">
  //   //       ( Make sure the template agreement has a signature )
  //   //     </Typography>
  //   //   </Stack>

  //   //   <RHFUpload
  //   //     type="doc"
  //   //     name="agreementFrom"
  //   //     onDrop={handleDropSingleFile}
  //   //     onDelete={() => setValue('singleUpload', null, { shouldValidate: true })}
  //   //   />

  //   //   {a && (
  //   //     <Button variant="outlined" color="error" onClick={() => setValue('agreementFrom', '')}>
  //   //       Remove
  //   //     </Button>
  //   //   )}
  //   // </Box>
  //   <>{pdf && <PdfViewer file={pdf} totalPages={pages} pageNumber={1} scale={1.5} />}</>
  // );

  function getStepContent(step) {
    switch (step) {
      case 0:
        return <SelectBrand openCompany={openCompany} openBrand={openBrand} />;
      case 1:
        return formFirstStep;
      case 2:
        return formSecondStep;
      case 3:
        return imageUpload;
      case 4:
        return (
          <>
            {defaultTimelineLoading ? (
              <BarLoader />
            ) : (
              <SelectTimeline
                defaultTimelines={defaultTimelines}
                setValue={setValue}
                timelineMethods={timelineMethods}
                watch={watch}
              />
            )}
          </>
        );
      case 5:
        return formSelectAdminManager;
      case 6:
        return (
          <FormUpload userId={user.id} user={user} modal={pdfModal} setAgreementForm={setValue} />
        );
      default:
        return 'Unknown step';
    }
  }

  const startDate = getValues('campaignStartDate');
  const campaignStartDate = watch('campaignStartDate');

  return (
    <Box
      sx={{
        boxShadow: (theme) => theme.customShadows.z20,
        borderRadius: '20px',
        mt: 3,
        bgcolor: 'background.paper',
        p: { xs: 1, md: 3 },
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Stepper
          sx={{
            pt: 2,
            m: 1,
          }}
          activeStep={activeStep}
          orientation="vertical"
        >
          {steps.map((label, index) => {
            const stepProps = {};
            const labelProps = {};
            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>{label}</StepLabel>
                <StepContent>
                  {getStepContent(activeStep)}
                  {activeStep !== steps.length - 1 && (
                    <Stack mt={2} direction="row" gap={2}>
                      <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        variant="outlined"
                        size="small"
                      >
                        Back
                      </Button>

                      <Button variant="contained" size="small" onClick={handleNext}>
                        Next
                      </Button>
                    </Stack>
                  )}
                </StepContent>
              </Step>
            );
          })}
        </Stepper>

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
            }}
          >
            <Box sx={{ my: 1 }}>
              {activeStep === steps.length - 1 && (
                <Box sx={{ display: 'flex', m: 2, direction: { xs: 'column', md: 'row' } }}>
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
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                      <LoadingButton
                        variant="outlined"
                        onClick={() => onSubmit('DRAFT')}
                        startIcon={<Iconify icon="hugeicons:license-draft" width={16} />}
                        loading={isLoading}
                      >
                        Draft
                      </LoadingButton>
                      {dayjs(campaignStartDate).isSame(dayjs(), 'date') ? (
                        <LoadingButton
                          variant="contained"
                          color="primary"
                          onClick={() => onSubmit('ACTIVE')}
                          startIcon={<Iconify icon="material-symbols:publish" width={16} />}
                          loading={isLoading}
                        >
                          Publish now
                        </LoadingButton>
                      ) : (
                        <LoadingButton
                          variant="contained"
                          color="primary"
                          onClick={() => onSubmit('SCHEDULED')}
                          startIcon={<Iconify icon="material-symbols:publish" width={16} />}
                          loading={isLoading}
                        >
                          Schedule on {dayjs(startDate).format('ddd LL')}
                        </LoadingButton>
                      )}
                    </Stack>
                  ) : (
                    <Button variant="contained" onClick={handleNext}>
                      Next
                    </Button>
                  )}
                </Box>
              )}
              {/* </FormProvider> */}
            </Box>
          </Paper>
        </Box>
      </FormProvider>

      {/* Modal */}
      {/* <CreateBrand
        open={openCompanyDialog}
        onClose={handleCloseCompanyDialog}
        setBrand={setValue}
      /> */}

      <CreateBrand
        open={openBrand.value}
        onClose={() => {
          if (getValues('campaignBrand')?.inputValue) {
            setValue('campaignBrand', null);
          }
          openBrand.onFalse();
        }}
        brandName={getValues('campaignBrand')?.inputValue}
        setBrand={(e) => setValue('campaignBrand', e)}
        client={getValues('client')}
      />

      <CreateCompany
        open={openCompany.value}
        onClose={() => {
          if (getValues('client')?.inputValue) {
            setValue('client', null);
          }
          openCompany.onFalse();
        }}
        companyName={getValues('client')?.inputValue}
        setCompany={(e) => setValue('client', e)}
      />

      <TimelineTypeModal open={modal.value} onClose={modal.onFalse} />
      <PDFEditorModal
        open={pdfModal.value}
        onClose={pdfModal.onFalse}
        user={user}
        setAgreementForm={setValue}
      />
    </Box>
  );
}
export default CreateCampaignForm;

const FormUpload = ({ userId, modal, setAgreementForm }) => {
  const { data, isLoading: templateLoading } = useGetTemplate(userId);
  const [pages, setPages] = useState();

  useEffect(() => {
    if (!templateLoading && data) {
      setAgreementForm('agreementForm', data?.template?.url);
    }
  }, [data, setAgreementForm, templateLoading]);

  const refreshPdf = () => {
    mutate(endpoints.agreementTemplate.byId(userId));
  };

  return (
    <>
      {templateLoading && (
        <Box display="flex" justifyContent="center">
          <CircularProgress size={30} />
        </Box>
      )}

      {!templateLoading && !data && (
        <>
          <Alert severity="warning" variant="outlined">
            Template Not found
          </Alert>

          <Box textAlign="center" my={4}>
            <Button
              size="medium"
              variant="contained"
              onClick={modal.onTrue}
              startIcon={<Iconify icon="icon-park-outline:agreement" width={20} />}
            >
              Generate a new Agreement Template
            </Button>
          </Box>
        </>
      )}

      {!templateLoading && data && (
        <>
          <Alert severity="success" variant="outlined">
            Template found
          </Alert>

          <Box
            my={2}
            sx={{
              display: 'flex',
              gap: 1,
              justifyContent: 'end',
            }}
          >
            <Button size="small" variant="contained" onClick={refreshPdf}>
              Refresh
            </Button>
            <Button size="small" variant="contained" onClick={modal.onTrue}>
              Regenerate agreement template
            </Button>
          </Box>

          {/* <Box my={4} maxHeight={500} overflow="auto" textAlign="center">
            <PDFViewer width="100%" height={500}>
              <AgreementTemplate
                ADMIN_IC_NUMBER={data?.template?.adminICNumber}
                ADMIN_NAME={data?.template?.adminName}
                SIGNATURE={data?.template?.signURL}
              />
            </PDFViewer>
          </Box> */}

          <Box my={4} maxHeight={500} overflow="auto" textAlign="center">
            <Box
              sx={{
                display: 'inline-block',
              }}
            >
              <Document
                file={data?.template?.url}
                onLoadSuccess={({ numPages }) => setPages(numPages)}
              >
                <Stack spacing={2}>
                  {Array(pages)
                    .fill()
                    .map((_, index) => (
                      <Page key={index} pageIndex={index} pageNumber={index + 1} scale={1} />
                    ))}
                </Stack>
              </Document>
            </Box>
          </Box>
        </>
      )}
    </>
  );
};

FormUpload.propTypes = {
  userId: PropTypes.string,
  modal: PropTypes.object,
  setAgreementForm: PropTypes.func,
};

const stepsPDF = ['Fill in missing information', 'Digital Signature'];

export const PDFEditorModal = ({ open, onClose, user, campaignId, setAgreementForm }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [url, setURL] = useState('');
  const loadingProcess = useBoolean();
  const [file, setFile] = useState('');
  const [signURL, setSignURL] = useState('');
  const [annotations, setAnnotations] = useState([]);
  const loading = useBoolean();
  const signRef = useRef(null);

  const smDown = useResponsive('down', 'sm');

  const schema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    icNumber: Yup.string().required('IC Number is required.'),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: user?.name || '',
      icNumber: '',
    },
    reValidateMode: 'onChange',
    mode: 'onChange',
  });

  const { handleSubmit, watch } = methods;

  const { name, icNumber } = watch();

  const processPdf = async () => {
    const blob = await pdf(
      <AgreementTemplate ADMIN_IC_NUMBER={icNumber} ADMIN_NAME={name} />
    ).toBlob();

    const pdfUrl = URL.createObjectURL(blob);

    return pdfUrl;
  };

  const handleNext = async () => {
    if (activeStep !== stepsPDF.length - 1) {
      if (name && icNumber) {
        try {
          loadingProcess.onTrue();
          const test = await processPdf();
          setURL(test);
          setActiveStep(activeStep + 1);
        } catch (error) {
          console.log(error);
        } finally {
          loadingProcess.onFalse();
        }
      }
    }
  };

  const handlePrev = () => {
    if (activeStep !== 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const downloadPdf = async () => {
    try {
      const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());

      const image = await fetch(signURL).then((res) => res.arrayBuffer());

      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const jpgImage = await pdfDoc.embedPng(image);

      // Add annotations to the PDF
      annotations.forEach((annotation) => {
        const page = pdfDoc.getPages()[annotation.page - 1];

        page.drawImage(jpgImage, {
          x: annotation.x,
          y: page.getHeight() - annotation.y - annotation.height,
          width: annotation.width,
          height: annotation.height,
        });
      });

      const pdfBytes = await pdfDoc.save();

      // Create a blob and trigger the download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const signImage = new Blob([image], { type: 'image/png' });
      return { blob, signImage };
    } catch (error) {
      throw new Error(error);
    }
    // const urll = URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = urll;
    // a.download = 'annotated.pdf';
    // document.body.appendChild(a);
    // a.click();
    // document.body.removeChild(a);
    // URL.revokeObjectURL(url); // Clean up the URL object
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      loading.onTrue();
      const { blob: agreementBlob, signImage } = await downloadPdf();

      const response = await fetch(signURL);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('data', JSON.stringify({ ...user, ...data, campaignId }));
      formData.append('signedAgreement', agreementBlob);
      formData.append('signatureImage', blob);

      const res = await axiosInstance.post(
        endpoints.campaign.agreementTemplate(user.id),
        formData,
        {
          headers: {
            'Content-Type': 'multiple/form-data',
          },
        }
      );
      setAgreementForm('agreementFrom', res?.data?.templateURL);
      enqueueSnackbar(res?.data?.message);
      onClose();
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      loading.onFalse();
    }
  });

  return (
    <Dialog open={open} maxWidth="md" fullWidth fullScreen={smDown}>
      <FormProvider methods={methods}>
        <DialogTitle>Agreement Generator</DialogTitle>
        <DialogContent>
          <Box>
            <Stepper activeStep={activeStep}>
              {stepsPDF.map((label, index) => {
                const stepProps = {};
                const labelProps = {};
                return (
                  <Step key={label} {...stepProps}>
                    <StepLabel {...labelProps}>{label}</StepLabel>
                  </Step>
                );
              })}
            </Stepper>
            <Box mt={4}>
              {activeStep === 0 && (
                <Stack gap={1.5} py={2}>
                  <RHFTextField name="name" label="Name" />
                  <RHFTextField name="icNumber" label="IC Number" />
                </Stack>
              )}
              {activeStep === 1 && (
                <Box>
                  {/* <Box
                    p={5}
                    position="relative"
                    sx={{
                      border: 1,
                      borderRadius: 2,
                    }}
                  >
                    <ReactSignatureCanvas
                      ref={signRef}
                      penColor="black"
                      canvasProps={{
                        style: {
                          backgroundColor: 'white',
                          width: '100%',
                          cursor: 'crosshair',
                        },
                      }}
                    />

                    <Typography
                      variant="h3"
                      color="text.secondary"
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%,-50%)',
                        opacity: 0.2,
                        userSelect: 'none',
                        pointerEvents: 'none',
                      }}
                    >
                      Sign Here
                    </Typography>
                  </Box> */}
                  <PDFEditor
                    file={url}
                    annotations={annotations}
                    setAnnotations={setAnnotations}
                    setSignURL={setSignURL}
                    signURL={signURL}
                  />
                  <Button onClick={() => signRef.current.clear()}>Clear</Button>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          {activeStep === 0 ? (
            <Button onClick={onClose} variant="outlined" size="small" color="error">
              Cancel
            </Button>
          ) : (
            <Button onClick={handlePrev} variant="outlined" size="small">
              Back
            </Button>
          )}

          {activeStep === stepsPDF.length - 1 ? (
            <LoadingButton color="success" size="small" onClick={onSubmit} loading={loading.value}>
              Save
            </LoadingButton>
          ) : (
            <LoadingButton onClick={handleNext} loading={loadingProcess.value}>
              Next
            </LoadingButton>
          )}
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

PDFEditorModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  user: PropTypes.object,
  campaignId: PropTypes.string,
  setAgreementForm: PropTypes.func,
};
