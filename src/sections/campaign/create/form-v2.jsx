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
import React, { lazy, useState, useEffect, useCallback } from 'react';

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
import { NextStepsIcon } from 'src/assets/icons';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form';

import PackageCreateDialog from 'src/sections/packages/package-dialog';
import LogisticRemarks from 'src/sections/campaign/create/steps/logistic-remarks';
import CampaignLogistics from 'src/sections/campaign/create/steps/campaign-logistics';
import ReservationSlotsV2 from 'src/sections/campaign/create/steps/reservation-slots';
import CreateCompany from 'src/sections/brand/create/brandForms/FirstForms/create-company';

import CreateBrand from './brandDialog';
// Import V2 step components
import SelectBrand from './stepsV2/select-brand';
import NextSteps from './stepsV2/next-steps';
import CampaignObjective from './stepsV2/campaign-objective';
import AdditionalDetails1 from './stepsV2/additional-details-1';
import AdditionalDetails2 from './stepsV2/additional-details-2';
import CampaignGeneralInfo from './stepsV2/campaign-general-info';
import CampaignTargetAudience from './stepsV2/campaign-target-audience';
import FinaliseCampaign from './stepsV2/finalise-campaign';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;

// Base internal steps (includes sub-steps for logistics)
// Visual indicator maps: 0=Client/Brand, 1=General, 2=Objective, 3=Audience, 4-6=Logistics, 7=Finalise, 8=Next Steps
const baseSteps = [
  { title: 'Select a Client or Brand', logo: '👾', color: '#D8FF01', indicatorIndex: 0 },
  { title: 'General Campaign Information', logo: '💬', color: '#8A5AFE', indicatorIndex: 1 },
  { title: 'Campaign Objectives', logo: '🎯', color: '#026D54', indicatorIndex: 2 },
  { title: 'Target Audience', logo: '👥', color: '#FFF0E5', indicatorIndex: 3 },
  { title: 'Logistics (Optional)', logo: '📦', color: '#D8FF01', indicatorIndex: 4 },
  { title: 'Reservation Slots', logo: '🗓️', color: '#D8FF01', indicatorIndex: 4 },
  { title: 'Additional Logistic Remarks', logo: '✏️', color: '#D8FF01', indicatorIndex: 4 },
  { title: 'Finalise Campaign', logo: '📝', color: '#FF3500', indicatorIndex: 5 },
  { title: 'Next Steps', logo: '👣', color: '#D8FF01', indicatorIndex: 6 },
];

// Additional detail steps that appear after clicking "Continue Additional Details"
const additionalSteps = [
  { title: 'Additional Details 1', logo: '📝', color: '#FF3500', indicatorIndex: 7 },
  { title: 'Additional Details 2', logo: '📝', color: '#D8FF01', indicatorIndex: 8 },
];

const getSteps = (showAdditionalDetails) =>
  showAdditionalDetails ? [...baseSteps, ...additionalSteps] : baseSteps;

const backSectionLabels = ['Client', 'General', 'Objective', 'Audience', 'Logistics', 'Finalise', 'Next Steps'];

const frontSectionLabels = ['Additional 1', 'Additional 2'];

const backSectionIndicatorToStepMap = {
  0: 0, // Client/Brand
  1: 1, // General
  2: 2, // Objective
  3: 3, // Audience
  4: 4, // Logistics (first sub-step)
  5: 7, // Finalise
  6: 8, // Next Steps
};

const frontSectionIndicatorToStepMap = {
  0: 9, // Additional Details 1
  1: 10, // Additional Details 2
};

// Determine if we're in back section (steps 0-8) or front section (steps 9-10)
const isInFrontSection = (activeStep) => activeStep >= 9;
const isInBackSection = (activeStep) => activeStep <= 8;

// Get which indicator is active in back section
const getBackSectionIndicatorIndex = (internalStep) => {
  if (internalStep >= 8) return 6; // Next Steps
  if (internalStep >= 7) return 5; // Finalise
  if (internalStep >= 4) return 4; // Logistics (includes sub-steps 4, 5, 6)
  return internalStep; // 0, 1, 2, 3 map directly
};

// Get which indicator is active in front section (0 for Details 1, 1 for Details 2)
const getFrontSectionIndicatorIndex = (internalStep) => {
  if (internalStep >= 10) return 1; // Additional Details 2
  return 0; // Additional Details 1
};

const PDFEditor = lazy(() => import('./pdf-editor'));

