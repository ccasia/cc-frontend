import PropTypes from 'prop-types';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Stack, Button, Divider } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';
import useGetInvoicesByCampId from 'src/hooks/use-get-invoices-by-campId';
import { useGetAgreements } from 'src/hooks/agreement/use-get-agreements';

import { useAuthContext } from 'src/auth/hooks';

import { useTabs, setCurrentTab } from '../store/use-tabs';

const clientAllowedTabs = [
  'overview',
  'campaign-content',
  'creator-master-list',
  'deliverables',
  'submissions-v4',
  'analytics',
  'logistics', // allow client to access Logistics tab
  'faq',
];

const demoAllowedTabs = [
  'overview',
  'campaign-content',
  'creator-master-list',
  'submissions-v4',
  'analytics',
  'logistics',
  'faq',
];

const getAllowedTabs = (submissionVersion) => {
  if (submissionVersion === 'v4') {
    return clientAllowedTabs.filter((tab) => tab !== 'deliverables');
  }
  return clientAllowedTabs.filter((tab) => tab !== 'submissions-v4');
};

const CampaignTabs = ({ campaign, isDemo, publicReadonly, forcedTab }) => {
  const { user } = useAuthContext();
  const lgUp = useResponsive('up', 'lg');

  const [isOffset, setIsOffset] = useState();
  const currentTab = useTabs((state) => state.currentTab);

  const tabsContainerRef = useRef(null);

  const { campaigns: campaignInvoices } = useGetInvoicesByCampId(isDemo ? null : campaign?.id);
  const { data: campaignAgreements } = useGetAgreements(isDemo ? null : campaign?.id);

  const isClient =
    publicReadonly || isDemo || user?.role === 'client' || user?.admin?.role?.name === 'Client';

  const getClientAllowedTabs = useCallback(
    () => (isDemo ? demoAllowedTabs : getAllowedTabs(campaign?.submissionVersion)),
    [isDemo, campaign?.submissionVersion]
  );

  const handleChangeTab = useCallback(
    (event, newValue) => {
      const allowed = getClientAllowedTabs();
      if (isClient && !allowed.includes(newValue)) {
        return;
      }
      localStorage.setItem('campaigndetail', newValue);
      setCurrentTab(newValue);
    },
    [isClient, getClientAllowedTabs]
  );

  const agreementSubmissions = useMemo(
    () => campaign?.submission?.filter((s) => s.submissionType?.type === 'AGREEMENT_FORM'),
    [campaign?.submission]
  );

  const getAgreementsLabel = (submissions, agreements, pitches, shortlisted) => {
    // Get approved pitch user IDs
    const approvedPitchUserIds = new Set(
      (pitches || [])
        .filter(
          (pitch) =>
            (pitch?.status === 'APPROVED' ||
              pitch?.status === 'AGREEMENT_SUBMITTED' ||
              pitch?.status === 'AGREEMENT_PENDING') &&
            pitch?.userId
        )
        .map((pitch) => pitch.userId)
    );

    // Get shortlisted user IDs (for backwards compatibility) — only those without a pitch.
    // V4 caveat: a ShortListedCreator row can exist BEFORE client approval (e.g. after admin
    // uses Link Creator on a SENT_TO_CLIENT pitch); the pitch's approval gate is the source
    // of truth when both exist.
    const allPitchUserIds = new Set((pitches || []).map((pitch) => pitch?.userId).filter(Boolean));
    const shortlistedUserIds = new Set(
      (shortlisted || [])
        .filter((s) => s?.userId && !allPitchUserIds.has(s.userId))
        .map((s) => s.userId)
    );

    // Combine both sets for total agreements
    const totalAgreementsUserIds = new Set([...approvedPitchUserIds, ...shortlistedUserIds]);

    const totalAgreements = (agreements || []).filter((a) => {
      if (!totalAgreementsUserIds.has(a.userId)) return false;
      const isUnlinkedGuest = a?.user?.creator?.isGuest === true;
      if (!isUnlinkedGuest) return true;
      const hasSubmission = (submissions || []).some((s) => s.userId === a.userId);
      return hasSubmission;
    }).length;

    return `Agreements (${totalAgreements})`;
  };

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return () => {};

    const handleWheel = (e) => {
      if (container.scrollWidth > container.clientWidth) {
        // Check if it's a horizontal scroll attempt (touchpad horizontal swipe)
        // or if deltaX is significant, let it scroll naturally
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          // Horizontal scroll - let it work naturally
          return;
        }

        // For vertical scroll (mouse wheel), convert to horizontal
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    if (!tabsContainerRef.current) return;
    const container = tabsContainerRef.current;

    const handleScroll = (e) => {
      setIsOffset(() => ({
        left: e.target.scrollLeft > 5,
        right: e.target.scrollLeft + e.target.clientWidth + 0.5 < e.target.scrollWidth,
      }));
    };

    container.addEventListener('scroll', handleScroll);

    // eslint-disable-next-line consistent-return
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [tabsContainerRef]);

  // Check if current tab is valid for client users
  useEffect(() => {
    const allowed = getClientAllowedTabs();
    if (isClient && !allowed.includes(currentTab)) {
      setCurrentTab('overview');
      localStorage.setItem('campaigndetail', 'overview');
    }
  }, [currentTab, isClient, getClientAllowedTabs]);

  // Approval public page can force a specific readonly background tab.
  useEffect(() => {
    if (!forcedTab) return;
    const allowed = getClientAllowedTabs();
    if (isClient && !allowed.includes(forcedTab)) return;
    setCurrentTab(forcedTab);
  }, [forcedTab, isClient, getClientAllowedTabs]);

  // Allow children to request tab switching via a window event
  useEffect(() => {
    const handleSwitchTab = (e) => {
      const targetTab = e?.detail;
      if (typeof targetTab !== 'string') return;
      const allowed = getClientAllowedTabs();
      if (isClient && !allowed.includes(targetTab)) return;
      localStorage.setItem('campaigndetail', targetTab);
      setCurrentTab(targetTab);
    };
    window.addEventListener('switchCampaignTab', handleSwitchTab);
    return () => window.removeEventListener('switchCampaignTab', handleSwitchTab);
  }, [isClient, getClientAllowedTabs]);

  return (
    <Box
      sx={{
        mt: 2,
        mb: 2.5,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          display: !isOffset?.left && 'none',
          left: 0,
          top: 0,
          bottom: 0,
          width: 32,
          background: 'linear-gradient(to right, white, transparent)',
          zIndex: 1,
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          display: !isOffset?.right && 'none',
          right: 0,
          top: 0,
          bottom: 0,
          width: 32,
          background: 'linear-gradient(to left, white, transparent)',
          zIndex: 1,
          pointerEvents: 'none',
        },
      }}
      overflow="hidden"
    >
      <Divider sx={{ position: 'absolute', bottom: 0, left: 0, width: 1 }} />
      <Stack
        ref={tabsContainerRef}
        direction="row"
        spacing={2}
        sx={{
          width: 1,
          overflowX: 'scroll',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{
            // width: { xs: '100%', sm: 'auto' },
            width: 'max-content',
          }}
        >
          {/* Show different tabs based on user role */}
          {(user?.role === 'client' || isDemo
            ? // Client user tabs (no Pitches tab)
              [
                { label: 'Overview', value: 'overview' },
                { label: 'Campaign Details', value: 'campaign-content' },
                { label: 'Creator Master List', value: 'creator-master-list' },
                ...(campaign?.submissionVersion === 'v4'
                  ? [{ label: 'Creator Submissions', value: 'submissions-v4' }]
                  : [{ label: 'Creator Deliverables', value: 'deliverables' }]),
                { label: 'Campaign Analytics', value: 'analytics' },
                campaign?.logisticsType && campaign.logisticsType !== ''
                  ? {
                      label: 'Logistics',
                      value: 'logistics',
                    }
                  : null,

                { label: 'FAQ', value: 'faq' },
              ]
            : // Admin/other user tabs
              [
                { label: 'Overview', value: 'overview' },
                { label: 'Campaign Details', value: 'campaign-content' },
                {
                  label: `Creator Master List (${campaign?.pitch?.length || 0})`,
                  value: 'pitch',
                },
                {
                  label: getAgreementsLabel(
                    agreementSubmissions,
                    campaignAgreements,
                    campaign?.pitch,
                    campaign?.shortlisted
                  ),
                  value: 'agreement',
                },
                ...(campaign?.submissionVersion === 'v4'
                  ? [
                      {
                        label: 'Creator Submissions',
                        value: 'submissions-v4',
                      },
                    ]
                  : [
                      {
                        label: 'Creator Deliverables',
                        value: 'deliverables',
                      },
                    ]),
                {
                  label: 'Campaign Analytics',
                  value: 'analytics',
                },
                {
                  label: `Invoices (${campaignInvoices?.length || 0})`,
                  value: 'invoices',
                },
                campaign?.logisticsType && campaign.logisticsType !== ''
                  ? {
                      label: 'Logistics',
                      value: 'logistics',
                    }
                  : null,

                { label: 'FAQ', value: 'faq' },
              ]
          )
            .filter(Boolean)
            .filter((tab) => !isDemo || demoAllowedTabs.includes(tab.value))
            .map((tab) => (
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
};

export default CampaignTabs;

CampaignTabs.propTypes = {
  campaign: PropTypes.object,
  isDemo: PropTypes.bool,
  publicReadonly: PropTypes.bool,
  forcedTab: PropTypes.string,
};
