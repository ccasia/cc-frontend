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
import OtherAttachments from 'src/sections/campaign/create/steps/other-attachments';
// Import steps from campaign creation
import TimelineTypeModal from 'src/sections/campaign/create/steps/timeline-type-modal';

import CampaignUploadPhotos from './campaign-upload-photos';
// Import custom client campaign components
import ClientCampaignGeneralInfo from './campaign-general-info';
import CampaignTargetAudience from './campaign-target-audience';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;

// Define client-specific steps (ending at upload photos)
const steps = [
  { title: 'General Campaign Information', logo: '💬', color: '#8A5AFE' },
  { title: 'Target Audience', logo: '👥', color: '#FFF0E5' },
  { title: 'Upload campaign photos', logo: '📸', color: '#FF3500' },
  // HIDE: logistics
  // { title: 'Logistics (Optional)', logo: '📦', color: '#D8FF01' },
  // { title: 'Reservation Slots', logo: '🗓️', color: '#D8FF01' },
  // { title: 'Additional Logistic Remarks ( Optional )', logo: '✏️', color: '#D8FF01' },
  { title: 'Other Attachment ( Optional )', logo: '🖇️', color: '#FF3500' },
];

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
  const [image, setImage] = useState(null);
  const [campaignDo, setcampaignDo] = useState(['']);
  const [campaignDont, setcampaignDont] = useState(['']);
  const [pages, setPages] = useState(0);

  const smDown = useResponsive('down', 'sm');

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
    campaignObjectives: Yup.array()
      .min(1, 'At least one objective is required')
      .required('Campaign objectives is required'),
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
    countries: Yup.array()
      .min(1, 'At least one country is required')
      .required('Countries is required'),
    audienceLocation: Yup.array().when('countries', {
      is: (countries) => countries && countries.includes('Malaysia'),
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

  const campaignImagesSchema = Yup.object().shape({
    campaignImages: Yup.array()
      .min(1, 'Must have at least 1 image')
      .max(5, 'Must have at most 5 images'),
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
    locations: Yup.array().notRequired(),

    venueName: Yup.string().when('logisticType', {
      is: 'RESERVATION',
      then: (schema) => schema,
      otherwise: (schema) => schema,
    }),
    venueAddress: Yup.string().when('logisticsType', {
      is: 'RESERVATION',
      then: (schema) => schema,
      otherwise: (schema) => schema,
    }),
    reservationNotes: Yup.string().when('logisticsType', {
      is: 'RESERVATION',
      then: (schema) => schema,
      otherwise: (schema) => schema,
    }),
  });

  const campaignAdminSchema = Yup.object().shape({
    adminManager: Yup.array()
      .min(1, 'At least One Admin is required')
      .required('Admin Manager is required'),
  });

  const timelineSchema = Yup.object().shape({
    campaignStartDate: Yup.string().required('Campaign Start Date is required.'),
  });

  const agreementSchema = Yup.object().shape({
    agreementFrom: Yup.object().required('Campaign agreement is required.'),
  });

  const campaignTypeSchema = Yup.object().shape({
    campaignType: Yup.string().required('Campaign type is required.'),
    deliverables: Yup.array()
      .min(1, 'At least one deliverable is required')
      .required('Deliverables are required'),
    rawFootage: Yup.boolean(),
    photos: Yup.boolean(),
    ads: Yup.boolean(),
  });

  const getSchemaForStep = (step) => {
    switch (step) {
      case 0:
        return campaignInformationSchema;
      case 1:
        return campaignRequirementSchema;
      case 2:
        return campaignImagesSchema;

      // HIDE: logistics
      // case 3:
      //   return logisticsSchema;
      // case 4:
      // case 5:
      //   return Yup.object().shape({});
      // case 6:
      //   return Yup.object().shape({
      //     otherAttachments: Yup.array(),
      //     referencesLinks: Yup.array().of(Yup.object().shape({ value: Yup.string() })),
      //   });
      // default:
      //   return campaignSchema;
      case 3:
        return Yup.object().shape({
          otherAttachments: Yup.array(),
          referencesLinks: Yup.array().of(Yup.object().shape({ value: Yup.string() })),
        });
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
    campaignObjectives: [],
    brandTone: '',
    productServiceName: '',
    audienceUserPersona: '',
    audienceGender: [],
    audienceAge: [],
    audienceLocation: [],
    othersAudienceLocation: '',
    audienceLanguage: [],
    audienceCreatorPersona: [],
    country: '',
    countries: [],
    socialMediaPlatform: [],
    videoAngle: [],
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
    submissionVersion: 'v3',
    logisticsType: '',
    logisticRemarks: '',
    schedulingOption: 'confirmation',
    products: [{ name: '' }],
    locations: [{ name: '' }],
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

  const isStepOptional = (step) => step === 7;

  const handleNext = async () => {
    // Prevent progressing if credits are zero or invalid
    const creditsErrorRef = { current: false };
    const listener = (e) => {
      creditsErrorRef.current = !!e?.detail;
    };
    window.addEventListener('client-campaign-credits-error', listener, { once: true });

    const result = await trigger();
    window.removeEventListener('client-campaign-credits-error', listener);

    // Also validate locally: if availableCredits is 0 and step is General Campaign Information
    const isGeneralInfoStep = steps[activeStep]?.title === 'General Campaign Information';
    const requestedCredits = Number(getValues('campaignCredits') || 0);
    const availableCredits = Number(localStorage.getItem('clientAvailableCredits') || 0);
    const isExceed =
      isGeneralInfoStep &&
      (availableCredits <= 0 || requestedCredits <= 0 || requestedCredits > availableCredits);

    if (result && !creditsErrorRef.current && !isExceed) {
      const logisticsType = getValues('logisticsType');
      let nextStep = activeStep + 1;

      if (activeStep === 3 && logisticsType !== 'RESERVATION' && nextStep === 4) {
        nextStep = 6;
      } else if (activeStep === 4 && logisticsType === 'RESERVATION') {
        nextStep = 5;
      }

      localStorage.setItem('clientActiveStep', nextStep);
      setActiveStep(nextStep);
    } else if (isExceed) {
      enqueueSnackbar('Please include or adjust Number Of Credits based on available credits', {
        variant: 'error',
      });
    }
  };

  const handleBack = () => {
    const logisticType = getValues('logisticsType');
    let prevStep = activeStep - 1;

    if (activeStep === 6) {
      if (logisticType !== 'RESERVATION') {
        prevStep = 3;
      } else {
        prevStep = 5;
      }
    }

    localStorage.setItem('clientActiveStep', prevStep);
    setActiveStep(prevStep);
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
        productName: data.productName || '',
        campaignIndustries: Array.isArray(data.campaignIndustries) ? data.campaignIndustries : [],
        campaignObjectives: Array.isArray(data.campaignObjectives) ? data.campaignObjectives : [],
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
        country: data.countries && data.countries.length > 0 ? data.countries : [data.country].filter(Boolean),
        countries: Array.isArray(data.countries) ? data.countries : [],
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
        submissionVersion: data.submissionVersion || 'v3',
        logisticsType: data.logisticsType || '',
        logisticRemarks: data.logisticRemarks || '',
        products: data.products || [],
        locations: data.locations || [],
        venueName: data.venueName || '',
        venueAddress: data.venueAddress || '',
        reservationNotes: data.reservationNotes || '',
        schedulingOption: data.schedulingOption || 'confirmation',
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
      setIsConfirming(false)
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

  // Modify the step content function to handle client flow
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <ClientCampaignGeneralInfo />;
      case 1:
        return <CampaignTargetAudience />;
      case 2:
        return <CampaignUploadPhotos isLoading={isLoading} />;
      // HIDE: logistics
      // case 3:
      //   return <CampaignLogistics />;
      // case 4:
      //   return <ReservationSlots />;
      // case 5:
      //   return <LogisticRemarks />;
      // case 6:
      //   return <OtherAttachments />;
      // default:
      //   return null;
      case 3:
        return <OtherAttachments />;
      default:
        return null;
    }
  };

  const startDate = getValues('campaignStartDate');
  const campaignStartDate = watch('campaignStartDate');

  return (
    <Box>
      <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <IconButton
            sx={{
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              border: 1,
              pb: 1.3,
              borderRadius: 1,
              borderColor: '#E7E7E7',
            }}
            color="default"
            variant="outlined"
            disabled={isLoading || isConfirming}
            onClick={onClose}
          >
            <Iconify icon="ic:round-close" />
          </IconButton>

          <Box
            sx={{
              position: 'absolute',
              top: smDown,
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
                  backgroundColor: '#1340FF',
                },
              }}
            />
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

            <Box sx={{ flexGrow: 1 }} />

            {activeStep === steps.length - 1 ? (
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleConfirmCampaign}
                  disabled={isConfirming || isLoading}
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
              </Stack>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={isLoading || isConfirming}
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

            <Box my={5} overflow="auto" minHeight={400}>
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
                disabled={isConfirming || isLoading}
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
                disabled={isLoading || isConfirming}
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