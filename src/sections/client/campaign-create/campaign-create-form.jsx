/* eslint-disable no-nested-ternary */
import dayjs from 'dayjs';
/* eslint-disable no-unused-vars */
import * as Yup from 'yup';
import { pdfjs } from 'react-pdf';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import 'react-pdf/dist/Page/TextLayer.css';
import { enqueueSnackbar } from 'notistack';
import { mutate as globalMutate } from 'swr';
import React, { lazy, useState } from 'react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { yupResolver } from '@hookform/resolvers/yup';

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

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { NextStepsIcon } from 'src/assets/icons';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form';

import PackageCreateDialog from 'src/sections/packages/package-dialog';
import LogisticRemarks from 'src/sections/campaign/create/stepsV2/logistic-remarks';
// Import steps from admin campaign creation
import CampaignLogistics from 'src/sections/campaign/create/stepsV2/campaign-logistics';
import ReservationSlotsV2 from 'src/sections/campaign/create/stepsV2/reservation-slots';

import NextSteps from './next-steps';
import CampaignObjective from './campaign-objective';
import AdditionalDetails1 from './additional-details-1';
import AdditionalDetails2 from './additional-details-2';
// Import custom client campaign components
import ClientCampaignGeneralInfo from './campaign-general-info';
import CampaignTargetAudience from './campaign-target-audience';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;

// Base internal steps (includes sub-steps for logistics)
// Visual indicator maps: 0=General, 1=Objective, 2=Audience, 3-5=Logistics, 6=Next Steps
const baseSteps = [
  { title: 'General Campaign Information', logo: '💬', color: '#8A5AFE', indicatorIndex: 0 },
  { title: 'Campaign Objectives', logo: '🎯', color: '#026D54', indicatorIndex: 1 },
  { title: 'Target Audience', logo: '👥', color: '#FFF0E5', indicatorIndex: 2 },
  { title: 'Logistics (Optional)', logo: '📦', color: '#D8FF01', indicatorIndex: 3 },
  { title: 'Reservation Slots', logo: '🗓️', color: '#D8FF01', indicatorIndex: 3 },
  { title: 'Additional Logistic Remarks', logo: '✏️', color: '#D8FF01', indicatorIndex: 3 },
  { title: 'Next Steps', logo: '👣', color: '#D8FF01', indicatorIndex: 4 },
];

// Additional detail steps that appear after clicking "Continue Additional Details"
const additionalSteps = [
  { title: 'Additional Details 1', logo: '📝', color: '#FF3500', indicatorIndex: 5 },
  { title: 'Additional Details 2', logo: '📝', color: '#D8FF01', indicatorIndex: 6 },
];

const getSteps = (showAdditionalDetails) =>
  showAdditionalDetails ? [...baseSteps, ...additionalSteps] : baseSteps;

const backSectionLabels = ['General', 'Objective', 'Audience', 'Logistics'];

const frontSectionLabels = ['Additional 1', 'Additional 2'];

const backSectionIndicatorToStepMap = {
  0: 0, // General
  1: 1, // Objective
  2: 2, // Audience
  3: 3, // Logistics (first sub-step)
};

const frontSectionIndicatorToStepMap = {
  0: 7, // Additional Details 1
  1: 8, // Additional Details 2
};

// Determine if we're in back section (steps 0-6) or front section (steps 7-8)
const isInFrontSection = (activeStep) => activeStep >= 7;
const isInBackSection = (activeStep) => activeStep <= 6;

// Get which indicator is active in back section (0-3 for General, Objective, Audience, Logistics)
const getBackSectionIndicatorIndex = (internalStep) => {
  if (internalStep >= 3) return 3; // Logistics (includes sub-steps 3, 4, 5, 6)
  return internalStep; // 0, 1, 2 map directly
};

// Get which indicator is active in front section (0 for Details 1, 1 for Details 2)
const getFrontSectionIndicatorIndex = (internalStep) => {
  if (internalStep >= 8) return 1; // Additional Details 2
  return 0; // Additional Details 1
};

const PDFEditor = lazy(() => import('src/sections/campaign/create/pdf-editor'));

