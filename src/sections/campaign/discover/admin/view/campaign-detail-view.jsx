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
  Stack,
  Alert,
  Radio,
  Button,
  Dialog,
  Avatar,
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

import PDFEditorModal from 'src/sections/campaign/create/pdf-editor';

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
  const { user } = useAuthContext();
  const [openDialog, setOpenDialog] = useState(false);
  const [pages, setPages] = useState(0);
  const lgUp = useResponsive('up', 'lg');
  const templateModal = useBoolean();
  const linking = useBoolean();

  const open = Boolean(anchorEl);

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
            {
              label: `Agreements (${campaign?.creatorAgreement?.length || 0})`,
              value: 'agreement',
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
    overview: <CampaignOverview campaign={campaign} />,
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
      />
    ),
    submission: <CampaignDraftSubmissions campaign={campaign} campaignMutate={campaignMutate} />,
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
                    a.href = campaign?.spreadSheetURL;
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
                  disabled={!campaign?.spreadSheetURL}
                >
                  Google Spreadsheet
                </Button>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      {renderTabs}

      {(!campaignLoading ? renderTabContent[currentTab] : <LoadingScreen />) || null}

      {copyDialogContainer}

      {agreementDialogContainer}

      <PDFEditorModal
        open={pdfModal.value}
        onClose={pdfModal.onFalse}
        user={user}
        campaignId={campaign?.id}
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
