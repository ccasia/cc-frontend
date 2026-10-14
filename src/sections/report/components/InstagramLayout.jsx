/* eslint-disable react/prop-types */
import dayjs from 'dayjs';

import { Box, Grid, Typography } from '@mui/material';

import { PostViewsLineChart } from './PostViewsLineChart';
import { PostEngagementRateHeatmap } from './PostEngagementRateHeatmap';
import { StatsLegend, ContentImageCard, ContentInfoHeader } from './shared-components';

const percentChange = (current, average) => {
  const change = average > 0 ? ((current - average) / average) * 100 : 0;
  return {
    changeText: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`,
    isAboveAverage: change > 0,
  };
};

// Rates that public scrape data can still give, to replace the private saves, shares and reach
const readPublicRates = (content) => {
  const { views = 0, total_interactions: interactions = 0 } = content.metrics || {};
  const averages = content.campaignAverages;
  const rate = views ? (interactions / views) * 100 : 0;
  const averageRate = averages?.views ? (averages.totalInteractions / averages.views) * 100 : 0;
  const daysLive = Math.max(
    1,
    dayjs(content.capturedAt || undefined).diff(dayjs(content.videoData?.timestamp), 'day')
  );

  return {
    rate,
    rateComparison: averageRate ? percentChange(rate, averageRate) : undefined,
    daysLive,
    dailyViews: Math.round(views / daysLive),
  };
};

const InstagramLayout = ({ content, renderEngagementCard, renderCircularStat }) => {
  // Scrapes cannot see saves, shares or reach, so only connected accounts get the circle row
  const isScraped = content.source === 'brightdata';
  const publicRates = isScraped ? readPublicRates(content) : null;

  return (
    <Grid container spacing={3}>
      {/* Content Image and Caption */}
      <Grid item xs={12} md={5}>
        <ContentImageCard content={content} />
      </Grid>

      {/* Right side content */}
      <Grid item xs={12} md={7}>
        {/* Account, Content Type, Date Posted Row */}
        <ContentInfoHeader content={content} />

        {/* Content Engagement Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: { xs: 20, sm: 24 },
              fontWeight: 600,
              mb: 2,
            }}
          >
            Content Engagement
          </Typography>

          <Box
            sx={{
              height: 'auto',
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr',
              },
              gridAutoRows: '1fr',
              gap: 3,
            }}
          >
            {renderEngagementCard({
              icon: 'mdi:eye-outline',
              title: 'Views',
              value: content.metrics?.views || 0,
              metricKey: 'views',
            })}

            {renderEngagementCard({
              icon: 'mdi:heart-outline',
              title: 'Likes',
              value: content.metrics?.likes || 0,
              metricKey: 'likes',
            })}

            {renderEngagementCard({
              icon: 'mdi:comment-outline',
              title: 'Comments',
              value: content.metrics?.comments || 0,
              metricKey: 'comments',
            })}

            {isScraped
              ? renderEngagementCard({
                  icon: 'mdi:gesture-tap',
                  title: 'Interactions',
                  value: content.metrics?.total_interactions || 0,
                  metricKey: 'totalInteractions',
                })
              : renderEngagementCard({
                  icon: 'mdi:bookmark-outline',
                  title: 'Saved',
                  value: content.metrics?.saved || 0,
                  metricKey: 'saved',
                })}

            {isScraped &&
              renderEngagementCard({
                title: 'Engagement Rate',
                value: `${publicRates.rate.toFixed(1)}%`,
                metricKey: 'engagementRate',
                comparison: publicRates.rateComparison,
              })}

            {isScraped &&
              renderEngagementCard({
                title: 'Avg Daily Views',
                value: publicRates.dailyViews,
                metricKey: 'dailyViews',
                caption: `over ${publicRates.daysLive} ${publicRates.daysLive === 1 ? 'day' : 'days'} live`,
              })}
          </Box>
        </Box>

        {/* Circular Stats with Campaign Averages */}
        {!isScraped && (
          <>
            <Box sx={{ overflowX: 'auto', display: { sm: 'flex' }, justifyContent: 'center' }}>
              <Box sx={{ minWidth: 'min-content' }}>
                <Grid container spacing={4} sx={{ width: { xs: 'max-content', sm: 'auto' } }}>
                  <Grid item xs={4} md={4}>
                    {renderCircularStat({
                      width: '75%',
                      label: 'Interactions',
                      value: content.metrics?.total_interactions || 0,
                      metricKey: 'totalInteractions',
                    })}
                  </Grid>

                  <Grid item xs={4} md={4}>
                    {renderCircularStat({
                      width: '75%',
                      label: 'Reach',
                      value: content.metrics?.reach || 0,
                      metricKey: 'reach',
                    })}
                  </Grid>

                  <Grid item xs={4} md={4}>
                    {renderCircularStat({
                      width: '75%',
                      label: 'Shares',
                      value: content.metrics?.shares || 0,
                      metricKey: 'shares',
                    })}
                  </Grid>
                </Grid>
              </Box>
            </Box>

            <StatsLegend />
          </>
        )}
      </Grid>

      {/* Per-post daily trend section — heatmap + line chart, side-by-side */}
      {content.campaignId && content.pathname && (
        <Grid item xs={12}>
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <PostEngagementRateHeatmap
                  campaignId={content.campaignId}
                  postUrl={content.pathname}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <PostViewsLineChart campaignId={content.campaignId} postUrl={content.pathname} />
              </Grid>
            </Grid>
          </Box>
        </Grid>
      )}
    </Grid>
  );
};

export default InstagramLayout;