function ClientCampaignCreateForm({ onClose, mutate }) {
  const { user } = useAuthContext();
  const modal = useBoolean();
  const confirmation = useBoolean();
  const openPackage = useBoolean();

  const [status, setStatus] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);

  const pdfModal = useBoolean();

  // Derive steps based on showAdditionalDetails state
  const steps = getSteps(showAdditionalDetails);

  // Determine if we're in the front or back section
  const inFrontSection = isInFrontSection(activeStep);
  const inBackSection = isInBackSection(activeStep);

  const campaignSchema = Yup.object().shape({
    campaignIndustries: Yup.array()
      .min(1, 'At least one industry is required')
      .required('Campaign Industry is required.'),
    campaignDescription: Yup.string().required('Campaign Description is required.'),
    campaignTitle: Yup.string()
      .required('Campaign title is required')
      .max(40, 'Campaign title must be 40 characters or less'),
    campaignObjectives: Yup.string().required('Campaign objective is required'),
    brandTone: Yup.string().required('Brand tone is required'),
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
    adminManager: Yup.array()
      .min(1, 'At least One Admin is required')
      .required('Admin Manager is required'),
    campaignCredits: Yup.number()
      .min(1, 'Minimum need to be 1')
      .required('Campaign credits is required'),
    otherAttachments: Yup.array(),
  });

  const campaignInformationSchema = Yup.object().shape({
    campaignIndustries: Yup.array()
      .min(1, 'At least one industry is required')
      .required('Campaign industry is required.'),
    campaignDescription: Yup.string().required('Campaign Description is required.'),
    campaignTitle: Yup.string()
      .required('Campaign title is required')
      .max(40, 'Campaign title must be 40 characters or less'),
    campaignCredits: Yup.number()
      .min(1, 'Assign at least 1 credit')
      .required('Campaign credits is required'),
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

  const campaignRequirementSchema = Yup.object().shape({
    audienceAge: Yup.array().min(1, 'At least one option').required('Audience age is required'),
    audienceGender: Yup.array()
      .min(1, 'At least one option')
      .required('Audience Gender is required'),
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

  // Schema for Objective step (step 1)
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

  // Schema for Next Steps/Publish step (step 6)
  const publishSchema = Yup.object().shape({
    otherAttachments: Yup.array(),
    referencesLinks: Yup.array().of(Yup.object().shape({ value: Yup.string() })),
  });

  // Schema for Additional Details 1 (step 7) - optional, no validation
  const additionalDetails1Schema = Yup.object().shape({});

  // Schema for Additional Details 2 (step 8) - optional, no validation
  const additionalDetails2Schema = Yup.object().shape({});

  const getSchemaForStep = (step) => {
    switch (step) {
      case 0:
        return campaignInformationSchema;
      case 1:
        return objectiveSchema;
      case 2:
        return campaignRequirementSchema;
      case 3:
        return logisticsSchema;
      case 4:
        return reservationSlotsSchema;
      case 5:
        return Yup.object().shape({}); // Logistic remarks - optional
      case 6:
        return publishSchema;
      case 7:
        return additionalDetails1Schema; // Additional Details 1 - optional
      case 8:
        return additionalDetails2Schema; // Additional Details 2 - optional
      default:
        return campaignSchema;
    }
  };

  const defaultValues = {
    campaignTitle: '',
    campaignDescription: '',
    campaignStartDate: null,
    campaignEndDate: null,
    campaignCredits: '',
    campaignIndustries: [],
    campaignObjectives: '',
    secondaryObjectives: [],
    boostContent: '',
    primaryKPI: '',
    performanceBaseline: '',
    brandTone: '',
    brandAbout: '',
    productServiceName: '',
    websiteLink: '',
    // Primary Audience
    audienceUserPersona: '',
    audienceGender: [],
    audienceAge: [],
    audienceLocation: [],
    othersAudienceLocation: '',
    audienceLanguage: [],
    audienceCreatorPersona: [],
    country: '',
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
    campaignDo: [{ value: '' }],
    campaignDont: [{ value: '' }],
    campaignImages: [],
    campaignType: '',
    campaignTimelineType: '',
    deliverables: [],
    campaignAdminManagers: [],
    campaignForm: [],
    otherAttachments: [],
    referencesLinks: [],
    submissionVersion: 'v4',
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
    // Additional Details 1 fields
    socialMediaPlatform: [],
    contentFormat: [],
    postingStartDate: null,
    postingEndDate: null,
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
  } = methods;

  const values = watch();

  // Get fields to validate for each step
  const getFieldsForStep = (step) => {
    switch (step) {
      case 0: // General
        return [
          'campaignTitle',
          'campaignDescription',
          'campaignIndustries',
          'campaignCredits',
          'campaignImages',
          'campaignStartDate',
          'campaignEndDate',
        ];
      case 1: // Objective
        return ['campaignObjectives', 'campaignDo', 'campaignDont'];
      case 2: // Audience
        return [
          'country',
          'audienceAge',
          'audienceGender',
          'audienceLanguage',
          'audienceCreatorPersona',
        ];
      case 3: // Logistics
        return ['logisticsType'];
      case 4: // Reservation Slots
        return ['availabilityRules'];
      case 5: // Logistic Remarks
        return []; // Optional, no required fields
      case 6: // Next Steps / Publish
        return [];
      case 7: // Additional Details 1 - optional
        return [];
      case 8: // Additional Details 2 - optional
        return [];
      default:
        return [];
    }
  };

  const handleNext = async () => {
    // Prevent progressing if credits are zero or invalid
    const creditsErrorRef = { current: false };
    const listener = (e) => {
      creditsErrorRef.current = !!e?.detail;
    };
    window.addEventListener('client-campaign-credits-error', listener, { once: true });

    // Only validate fields for the current step
    const fieldsToValidate = getFieldsForStep(activeStep);
    const result = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;
    window.removeEventListener('client-campaign-credits-error', listener);

    // Also validate locally: if availableCredits is 0 and step is General Campaign Information
    const isGeneralInfoStep = activeStep === 0;
    const requestedCredits = Number(getValues('campaignCredits') || 0);
    const availableCredits = Number(localStorage.getItem('clientAvailableCredits') || 0);
    const isExceed =
      isGeneralInfoStep &&
      (availableCredits <= 0 || requestedCredits <= 0 || requestedCredits > availableCredits);

    if (result && !creditsErrorRef.current && !isExceed) {
      const logisticsType = getValues('logisticsType');
      let nextStep = activeStep + 1;

      // Handle logistics sub-step navigation
      // Step 3 = Logistics, Step 4 = Reservation Slots, Step 5 = Logistic Remarks, Step 6 = Next Steps
      // Step 7 = Additional Details 1, Step 8 = Additional Details 2 (when showAdditionalDetails is true)
      if (activeStep === 3) {
        // From Logistics step, skip to Next Steps if not RESERVATION type
        if (logisticsType !== 'RESERVATION') {
          nextStep = 6; // Skip to Next Steps
        }
        // Otherwise go to step 4 (Reservation Slots)
      } else if (activeStep === 4) {
        // From Reservation Slots, go to Logistic Remarks
        nextStep = 5;
      } else if (activeStep === 5) {
        // From Logistic Remarks, go to Next Steps
        nextStep = 6;
      } else if (activeStep === 7) {
        // From Additional Details 1, go to Additional Details 2
        nextStep = 8;
      }
      // Note: From step 6 (Next Steps), user clicks "Continue Additional Details" button instead

      localStorage.setItem('clientActiveStep', nextStep);
      setActiveStep(nextStep);
    } else if (isExceed) {
      enqueueSnackbar('Please include or adjust Number Of Credits based on available credits', {
        variant: 'error',
      });
    }
  };

  // Handle clicking on step indicator to navigate directly
  const handleBackSectionStepClick = (indicatorIndex) => {
    const currentBackIndicator = getBackSectionIndicatorIndex(activeStep);
    if (indicatorIndex <= currentBackIndicator && activeStep <= 6) {
      const targetStep = backSectionIndicatorToStepMap[indicatorIndex];
      setActiveStep(targetStep);
      localStorage.setItem('clientActiveStep', targetStep);
    }
  };

  const handleFrontSectionStepClick = (indicatorIndex) => {
    const currentFrontIndicator = getFrontSectionIndicatorIndex(activeStep);
    // Allow navigation to any indicator that has been visited or previous indicators
    if (indicatorIndex <= currentFrontIndicator && activeStep >= 7) {
      const targetStep = frontSectionIndicatorToStepMap[indicatorIndex];
      setActiveStep(targetStep);
      localStorage.setItem('clientActiveStep', targetStep);
    }
  };

  const handleBack = () => {
    const logisticsType = getValues('logisticsType');
    let prevStep = activeStep - 1;

    if (activeStep === 8) {
      // From Additional Details 2, go to Additional Details 1
      prevStep = 7;
    } else if (activeStep === 7) {
      // From Additional Details 1, go back to Next Steps and hide additional details
      prevStep = 6;
      setShowAdditionalDetails(false);
    } else if (activeStep === 6) {
      // From Next Steps, go back based on logistics type
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

    localStorage.setItem('clientActiveStep', prevStep);
    setActiveStep(prevStep);
  };

  // Handle clicking "Continue Additional Details" on Next Steps
  const handleContinueAdditionalDetails = () => {
    setShowAdditionalDetails(true);
    setActiveStep(7); // Go to Additional Details 1
    localStorage.setItem('clientActiveStep', 7);
  };

  const onSubmit = handleSubmit(async (data, stage) => {
    try {
      setIsLoading(true);

      // Debug: Log user info to check role
      console.log('Current user info:', user);
      console.log('User role:', user?.role);

      const formData = new FormData();

      // Create client campaign data object with all necessary fields
      const clientCampaignData = {
        campaignTitle: data.campaignTitle || '',
        campaignDescription: data.campaignDescription || '',
        campaignStartDate: data.campaignStartDate || null,
        campaignEndDate: data.campaignEndDate || null,
        campaignCredits: Number(data.campaignCredits) || 0,
        brandTone: data.brandTone || '',
        brandAbout: data.brandAbout || '',
        productName: data.productName || '',
        websiteLink: data.websiteLink || '',
        campaignIndustries: Array.isArray(data.campaignIndustries) ? data.campaignIndustries : [],
        campaignObjectives: data.campaignObjectives || '',
        secondaryObjectives: Array.isArray(data.secondaryObjectives)
          ? data.secondaryObjectives
          : [],
        boostContent: data.boostContent || '',
        primaryKPI: data.primaryKPI || '',
        performanceBaseline: data.performanceBaseline || '',
        audienceGender: Array.isArray(data.audienceGender) ? data.audienceGender : [],
        audienceAge: Array.isArray(data.audienceAge) ? data.audienceAge : [],
        audienceLocation: Array.isArray(data.audienceLocation)
          ? data.audienceLocation.filter((item) => item !== 'Others')
          : [],
        audienceLanguage: Array.isArray(data.audienceLanguage) ? data.audienceLanguage : [],
        audienceCreatorPersona: Array.isArray(data.audienceCreatorPersona)
          ? data.audienceCreatorPersona
          : [],
        audienceUserPersona: data.audienceUserPersona || '',
        country: data.country || '',
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
        socialMediaPlatform: Array.isArray(data.socialMediaPlatform)
          ? data.socialMediaPlatform
          : [],
        videoAngle: Array.isArray(data.videoAngle) ? data.videoAngle : [],
        campaignDo: Array.isArray(data.campaignDo)
          ? data.campaignDo
              .filter(Boolean)
              .map((item) => (typeof item === 'object' ? item : { value: item }))
              .filter((item) => item.value)
          : [],
        campaignDont: Array.isArray(data.campaignDont)
          ? data.campaignDont
              .filter(Boolean)
              .map((item) => (typeof item === 'object' ? item : { value: item }))
              .filter((item) => item.value)
          : [],
        referencesLinks: Array.isArray(data.referencesLinks) ? data.referencesLinks : [],
        submissionVersion: data.submissionVersion || '',
        logisticsType: data.logisticsType || '',
        clientRemarks: data.clientRemarks || '',
        products: data.products?.filter((p) => p.name?.trim().length > 0) || [],
        availabilityRules: data.availabilityRules || [],
        locations: data.locations?.filter((l) => l.name?.trim().length > 0) || [],
        schedulingOption: data.schedulingOption,
        allowMultipleBookings: data.allowMultipleBookings,
        // Additional Details 1 fields
        contentFormat: Array.isArray(data.contentFormat) ? data.contentFormat : [],
        postingStartDate: data.postingStartDate || null,
        postingEndDate: data.postingEndDate || null,
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
      };

      console.log('Client campaign data:', clientCampaignData);

      // Convert to JSON string and append to FormData
      const jsonString = JSON.stringify(clientCampaignData);
      formData.append('data', jsonString);

      // Append images if available
      if (data.campaignImages && Array.isArray(data.campaignImages)) {
        for (let i = 0; i < data.campaignImages.length; i += 1) {
          if (data.campaignImages[i] instanceof File || data.campaignImages[i].type) {
            formData.append('campaignImages', data.campaignImages[i]);
          }
        }
      }

      // eslint-disable-next-line guard-for-in, no-restricted-syntax
      for (const i in data.otherAttachments) {
        formData.append('otherAttachments', data.otherAttachments[i]);
      }

      // Append brand guidelines files if available (support multiple)
      if (data.brandGuidelines && Array.isArray(data.brandGuidelines)) {
        for (let i = 0; i < data.brandGuidelines.length; i += 1) {
          if (data.brandGuidelines[i] instanceof File || data.brandGuidelines[i].type) {
            formData.append('brandGuidelines', data.brandGuidelines[i]);
          }
        }
      } else if (data.brandGuidelines && data.brandGuidelines instanceof File) {
        formData.append('brandGuidelines', data.brandGuidelines);
      }

      // Append product image 1 if available
      if (data.productImage1 && Array.isArray(data.productImage1)) {
        for (let i = 0; i < data.productImage1.length; i += 1) {
          if (data.productImage1[i] instanceof File || data.productImage1[i].type) {
            formData.append('productImage1', data.productImage1[i]);
          }
        }
      }

      // Append product image 2 if available
      if (data.productImage2 && Array.isArray(data.productImage2)) {
        for (let i = 0; i < data.productImage2.length; i += 1) {
          if (data.productImage2[i] instanceof File || data.productImage2[i].type) {
            formData.append('productImage2', data.productImage2[i]);
          }
        }
      }

      // Use the client-specific endpoint
      const endpoint = endpoints.client.createCampaign;
      console.log('Using endpoint:', endpoint);

      const res = await axiosInstance.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIsLoading(false);
      enqueueSnackbar(
        'Campaign submitted successfully! CSM will review and activate your campaign.',
        { variant: 'success' }
      );

      // Revalidate client credits so dashboard reflects deduction immediately
      try {
        // Optimistically adjust local available credits
        const requestedCredits = Number(clientCampaignData.campaignCredits) || 0;
        try {
          const currentAvail = Number(localStorage.getItem('clientAvailableCredits') || 0);
          const nextAvail = Math.max(0, currentAvail - requestedCredits);
          localStorage.setItem('clientAvailableCredits', String(nextAvail));
        } catch {
          // Ignore localStorage errors
        }

        // Revalidate SWR caches for credits
        await globalMutate(endpoints.client.checkCompany);
        try {
          const check = await axiosInstance.get(endpoints.client.checkCompany);
          const companyId = check?.data?.company?.id;
          if (companyId) {
            await globalMutate(`${endpoints.company.getCompany}/${companyId}`);
          }
        } catch {
          // Ignore API errors during revalidation
        }
      } catch {
        // Ignore errors during credit revalidation
      }
      reset();
      mutate();
      setStatus('');
      confirmation.onFalse();
      setActiveStep(0);
      localStorage.setItem('clientActiveStep', 0);
      onClose();
    } catch (error) {
      console.error('API Error:', error);

      // Extract detailed error information
      let errorMessage = 'Error creating campaign. Contact our admin';

      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        console.error('Error response data:', error.response.data);

        errorMessage =
          error.response.data?.message ||
          `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        console.error('Error request:', error.request);
        errorMessage = 'No response received from server';
      } else {
        console.error('Error message:', error.message);
        errorMessage = error.message || errorMessage;
      }

      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  });

  // Modify the step content function to handle client flow with 7 internal steps
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <ClientCampaignGeneralInfo />;
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
          <NextSteps
            onPublish={() => {
              const campaignStart = getValues('campaignStartDate');
              const campaignStatus = dayjs(campaignStart).isSame(dayjs(), 'date')
                ? 'ACTIVE'
                : 'SCHEDULED';
              setStatus(campaignStatus);
              onSubmit(campaignStatus);
            }}
            onContinueAdditionalDetails={handleContinueAdditionalDetails}
            isLoading={isLoading}
          />
        );
      case 7:
        return <AdditionalDetails1 />;
      case 8:
        return <AdditionalDetails2 />;
      default:
        return null;
    }
  };

  // Check if current step has required fields filled
  const isStepValid = () => {
    switch (activeStep) {
      case 0: // General
        return (
          values.campaignTitle &&
          values.campaignDescription &&
          values.campaignIndustries?.length > 0 &&
          values.campaignCredits &&
          values.campaignStartDate &&
          values.campaignEndDate &&
          values.campaignImages?.length > 0
        );
      case 1: // Objective
        return values.campaignObjectives?.length > 0;
      case 2: // Audience
        return (
          values.audienceAge?.length > 0 &&
          values.audienceGender?.length > 0 &&
          values.audienceLanguage?.length > 0 &&
          values.audienceCreatorPersona?.length > 0
        );
      case 3: {
        // Logistics - optional
        const type = values.logisticsType;

        if (!type) return true;

        if (type === 'PRODUCT_DELIVERY') {
          return values.products?.some((p) => p.name?.trim().length > 0);
        }

        if (type === 'RESERVATION') {
          return values.locations?.some((l) => l.name?.trim().length > 0);
        }

        return true;
      }
      case 4: // Reservation Slots - optional (shown only for RESERVATION)
      case 5: // Logistic Remarks - optional
        return true;
      case 6: // Next Steps (Publish) - all required fields already validated
        return true;
      case 7: // Additional Details 1 - optional
      case 8: // Additional Details 2 - optional
        return true;
      default:
        return true;
    }
  };

  // Get the current indicator indices for both sections
  const backSectionIndicator = getBackSectionIndicatorIndex(activeStep);
  const frontSectionIndicator = getFrontSectionIndicatorIndex(activeStep);

  // Determine if Next Steps should be highlighted (step 6 or beyond)
  const isNextStepsActive = activeStep >= 6;

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
              maxWidth: { xs: '95%', sm: 800 },
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
              {/* Back Section (General, Objective, Audience, Logistics) */}
              {inBackSection &&
                backSectionLabels.map((label, index) => (
                  <React.Fragment key={label}>
                    <Box
                      onClick={() => handleBackSectionStepClick(index)}
                      sx={{
                        minWidth: 135,
                        height: 45,
                        py: 1.2,
                        textAlign: 'center',
                        borderRadius: 1,
                        fontSize: 14,
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
                    <Box
                      sx={{
                        height: 1.2,
                        flexGrow: 1,
                        minWidth: 30,
                        maxWidth: 50,
                        bgcolor: backSectionIndicator > index ? '#1340FF' : '#636366',
                      }}
                    />
                  </React.Fragment>
                ))}

              {/* Next Steps Section (Publish or Continue Additional Details) */}
              <Box
                onClick={() => {
                  if (activeStep >= 7) {
                    setActiveStep(6);
                    setShowAdditionalDetails(false);
                    localStorage.setItem('clientActiveStep', 6);
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
                    opacity: activeStep >= 7 ? 0.85 : 1,
                  },
                  cursor: activeStep >= 7 ? 'pointer' : 'default',
                }}
              >
                <NextStepsIcon active={isNextStepsActive} size={35} />
              </Box>

              {/* Front Section Labels (Additional Details 1, Additional Details 2) */}
              {inFrontSection &&
                frontSectionLabels.map((label, index) => (
                  <React.Fragment key={label}>
                    {/* Connector Line before each front section label */}
                    <Box
                      sx={{
                        height: 1.2,
                        flexGrow: 1,
                        minWidth: 30,
                        maxWidth: 50,
                        bgcolor: frontSectionIndicator >= index ? '#1340FF' : '#636366',
                      }}
                    />
                    <Box
                      onClick={() => handleFrontSectionStepClick(index)}
                      sx={{
                        minWidth: 135,
                        height: 45,
                        py: 1.2,
                        textAlign: 'center',
                        borderRadius: 1,
                        fontSize: 14,
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
            </Stack>
          </Box>

          {/* Navigation buttons - Hidden on mobile */}
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{
              py: 3,
              display: { xs: 'none', md: 'flex' },
            }}
          >
            {activeStep !== 7 && (
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
            )}

            <Box sx={{ flexGrow: 1 }} />

            {/* Steps 0-5: Show Next button */}
            {activeStep >= 0 && activeStep <= 5 && (
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

            {/* Step 7: Show Next and Confirm Campaign buttons */}
            {activeStep === 7 && (
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
                <Button
                  variant="contained"
                  onClick={confirmation.onTrue}
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
                </Button>
              </Stack>
            )}

            {/* Step 8: Show only Confirm Campaign button (last step) */}
            {activeStep === 8 && (
              <Button
                variant="contained"
                onClick={confirmation.onTrue}
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
              </Button>
            )}
          </Stack>
        </Stack>

        <Box
          sx={{
            height: '85vh',
            overflow: 'auto',
            mt: 1,
            scrollbarWidth: 'thin',
            pb: { xs: 10, md: 0 }, // Add padding bottom on mobile for button space
          }}
        >
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
                sx={{ bgcolor: steps[activeStep].color, width: 70, height: 70, fontSize: 35 }}
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

            <Box overflow="auto" minHeight={400}>
              {getStepContent(activeStep)}
            </Box>
          </Box>
        </Box>

        {/* Mobile bottom navigation - Only visible on mobile */}
        <Box
          sx={{
            display: { xs: 'block', md: 'none' },
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'white',
            borderTop: '1px solid #E7E7E7',
            p: 2,
            zIndex: 1000,
            boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              fullWidth
              sx={{
                bgcolor: 'white',
                border: '1px solid #E7E7E7',
                color: '#3A3A3C',
                '&:hover': {
                  bgcolor: '#F8F8F8',
                  border: '1px solid #E7E7E7',
                },
                fontWeight: 600,
                boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.05) inset',
              }}
            >
              Back
            </Button>

            {/* Steps 0-5: Show Next button */}
            {activeStep >= 0 && activeStep <= 5 && (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isStepValid() || isLoading}
                fullWidth
                sx={{
                  bgcolor: '#3A3A3C',
                  '&:hover': {
                    bgcolor: '#47474a',
                  },
                  boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
                  fontWeight: 600,
                }}
              >
                Next
              </Button>
            )}

            {/* Step 7: Show Next and Confirm Campaign buttons */}
            {activeStep === 7 && (
              <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepValid() || isLoading}
                  fullWidth
                  sx={{
                    bgcolor: '#3A3A3C',
                    '&:hover': {
                      bgcolor: '#47474a',
                    },
                    boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
                    fontWeight: 600,
                  }}
                >
                  Next
                </Button>
                <Button
                  variant="contained"
                  onClick={confirmation.onTrue}
                  disabled={isLoading || !isStepValid()}
                  fullWidth
                  sx={{
                    bgcolor: '#1340FF',
                    '&:hover': {
                      bgcolor: '#0030e0',
                    },
                    boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
                    fontWeight: 600,
                  }}
                >
                  {isLoading ? 'Creating...' : 'Confirm'}
                </Button>
              </Stack>
            )}

            {/* Step 8: Show only Confirm Campaign button (last step) */}
            {activeStep === 8 && (
              <Button
                variant="contained"
                onClick={confirmation.onTrue}
                disabled={isLoading || !isStepValid()}
                fullWidth
                sx={{
                  bgcolor: '#1340FF',
                  '&:hover': {
                    bgcolor: '#0030e0',
                  },
                  boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
                  fontWeight: 600,
                }}
              >
                {isLoading ? 'Creating Campaign...' : 'Confirm Campaign'}
              </Button>
            )}
          </Stack>
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
              primary="Confirm Campaign"
              secondary="Are you sure you're ready to publish your campaign?"
              primaryTypographyProps={{
                fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                fontSize: 40,
              }}
              secondaryTypographyProps={{
                variant: 'body1',
              }}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <LoadingButton
                variant="contained"
                fullWidth
                onClick={() => {
                  confirmation.onFalse();
                  handleSubmit(onSubmit)();
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
                sx={{
                  fontWeight: 600,
                  py: 1,
                  bgcolor: 'white',
                  border: '1px solid #E7E7E7',
                  color: '#3A3A3C',
                  '&:hover': {
                    bgcolor: '#F8F8F8',
                    border: '1px solid #E7E7E7',
                  },
                }}
                onClick={() => {
                  confirmation.onFalse();
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Dialog>
      </FormProvider>

      <PackageCreateDialog
        open={openPackage.value}
        onClose={openPackage.onFalse}
        setValue={setValue}
      />

      <PDFEditor
        open={pdfModal.value}
        onClose={pdfModal.onFalse}
        user={user}
        setAgreementForm={setValue}
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

export default ClientCampaignCreateForm;

ClientCampaignCreateForm.propTypes = {
  onClose: PropTypes.func,
  mutate: PropTypes.func,
};
