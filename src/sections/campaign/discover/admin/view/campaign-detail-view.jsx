import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Button,
  Dialog,
  Container,
  Typography,
  IconButton,
  DialogActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetCampaigns from 'src/hooks/use-get-campaigns';
import useGetInvoicesByCampId from 'src/hooks/use-get-invoices-by-campId';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import { LoadingScreen } from 'src/components/loading-screen';

import CampaignOverview from '../campaign-overview';
import CampaignLogistics from '../campaign-logistics';
import CampaignAgreements from '../campaign-agreements';
import CampaignDetailBrand from '../campaign-detail-brand';
import CampaignInvoicesList from '../campaign-invoices-list';
import CampaignDetailContent from '../campaign-detail-content';
import CampaignDraftSubmissions from '../campaign-draft-submission';
import CampaignDetailPitch from '../campaign-detail-pitch/campaign-detail-pitch';
import CampaignDetailCreator from '../campaign-detail-creator/campaign-detail-creator';

const CampaignDetailView = ({ id }) => {
  const settings = useSettingsContext();
  const router = useRouter();
  const { campaigns, isLoading, mutate: campaignMutate } = useGetCampaigns();
  const [anchorEl, setAnchorEl] = useState(null);
  const reminderRef = useRef(null);
  const loading = useBoolean();
  const [url, setUrl] = useState('');
  const copyDialog = useBoolean();
  const copy = useBoolean();

  const open = Boolean(anchorEl);

  const currentCampaign = useMemo(
    () => !isLoading && campaigns?.find((campaign) => campaign.id === id),
    [campaigns, id, isLoading]
  );

  const isCampaignHasSpreadSheet = useMemo(
    () => currentCampaign?.spreadSheetURL,
    [currentCampaign]
  );

  // const dialog = useBoolean(!currentCampaign?.agreementTemplate);

  const [currentTab, setCurrentTab] = useState(
    localStorage.getItem('campaigndetail') || 'campaign-content'
  );

  const handleChangeTab = useCallback((event, newValue) => {
    localStorage.setItem('campaigndetail', newValue);
    setCurrentTab(newValue);
  }, []);

  const icons = (tab) => {
    if (tab.value === 'pitch' && currentCampaign?.pitch?.length > 0) {
      const undecidedPitches = currentCampaign.pitch.filter(
        (pitch) => pitch.status === 'undecided'
      );
      return undecidedPitches.length > 0 ? <Label>{undecidedPitches.length}</Label> : null;
    }

    if (tab.value === 'creator' && currentCampaign?.shortlisted?.length) {
      return <Label>{currentCampaign?.shortlisted?.length}</Label>;
    }

    if (tab.value === 'agreement' && currentCampaign?.creatorAgreement?.length) {
      return <Label>{currentCampaign?.creatorAgreement?.length}</Label>;
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
              label: `Pitches (${currentCampaign?.pitch?.filter((p) => p.status === 'undecided').length || 0})`,
              value: 'pitch',
            },
            {
              label: `Creators (${currentCampaign?.shortlisted?.length || 0})`,
              value: 'creator',
            },
            {
              label: `Agreements (${currentCampaign?.creatorAgreement?.length || 0})`,
              value: 'agreement',
            },
            {
              label: `Invoices (${campaignInvoices?.length || 0})`,
              value: 'invoices',
            },
            {
              label: `Logistics (${currentCampaign?.logistic?.length || 0})`,
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

  const generateSpreadSheet = useCallback(async () => {
    try {
      loading.onTrue();
      const res = await axiosInstance.post(endpoints.campaign.spreadsheet, {
        campaignId: currentCampaign?.id,
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
  }, [loading, copyDialog, campaignMutate, currentCampaign]);

  const renderTabContent = {
    overview: <CampaignOverview campaign={currentCampaign} />,
    'campaign-content': <CampaignDetailContent campaign={currentCampaign} />,
    creator: <CampaignDetailCreator campaign={currentCampaign} />,
    agreement: <CampaignAgreements campaign={currentCampaign} />,
    logistics: <CampaignLogistics campaign={currentCampaign} />,
    invoices: <CampaignInvoicesList campId={currentCampaign?.id} />,
    client: (
      <CampaignDetailBrand
        brand={currentCampaign?.brand ?? currentCampaign?.company}
        campaign={currentCampaign}
      />
    ),
    pitch: (
      <CampaignDetailPitch
        pitches={currentCampaign?.pitch}
        timeline={currentCampaign?.campaignTimeline?.find((elem) => elem.name === 'Open For Pitch')}
        timelines={currentCampaign?.campaignTimeline?.filter(
          (elem) => elem.for === 'creator' && elem.name !== 'Open For Pitch'
        )}
        shortlisted={currentCampaign?.shortlisted}
      />
    ),
    submission: <CampaignDraftSubmissions campaign={currentCampaign} />,
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
          onClick={() => router.push(paths.dashboard.campaign.root)}
          sx={{
            alignSelf: 'flex-start',
            color: '#636366',
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
        >
          Back
        </Button>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          width="100%"
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            {currentCampaign?.campaignBrief?.images?.[0] && (
              <img
                src={currentCampaign.campaignBrief.images[0]}
                alt={currentCampaign?.name}
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
              {currentCampaign?.name || 'Campaign Detail'}
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
                {formatDate(currentCampaign?.campaignBrief?.startDate)} -{' '}
                {formatDate(currentCampaign?.campaignBrief?.endDate)}
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

            <Stack direction="column" spacing={1} sx={{ width: { xs: '100%', sm: '180px' } }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  <img
                    src="/assets/icons/overview/editButton.svg"
                    alt="edit"
                    style={{ width: 16, height: 16 }}
                  />
                }
                onClick={() => router.push(paths.dashboard.campaign.adminCampaignManageDetail(id))}
                sx={{
                  height: 32,
                  borderRadius: 1,
                  color: '#221f20',
                  border: '1px solid #e7e7e7',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  px: 1.5,
                  width: '100%',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    border: '1px solid #e7e7e7',
                    backgroundColor: 'rgba(34, 31, 32, 0.04)',
                  },
                  boxShadow: (theme) => `0px 2px 1px 1px ${theme.palette.grey[400]}`,
                }}
              >
                Edit Details
              </Button>

              {!isCampaignHasSpreadSheet ? (
                <LoadingButton
                  startIcon={<Iconify icon="lucide:file-spreadsheet" width={16} />}
                  variant="outlined"
                  size="small"
                  sx={{
                    height: 32,
                    borderRadius: 1,
                    color: '#221f20',
                    border: '1px solid #e7e7e7',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    px: 1.5,
                    width: '100%',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      border: '1px solid #e7e7e7',
                      backgroundColor: 'rgba(34, 31, 32, 0.04)',
                    },
                    boxShadow: (theme) => `0px 2px 1px 1px ${theme.palette.grey[400]}`,
                  }}
                  onClick={generateSpreadSheet}
                  loading={loading.value}
                >
                  Generate Spreadsheet
                </LoadingButton>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Iconify icon="tabler:external-link" width={16} />}
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = currentCampaign?.spreadSheetURL;
                    a.target = '_blank';
                    a.click();
                    document.body.removeChild(a);
                  }}
                  sx={{
                    height: 32,
                    borderRadius: 1,
                    color: '#221f20',
                    border: '1px solid #e7e7e7',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    px: 1.5,
                    width: '100%',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      border: '1px solid #e7e7e7',
                      backgroundColor: 'rgba(34, 31, 32, 0.04)',
                    },
                    boxShadow: (theme) => `0px 2px 1px 1px ${theme.palette.grey[400]}`,
                  }}
                  disabled={!currentCampaign?.spreadSheetURL}
                >
                  Google Spreadsheet
                </Button>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      {renderTabs}
      {(!isLoading ? renderTabContent[currentTab] : <LoadingScreen />) || null}
      {copyDialogContainer}
    </Container>
  );
};

export default CampaignDetailView;

CampaignDetailView.propTypes = {
  id: PropTypes.string,
};
