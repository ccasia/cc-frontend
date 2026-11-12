import PropTypes from 'prop-types';
import { useSearchParams } from 'react-router-dom';
import React, { lazy, useState, Suspense, useEffect } from 'react';

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
import { useResponsive } from 'src/hooks/use-responsive';
import useGetInvoicesByCampId from 'src/hooks/use-get-invoices-by-campId';
import { useGetCampaignByIdScoped } from 'src/hooks/use-get-campaign-by-id';
import { useCampaignPermissions } from 'src/hooks/use-campaign-permissions';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import ViewOnlyBanner from 'src/components/banner/view-only-banner';
import PageEnter, { markPageEnter } from 'src/components/page-enter';
import PublicUrlModal from 'src/components/publicurl/publicURLModal';

import { CampaignLog } from 'src/sections/campaign/manage/list/CampaignLog';
import { dialogEnterSx } from 'src/sections/campaign/create/components/motion';
import {
  setOpenModal,
  usePublicUrl,
} from 'src/sections/campaign/discover/admin/store/use-public-url';
import PublicCampaignDetailSkeleton from 'src/sections/public-access/components/public-campaign-detail-skeleton';
import {
  useSpreadSheet,
  setOpenCopyDialog,
} from 'src/sections/campaign/discover/admin/store/use-spreadsheet';

import CampaignOverview from '../campaign-overview';
import CampaignTabs from '../components/campaign-tabs';
import { useTabs, setCurrentTab } from '../store/use-tabs';
import CampaignHeader from '../components/campaign-header';
import CampaignOverviewClient from '../campaign-overview-client';
import InitialActivateCampaignDialog from '../initial-activate-campaign-dialog';
import ClientCampaignHeader from '../../client/overview/client-campaign-header';
import CreatorMasterListSkeleton from '../components/creator-master-list-skeleton';
import CampaignAgreementsSkeleton from '../components/campaign-agreements-skeleton';
import ClientCampaignOverview from '../../client/overview/client-campaign-overview';
import CampaignTabContentSkeleton, {
  CampaignTabListSkeleton,
} from '../components/campaign-tab-content-skeleton';

// Tab value -> chunk. A `-client` key is the client variant of the same tab.
const TAB_LOADERS = {
  'campaign-content': () => import('../campaign-detail-content-client'),
  'creator-master-list': () => import('../campaign-creator-master-list-client'),
  pitch: () => import('../../client/v3-pitches/campaign-v3-pitches-wrapper'),
  agreement: () => import('../campaign-agreements'),
  // HIDE: logistics
  logistics: () => import('src/sections/logistics/campaign-logistics-view'),
  invoices: () => import('../campaign-invoices-list'),
  client: () => import('../campaign-detail-brand'),
  submission: () => import('../campaign-draft-submission'),
  deliverables: () => import('../campaign-creator-deliverables'),
  'deliverables-client': () => import('../campaign-creator-deliverables-client'),
  'submissions-v4': () => import('../creator-submissions/CampaignCreatorSubmissions'),
  'submissions-v4-client': () => import('../campaign-creator-submissions-v4'),
  analytics: () => import('../campaign-analytics'),
  faq: () => import('../campaign-faq'),
};

const CampaignDetailContentClient = lazy(TAB_LOADERS['campaign-content']);
const CampaignCreatorMasterListClient = lazy(TAB_LOADERS['creator-master-list']);
const CampaignV3PitchesWrapper = lazy(TAB_LOADERS.pitch);
const CampaignAgreements = lazy(TAB_LOADERS.agreement);
const CampaignLogisticsView = lazy(TAB_LOADERS.logistics);
const CampaignInvoicesList = lazy(TAB_LOADERS.invoices);
const CampaignDetailBrand = lazy(TAB_LOADERS.client);
const CampaignDraftSubmissions = lazy(TAB_LOADERS.submission);
const CampaignCreatorDeliverables = lazy(TAB_LOADERS.deliverables);
const CampaignCreatorDeliverablesClient = lazy(TAB_LOADERS['deliverables-client']);
const CampaignCreatorSubmissions = lazy(TAB_LOADERS['submissions-v4']);
const CampaignCreatorSubmissionsV4 = lazy(TAB_LOADERS['submissions-v4-client']);
const CampaignAnalysis = lazy(TAB_LOADERS.analytics);
const CampaignFAQ = lazy(TAB_LOADERS.faq);
const CreateCampaignFormV2 = lazy(() => import('src/sections/campaign/create/form-v2'));

