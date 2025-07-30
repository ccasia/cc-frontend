import dayjs from 'dayjs';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { pdf } from '@react-pdf/renderer';
import { Page, Document } from 'react-pdf';
import { enqueueSnackbar } from 'notistack';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import { pink, deepOrange } from '@mui/material/colors';
import {
  Box,
  Menu,
  Stack,
  Alert,
  Radio,
  Button,
  Dialog,
  Avatar,
  MenuItem,
  Container,
  Typography,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetCampaignById } from 'src/hooks/use-get-campaign-by-id';
import useGetInvoicesByCampId from 'src/hooks/use-get-invoices-by-campId';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import AgreementTemplate from 'src/template/agreement';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import { LoadingScreen } from 'src/components/loading-screen';
import CampaignTabs from 'src/components/campaign/CampaignTabs';
import PublicUrlModal from 'src/components/publicurl/publicURLModal';

import PDFEditorModal from 'src/sections/campaign/create/pdf-editor';

import CampaignOverview from '../campaign-overview';
import CampaignLogistics from '../campaign-logistics';
import CampaignAgreements from '../campaign-agreements';
import CampaignDetailBrand from '../campaign-detail-brand';
import CampaignInvoicesList from '../campaign-invoices-list';
import CampaignDetailContent from '../campaign-detail-content';
import CampaignDetailContentClient from '../campaign-detail-content-client';
import { CampaignLog } from '../../../manage/list/CampaignLog';
import CampaignDraftSubmissions from '../campaign-draft-submission';
import CampaignCreatorDeliverables from '../campaign-creator-deliverables';
import CampaignCreatorDeliverablesClient from '../campaign-creator-deliverables-client';
import CampaignDetailPitch from '../campaign-detail-pitch/campaign-detail-pitch';
import CampaignDetailCreator from '../campaign-detail-creator/campaign-detail-creator';
import CampaignAnalytics from '../campaign-analytics';
import CampaignCreatorMasterListClient from '../campaign-creator-master-list-client';
import CampaignOverviewClient from '../campaign-overview-client';
import ActivateCampaignDialog from '../activate-campaign-dialog';
import CampaignV3PitchesWrapper from '../v3-pitches/campaign-v3-pitches-wrapper';

// Ensure campaignTabs exists and is loaded from localStorage
if (typeof window !== 'undefined') {
  if (!window.campaignTabs) {
    try {
      const storedTabs = localStorage.getItem('campaignTabs');
      window.campaignTabs = storedTabs ? JSON.parse(storedTabs) : [];
    } catch (error) {
      console.error('Error loading campaign tabs from localStorage:', error);
      window.campaignTabs = [];
    }
  }
}

