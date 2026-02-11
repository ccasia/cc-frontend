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
import React, { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import {
  Stack,
  Avatar,
  Dialog,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetCompany from 'src/hooks/use-get-company';
import useGetDefaultTimeLine from 'src/hooks/use-get-default-timeline';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import NextStepsIcon from 'src/assets/icons/next-steps-icon';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form';

import {
  NextSteps,
  LogisticRemarks,
  FinaliseCampaign,
  CampaignObjective,
  CampaignLogistics,
  AdditionalDetails1,
  AdditionalDetails2,
  ReservationSlotsV2,
  CampaignGeneralInfo,
  CampaignTargetAudience,
} from './stepsV2';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;

// Base internal steps (includes sub-steps for logistics)
// Visual indicator maps: 0=General, 1=Objective, 2=Audience, 3-5=Logistics, 6=Finalise, 7=Next Steps
const baseSteps = [
  { title: 'General Campaign Information', logo: '💬', color: '#8A5AFE', indicatorIndex: 0 },
  { title: 'Campaign Objectives', logo: '🎯', color: '#026D54', indicatorIndex: 1 },
  { title: 'Target Audience', logo: '👥', color: '#FFF0E5', indicatorIndex: 2 },
  { title: 'Logistics (Optional)', logo: '📦', color: '#D8FF01', indicatorIndex: 3 },
  { title: 'Reservation Slots', logo: '🗓️', color: '#D8FF01', indicatorIndex: 3 },
  { title: 'Additional Logistic Remarks', logo: '✏️', color: '#D8FF01', indicatorIndex: 3 },
  { title: 'Finalise Campaign', logo: '📝', color: '#FF3500', indicatorIndex: 4 },
  { title: 'Next Steps', logo: '👣', color: '#D8FF01', indicatorIndex: 5 },
];

// Additional detail steps that appear after clicking "Continue Additional Details"
const additionalSteps = [
  { title: 'Additional Details 1', logo: '📝', color: '#FF3500', indicatorIndex: 6 },
  { title: 'Additional Details 2', logo: '📝', color: '#D8FF01', indicatorIndex: 7 },
];

const getSteps = (showAdditionalDetails) =>
  showAdditionalDetails ? [...baseSteps, ...additionalSteps] : baseSteps;

const backSectionLabels = ['General', 'Objective', 'Audience', 'Logistics', 'Finalise'];

const frontSectionLabels = ['Additional 1', 'Additional 2'];

const backSectionIndicatorToStepMap = {
  0: 0, // General
  1: 1, // Objective
  2: 2, // Audience
  3: 3, // Logistics (first sub-step)
  4: 6, // Finalise
  5: 7, // Next Steps
};

const frontSectionIndicatorToStepMap = {
  0: 8, // Additional Details 1
  1: 9, // Additional Details 2
};

// Determine if we're in back section (steps 0-7) or front section (steps 8-9)
const isInFrontSection = (activeStep) => activeStep >= 8;
const isInBackSection = (activeStep) => activeStep <= 7;

// Get which indicator is active in back section
const getBackSectionIndicatorIndex = (internalStep) => {
  if (internalStep >= 7) return 5; // Next Steps
  if (internalStep >= 6) return 4; // Finalise
  if (internalStep >= 3) return 3; // Logistics (includes sub-steps 3, 4, 5)
  return internalStep; // 0, 1, 2 map directly
};

// Get which indicator is active in front section (0 for Details 1, 1 for Details 2)
const getFrontSectionIndicatorIndex = (internalStep) => {
  if (internalStep >= 9) return 1; // Additional Details 2
  return 0; // Additional Details 1
};

function CreateCampaignFormV2({ onClose, mutate: mutateCampaignList }) {
  const openCompany = useBoolean();
  const openBrand = useBoolean();
  const confirmation = useBoolean();
  const openPackage = useBoolean();

  const { user } = useAuthContext();

  const { data: companyListData, mutate: mutateCompanyList } = useGetCompany();
  const { data: defaultTimelines } = useGetDefaultTimeLine();

  const [status, setStatus] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [brandState, setBrandState] = useState('');
  const [hasCreditError, setHasCreditError] = useState(false);
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);

  const handleOpenConfirm = () => setConfirmOpen(true);
  const handleCloseConfirm = () => setConfirmOpen(false);

  // Derive steps based on showAdditionalDetails state
  const steps = getSteps(showAdditionalDetails);

  // Determine if we're in the front or back section
  const inFrontSection = isInFrontSection(activeStep);
  const inBackSection = isInBackSection(activeStep);

  // General Campaign Information schema (Step 0)
  const campaignInformationSchema = Yup.object().shape({
    campaignName: Yup.string()
      .required('Campaign title is required')
      .max(40, 'Campaign title must be 40 characters or less'),
    campaignDescription: Yup.string().required('Campaign Description is required.'),
    brandAbout: Yup.string(),
    campaignStartDate: Yup.date().required('Campaign Start Date is required.'),
    campaignEndDate: Yup.date().required('Campaign End Date is required.'),
    postingStartDate: Yup.date().required('Posting Start Date is required.'),
    postingEndDate: Yup.date().required('Posting End Date is required.'),
    productName: Yup.string().required('Product/service name required.'),
    campaignIndustries: Yup.array()
      .min(1, 'At least one industry is required')
      .required('Campaign industry is required.'),
    campaignImages: Yup.array().min(1, 'Must have at least 1 image'),
    websiteLink: Yup.string(),
  });

  // Campaign Objectives schema (Step 2)
  const objectiveSchema = Yup.object().shape({
    campaignObjectives: Yup.string().required('Campaign objective is required'),
    secondaryObjectives: Yup.array().max(2, 'You can select up to 2 secondary objectives'),
    boostContent: Yup.string(),
    primaryKPI: Yup.string(),
    performanceBaseline: Yup.string(),
  });

  // Target Audience schema (Step 3)
  const targetAudienceSchema = Yup.object().shape({
    audienceGender: Yup.array()
      .min(1, 'At least 1 option')
      .required('Audience Gender is required.'),
    audienceAge: Yup.array().min(1, 'At least 1 option').required('Audience age is required.'),
    country: Yup.string().required('Country is required.'),
    audienceLanguage: Yup.array()
      .min(1, 'At least 1 option')
      .required('Audience language is required.'),
    audienceCreatorPersona: Yup.array()
      .min(1, 'At least 1 option')
      .required('Audience creator interests is required.'),
    audienceUserPersona: Yup.string().required('Audience user persona is required.'),
    // Secondary Audience - all optional
    secondaryAudienceGender: Yup.array(),
    secondaryAudienceAge: Yup.array(),
    secondaryAudienceLanguage: Yup.array(),
    secondaryAudienceCreatorPersona: Yup.array(),
    secondaryAudienceUserPersona: Yup.string(),
    geographicFocus: Yup.string().required('Geographic focus is required.'),
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

  // Finalise Campaign schema (Step 6) - includes client/brand/credits fields
  const finaliseCampaignSchema = Yup.object().shape({
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
      .required('Campaign credits is required.'),
    campaignManager: Yup.array()
      .min(1, 'At least 1 manager is required.')
      .required('Campaign Manager is required.'),
    campaignType: Yup.string().required('Campaign type is required.'),
    deliverables: Yup.array()
      .min(1, 'At least one deliverable is required.')
      .required('Deliverables are required.'),
    rawFootage: Yup.boolean(),
    photos: Yup.boolean(),
  });

  // Next Steps schema (Step 7) - no validation, just navigation
  const nextStepsSchema = Yup.object().shape({});

  // Additional Details 1 schema (Step 8) - optional
  const additionalDetails1Schema = Yup.object().shape({});

  // Additional Details 2 schema (Step 9) - optional
  const additionalDetails2Schema = Yup.object().shape({});

  const getSchemaForStep = (step) => {
    switch (step) {
      case 0:
        return campaignInformationSchema;
      case 1:
        return objectiveSchema;
      case 2:
        return targetAudienceSchema;
      case 3:
        return logisticsSchema;
      case 4:
        return reservationSlotsSchema;
      case 5:
        return Yup.object().shape({}); // Logistic remarks - optional
      case 6:
        return finaliseCampaignSchema;
      case 7:
        return nextStepsSchema;
      case 8:
        return additionalDetails1Schema;
      case 9:
        return additionalDetails2Schema;
      default:
        return Yup.object().shape({});
    }
  };

  const defaultValues = {
    // General info fields
    client: null,
    campaignBrand: null,
    campaignCredits: null,
    campaignName: '',
    campaignDescription: '',
    brandAbout: '',
    campaignStartDate: null,
    campaignEndDate: null,
    postingStartDate: null,
    postingEndDate: null,
    productName: '',
    campaignIndustries: [],
    websiteLink: '',
    campaignImages: [],

    // Campaign objectives
    campaignObjectives: '',
    secondaryObjectives: [],
    boostContent: '',
    primaryKPI: '',
    performanceBaseline: '',
    campaignDo: [{ value: '' }],
    campaignDont: [{ value: '' }],

    // Target audience
    country: '',
    countries: [],
    audienceGender: [],
    audienceAge: [],
    audienceLanguage: [],
    audienceCreatorPersona: [],
    audienceUserPersona: '',
    geographicFocus: '',
    geographicFocusOthers: '',

    // Target audience secondary
    secondaryAudienceGender: [],
    secondaryAudienceAge: [],
    secondaryAudienceLanguage: [],
    secondaryAudienceCreatorPersona: [],
    secondaryAudienceUserPersona: '',
    secondaryCountry: '',

    // Logistics
    logisticsType: '',
    products: [{ name: '' }],
    schedulingOption: 'confirmation',
    locations: [{ name: '', pic: '', contactNumber: '' }],
    availabilityRules: [],
    allowMultipleBookings: false,
    clientRemarks: '',
    venueName: '',
    venueAddress: '',
    reservationNotes: '',

    // Campaign management
    campaignManager: user?.role === 'admin' ? [user] : [],
    campaignType: 'normal',
    deliverables: ['UGC_VIDEOS'],
    rawFootage: false,
    photos: false,
    crossPosting: false,
    ads: false,
    agreementFrom: null,
    timeline: [],

    // Additional Details 1 fields
    socialMediaPlatform: [],
    contentFormat: [],
    mainMessage: '',
    keyPoints: '',
    toneAndStyle: '',
    brandGuidelines: null,
    referenceContent: '',
    productImage1: [],
    productImage2: [],

    // Additional Details 2 fields
    hashtagsToUse: '',
    mentionsTagsRequired: '',
    creatorCompensation: '',
    ctaDesiredAction: '',
    ctaLinkUrl: '',
    ctaPromoCode: '',
    ctaLinkInBioRequirements: '',
    specialNotesInstructions: '',
    needAds: '',
    submissionVersion: 'v2',

    isV4Submission: false,
  };

  const methods = useForm({
    resolver: yupResolver(getSchemaForStep(activeStep)),
    defaultValues,
    mode: 'onChange',
  });

  const { handleSubmit, getValues, reset, setValue, watch, trigger } = methods;

  // Watch all form values to trigger re-render when values change
  const formValues = watch();

  useEffect(() => {
    if (brandState) {
      setValue('campaignBrand', brandState);
    }
  }, [brandState, setValue]);

  // Get fields to validate for each step
  const getFieldsForStep = (step) => {
    switch (step) {
      case 0: // General
        return [
          'campaignName',
          'campaignDescription',
          'campaignStartDate',
          'campaignEndDate',
          'postingStartDate',
          'postingEndDate',
          'productName',
          'campaignIndustries',
          'campaignImages',
        ];
      case 1: // Objective
        return [
          'campaignObjectives',
          'secondaryObjectives',
        ];
      case 2: // Audience
        return [
          'country',
          'audienceAge',
          'audienceGender',
          'audienceLanguage',
          'audienceCreatorPersona',
          'geographicFocus',
        ];
      case 3: // Logistics
        return ['logisticsType'];
      case 4: // Reservation Slots
        return ['availabilityRules'];
      case 5: // Logistic Remarks
        return [];
      case 6: // Finalise (now includes client, brand, credits)
        return ['client', 'campaignCredits', 'campaignManager', 'campaignType', 'deliverables'];
      case 7: // Next Steps
        return [];
      case 8: // Additional Details 1
        return [];
      case 9: // Additional Details 2
        return [];
      default:
        return [];
    }
  };

  const handleNext = async () => {
    // Only validate fields for the current step
    const fieldsToValidate = getFieldsForStep(activeStep);
    const result = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;

    // For finalise step (6), also check credit error
    const shouldCheckCreditError = activeStep === 6;
    if (result && (!shouldCheckCreditError || !hasCreditError)) {
      const logisticsType = getValues('logisticsType');
      let nextStep = activeStep + 1;

      // Handle logistics sub-step navigation
      if (activeStep === 3) {
        // From Logistics step, skip to Finalise if not RESERVATION type
        if (logisticsType !== 'RESERVATION') {
          nextStep = 6; // Skip to Finalise
        }
        // Otherwise go to step 4 (Reservation Slots)
      } else if (activeStep === 4) {
        // From Reservation Slots, go to Logistic Remarks
        nextStep = 5;
      } else if (activeStep === 5) {
        // From Logistic Remarks, go to Finalise
        nextStep = 6;
      } else if (activeStep === 6) {
        // From Finalise, go to Next Steps
        nextStep = 7;
      } else if (activeStep === 8) {
        // From Additional Details 1, go to Additional Details 2
        nextStep = 9;
      }

      localStorage.setItem('adminActiveStep', nextStep);
      setActiveStep(nextStep);
    }
  };

  // Handle clicking on step indicator to navigate directly
  const handleBackSectionStepClick = (indicatorIndex) => {
    const currentBackIndicator = getBackSectionIndicatorIndex(activeStep);
    if (indicatorIndex <= currentBackIndicator && activeStep <= 7) {
      const targetStep = backSectionIndicatorToStepMap[indicatorIndex];
      setActiveStep(targetStep);
      localStorage.setItem('adminActiveStep', targetStep);
    }
  };

  const handleFrontSectionStepClick = (indicatorIndex) => {
    const currentFrontIndicator = getFrontSectionIndicatorIndex(activeStep);
    // Allow navigation to any indicator that has been visited or previous indicators
    if (indicatorIndex <= currentFrontIndicator && activeStep >= 8) {
      const targetStep = frontSectionIndicatorToStepMap[indicatorIndex];
      setActiveStep(targetStep);
      localStorage.setItem('adminActiveStep', targetStep);
    }
  };

  const handleBack = () => {
    const logisticsType = getValues('logisticsType');
    let prevStep = activeStep - 1;

    if (activeStep === 9) {
      // From Additional Details 2, go to Additional Details 1
      prevStep = 8;
    } else if (activeStep === 8) {
      // From Additional Details 1, go back to Next Steps
      prevStep = 7;
    } else if (activeStep === 7) {
      // From Next Steps, go back to Finalise and hide additional details
      prevStep = 6;
      setShowAdditionalDetails(false);
    } else if (activeStep === 6) {
      // From Finalise, go back based on logistics type
      if (logisticsType === 'RESERVATION') {
        prevStep = 5; // Go to Logistic Remarks
      } else {
        prevStep = 3; // Go back to Logistics
      }
    } else if (activeStep === 5) {
      // From Logistic Remarks, go to Reservation Slots
      prevStep = 4;
    } else if (activeStep === 4) {
      // From Reservation Slots, go to Logistics
      prevStep = 3;
    }

    localStorage.setItem('adminActiveStep', prevStep);
    setActiveStep(prevStep);
  };

  const handleContinueAdditionalDetails = useCallback(() => {
    setShowAdditionalDetails(true);
    setActiveStep(8);
    localStorage.setItem('adminActiveStep', 8);
  }, []);

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
      secondaryObjectives: Array.isArray(data.secondaryObjectives) ? data.secondaryObjectives : [],
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
    if (Array.isArray(data.campaignImages)) {
      data.campaignImages.forEach((img) => {
        if (img instanceof File || img.type) {
          formData.append('campaignImages', img);
        }
      });
    }

    // Append other attachments
    if (Array.isArray(data.otherAttachments)) {
      data.otherAttachments.forEach((attachment) => {
        formData.append('otherAttachments', attachment);
      });
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

  const handlePackageLinkSuccess = useCallback(async () => {
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
  }, [getValues, openPackage, mutateCompanyList, setValue]);

  const getStepContent = useCallback(
    (step) => {
      switch (step) {
        case 0:
          return <CampaignGeneralInfo />;
        case 1:
          return <CampaignObjective />;
        case 2:
          return <CampaignTargetAudience />;
        case 3:
          return <CampaignLogistics />;
        case 4:
          return <ReservationSlotsV2 />;
        case 5:
          return <LogisticRemarks />;
        case 6:
          return (
            <FinaliseCampaign
              openCompany={openCompany}
              openBrand={openBrand}
              openPackage={openPackage}
              onValidationChange={setHasCreditError}
              setBrandState={setBrandState}
              onPackageLinkSuccess={handlePackageLinkSuccess}
            />
          );
        case 7:
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
        case 8:
          return <AdditionalDetails1 />;
        case 9:
          return <AdditionalDetails2 />;
        default:
          return null;
      }
    },
    [
      openCompany,
      openBrand,
      openPackage,
      isLoading,
      getValues,
      onSubmit,
      handleContinueAdditionalDetails,
      handlePackageLinkSuccess,
    ]
  );

  // Check if current step has required fields filled
  const isStepValid = () => {
    switch (activeStep) {
      case 0: {
        const title = formValues.campaignName;
        const desc = formValues.campaignDescription;
        const startDate = formValues.campaignStartDate;
        const endDate = formValues.campaignEndDate;
        const postingStartDate = formValues.postingStartDate;
        const postingEndDate = formValues.postingEndDate;
        const { productName } = formValues;
        const industries = formValues.campaignIndustries;
        const images = formValues.campaignImages;
        return (
          title &&
          desc &&
          productName &&
          industries?.length > 0 &&
          images?.length > 0 &&
          startDate &&
          endDate &&
          postingStartDate &&
          postingEndDate
        );
      }
      case 1: {
        const objectives = formValues.campaignObjectives;
        const secObjectives = formValues.secondaryObjectives;
        return objectives && secObjectives
      }
      case 2: {
        const { country } = formValues;
        const age = formValues.audienceAge;
        const gender = formValues.audienceGender;
        const language = formValues.audienceLanguage;
        const interests = formValues.audienceCreatorPersona;
        const persona = formValues.audienceUserPersona;
        const { geographicFocus } = formValues;
        return (
          country &&
          age?.length > 0 &&
          gender?.length > 0 &&
          language?.length > 0 &&
          interests?.length > 0 &&
          persona &&
          geographicFocus
        );
      }
      case 3: {
        const type = formValues.logisticsType;
        if (!type) return true; // Optional step

        if (type === 'PRODUCT_DELIVERY') {
          const { products } = formValues;
          return products?.some((p) => p.name?.trim().length > 0);
        }

        if (type === 'RESERVATION') {
          const { locations } = formValues;
          return locations?.some((l) => l.name?.trim().length > 0);
        }

        return true;
      }
      case 4: {
        const rules = formValues.availabilityRules;
        return rules?.length > 0;
      }
      case 5:
        return true; // Optional
      case 6: {
        // Finalise step - includes client/brand/credits validation
        const { client } = formValues;
        const credits = formValues.campaignCredits;
        const brand = formValues.campaignBrand;
        const manager = formValues.campaignManager;
        const type = formValues.campaignType;
        const { deliverables } = formValues;
        // If client is agency type, brand is required
        if (client?.type === 'agency' && !brand) return false;
        return (
          client &&
          credits &&
          credits > 0 &&
          !hasCreditError &&
          manager?.length > 0 &&
          type &&
          deliverables?.length > 0
        );
      }
      case 7: // Next Steps - navigation only
      case 8:
      case 9:
        return true; // Optional
      default:
        return true;
    }
  };

  // Get the current indicator indices for both sections
  const backSectionIndicator = getBackSectionIndicatorIndex(activeStep);
  const frontSectionIndicator = getFrontSectionIndicatorIndex(activeStep);

  // Determine if Next Steps should be highlighted (step 7 or beyond)
  const isNextStepsActive = activeStep >= 7;

  const campaignStartDate = watch('campaignStartDate');

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

              {/* Next Steps Section (icon-based navigation) */}
              {inBackSection && (
                <Box
                  sx={{
                    height: 1.2,
                    flexGrow: 1,
                    minWidth: 20,
                    maxWidth: 40,
                    bgcolor: isNextStepsActive ? '#1340FF' : '#636366',
                  }}
                />
              )}

              <Box
                onClick={() => {
                  if (activeStep >= 8) {
                    setActiveStep(7);
                    setShowAdditionalDetails(false);
                    localStorage.setItem('adminActiveStep', 7);
                  }
                }}
                px={1}
                py={0.5}
                borderRadius={1}
                border="1px solid #636366"
                bgcolor={isNextStepsActive ? '#1340FF' : '#fff'}
                sx={{
                  borderColor: isNextStepsActive ? '#1340FF' : '#636366',
                  '&:hover': {
                    opacity: activeStep >= 8 ? 0.85 : 1,
                  },
                  cursor: activeStep >= 8 ? 'pointer' : 'default',
                }}
              >
                <NextStepsIcon active={isNextStepsActive} size={35} />
              </Box>

              {/* Front Section Labels (Additional Details 1, Additional Details 2) */}
              {inFrontSection && (
                <>
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

            {/* Steps 0-6: Show Next button */}
            {activeStep >= 0 && activeStep <= 6 && (
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

            {/* Step 7 (Next Steps): No navigation buttons - handled by component */}

            {/* Step 8: Show Next and Confirm Campaign buttons */}
            {activeStep === 8 && (
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
                  onClick={handleOpenConfirm}
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

            {/* Step 9: Show only Confirm Campaign button (last step) */}
            {activeStep === 9 && (
              <LoadingButton
                variant="contained"
                onClick={handleOpenConfirm}
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

          {/* Confirmation Dialog */}
          <Dialog
            open={confirmOpen}
            onClose={handleCloseConfirm}
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
              },
            }}
          >
            <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
              <Iconify icon="mdi:rocket-launch" width={32} sx={{ color: '#1340FF' }} />
              <Typography variant="h6" mt={1}>
                Confirm Campaign
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Are you sure you want to publish this campaign?
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
              <Button variant="contained" onClick={handleCloseConfirm} sx={{ px: 2, py: 1.2 }}>
                Cancel
              </Button>
              {dayjs(campaignStartDate).isSame(dayjs(), 'date') ? (
                <Button
                  variant="contained"
                  onClick={() => {
                    const campaignStatus = dayjs(campaignStartDate).isSame(dayjs(), 'date')
                      ? 'ACTIVE'
                      : 'SCHEDULED';
                    setStatus(campaignStatus);
                    // Directly trigger form submission with the campaign status
                    onSubmit(campaignStatus);
                  }}
                  startIcon={<Iconify icon="material-symbols:publish" />}
                  disabled={isLoading}
                  sx={{
                    bgcolor: '#1340FF',
                    px: 4,
                    py: 1.2,
                    fontWeight: 600,
                    boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
                    '&:hover': {
                      bgcolor: '#0030e0',
                    },
                  }}
                >
                  {isLoading ? 'Publishing...' : 'Publish Now'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => {
                    const campaignStatus = dayjs(campaignStartDate).isSame(dayjs(), 'date')
                      ? 'ACTIVE'
                      : 'SCHEDULED';
                    setStatus(campaignStatus);
                    // Directly trigger form submission with the campaign status
                    onSubmit(campaignStatus);
                  }}
                  disabled={isLoading}
                  startIcon={<Iconify icon="mdi:calendar-clock" />}
                  sx={{
                    bgcolor: '#1340FF',
                    px: 4,
                    py: 1.2,
                    fontWeight: 600,
                    boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
                    '&:hover': {
                      bgcolor: '#0030e0',
                    },
                  }}
                >
                  {isLoading
                    ? 'Scheduling...'
                    : `Schedule on ${dayjs(campaignStartDate).format('ddd LL')}`}
                </Button>
              )}
            </DialogActions>
          </Dialog>
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

      {/* Mobile Navigation Buttons */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'white',
          borderTop: '1px solid #E7E7E7',
          px: 2,
          py: 2,
          zIndex: 1000,
          gap: 1,
          justifyContent: 'space-between',
          boxShadow: '0px -4px 12px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Button
          color="inherit"
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{
            height: 48,
            flex: 1,
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

        {/* Steps 0-6: Show Next button */}
        {activeStep >= 0 && activeStep <= 6 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isStepValid() || isLoading}
            sx={{
              height: 48,
              flex: 1,
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

        {/* Step 7 (Next Steps): No navigation buttons - handled by component */}
        {activeStep === 7 && <Box sx={{ flex: 1 }} />}

        {/* Step 8: Show Next and Confirm Campaign buttons */}
        {activeStep === 8 && (
          <>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepValid() || isLoading}
              sx={{
                height: 48,
                flex: 1,
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
              onClick={handleOpenConfirm}
              disabled={isLoading || !isStepValid()}
              sx={{
                height: 48,
                flex: 1,
                bgcolor: '#1340FF',
                '&:hover': {
                  bgcolor: '#0030e0',
                },
                boxShadow: '0px -2px 0px 0px rgba(0, 0, 0, 0.15) inset',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            >
              {isLoading ? 'Creating...' : 'Confirm'}
            </LoadingButton>
          </>
        )}

        {/* Step 9: Show only Confirm Campaign button (last step) */}
        {activeStep === 9 && (
          <LoadingButton
            variant="contained"
            onClick={handleOpenConfirm}
            disabled={isLoading || !isStepValid()}
            sx={{
              height: 48,
              flex: 1,
              bgcolor: '#1340FF',
              '&:hover': {
                bgcolor: '#0030e0',
              },
              boxShadow: '0px -2px 0px 0px rgba(0, 0, 0, 0.15) inset',
              fontWeight: 600,
            }}
          >
            {isLoading ? 'Creating...' : 'Confirm Campaign'}
          </LoadingButton>
        )}
      </Box>

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
