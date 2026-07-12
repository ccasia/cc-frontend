import { useMemo } from 'react';
import PropTypes from 'prop-types';

import { Box, Link, Typography } from '@mui/material';

import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';

import { getMetricValue } from 'src/utils/socialMetricsCalculator';

const TopCreatorViewsChart = ({ filteredInsightsData, filteredSubmissions }) => {
  // Calculate top 5 creators by total views
  const top5Creators = useMemo(() => {
    const creatorsWithViews = [];

    filteredInsightsData.forEach((insightData) => {
      const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
      if (submission) {
        const views = getMetricValue(insightData.insight, 'views');
        if (views > 0) {
          creatorsWithViews.push({
            submission,
            insightData,
            views,
            platform: insightData.platform || submission.platform || 'Unknown'
          });
        }
      }
    });

    // Sort by views and take top 5
    return creatorsWithViews
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [filteredInsightsData, filteredSubmissions]);

  // Get creator data for top 5
  const creatorIds = top5Creators.map(c => c.submission.user);

  // Call hooks for each creator ID (up to 5 creators)
  const viewsCreator0Data = useGetCreatorById(creatorIds[0] || null);
  const viewsCreator1Data = useGetCreatorById(creatorIds[1] || null);
  const viewsCreator2Data = useGetCreatorById(creatorIds[2] || null);
  const viewsCreator3Data = useGetCreatorById(creatorIds[3] || null);
  const viewsCreator4Data = useGetCreatorById(creatorIds[4] || null);

  const creatorDataList = [viewsCreator0Data, viewsCreator1Data, viewsCreator2Data, viewsCreator3Data, viewsCreator4Data]
    .slice(0, creatorIds.length);

  if (top5Creators.length === 0) {
    return (
      <Box sx={{
        padding: '24px',
        bgcolor: '#F5F5F7',
        borderRadius: '12px',
        height: '100%',
          display: 'flex',
          alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography sx={{
          fontFamily: 'Aileron',
          fontSize: '14px',
          color: '#9CA3AF',
          fontStyle: 'italic'
        }}>
          No view data available
        </Typography>
      </Box>
    );
  }

  // Find max views for bar width calculation
  const maxViews = Math.max(...top5Creators.map(c => c.views));

  return (
    <Box sx={{
      padding: '24px',
      bgcolor: '#F5F5F7',
      borderRadius: '12px',
      height: '100%'
    }}>
      <Typography sx={{
        fontFamily: 'Aileron',
        fontWeight: 600,
        fontSize: '20px',
        lineHeight: '24px',
        color: '#000000',
        mb: 3
      }}>
        Top 5 Creator Total Views
      </Typography>

      {/* Bar Chart */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', mt: 1 }}>
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

          // Gradient colors from darkest to lightest purple
          const barColors = ['#8A5AFE', '#9D75FE', '#B090FE', '#C3ABFE', '#D6C6FE'];
          const barColor = barColors[index] || '#D6C6FE';

          return (
            <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Platform Icon and Username on top */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Box
                  component="img"
                  src={creator.platform === 'Instagram'
                    ? '/assets/Icon copy.svg'
                    : '/assets/Icon.svg'}
                  alt={creator.platform === 'Instagram' ? 'Instagram' : 'TikTok'}
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
                  <Typography sx={{
                    fontFamily: 'Aileron',
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#636366',
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#1340FF'
                    }
                  }}>
                    {username || 'Unknown'}
      </Typography>
                </Link>
              </Box>

              {/* Progress bar and value on bottom */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Box sx={{ flex: 1, maxWidth: '360px' }}>
                  <Box sx={{
                    height: '32px',
                    backgroundColor: barColor,
                    borderRadius: '16px',
                    position: 'relative',
                    width: `${(creator.views / maxViews) * 100}%`,
                    minWidth: '60px',
                    transition: 'width 0.3s ease'
                  }} />
                </Box>
                <Typography sx={{
                  fontFamily: 'Aileron',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#1340FF',
                  minWidth: '50px',
                  textAlign: 'right'
                }}>
                  {creator.views >= 1000 ? `${(creator.views / 1000).toFixed(0)}K` : creator.views}
        </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

TopCreatorViewsChart.propTypes = {
  filteredInsightsData: PropTypes.array.isRequired,
  filteredSubmissions: PropTypes.array.isRequired,
};

export default TopCreatorViewsChart;
