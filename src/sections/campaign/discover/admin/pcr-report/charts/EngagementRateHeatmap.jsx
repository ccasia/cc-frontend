import { useMemo } from 'react';
import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';

import { calculateEngagementRate } from 'src/utils/socialMetricsCalculator';

const EngagementRateHeatmap = ({ filteredInsightsData, filteredSubmissions, campaign, postSnapshots }) => {
  const top5CreatorsPhases = useMemo(() => {
    // Anchor phase bucketing to the campaign's main start/end dates (campaignBrief.startDate/
    // endDate), matching what the backend milestone-snapshot cron uses to compute Day 7/15/30
    // (see capturePostEngagementSnapshots in postEngagementSnapshotService.ts, which diffs
    // against campaignBrief.startDate). campaignBrief.postingStartDate/postingEndDate is a much
    // narrower "creators must post within this window" range (often just a few days) and is too
    // short to hold a 30-day Day 7/15/30 phase model, so it's only used as a last-resort fallback.
    const postingStartDate =
      campaign?.campaignBrief?.startDate || campaign?.startDate || campaign?.campaignBrief?.postingStartDate;
    const postingEndDate =
      campaign?.campaignBrief?.endDate || campaign?.endDate || campaign?.campaignBrief?.postingEndDate;

    if (!postingStartDate || !postingEndDate) {
      return [];
    }

    const campaignStart = new Date(postingStartDate);
    const campaignEnd = new Date(postingEndDate);
    const campaignDuration = (campaignEnd - campaignStart) / (1000 * 60 * 60 * 24);

    // Phase definitions (Day 7, 15, 30 from campaign start)
    const firstWeekStart = 0; // Day 0
    const firstWeekEnd = 7; // Day 7
    const midPeriodDay = 15; // Day 15
    const finalWeekStart = 25; // Day 25
    const finalWeekEnd = 30; // Day 30

    const creatorPhaseData = new Map();

    // Use snapshot data if available
    if (postSnapshots && postSnapshots.length > 0) {

      postSnapshots.forEach((snapshot) => {
        const {userId} = snapshot;

        if (!creatorPhaseData.has(userId)) {
          // Find the submission to get creator info
          const submission = filteredSubmissions.find(
            (sub) => sub.id === snapshot.submissionId
          );

          // Prefer the creator's real account name over their social media handle
          const name = submission?.user?.name;
          const creatorName = submission?.user?.creator?.name;
          const displayName = name || creatorName || 'Unknown';

          creatorPhaseData.set(userId, {
            userId,
            name: displayName,
            isManualEntry: false,
            day7: null,
            day15: null,
            day30: null,
            overallER: 0,
            snapshotCount: 0,
          });
        }

        const creatorData = creatorPhaseData.get(userId);

        // Map snapshot days to phase data
        if (snapshot.snapshots.day7) {
          creatorData.day7 = snapshot.snapshots.day7.er;
          creatorData.overallER += snapshot.snapshots.day7.er;
          creatorData.snapshotCount += 1;
        }
        if (snapshot.snapshots.day15) {
          creatorData.day15 = snapshot.snapshots.day15.er;
          creatorData.overallER += snapshot.snapshots.day15.er;
          creatorData.snapshotCount += 1;
        }
        if (snapshot.snapshots.day30) {
          creatorData.day30 = snapshot.snapshots.day30.er;
          creatorData.overallER += snapshot.snapshots.day30.er;
          creatorData.snapshotCount += 1;
        }
      });

      const creatorsWithAverages = Array.from(creatorPhaseData.values()).map(creator => {
        const avgER = creator.snapshotCount > 0
          ? creator.overallER / creator.snapshotCount
          : 0;

      return {
          userId: creator.userId,
          name: creator.name,
          isManualEntry: creator.isManualEntry,
          firstWeek: creator.day7 ?? avgER,
          midPeriod: creator.day15 ?? avgER,
          finalWeek: creator.day30 ?? avgER,
          overallER: avgER,
          firstPostPhase: 'firstWeek',
        };
      });

      // Sort by overall ER and take top 5
      const top5 = creatorsWithAverages
        .filter(c => c.overallER > 0)
        .sort((a, b) => b.overallER - a.overallER)
        .slice(0, 5);

      if (top5.length > 0) {
        return top5;
      }
    }

    creatorPhaseData.clear(); // Clear the map for fallback logic

    filteredInsightsData.forEach((insightData) => {
      const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
      if (!submission) return;

      let postDate = null;

      // For Instagram: check video.taken_at field
      if (insightData.video?.taken_at) {
        const takenAt = insightData.video.taken_at;
        if (typeof takenAt === 'string') {
          postDate = new Date(takenAt);
        } else if (typeof takenAt === 'number') {
          postDate = new Date(takenAt * 1000);
        }
        if (!postDate || Number.isNaN(postDate.getTime())) {
          postDate = null;
        }
      }

      // For Instagram: check video.timestamp field
      if (!postDate && insightData.video?.timestamp) {
        const { timestamp } = insightData.video;
        if (typeof timestamp === 'string') {
          postDate = new Date(timestamp);
        } else if (typeof timestamp === 'number') {
          postDate = new Date(timestamp * 1000);
        }
        if (!postDate || Number.isNaN(postDate.getTime())) {
          postDate = null;
        }
      }

      // For TikTok: use video.create_time field
      if (!postDate && insightData.video?.create_time) {
        const createTime = insightData.video.create_time;
        if (typeof createTime === 'string') {
          postDate = new Date(createTime);
        } else if (typeof createTime === 'number') {
          postDate = new Date(createTime * 1000);
        }
        if (!postDate || Number.isNaN(postDate.getTime())) {
          postDate = null;
        }
      }

      // Fallback to submission created date
      if (!postDate && submission.createdAt) {
        postDate = new Date(submission.createdAt);
        if (Number.isNaN(postDate.getTime())) {
          postDate = null;
        }
      }

      let phase = null;
      let daysFromStart = null;

      if (!postDate || Number.isNaN(postDate.getTime())) {
        phase = 'finalWeek';
      } else {
        daysFromStart = (postDate - campaignStart) / (1000 * 60 * 60 * 24);

        // Determine which phase this post belongs to
        if (daysFromStart >= firstWeekStart && daysFromStart <= firstWeekEnd) {
          phase = 'firstWeek';
        } else if (daysFromStart > firstWeekEnd && daysFromStart < finalWeekStart) {
          phase = 'midPeriod';
        } else if (daysFromStart >= finalWeekStart && daysFromStart <= finalWeekEnd) {
          phase = 'finalWeek';
        }

        // Skip posts with a real date that falls outside the campaign period
        if (!phase || daysFromStart < 0 || daysFromStart > campaignDuration) return;
      }

      // Get creator identifier
      const userId = typeof submission.user === 'string' ? submission.user : submission.user?.id;
      const isManualEntry = userId === submission.id;

      if (!userId) return;

      if (!creatorPhaseData.has(userId)) {
        const instagramHandle = submission.user?.creator?.instagram;
        const tiktokHandle = submission.user?.creator?.tiktok;
        const email = submission.user?.email;
        const name = submission.user?.name;
        const creatorName = submission.user?.creator?.name;

        const platformUsername = submission.platform === 'Instagram'
          ? instagramHandle
          : tiktokHandle;

        // Prefer the creator's real account name over their social media handle
        const displayName = name || creatorName || platformUsername || email?.split('@')[0] || 'Unknown';

        creatorPhaseData.set(userId, {
          userId,
          name: displayName,
          isManualEntry,
          creatorUsername: platformUsername,
          firstWeek: [],
          midPeriod: [],
          finalWeek: [],
          totalER: 0,
          postCount: 0,
          firstPostPhase: null,
          firstPostDay: null, 
        });
      }

      const creatorData = creatorPhaseData.get(userId);
      const engagementRate = parseFloat(calculateEngagementRate(insightData.insight));

      if (!Number.isNaN(engagementRate) && engagementRate > 0) {
        creatorData[phase].push(engagementRate);

        if (phase === 'firstWeek') {
          creatorData.midPeriod.push(engagementRate);
          creatorData.finalWeek.push(engagementRate);
        } else if (phase === 'midPeriod') {

          creatorData.finalWeek.push(engagementRate);
        }
        // If posted in finalWeek, only track there

        creatorData.totalER += engagementRate;
        creatorData.postCount += 1;

        // Track first post phase and day
        if (!creatorData.firstPostPhase) {
          creatorData.firstPostPhase = phase;
          creatorData.firstPostDay = daysFromStart;
        }
      }
    });

    const creatorsWithAverages = Array.from(creatorPhaseData.values()).map(creator => {
      const overallER = creator.postCount > 0 ? creator.totalER / creator.postCount : 0;

      const firstWeekAvg = creator.firstWeek.length > 0
        ? creator.firstWeek.reduce((a, b) => a + b, 0) / creator.firstWeek.length
        : overallER;

      const midPeriodAvg = creator.midPeriod.length > 0
        ? creator.midPeriod.reduce((a, b) => a + b, 0) / creator.midPeriod.length
        : overallER;

      const finalWeekAvg = creator.finalWeek.length > 0
        ? creator.finalWeek.reduce((a, b) => a + b, 0) / creator.finalWeek.length
        : overallER;

      return {
        userId: creator.userId,
        name: creator.name,
        isManualEntry: creator.isManualEntry,
        creatorUsername: creator.creatorUsername,
        firstWeek: firstWeekAvg,
        midPeriod: midPeriodAvg,
        finalWeek: finalWeekAvg,
        overallER,
        firstPostPhase: creator.firstPostPhase,
      };
    });

    // Sort by overall ER and take top 5
    const top5 = creatorsWithAverages
      .filter(c => c.overallER > 0)
      .sort((a, b) => b.overallER - a.overallER)
      .slice(0, 5);

    return top5;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredInsightsData, filteredSubmissions, campaign, postSnapshots]);

  const creatorIdsToFetch = top5CreatorsPhases
    .filter(c => !c.isManualEntry && c.userId)
    .map(c => c.userId);

  const creator0Data = useGetCreatorById(creatorIdsToFetch[0] || null);
  const creator1Data = useGetCreatorById(creatorIdsToFetch[1] || null);
  const creator2Data = useGetCreatorById(creatorIdsToFetch[2] || null);
  const creator3Data = useGetCreatorById(creatorIdsToFetch[3] || null);
  const creator4Data = useGetCreatorById(creatorIdsToFetch[4] || null);

  const creatorDataList = [creator0Data, creator1Data, creator2Data, creator3Data, creator4Data]
    .slice(0, creatorIdsToFetch.length);

  const campaignAvg = useMemo(() => {
    if (top5CreatorsPhases.length === 0) {
      return 4.5;
    }

    const allCreatorERs = new Map();

    filteredInsightsData.forEach((insightData) => {
      const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
      if (!submission) return;

      const userId = typeof submission.user === 'string' ? submission.user : submission.user?.id;
      if (!userId) return;

      const engagementRate = parseFloat(calculateEngagementRate(insightData.insight));
      if (Number.isNaN(engagementRate) || engagementRate <= 0) return;

      if (!allCreatorERs.has(userId)) {
        allCreatorERs.set(userId, { totalER: 0, postCount: 0 });
      }

      const creatorData = allCreatorERs.get(userId);
      creatorData.totalER += engagementRate;
      creatorData.postCount += 1;
    });

    // Calculate average ER for each creator, then get campaign average
    const creatorAverages = Array.from(allCreatorERs.values()).map(creator =>
      creator.postCount > 0 ? creator.totalER / creator.postCount : 0
    ).filter(avg => avg > 0);

    if (creatorAverages.length === 0) return 4.5;

    const sumOfCreatorERs = creatorAverages.reduce((sum, avg) => sum + avg, 0);
    const campaignAverage = sumOfCreatorERs / creatorAverages.length;

    return campaignAverage;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredInsightsData, filteredSubmissions]);

  const getPhaseColor = (rate) => {
    if (rate === null) return '#E5E7EB';
    if (rate >= campaignAvg * 1.1) return '#01197B';
    if (rate >= campaignAvg * 0.9) return '#1340FF';
    return '#98BBFF';
  };

  // Use real data only
  const displayData = top5CreatorsPhases;

  return (
    <Box
      sx={{
        width: '100%',
        height: '376px',
        backgroundColor: '#F5F5F5',
        padding: '24px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        sx={{
          fontFamily: 'Aileron',
          fontWeight: 600,
          fontSize: '20px',
          lineHeight: '24px',
          color: '#231F20',
          mb: 3
        }}
      >
        Top 5 Creator ER Across Campaign Phases
      </Typography>

      {displayData.length === 0 ? (
        <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
          flex: 1,
          color: '#9CA3AF'
        }}>
          <Typography sx={{ fontFamily: 'Aileron', fontSize: '16px' }}>
            No posting data available
          </Typography>
          </Box>
      ) : (
        /* Creator rows */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {displayData.map((creator, index) => {
          // Get fetched creator data
          const fetchedCreatorData = creatorDataList[index]?.data;

          let displayName = 'Unknown';
          if (fetchedCreatorData?.user) {
            displayName = fetchedCreatorData.user.name ||
                         fetchedCreatorData.user.email?.split('@')[0] ||
                         'Unknown';
          } else if (creator.name && creator.name !== 'Unknown') {
            displayName = creator.name;
          } else if (creator.creatorUsername) {
            displayName = creator.creatorUsername;
          }

              return (
            <Box key={index} sx={{ display: 'flex', alignItems: 'stretch', gap: '0px' }}>
              {/* Creator name */}
              <Box sx={{
                width: '90px',
                    display: 'flex',
                    alignItems: 'center',
                pr: 1.5
              }}>
                <Typography
              sx={{
                    fontFamily: 'Aileron',
                fontSize: '14px',
                    fontWeight: 400,
                    color: '#000000',
                  }}
                >
                  {displayName}
                </Typography>
      </Box>

              {/* Phase boxes */}
              <Box sx={{ display: 'flex', gap: '8px', flex: 1 }}>
                <Box
                  sx={{
                    flex: 1,
                    height: '40px',
                    backgroundColor: creator.firstWeek ? getPhaseColor(creator.firstWeek) : '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Aileron',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: creator.firstWeek ? '#FFFFFF' : '#9CA3AF'
                    }}
                  >
                    {creator.firstWeek ? `${creator.firstWeek.toFixed(1)}%` : '-'}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    height: '40px',
                    backgroundColor: creator.midPeriod ? getPhaseColor(creator.midPeriod) : '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Aileron',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: creator.midPeriod ? '#FFFFFF' : '#9CA3AF'
                    }}
                  >
                    {creator.midPeriod ? `${creator.midPeriod.toFixed(1)}%` : '-'}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    height: '40px',
                    backgroundColor: creator.finalWeek ? getPhaseColor(creator.finalWeek) : '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Aileron',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: creator.finalWeek ? '#FFFFFF' : '#9CA3AF'
                    }}
                  >
                    {creator.finalWeek ? `${creator.finalWeek.toFixed(1)}%` : '-'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
      )}

      {/* Phase labels and legend - only show if there's data */}
      {displayData.length > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', mt: 'auto' }}>
            <Box sx={{ minWidth: '80px' }} />
            <Box sx={{ display: 'flex', gap: '8px', flex: 1 }}>
              <Typography sx={{ flex: 1, textAlign: 'center', fontFamily: 'Aileron', fontSize: '11px', fontWeight: 400, color: '#231F20', whiteSpace: 'nowrap' }}>
                First Week after Posting
              </Typography>
              <Typography sx={{ flex: 1, textAlign: 'center', fontFamily: 'Aileron', fontSize: '11px', fontWeight: 400, color: '#231F20', whiteSpace: 'nowrap' }}>
                Mid P.Period
              </Typography>
              <Typography sx={{ flex: 1, textAlign: 'center', fontFamily: 'Aileron', fontSize: '11px', fontWeight: 400, color: '#231F20', whiteSpace: 'nowrap' }}>
                1 Week after P.Period
              </Typography>
            </Box>
          </Box>

          {/* Legend */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', mt: 1 }}>
            <Box sx={{ minWidth: '80px' }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '0px', flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#98BBFF', borderRadius: '0px', px: 1.2, py: 0.5 }}>
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '10px', fontWeight: 500, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                  Below Campaign Avg
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#1340FF', borderRadius: '0px', px: 1.2, py: 0.5 }}>
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '10px', fontWeight: 500, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                  Campaign Average
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#01197B', borderRadius: '0px', px: 1.2, py: 0.5 }}>
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '10px', fontWeight: 500, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                  Above Campaign Avg
                </Typography>
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

EngagementRateHeatmap.propTypes = {
  filteredInsightsData: PropTypes.array.isRequired,
  filteredSubmissions: PropTypes.array.isRequired,
  campaign: PropTypes.shape({
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    campaignBrief: PropTypes.shape({
      postingStartDate: PropTypes.string,
      postingEndDate: PropTypes.string,
      startDate: PropTypes.string,
      endDate: PropTypes.string,
    }),
  }),
  postSnapshots: PropTypes.array,
};

export default EngagementRateHeatmap;
