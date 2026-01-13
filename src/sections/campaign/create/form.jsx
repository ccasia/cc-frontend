/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-vars */
import dayjs from 'dayjs';
import * as Yup from 'yup';
import { pdfjs } from 'react-pdf';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import 'react-pdf/dist/Page/TextLayer.css';
import { enqueueSnackbar } from 'notistack';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { yupResolver } from '@hookform/resolvers/yup';
import { lazy, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import {
  Stack,
  Avatar,
  Dialog,
  IconButton,
  Typography,
  ListItemText,
  LinearProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetCompany from 'src/hooks/use-get-company';
import useGetDefaultTimeLine from 'src/hooks/use-get-default-timeline';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form';

import PackageCreateDialog from 'src/sections/packages/package-dialog';
import LogisticRemarks from 'src/sections/campaign/create/steps/logistic-remarks';
import CampaignLogistics from 'src/sections/campaign/create/steps/campaign-logistics';
import ReservationSlotsV2 from 'src/sections/campaign/create/steps/reservation-slots';
import CreateCompany from 'src/sections/brand/create/brandForms/FirstForms/create-company';

import CreateBrand from './brandDialog';
import SelectBrand from './steps/select-brand';
import GeneralCampaign from './steps/general-campaign';
import CampaignDetails from './steps/campaign-details';
import FinaliseCampaign from './steps/finalise-campaign';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;
// new URL(
//   `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`,
//   import.meta.url
// ).toString();

const steps = [
  { title: 'Select a Client or Brand', logo: '👾', color: '#D8FF01' },
  { title: 'Campaign Information', logo: '💬', color: '#8A5AFE' },
  { title: 'Target Audience', logo: '👥', color: '#FFF0E5' },
  // HIDE: logistics
  { title: 'Logistics (Optional)', logo: '📦', color: '#D8FF01' },
  { title: 'Reservation Slots', logo: '🗓️', color: '#D8FF01' },
  { title: 'Additional Logistic Remarks ( Optional )', logo: '✏️', color: '#D8FF01' },
  { title: 'Finalise Campaign', logo: '🖇📝', color: '#FF3500' },
];

const PDFEditor = lazy(() => import('./pdf-editor'));

function CreateCampaignForm({ onClose, mutate: mutateCampaignList }) {
  const { user } = useAuthContext();
  const openCompany = useBoolean();
  const openBrand = useBoolean();
  const confirmation = useBoolean();
  const openPackage = useBoolean();

  const { data: companyListData, mutate: mutateCompanyList } = useGetCompany();
  const { data: defaultTimelines } = useGetDefaultTimeLine();

  const [status, setStatus] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [brandState, setBrandState] = useState('');
  const [hasCreditError, setHasCreditError] = useState(false);

  const pdfModal = useBoolean();

  const campaignSchema = Yup.object().shape({
    campaignIndustries: Yup.array()
      .min(1, 'At least one industry is required')
      .required('Campaign Industry is required.'),
    campaignDescription: Yup.string().required('Campaign Description is required.'),
    campaignTitle: Yup.string()
      .required('Campaign title is required')
      .max(40, 'Campaign title must be 40 characters or less'),
    campaignObjectives: Yup.array()
      .min(1, 'At least one objective is required')
      .required('Campaign objectives is required'),
    brandTone: Yup.string().required('Brand tone is required'),
    // productName: Yup.string().required('Product or Service name is required.'),
    audienceAge: Yup.array().min(1, 'At least one option').required('Audience age is required'),
    audienceGender: Yup.array()
      .min(1, 'At least one option')
      .required('Audience Gender is required'),
    country: Yup.string().required('Country is required'),
    audienceLocation: Yup.array().when('country', {
      is: 'Malaysia',
      then: (schema) =>
        schema.min(1, 'At least one option').required('Audience location is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    othersAudienceLocation: Yup.string(),
    audienceLanguage: Yup.array()
      .min(1, 'At least one option')
      .required('Audience language is required'),
    audienceCreatorPersona: Yup.array()
      .min(1, 'At least one option')
      .required('Audience creator persona is required'),
    audienceUserPersona: Yup.string(),
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
    campaignManager: Yup.array()
      .min(1, 'At least 1 manager is required')
      .required('Campaign Manager is required'),
    campaignCredits: Yup.number()
      .min(1, 'Minimum need to be 1')
      .required('Campaign credits is required'),
  });

  const campaignInformationSchema = Yup.object().shape({
    campaignIndustries: Yup.array()
      .min(1, 'At least one industry is required')
      .required('Campaign Industry is required.'),
    campaignDescription: Yup.string().required('Campaign Description is required.'),
    campaignTitle: Yup.string()
      .required('Campaign title is required')
      .max(40, 'Campaign title must be 40 characters or less'),
    campaignObjectives: Yup.array()
      .min(1, 'At least one objective is required')
      .required('Campaign objectives is required'),
    brandTone: Yup.string().required('Brand tone is required'),
    productName: Yup.string(),
  });

  const campaignRequirementSchema = Yup.object().shape({
    audienceAge: Yup.array().min(1, 'At least one option').required('Audience age is required'),
    audienceGender: Yup.array()
      .min(1, 'At least one option')
      .required('Audience Gender is required'),
    country: Yup.string().required('Country is required'),
    audienceLocation: Yup.array().when('country', {
      is: 'Malaysia',
      then: (schema) =>
        schema.min(1, 'At least one option').required('Audience location is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    othersAudienceLocation: Yup.string(),
    audienceLanguage: Yup.array()
      .min(1, 'At least one option')
      .required('Audience language is required'),
    audienceCreatorPersona: Yup.array()
      .min(1, 'At least one option')
      .required('Audience creator persona is required'),
    audienceUserPersona: Yup.string(),
    socialMediaPlatform: Yup.array().min(1, 'At least one option'),
    videoAngle: Yup.array().min(1, 'At least one option'),
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

  const finaliseCampaignSchema = Yup.object().shape({
    campaignManager: Yup.array()
      .min(1, 'At least 1 manager is required')
      .required('Campaign Manager is required'),
    campaignType: Yup.string().required('Campaign type is required.'),
    deliverables: Yup.array()
      .min(1, 'At least one deliverable is required')
      // .test('has-ugc-videos', 'UGC Videos is required', (value) => value?.includes('UGC_VIDEOS'))
      .required('Deliverables are required'),
    campaignImages: Yup.array()
      .min(1, 'Must have at least 1 image')
      .max(3, 'Must have at most 3 images'),
    rawFootage: Yup.boolean(),
    photos: Yup.boolean(),
    ads: Yup.boolean(),
    referencesLinks: Yup.array().notRequired(),
    otherAttachments: Yup.array().notRequired(),
  });

  const clientSchema = Yup.object().shape({
    client: Yup.object().required('Client is required.'),
    campaignBrand: Yup.object()
      .nullable()
      .when('client', {
        is: (val) => val?.type === 'agency',
        then: (s) => s.required('Brand is required.'),
        otherwise: (s) => s,
      }),
    campaignCredits: Yup.number()
      .min(1, 'Minimum need to be 1')
      .required('Campaign credits is required'),
  });

  const logisticsSchema = Yup.object().shape({
    logisticsType: Yup.string(),
    products: Yup.array().when('logisticsType', {
      is: 'PRODUCT_DELIVERY',
      then: (schema) =>
        schema
          .of(
            Yup.object().shape({
              name: Yup.string().required('Product name is required'),
            })
          )
          .min(1, 'At least one product is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    logisticRemarks: Yup.string(),
    // locations: Yup.array().notRequired(),

    // venueName: Yup.string().when('logisticsType', {
    //   is: 'RESERVATION',
    //   then: (schema) => schema,
    //   otherwise: (schema) => schema,
    // }),
    // venueAddress: Yup.string().when('logisticsType', {
    //   is: 'RESERVATION',
    //   then: (schema) => schema,
    //   otherwise: (schema) => schema,
    // }),
    // reservationNotes: Yup.string().when('logisticsType', {
    //   is: 'RESERVATION',
    //   then: (schema) => schema,
    //   otherwise: (schema) => schema,
    // }),
    locations: Yup.array().when('logisticsType', {
      is: 'RESERVATION',
      then: (schema) =>
        schema
          .of(
            Yup.object().shape({
              name: Yup.string().trim().required('Location name is required'),
            })
          )
          .min(1, 'At least one location is required'),
      otherwise: (schema) => schema.notRequired(),
    }),

    venueName: Yup.string(),
    venueAddress: Yup.string(),
    reservationNotes: Yup.string(),
  });

  const reservationSlotsSchema = Yup.object().shape({
    availabilityRules: Yup.array()
      .of(
        Yup.object().shape({
          dates: Yup.array().min(1, 'Please select at least one date').required(),
          slots: Yup.array()
            .of(
              Yup.object().shape({
                startTime: Yup.string().required(),
                endTime: Yup.string().required(),
                label: Yup.string().nullable(), // Allow null/empty labels
              })
            )
            .min(1, 'Please add at least one time slot')
            .required(),
        })
      )
      .min(1, 'At least one reservation rule is required')
      .required(),
  });

  const getSchemaForStep = (step) => {
    switch (step) {
      case 0:
        return clientSchema;
      case 1:
        return campaignInformationSchema;
      case 2:
        return campaignRequirementSchema;
      // HIDE: Logistics
      case 3:
        return logisticsSchema;
      case 4:
        // return Yup.object().shape({});
        return reservationSlotsSchema;
      case 5:
        return Yup.object().shape({});
      case 6:
        return finaliseCampaignSchema;
      default:
        return campaignSchema;
    }
  };

  const defaultValues = {
    hasBrand: false,
    campaignTitle: '',
    client: null,
    country: '',
    campaignBrand: null,
    logisticsType: '',
    logisticRemarks: '',
    schedulingOption: 'confirmation',
    products: [{ name: '' }],
    locations: [{ name: '' }],
    campaignStartDate: null,
    campaignEndDate: null,
    postingStartDate: null,
    postingEndDate: null,
    campaignIndustries: '',
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
    campaignManager: [],
    agreementFrom: null,
    campaignTasksAdmin: [],
    campaignTasksCreator: [{ id: '', name: '', dependency: '', dueDate: null, status: '' }],
    otherAttachments: [],
    referencesLinks: [],
    campaignType: '',
    deliverables: ['UGC_VIDEOS'],
    rawFootage: false,
    photos: false,
    availabilityRules: [],
    campaignCredits: null,
    isV4Submission: false,
    submissionVersion: 'v2',
  };

  const methods = useForm({
    resolver: yupResolver(getSchemaForStep(activeStep)),
    defaultValues,
    mode: 'onChange',
    // reValidateMode: 'onChange',
  });

  const {
    handleSubmit,
    getValues,
    reset,
    setValue,
    watch,
    trigger,
    formState: { isValid, errors },
  } = methods;

  useEffect(() => {
    if (brandState !== '') {
      setValue('campaignBrand', brandState);
    }
  }, [brandState, setValue]);

  const handleNext = async () => {
    // setActiveStep((prevActiveStep) => prevActiveStep + 1);
    const result = await trigger();
    if (result) {
      // Skip Reservation Slots and Logistic Remarks steps if logistics type is not 'reservation'
      const logisticsType = getValues('logisticsType');
      // const nextStep = activeStep + 1; // HIDE: logistics

      // HIDE: Logistics
      let nextStep = activeStep + 1;
      if (activeStep === 3 && logisticsType !== 'RESERVATION') {
        nextStep = 6; // Skip to Campaign Timeline (skip both Reservation Slots and Logistic Remarks)
      }

      localStorage.setItem('activeStep', nextStep);
      setActiveStep(nextStep);
    }
  };

  const handleBack = () => {
    const logisticsType = getValues('logisticsType');
    // const prevStep = activeStep - 1; // HIDE: Logistics

    // HIDE: Logistics
    let prevStep = activeStep - 1;
    if (activeStep === 6 && logisticsType !== 'RESERVATION') {
      prevStep = 3;
    }

    localStorage.setItem('activeStep', prevStep);
    setActiveStep(prevStep);
  };

  const onSubmit = handleSubmit(async (data, stage) => {
    const formData = new FormData();
    // console.log('form data', formData);

    // NOTE: Need to set default timeline here because of form change
    const startDateVal = data.campaignStartDate ? dayjs(data.campaignStartDate) : dayjs();
    const { campaignType } = data;

    // Process default timelines based on campaign type
    let processedTimelines = [];
    if (defaultTimelines && defaultTimelines.length > 0) {
      // Filter out 'Posting' for UGC campaigns (no posting)
      const filteredTimelines =
        campaignType === 'ugc'
          ? defaultTimelines.filter((timeline) => timeline?.timelineType?.name !== 'Posting')
          : defaultTimelines;

      // Sort by order and map to expected format
      processedTimelines = filteredTimelines
        .sort((a, b) => a.order - b.order)
        .map((elem) => ({
          timeline_type: { id: elem?.timelineType?.id, name: elem?.timelineType?.name },
          id: elem?.id,
          duration: elem.duration,
          for: elem?.for,
          startDate: '',
          endDate: '',
        }));
    }

    // Get posting dates from form data
    const postingStartDateVal = data.postingStartDate ? dayjs(data.postingStartDate) : null;
    const postingEndDateVal = data.postingEndDate ? dayjs(data.postingEndDate) : null;

    // Calculate dates for each timeline item based on duration
    let currentStartDate = startDateVal;
    const timelinesWithDates = processedTimelines.map((item) => {
      // For "Posting" timeline, use the posting dates from form if provided
      if (item.timeline_type?.name === 'Posting' && postingStartDateVal && postingEndDateVal) {
        return {
          ...item,
          startDate: postingStartDateVal.format('ddd LL'),
          endDate: postingEndDateVal.format('ddd LL'),
        };
      }

      const itemStartDate = currentStartDate;
      const itemEndDate = currentStartDate.add(parseInt(item.duration || 7, 10), 'day');
      currentStartDate = itemEndDate;

      return {
        ...item,
        startDate: itemStartDate.format('ddd LL'),
        endDate: itemEndDate.format('ddd LL'),
      };
    });

    // Fallback timeline if API doesn't return data
    const fallbackTimeline = [
      {
        id: 1,
        name: 'Open For Pitch',
        timeline_type: { name: 'Open For Pitch' },
        startDate: startDateVal.format('ddd LL'),
        endDate: startDateVal.add(15, 'day').format('ddd LL'),
        duration: 15,
        for: 'creator',
      },
      {
        id: 1,
        name: 'Agreement',
        timeline_type: { name: 'Agreement' },
        startDate: startDateVal.add(15, 'day').format('ddd LL'),
        endDate: startDateVal.add(16, 'day').format('ddd LL'),
        duration: 1,
        for: 'creator',
      },
      {
        id: 2,
        name: 'First Draft',
        timeline_type: { name: 'First Draft' },
        startDate: startDateVal.add(16, 'day').format('ddd LL'),
        endDate: startDateVal.add(18, 'day').format('ddd LL'),
        duration: 2,
        for: 'creator',
      },
      {
        id: 3,
        name: 'Final Draft',
        timeline_type: { name: 'Final Draft' },
        startDate: startDateVal.add(18, 'day').format('ddd LL'),
        endDate: startDateVal.add(20, 'day').format('ddd LL'),
        duration: 2,
        for: 'creator',
      },
      ...(campaignType !== 'ugc'
        ? [
            {
              id: 4,
              name: 'Posting',
              timeline_type: { name: 'Posting' },
              startDate: postingStartDateVal ? postingStartDateVal.format('ddd LL') : startDateVal.add(20, 'day').format('ddd LL'),
              endDate: postingEndDateVal ? postingEndDateVal.format('ddd LL') : startDateVal.add(22, 'day').format('ddd LL'),
              duration: 2,
              for: 'creator',
            },
          ]
        : []),
    ];

    const timeline = timelinesWithDates.length > 0 ? timelinesWithDates : fallbackTimeline;

    const adjustedData = {
      ...data,
      audienceLocation: data.audienceLocation.filter((item) => item !== 'Others'),
      rawFootage: data.deliverables.includes('RAW_FOOTAGES'), // Convert based on deliverables
      photos: data.deliverables.includes('PHOTOS'),
      ads: data.deliverables.includes('ADS'),
      crossPosting: data.deliverables.includes('CROSS_POSTING'),
      timeline, // Add the generated timeline
      // Convert arrays to comma-separated strings for schema compatibility
      campaignIndustries: Array.isArray(data.campaignIndustries)
        ? data.campaignIndustries.join(', ')
        : data.campaignIndustries,
      campaignObjectives: Array.isArray(data.campaignObjectives)
        ? data.campaignObjectives.join(', ')
        : data.campaignObjectives,
    };

    console.log('Adjusted Data before sending:', adjustedData); // Debug log

    // Append data correctly to FormData
    formData.append('rawFootage', adjustedData.rawFootage ? 'true' : 'false');
    formData.append('photos', adjustedData.photos ? 'true' : 'false');

    const combinedData = { ...adjustedData, ...{ campaignStage: stage } };

    formData.append('data', JSON.stringify(combinedData));

    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (const i in data.campaignImages) {
      formData.append('campaignImages', data.campaignImages[i]);
    }

    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (const i in data.otherAttachments) {
      formData.append('otherAttachments', data.otherAttachments[i]);
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
      if (mutateCampaignList) {
        mutateCampaignList();
      }
      setStatus('');
      confirmation.onFalse();
      setActiveStep(0);
      localStorage.setItem('activeStep', 0);
    } catch (error) {
      if (error) {
        enqueueSnackbar(error, {
          variant: 'error',
        });
      } else {
        enqueueSnackbar('Error creating campaign. Contact our admin', {
          variant: 'error',
        });
      }
    } finally {
      setIsLoading(false);
    }
  });

  const getStepContent = useCallback(
    (step) => {
      switch (step) {
        case 0:
          return (
            <SelectBrand
              openCompany={openCompany}
              openBrand={openBrand}
              openPackage={openPackage}
              onValidationChange={setHasCreditError}
            />
          );
        case 1:
          return <GeneralCampaign />;
        case 2:
          return <CampaignDetails />;
        // HIDE: logistics
        case 3:
          return <CampaignLogistics />;
        case 4:
          return <ReservationSlotsV2 />;
        case 5:
          return <LogisticRemarks />;
        case 6:
          return <FinaliseCampaign />;
        default:
          return <SelectBrand />;
      }
    },
    [openCompany, openBrand, openPackage]
  );

  const handlePackageLinkSuccess = async () => {
    const currentClientId = getValues('client')?.id;

    openPackage.onFalse();
    enqueueSnackbar('Package linked successfully!', { variant: 'success' });

    const newCompanyList = await mutateCompanyList();

    if (newCompanyList && currentClientId) {
      const updatedClient = newCompanyList.find((c) => c.id === currentClientId);

      if (updatedClient) {
        setValue('client', updatedClient, { shouldValidate: true });
      }
    }
  };

  const startDate = getValues('campaignStartDate');
  const campaignStartDate = watch('campaignStartDate');

  return (
    <Box>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <IconButton
            sx={{
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              border: 1,
              borderRadius: 1,
              borderColor: '#E7E7E7',
            }}
            color="default"
            variant="outlined"
            onClick={onClose}
          >
            <Iconify icon="ic:round-close" />
          </IconButton>

          <Box
            sx={{
              position: 'absolute',
              top: 20,
              left: '50%',
              bgcolor: 'wheat',
              transform: 'translateX(-50%)',
            }}
          >
            <LinearProgress
              variant="determinate"
              value={Math.floor(((activeStep + 1) / steps.length) * 100)}
              sx={{
                width: 150,
                bgcolor: '#E7E7E7',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#1340FF', // Custom color
                },
              }}
            />
          </Box>

          <Stack direction="row" alignItems="center" spacing={1}>
            {activeStep !== 0 && (
              <Button
                variant="contained"
                sx={{
                  boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                  py: 1,
                }}
                onClick={handleBack}
              >
                Back
              </Button>
            )}
            {activeStep === steps.length - 1 ? (
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                {/* <LoadingButton
                  variant="outlined"
                  onClick={() => onSubmit('DRAFT')}
                  startIcon={<Iconify icon="hugeicons:license-draft" width={16} />}
                  loading={isLoading}
                >
                  Draft
                </LoadingButton> */}
                {dayjs(campaignStartDate).isSame(dayjs(), 'date') ? (
                  <LoadingButton
                    variant="outlined"
                    onClick={() => {
                      setStatus('ACTIVE');
                      confirmation.onTrue();
                    }}
                    startIcon={<Iconify icon="material-symbols:publish" width={16} />}
                    disabled={!isValid}
                    sx={{
                      boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                      bgcolor: '#1340FF',
                      color: 'whitesmoke',
                      py: 1,
                      '&:hover': {
                        bgcolor: '#1340FF',
                      },
                    }}
                  >
                    Publish now
                  </LoadingButton>
                ) : (
                  <LoadingButton
                    variant="outlined"
                    onClick={() => {
                      setStatus('SCHEDULED');
                      confirmation.onTrue();
                    }}
                    startIcon={<Iconify icon="material-symbols:publish" width={16} />}
                    disabled={!isValid}
                    sx={{
                      boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                      bgcolor: '#1340FF',
                      color: 'whitesmoke',
                      py: 1,
                      '&:hover': {
                        bgcolor: '#1340FF',
                      },
                    }}
                  >
                    Schedule on {dayjs(startDate).format('ddd LL')}
                  </LoadingButton>
                )}
              </Stack>
            ) : (
              <Button
                variant="contained"
                sx={{
                  boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                  py: 1,
                }}
                disabled={!isValid || errors?.campaignCredit || hasCreditError}
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Stack>
        </Stack>

        <Box sx={{ height: '85vh', overflow: 'auto', mt: 1, scrollbarWidth: 'thin' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              mt: 10,
              maxWidth: 1000,
              width: 1,
              mx: 'auto',
              overflow: 'auto',
            }}
          >
            <Stack alignItems="center" spacing={2}>
              <Avatar
                sx={{ bgcolor: steps[activeStep].color, width: 60, height: 60, fontSize: 35 }}
              >
                {steps[activeStep].logo}
              </Avatar>
              <Typography
                sx={{
                  fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                  fontSize: 35,
                  textAlign: 'center',
                }}
              >
                {steps[activeStep].title}
              </Typography>
            </Stack>

            <Box mt={1} mb={5} overflow="auto" minHeight={400}>
              {getStepContent(activeStep)}
            </Box>
          </Box>
        </Box>

        <Dialog
          open={confirmation.value}
          fullWidth
          maxWidth="xs"
          PaperProps={{
            bgcolor: 'background.paper',
          }}
        >
          <Box
            sx={{
              borderRadius: 2,
              boxShadow: 24,
              p: 4,
              textAlign: 'center',
            }}
          >
            <Avatar
              src="/assets/images/notification/markread.png"
              alt="archive"
              sx={{
                width: 60,
                height: 60,
                margin: '0 auto 16px',
                backgroundColor: '#ffeb3b',
              }}
            />

            <ListItemText
              primary="Confirm campaign"
              secondary="Are you sure you’re ready to publish your campaign?"
              primaryTypographyProps={{
                fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                fontSize: 40,
              }}
              secondaryTypographyProps={{
                variant: 'body1',
              }}
              sx={{ mb: 2 }}
            />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <LoadingButton
                variant="contained"
                fullWidth
                onClick={() => {
                  if (status) {
                    onSubmit(status);
                  }
                }}
                loading={isLoading}
                sx={{
                  fontWeight: 'bold',
                  backgroundColor: '#3A3A3C',
                  boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                  py: 1,
                  '&:hover': {
                    backgroundColor: '#3A3A3C',
                  },
                }}
              >
                Yes
              </LoadingButton>
              <Button
                variant="outlined"
                fullWidth
                sx={{ fontWeight: 'bold', py: 1 }}
                onClick={() => {
                  setStatus('');
                  confirmation.onFalse();
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Dialog>
      </FormProvider>

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
        setOpenCreate={() => openCompany.onFalse()}
        openCreate={openCompany.value}
        set={setValue}
        isForCampaign
      />

      {/* // <CreateCompany
      //   open={openCompany.value}
      //   onClose={() => {
      //     if (getValues('client')?.inputValue) {
      //       setValue('client', null);
      //     }
      //     openCompany.onFalse();
      //   }}
      //   companyName={getValues('client')?.inputValue}
      //   setCompany={(e) => setValue('client', e)}
      // /> */}

      <PackageCreateDialog
        open={openPackage.value}
        onClose={openPackage.onFalse}
        onRefresh={handlePackageLinkSuccess}
        setValue={setValue}
        clientId={getValues('client')?.id}
      />

      <PDFEditor
        open={pdfModal.value}
        onClose={pdfModal.onFalse}
        user={user}
        setAgreementForm={setValue}
      />
    </Box>
  );
}
export default CreateCampaignForm;

CreateCampaignForm.propTypes = {
  onClose: PropTypes.func,
  mutate: PropTypes.func,
};