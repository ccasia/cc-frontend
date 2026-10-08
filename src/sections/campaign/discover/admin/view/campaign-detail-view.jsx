import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { pdf } from '@react-pdf/renderer';
import { Page, Document } from 'react-pdf';
import { enqueueSnackbar } from 'notistack';
import { useSearchParams } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import { deepOrange } from '@mui/material/colors';
import {
  Box,
  Stack,
  Radio,
  Button,
  Dialog,
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
import useGetInvoicesByCampId from 'src/hooks/use-get-invoices-by-campId';
import { useGetCampaignByIdScoped } from 'src/hooks/use-get-campaign-by-id';
import { useCampaignPermissions } from 'src/hooks/use-campaign-permissions';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import AgreementTemplate from 'src/template/agreement';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import { LoadingScreen } from 'src/components/loading-screen';
import ViewOnlyBanner from 'src/components/banner/view-only-banner';
import PublicUrlModal from 'src/components/publicurl/publicURLModal';

import PDFEditorModal from 'src/sections/campaign/create/pdf-editor';
import CreateCampaignFormV2 from 'src/sections/campaign/create/form-v2';
import { CampaignLog } from 'src/sections/campaign/manage/list/CampaignLog';
// HIDE: logistics
import CampaignLogisticsView from 'src/sections/logistics/campaign-logistics-view';
import {
  setOpenModal,
  usePublicUrl,
} from 'src/sections/campaign/discover/admin/store/use-public-url';
import {
  useSpreadSheet,
  setOpenCopyDialog,
} from 'src/sections/campaign/discover/admin/store/use-spreadsheet';

import CampaignFAQ from '../campaign-faq';
import { useTabs } from '../store/use-tabs';
import CampaignOverview from '../campaign-overview';
import CampaignAnalysis from '../campaign-analytics';
import CampaignTabs from '../components/campaign-tabs';
import CampaignAgreements from '../campaign-agreements';
import CampaignDetailBrand from '../campaign-detail-brand';
import CampaignHeader from '../components/campaign-header';
import CampaignInvoicesList from '../campaign-invoices-list';
import CampaignOverviewClient from '../campaign-overview-client';
import CampaignDraftSubmissions from '../campaign-draft-submission';
import CampaignCreatorDeliverables from '../campaign-creator-deliverables';
import CampaignDetailContentClient from '../campaign-detail-content-client';
import InitialActivateCampaignDialog from '../initial-activate-campaign-dialog';
import CampaignCreatorMasterListClient from '../campaign-creator-master-list-client';
import CampaignCreatorDeliverablesClient from '../campaign-creator-deliverables-client';
import CampaignV3PitchesWrapper from '../../client/v3-pitches/campaign-v3-pitches-wrapper';
import CampaignCreatorSubmissions from '../creator-submissions/CampaignCreatorSubmissions';

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

const CampaignDetailView = ({
  id,
  publicReadonly = false,
  forcedTab = null,
  publicApprovalEntries = [],
  isDemo = false,
}) => {
  const settings = useSettingsContext();
  const router = useRouter();
  const [searchParams] = useSearchParams();

  const publicUrl = usePublicUrl((state) => state.publicUrl);
  const password = usePublicUrl((state) => state.password);
  const openModal = usePublicUrl((state) => state.openModal);

  const url = useSpreadSheet((state) => state.url);
  const copyDialog = useSpreadSheet((state) => state.copyDialog);

  const {
    campaign,
    campaignLoading,
    mutate: campaignMutate,
  } = useGetCampaignByIdScoped(id, publicReadonly, isDemo);

  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const copy = useBoolean();
  const pdfModal = useBoolean();

  const { user } = useAuthContext();

  // Use centralized permission hook for view-only restrictions
  // Covers: Finance (advanced mode), CSM viewing non-managed campaigns
  const { isViewOnly } = useCampaignPermissions(campaign, user);

  const isDisabled = isViewOnly;

  const [pages, setPages] = useState(0);
  const lgUp = useResponsive('up', 'lg');
  const smDown = useResponsive('down', 'sm');
  const templateModal = useBoolean();
  const linking = useBoolean();

  const campaignLog = useBoolean();
  const activateDialog = useBoolean();
  const initialActivateDialog = useBoolean();
  const bulkAssign = useBoolean();

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
    await generateNewAgreement(template);
    // setDisplayPdf(newAgreement);
    setSelectedTemplate(template);
  };

  // const [currentTab, setCurrentTab] = useState(
  //   forcedTab ||
  //     searchParams.get('tab') ||
  //     localStorage.getItem('campaigndetail') ||
  //     'campaign-content'
  // );

  const currentTab = useTabs((state) => state.currentTab);

  // Check if user is client (demo sessions render the read-only client view)
  const isClient =
    publicReadonly || isDemo || user?.role === 'client' || user?.admin?.role?.name === 'Client';

  const isSuperAdmin = user?.admin?.mode === 'god';

  const returnTo = searchParams.get('returnTo');
  const safeReturnTo = returnTo && returnTo.startsWith('/') ? returnTo : null;

  const handleBackNavigation = () => {
    if (safeReturnTo) {
      router.push(safeReturnTo);
      return;
    }

    const historyIndex = window.history.state?.idx;
    if (typeof historyIndex === 'number' && historyIndex > 0) {
      router.back();
      return;
    }

    if (isDemo) {
      router.push(paths.dashboard.demoCampaigns.root);
    } else if (isClient) {
      router.push(paths.dashboard.client);
    } else {
      router.push(paths.dashboard.campaign.root);
    }
  };

  const { mutate: mutateCampaignInvoices } = useGetInvoicesByCampId(isDemo ? null : id);

  const { socket: invoiceSocket } = useSocketContext();

  useEffect(() => {
    if (!invoiceSocket || !id || isDemo) return undefined;

    const handleInvoiceGenerated = (payload) => {
      if (payload.campaignId !== id) return;
      mutateCampaignInvoices();
    };

    const handleCreditsUpdated = (payload) => {
      if (payload.campaignId !== id) return;
      campaignMutate();
    };

    invoiceSocket.emit('join-campaign', id);
    invoiceSocket.on('v4:invoice:generated', handleInvoiceGenerated);
    invoiceSocket.on('campaign:credits:updated', handleCreditsUpdated);

    return () => {
      invoiceSocket.off('v4:invoice:generated', handleInvoiceGenerated);
      invoiceSocket.off('campaign:credits:updated', handleCreditsUpdated);
      invoiceSocket.emit('leave-campaign', id);
    };
  }, [invoiceSocket, id, isDemo, mutateCampaignInvoices, campaignMutate]);

  const renderTabContent = () => {
    switch (currentTab) {
      case 'overview':
        return isClient ? (
          <CampaignOverviewClient campaign={campaign} onUpdate={campaignMutate} />
        ) : (
          <CampaignOverview campaign={campaign} onUpdate={campaignMutate} isDisabled={isDisabled} />
        );
      case 'campaign-content':
        return <CampaignDetailContentClient campaign={campaign} />;
      case 'creator-master-list':
        return (
          <CampaignCreatorMasterListClient
            campaign={campaign}
            campaignMutate={campaignMutate}
            fallbackApprovalEntries={publicApprovalEntries}
          />
        );
      case 'agreement':
        return (
          <CampaignAgreements
            campaign={campaign}
            campaignMutate={campaignMutate}
            isDisabled={isDisabled || isDemo}
          />
        );
      case 'logistics':
        return (
          <CampaignLogisticsView
            campaign={campaign}
            openBulkAssign={bulkAssign.value}
            setOpenBulkAssign={bulkAssign.setValue}
            isAdmin={!isClient}
            isDisabled={isDisabled || isDemo}
            isSuperAdmin={isSuperAdmin}
          />
        );
      case 'invoices':
        return (
          <CampaignInvoicesList
            campId={campaign?.id}
            campaignMutate={campaignMutate}
            isDisabled={isDisabled || isDemo}
          />
        );
      case 'client':
        return (
          <CampaignDetailBrand brand={campaign?.brand ?? campaign?.company} campaign={campaign} />
        );
      case 'pitch':
        return (
          <CampaignV3PitchesWrapper
            campaign={campaign}
            campaignMutate={campaignMutate}
            isDisabled={isDisabled}
          />
        );
      case 'submission':
        return <CampaignDraftSubmissions campaign={campaign} campaignMutate={campaignMutate} />;
      case 'deliverables':
        return isClient ? (
          <CampaignCreatorDeliverablesClient campaign={campaign} campaignMutate={campaignMutate} />
        ) : (
          <CampaignCreatorDeliverables campaign={campaign} isDisabled={isDisabled} />
        );
      case 'submissions-v4':
        return (
          // <CampaignCreatorSubmissionsV4
          //   campaign={campaign}
          //   isDisabled={isDisabled || isDemo}
          //   onRated={campaignMutate}
          // />
          <CampaignCreatorSubmissions campaign={campaign} />
        );
      case 'analytics':
        return (
          <CampaignAnalysis
            campaign={campaign}
            campaignMutate={campaignMutate}
            isDisabled={isDisabled}
          />
          // <CampaignAnalytics
          //   campaign={campaign}
          //   campaignMutate={campaignMutate}
          //   isDisabled={isDisabled}
          // />
        );
      case 'faq':
        return <CampaignFAQ />;
      default:
        return null;
    }
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
      open={copyDialog}
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
        <Button
          onClick={() => setOpenCopyDialog(false)}
          size="small"
          variant="outlined"
          sx={{ mx: 'auto' }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        px: { xs: 2, sm: 4 },
      }}
    >
      <CampaignHeader
        campaign={campaign}
        onBack={handleBackNavigation}
        isClient={isClient}
        openInitialActivateDialog={initialActivateDialog.onTrue}
        openActivateDialog={activateDialog.onTrue}
        handleOpenCampaignLog={campaignLog.onTrue}
      />

      {/* View-only banner for CSMs viewing non-managed campaigns */}
      {isViewOnly && !isClient && <ViewOnlyBanner />}

      <CampaignTabs
        campaign={campaign}
        isDemo={isDemo}
        publicReadonly={publicReadonly}
        forcedTab={forcedTab}
      />

      {!campaignLoading ? renderTabContent() : <LoadingScreen />}

      {copyDialogContainer}

      <PDFEditorModal
        open={pdfModal.value}
        onClose={pdfModal.onFalse}
        user={user}
        campaignId={campaign?.id}
      />

      <PublicUrlModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        publicUrl={publicUrl}
        password={password}
      />

      <CampaignLog
        open={campaignLog.value}
        campaign={campaign}
        onClose={() => campaignLog.onFalse()}
      />

      <Dialog
        fullWidth
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: (theme) => theme.palette.background.paper,
            borderRadius: 2,
            p: 4,
            m: 2,
            height: '97vh',
            overflow: 'hidden',
            ...(smDown && {
              height: 1,
              m: 0,
            }),
          },
        }}
        scroll="paper"
        open={activateDialog.value}
      >
        {activateDialog.value && (
          <CreateCampaignFormV2
            mode="activate"
            campaignId={id}
            onClose={() => activateDialog.onFalse()}
            onSuccess={() => campaignMutate()}
          />
        )}
      </Dialog>

      <InitialActivateCampaignDialog
        open={initialActivateDialog.value}
        onClose={() => initialActivateDialog.onFalse()}
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
  publicReadonly: PropTypes.bool,
  forcedTab: PropTypes.string,
  publicApprovalEntries: PropTypes.array,
  isDemo: PropTypes.bool,
};
