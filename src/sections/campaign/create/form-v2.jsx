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
import React, { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import {
  Stack,
  Avatar,
  Dialog,
  Divider,
  Tooltip,
  ButtonBase,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetCompany from 'src/hooks/use-get-company';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetCampaignById } from 'src/hooks/use-get-campaign-by-id';
import useGetDefaultTimeLine from 'src/hooks/use-get-default-timeline';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import NextStepsIcon from 'src/assets/icons/next-steps-icon';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form';

import CloseDraftDialog from './close-draft-dialog';
import DraftSaveIndicator from './draft-save-indicator';
import { diffUserContent } from './utils/has-user-content';
import useCampaignDraftAutosave from './hooks/use-campaign-draft-autosave';
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

const getDraftFileUrls = (value) =>
  (Array.isArray(value) ? value : [value])
    .filter((item) => item?.draftFile === true && typeof item.url === 'string')
    .map((item) => item.url);

const formatDraftUpdatedAt = (value) => {
  if (!value) return 'Recently updated';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently updated';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

function DraftPicker({ open, drafts, currentDraftId, onClose, onSelect, onDelete }) {
  // Deleting a draft is not undoable, so the row asks first instead of a
  // second dialog stacking on top of this one.
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    if (!open) setPendingDelete(null);
  }, [open]);

  // Newest first -- the draft you were last in is almost always the one you want.
  const sortedDrafts = [...drafts].sort(
    (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="saved-drafts-title"
      aria-describedby="saved-drafts-description"
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <DialogTitle
        id="saved-drafts-title"
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          px: { xs: 2.5, sm: 3.5 },
          pt: { xs: 2.5, sm: 3.5 },
          pb: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Typography
              sx={{
                color: '#221F20',
                fontFamily: 'Instrument Serif, serif',
                fontSize: { xs: '2rem', sm: '2.3rem' },
                lineHeight: 1.05,
              }}
            >
              Open saved draft
            </Typography>
            {sortedDrafts.length > 0 && (
              <Box
                component="span"
                sx={{
                  mt: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: '#F0F0F3',
                  color: '#636366',
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {sortedDrafts.length}
              </Box>
            )}
          </Stack>
          <Typography
            id="saved-drafts-description"
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 390 }}
          >
            Choose a saved campaign to continue where you left off. Your current work is saved
            first.
          </Typography>
        </Box>
        <IconButton aria-label="Close saved drafts" onClick={onClose} sx={{ mt: -0.75, mr: -1 }}>
          <Iconify icon="material-symbols:close" width={22} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2.5, maxHeight: { xs: '55vh', sm: 420 } }}
      >
        {sortedDrafts.length === 0 ? (
          <Box
            sx={{
              px: 2,
              py: { xs: 4, sm: 5 },
              textAlign: 'center',
              border: '1px dashed #D9D9DE',
              borderRadius: 2,
              bgcolor: '#FAFAFB',
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'grid',
                placeItems: 'center',
                mx: 'auto',
                mb: 1.5,
                borderRadius: '50%',
                bgcolor: '#F0F0F3',
                color: '#636366',
              }}
            >
              <Iconify icon="solar:folder-with-files-bold" width={24} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>
              No saved drafts yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Your saved campaigns will appear here.
            </Typography>
          </Box>
        ) : (
          <Stack component="ul" role="list" spacing={1.25} sx={{ m: 0, p: 0, listStyle: 'none' }}>
            {sortedDrafts.map((draft) => {
              const name = draft.payload?.campaignName?.trim() || 'Untitled draft';
              const isCurrent = Boolean(currentDraftId) && draft.id === currentDraftId;
              const isConfirming = pendingDelete === draft.id;

              return (
                <Box component="li" key={draft.id}>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: isConfirming ? '#FFC2B3' : isCurrent ? '#1340FF' : '#E6E6EA',
                      bgcolor: isConfirming ? '#FFF6F4' : '#fff',
                      transition: 'border-color 160ms ease, background-color 160ms ease',
                      '&:hover': {
                        borderColor: isConfirming ? '#FFC2B3' : isCurrent ? '#1340FF' : '#BDBDC5',
                      },
                    }}
                  >
                    {isConfirming ? (
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        justifyContent="space-between"
                        spacing={1}
                        sx={{ p: 1.5, pl: 2 }}
                      >
                        <Typography variant="body2" sx={{ minWidth: 0 }}>
                          Delete <b>{name}</b>? This cannot be undone.
                        </Typography>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            onClick={() => setPendingDelete(null)}
                            sx={{ textTransform: 'none', fontWeight: 600, color: '#3A3A3C' }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              onDelete(draft.id);
                              setPendingDelete(null);
                            }}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 600,
                              bgcolor: '#FF5630',
                              '&:hover': { bgcolor: '#E0421F' },
                            }}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </Stack>
                    ) : (
                      <>
                        <ButtonBase
                          onClick={() => onSelect(draft.id)}
                          disabled={isCurrent}
                          sx={{
                            width: '100%',
                            gap: 1.5,
                            p: 1.5,
                            pr: 6,
                            borderRadius: 2,
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                            '&.Mui-disabled': { opacity: 1 },
                          }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              flexShrink: 0,
                              display: 'grid',
                              placeItems: 'center',
                              borderRadius: 1.5,
                              bgcolor: isCurrent ? '#EAEEFF' : '#F5F5F7',
                              color: isCurrent ? '#1340FF' : '#636366',
                            }}
                          >
                            <Iconify icon="solar:document-text-bold" width={20} />
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                              <Typography fontWeight={700} noWrap sx={{ minWidth: 0 }}>
                                {name}
                              </Typography>
                              {isCurrent && (
                                <Box
                                  component="span"
                                  sx={{
                                    px: 0.75,
                                    py: 0.125,
                                    borderRadius: 0.75,
                                    bgcolor: '#EAEEFF',
                                    color: '#1340FF',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                  }}
                                >
                                  Open now
                                </Box>
                              )}
                            </Stack>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              Last updated {formatDraftUpdatedAt(draft.updatedAt)}
                            </Typography>
                          </Box>

                          {!isCurrent && (
                            <Iconify
                              icon="eva:arrow-ios-forward-fill"
                              width={20}
                              sx={{ color: '#A0A0A8', flexShrink: 0 }}
                            />
                          )}
                        </ButtonBase>

                        {!isCurrent && (
                          <Tooltip title="Delete draft" arrow>
                            <IconButton
                              aria-label={`Delete ${name}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setPendingDelete(draft.id);
                              }}
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                right: 8,
                                transform: 'translateY(-50%)',
                                color: '#A0A0A8',
                                '&:hover': { color: '#FF5630', bgcolor: '#FFF0EC' },
                              }}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            height: 40,
            textTransform: 'none',
            fontWeight: 600,
            color: '#3A3A3C',
            borderColor: '#E7E7E7',
            boxShadow: '0px -1.5px 0px 0px rgba(0, 0, 0, 0.05) inset',
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

DraftPicker.propTypes = {
  open: PropTypes.bool.isRequired,
  drafts: PropTypes.arrayOf(PropTypes.object).isRequired,
  currentDraftId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

function CreateCampaignFormV2({
  onClose,
  mutate: mutateCampaignList,
  mode = 'create',
  campaignId,
  onSuccess,
}) {
  const isActivateMode = mode === 'activate';
  const confirmLabel = isActivateMode ? 'Confirm Activation' : 'Confirm Campaign';
  const confirmLoadingLabel = isActivateMode ? 'Activating Campaign...' : 'Creating Campaign...';
  const confirmShortLoadingLabel = isActivateMode ? 'Activating...' : 'Creating...';

  const openCompany = useBoolean();
  const openBrand = useBoolean();
  const confirmation = useBoolean();
  const openPackage = useBoolean();

  const { user } = useAuthContext();

  const { data: companyListData, mutate: mutateCompanyList } = useGetCompany();
  const { data: defaultTimelines } = useGetDefaultTimeLine();
  const { campaign: existingCampaign } = useGetCampaignById(isActivateMode ? campaignId : null);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  const [status, setStatus] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closeDraftOpen, setCloseDraftOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [brandState, setBrandState] = useState('');
  const [hasCreditError, setHasCreditError] = useState(false);
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
  const [draftPickerOpen, setDraftPickerOpen] = useState(false);

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
    reservationDraft: null,
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
    // All new campaigns use the v4 flow; the isV4Submission toggle now only controls
    // client attachment (client campaign), not the version.
    submissionVersion: 'v4',

    isV4Submission: true,
    isCreditTier: false,
  };

  // useForm captures defaultValues on the first render only, and every later
  // reset() rebases formState.defaultValues to whatever it was given -- the
  // autosave restore does exactly that. Freeze the original so "does this form
  // hold real work?" is always measured against a pristine form, not a draft.
  const pristineDefaults = useRef(defaultValues);

  const methods = useForm({
    resolver: yupResolver(getSchemaForStep(activeStep)),
    defaultValues,
    mode: 'onChange',
  });

  const { handleSubmit, getValues, reset, setValue, watch, trigger } = methods;

  const {
    status: draftSaveStatus,
    lastSavedAt,
    flush: flushDraft,
    freezeAndFlush,
    resumeAutosave,
    discardDraft,
    clearLocalDraft,
    drafts,
    draftId,
    loadDraft,
    deleteDraft,
  } = useCampaignDraftAutosave({
    enabled: !isActivateMode,
    userId: user?.id,
    methods,
    activeStep,
    showAdditionalDetails,
    setActiveStep,
    setShowAdditionalDetails,
  });

  const handleClose = async () => {
    // Only ask about the draft when the form really holds something. A draft
    // record can exist while being completely empty, so compare the values
    // against the baseline React Hook Form itself captured on first render --
    // rebuilding `defaultValues` here would drift (e.g. `campaignManager`
    // resolves to [] before `user` loads and to [user] afterwards).
    const changed = isActivateMode ? [] : diffUserContent(getValues(), pristineDefaults.current);

    if (changed.length) {
      setCloseDraftOpen(true);
      return;
    }
    try {
      await flushDraft();
      onClose();
    } catch (error) {
      enqueueSnackbar('Draft could not be saved. Please try again.', { variant: 'error' });
    }
  };

  const handleKeepEditing = () => setCloseDraftOpen(false);

  // The dialog drives its own saving / saved phases and calls back when it is
  // finished, so these only do the work -- not the closing.
  const handleSaveAsDraft = async () => {
    try {
      await flushDraft();
    } catch (error) {
      enqueueSnackbar('Draft could not be saved. Please try again.', { variant: 'error' });
      throw error;
    }
  };
  const handleSaveButton = () => handleSaveAsDraft().catch(() => {});

  const handleDiscardDraft = async () => {
    await discardDraft();
    reset();
    setActiveStep(0);
    setShowAdditionalDetails(false);
  };

  const handleOpenSavedDraft = async (id) => {
    try {
      await flushDraft();
      await loadDraft(id);
      setDraftPickerOpen(false);
    } catch (error) {
      enqueueSnackbar('Save the current draft before switching.', { variant: 'error' });
    }
  };

  const handleDraftDialogDone = () => {
    setCloseDraftOpen(false);
    onClose();
  };

  // Watch all form values to trigger re-render when values change
  const formValues = watch();

  useEffect(() => {
    if (brandState) {
      setValue('campaignBrand', brandState);
    }
  }, [brandState, setValue]);

  useEffect(() => {
    if (!isActivateMode || hasPrefilled || !existingCampaign) return;

    const campaign = existingCampaign;
    const brief = campaign.campaignBrief || {};
    const req = campaign.campaignRequirement || {};
    const details = campaign.campaignAdditionalDetails || {};

    const clientFromList =
      (companyListData || []).find((co) => co.id === campaign.company?.id) ||
      campaign.company ||
      null;

    const deliverables = [];
    if (campaign.photos) deliverables.push('PHOTOS');
    if (campaign.rawFootage) deliverables.push('RAW_FOOTAGES');
    if (campaign.ads) deliverables.push('ADS');
    if (campaign.crossPosting) deliverables.push('CROSS_POSTING');
    if (deliverables.length === 0) deliverables.push('UGC_VIDEOS');

    // Map assigned admins to the user objects the manager autocomplete expects.
    const campaignManager = (campaign.campaignAdmin || [])
      .map((ca) => ca.admin?.user)
      .filter(Boolean);

    // Industries may be stored as an array or a comma-joined string.
    let campaignIndustries = [];
    if (Array.isArray(brief.industries)) {
      campaignIndustries = brief.industries;
    } else if (typeof brief.industries === 'string' && brief.industries) {
      campaignIndustries = brief.industries.split(',').map((s) => s.trim());
    }

    reset({
      ...defaultValues,
      // General info
      client: clientFromList,
      campaignBrand: campaign.brand || null,
      campaignCredits: campaign.campaignCredits ?? null,
      campaignName: campaign.name || '',
      campaignDescription: campaign.description || '',
      brandAbout: campaign.brandAbout || '',
      // Campaign Start/End are intentionally left EMPTY on activate. CampaignBrief
      // requires startDate/endDate columns, so the brief flow fills them with a
      // fallback (the posting window or "now") even when no real campaign window
      // was entered — prefilling them would surface that fallback. The CSM sets
      // the actual campaign dates during activation.
      campaignStartDate: null,
      campaignEndDate: null,
      // Posting period IS prefilled. Store JS Dates (not dayjs) — the date pickers
      // render via the global date-fns LocalizationProvider, which expects Date
      // objects; a dayjs value renders blank. onChange also writes Dates.
      postingStartDate: brief.postingStartDate ? dayjs(brief.postingStartDate).toDate() : null,
      postingEndDate: brief.postingEndDate ? dayjs(brief.postingEndDate).toDate() : null,
      productName: campaign.productName || '',
      campaignIndustries,
      websiteLink: campaign.websiteLink || '',
      campaignImages: Array.isArray(brief.images) ? brief.images : [],

      // Objectives
      campaignObjectives: brief.objectives || '',
      secondaryObjectives: Array.isArray(brief.secondaryObjectives)
        ? brief.secondaryObjectives
        : [],
      boostContent: brief.boostContent || '',
      primaryKPI: brief.primaryKPI || '',
      performanceBaseline: brief.performanceBaseline || '',

      // Target audience
      country: req.country || '',
      countries: Array.isArray(req.countries) ? req.countries : [],
      audienceGender: req.gender || [],
      audienceAge: req.age || [],
      audienceLanguage: req.language || [],
      audienceCreatorPersona: req.creator_persona || [],
      audienceUserPersona: req.user_persona || '',
      geographicFocus: req.geographic_focus || '',
      geographicFocusOthers: req.geographicFocusOthers || '',
      secondaryAudienceGender: req.secondary_gender || [],
      secondaryAudienceAge: req.secondary_age || [],
      secondaryAudienceLanguage: req.secondary_language || [],
      secondaryAudienceCreatorPersona: req.secondary_creator_persona || [],
      secondaryAudienceUserPersona: req.secondary_user_persona || '',
      secondaryCountry: req.secondary_country || '',

      // Logistics
      logisticsType: campaign.logisticsType || '',
      products:
        Array.isArray(campaign.products) && campaign.products.length > 0
          ? campaign.products.map((p) => ({ name: p.productName }))
          : [{ name: '' }],
      schedulingOption:
        campaign.reservationConfig?.mode === 'AUTO_SCHEDULE' ? 'auto' : 'confirmation',
      locations:
        Array.isArray(campaign.reservationConfig?.locations) &&
        campaign.reservationConfig.locations.length > 0
          ? campaign.reservationConfig.locations
          : [{ name: '', pic: '', contactNumber: '' }],
      availabilityRules: Array.isArray(campaign.reservationConfig?.availabilityRules)
        ? campaign.reservationConfig.availabilityRules
        : [],
      allowMultipleBookings: !!campaign.reservationConfig?.allowMultipleBookings,
      clientRemarks: campaign.reservationConfig?.clientRemarks || '',

      // Campaign management
      campaignManager: campaignManager.length > 0 ? campaignManager : [],
      campaignType: campaign.campaignType || 'normal',
      deliverables,
      rawFootage: !!campaign.rawFootage,
      photos: !!campaign.photos,
      crossPosting: !!campaign.crossPosting,
      ads: !!campaign.ads,
      agreementFrom: campaign.agreementTemplate || null,

      // Additional Details
      socialMediaPlatform: Array.isArray(brief.socialMediaPlatform)
        ? brief.socialMediaPlatform
        : [],
      contentFormat: Array.isArray(details.contentFormat) ? details.contentFormat : [],
      mainMessage: details.mainMessage || '',
      keyPoints: details.keyPoints || '',
      toneAndStyle: details.toneAndStyle || '',
      referenceContent: details.referenceContent || '',
      // Brand guidelines: the admin-flow URL (campaignAdditionalDetails) plus any
      // attachments the prospect/BD uploaded into the brief (otherAttachments).
      // RHFUpload renders these existing URL strings as previews; only newly
      // added File objects are re-uploaded on submit.
      brandGuidelines: [
        // brandGuidelinesUrl may hold multiple comma-joined URLs (the backend
        // joins them on save) — split back into individual previews.
        ...(details.brandGuidelinesUrl
          ? details.brandGuidelinesUrl
              .split(',')
              .map((u) => u.trim())
              .filter(Boolean)
          : []),
        ...(Array.isArray(brief.otherAttachments) ? brief.otherAttachments : []),
      ],
      productImage1: details.productImage1Url ? [details.productImage1Url] : [],
      productImage2: details.productImage2Url ? [details.productImage2Url] : [],
      hashtagsToUse: details.hashtagsToUse || '',
      mentionsTagsRequired: details.mentionsTagsRequired || '',
      creatorCompensation: details.creatorCompensation || '',
      ctaDesiredAction: details.ctaDesiredAction || '',
      ctaLinkUrl: details.ctaLinkUrl || '',
      ctaPromoCode: details.ctaPromoCode || '',
      ctaLinkInBioRequirements: details.ctaLinkInBioRequirements || '',
      specialNotesInstructions: details.specialNotesInstructions || '',
      needAds: details.needAds || '',
      submissionVersion: campaign.submissionVersion || 'v2',
    });

    setHasPrefilled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActivateMode, hasPrefilled, existingCampaign, companyListData, reset]);

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
        return ['campaignObjectives', 'secondaryObjectives'];
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
    let draftSource = null;
    if (!isActivateMode) {
      try {
        draftSource = await freezeAndFlush();
      } catch (error) {
        resumeAutosave();
        enqueueSnackbar('Draft could not be saved. Campaign was not created.', {
          variant: 'error',
        });
        return;
      }
    }
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
      creationDraftId: isActivateMode ? undefined : draftSource?.id,
      creationDraftRevision: isActivateMode ? undefined : draftSource?.revision,
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
      // 'v4' for all new campaigns; activate-mode prefill preserves a legacy campaign's version
      submissionVersion: data.submissionVersion || 'v4',
      // Attach the selected company's client users as client managers
      isClientCampaign: !!data.isV4Submission,
      draftCampaignImageUrls: getDraftFileUrls(data.campaignImages),
      draftBrandGuidelineUrls: getDraftFileUrls(data.brandGuidelines),
      draftProductImage1Url: getDraftFileUrls(data.productImage1)[0] || null,
      draftProductImage2Url: getDraftFileUrls(data.productImage2)[0] || null,
    };
    delete campaignData.reservationDraft;

    formData.append('rawFootage', campaignData.rawFootage ? 'true' : 'false');
    formData.append('photos', campaignData.photos ? 'true' : 'false');
    formData.append('data', JSON.stringify(campaignData));

    // Append images
    if (Array.isArray(data.campaignImages)) {
      data.campaignImages.forEach((img) => {
        if (img instanceof File) {
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

    // Append brand guidelines. New File uploads go under `brandGuidelines`;
    if (data.brandGuidelines && Array.isArray(data.brandGuidelines)) {
      for (let i = 0; i < data.brandGuidelines.length; i += 1) {
        const item = data.brandGuidelines[i];
        if (item instanceof File) {
          formData.append('brandGuidelines', item);
        } else if (typeof item === 'string' && item) {
          formData.append('existingBrandGuidelines', item);
        }
      }
    }

    // Append product images
    if (data.productImage1 && Array.isArray(data.productImage1)) {
      for (let i = 0; i < data.productImage1.length; i += 1) {
        if (data.productImage1[i] instanceof File) {
          formData.append('productImage1', data.productImage1[i]);
        }
      }
    }

    if (data.productImage2 && Array.isArray(data.productImage2)) {
      for (let i = 0; i < data.productImage2.length; i += 1) {
        if (data.productImage2[i] instanceof File) {
          formData.append('productImage2', data.productImage2[i]);
        }
      }
    }

    try {
      setIsLoading(true);
      const submitUrl = isActivateMode
        ? endpoints.campaign.activateCampaignFull(campaignId)
        : endpoints.campaign.createCampaignV2;
      const res = await axiosInstance.post(submitUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setIsLoading(false);
      enqueueSnackbar(res?.data?.message, {
        variant: 'success',
      });
      if (!isActivateMode && draftSource?.id) await clearLocalDraft(draftSource.id);
      if (!isActivateMode) resumeAutosave();
      reset();
      if (mutateCampaignList) {
        mutateCampaignList();
      }
      if (onSuccess) {
        onSuccess();
      }
      setStatus('');
      confirmation.onFalse();
      setActiveStep(0);
      localStorage.setItem('adminActiveStep', 0);
      onClose();
    } catch (error) {
      if (!isActivateMode) resumeAutosave();
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
              mode={mode}
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
      mode,
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
        const { postingStartDate } = formValues;
        const { postingEndDate } = formValues;
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
        return objectives && secObjectives;
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

  // The draft buttons collapse to icons on narrower screens so the step
  // indicator keeps the true centre of the header.
  const showDraftLabels = useResponsive('up', 'xl');

  // Same shape as the Back button, so every header control reads as one set.
  const draftActionSx = {
    height: 45,
    minWidth: showDraftLabels ? 'auto' : 45,
    ...(showDraftLabels ? {} : { px: 0 }),
    bgcolor: 'white',
    border: '1px solid #E7E7E7',
    color: '#3A3A3C',
    '&:hover': {
      bgcolor: '#F8F8F8',
      border: '1px solid #E7E7E7',
    },
    fontWeight: 600,
    whiteSpace: 'nowrap',
    boxShadow: '0px -1.5px 0px 0px rgba(0, 0, 0, 0.05) inset',
    '& .MuiButton-startIcon': { mr: showDraftLabels ? 0.75 : 0, ml: 0 },
  };

  return (
    <Box>
      <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
        {/* 3-column grid: the two `1fr` side columns stay equal, so the step
            indicator in the middle lands on the true centre of the header. */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            columnGap: { xs: 1, md: 2 },
            rowGap: 1,
            alignItems: 'center',
          }}
        >
          {/* Left cluster -- everything that acts on "this draft" lives together:
              close, save, open, and the autosave status. */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ justifySelf: 'start', minWidth: 0, flexWrap: 'wrap', rowGap: 1 }}
          >
            <IconButton
              sx={{
                border: 1,
                borderRadius: 1,
                boxShadow: '0px -1.5px 0px 0px #E7E7E7 inset',
                borderColor: '#E7E7E7',
                height: 45,
                width: 45,
                padding: 1,
                flexShrink: 0,
              }}
              size="large"
              disabled={isLoading}
              onClick={handleClose}
            >
              <Iconify icon="material-symbols:close" width={20} color="#231F20" />
            </IconButton>

            {!isActivateMode && (
              <>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    my: 0.75,
                    borderColor: '#E7E7E7',
                    display: { xs: 'none', sm: 'block' },
                  }}
                />

                <Tooltip title={showDraftLabels ? '' : 'Save draft'} arrow>
                  <Button
                    type="button"
                    color="inherit"
                    aria-label="Save draft"
                    onClick={handleSaveButton}
                    startIcon={<Iconify icon="solar:diskette-bold" width={18} />}
                    sx={draftActionSx}
                  >
                    {showDraftLabels && 'Save draft'}
                  </Button>
                </Tooltip>

                <Tooltip title={showDraftLabels ? '' : 'Open saved draft'} arrow>
                  <Button
                    type="button"
                    color="inherit"
                    aria-label="Open saved draft"
                    onClick={() => setDraftPickerOpen(true)}
                    startIcon={<Iconify icon="solar:folder-with-files-bold" width={18} />}
                    sx={draftActionSx}
                  >
                    {showDraftLabels && 'Open saved draft'}
                  </Button>
                </Tooltip>

                <Box sx={{ display: 'flex', alignItems: 'center', pl: 0.5, minWidth: 0 }}>
                  <DraftSaveIndicator
                    status={draftSaveStatus}
                    lastSavedAt={lastSavedAt}
                    onRetry={handleSaveButton}
                  />
                </Box>
              </>
            )}
          </Stack>

          {/* Step Indicator - Clickable navigation.
              In flow (not absolute) so the header never overlaps the nav buttons. */}
          <Box
            sx={{
              minWidth: 0,
              display: { xs: 'none', sm: 'flex' },
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              sx={{ width: '100%', maxWidth: 900, minWidth: 0 }}
            >
              {/* Back Section (Client, General, Objective, Audience, Logistics, Finalise) */}
              {inBackSection &&
                backSectionLabels.map((label, index) => (
                  <React.Fragment key={label}>
                    <Box
                      onClick={() => handleBackSectionStepClick(index)}
                      sx={{
                        minWidth: { sm: 62, md: 84, lg: 100 },
                        flexShrink: 1,
                        px: { sm: 0.75, md: 1.5 },
                        height: 45,
                        py: 1.2,
                        textAlign: 'center',
                        borderRadius: 1,
                        fontSize: { sm: 11, md: 12, lg: 13 },
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
                          minWidth: { sm: 6, md: 12, lg: 20 },
                          maxWidth: { sm: 16, md: 28, lg: 40 },
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
                    minWidth: { sm: 6, md: 12, lg: 20 },
                    maxWidth: { sm: 16, md: 28, lg: 40 },
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
                          minWidth: { sm: 6, md: 12, lg: 20 },
                          maxWidth: { sm: 16, md: 28, lg: 40 },
                          bgcolor: frontSectionIndicator >= index ? '#1340FF' : '#636366',
                        }}
                      />
                      <Box
                        onClick={() => handleFrontSectionStepClick(index)}
                        sx={{
                          minWidth: { sm: 62, md: 84, lg: 100 },
                          flexShrink: 1,
                          px: { sm: 0.75, md: 1.5 },
                          height: 45,
                          py: 1.2,
                          textAlign: 'center',
                          borderRadius: 1,
                          fontSize: { sm: 11, md: 12, lg: 13 },
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

          {/* Step navigation -- right column of the same header row, so the
              header never grows a second row of controls. */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            sx={{
              justifySelf: 'end',
              minWidth: 0,
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{
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
                  {isLoading ? confirmLoadingLabel : confirmLabel}
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

          {/* Close-with-unsaved-draft confirmation */}
          <CloseDraftDialog
            open={closeDraftOpen}
            campaignName={watch('campaignName')}
            onKeepEditing={handleKeepEditing}
            onSaveDraft={handleSaveAsDraft}
            onDiscard={handleDiscardDraft}
            onDone={handleDraftDialogDone}
          />

          <DraftPicker
            open={draftPickerOpen}
            drafts={drafts}
            currentDraftId={draftId}
            onClose={() => setDraftPickerOpen(false)}
            onSelect={handleOpenSavedDraft}
            onDelete={deleteDraft}
          />

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
                {isActivateMode ? 'Confirm Activation' : 'Confirm Campaign'}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {isActivateMode
                  ? 'Are you sure you want to activate this campaign?'
                  : 'Are you sure you want to publish this campaign?'}
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
                  {(() => {
                    if (isActivateMode) return isLoading ? 'Activating...' : 'Activate Now';
                    return isLoading ? 'Publishing...' : 'Publish Now';
                  })()}
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
        </Box>

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
              {isLoading ? confirmShortLoadingLabel : 'Confirm'}
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
            {isLoading ? confirmShortLoadingLabel : confirmLabel}
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
            {isActivateMode ? 'Activating Your Campaign' : 'Creating Your Campaign'}
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
  mode: PropTypes.oneOf(['create', 'activate']),
  campaignId: PropTypes.string,
  onSuccess: PropTypes.func,
};
