/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-vars */
import * as Yup from 'yup';
import { pdfjs } from 'react-pdf';
import PropTypes from 'prop-types';
import 'react-pdf/dist/Page/TextLayer.css';
import { enqueueSnackbar } from 'notistack';
import { mutate as globalMutate } from 'swr';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';
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
  DialogContent,
  LinearProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form';

import PackageCreateDialog from 'src/sections/packages/package-dialog';
import LogisticRemarks from 'src/sections/campaign/create/steps/logistic-remarks';
import OtherAttachments from 'src/sections/campaign/create/steps/other-attachments';
import ReservationSlots from 'src/sections/campaign/create/steps/reservation-slots';
import CampaignLogistics from 'src/sections/campaign/create/steps/campaign-logistics';
// Import steps from campaign creation
import TimelineTypeModal from 'src/sections/campaign/create/steps/timeline-type-modal';

import CampaignUploadPhotos from './campaign-upload-photos';
// Import custom client campaign components
import ClientCampaignGeneralInfo from './campaign-general-info';
import CampaignTargetAudience from './campaign-target-audience';
import CampaignObjective from './campaign-objective';
import NextSteps from './next-steps';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;

// Define internal steps (includes sub-steps for logistics)
// Visual indicator maps: 0=General, 1=Objective, 2=Audience, 3-5=Logistics, 6=Next Steps
const steps = [
  { title: 'General Campaign Information', logo: '💬', color: '#8A5AFE', indicatorIndex: 0 },
  { title: 'Campaign Objectives', logo: '🎯', color: '#026D54', indicatorIndex: 1 },
  { title: 'Target Audience', logo: '👥', color: '#FFF0E5', indicatorIndex: 2 },
  { title: 'Logistics (Optional)', logo: '📦', color: '#D8FF01', indicatorIndex: 3 },
  { title: 'Reservation Slots', logo: '🗓️', color: '#D8FF01', indicatorIndex: 3 },
  { title: 'Additional Logistic Remarks', logo: '✏️', color: '#D8FF01', indicatorIndex: 3 },
  { title: 'Next Steps', logo: '👣', color: '#D8FF01', indicatorIndex: 4 },
];

// Step indicator labels for the clickable navigation (5 visual steps)
const stepLabels = ['General', 'Objective', 'Audience', 'Logistics', 'Next Steps'];

// Map visual indicator index to first internal step index
const indicatorToStepMap = {
  0: 0, // General
  1: 1, // Objective  
  2: 2, // Audience
  3: 3, // Logistics (first sub-step)
  4: 6, // Next Steps
};

