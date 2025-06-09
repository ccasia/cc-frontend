import dayjs from 'dayjs';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { pdf } from '@react-pdf/renderer';
import { Page, Document } from 'react-pdf';
import { enqueueSnackbar } from 'notistack';
import { useLocation } from 'react-router-dom';
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
import PublicUrlModal from 'src/components/publicurl/publicURLModal';
import CampaignTabsMobile from 'src/components/campaign/CampaignTabsMobile';

import PDFEditorModal from 'src/sections/campaign/create/pdf-editor';

import CampaignOverview from '../campaign-overview';
import CampaignLogistics from '../campaign-logistics';
import CampaignAgreements from '../campaign-agreements';
import CampaignDetailBrand from '../campaign-detail-brand';
import CampaignInvoicesList from '../campaign-invoices-list';
import CampaignDetailContent from '../campaign-detail-content';
import { CampaignLog } from '../../../manage/list/CampaignLog';
import CampaignDraftSubmissions from '../campaign-draft-submission';
import CampaignDetailPitch from '../campaign-detail-pitch/campaign-detail-pitch';
import CampaignDetailCreator from '../campaign-detail-creator/campaign-detail-creator';
import CampaignCreatorDeliverables from '../campaign-creator-deliverables';

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
  const [openDialog, setOpenDialog] = useState(false);
  const [pages, setPages] = useState(0);
  const lgUp = useResponsive('up', 'lg');
  const templateModal = useBoolean();
  const linking = useBoolean();
  const location = useLocation();

  const [campaignLogIsOpen, setCampaignLogIsOpen] = useState(false);

  const open = Boolean(anchorEl);

  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // console.log('campaignid', campaign);

  // Add this campaign to tabs only when opened via "Open in New Tab"
  useEffect(() => {
    if (id && campaign) {
      // Check if this campaign was opened as a tab (via "Open in New Tab")
      const urlParams = new URLSearchParams(location.search);
      const openAsTab = urlParams.get('openAsTab');

      // Only add to tabs if explicitly opened as a tab
      if (openAsTab === 'true') {
        // Ensure campaignTabs exists
        if (!window.campaignTabs) {
          window.campaignTabs = [];
        }

        const campaignName = campaign.name || 'Campaign Details';

        // Check if this campaign is already in campaignTabs
        const tabExists = window.campaignTabs.some((tab) => tab.id === id);

        if (!tabExists) {
          // Add to campaignTabs
          window.campaignTabs.push({
            id,
            name: campaignName,
          });

          // Update status tracking for tabs
          if (!window.campaignTabsStatus) {
            window.campaignTabsStatus = {};
          }

          window.campaignTabsStatus[id] = {
            status: campaign.status,
          };

          // Save to localStorage
          try {
            localStorage.setItem('campaignTabs', JSON.stringify(window.campaignTabs));
          } catch (error) {
            console.error('Error saving campaign tabs to localStorage:', error);
          }
        } else {
          // Update existing tab with current campaign name and status
          window.campaignTabs = window.campaignTabs.map((tab) => {
            if (tab.id === id) {
              return { ...tab, name: campaignName };
            }
            return tab;
          });

          if (window.campaignTabsStatus) {
            window.campaignTabsStatus[id] = {
              status: campaign.status,
            };
          }

          // Save to localStorage
          try {
            localStorage.setItem('campaignTabs', JSON.stringify(window.campaignTabs));
          } catch (error) {
            console.error('Error saving campaign tabs to localStorage:', error);
          }
        }

        // Clean up the URL parameter after processing
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('openAsTab');
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [id, campaign, location.search]);

  useEffect(() => {
    if (!campaignLoading && campaign) {
      if (!campaign?.agreementTemplate) {
        setOpenDialog(true);
      } else {
        setOpenDialog(false);
      }
    }
  }, [campaign, campaignLoading]);

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

  const handleChangeTab = useCallback((event, newValue) => {
    localStorage.setItem('campaigndetail', newValue);
    setCurrentTab(newValue);
  }, []);

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
      {/* Main Controls Container */}
      <Box
        sx={{
          border: '1px solid #e7e7e7',
          borderRadius: 1,
          p: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 1.5, md: 1.5 },
          bgcolor: 'background.paper',
        }}
      >
        {/* Tab Buttons */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            flex: { xs: 'none', md: '1 1 auto' },
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {[
            { label: 'Overview', value: 'overview' },
            { label: 'Campaign Details', value: 'campaign-content' },
            {
              label: `Pitches (${campaign?.pitch?.filter((p) => p.status === 'undecided').length || 0})`,
              value: 'pitch',
            },
            {
              label: `Shortlisted (${campaign?.shortlisted?.length || 0})`,
              value: 'creator',
            },
            {
              label: `Agreements (${campaign?.creatorAgreement?.length || 0})`,
              value: 'agreement',
            },
            {
              label: `Deliverables`,
              value: 'deliverables',
            },
            {
              label: `Invoices (${campaignInvoices?.length || 0})`,
              value: 'invoices',
            },
            {
              label: `Logistics (${campaign?.logistic?.length || 0})`,
              value: 'logistics',
            },
          ].map((tab) => (
            <Button
              key={tab.value}
              onClick={() => handleChangeTab(null, tab.value)}
              sx={{
                px: 2,
                py: 1,
                minHeight: '38px',
                height: '38px',
                minWidth: 'fit-content',
                color: currentTab === tab.value ? '#ffffff' : '#666666',
                bgcolor: currentTab === tab.value ? '#1340ff' : 'transparent',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: 0.75,
                textTransform: 'none',
                position: 'relative',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '1px',
                  left: '1px',
                  right: '1px',
                  bottom: '1px',
                  borderRadius: 0.75,
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor:
                    currentTab === tab.value
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(19, 64, 255, 0.08)',
                },
                '&:hover': {
                  bgcolor: currentTab === tab.value ? '#1340ff' : 'transparent',
                  color: currentTab === tab.value ? '#ffffff' : '#1340ff',
                  transform: 'scale(0.98)',
                },
                '&:focus': {
                  outline: 'none',
                },
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Stack>
      </Box>
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
    overview: <CampaignOverview campaign={campaign} onUpdate={campaignMutate} />,
    'campaign-content': <CampaignDetailContent campaign={campaign} />,
    creator: <CampaignDetailCreator campaign={campaign} campaignMutate={campaignMutate} />,
    agreement: <CampaignAgreements campaign={campaign} campaignMutate={campaignMutate} />,
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
    deliverables: <CampaignCreatorDeliverables campaign={campaign} />,
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

  const agreementDialogContainer = (
    <Dialog
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          p: 2,
        },
      }}
      open={openDialog}
    >
      <Alert variant="outlined" severity="warning">
        Agreement missing
      </Alert>
      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1,1fr)', sm: 'repeat(2,1fr)' } }}
        gap={2}
        mt={2}
        minHeight={200}
      >
        <Button
          sx={{
            border: 1,
            borderColor: '#EBEBEB',
            borderRadius: 2,
            p: 2,
            boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
          }}
          onClick={pdfModal.onTrue}
        >
          <Stack alignItems="center" spacing={1}>
            <Avatar sx={{ bgcolor: deepOrange[500] }}>
              <Iconify icon="mingcute:file-new-fill" width={20} />
            </Avatar>
            Create new template
          </Stack>
        </Button>
        <Button
          sx={{
            border: 1,
            borderColor: '#EBEBEB',
            borderRadius: 2,
            p: 2,
            boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
          }}
          onClick={templateModal.onTrue}
        >
          <Stack alignItems="center" spacing={1}>
            <Avatar sx={{ bgcolor: pink[500] }}>
              <Iconify icon="ooui:reference-existing-ltr" width={20} />
            </Avatar>
            Link to an existing template
          </Stack>
        </Button>
      </Box>
    </Dialog>
  );

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      {/* Mobile Campaign Tabs - Only show on smaller screens */}
      <Box sx={{ display: { xs: 'block', lg: 'none' }, mb: 2 }}>
        <CampaignTabsMobile filter={campaign?.status?.toLowerCase() || 'active'} />
      </Box>

      <Stack spacing={1}>
        {/* Campaign Header */}
        <Box
          sx={{
            // border: '1px solid #e7e7e7',
            borderRadius: 1,
            p: { xs: 2, sm: 2.5 },
            bgcolor: 'background.paper',
          }}
        >
          {/* Back Button - Positioned above the main header */}
          <Box sx={{ mb: 1.5 }}>
            <Button
              onClick={() => router.push(paths.dashboard.campaign.root)}
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} />}
              sx={{
                color: '#636366',
                bgcolor: 'transparent',
                border: 'none',
                px: 0,
                py: 0.5,
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none',
                minHeight: 'auto',
                '&:hover': {
                  bgcolor: 'transparent',
                  color: '#1340ff',
                  '& .MuiButton-startIcon': {
                    transform: 'translateX(-2px)',
                  },
                },
                '& .MuiButton-startIcon': {
                  marginRight: 0.5,
                  transition: 'transform 0.2s ease',
                },
                transition: 'color 0.2s ease',
              }}
            >
              Back to Campaigns
            </Button>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={{ xs: 1.5, sm: 2 }}
            width="100%"
          >
            {/* Left Section - Campaign Image and Info */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
              {/* Campaign Image */}
              {campaign?.campaignBrief?.images?.[0] && (
                <Box
                  component="img"
                  src={campaign?.campaignBrief.images[0]}
                  alt={campaign?.name}
                  sx={{
                    width: { xs: 70, sm: 80 },
                    height: { xs: 70, sm: 80 },
                    borderRadius: 1.5,
                    border: '1px solid #e0e0e0',
                    objectFit: 'cover',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  }}
                />
              )}

              {/* Campaign Title and Basic Info */}
              <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: 'Instrument Serif, serif',
                    fontSize: { xs: '1.625rem', sm: '2rem', md: '2.125rem' },
                    fontWeight: 500,
                    color: '#1a1a1a',
                    lineHeight: 1.1,
                    wordBreak: 'break-word',
                    mb: 0.125,
                  }}
                >
                  {campaign?.name || 'Campaign Detail'}
                </Typography>

                {/* Company Info */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.125 }}>
                  {campaign?.company?.logo && (
                    <Box
                      component="img"
                      src={campaign?.company?.logo}
                      alt={campaign?.company?.name}
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: 0.5,
                        objectFit: 'cover',
                      }}
                    />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666666',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                    }}
                  >
                    {campaign?.company?.name || campaign?.brand?.name}
                  </Typography>
                </Stack>

                {/* Compact Campaign Period */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Box
                      component="img"
                      src="/assets/icons/navbar/ic_calendar_new.svg"
                      alt="calendar"
                      sx={{
                        width: 16,
                        height: 16,
                        mb: 0.25,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#221f20',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                      }}
                    >
                      {formatDate(campaign?.campaignBrief?.startDate)} -{' '}
                      {formatDate(campaign?.campaignBrief?.endDate)}
                    </Typography>
                  </Stack>

                  {/* Compact Status Badge */}
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      px: 1,
                      py: 0.25,
                      borderRadius: 0.75,
                      bgcolor: campaign?.status === 'ACTIVE' ? '#ecfdf5' : '#fef3c7',
                      border: '1px solid',
                      borderColor: campaign?.status === 'ACTIVE' ? '#d1fae5' : '#fde68a',
                    }}
                  >
                    <Box
                      sx={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        bgcolor: campaign?.status === 'ACTIVE' ? '#10b981' : '#f59e0b',
                        mr: 0.5,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: campaign?.status === 'ACTIVE' ? '#065f46' : '#92400e',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                      }}
                    >
                      {campaign?.status || 'Active'}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Stack>

            {/* Right Section - Action Buttons - Centered with content */}
            <Stack
              direction="row"
              spacing={1}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'flex-end', sm: 'center' },
                alignSelf: 'center',
              }}
            >
              <Button
                variant="outlined"
                startIcon={
                  <Iconify
                    icon="solar:pen-bold"
                    width={15}
                    sx={{
                      color: isDisabled ? '#9e9e9e' : '#1340ff',
                    }}
                  />
                }
                onClick={() => router.push(paths.dashboard.campaign.adminCampaignManageDetail(id))}
                disabled={isDisabled}
                sx={{
                  bgcolor: isDisabled ? '#f5f5f5' : '#ffffff',
                  color: isDisabled ? '#9e9e9e' : '#1340ff',
                  border: '1px solid',
                  borderColor: isDisabled ? '#e0e0e0' : '#1340ff',
                  borderBottom: '2px solid',
                  borderBottomColor: isDisabled ? '#e0e0e0' : '#1340ff',
                  borderRadius: 0.75,
                  px: 2,
                  py: 0.75,
                  height: '36px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isDisabled ? '#f5f5f5' : '#f8f9ff',
                    borderColor: isDisabled ? '#e0e0e0' : '#0f2db8',
                    borderBottomColor: isDisabled ? '#e0e0e0' : '#0f2db8',
                    transform: isDisabled ? 'none' : 'translateY(-1px)',
                    boxShadow: isDisabled ? 'none' : '0 2px 8px rgba(19, 64, 255, 0.15)',
                  },
                  '&:focus': {
                    outline: 'none',
                  },
                }}
              >
                Edit Details
              </Button>

              <Button
                onClick={handleMenuOpen}
                sx={{
                  bgcolor: '#ffffff',
                  color: '#1340ff',
                  border: '1px solid #1340ff',
                  borderBottom: '2px solid #1340ff',
                  borderRadius: 0.75,
                  minWidth: 36,
                  width: 36,
                  height: 36,
                  p: 0,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#f8f9ff',
                    borderColor: '#0f2db8',
                    borderBottomColor: '#0f2db8',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(19, 64, 255, 0.15)',
                  },
                  '&:focus': {
                    outline: 'none',
                  },
                }}
              >
                <Iconify icon="eva:more-horizontal-fill" width={16} />
              </Button>

              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    minWidth: 180,
                    bgcolor: '#FFFFFF !important',
                    border: '1px solid #e7e7e7',
                    borderBottom: '2px solid #e7e7e7',
                    borderRadius: 1,
                    mt: 0.5,
                    overflow: 'visible',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    '& .MuiMenuItem-root': {
                      backgroundColor: '#FFFFFF !important',
                      '&:hover': {
                        backgroundColor: '#FFFFFF !important',
                      },
                      '&.Mui-disabled': {
                        backgroundColor: '#FFFFFF !important',
                      },
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                MenuListProps={{
                  sx: {
                    p: 0.75,
                    bgcolor: '#FFFFFF !important',
                  },
                }}
              >
                {!isCampaignHasSpreadSheet ? (
                  <MenuItem
                    onClick={() => {
                      generateSpreadSheet();
                      handleMenuClose();
                    }}
                    disabled={isDisabled || loading.value}
                    sx={{
                      borderRadius: 0.75,
                      mx: 0,
                      my: 0.25,
                      px: 1.5,
                      py: 1,
                      minHeight: 40,
                      backgroundColor: '#FFFFFF !important',
                      color: isDisabled || loading.value ? '#9e9e9e' : '#374151',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease',
                      border: '1px solid transparent',
                      '&:hover': {
                        backgroundColor: '#FFFFFF !important',
                        color: isDisabled || loading.value ? '#9e9e9e' : '#1340ff',
                        border: '1px solid #e5e7eb',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      },
                      '&.Mui-disabled': {
                        opacity: 0.5,
                        backgroundColor: '#FFFFFF !important',
                      },
                      '&.Mui-focusVisible': {
                        backgroundColor: '#FFFFFF !important',
                      },
                    }}
                  >
                    <Iconify
                      icon="lucide:file-spreadsheet"
                      width={18}
                      height={18}
                      sx={{
                        mr: 1.5,
                        color: isDisabled || loading.value ? '#9e9e9e' : '#6b7280',
                      }}
                    />
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
                    sx={{
                      borderRadius: 0.75,
                      mx: 0,
                      my: 0.25,
                      px: 1.5,
                      py: 1,
                      minHeight: 40,
                      backgroundColor: '#FFFFFF !important',
                      color: !campaign?.spreadSheetURL ? '#9e9e9e' : '#374151',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease',
                      border: '1px solid transparent',
                      '&:hover': {
                        backgroundColor: '#FFFFFF !important',
                        color: !campaign?.spreadSheetURL ? '#9e9e9e' : '#1340ff',
                        border: '1px solid #e5e7eb',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      },
                      '&.Mui-disabled': {
                        opacity: 0.5,
                        backgroundColor: '#FFFFFF !important',
                      },
                      '&.Mui-focusVisible': {
                        backgroundColor: '#FFFFFF !important',
                      },
                    }}
                  >
                    <Iconify
                      icon="eva:google-outline"
                      width={18}
                      height={18}
                      sx={{
                        mr: 1.5,
                        color: !campaign?.spreadSheetURL ? '#9e9e9e' : '#6b7280',
                      }}
                    />
                    Google Spreadsheet
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => {
                    generatePublicUrl();
                    handleMenuClose();
                  }}
                  sx={{
                    borderRadius: 0.75,
                    mx: 0,
                    my: 0.25,
                    px: 1.5,
                    py: 1,
                    minHeight: 40,
                    backgroundColor: '#FFFFFF !important',
                    color: '#374151',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease',
                    border: '1px solid transparent',
                    '&:hover': {
                      backgroundColor: '#FFFFFF !important',
                      color: '#1340ff',
                      border: '1px solid #e5e7eb',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    },
                    '&.Mui-focusVisible': {
                      backgroundColor: '#FFFFFF !important',
                    },
                  }}
                >
                  <Iconify
                    icon="eva:link-2-outline"
                    width={18}
                    height={18}
                    sx={{
                      mr: 1.5,
                      color: '#6b7280',
                    }}
                  />
                  Generate URL
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setCampaignLogIsOpen(true);
                    handleMenuClose();
                  }}
                  sx={{
                    borderRadius: 0.75,
                    mx: 0,
                    my: 0.25,
                    px: 1.5,
                    py: 1,
                    minHeight: 40,
                    backgroundColor: '#FFFFFF !important',
                    color: '#374151',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease',
                    border: '1px solid transparent',
                    '&:hover': {
                      backgroundColor: '#FFFFFF !important',
                      color: '#1340ff',
                      border: '1px solid #e5e7eb',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    },
                    '&.Mui-focusVisible': {
                      backgroundColor: '#FFFFFF !important',
                    },
                  }}
                >
                  <Iconify
                    icon="eva:file-text-outline"
                    width={18}
                    height={18}
                    sx={{
                      mr: 1.5,
                      color: '#6b7280',
                    }}
                  />
                  View Log
                </MenuItem>
              </Menu>
            </Stack>
          </Stack>
        </Box>
      </Stack>

      {renderTabs}

      {(!campaignLoading ? renderTabContent[currentTab] : <LoadingScreen />) || null}

      {copyDialogContainer}

      {!isDisabled && agreementDialogContainer}

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