// Same tree in the skeleton and the content, so these keep their instance between the two.
const keepInstance = (node) => <Suspense fallback={<CampaignTabListSkeleton />}>{node}</Suspense>;

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
  const [searchParams, setSearchParams] = useSearchParams();

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

  const copy = useBoolean();

  const { user } = useAuthContext();

  // Use centralized permission hook for view-only restrictions
  // Covers: Finance (advanced mode), CSM viewing non-managed campaigns
  const { isViewOnly } = useCampaignPermissions(campaign, user);

  const isDisabled = isViewOnly;

  const smDown = useResponsive('down', 'sm');

  const campaignLog = useBoolean();
  const activateDialog = useBoolean();
  const initialActivateDialog = useBoolean();
  const bulkAssign = useBoolean();

  // const [currentTab, setCurrentTab] = useState(
  //   forcedTab ||
  //     searchParams.get('tab') ||
  //     localStorage.getItem('campaigndetail') ||
  //     'campaign-content'
  // );

  const currentTab = useTabs((state) => state.currentTab);

  // The link owns the open tab (?tab=), so a refresh keeps it and each campaign opens on Overview.
  const [linkedTab, setLinkedTab] = useState(() =>
    forcedTab ? null : searchParams.get('tab') || 'overview'
  );

  useEffect(() => {
    if (!linkedTab) return;
    setCurrentTab(linkedTab);
    setLinkedTab(null);
  }, [linkedTab]);

  useEffect(() => {
    if (linkedTab || forcedTab) return;
    setSearchParams(
      (prev) => {
        if ((prev.get('tab') ?? 'overview') === currentTab) return prev;
        const next = new URLSearchParams(prev);
        if (currentTab === 'overview') next.delete('tab');
        else next.set('tab', currentTab);
        return next;
      },
      { replace: true }
    );
  }, [currentTab, linkedTab, forcedTab, setSearchParams]);

  // Check if user is client (demo sessions render the read-only client view)
  const isClient =
    publicReadonly || isDemo || user?.role === 'client' || user?.admin?.role?.name === 'Client';

  const isSuperAdmin = user?.admin?.mode === 'god';

  // Demo and public read-only views can't call the client overview endpoint.
  const showClientOverview = user?.role === 'client' && !isDemo && !publicReadonly;

  const handleTabIntent = (tab) => {
    const load = (isClient && TAB_LOADERS[`${tab}-client`]) || TAB_LOADERS[tab];
    load?.();
  };

  const returnTo = searchParams.get('returnTo');
  const safeReturnTo = returnTo && returnTo.startsWith('/') ? returnTo : null;

  const handleBackNavigation = () => {
    markPageEnter('back');
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

  const renderTabSkeleton = () => {
    const tab = linkedTab || currentTab;
    if (tab === 'overview') return <CampaignTabContentSkeleton />;
    if (tab === 'campaign-content') return <PublicCampaignDetailSkeleton />;
    if (tab === 'pitch') return <CreatorMasterListSkeleton campaignId={id} />;
    if (tab === 'agreement') return <CampaignAgreementsSkeleton campaignId={id} />;
    // Its own loading state already shows the real toolbar with loading cards.
    if (tab === 'submissions-v4' && !isClient)
      return keepInstance(<CampaignCreatorSubmissions campaignId={id} />);
    // Invoices only need the campaign id, so they start loading right away.
    if (tab === 'invoices')
      return keepInstance(<CampaignInvoicesList campId={id} isDisabled={isDisabled || isDemo} />);
    return <CampaignTabListSkeleton />;
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'overview':
        if (showClientOverview) return <ClientCampaignOverview campaignId={campaign?.id || id} />;
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
        return keepInstance(
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
        // Clients (and demo / public read-only views) keep the legacy submissions UI;
        // the new card list + viewer is admin-only
        return isClient ? (
          <CampaignCreatorSubmissionsV4
            campaign={campaign}
            isDisabled={isDisabled || isDemo}
            onRated={campaignMutate}
          />
        ) : (
          keepInstance(<CampaignCreatorSubmissions campaign={campaign} campaignId={id} />)
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
      {showClientOverview ? (
        <ClientCampaignHeader
          campaignId={campaign?.id || id}
          onBack={handleBackNavigation}
          tabs={
            <CampaignTabs campaign={campaign} variant="compact" onTabIntent={handleTabIntent} />
          }
        />
      ) : (
        <PageEnter source="list">
          <CampaignHeader
            campaign={campaign}
            campaignId={id}
            onBack={handleBackNavigation}
            isClient={isClient}
            openInitialActivateDialog={initialActivateDialog.onTrue}
            openActivateDialog={activateDialog.onTrue}
            handleOpenCampaignLog={campaignLog.onTrue}
          />

          {/* View-only banner for CSMs viewing non-managed campaigns */}
          {isViewOnly && !isClient && <ViewOnlyBanner />}
        </PageEnter>
      )}

      <PageEnter>
        {!showClientOverview && (
          <CampaignTabs
            campaign={campaign}
            campaignId={id}
            isDemo={isDemo}
            publicReadonly={publicReadonly}
            forcedTab={forcedTab}
            onTabIntent={handleTabIntent}
          />
        )}

        {/* The refresh frame clears this slot when it borrows another tab's snapshot. */}
        <Box data-boot-slot sx={{ display: 'contents' }}>
          <PageEnter key={currentTab} source="tab" size="small">
            <Suspense fallback={renderTabSkeleton()}>
              {!campaignLoading && !linkedTab ? renderTabContent() : renderTabSkeleton()}
            </Suspense>
          </PageEnter>
        </Box>
      </PageEnter>

      {copyDialogContainer}

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
            ...dialogEnterSx,
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
          <Suspense fallback={null}>
            <CreateCampaignFormV2
              mode="activate"
              campaignId={id}
              onClose={() => activateDialog.onFalse()}
              onSuccess={() => campaignMutate()}
            />
          </Suspense>
        )}
      </Dialog>

      <InitialActivateCampaignDialog
        open={initialActivateDialog.value}
        onClose={() => initialActivateDialog.onFalse()}
        campaignId={id}
      />
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
