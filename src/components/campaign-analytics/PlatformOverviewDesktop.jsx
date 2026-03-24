/* eslint-disable react/prop-types */
import React from 'react';

import { PieChart } from '@mui/x-charts';
import { Box, Grid, Link, Avatar, Typography } from '@mui/material';

import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';

import { formatNumber, calculateEngagementRate } from 'src/utils/socialMetricsCalculator';


// PostingsCard extracted
function PostingsCard({ platformCounts, selectedPlatform }) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        px: 3,
        py: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Typography
        textAlign="left"
        variant="h4"
        fontWeight={600}
        gutterBottom
        fontFamily="Aileron"
        color="#231F20"
      >
        Postings
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          my: 2,
        }}
      >
        {/* Dual Platform Beam Display */}
        <Box sx={{ display: 'flex', gap: 4, mb: 2, alignItems: 'flex-end' }}>
          {/* Instagram Beam */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Post count above beam */}
            <Typography
              variant="h6"
              sx={{
                color: '#1340FF',
                fontSize: '1.25rem',
                fontWeight: 600,
                mb: 1,
                minHeight: '1.5rem',
              }}
            >
              {platformCounts.Instagram > 0 ? platformCounts.Instagram : ''}
            </Typography>
            <Box
              sx={{
                width: 54,
                height: (() => {
                  const maxCount = Math.max(platformCounts.Instagram, platformCounts.TikTok);
                  const minHeight = 10;
                  const maxHeight = 170;
                  if (maxCount === 0) return minHeight;
                  return (
                    minHeight + (platformCounts.Instagram / maxCount) * (maxHeight - minHeight)
                  );
                })(),
                backgroundColor: (() => {
                  if (platformCounts.Instagram === 0) return '#F5F5F5';
                  if (selectedPlatform === 'ALL') return '#1340FF';
                  if (selectedPlatform === 'Instagram') return '#1340FF';
                  return '#F5F5F5';
                })(),
                border: '1px solid #1340FF',
                borderRadius: 100,
                mb: 1,
                transition: 'all 0.3s ease',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: '#1340FF',
                fontSize: 16,
                fontWeight: 200,
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              Instagram
            </Typography>
          </Box>
          {/* TikTok Beam */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography
              variant="h6"
              sx={{
                color: '#1340FF',
                fontSize: '1.25rem',
                fontWeight: 600,
                mb: 1,
                minHeight: '1.5rem',
              }}
            >
              {platformCounts.TikTok > 0 ? platformCounts.TikTok : ''}
            </Typography>
            <Box
              sx={{
                width: 54,
                height: (() => {
                  const maxCount = Math.max(platformCounts.Instagram, platformCounts.TikTok);
                  const minHeight = 10;
                  const maxHeight = 170;
                  if (maxCount === 0) return minHeight;
                  return minHeight + (platformCounts.TikTok / maxCount) * (maxHeight - minHeight);
                })(),
                backgroundColor: (() => {
                  if (platformCounts.TikTok === 0) return '#F5F5F5';
                  if (selectedPlatform === 'ALL') return '#1340FF';
                  if (selectedPlatform === 'TikTok') return '#1340FF';
                  return '#F5F5F5';
                })(),
                border: '1px solid #1340FF',
                borderRadius: 100,
                mb: 1,
                transition: 'all 0.3s ease',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: '#1340FF',
                fontSize: 16,
                fontWeight: 200,
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              TikTok
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// TopEngagementCard extracted
function TopEngagementCard({ filteredInsightsData, filteredSubmissions, getCreatorById, engagementRateCalc }) {
  const topEngagementCreator = React.useMemo(() => {
    if (!filteredInsightsData || filteredInsightsData.length === 0) return null;
    let highestEngagement = -1;
    let topCreator = null;
    filteredInsightsData.forEach((insightData) => {
      const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
      if (submission) {
        const engagementRate = engagementRateCalc(insightData.insight);
        if (engagementRate > highestEngagement) {
          highestEngagement = engagementRate;
          topCreator = {
            ...submission,
            engagementRate,
            insightData,
          };
        }
      }
    });
    return topCreator;
  }, [filteredInsightsData, filteredSubmissions, engagementRateCalc]);
  const { data: creator } = getCreatorById(topEngagementCreator?.user);
  if (!topEngagementCreator) return null;
  return (
    <Box
      borderRadius={3}
      sx={{
        height: '400px',
        width: '100%',
        maxWidth: '100%',
        overflow: 'auto',
        boxSizing: 'border-box',
        backgroundColor: '#F5F5F5',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <Typography variant="h6" fontWeight={600} fontFamily="Aileron" color="#231F20">
        Top Engagement
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Typography
          fontFamily="Instrument Serif"
          fontWeight={400}
          fontSize={55}
          color="#1340FF"
          textAlign="center"
        >
          {topEngagementCreator.engagementRate}%
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 45,
              height: 45,
              bgcolor:
                topEngagementCreator && topEngagementCreator.platform === 'Instagram'
                  ? '#E4405F'
                  : '#000000',
              mr: 1,
            }}
          >
            {creator?.user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Box
            sx={{
              height: 40,
              maxWidth: 100,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography
              fontSize={14}
              fontWeight={600}
              color="#231F20"
              sx={{ textAlign: 'left' }}
              noWrap
              textOverflow="ellipsis"
              overflow="hidden"
            >
              {creator?.user?.name}
            </Typography>
            <Typography fontSize={12} color="#636366" sx={{ textAlign: 'left' }}>
              {creator?.user?.creator?.instagram || creator?.user?.creator?.tiktok || ''}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ alignSelf: 'center' }}>
        <Link
          href={topEngagementCreator.insightData.postUrl}
          target="_blank"
          rel="noopener"
          sx={{
            display: 'block',
            textDecoration: 'none',
            '&:hover': {
              opacity: 0.8,
              transition: 'opacity 0.2s',
            },
          }}
        >
          <Box
            component="img"
            src={
              topEngagementCreator.insightData.thumbnail ||
              topEngagementCreator.insightData.video?.media_url
            }
            alt="Top performing post"
            sx={{
              width: 290,
              height: 180,
              mt: 2,
              borderRadius: 2,
              objectFit: 'cover',
              objectPosition: 'left top',
              border: '1px solid #e0e0e0',
            }}
          />
        </Link>
      </Box>
    </Box>
  );
}

const PlatformOverviewDesktop = ({
  platformCounts,
  selectedPlatform,
  summaryStats,
  availablePlatforms,
  filteredInsightsData,
  filteredSubmissions,
  insightsData,
  getPlatformLabel,
}) => (
    <Grid
      container
      justifyContent="center"
      height={400}
      sx={{ display: { xs: 'none', md: 'flex' } }}
    >
      {/* Left Condition: Platform Overview Card */}
      {availablePlatforms.length > 1 && selectedPlatform === 'ALL' && (
        <Grid item xs={12} md={2.5} alignContent="center" bgcolor="#F5F5F5" borderRadius={3} mr={2}>
          <PostingsCard platformCounts={platformCounts} selectedPlatform={selectedPlatform} />
        </Grid>
      )}

      {/* Left: Engagement Breakdown Chart */}
      <Grid item xs={12} md={5} mr={2} alignContent="center" bgcolor="#F5F5F5" borderRadius={3}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <PieChart
              height={300}
              width={300}
              margin={{ left: 50, right: 50, top: 50, bottom: 50 }}
              series={[
                {
                  data: [
                    { id: 0, value: summaryStats.totalLikes, label: 'Likes', color: '#1340FF' },
                    {
                      id: 1,
                      value: summaryStats.totalComments,
                      label: 'Comments',
                      color: '#8A5AFE',
                    },
                    {
                      id: 2,
                      value: summaryStats.totalShares,
                      label: 'Shares',
                      color: '#68A7ED',
                    },
                  ],
                  innerRadius: 60,
                  outerRadius: 120,
                  arcLabel: (params) => params.value,
                  arcLabelMinAngle: 20,
                  valueFormatter: (value) => formatNumber(value.value),
                },
              ]}
              sx={{
                '& .MuiChartsLegend-root': {
                  display: 'none',
                },
                '& .MuiPieArcLabel-root': {
                  fontWeight: '600',
                  fill: 'white',
                  fontFamily: 'Aileron',
                },
                '& .MuiPieArc-root': {
                  stroke: 'none',
                },
              }}
            />

            {/* Center Text Overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: '48%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#000000',
                  lineHeight: 1,
                }}
              >
                {formatNumber(
                  Math.round(
                    summaryStats.totalLikes + summaryStats.totalComments + summaryStats.totalShares
                  )
                )}
              </Typography>
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#000000',
                  fontFamily: 'Aileron',
                  lineHeight: 1,
                }}
              >
                Average
              </Typography>
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#000000',
                  fontFamily: 'Aileron',
                  lineHeight: 1,
                }}
              >
                Interactions
              </Typography>
            </Box>
          </Box>

          {/* Right Side: Legend with Color Indicators */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mr: 3,
            }}
          >
            {[
              { name: 'Likes', value: summaryStats.totalLikes, color: '#1340FF' },
              { name: 'Comments', value: summaryStats.totalComments, color: '#8A5AFE' },
              { name: 'Shares', value: summaryStats.totalShares, color: '#68A7ED' },
            ].map((item, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Color indicator circle */}
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    flexShrink: 0,
                  }}
                />
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: '#000',
                      lineHeight: 1.2,
                      mr: 5,
                    }}
                  >
                    {item.name}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Grid>

      {/* Middle: Platform-specific metrics */}
      <Grid item xs={12} md={4} alignContent="center" bgcolor="#F5F5F5" borderRadius={3}>
        <Box
          sx={{
            backgroundColor: '#F5F5F5',
            borderRadius: 3,
          }}
        >
          {summaryStats && (
            <Grid
              container
              sx={{ mt: { xs: 0 } }}
              justifyContent="center"
              columnGap={2}
              padding={2}
              mb={2}
            >
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography
                    fontFamily="Instrument Serif"
                    fontWeight={400}
                    fontSize={55}
                    color="#1340FF"
                  >
                    {summaryStats.totalPosts}
                  </Typography>
                  <Typography fontFamily="Aileron" fontWeight={600} fontSize={18} color="#1340FF">
                    {availablePlatforms.length > 1 && getPlatformLabel(selectedPlatform)}
                    {availablePlatforms.length < 2 &&
                      insightsData.length > 0 &&
                      `${insightsData[0].platform} Posts`}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={5}>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography
                    fontFamily="Instrument Serif"
                    fontWeight={400}
                    fontSize={55}
                    color="#1340FF"
                  >
                    {selectedPlatform === 'TikTok' ? 'TBD' : formatNumber(summaryStats.totalReach)}
                  </Typography>
                  <Typography fontFamily="Aileron" fontWeight={600} fontSize={18} color="#1340FF">
                    {selectedPlatform === 'ALL' && (
                      <Typography fontSize={18} fontFamily="Aileron" fontWeight={600}>
                        Reach
                        <Typography fontFamily="Aileron" fontSize={12} fontWeight={600}>
                          (Instagram only)
                        </Typography>
                      </Typography>
                    )}
                    {selectedPlatform === 'TikTok' && 'TBD'}
                    {selectedPlatform === 'Instagram' && 'Reach'}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} mt={2} mb={2}>
                <Box sx={{ borderBottom: '2px solid #1340FF' }} />
              </Grid>

              <Grid item xs={5} mt={2} mb={2}>
                <Box sx={{ borderBottom: '2px solid #1340FF' }} />
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography
                    fontFamily="Instrument Serif"
                    fontWeight={400}
                    fontSize={55}
                    color="#1340FF"
                  >
                    {summaryStats.avgEngagementRate}%
                  </Typography>
                  <Typography fontFamily="Aileron" fontWeight={600} fontSize={18} color="#1340FF">
                    Engagement Rate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={5}>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography
                    fontFamily="Instrument Serif"
                    fontWeight={400}
                    fontSize={55}
                    color="#1340FF"
                  >
                    {summaryStats.totalShares}
                  </Typography>
                  <Typography fontFamily="Aileron" fontWeight={600} fontSize={18} color="#1340FF">
                    Total Shares
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>
      </Grid>

      {/* Right: Top Engagement Card */}
      {(selectedPlatform !== 'ALL' ||
        (availablePlatforms.length === 1 &&
          insightsData.length > 0 &&
          (insightsData[0].platform === 'Instagram' || insightsData[0].platform === 'TikTok'))) && (
        <Grid item xs={12} md={2.5} ml={2} alignContent="center" bgcolor="#F5F5F5" borderRadius={3}>
          <TopEngagementCard
            filteredInsightsData={filteredInsightsData}
            filteredSubmissions={filteredSubmissions}
            getCreatorById={useGetCreatorById}
            engagementRateCalc={calculateEngagementRate}
          />
        </Grid>
      )}
    </Grid>
  );

export default PlatformOverviewDesktop;
