/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-vars */
import dayjs from 'dayjs';
import * as Yup from 'yup';
import { pdfjs } from 'react-pdf';
import PropTypes from 'prop-types';
import 'react-pdf/dist/Page/TextLayer.css';
import { enqueueSnackbar } from 'notistack';
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
  LinearProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form';

import CreateBrand from './brandDialog';
import CreateCompany from './companyDialog';
import SelectBrand from './steps/select-brand';
import CampaignType from './steps/campaign-type';
import SelectTimeline from './steps/select-timeline';
import CampaignFormUpload from './steps/form-upload';
import GeneralCampaign from './steps/general-campaign';
import CampaignDetails from './steps/campaign-details';
import CampaignImageUpload from './steps/image-upload';
import CampaignAdminManager from './steps/admin-manager';
import OtherAttachments from './steps/other-attachments';
import TimelineTypeModal from './steps/timeline-type-modal';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const steps = [
  { title: 'Select Client or Agency', logo: '👾', color: '#D8FF01' },
  { title: 'General Campaign Information', logo: '💬', color: '#8A5AFE' },
  { title: 'Target Audience', logo: '👥', color: '#FFF0E5' },
  { title: 'Upload campaign photos', logo: '📸', color: '#FF3500' },
  { title: 'Campaign Type', logo: '⎏', color: '#D8FF01' },
  { title: 'Campaign Timeline', logo: '🗓️', color: '#D8FF01' },
  { title: 'Select Admin Manager(s)', logo: '⛑️', color: '#FFF0E5' },
  { title: 'Agreement Form', logo: '✍️', color: '#026D54' },
  { title: 'Other Attachment ( Optional )', logo: '⺟', color: '#FF3500' },
];

const PDFEditor = lazy(() => import('./pdf-editor'));

function CreateCampaignForm({ onClose }) {
  const { user } = useAuthContext();
  const openCompany = useBoolean();
  const openBrand = useBoolean();
  const modal = useBoolean();
  const confirmation = useBoolean();

  const [status, setStatus] = useState('');
  const [activeStep, setActiveStep] = useState(0);
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
    // productName: Yup.string().required('Product or Service name is required.'),
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
    campaignIndustries: Yup.string().required('Campaign industry is required.'),
    campaignDescription: Yup.string().required('Campaign Description is required.'),
    campaignTitle: Yup.string().required('Campaign title is required'),
    campaignObjectives: Yup.string().required('Campaign objectives is required'),
    brandTone: Yup.string().required('Brand tone is required'),
    productName: Yup.string(),
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
    campaignBrand: Yup.object()
      .nullable()
      .when('client', {
        is: (val) => val === 'agency',
        then: (s) => s.required('Brand is required.'),
        otherwise: (s) => s,
      }),
    campaignCredits: Yup.number()
      .min(1, 'Minimum need to be 1')
      .required('Campaign credits is required'),
  });

  const agreementSchema = Yup.object().shape({
    agreementFrom: Yup.object().required('Campaign agreement is required.'),
  });

  const campaignTypeSchema = Yup.object().shape({
    campaignType: Yup.string().required('Campaign type is required.'),
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
        return campaignTypeSchema;
      case 5:
        return timelineSchema;
      case 6:
        return campaignAdminSchema;
      case 7:
        return agreementSchema;
      default:
        return campaignSchema;
    }
  };

  const defaultValues = {
    hasBrand: false,
    campaignTitle: '',
    client: null,
    campaignBrand: null,
    campaignStartDate: null,
    campaignEndDate: null,
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
    adminManager: [],
    agreementFrom: null,
    timeline: [],
    campaignTasksAdmin: [],
    campaignTasksCreator: [{ id: '', name: '', dependency: '', dueDate: null, status: '' }],
    otherAttachments: [],
    referencesLinks: [],
    campaignType: '',
    campaignCredits: null,
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

  useEffect(() => {
    if (brandState !== '') {
      setValue('campaignBrand', brandState);
    }
  }, [brandState, setValue]);

  const isStepOptional = (step) => step === 8;

  const handleNext = async () => {
    // setActiveStep((prevActiveStep) => prevActiveStep + 1);
    const result = await trigger();
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

    delete adjustedData?.othersAudienceLocation;

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
      setStatus('');
      confirmation.onFalse();
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

  const getStepContent = useCallback(
    (step) => {
      switch (step) {
        case 0:
          return <SelectBrand openCompany={openCompany} openBrand={openBrand} />;
        case 1:
          return <GeneralCampaign />;
        case 2:
          return <CampaignDetails />;
        case 3:
          return <CampaignImageUpload />;
        case 4:
          return <CampaignType />;
        case 5:
          return <SelectTimeline />;
        case 6:
          return <CampaignAdminManager />;
        case 7:
          return <CampaignFormUpload pdfModal={pdfModal} />;
        case 8:
          return <OtherAttachments />;
        default:
          return <SelectBrand />;
      }
    },
    [pdfModal, openCompany, openBrand]
  );

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
                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
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
                disabled={!isValid || errors?.campaignCredit}
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

            <Box my={5} overflow="auto" minHeight={400}>
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
};