const CampaignDetailView = ({ id }) => {
  const settings = useSettingsContext();
  const router = useRouter();
  // const { campaigns, isLoading, mutate: campaignMutate } = useGetCampaigns();
  const { campaign, campaignLoading, mutate: campaignMutate } = useGetCampaignById(id);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const reminderRef = useRef(null);
  const loading = useBoolean();
  const [url, setUrl] = useState('');
  const copyDialog = useBoolean();
  const copy = useBoolean();
  const pdfModal = useBoolean();
  const [publicUrl, setPublicUrl] = useState(null);
  const [password, setPassword] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const { user } = useAuthContext();
  const [pages, setPages] = useState(0);
  const lgUp = useResponsive('up', 'lg');
  const templateModal = useBoolean();
  const linking = useBoolean();
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);
  const [campaignLogIsOpen, setCampaignLogIsOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);

  const open = Boolean(anchorEl);

  console.log('campaignid', campaign);

  // Add this campaign to tabs and save to localStorage
  // useEffect(() => {
  //   if (id && window.campaignTabs) {
  //     if (!window.campaignTabs.some(tab => tab.id === id)) {
  //       // Wait for campaign data to get the name if available
  //       const tabName = campaign ? campaign.name || 'Campaign Details' : 'Campaign Details';

  //       window.campaignTabs.push({
  //         id,
  //         name: tabName
  //       });

  //       // Add status information to the global campaignTabsStatus
  //       if (campaign && campaign.status) {
  //         // Initialize campaignTabsStatus if it doesn't exist
  //         if (!window.campaignTabsStatus) {
  //           window.campaignTabsStatus = {};
  //         }

  //         // Store the campaign status
  //         window.campaignTabsStatus[id] = {
  //           status: campaign.status
  //         };
  //       }

  //       // Save to localStorage
  //       try {
  //         localStorage.setItem('campaignTabs', JSON.stringify(window.campaignTabs));
  //       } catch (error) {
  //         console.error('Error saving campaign tabs to localStorage:', error);
  //       }
  //     }
  //   }
  // }, [id, campaign]);

  const isCampaignHasSpreadSheet = useMemo(() => campaign?.spreadSheetURL, [campaign]);

  const generateNewAgreement = useCallback(async (template) => {
    try {
      if (template) {
        const blob = await pdf(
          <AgreementTemplate
            DATE={dayjs().format('LL')}
            ccEmail="hello@cultcreative.com"
            ccPhoneNumber="+60162678757"
            NOW_DATE={dayjs().format('LL')}
            VERSION_NUMBER="V1"
            ADMIN_IC_NUMBER={template?.adminICNumber ?? 'Default'}
            ADMIN_NAME={template?.adminName ?? 'Default'}
            SIGNATURE={template?.signURL ?? 'Default'}
          />
        ).toBlob();
        return blob;
      }
      return null;
    } catch (err) {
      console.log(err);
      return err;
    }
  }, []);

  const onSelectAgreement = async (template) => {
    const newAgreement = await generateNewAgreement(template);
    // setDisplayPdf(newAgreement);
    setSelectedTemplate(template);
  };

  const [currentTab, setCurrentTab] = useState(
    localStorage.getItem('campaigndetail') || 'campaign-content'
  );

  // Define allowed tabs for client users
  const clientAllowedTabs = [
    'overview',
    'campaign-content',
    'creator-master-list',
    'deliverables',
    'analytics',
  ];

  // Check if user is client
  const isClient = user?.role === 'client' || user?.admin?.role?.name === 'client';

  // Check if current tab is valid for client users
  useEffect(() => {
    if (isClient && !clientAllowedTabs.includes(currentTab)) {
      // If client user tries to access a restricted tab, redirect to overview
      setCurrentTab('overview');
      localStorage.setItem('campaigndetail', 'overview');
    }
  }, [currentTab, isClient]);

  const handleChangeTab = useCallback(
    (event, newValue) => {
      // For client users, only allow specific tabs
      if (isClient && !clientAllowedTabs.includes(newValue)) {
        return;
      }

      localStorage.setItem('campaigndetail', newValue);
      setCurrentTab(newValue);
    },
    [isClient, clientAllowedTabs]
  );

  const icons = (tab) => {
    if (tab.value === 'pitch' && campaign?.pitch?.length > 0) {
      const undecidedPitches = campaign.pitch.filter((pitch) => pitch.status === 'undecided');
      return undecidedPitches.length > 0 ? <Label>{undecidedPitches.length}</Label> : null;
    }

    if (tab.value === 'creator' && campaign?.shortlisted?.length) {
      return <Label>{campaign?.shortlisted?.length}</Label>;
    }

    if (tab.value === 'agreement' && campaign?.creatorAgreement?.length) {
      return <Label>{campaign?.creatorAgreement?.length}</Label>;
    }

    return '';
  };

  const { campaigns: campaignInvoices, isLoading: invoicesLoading } = useGetInvoicesByCampId(id);

  const renderTabs = (
    <Box sx={{ mt: 2, mb: 2.5 }}>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          position: 'relative',
          width: '100%',
          overflowX: 'auto',
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
          justifyContent="space-between"
          sx={{
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          {/* Show different tabs based on user role */}
          {(user?.role === 'client' || user?.admin?.role?.name === 'client'
            ? // Client user tabs (no Pitches tab)
              [
                { label: 'Overview', value: 'overview' },
                { label: 'Campaign Details', value: 'campaign-content' },
                { label: 'Creator Master List', value: 'creator-master-list' },
                { label: 'Creator Deliverables', value: 'deliverables' },
                { label: 'Campaign Analytics', value: 'analytics' },
              ]
            : // Admin/other user tabs
              [
                { label: 'Overview', value: 'overview' },
                { label: 'Campaign Details', value: 'campaign-content' },
                // { label: 'Client Info', value: 'client' },
                {
                  label: `Pitches (${campaign?.pitch?.filter((p) => p.status === 'undecided').length || 0})`,
                  value: 'pitch',
                },
                {
                  label: `Shortlisted Creators (${campaign?.shortlisted?.length || 0})`,
                  value: 'creator',
                },
                {
                  label: `Agreements (${campaign?.creatorAgreement?.length || 0})`,
                  value: 'agreement',
                },
                {
                  label: 'Creator Deliverables',
                  value: 'deliverables',
                },
                {
                  label: 'Campaign Analytics',
                  value: 'analytics',
                },
                {
                  label: `Invoices (${campaignInvoices?.length || 0})`,
                  value: 'invoices',
                },
                // {
                //   label: `Logistics (${campaign?.logistic?.length || 0})`,
                //   value: 'logistics',
                // },
              ]
          ).map((tab) => (
            <Button
              key={tab.value}
              disableRipple
              size="large"
              onClick={() => handleChangeTab(null, tab.value)}
              sx={{
                px: { xs: 1, sm: 1.2 },
                py: 0.5,
                pb: 1,
                minWidth: !lgUp && 'fit-content',
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

  const generatePublicUrl = async () => {
    try {
      loading.onTrue();
      const response = await axiosInstance.post('/api/public/generate', {
        campaignId: campaign?.id,
        expiryInMinutes: 120,
      });

      if (response?.data?.url && response?.data?.password) {
        setPublicUrl(response.data.url);
        setPassword(response.data.password);
        setOpenModal(true);
      } else {
        enqueueSnackbar('Failed to generate public URL', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('An error occurred while generating the public URL.', { variant: 'error' });
    } finally {
      loading.onFalse();
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const generateSpreadSheet = useCallback(async () => {
    try {
      loading.onTrue();
      const res = await axiosInstance.post(endpoints.campaign.spreadsheet, {
        campaignId: campaign?.id,
      });
      setUrl(res?.data?.url);
      enqueueSnackbar(res?.data?.message);
      copyDialog.onTrue();
      campaignMutate();
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      loading.onFalse();
    }
  }, [loading, copyDialog, campaignMutate, campaign]);

  const renderTabContent = {
    overview: isClient ? (
      <CampaignOverviewClient campaign={campaign} />
    ) : (
      <CampaignOverview campaign={campaign} />
    ),
    'campaign-content': isClient ? (
      <CampaignDetailContentClient campaign={campaign} />
    ) : (
      <CampaignDetailContent campaign={campaign} />
    ),
    'creator-master-list': <CampaignCreatorMasterListClient campaign={campaign} />,
    creator: <CampaignDetailCreator campaign={campaign} campaignMutate={campaignMutate} />,
    agreement: <CampaignAgreements campaign={campaign} campaignMutate={campaignMutate} />,
    logistics: <CampaignLogistics campaign={campaign} campaignMutate={campaignMutate} />,
    invoices: <CampaignInvoicesList campId={campaign?.id} campaignMutate={campaignMutate} />,
    client: (
      <CampaignDetailBrand brand={campaign?.brand ?? campaign?.company} campaign={campaign} />
    ),
    pitch:
      campaign?.origin === 'CLIENT' ? (
        <CampaignV3PitchesWrapper campaign={campaign} />
      ) : (
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
    deliverables: isClient ? (
      <CampaignCreatorDeliverablesClient campaign={campaign} />
    ) : (
      <CampaignCreatorDeliverables campaign={campaign} />
    ),
    analytics: <CampaignAnalytics campaign={campaign} campaignMutate={campaignMutate} />,
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  const copyURL = () => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        copy.onTrue();
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };

  const linkTemplate = async () => {
    try {
      linking.onTrue();
      const res = await axiosInstance.patch(endpoints.campaign.linkNewAgreement, {
        template: selectedTemplate,
        campaignId: campaign?.id,
      });
      enqueueSnackbar(res?.data?.message);
      templateModal.onFalse();
      campaignMutate();
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      linking.onFalse();
    }
  };

  const copyDialogContainer = (
    <Dialog
      open={copyDialog.value}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          p: 2,
        },
      }}
    >
      <Box
        sx={{
          p: 1,
          bgcolor: (theme) => theme.palette.background.paper,
          border: 1,
          borderRadius: 1,
          borderColor: '#EBEBEB',
        }}
      >
        <Stack direction="row" alignItems="center">
          <Typography sx={{ flexGrow: 1, color: 'text.secondary' }} variant="subtitle2">
            {url || 'No url found.'}
          </Typography>
          {!copy.value ? (
            <IconButton onClick={copyURL}>
              <Iconify icon="solar:copy-line-duotone" />
            </IconButton>
          ) : (
            <IconButton disabled>
              <Iconify icon="charm:tick" color="success.main" />
            </IconButton>
          )}
        </Stack>
      </Box>

      <DialogActions>
        <Button onClick={copyDialog.onFalse} size="small" variant="outlined" sx={{ mx: 'auto' }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  const isPendingCampaign = useMemo(
    () => campaign?.status === 'SCHEDULED' || campaign?.status === 'PENDING_CSM_REVIEW',
    [campaign]
  );

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        px: { xs: 2, sm: 5 },
      }}
    >
      <Stack spacing={1}>
        <Button
          color="inherit"
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
          onClick={() => {
            if (isClient) {
              router.push(paths.dashboard.client);
            } else {
              router.push(paths.dashboard.campaign.root);
            }
          }}
          sx={{
            alignSelf: 'flex-start',
            color: '#636366',
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
        >
          Back
        </Button>

        {/* Campaign Tabs */}
        <CampaignTabs filter={campaign?.status?.toLowerCase()} />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          width="100%"
          sx={{ mt: -1 }}
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
                height: '42px',
                width: '1px',
                backgroundColor: '#e7e7e7',
                mx: 2,
                display: { xs: 'none', sm: 'block' },
              }}
            />

            <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              {/* Only show action buttons for non-client users */}
              {!isClient && (
                <>
                  {isPendingCampaign ? (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Iconify icon="mdi:rocket-launch" width={20} />}
                      onClick={() => setActivateDialogOpen(true)}
                      disabled={isDisabled}
                      sx={{
                        height: 42,
                        borderRadius: 1,
                        color: 'white',
                        backgroundColor: '#1340ff',
                        border: '1px solid #1340ff',
                        borderBottom: '4px solid #0e2fd6',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        px: 2,
                        whiteSpace: 'nowrap',
                        '&:hover': {
                          backgroundColor: '#0e2fd6',
                        },
                      }}
                    >
                      Activate Campaign
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={
                        <img
                          src="/assets/icons/overview/editButton.svg"
                          alt="edit"
                          style={{
                            width: 20,
                            height: 20,
                            opacity: isDisabled ? 0.3 : 1,
                          }}
                        />
                      }
                      onClick={() =>
                        router.push(paths.dashboard.campaign.adminCampaignManageDetail(id))
                      }
                      disabled={isDisabled}
                      sx={{
                        height: 42,
                        borderRadius: 1,
                        color: '#221f20',
                        border: '1px solid #e7e7e7',
                        borderBottom: '4px solid #e7e7e7',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        px: 2,
                        whiteSpace: 'nowrap',
                        '&:hover': {
                          backgroundColor: 'rgba(34, 31, 32, 0.04)',
                        },
                      }}
                    >
                      Edit Details
                    </Button>
                  )}

                  <Box
                    onClick={handleMenuOpen}
                    component="button"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 42,
                      width: 42,
                      borderRadius: 1,
                      color: '#221f20',
                      border: '1px solid #e7e7e7',
                      borderBottom: '4px solid #e7e7e7',
                      padding: 0,
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(34, 31, 32, 0.04)',
                        border: '1px solid #231F20',
                        borderBottom: '4px solid #231F20',
                      },
                    }}
                  >
                    <Iconify icon="eva:more-horizontal-fill" width={24} />
                  </Box>
                </>
              )}

              <Menu
                anchorEl={menuAnchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    minWidth: 200,
                    boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.1)',
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {!isCampaignHasSpreadSheet ? (
                  <MenuItem
                    onClick={() => {
                      generateSpreadSheet();
                      handleMenuClose();
                    }}
                    disabled={isDisabled || loading.value}
                    sx={{ py: 1 }}
                  >
                    <Iconify icon="lucide:file-spreadsheet" width={16} sx={{ mr: 1.5 }} />
                    Generate Spreadsheet
                  </MenuItem>
                ) : (
                  <MenuItem
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = campaign?.spreadSheetURL;
                      a.target = '_blank';
                      a.click();
                      handleMenuClose();
                    }}
                    disabled={!campaign?.spreadSheetURL}
                    sx={{ py: 1 }}
                  >
                    <Iconify icon="tabler:external-link" width={16} sx={{ mr: 1.5 }} />
                    Google Spreadsheet
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => {
                    generatePublicUrl();
                    handleMenuClose();
                  }}
                  sx={{ py: 1 }}
                >
                  <img
                    src="/assets/icons/overview/generateIcon.svg"
                    alt="generate icon"
                    style={{ width: 16, height: 16, marginRight: 12 }}
                  />
                  Generate URL
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setCampaignLogIsOpen(true);
                    handleMenuClose();
                  }}
                  sx={{ py: 1 }}
                >
                  <Iconify icon="material-symbols:note-rounded" width={16} sx={{ mr: 1.5 }} />
                  View Log
                </MenuItem>
              </Menu>
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      {renderTabs}

      {(!campaignLoading ? renderTabContent[currentTab] : <LoadingScreen />) || null}

      {copyDialogContainer}

      <PDFEditorModal
        open={pdfModal.value}
        onClose={pdfModal.onFalse}
        user={user}
        campaignId={campaign?.id}
      />

      <PublicUrlModal
        open={openModal}
        onClose={handleCloseModal}
        publicUrl={publicUrl}
        password={password}
      />

      <CampaignLog
        open={campaignLogIsOpen}
        campaign={campaign}
        onClose={() => setCampaignLogIsOpen(false)}
      />

      <ActivateCampaignDialog
        open={activateDialogOpen}
        onClose={() => setActivateDialogOpen(false)}
        campaignId={id}
      />

      <Dialog open={templateModal.value} fullWidth maxWidth="md" onClose={templateModal.onFalse}>
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
            {user?.agreementTemplate?.length > 0 &&
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
                  onClick={() => onSelectAgreement(template)}
                >
                  <Radio
                    checked={selectedTemplate?.id === template?.id}
                    onChange={() => onSelectAgreement(template)}
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
      </Dialog>
    </Container>
  );
};

export default CampaignDetailView;

CampaignDetailView.propTypes = {
  id: PropTypes.string,
};
