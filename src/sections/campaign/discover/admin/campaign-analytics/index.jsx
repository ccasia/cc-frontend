/* eslint-disable react/prop-types */
import PropTypes from 'prop-types';
import { useMemo, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { AnimatePresence } from 'framer-motion';

import { Box, Alert, Stack, Button, Typography, CircularProgress } from '@mui/material';

import { useSocialInsights } from 'src/hooks/use-social-insights';
import { useGetManualCreatorEntries } from 'src/hooks/useSWR/useGetManualCreatorEntries';

import { canonicalizePostUrl, extractPostingSubmissions } from 'src/utils/extractPostingLinks';
import {
  getMetricValue,
  calculateSummaryStats,
  calculateEngagementRate,
} from 'src/utils/socialMetricsCalculator';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import { TopCreatorsLineChart, EngagementRateHeatmap } from 'src/components/trend-analysis';

import PCRReportPage from '../pcr-report/pcr-report-page';
import CreatorList from './components/CreatorList';
import DeleteDialog from './components/DeleteDialog';
import PlatformToggle from './components/PlatformToggle';
import CoreMetricsSection from './components/CoreMetricsSection';
import AnalyticsPageSkeleton from './components/AnalyticsPageSkeleton';
import PlatformOverviewLayout from './components/PlatformOverviewLayout';
import {
  setReportState,
  setEntryToDelete,
  setShowReportPage,
  useAnalyticsStore,
  setDeleteModalOpen,
} from './stores/analytics.store';

const CampaignAnalysis = ({ campaign, campaignMutate, isDisabled = false }) => {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();

  const { entries: manualEntries, mutate: mutateManualEntries } = useGetManualCreatorEntries(
    campaign?.id
  );

  const selectedPlatform = useAnalyticsStore((state) => state.selectedPlatform);
  const reportState = useAnalyticsStore((state) => state.reportState);
  const showReportPage = useAnalyticsStore((state) => state.showReportPage);

  const isClient = useMemo(() => user?.role?.includes('client'), [user]);

  const submissions = useMemo(
    () =>
      campaign?.submission?.filter(
        (submission) =>
          submission?.submissionType.type === 'POSTING' ||
          ['PHOTO', 'VIDEO'].includes(submission?.submissionType.type)
      ) || [],
    [campaign?.submission]
  );

  const postingSubmissions = useMemo(() => extractPostingSubmissions(submissions), [submissions]);

  const availablePlatforms = useMemo(() => {
    if (postingSubmissions.length === 0) {
      return ['Instagram', 'TikTok'];
    }
    const platforms = [
      ...new Set(postingSubmissions.map((sub) => sub && sub.platform).filter(Boolean)),
    ];
    return platforms.length > 0 ? platforms : ['Instagram', 'TikTok'];
  }, [postingSubmissions]);

  const filteredSubmissions = useMemo(() => {
    if (selectedPlatform === 'ALL') {
      return postingSubmissions.filter((sub) => sub && sub.platform);
    }
    return postingSubmissions.filter((sub) => sub && sub.platform === selectedPlatform);
  }, [postingSubmissions, selectedPlatform]);

  const {
    data: insightsData,
    isLoading: loadingInsights,
    error: insightsError,
    mutate: refreshInsights,
    clearCache,
  } = useSocialInsights(postingSubmissions, campaign?.id);

  const filteredInsightsData = useMemo(() => {
    if (selectedPlatform === 'ALL') {
      return insightsData;
    }
    return insightsData.filter((data) => data && data.platform === selectedPlatform);
  }, [insightsData, selectedPlatform]);

  // Filter manual entries based on selected platform
  const filteredManualEntries = useMemo(() => {
    if (!manualEntries || manualEntries.length === 0) {
      return [];
    }
    if (selectedPlatform === 'ALL') {
      return manualEntries;
    }
    return manualEntries.filter((entry) => entry.platform === selectedPlatform);
  }, [manualEntries, selectedPlatform]);

  const summaryStats = useMemo(() => {
    // If we have no insights and no manual entries, return placeholder
    if (!filteredInsightsData?.length && !filteredManualEntries?.length) {
      return {
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalSaved: 0,
        totalReach: 0,
        totalPosts: 0,
        avgEngagementRate: 0,
      };
    }
    // Calculate stats including both insights and manual entries
    return calculateSummaryStats(filteredInsightsData, filteredManualEntries);
  }, [filteredInsightsData, filteredManualEntries]);

  const platformCounts = useMemo(() => {
    const counts = { Instagram: 0, TikTok: 0 };
    const data = [...postingSubmissions, ...manualEntries];

    const sanitized = [];

    data.forEach((element) => {
      if (!sanitized.some((a) => a.postUrl === element.postUrl)) sanitized.push(element);
    });

    sanitized.forEach((item) => {
      if (item?.platform === 'Instagram' || item?.entry?.platform === 'Instagram')
        counts.Instagram += 1;
      if (item?.platform === 'TikTok' || item?.entry?.platform === 'TikTok') counts.TikTok += 1;
    });

    return counts;
  }, [postingSubmissions, manualEntries]);

  const findTopPerformerByMetric = (metricKey, insights, submissionsList) => {
    let topPerformer = null;
    let highestValue = 0;

    // Check API insights
    if (insights && insights.length > 0) {
      insights.forEach((insightData) => {
        const submission = submissionsList.find((sub) => sub.id === insightData.submissionId);
        if (submission) {
          const value = getMetricValue(insightData.insight, metricKey);
          if (value > highestValue) {
            highestValue = value;
            topPerformer = {
              submission,
              value,
              insightData,
            };
          }
        }
      });
    }

    // Check manual entries
    if (filteredManualEntries && filteredManualEntries.length > 0) {
      filteredManualEntries.forEach((entry) => {
        let value = 0;
        // Map metric keys to manual entry fields
        if (metricKey === 'views') value = entry.views || 0;
        else if (metricKey === 'likes') value = entry.likes || 0;
        else if (metricKey === 'comments') value = entry.comments || 0;
        else if (metricKey === 'shares') value = entry.shares || 0;
        else if (metricKey === 'saved') value = entry.saved || 0;

        if (value > highestValue) {
          highestValue = value;
          topPerformer = {
            submission: null, // Manual entries don't have submissions
            value,
            insightData: null,
            manualEntry: {
              creatorName: entry.creatorName,
              creatorUsername: entry.creatorUsername,
              platform: entry.platform,
            },
          };
        }
      });
    }

    return topPerformer;
  };

  const creatorListRowsSorted = useMemo(() => {
    const manualRows = filteredManualEntries.map((entry) => ({
      kind: 'manual',
      dedupKey: `manual::${entry.id}`,
      engagementRate: Number(entry.engagementRate) || 0,
      entry,
    }));

    const submissionRows = [];
    const seenSubmissionKeys = new Set();

    filteredSubmissions.forEach((submission) => {
      const insightData = insightsData.find(
        (data) => data.submissionId === submission.id && data.postUrl === submission.postUrl
      );
      if (!insightData && !loadingInsights) {
        return;
      }

      const engagementRate = insightData ? calculateEngagementRate(insightData.insight) : 0;
      const canonical = canonicalizePostUrl(submission.postUrl);
      const dedupKey = canonical
        ? `submission-url::${submission.platform}::${canonical}`
        : `submission::${submission.platform}::${submission.user}::${submission.id}`;

      if (seenSubmissionKeys.has(dedupKey)) return;
      seenSubmissionKeys.add(dedupKey);

      submissionRows.push({
        kind: 'submission',
        dedupKey,
        engagementRate,
        submission,
        insightData,
      });
    });

    return [...manualRows, ...submissionRows].sort((a, b) => b.engagementRate - a.engagementRate);
  }, [filteredManualEntries, filteredSubmissions, insightsData, loadingInsights]);

  const handleDeleteClick = (entry) => {
    setEntryToDelete(entry);
    setDeleteModalOpen(true);
  };

  // Socket event listener for media kit connections
  useEffect(() => {
    if (!socket || !campaign?.id) return undefined;

    const handleAnalyticsRefresh = (data) => {
      console.log('📡 Received analytics refresh event:', data);

      // Check if this user has submissions in current campaign
      const hasUserSubmissions = postingSubmissions.some((sub) => sub.user === data.userId);

      if (hasUserSubmissions) {
        console.log(`🔄 ${data.platform} connected for user, refreshing analytics...`);
        enqueueSnackbar(`${data.platform} connected! Refreshing analytics...`, {
          variant: 'success',
        });

        // Clear cache and re-fetch with a small delay to ensure API is ready
        clearCache();
        setTimeout(() => {
          refreshInsights();
        }, 1500);
      }
    };

    // Join campaign room and listen for analytics refresh events
    socket.joinCampaign(campaign?.id);
    socket.on('analytics:refresh', handleAnalyticsRefresh);

    return () => {
      socket.off('analytics:refresh', handleAnalyticsRefresh);
      socket.leaveCampaign(campaign?.id);
    };
  }, [socket, campaign?.id, postingSubmissions, clearCache, refreshInsights]);

  // No campaign
  if (!campaign) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Campaign information not available.
      </Alert>
    );
  }

  // No campaign ID
  if (!campaign?.id) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Campaign ID not available.
      </Alert>
    );
  }

  return (
    <Box>
      {showReportPage ? (
        <PCRReportPage
          campaign={campaign}
          onBack={() => setShowReportPage(false)}
          isClientView={isClient}
          onCampaignUpdate={(updatedCampaign) => {
            if (updatedCampaign && campaignMutate) {
              campaignMutate(updatedCampaign, { revalidate: true });
            } else if (campaignMutate) {
              campaignMutate();
            }
          }}
        />
      ) : (
        <>
          {!!availablePlatforms?.length && (
            <PlatformToggle availablePlatforms={availablePlatforms} />
          )}

          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography fontSize={24} fontWeight={600} fontFamily="Aileron">
              Performance Summary
            </Typography>

            {/* eslint-disable-next-line no-nested-ternary */}
            {!isClient ? (
              <Button
                disabled={reportState === 'loading'}
                sx={{
                  width: '186.07px',
                  height: '44px',
                  borderRadius: '8px',
                  gap: '6px',
                  padding: '10px 16px 13px 16px',
                  background:
                    reportState === 'loading'
                      ? 'linear-gradient(90deg, #B8B8B8 0%, #9E9E9E 100%)'
                      : 'linear-gradient(90deg, #8A5AFE 0%, #1340FF 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
                  boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.1) inset',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '14px',
                  textTransform: 'none',
                  '&:hover': {
                    background:
                      reportState === 'loading'
                        ? 'linear-gradient(90deg, #B8B8B8 0%, #9E9E9E 100%)'
                        : 'linear-gradient(90deg, #7A4AEE 0%, #0330EF 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
                    boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
                  },
                  '&:active': {
                    boxShadow:
                      reportState === 'loading'
                        ? '0px -3px 0px 0px rgba(0, 0, 0, 0.1) inset'
                        : '0px -1px 0px 0px rgba(0, 0, 0, 0.1) inset',
                    transform: reportState === 'loading' ? 'none' : 'translateY(1px)',
                  },
                  '&:disabled': {
                    color: '#FFFFFF',
                  },
                }}
                onClick={() => {
                  if (reportState === 'generate') {
                    // Start loading
                    setReportState('loading');

                    setTimeout(() => {
                      setReportState('view');
                    }, 3000); // 3 second loading simulation
                  } else if (reportState === 'view') {
                    // Show PCR report page
                    setShowReportPage(true);
                  }
                }}
              >
                {reportState === 'loading' && (
                  <CircularProgress
                    size={16}
                    sx={{
                      color: '#FFFFFF',
                      mr: 1,
                    }}
                  />
                )}
                {reportState === 'generate' && 'Generate Report'}
                {reportState === 'loading' && 'Generating...'}
                {reportState === 'view' && 'View Report'}
              </Button>
            ) : campaign?.isPCRReady ? (
              <Button
                sx={{
                  width: '186.07px',
                  height: '44px',
                  borderRadius: '8px',
                  gap: '6px',
                  padding: '10px 16px 13px 16px',
                  background:
                    'linear-gradient(90deg, #8A5AFE 0%, #1340FF 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
                  boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.1) inset',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '14px',
                  textTransform: 'none',
                  '&:hover': {
                    background:
                      'linear-gradient(90deg, #7A4AEE 0%, #0330EF 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
                    boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
                  },
                  '&:active': {
                    boxShadow: '0px -1px 0px 0px rgba(0, 0, 0, 0.1) inset',
                    transform: 'translateY(1px)',
                  },
                }}
                onClick={() => setShowReportPage(true)}
              >
                View Report
                {showReportPage && 'Test'}
              </Button>
            ) : null}
          </Box>

          {insightsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error loading insights: {insightsError?.message || 'Unknown error'}
            </Alert>
          )}

          <AnimatePresence mode="wait">
            {loadingInsights && <AnalyticsPageSkeleton key="skeleton" />}
          </AnimatePresence>

          {!loadingInsights && (
            <>
              <Box sx={{ mb: 4 }}>
                <CoreMetricsSection
                  insightsData={filteredInsightsData}
                  postingSubmissions={postingSubmissions ?? []}
                  summaryStats={summaryStats}
                  filteredInsightsData={filteredInsightsData}
                  filteredSubmissions={filteredSubmissions}
                  findTopPerformerByMetric={findTopPerformerByMetric}
                />

                {!!availablePlatforms.length && (
                  <PlatformOverviewLayout
                    postCount={filteredSubmissions.length}
                    insightsData={filteredInsightsData}
                    summaryStats={summaryStats}
                    platformCounts={platformCounts}
                    filteredInsightsData={filteredInsightsData}
                    filteredSubmissions={filteredSubmissions}
                    availablePlatforms={availablePlatforms}
                  />
                )}
              </Box>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                flex={1}
                spacing={4}
                justifyContent="space-between"
                minHeight={{ xs: 'auto', md: 500 }}
                mb={4}
              >
                <Box flex={1} width="100%">
                  <EngagementRateHeatmap
                    campaignId={campaign?.id}
                    platform={selectedPlatform === 'ALL' ? 'All' : selectedPlatform}
                    weeks={6}
                  />
                </Box>
                <Box flex={1} width="100%">
                  <TopCreatorsLineChart
                    campaignId={campaign?.id}
                    platform={selectedPlatform === 'ALL' ? 'All' : selectedPlatform}
                    days={7}
                  />
                </Box>
              </Stack>

              <CreatorList
                campaignId={campaign?.id}
                loadingInsights={loadingInsights}
                filteredSubmissions={filteredSubmissions}
                mutateManualEntries={mutateManualEntries}
                isDisabled={isDisabled}
                creatorListRowsSorted={creatorListRowsSorted}
                handleDeleteClick={handleDeleteClick}
                postingSubmissions={postingSubmissions ?? []}
                manualEntries={manualEntries}
              />
            </>
          )}

          <DeleteDialog campaignId={campaign?.id} mutateManualEntries={mutateManualEntries} />
        </>
      )}
    </Box>
  );
};

export default CampaignAnalysis;

CampaignAnalysis.propTypes = {
  campaign: PropTypes.shape({
    id: PropTypes.string,
    submission: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        postUrl: PropTypes.string,
        user: PropTypes.string,
        platform: PropTypes.string,
      })
    ),
  }),
  campaignMutate: PropTypes.func,
  isDisabled: PropTypes.bool,
};