function CreateCampaignFormV2({ onClose, mutate: mutateCampaignList }) {
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
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);

  const pdfModal = useBoolean();

  // Derive steps based on showAdditionalDetails state
  const steps = getSteps(showAdditionalDetails);

  // Determine if we're in the front or back section
  const inFrontSection = isInFrontSection(activeStep);
  const inBackSection = isInBackSection(activeStep);

  // Client/Brand selection schema (Step 0)
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

  // General Campaign Information schema (Step 1)
  const campaignInformationSchema = Yup.object().shape({
    campaignIndustries: Yup.array()
      .min(1, 'At least one industry is required')
      .required('Campaign industry is required.'),
    campaignDescription: Yup.string().required('Campaign Description is required.'),
    campaignName: Yup.string()
      .required('Campaign title is required')
      .max(40, 'Campaign title must be 40 characters or less'),
    campaignImages: Yup.array()
      .min(1, 'Must have at least 1 image')
      .max(3, 'Must have at most 3 images'),
    campaignStartDate: Yup.date().required('Campaign Start Date is required.'),
    campaignEndDate: Yup.date().required('Campaign End Date is required.'),
    brandTone: Yup.string(),
    brandAbout: Yup.string(),
    productName: Yup.string(),
    websiteLink: Yup.string(),
  });

  // Campaign Objectives schema (Step 2)
  const objectiveSchema = Yup.object().shape({
    campaignObjectives: Yup.string().required('Campaign objective is required'),
    secondaryObjectives: Yup.array().max(2, 'You can select up to 2 secondary objectives'),
    boostContent: Yup.string(),
    primaryKPI: Yup.string(),
    performanceBaseline: Yup.string(),
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

  // Target Audience schema (Step 3)
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
    // Secondary Audience - all optional
    secondaryAudienceGender: Yup.array(),
    secondaryAudienceAge: Yup.array(),
    secondaryAudienceLanguage: Yup.array(),
    secondaryAudienceCreatorPersona: Yup.array(),
    secondaryAudienceUserPersona: Yup.string(),
    geographicFocus: Yup.string(),
    geographicFocusOthers: Yup.string(),
  });

  // Logistics schema (Step 4)
  const logisticsSchema = Yup.object().shape({
    logisticsType: Yup.string().nullable(),
    allowMultipleBookings: Yup.boolean(),
    products: Yup.array().when('logisticsType', {
      is: 'PRODUCT_DELIVERY',
      then: (schema) =>
        schema.test('at-least-one-product', 'Fill at least one product', (value) =>
          value?.some((p) => p.name?.trim().length > 0)
        ),
      otherwise: (schema) => schema.notRequired(),
    }),
    clientRemarks: Yup.string(),
    locations: Yup.array().when('logisticsType', {
      is: 'RESERVATION',
      then: (schema) =>
        schema
          .of(
            Yup.object().shape({
              name: Yup.string().trim().notRequired(),
              pic: Yup.string().notRequired(),
              contactNumber: Yup.string().notRequired(),
            })
          )
          .test('at-least-one-location', 'At least one outlet is required', (value) =>
            value?.some((l) => l.name?.trim().length > 0)
          ),
      otherwise: (schema) => schema.notRequired(),
    }),
    venueName: Yup.string(),
    venueAddress: Yup.string(),
    reservationNotes: Yup.string(),
  });

  // Reservation Slots schema (Step 5)
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
                label: Yup.string().nullable(),
              })
            )
            .min(1, 'Please add at least one time slot')
            .required(),
        })
      )
      .min(1, 'At least one reservation rule is required')
      .required(),
  });

  // Finalise Campaign schema (Step 7)
  const finaliseCampaignSchema = Yup.object().shape({
    campaignManager: Yup.array()
      .min(1, 'At least 1 manager is required')
      .required('Campaign Manager is required'),
    campaignType: Yup.string().required('Campaign type is required.'),
    deliverables: Yup.array()
      .min(1, 'At least one deliverable is required')
      .required('Deliverables are required'),
    rawFootage: Yup.boolean(),
    photos: Yup.boolean(),
  });

  // Next Steps schema (Step 8) - no validation, just navigation
  const nextStepsSchema = Yup.object().shape({});

  // Additional Details 1 schema (Step 9) - optional
  const additionalDetails1Schema = Yup.object().shape({});

  // Additional Details 2 schema (Step 10) - optional
  const additionalDetails2Schema = Yup.object().shape({});

  const getSchemaForStep = (step) => {
    switch (step) {
      case 0:
        return clientSchema;
      case 1:
        return campaignInformationSchema;
      case 2:
        return objectiveSchema;
      case 3:
        return campaignRequirementSchema;
      case 4:
        return logisticsSchema;
      case 5:
        return reservationSlotsSchema;
      case 6:
        return Yup.object().shape({}); // Logistic remarks - optional
      case 7:
        return finaliseCampaignSchema;
      case 8:
        return nextStepsSchema;
      case 9:
        return additionalDetails1Schema;
      case 10:
        return additionalDetails2Schema;
      default:
        return Yup.object().shape({});
    }
  };

  const defaultValues = {
    // Client/Brand selection
    hasBrand: false,
    client: null,
    campaignBrand: null,
    campaignCredits: null,
    // General Campaign Info
    campaignName: '',
    campaignDescription: '',
    campaignStartDate: null,
    campaignEndDate: null,
    campaignIndustries: [],
    brandTone: '',
    brandAbout: '',
    productName: '',
    websiteLink: '',
    campaignImages: [],
    // Campaign Objectives
    campaignObjectives: '',
    secondaryObjectives: [],
    boostContent: '',
    primaryKPI: '',
    performanceBaseline: '',
    campaignDo: [{ value: '' }],
    campaignDont: [{ value: '' }],
    // Target Audience
    country: '',
    audienceGender: [],
    audienceAge: [],
    audienceLocation: [],
    othersAudienceLocation: '',
    audienceLanguage: [],
    audienceCreatorPersona: [],
    audienceUserPersona: '',
    // Secondary Audience
    secondaryAudienceUserPersona: '',
    secondaryAudienceGender: [],
    secondaryAudienceAge: [],
    secondaryAudienceLocation: [],
    secondaryOthersAudienceLocation: '',
    secondaryAudienceLanguage: [],
    secondaryAudienceCreatorPersona: [],
    secondaryCountry: '',
    geographicFocus: '',
    geographicFocusOthers: '',
    // Logistics
    logisticsType: '',
    clientRemarks: '',
    allowMultipleBookings: false,
    schedulingOption: 'confirmation',
    products: [{ name: '' }],
    locations: [{ name: '', pic: '', contactNumber: '' }],
    availabilityRules: [],
    venueName: '',
    venueAddress: '',
    reservationNotes: '',
    // Finalise Campaign
    campaignManager: [],
    agreementFrom: null,
    campaignType: '',
    deliverables: ['UGC_VIDEOS'],
    rawFootage: false,
    photos: false,
    ads: false,
    otherAttachments: [],
    referencesLinks: [],
    postingStartDate: null,
    postingEndDate: null,
    socialMediaPlatform: [],
    videoAngle: [],
    isV4Submission: false,
    submissionVersion: 'v2',
    // Additional Details 1
    contentFormat: [],
    mainMessage: '',
    keyPoints: '',
    toneAndStyle: '',
    brandGuidelines: null,
    referenceContent: '',
    productImage1: [],
    productImage2: [],
    // Additional Details 2
    hashtagsToUse: '',
    mentionsTagsRequired: '',
    creatorCompensation: '',
    ctaDesiredAction: '',
    ctaLinkUrl: '',
    ctaPromoCode: '',
    ctaLinkInBioRequirements: '',
    specialNotesInstructions: '',
    needAds: '',
  };

  const methods = useForm({
    resolver: yupResolver(getSchemaForStep(activeStep)),
    defaultValues,
    mode: 'onChange',
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
    if (brandState) {
      setValue('campaignBrand', brandState);
    }
  }, [brandState, setValue]);

  // Get fields to validate for each step
  const getFieldsForStep = (step) => {
    switch (step) {
      case 0: // Client/Brand
        return ['client', 'campaignCredits'];
      case 1: // General
        return [
          'campaignName',
          'campaignDescription',
          'campaignIndustries',
          'campaignImages',
          'campaignStartDate',
          'campaignEndDate',
        ];
      case 2: // Objective
        return ['campaignObjectives', 'campaignDo', 'campaignDont'];
      case 3: // Audience
        return [
          'country',
          'audienceAge',
          'audienceGender',
          'audienceLanguage',
          'audienceCreatorPersona',
        ];
      case 4: // Logistics
        return ['logisticsType'];
      case 5: // Reservation Slots
        return ['availabilityRules'];
      case 6: // Logistic Remarks
        return [];
      case 7: // Finalise
        return ['campaignManager', 'campaignType', 'deliverables'];
      case 8: // Next Steps
        return [];
      case 9: // Additional Details 1
        return [];
      case 10: // Additional Details 2
        return [];
      default:
        return [];
    }
  };

  const handleNext = async () => {
    // Only validate fields for the current step
    const fieldsToValidate = getFieldsForStep(activeStep);
    const result = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;

    if (result && !hasCreditError) {
      const logisticsType = getValues('logisticsType');
      let nextStep = activeStep + 1;

      // Handle logistics sub-step navigation
      if (activeStep === 4) {
        // From Logistics step, skip to Finalise if not RESERVATION type
        if (logisticsType !== 'RESERVATION') {
          nextStep = 7; // Skip to Finalise
        }
        // Otherwise go to step 5 (Reservation Slots)
      } else if (activeStep === 5) {
        // From Reservation Slots, go to Logistic Remarks
        nextStep = 6;
      } else if (activeStep === 6) {
        // From Logistic Remarks, go to Finalise
        nextStep = 7;
      } else if (activeStep === 7) {
        // From Finalise, go to Next Steps
        nextStep = 8;
      } else if (activeStep === 9) {
        // From Additional Details 1, go to Additional Details 2
        nextStep = 10;
      }

      localStorage.setItem('adminActiveStep', nextStep);
      setActiveStep(nextStep);
    }
  };

  // Handle clicking on step indicator to navigate directly
  const handleBackSectionStepClick = (indicatorIndex) => {
    const currentBackIndicator = getBackSectionIndicatorIndex(activeStep);
    if (indicatorIndex <= currentBackIndicator && activeStep <= 8) {
      const targetStep = backSectionIndicatorToStepMap[indicatorIndex];
      setActiveStep(targetStep);
      localStorage.setItem('adminActiveStep', targetStep);
    }
  };

  const handleFrontSectionStepClick = (indicatorIndex) => {
    const currentFrontIndicator = getFrontSectionIndicatorIndex(activeStep);
    // Allow navigation to any indicator that has been visited or previous indicators
    if (indicatorIndex <= currentFrontIndicator && activeStep >= 9) {
      const targetStep = frontSectionIndicatorToStepMap[indicatorIndex];
      setActiveStep(targetStep);
      localStorage.setItem('adminActiveStep', targetStep);
    }
  };

  const handleBack = () => {
    const logisticsType = getValues('logisticsType');
    let prevStep = activeStep - 1;

    if (activeStep === 10) {
      // From Additional Details 2, go to Additional Details 1
      prevStep = 9;
    } else if (activeStep === 9) {
      // From Additional Details 1, go back to Next Steps
      prevStep = 8;
    } else if (activeStep === 8) {
      // From Next Steps, go back to Finalise and hide additional details
      prevStep = 7;
      setShowAdditionalDetails(false);
    } else if (activeStep === 7) {
      // From Finalise, go back based on logistics type
      if (logisticsType === 'RESERVATION') {
        prevStep = 6; // Go to Logistic Remarks
      } else {
        prevStep = 4; // Go back to Logistics
      }
    } else if (activeStep === 6) {
      // From Logistic Remarks, go to Reservation Slots
      prevStep = 5;
    } else if (activeStep === 5) {
      // From Reservation Slots, go to Logistics
      prevStep = 4;
    }

    localStorage.setItem('adminActiveStep', prevStep);
    setActiveStep(prevStep);
  };

  // Handle clicking "Continue Additional Details" from Next Steps
  const handleContinueAdditionalDetails = () => {
    setShowAdditionalDetails(true);
    setActiveStep(9);
    localStorage.setItem('adminActiveStep', 9);
  };

  const onSubmit = handleSubmit(async (data, stage) => {
    const formData = new FormData();

    const startDateVal = data.campaignStartDate ? dayjs(data.campaignStartDate) : dayjs();
    const { campaignType } = data;

    // Process default timelines based on campaign type
    let processedTimelines = [];
    if (defaultTimelines && defaultTimelines.length > 0) {
      const filteredTimelines =
        campaignType === 'ugc'
          ? defaultTimelines.filter((timeline) => timeline?.timelineType?.name !== 'Posting')
          : defaultTimelines;

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
              startDate: postingStartDateVal
                ? postingStartDateVal.format('ddd LL')
                : startDateVal.add(20, 'day').format('ddd LL'),
              endDate: postingEndDateVal
                ? postingEndDateVal.format('ddd LL')
                : startDateVal.add(22, 'day').format('ddd LL'),
              duration: 2,
              for: 'creator',
            },
          ]
        : []),
    ];

    const timeline = timelinesWithDates.length > 0 ? timelinesWithDates : fallbackTimeline;

    // Build campaign data object
    const campaignData = {
      ...data,
      audienceLocation: data.audienceLocation.filter((item) => item !== 'Others'),
      rawFootage: data.deliverables.includes('RAW_FOOTAGES'),
      photos: data.deliverables.includes('PHOTOS'),
      ads: data.deliverables.includes('ADS'),
      crossPosting: data.deliverables.includes('CROSS_POSTING'),
      timeline,
      campaignIndustries: Array.isArray(data.campaignIndustries)
        ? data.campaignIndustries.join(', ')
        : data.campaignIndustries,
      campaignObjectives: data.campaignObjectives || '',
      products: data.products?.filter((p) => p.name?.trim().length > 0) || [],
      allowMultipleBookings: !!data.allowMultipleBookings,
      reservationConfig: {
        mode: data.schedulingOption,
        locations: data.locations,
        availabilityRules: data.availabilityRules,
        allowMultipleBookings: !!data.allowMultipleBookings,
      },
      campaignStage: stage,
      // Additional details
      secondaryObjectives: Array.isArray(data.secondaryObjectives)
        ? data.secondaryObjectives
        : [],
      boostContent: data.boostContent || '',
      primaryKPI: data.primaryKPI || '',
      performanceBaseline: data.performanceBaseline || '',
      // Secondary audience
      secondaryAudienceGender: Array.isArray(data.secondaryAudienceGender)
        ? data.secondaryAudienceGender
        : [],
      secondaryAudienceAge: Array.isArray(data.secondaryAudienceAge)
        ? data.secondaryAudienceAge
        : [],
      secondaryAudienceLocation: Array.isArray(data.secondaryAudienceLocation)
        ? data.secondaryAudienceLocation.filter((item) => item !== 'Others')
        : [],
      secondaryAudienceLanguage: Array.isArray(data.secondaryAudienceLanguage)
        ? data.secondaryAudienceLanguage
        : [],
      secondaryAudienceCreatorPersona: Array.isArray(data.secondaryAudienceCreatorPersona)
        ? data.secondaryAudienceCreatorPersona
        : [],
      secondaryAudienceUserPersona: data.secondaryAudienceUserPersona || '',
      secondaryCountry: data.secondaryCountry || '',
      geographicFocus: data.geographicFocus || '',
      geographicFocusOthers: data.geographicFocusOthers || '',
      // Additional Details 1 fields
      contentFormat: Array.isArray(data.contentFormat) ? data.contentFormat : [],
      mainMessage: data.mainMessage || '',
      keyPoints: data.keyPoints || '',
      toneAndStyle: data.toneAndStyle || '',
      referenceContent: data.referenceContent || '',
      // Additional Details 2 fields
      hashtagsToUse: data.hashtagsToUse || '',
      mentionsTagsRequired: data.mentionsTagsRequired || '',
      creatorCompensation: data.creatorCompensation || '',
      ctaDesiredAction: data.ctaDesiredAction || '',
      ctaLinkUrl: data.ctaLinkUrl || '',
      ctaPromoCode: data.ctaPromoCode || '',
      ctaLinkInBioRequirements: data.ctaLinkInBioRequirements || '',
      specialNotesInstructions: data.specialNotesInstructions || '',
      needAds: data.needAds || '',
      // Use form value - 'v2' by default, 'v4' if admin enables client campaign toggle
      submissionVersion: data.submissionVersion || 'v2',
    };

    formData.append('rawFootage', campaignData.rawFootage ? 'true' : 'false');
    formData.append('photos', campaignData.photos ? 'true' : 'false');
    formData.append('data', JSON.stringify(campaignData));

    // Append images
    for (const i in data.campaignImages) {
      if (data.campaignImages[i] instanceof File || data.campaignImages[i].type) {
        formData.append('campaignImages', data.campaignImages[i]);
      }
    }

    // Append other attachments
    for (const i in data.otherAttachments) {
      formData.append('otherAttachments', data.otherAttachments[i]);
    }

    // Append brand guidelines files if available
    if (data.brandGuidelines && Array.isArray(data.brandGuidelines)) {
      for (let i = 0; i < data.brandGuidelines.length; i += 1) {
        if (data.brandGuidelines[i] instanceof File || data.brandGuidelines[i].type) {
          formData.append('brandGuidelines', data.brandGuidelines[i]);
        }
      }
    }

    // Append product images
    if (data.productImage1 && Array.isArray(data.productImage1)) {
      for (let i = 0; i < data.productImage1.length; i += 1) {
        if (data.productImage1[i] instanceof File || data.productImage1[i].type) {
          formData.append('productImage1', data.productImage1[i]);
        }
      }
    }

    if (data.productImage2 && Array.isArray(data.productImage2)) {
      for (let i = 0; i < data.productImage2.length; i += 1) {
        if (data.productImage2[i] instanceof File || data.productImage2[i].type) {
          formData.append('productImage2', data.productImage2[i]);
        }
      }
    }

    try {
      setIsLoading(true);
      const res = await axiosInstance.post(endpoints.campaign.createCampaignV2, formData, {
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
      localStorage.setItem('adminActiveStep', 0);
      onClose();
    } catch (error) {
      console.error('API Error:', error);
      let errorMessage = 'Error creating campaign. Contact our admin';

      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'No response received from server';
      } else {
        errorMessage = error.message || errorMessage;
      }

      enqueueSnackbar(errorMessage, { variant: 'error' });
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
          return <CampaignGeneralInfo />;
        case 2:
          return <CampaignObjective />;
        case 3:
          return <CampaignTargetAudience />;
        case 4:
          return <CampaignLogistics />;
        case 5:
          return <ReservationSlotsV2 />;
        case 6:
          return <LogisticRemarks />;
        case 7:
          return <FinaliseCampaign />;
        case 8:
          return (
            <NextSteps
              onPublish={() => {
                const campaignStart = getValues('campaignStartDate');
                const campaignStatus = dayjs(campaignStart).isSame(dayjs(), 'date')
                  ? 'ACTIVE'
                  : 'SCHEDULED';
                setStatus(campaignStatus);
                // Directly trigger form submission with the campaign status
                onSubmit(campaignStatus);
              }}
              onContinueAdditionalDetails={handleContinueAdditionalDetails}
              isLoading={isLoading}
            />
          );
        case 9:
          return <AdditionalDetails1 />;
        case 10:
          return <AdditionalDetails2 />;
        default:
          return null;
      }
    },
    [openCompany, openBrand, openPackage, confirmation, isLoading, getValues]
  );

  // Check if current step has required fields filled
  const isStepValid = () => {
    switch (activeStep) {
      case 0: {
        const client = getValues('client');
        const credits = getValues('campaignCredits');
        const brand = getValues('campaignBrand');
        // If client is agency type, brand is required
        if (client?.type === 'agency' && !brand) return false;
        return client && credits && credits > 0 && !hasCreditError;
      }
      case 1: {
        const title = getValues('campaignName');
        const desc = getValues('campaignDescription');
        const industries = getValues('campaignIndustries');
        const images = getValues('campaignImages');
        const startDate = getValues('campaignStartDate');
        const endDate = getValues('campaignEndDate');
        return (
          title && desc && industries?.length > 0 && images?.length > 0 && startDate && endDate
        );
      }
      case 2: {
        const objectives = getValues('campaignObjectives');
        const dos = getValues('campaignDo');
        const donts = getValues('campaignDont');
        return objectives && dos?.length > 0 && donts?.length > 0;
      }
      case 3: {
        const country = getValues('country');
        const age = getValues('audienceAge');
        const gender = getValues('audienceGender');
        const language = getValues('audienceLanguage');
        const persona = getValues('audienceCreatorPersona');
        return country && age?.length > 0 && gender?.length > 0 && language?.length > 0 && persona?.length > 0;
      }
      case 4: {
        const type = getValues('logisticsType');
        if (!type) return true; // Optional step

        if (type === 'PRODUCT_DELIVERY') {
          const products = getValues('products');
          return products?.some((p) => p.name?.trim().length > 0);
        }

        if (type === 'RESERVATION') {
          const locations = getValues('locations');
          return locations?.some((l) => l.name?.trim().length > 0);
        }

        return true;
      }
      case 5: {
        const rules = getValues('availabilityRules');
        return rules?.length > 0;
      }
      case 6:
        return true; // Optional
      case 7: {
        const manager = getValues('campaignManager');
        const type = getValues('campaignType');
        const deliverables = getValues('deliverables');
        return manager?.length > 0 && type && deliverables?.length > 0;
      }
      case 8: // Next Steps - navigation only
      case 9:
      case 10:
        return true; // Optional
      default:
        return true;
    }
  };

  // Get the current indicator indices for both sections
  const backSectionIndicator = getBackSectionIndicatorIndex(activeStep);
  const frontSectionIndicator = getFrontSectionIndicatorIndex(activeStep);

  const startDate = getValues('campaignStartDate');
  const campaignStartDate = watch('campaignStartDate');

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

  return (
    <Box>
      <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <IconButton
            sx={{
              border: 1,
              borderRadius: 1,
              boxShadow: '0px -1.5px 0px 0px #E7E7E7 inset',
              borderColor: '#E7E7E7',
              height: 45,
              width: 45,
              padding: 1,
            }}
            size="large"
            disabled={isLoading}
            onClick={onClose}
          >
            <Iconify icon="material-symbols:close" width={20} color="#231F20" />
          </IconButton>

          {/* Step Indicator - Clickable navigation */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: { xs: '95%', sm: 900 },
              display: { xs: 'none', sm: 'flex' },
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              sx={{ width: '100%' }}
            >
              {/* Back Section (Client, General, Objective, Audience, Logistics, Finalise) */}
              {inBackSection &&
                backSectionLabels.map((label, index) => (
                  <React.Fragment key={label}>
                    <Box
                      onClick={() => handleBackSectionStepClick(index)}
                      sx={{
                        minWidth: 100,
                        height: 45,
                        py: 1.2,
                        textAlign: 'center',
                        borderRadius: 1,
                        fontSize: 13,
                        fontWeight: 400,
                        bgcolor:
                          backSectionIndicator === index
                            ? '#1340FF'
                            : backSectionIndicator > index
                              ? '#1340FF'
                              : '#fff',
                        color:
                          backSectionIndicator === index
                            ? '#fff'
                            : backSectionIndicator > index
                              ? '#fff'
                              : '#636366',
                        border: '1px solid #636366',
                        borderColor: backSectionIndicator >= index ? '#1340FF' : '#636366',
                        cursor: index <= backSectionIndicator ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          opacity: index <= backSectionIndicator ? 0.85 : 1,
                        },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Box component="span">{label}</Box>
                    </Box>
                    {/* Connector Line after each back section label */}
                    {index < backSectionLabels.length - 1 && (
                      <Box
                        sx={{
                          height: 1.2,
                          flexGrow: 1,
                          minWidth: 20,
                          maxWidth: 40,
                          bgcolor: backSectionIndicator > index ? '#1340FF' : '#636366',
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}

              {/* Front Section Labels (Additional Details 1, Additional Details 2) */}
              {inFrontSection && (
                <>
                  {/* Show Next Steps as clickable to go back */}
                  <Box
                    onClick={() => {
                      setActiveStep(8);
                      setShowAdditionalDetails(false);
                      localStorage.setItem('adminActiveStep', 8);
                    }}
                    sx={{
                      minWidth: 100,
                      height: 45,
                      py: 1.2,
                      textAlign: 'center',
                      borderRadius: 1,
                      fontSize: 13,
                      fontWeight: 400,
                      bgcolor: '#1340FF',
                      color: '#fff',
                      border: '1px solid #1340FF',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        opacity: 0.85,
                      },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Box component="span">Next Steps</Box>
                  </Box>
                  {frontSectionLabels.map((label, index) => (
                    <React.Fragment key={label}>
                      {/* Connector Line before each front section label */}
                      <Box
                        sx={{
                          height: 1.2,
                          flexGrow: 1,
                          minWidth: 20,
                          maxWidth: 40,
                          bgcolor: frontSectionIndicator >= index ? '#1340FF' : '#636366',
                        }}
                      />
                      <Box
                        onClick={() => handleFrontSectionStepClick(index)}
                        sx={{
                          minWidth: 100,
                          height: 45,
                          py: 1.2,
                          textAlign: 'center',
                          borderRadius: 1,
                          fontSize: 13,
                          fontWeight: 400,
                          bgcolor:
                            frontSectionIndicator === index
                              ? '#1340FF'
                              : frontSectionIndicator > index
                                ? '#1340FF'
                                : '#fff',
                          color:
                            frontSectionIndicator === index
                              ? '#fff'
                              : frontSectionIndicator > index
                                ? '#fff'
                                : '#636366',
                          border: '1px solid #636366',
                          borderColor: frontSectionIndicator >= index ? '#1340FF' : '#636366',
                          cursor: index <= frontSectionIndicator ? 'pointer' : 'default',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            opacity: index <= frontSectionIndicator ? 0.85 : 1,
                          },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Box component="span">{label}</Box>
                      </Box>
                    </React.Fragment>
                  ))}
                </>
              )}
            </Stack>
          </Box>

          {/* Navigation buttons */}
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{
              py: 3,
              display: { xs: 'none', md: 'flex' },
            }}
          >
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{
                mr: 1,
                height: 45,
                bgcolor: 'white',
                border: '1px solid #E7E7E7',
                color: '#3A3A3C',
                '&:hover': {
                  bgcolor: '#F8F8F8',
                  border: '1px solid #E7E7E7',
                },
                fontWeight: 600,
                boxShadow: '0px -1.5px 0px 0px rgba(0, 0, 0, 0.05) inset',
              }}
            >
              Back
            </Button>

            <Box sx={{ flexGrow: 1 }} />

            {/* Steps 0-7: Show Next button */}
            {activeStep >= 0 && activeStep <= 7 && (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isStepValid() || isLoading}
                sx={{
                  height: 45,
                  bgcolor: '#3A3A3C',
                  '&:hover': {
                    bgcolor: '#47474a',
                  },
                  boxShadow: '0px -1.5px 0px 0px rgba(0, 0, 0, 0.15) inset',
                  fontWeight: 600,
                }}
              >
                Next
              </Button>
            )}

            {/* Step 8 (Next Steps): No navigation buttons - handled by component */}

            {/* Step 9: Show Next and Confirm Campaign buttons */}
            {activeStep === 9 && (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepValid() || isLoading}
                  sx={{
                    height: 45,
                    bgcolor: '#3A3A3C',
                    '&:hover': {
                      bgcolor: '#47474a',
                    },
                    boxShadow: '0px -1.5px 0px 0px rgba(0, 0, 0, 0.15) inset',
                    fontWeight: 600,
                  }}
                >
                  Next
                </Button>
                <LoadingButton
                  variant="contained"
                  onClick={() => {
                    const campaignStatus = dayjs(campaignStartDate).isSame(dayjs(), 'date')
                      ? 'ACTIVE'
                      : 'SCHEDULED';
                    setStatus(campaignStatus);
                    // Directly trigger form submission with the campaign status
                    onSubmit(campaignStatus);
                  }}
                  disabled={isLoading || !isStepValid()}
                  sx={{
                    bgcolor: '#1340FF',
                    '&:hover': {
                      bgcolor: '#0030e0',
                    },
                    boxShadow: '0px -2px 0px 0px rgba(0, 0, 0, 0.15) inset',
                    fontWeight: 600,
                  }}
                >
                  {isLoading ? 'Creating Campaign...' : 'Confirm Campaign'}
                </LoadingButton>
              </Stack>
            )}

            {/* Step 10: Show only Confirm Campaign button (last step) */}
            {activeStep === 10 && (
              <LoadingButton
                variant="contained"
                onClick={() => {
                  const campaignStatus = dayjs(campaignStartDate).isSame(dayjs(), 'date')
                    ? 'ACTIVE'
                    : 'SCHEDULED';
                  setStatus(campaignStatus);
                  // Directly trigger form submission with the campaign status
                  onSubmit(campaignStatus);
                }}
                disabled={isLoading || !isStepValid()}
                sx={{
                  bgcolor: '#1340FF',
                  '&:hover': {
                    bgcolor: '#0030e0',
                  },
                  boxShadow: '0px -2px 0px 0px rgba(0, 0, 0, 0.15) inset',
                  fontWeight: 600,
                }}
              >
                {isLoading ? 'Creating Campaign...' : 'Confirm Campaign'}
              </LoadingButton>
            )}
          </Stack>
        </Stack>

        <Box
          sx={{
            height: '85vh',
            overflow: 'auto',
            mt: 1,
            scrollbarWidth: 'thin',
            pb: { xs: 10, md: 0 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              mt: 4,
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

      <PackageCreateDialog
        open={openPackage.value}
        onClose={openPackage.onFalse}
        companyId={getValues('client')?.id}
        companyName={getValues('client')?.name}
        onSuccess={handlePackageLinkSuccess}
      />

      {/* Loading Overlay for Campaign Creation */}
      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            bgcolor: 'white',
            borderRadius: 3,
            boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid #E7E7E7',
            p: 4,
            minWidth: 320,
            maxWidth: 400,
            textAlign: 'center',
          }}
        >
          {/* Loading Icon */}
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: '#FFD700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                zIndex: -1,
                animation: 'rotate 2s linear infinite',
              },
            }}
          >
            <Typography
              sx={{
                fontSize: 32,
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              ⏳
            </Typography>
          </Box>

          {/* Loading Text */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#3A3A3C',
              mb: 1.5,
              fontSize: '1.1rem',
              fontFamily: 'Instrument Serif, serif',
            }}
          >
            Creating Your Campaign
          </Typography>

          {/* Progress Bar */}
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: '#F2F2F7',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#1340FF',
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, #1340FF, #4A90E2)',
                },
              }}
            />
          </Box>

          {/* Status Text */}
          <Typography
            variant="caption"
            sx={{
              color: '#8E8E93',
              fontSize: '0.75rem',
              fontStyle: 'italic',
            }}
          >
            This may take a few moments...
          </Typography>
        </Box>
      )}

      <style>
        {`
          @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
}

export default CreateCampaignFormV2;

CreateCampaignFormV2.propTypes = {
  onClose: PropTypes.func,
  mutate: PropTypes.func,
};
