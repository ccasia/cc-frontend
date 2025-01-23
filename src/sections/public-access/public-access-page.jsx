import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { useParams } from 'react-router-dom';

import { LoadingButton } from '@mui/lab';

import { pdf } from '@react-pdf/renderer';

import { Page, Document } from 'react-pdf';
import { enqueueSnackbar } from 'notistack';


import {
  Box,
  Stack,
  Alert,
  Radio,
  Button,
  Dialog,
  Avatar,
  TextField,
  Container,
  Typography,
  Modal,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { usePublicCampaign } from 'src/routes/hooks/use-public-campaign';
import { useGetCampaignById } from 'src/hooks/use-get-campaign-by-id';
import { format } from 'date-fns';

import { LoadingScreen } from 'src/components/loading-screen';

import CampaignOverview from '../campaign/discover/admin/campaign-overview';
import CampaignLogistics from '../campaign/discover/admin/campaign-logistics';
import CampaignAgreements from '../campaign/discover/admin/campaign-agreements';
import CampaignDetailBrand from '../campaign/discover/admin/campaign-detail-brand';
import CampaignInvoicesList from '../campaign/discover/admin/campaign-invoices-list';
import CampaignDetailContent from '../campaign/discover/admin/campaign-detail-content';
import CampaignDraftSubmissions from '../campaign/discover/admin/campaign-draft-submission';
import CampaignDetailPitch from '../campaign/discover/admin/campaign-detail-pitch/campaign-detail-pitch';
import CampaignDetailCreator from '../campaign/discover/admin/campaign-detail-creator/campaign-detail-creator';
import axiosInstance, { endpoints } from 'src/utils/axios';
import PublicCampaignDetailContent from './publicCampaignDetail';

const PublicAccessPage = () => {
  const { id } = useParams();
   const settings = useSettingsContext();
   const [openModal, setOpenModal] = useState(true);
    //  const settings = useSettingsContext();
    const [isValid, setIsValid] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { campaign, campaignLoading, mutate: campaignMutate } = useGetCampaignById(id);
    const router = useRouter();
    // const { campaigns, isLoading, mutate: campaignMutate } = useGetCampaigns();
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const reminderRef = useRef(null);
    // const loading = useBoolean();
    // const [url, setUrl] = useState('');
    // const copyDialog = useBoolean();
    // const copy = useBoolean();
    const pdfModal = useBoolean();
    const [openDialog, setOpenDialog] = useState(false);
    // const [pages, setPages] = useState(0);
    // const lgUp = useResponsive('up', 'lg');
    // const templateModal = useBoolean();
    // const linking = useBoolean();
  
    const open = Boolean(anchorEl);
   
    const [currentTab, setCurrentTab] = useState(
      localStorage.getItem('campaigndetail') || 'campaign-content'
    );
  
    const validatePassword = async () => {
      try {
        // API call to validate the password
        const response = await axiosInstance.post(endpoints.public.validate, { 
          campaignId: id, 
          inputPassword: password 
        });
      
        if (response.data.success) {
          setIsValid(true); 
          enqueueSnackbar('Welcome to the Cult!', { variant: 'success' });
          setOpenModal(false);
        }
      } catch (err) {
        // setError(err.response?.data?.message || 'Invalid password');
        enqueueSnackbar(err.response?.data?.message || 'Invalid password', { variant: 'error' });
      }
    };

    const handleChangeTab = useCallback((event, newValue) => {
      localStorage.setItem('campaigndetail', newValue);
      setCurrentTab(newValue);
    }, []);


  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMMM d, yyyy');
  };


    console.log("Current ID:", id);
    console.log("Campaign Data:", campaign);

  

  

  const renderTabs = (
      <Box sx={{ mt: 2, mb: 2.5 }}>
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            position: 'relative',
            width: '100%',
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '1px',
              bgcolor: 'divider',
            },
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              overflowX: 'auto',
            }}
          >
            {[
              { label: 'Overview', value: 'overview' },
              { label: 'Campaign Details', value: 'campaign-content' },
              // { label: 'Client Info', value: 'client' },
              {
                label: `Pitches (${campaign?.pitch?.filter((p) => p.status === 'undecided').length || 0})`,
                value: 'pitch',
              },
              {
                label: `Creators (${campaign?.shortlisted?.length || 0})`,
                value: 'creator',
              },
              // {
              //   label: `Agreements (${campaign?.creatorAgreement?.length || 0})`,
              //   value: 'agreement',
              // },
              // {
              //   label: `Invoices (${campaignInvoices?.length || 0})`,
              //   value: 'invoices',
              // },
              {
                label: `Logistics (${campaign?.logistic?.length || 0})`,
                value: 'logistics',
              },
            ].map((tab) => (
              <Button
                key={tab.value}
                disableRipple
                size="large"
                onClick={() => handleChangeTab(null, tab.value)}
                sx={{
                  px: { xs: 1, sm: 1.5 },
                  py: 0.5,
                  pb: 1,
                  minWidth: 'fit-content',
                  color: currentTab === tab.value ? '#221f20' : '#8e8e93',
                  position: 'relative',
                  fontSize: { xs: '0.9rem', sm: '1.05rem' },
                  fontWeight: 650,
                  whiteSpace: 'nowrap',
                  mr: { xs: 1, sm: 2 },
                  transition: 'transform 0.1s ease-in-out',
                  '&:focus': {
                    outline: 'none',
                    bgcolor: 'transparent',
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                    bgcolor: 'transparent',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    width: currentTab === tab.value ? '100%' : '0%',
                    bgcolor: '#1340ff',
                    transition: 'all 0.3s ease-in-out',
                    transform: 'scaleX(1)',
                    transformOrigin: 'left',
                  },
                  '&:hover': {
                    bgcolor: 'transparent',
                    '&::after': {
                      width: '100%',
                      opacity: currentTab === tab.value ? 1 : 0.5,
                    },
                  },
                  // mr: 2,
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Box>
    );

  
   useEffect(() => {
      window.addEventListener('click', (event) => {
        if (reminderRef.current && !reminderRef.current.contains(event.target)) {
          setAnchorEl(false);
        }
      });
    }, [open]);

    const renderTabContent = {
      overview: <CampaignOverview campaign={campaign} />,
      'campaign-content': <PublicCampaignDetailContent campaign={campaign} />,
      creator: <CampaignDetailCreator campaign={campaign} campaignMutate={campaignMutate} />,
      // agreement: <CampaignAgreements campaign={campaign} campaignMutate={campaignMutate} />,
      logistics: <CampaignLogistics campaign={campaign} campaignMutate={campaignMutate} />,
      invoices: <CampaignInvoicesList campId={campaign?.id} campaignMutate={campaignMutate} />,
      client: (
        <CampaignDetailBrand brand={campaign?.brand ?? campaign?.company} campaign={campaign} />
      ),
      pitch: (
        <CampaignDetailPitch
          pitches={campaign?.pitch}
          timeline={campaign?.campaignTimeline?.find((elem) => elem.name === 'Open For Pitch')}
          timelines={campaign?.campaignTimeline?.filter(
            (elem) => elem.for === 'creator' && elem.name !== 'Open For Pitch'
          )}
          shortlisted={campaign?.shortlisted}
          campaignMutate={campaignMutate}
          campaign={campaign}
        />
      ),
      submission: <CampaignDraftSubmissions campaign={campaign} campaignMutate={campaignMutate} />,
    };

    const handlePasswordChange = (e) => setPassword(e.target.value);
  
    if (!isValid) {
      return (
        <Modal open={openModal} onClose={() => {}} aria-labelledby="password-validation-modal">
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              bgcolor: 'white',
              borderRadius: 2,
              boxShadow: 24,
              p: 4,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Please enter the password for Access
            </Typography>
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={handlePasswordChange}
              sx={{ mb: 2 }}
            />
            {/* {error && <Typography color="error" variant="body2">{error}</Typography>} */}
            <Button variant="contained" color="primary" onClick={validatePassword}>
              Validate
            </Button>
          </Box>
        </Modal>
      );
    }
  return (
    <Container
    maxWidth={settings.themeStretch ? false : 'xl'}
    sx={{
      px: { xs: 2, sm: 5 },
    }}
  >
    <Stack spacing={1}>
      {/* <Button
        color="inherit"
        startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
        onClick={() => router.push(paths.dashboard.campaign.root)}
        sx={{
          alignSelf: 'flex-start',
          color: '#636366',
          fontSize: { xs: '0.875rem', sm: '1rem' },
        }}
      >
        Back
      </Button> */}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        width="100%"
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          {campaign?.campaignBrief?.images?.[0] && (
            <img
              src={campaign?.campaignBrief.images[0]}
              alt={campaign?.name}
              style={{
                width: '100%',
                maxWidth: 80,
                height: 'auto',
                borderRadius: '12px',
                border: '1px solid #e0e0e0',
                objectFit: 'cover',
              }}
            />
          )}
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.4rem' },
              fontWeight: 550,
            }}
          >
            {campaign?.name || 'Campaign Detail'}
          </Typography>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={{ xs: 1, sm: 0 }}
          width={{ xs: '100%', sm: 'auto' }}
          justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
        >
          <Stack
            alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
            spacing={0}
            justifyContent="center"
            sx={{ minHeight: { sm: '76px' } }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#8e8e93',
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.9rem' },
                letterSpacing: '0.5px',
              }}
            >
              CAMPAIGN PERIOD:
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{
                color: '#221f20',
                fontWeight: 500,
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              {formatDate(campaign?.campaignBrief?.startDate)} -{' '}
              {formatDate(campaign?.campaignBrief?.endDate)}
            </Typography>
          </Stack>

          <Box
            sx={{
              height: '76px',
              width: '1px',
              backgroundColor: '#e7e7e7',
              mx: 2,
              display: { xs: 'none', sm: 'block' },
            }}
          />
        </Stack>
      </Stack>
    </Stack>

    {renderTabs}

    {(!campaignLoading ? renderTabContent[currentTab] : <LoadingScreen />) || null}

    {/* {copyDialogContainer} */}

    {/* {agreementDialogContainer} */}

    {/* <PDFEditorModal
      open={pdfModal.value}
      onClose={pdfModal.onFalse}
      //  user={user}
      campaignId={campaign?.id}
    /> */}

    {/* <Dialog open={templateModal.value} fullWidth maxWidth="md" onClose={templateModal.onFalse}>
      <DialogTitle>
        <Stack direction={{ sm: 'column', md: 'row' }} justifyContent="space-between">
          <Typography variant="subtitle2" mt={2}>
            You may select one template to be use:
          </Typography>
          <LoadingButton
            sx={{
              border: 1,
              borderColor: deepOrange[500],
              borderRadius: 2,
              p: 2,
              boxShadow: `0px -3px 0px 0px ${deepOrange[500]} inset`,
            }}
            disabled={!selectedTemplate}
            onClick={linkTemplate}
            loading={linking.value}
          >
            Link now
          </LoadingButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(1, 1fr)',
              md: 'repeat(2, 1fr)',
            },
            columnGap: 1,
            justifyItems: 'center',
            alignItems: 'center',
          }}
        >
          {/* {templateLoading && (
            <Box
              sx={{
                // position: 'relative',
                // top: 200,
                textAlign: 'center',
              }}
            >
              <CircularProgress
                thickness={7}
                size={25}
                sx={{
                  color: (theme) => theme.palette.common.black,
                  strokeLinecap: 'round',
                }}
              />
            </Box>
          )} */}
          {/* {user?.agreementTemplate?.length > 0 &&
            user?.agreementTemplate?.map((template) => (
              <Box
                key={template?.id}
                my={4}
                overflow="auto"
                textAlign="center"
                height={400}
                // width={{ md: 360 }}
                sx={{
                  border: selectedTemplate?.id === template?.id ? 4 : 1,
                  borderRadius: 2,
                  borderColor: selectedTemplate?.id === template?.id && 'green',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease-in-out',
                  position: 'relative',
                  '&:hover': {
                    transform: 'scale(1.03)',
                    zIndex: 10,
                  },
                  '::-webkit-scrollbar': {
                    display: 'none', //
                  },

                  overflow: 'hidden',
                }}
                component="div"
                // onClick={() => onSelectAgreement(template)}
              >
                <Radio
                  checked={selectedTemplate?.id === template?.id}
                  // onChange={() => onSelectAgreement(template)}
                  value={template?.id}
                  name="template-selection"
                  inputProps={{ 'aria-label': `Select template ${template?.id}` }}
                  sx={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    zIndex: 100,
                  }}
                />

                <Box sx={{ width: 1, height: 1, overflow: 'auto', scrollbarWidth: 'none' }}>
                  <Box sx={{ display: 'inline-block' }}>
                    <Document
                      file={template?.url}
                      onLoadSuccess={({ numPages }) => setPages(numPages)}
                    >
                      <Stack spacing={2}>
                        {Array.from({ length: pages }, (_, index) => (
                          <Page
                            key={index}
                            pageIndex={index}
                            renderTextLayer={false}
                            pageNumber={index + 1}
                            scale={1}
                            width={lgUp ? 400 : 300}
                          />
                        ))}
                      </Stack>
                    </Document>
                  </Box>
                </Box>
              </Box>
            ))} 
        </Box>
      </DialogContent>
    </Dialog> */}
  </Container>
);
};

export default PublicAccessPage;