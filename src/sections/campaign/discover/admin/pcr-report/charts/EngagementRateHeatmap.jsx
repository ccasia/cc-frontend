import { useMemo } from 'react';
import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';

import { calculateEngagementRate } from 'src/utils/socialMetricsCalculator';

const EngagementRateHeatmap = ({ filteredInsightsData, filteredSubmissions, campaign, postSnapshots }) => {
  const top5CreatorsPhases = useMemo(() => {
    // Get campaign posting period from Additional 1 fields
    const postingStartDate = campaign?.campaignBrief?.postingStartDate;
    const postingEndDate = campaign?.campaignBrief?.postingEndDate;

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

          const username = submission?.user?.username;
          const name = submission?.user?.name;
          const creatorName = submission?.user?.creator?.name;
          const displayName = username || name || creatorName || 'Unknown';

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

      // Calculate average ER
      const creatorsWithAverages = Array.from(creatorPhaseData.values()).map(creator => {
        const avgER = creator.snapshotCount > 0
          ? creator.overallER / creator.snapshotCount
          : 0;

      return {
          userId: creator.userId,
          name: creator.name,
          isManualEntry: creator.isManualEntry,
          firstWeek: creator.day7,
          midPeriod: creator.day15,
          finalWeek: creator.day30,
          overallER: avgER,
          firstPostPhase: 'firstWeek', // All posts have snapshots from day 7
        };
      });

      // Sort by overall ER and take top 5
      const top5 = creatorsWithAverages
        .filter(c => c.overallER > 0)
        .sort((a, b) => b.overallER - a.overallER)
        .slice(0, 5);

      // console.log('Top 5 creators from snapshots:', top5.length);
      return top5;
    }
    
    creatorPhaseData.clear(); // Clear the map for fallback logic

    // console.log('Processing submissions:', filteredSubmissions.length);

    // filteredInsightsData.forEach((insightData, idx) => {
    //   const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
    //   if (!submission) {
    //     console.log(`No submission found for insight ${idx}`);
    //     return;
    //   }

    //   // Get post date - prioritize actual post date from Instagram/TikTok
    //   let postDate = null;

    //   console.log(`\n🔍 Post ${idx} - Looking for date:`);
    //   console.log('  video object:', insightData.video);
    //   console.log('  video.taken_at:', insightData.video?.taken_at);
    //   console.log('  video.timestamp:', insightData.video?.timestamp);

    //   // For Instagram: check video.taken_at field
    //   if (insightData.video?.taken_at) {
    //     const takenAt = insightData.video.taken_at;
    //     console.log('  Trying taken_at:', takenAt, 'type:', typeof takenAt);

    //     // Check if it's already a valid date string or needs conversion
    //     if (typeof takenAt === 'string') {
    //       postDate = new Date(takenAt);
    //     } else if (typeof takenAt === 'number') {
    //       postDate = new Date(takenAt * 1000);
    //     }

    //     if (postDate && !Number.isNaN(postDate.getTime())) {
    //       console.log(`📸 Using Instagram video.taken_at: ${postDate.toISOString()}`);
    //     } else {
    //       postDate = null;
    //     }
    //   }

    //   // For Instagram: check video.timestamp field
    //   if (!postDate && insightData.video?.timestamp) {
    //     const {timestamp} = insightData.video;
    //     console.log('  Trying timestamp:', timestamp, 'type:', typeof timestamp);

    //     if (typeof timestamp === 'string') {
    //       postDate = new Date(timestamp);
    //     } else if (typeof timestamp === 'number') {
    //       postDate = new Date(timestamp * 1000);
    //     }

    //     if (postDate && !Number.isNaN(postDate.getTime())) {
    //       console.log(`📸 Using Instagram video.timestamp: ${postDate.toISOString()}`);
    //     } else {
    //       postDate = null;
    //     }
    //   }

    //   // For TikTok: use video.create_time field
    //   if (!postDate && insightData.video?.create_time) {
    //     const createTime = insightData.video.create_time;
    //     console.log('  Trying create_time:', createTime, 'type:', typeof createTime);

    //     if (typeof createTime === 'string') {
    //       postDate = new Date(createTime);
    //     } else if (typeof createTime === 'number') {
    //       postDate = new Date(createTime * 1000);
    //     }

    //     if (postDate && !Number.isNaN(postDate.getTime())) {
    //       console.log(`📸 Using TikTok video.create_time: ${postDate.toISOString()}`);
    //     } else {
    //       postDate = null;
    //     }
    //   }

    //   // Fallback to submission created date
    //   if (!postDate && submission.createdAt) {
    //     postDate = new Date(submission.createdAt);
    //     if (postDate && !Number.isNaN(postDate.getTime())) {
    //       console.log(`📝 Using submission createdAt: ${postDate.toISOString()}`);
    //       console.log(`⚠️ Warning: Using submission date instead of actual post date!`);
    //     } else {
    //       postDate = null;
    //     }
    //   }

    //   if (!postDate || Number.isNaN(postDate.getTime())) {
    //     console.log(`⚠️ No valid post date for submission ${idx}`);
    //     return;
    //   }

    //   const daysFromStart = (postDate - campaignStart) / (1000 * 60 * 60 * 24);
    //   console.log(`📅 Post ${idx}: ${daysFromStart.toFixed(1)} days from start (${postDate.toISOString()})`);
    //   console.log(`   Campaign: ${campaignStart.toISOString()} to ${campaignEnd.toISOString()}`);

    //   // Determine which phase this post belongs to
    //   let phase = null;
    //   if (daysFromStart >= firstWeekStart && daysFromStart <= firstWeekEnd) {
    //     phase = 'firstWeek';
    //   } else if (daysFromStart > firstWeekEnd && daysFromStart < finalWeekStart) {
    //     phase = 'midPeriod';
    //   } else if (daysFromStart >= finalWeekStart && daysFromStart <= finalWeekEnd) {
    //     phase = 'finalWeek';
    //   }

    //   // Skip posts outside campaign period
    //   if (!phase || daysFromStart < 0 || daysFromStart > campaignDuration) {
    //     if (daysFromStart < 0) {
    //       console.log(`⚠️ Post ${idx} is BEFORE campaign start (${Math.abs(daysFromStart).toFixed(1)} days before)`);
    //     } else {
    //       console.log(`⚠️ Post ${idx} is AFTER campaign end (${(daysFromStart - campaignDuration).toFixed(1)} days after)`);
    //     }
    //     return;
    //   }

    //   console.log(`✅ Post ${idx} assigned to ${phase}`);

    //   // Get creator identifier
    //   const userId = typeof submission.user === 'string' ? submission.user : submission.user?.id;
    //   const isManualEntry = userId === submission.id;

    //   if (!userId) return;

    //   if (!creatorPhaseData.has(userId)) {
    //     const instagramHandle = submission.user?.creator?.instagram;
    //     const tiktokHandle = submission.user?.creator?.tiktok;
    //     const username = submission.user?.username;
    //     const email = submission.user?.email;
    //     const name = submission.user?.name;
    //     const creatorName = submission.user?.creator?.name;

    //     const platformUsername = submission.platform === 'Instagram'
    //       ? instagramHandle
    //       : tiktokHandle;

    //     const displayName = username || name || creatorName || platformUsername || email?.split('@')[0] || 'Unknown';

    //     creatorPhaseData.set(userId, {
    //       userId,
    //       name: displayName,
    //       isManualEntry,
    //       creatorUsername: platformUsername,
    //       firstWeek: [],
    //       midPeriod: [],
    //       finalWeek: [],
    //       totalER: 0,
    //       postCount: 0,
    //       firstPostPhase: null,
    //       firstPostDay: null, // Track when they first posted
    //     });
    //   }

    //   const creatorData = creatorPhaseData.get(userId);
    //   const engagementRate = parseFloat(calculateEngagementRate(insightData.insight));

    //   if (!Number.isNaN(engagementRate) && engagementRate > 0) {
    //     // Add the ER to the phase where the post was made
    //     creatorData[phase].push(engagementRate);

    //     // Also add the same ER to all future phases (same post tracked over time)
    //     if (phase === 'firstWeek') {
    //       // If posted in first week, also track in mid period and final week
    //       creatorData.midPeriod.push(engagementRate);
    //       creatorData.finalWeek.push(engagementRate);
    //     } else if (phase === 'midPeriod') {
    //       // If posted in mid period, also track in final week
    //       creatorData.finalWeek.push(engagementRate);
    //     }
    //     // If posted in finalWeek, only track there

    //     creatorData.totalER += engagementRate;
    //     creatorData.postCount += 1;

    //     // Track first post phase and day
    //     if (!creatorData.firstPostPhase) {
    //       creatorData.firstPostPhase = phase;
    //       creatorData.firstPostDay = daysFromStart;
    //       console.log(`🎯 Creator's first post: Day ${daysFromStart.toFixed(1)} in ${phase}`);
    //       console.log(`   → Will track this post's ER (${engagementRate.toFixed(2)}%) across all future periods`);
    //     }
    //   }
    // });

    // Calculate average ER per phase for each creator and determine which boxes to show
    const creatorsWithAverages = Array.from(creatorPhaseData.values()).map(creator => {
      const firstWeekAvg = creator.firstWeek.length > 0
        ? creator.firstWeek.reduce((a, b) => a + b, 0) / creator.firstWeek.length
        : null;

      const midPeriodAvg = creator.midPeriod.length > 0
        ? creator.midPeriod.reduce((a, b) => a + b, 0) / creator.midPeriod.length
        : null;

      const finalWeekAvg = creator.finalWeek.length > 0
        ? creator.finalWeek.reduce((a, b) => a + b, 0) / creator.finalWeek.length
        : null;

      // Determine which bars to show based on when they first posted
      let showFirstWeek = false;
      let showMidPeriod = false;
      let showFinalWeek = false;

      if (creator.firstPostPhase === 'firstWeek') {
        // Posted in first week → show all 3 bars
        showFirstWeek = true;
        showMidPeriod = true;
        showFinalWeek = true;
      } else if (creator.firstPostPhase === 'midPeriod') {
        // Posted in mid period → show mid period and final week
        showMidPeriod = true;
        showFinalWeek = true;
      } else if (creator.firstPostPhase === 'finalWeek') {
        // Posted in final week → show only final week
        showFinalWeek = true;
      }

      return {
        userId: creator.userId,
        name: creator.name,
        isManualEntry: creator.isManualEntry,
        creatorUsername: creator.creatorUsername,
        // Show bars based on when they first posted, use 0 if no data yet
        firstWeek: showFirstWeek ? (firstWeekAvg || 0) : null,
        midPeriod: showMidPeriod ? (midPeriodAvg || 0) : null,
        finalWeek: showFinalWeek ? (finalWeekAvg || 0) : null,
        overallER: creator.postCount > 0 ? creator.totalER / creator.postCount : 0,
        firstPostPhase: creator.firstPostPhase,
      };
    });

    // Sort by overall ER and take top 5
    const top5 = creatorsWithAverages
      .filter(c => c.overallER > 0)
      .sort((a, b) => b.overallER - a.overallER)
      .slice(0, 5);

    top5.forEach((c, i) => {

      // Format First Week
      let firstWeekDisplay = 'hidden';
      if (c.firstWeek !== null) {
        firstWeekDisplay = c.firstWeek ? `${c.firstWeek.toFixed(2)}%` : '0% (no data)';
      }

      // Format Mid Period
      let midPeriodDisplay = 'hidden';
      if (c.midPeriod !== null) {
        midPeriodDisplay = c.midPeriod ? `${c.midPeriod.toFixed(2)}%` : '0% (no data)';
      }

      // Format Final Week
      let finalWeekDisplay = 'hidden';
      if (c.finalWeek !== null) {
        finalWeekDisplay = c.finalWeek ? `${c.finalWeek.toFixed(2)}%` : '0% (no data)';
      }

      const boxCount = [c.firstWeek, c.midPeriod, c.finalWeek].filter(v => v !== null).length;
    });

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
        Top 5 Creator ER Across Posting Period
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

          // Try to get username from fetched data
          let displayName = 'Unknown';
          if (fetchedCreatorData?.user) {
            // Try username field first
            displayName = fetchedCreatorData.user.username ||
                         fetchedCreatorData.user.name ||
                         fetchedCreatorData.user.email?.split('@')[0] ||
                         'Unknown';
          } else if (creator.creatorUsername) {
            displayName = creator.creatorUsername;
          } else if (creator.name && creator.name !== 'Unknown') {
            displayName = creator.name;
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
                {/* First Week - show if creator posted in first week */}
                {creator.firstWeek !== null && (
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
                )}

                {/* Mid Period - show if creator posted in first week or mid period */}
                {creator.midPeriod !== null && (
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
                )}

                {/* Final Week - always show (all creators should have this) */}
                {creator.finalWeek !== null && (
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
                )}
      </Box>
            </Box>
          );
        })}
      </Box>
      )}

      {/* Phase labels and legend - only show if there's data */}
      {displayData.length > 0 && (() => {
        // Determine which phases have data across all creators
        const hasFirstWeek = displayData.some(c => c.firstWeek !== null);
        const hasMidPeriod = displayData.some(c => c.midPeriod !== null);
        const hasFinalWeek = displayData.some(c => c.finalWeek !== null);

        return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', mt: 'auto' }}>
          <Box sx={{ minWidth: '80px' }} />
          <Box sx={{ display: 'flex', gap: '8px', flex: 1 }}>
            {hasFirstWeek && (
              <Typography sx={{ flex: 1, textAlign: 'center', fontFamily: 'Aileron', fontSize: '11px', fontWeight: 400, color: '#231F20', whiteSpace: 'nowrap' }}>
                First Week of Post
              </Typography>
            )}
            {hasMidPeriod && (
              <Typography sx={{ flex: 1, textAlign: 'center', fontFamily: 'Aileron', fontSize: '11px', fontWeight: 400, color: '#231F20', whiteSpace: 'nowrap' }}>
                Mid Posting Period
              </Typography>
            )}
            {hasFinalWeek && (
              <Typography sx={{ flex: 1, textAlign: 'center', fontFamily: 'Aileron', fontSize: '11px', fontWeight: 400, color: '#231F20', whiteSpace: 'nowrap' }}>
                1 Week after P.Period
              </Typography>
            )}
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
        );
      })()}
    </Box>
  );
};

EngagementRateHeatmap.propTypes = {
  filteredInsightsData: PropTypes.array.isRequired,
  filteredSubmissions: PropTypes.array.isRequired,
  campaign: PropTypes.shape({
    campaignBrief: PropTypes.shape({
      postingStartDate: PropTypes.string,
      postingEndDate: PropTypes.string,
    }),
  }),
  postSnapshots: PropTypes.array,
};

export default EngagementRateHeatmap;
