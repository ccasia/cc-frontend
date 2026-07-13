import { useMemo } from 'react';
import PropTypes from 'prop-types';

import { Box, Link, Typography } from '@mui/material';

import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';

import { calculateEngagementRate } from 'src/utils/socialMetricsCalculator';

const TopEngagementCard = ({ filteredInsightsData, filteredSubmissions }) => {
  const top5Creators = useMemo(() => {
    const creatorsWithEngagement = [];

    filteredInsightsData.forEach((insightData) => {
      const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
      if (submission) {
        const engagementRate = parseFloat(calculateEngagementRate(insightData.insight));
        if (!Number.isNaN(engagementRate) && engagementRate > 0) {
          creatorsWithEngagement.push({
            submission,
            insightData,
            engagementRate,
            platform: insightData.platform || 'Unknown'
          });
        }
      }
    });

    // Sort by engagement rate and take top 5
    return creatorsWithEngagement
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 5);
  }, [filteredInsightsData, filteredSubmissions]);

  // Get creator data for top 5
  const creatorIds = top5Creators.map(c => c.submission.user);

  // Call hooks for each creator ID (up to 5 creators)
  const engagementCreator0Data = useGetCreatorById(creatorIds[0] || null);
  const engagementCreator1Data = useGetCreatorById(creatorIds[1] || null);
  const engagementCreator2Data = useGetCreatorById(creatorIds[2] || null);
  const engagementCreator3Data = useGetCreatorById(creatorIds[3] || null);
  const engagementCreator4Data = useGetCreatorById(creatorIds[4] || null);

  const creatorDataList = [engagementCreator0Data, engagementCreator1Data, engagementCreator2Data, engagementCreator3Data, engagementCreator4Data]
    .slice(0, creatorIds.length);

  // Find max engagement rate for bar width calculation
  const maxEngagementRate = top5Creators.length > 0 ? Math.max(...top5Creators.map(c => c.engagementRate)) : 0;

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
          mb: 1.5
        }}
        >
        Top 5 Creator Engagement Rate
            </Typography>

      {top5Creators.length === 0 ? (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          color: '#9CA3AF'
        }}>
          <Typography sx={{ fontFamily: 'Aileron', fontSize: '16px' }}>
            No engagement data available
            </Typography>
          </Box>
      ) : (
      /* Creator bars */
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'space-around', py: 1 }}>
        {top5Creators.map((creator, index) => {
          const creatorData = creatorDataList[index]?.data;

          // Try multiple sources for username with comprehensive fallbacks
          let username = null;
          if (creator.platform === 'Instagram') {
            username = creatorData?.user?.creator?.instagram
              || creator.submission.user?.creator?.instagram
              || creator.submission.user?.username
              || creator.submission.user?.name
              || creatorData?.user?.username
              || creatorData?.user?.name;
          } else {
            username = creatorData?.user?.creator?.tiktok
              || creator.submission.user?.creator?.tiktok
              || creator.submission.user?.username
              || creator.submission.user?.name
              || creatorData?.user?.username
              || creatorData?.user?.name;
          }

          const {platform} = creator;
          const {engagementRate} = creator;

          const barWidth = (engagementRate / maxEngagementRate) * 100;

          // Bar colors based on rank
          const barColors = ['#8E8E93', '#636366', '#48484A', '#3A3A3C', '#1C1C1E'];
          const barColor = barColors[index] || '#1C1C1E';

          return (
            <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* Username and platform icon */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Box
                  component="img"
                  src={platform === 'Instagram'
                    ? '/assets/Icon copy.svg'
                    : '/assets/Icon.svg'}
                  alt={platform === 'Instagram' ? 'Instagram' : 'TikTok'}
          sx={{
                    width: '11px',
                    height: '12px',
                    display: 'inline-block'
                  }}
                />
        <Link
                  href={creator.submission.postingLink || '#'}
          target="_blank"
                  rel="noopener noreferrer"
          sx={{
            textDecoration: 'none',
            '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Aileron',
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#636366',
                      lineHeight: '16px',
                      cursor: 'pointer',
                      '&:hover': {
                        color: '#1340FF'
                      }
                    }}
                  >
                    {username || 'Unknown'}
                  </Typography>
                </Link>
      </Box>

              {/* Progress bar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Box sx={{ flex: 1, maxWidth: '360px' }}>
                  <Box
            sx={{
                      height: '24px',
                      backgroundColor: barColor,
                      borderRadius: '12px',
                      position: 'relative',
                      width: `${barWidth}%`,
                      minWidth: '50px'
            }}
          />
      </Box>
                <Typography
                  sx={{
                    fontFamily: 'Aileron',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1340FF',
                    minWidth: '45px',
                    textAlign: 'right'
                  }}
                >
                  {engagementRate}%
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
      )}
    </Box>
  );
};

TopEngagementCard.propTypes = {
  filteredInsightsData: PropTypes.array.isRequired,
  filteredSubmissions: PropTypes.array.isRequired,
};

export default TopEngagementCard;