// Get which visual indicator is active based on internal step
const getIndicatorIndex = (internalStep) => {
  if (internalStep >= 6) return 4; // Next Steps
  if (internalStep >= 3) return 3; // Logistics (includes sub-steps 3, 4, 5)
  return internalStep; // 0, 1, 2 map directly
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
  const [isConfirming, setIsConfirming] = useState(false);

  const pdfModal = useBoolean();

  // Add state for confirmation modal
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

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
    campaignImages: Yup.array()
      .min(1, 'Must have at least 1 image')
      .max(3, 'Must have at most 3 images'),
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
    secondaryAudienceLocation: Yup.array(),
    secondaryOthersAudienceLocation: Yup.string(),
    secondaryAudienceLanguage: Yup.array(),
    secondaryAudienceCreatorPersona: Yup.array(),
    secondaryAudienceUserPersona: Yup.string(),
    geographicFocus: Yup.string(),
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
          .min(1, 'At least on product is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    logisticRemarks: Yup.string(),
    // locations: Yup.array().notRequired(),

    // venueName: Yup.string().when('logisticType', {
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
    logisticRemarks: '',
    schedulingOption: 'confirmation',
    products: [{ name: '' }],
    locations: [{ name: '' }],
    availabilityRules: [],
    venueName: '',
    venueAddress: '',
    reservationNotes: '',
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
    control,
    setValue,
    watch,
    trigger,
    formState: { isValid, errors },
  } = methods;

  const values = watch();

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

  // Get fields to validate for each step
  const getFieldsForStep = (step) => {
    switch (step) {
      case 0: // General
        return ['campaignTitle', 'campaignDescription', 'campaignIndustries', 'campaignCredits', 'campaignImages', 'campaignStartDate', 'campaignEndDate'];
      case 1: // Objective
        return ['campaignObjectives', 'campaignDo', 'campaignDont'];
      case 2: // Audience
        return ['audienceAge', 'audienceGender', 'audienceLocation', 'audienceLanguage', 'audienceCreatorPersona', 'socialMediaPlatform', 'videoAngle'];
      case 3: // Logistics
        return ['logisticsType'];
      case 4: // Reservation Slots
        return ['availabilityRules'];
      case 5: // Logistic Remarks
        return []; // Optional, no required fields
      case 6: // Next Steps / Publish
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
      }

      localStorage.setItem('clientActiveStep', nextStep);
      setActiveStep(nextStep);
    } else if (isExceed) {
      enqueueSnackbar('Please include or adjust Number Of Credits based on available credits', {
        variant: 'error',
      });
    }
  };

  // Handle clicking on step indicator to navigate directly
  const handleStepClick = (indicatorIndex) => {
    const currentIndicator = getIndicatorIndex(activeStep);
    // Allow navigation to any indicator that has been visited or previous indicators
    if (indicatorIndex <= currentIndicator) {
      const targetStep = indicatorToStepMap[indicatorIndex];
      setActiveStep(targetStep);
      localStorage.setItem('clientActiveStep', targetStep);
    }
  };

  const handleBack = () => {
    const logisticsType = getValues('logisticsType');
    let prevStep = activeStep - 1;

    // Handle logistics sub-step navigation going back
    if (activeStep === 6) {
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
        secondaryObjectives: Array.isArray(data.secondaryObjectives) ? data.secondaryObjectives : [],
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
        logisticRemarks: data.logisticRemarks || '',
        products: data.products || [],
        locations: data.locations || [],
        venueName: data.venueName || '',
        venueAddress: data.venueAddress || '',
        reservationNotes: data.reservationNotes || '',
        schedulingOption: data.schedulingOption || 'confirmation',
        availabilityRules: data.availabilityRules || [],
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

  // Add function to handle confirmation
  const handleConfirmCampaign = () => {
    setIsConfirming(true);
    setOpenConfirmModal(true);
  };

  // Add function to handle final submission
  const handleFinalSubmit = useCallback(async () => {
    try {
      setIsLoading(true);
      setOpenConfirmModal(false); // Close the modal immediately when submission starts

      // Try to create client record and associate with company first
      try {
        console.log('Creating client record with company if needed...');
        const response = await axiosInstance.post('/api/client/createClientWithCompany');
        console.log('Client setup response:', response.data);
      } catch (setupError) {
        console.error('Error setting up client account:', setupError);
        // Continue anyway, as the main submission might still work
      }

      // Get form values
      const formValues = methods.getValues();
      console.log('Form values before submission:', formValues);

      // Use the existing onSubmit logic for actual submission
      await onSubmit(formValues);

      // Reset form or redirect as needed
      // setActiveStep(0);
    } catch (error) {
      console.error('Error submitting campaign:', error);
      enqueueSnackbar('Failed to submit campaign', { variant: 'error' });
    } finally {
      setIsLoading(false);
      setIsConfirming(false);
    }
  }, [onSubmit, methods]);

  // Set up event listeners for custom events - MOVED AFTER handleFinalSubmit
  useEffect(() => {
    const handleConfirm = () => {
      handleFinalSubmit();
    };

    const handleCancel = () => {
      setIsConfirming(false);
      setOpenConfirmModal(false);
    };

    window.addEventListener('confirmCampaign', handleConfirm);
    window.addEventListener('cancelCampaign', handleCancel);

    // Clean up event listeners when component unmounts
    return () => {
      window.removeEventListener('confirmCampaign', handleConfirm);
      window.removeEventListener('cancelCampaign', handleCancel);
    };
  }, [handleFinalSubmit, setOpenConfirmModal]); // Include dependencies

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
        return <ReservationSlots />;
      case 5:
        return <LogisticRemarks />;
      case 6:
        return <NextSteps onPublish={handleSubmit(onSubmit)} isLoading={isLoading} />;
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
      case 3: // Logistics - optional
      case 4: // Reservation Slots - optional (shown only for RESERVATION)
      case 5: // Logistic Remarks - optional
        return true;
      case 6: // Next Steps (Publish) - all required fields already validated
        return true;
      default:
        return true;
    }
  };

  // Get the current visual indicator index for rendering
  const currentIndicatorIndex = getIndicatorIndex(activeStep);

  return (
    <Box>
      <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <IconButton
            sx={{
              border: 1,
              borderRadius: 1,
              height: '100%',
              boxShadow: '0px -1.5px 0px 0px #E7E7E7 inset',
              borderColor: '#E7E7E7',
              height: 45,
              width: 45,
              padding: 1,
            }}
            size='large'
            disabled={isLoading || isConfirming}
            onClick={onClose}
          >
            <Iconify icon="material-symbols:close" width={20} color={'#231F20'} />
          </IconButton>

          {/* Step Indicator - Clickable navigation */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: { xs: '95%', sm: 600 },
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
              {stepLabels.map((label, index) => (
                <React.Fragment key={label}>
                  {/* Step Box */}
                  <Box
                    onClick={() => handleStepClick(index)}
                    sx={{
                      minWidth: 133,
                      height: 45,
                      py: 1.2,
                      textAlign: 'center',
                      borderRadius: 1,
                      fontSize: 14,
                      fontWeight: 400,
                      bgcolor: currentIndicatorIndex === index ? '#1340FF' : currentIndicatorIndex > index ? '#1340FF' : '#fff',
                      color: currentIndicatorIndex === index ? '#fff' : currentIndicatorIndex > index ? '#fff' : '#636366',
                      border: '1px solid #636366',
                      borderColor: currentIndicatorIndex >= index ? '#1340FF' : '#636366',
                      cursor: index <= currentIndicatorIndex ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        opacity: index <= currentIndicatorIndex ? 0.85 : 1,
                      },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Box component="span">{label}</Box>
                  </Box>

                  {/* Connector Line (except after last step) */}
                  {index < stepLabels.length - 1 && (
                    <Box
                      sx={{
                        height: 1.2,
                        flexGrow: 1,
                        minWidth: 50,
                        maxWidth: 80,
                        bgcolor: currentIndicatorIndex > index ? '#1340FF' : '#636366',
                      }}
                    />
                  )}
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

            {activeStep === steps.length - 1 ? (
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleConfirmCampaign}
                  disabled={isConfirming || isLoading || !isStepValid()}
                  sx={{
                    bgcolor: '#1340FF',
                    '&:hover': {
                      bgcolor: '#0030e0',
                    },
                    boxShadow: '0px -2px 0px 0px rgba(0, 0, 0, 0.15) inset',
                    fontWeight: 600,
                  }}
                >
                  {isConfirming
                    ? 'Opening Preview...'
                    : isLoading
                      ? 'Creating Campaign...'
                      : 'Confirm Campaign'}
                </Button>
              </Stack>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isStepValid() || isLoading || isConfirming}
                sx={{
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

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleConfirmCampaign}
                disabled={isConfirming || isLoading || !isStepValid()}
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
                {isConfirming
                  ? 'Opening Preview...'
                  : isLoading
                    ? 'Creating Campaign...'
                    : 'Confirm Campaign'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isStepValid() || isLoading || isConfirming}
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
              primary="Confirm campaign"
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
                  setStatus('');
                  confirmation.onFalse();
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Dialog>

        {/* Add confirmation modal */}
        <Dialog
          fullWidth
          maxWidth="sm"
          open={openConfirmModal}
          onClose={() => !isLoading && setOpenConfirmModal(false)}
          PaperProps={{
            sx: {
              borderRadius: 2,
              maxHeight: '90vh',
            },
          }}
        >
          <DialogContent sx={{ overflow: 'auto', maxHeight: 'calc(90vh - 64px)', p: 0 }}>
            <CampaignUploadPhotos isPreview isLoading={isLoading} />

            {/* Loading overlay for confirmation modal */}
            {isLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    textAlign: 'center',
                    bgcolor: 'white',
                    borderRadius: 2,
                    p: 3,
                    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #E7E7E7',
                    minWidth: 280,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: '#FFD700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -1,
                        left: -1,
                        right: -1,
                        bottom: -1,
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                        zIndex: -1,
                        animation: 'rotate 2s linear infinite',
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 24,
                        lineHeight: 1,
                        userSelect: 'none',
                      }}
                    >
                      ⏳
                    </Typography>
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: '#3A3A3C',
                      fontWeight: 600,
                      fontSize: '1rem',
                      mb: 1,
                    }}
                  >
                    Processing
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#8E8E93',
                      fontSize: '0.8rem',
                    }}
                  >
                    Please wait...
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </FormProvider>

      <PackageCreateDialog
        open={openPackage.value}
        onClose={openPackage.onFalse}
        setValue={setValue}
      />

      <TimelineTypeModal open={modal.value} onClose={modal.onFalse} />

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