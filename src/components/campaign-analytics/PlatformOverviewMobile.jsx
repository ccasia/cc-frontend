/* eslint-disable react/prop-types */
import React, { useMemo } from 'react';
import { PieChart } from '@mui/x-charts';
import { Box, Typography, Avatar, Link, Grid, Divider } from '@mui/material';

import Iconify from 'src/components/iconify';
import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';
import { formatNumber, calculateEngagementRate } from 'src/utils/socialMetricsCalculator';

const PlatformOverviewMobile = ({
  platformCounts,
  selectedPlatform,
  filteredInsightsData,
  filteredSubmissions,
  insightsData,
  summaryStats,
  availablePlatforms,
  getPlatformLabel,
}) => {
  // PostingsCard Component
  const PostingsCard = () => (
    <Box
      sx={{
        px: 3,
        py: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
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
          gap: 2,
          my: 2,
        }}
      >
        {/* Instagram Horizontal Beam */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Instagram Icon */}
          <Iconify
            icon="prime:instagram"
            sx={{
              width: 40,
              height: 40,
              color: '#C9C9C9',
              flexShrink: 0,
            }}
          />

          {/* Horizontal Beam */}
          <Box
            sx={{
              flex: 1,
              height: 30,
              backgroundColor: (() => {
                if (platformCounts.Instagram === 0) return '#F5F5F5';
                if (selectedPlatform === 'ALL') return '#1340FF';
                if (selectedPlatform === 'Instagram') return '#1340FF';
                return '#F5F5F5';
              })(),
              borderRadius: 100,
              transition: 'all 0.3s ease',
            }}
          />

          {/* Post count */}
          <Typography
            sx={{
              color: '#000',
              fontSize: 14,
              fontWeight: 500,
              minWidth: 30,
              textAlign: 'right',
            }}
          >
            {platformCounts.Instagram > 0 ? platformCounts.Instagram : ''}
          </Typography>
        </Box>

        {/* TikTok Horizontal Beam */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* TikTok Icon */}
          <Iconify
            icon="prime:tiktok"
            sx={{
              width: 40,
              height: 40,
              color: '#C9C9C9',
              flexShrink: 0,
            }}
          />

          {/* Horizontal Beam */}
          <Box
            sx={{
              flex: 1,
              height: 30,
              backgroundColor: (() => {
                if (platformCounts.TikTok === 0) return '#F5F5F5';
                if (selectedPlatform === 'ALL') return '#1340FF';
                if (selectedPlatform === 'TikTok') return '#1340FF';
                return '#F5F5F5';
              })(),
              borderRadius: 100,
              transition: 'all 0.3s ease',
            }}
          />

          {/* Post count */}
          <Typography
            sx={{
              color: '#000',
              fontSize: 14,
              fontWeight: 500,
              minWidth: 30,
              textAlign: 'right',
            }}
          >
            {platformCounts.TikTok > 0 ? platformCounts.TikTok : ''}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  // TopEngagementCard Component
  const TopEngagementCard = () => {
    // Find the creator with the highest engagement rate
    const topEngagementCreator = useMemo(() => {
      if (!filteredInsightsData || filteredInsightsData.length === 0) return null;

      let highestEngagement = -1;
      let topCreator = null;

      filteredInsightsData.forEach((insightData) => {
        const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
        if (submission) {
          const engagementRate = calculateEngagementRate(insightData.insight);
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
    }, []);

    const { data: creator } = useGetCreatorById(topEngagementCreator?.user);

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
  };

  return (
    <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
      {/* Postings Card */}
      <Box
        sx={{
          bgcolor: '#F5F5F5',
          borderRadius: 3,
          mb: 2,
          p: 2,
					boxShadow: '0px 4px 4px 0px #8E8E9340'
        }}
      >
        <PostingsCard />
      </Box>

      {/* Metrics Section - 4 column row */}
      <Box
        sx={{
					bgcolor: '#F5F5F5',
          borderRadius: 2,
          mb: 2,
          py: 2,
					px: 1,
          boxShadow: '0px 4px 4px 0px #8E8E9340'
        }}
      >
        <Grid container justifyContent="center">
          {/* Column 1: Engagement Rate */}
          <Grid item pl={1} xs={selectedPlatform === 'TikTok' ? 4 : 3} borderRight={'1px solid #C9C9C9'} >
            <Box>
              <Typography
                fontFamily="Instrument Serif"
                fontWeight={400}
                fontSize={{ xs: 32, sm: 40 }}
                color="#1340FF"
              >
                {summaryStats.avgEngagementRate}%
              </Typography>
              <Typography
                fontFamily="Aileron"
                fontWeight={600}
                fontSize={{ xs: 10, sm: 14 }}
                color="#636366"
              >
                Engagement
              </Typography>
            </Box>
          </Grid>

          {/* Column 2: Posts */}
          <Grid item pl={1} xs={selectedPlatform === 'TikTok' ? 4 : 3} borderRight={'1px solid #C9C9C9'}>
            <Box>
              <Typography
                fontFamily="Instrument Serif"
                fontWeight={400}
                fontSize={{ xs: 32, sm: 40 }}
                color="#1340FF"
              >
                {summaryStats.totalPosts}
              </Typography>
              <Typography
                fontFamily="Aileron"
                fontWeight={600}
                fontSize={{ xs: 10, sm: 14 }}
                color="#636366"
              >
                {availablePlatforms.length > 1 && getPlatformLabel(selectedPlatform)}
                {availablePlatforms.length < 2 &&
                  insightsData.length > 0 &&
                  `${insightsData[0].platform} Posts`}
              </Typography>
            </Box>
          </Grid>

          {/* Column 3: Shares */}
          <Grid item pl={1} xs={selectedPlatform === 'TikTok' ? 4 : 3} borderRight={selectedPlatform === 'TikTok' ? 'none' : '1px solid #C9C9C9'}>
            <Box>
              <Typography
                fontFamily="Instrument Serif"
                fontWeight={400}
                fontSize={{ xs: 32, sm: 40 }}
                color="#1340FF"
              >
                {summaryStats.totalShares}
              </Typography>
              <Typography
                fontFamily="Aileron"
                fontWeight={600}
                fontSize={{ xs: 10, sm: 14 }}
                color="#636366"
              >
                Shares
              </Typography>
            </Box>
          </Grid>

          {/* Column 4: Reach - Conditional */}
          {(selectedPlatform === 'ALL' || selectedPlatform === 'Instagram') && (
            <Grid pl={1} item xs={3}>
              <Box>
                <Typography
                  fontFamily="Instrument Serif"
                  fontWeight={400}
                  fontSize={{ xs: 32, sm: 40 }}
                  color="#1340FF"
                >
                  {formatNumber(summaryStats.totalReach)}
                </Typography>
                <Typography
                  fontFamily="Aileron"
                  fontWeight={600}
                  fontSize={{ xs: 10, sm: 14 }}
                  color="#636366"
                >
                  {selectedPlatform === 'ALL' ? 'Reach (Instagram)' : 'Reach'}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Engagement Breakdown Chart */}
      <Box
        sx={{
					boxShadow: '0px 4px 4px 0px #8E8E9340',
          bgcolor: '#F5F5F5',
          borderRadius: 3,
          mb: 2,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box sx={{ position: 'relative', mb: 2 }}>
          <PieChart
            height={250}
            width={250}
            margin={{ left: 30, right: 30, top: 30, bottom: 30 }}
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
                outerRadius: 110,
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
                fontSize: '12px',
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
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.2,
                color: '#000000',
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
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.2,
                color: '#000000',
              }}
            >
              Average
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.2,
                color: '#000000',
              }}
            >
              Interactions
            </Typography>
          </Box>
        </Box>

        {/* Legend */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 3,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {[
            { name: 'Likes', value: summaryStats.totalLikes, color: '#1340FF' },
            { name: 'Comments', value: summaryStats.totalComments, color: '#8A5AFE' },
            { name: 'Shares', value: summaryStats.totalShares, color: '#68A7ED' },
          ].map((item, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: item.color,
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#000',
                  lineHeight: 1.2,
                }}
              >
                {item.name}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right: Top Engagement Card */}
      {(selectedPlatform !== 'ALL' ||
        (availablePlatforms.length === 1 &&
          insightsData.length > 0 &&
          (insightsData[0].platform === 'Instagram' || insightsData[0].platform === 'TikTok'))) && (
        <Grid item xs={12} md={2.5} ml={2} alignContent="center" bgcolor="#F5F5F5" borderRadius={3}>
          <TopEngagementCard />
        </Grid>
      )}
    </Box>
  );
};

export default PlatformOverviewMobile;
