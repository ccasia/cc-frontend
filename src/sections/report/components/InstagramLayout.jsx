import { Box, Grid, Card, Typography } from '@mui/material';
import { ContentInfoHeader, StatsLegend } from './shared-components';

const InstagramLayout = ({ content, renderEngagementCard, renderCircularStat }) => {
  return (
    <Grid container spacing={3}>
      {/* Content Image and Caption */}
      <Grid item xs={12} md={5}>
        <Card
          sx={{
            borderRadius: 0,
            overflow: 'hidden',
            height: 'auto',
            boxShadow: 'none',
            border: '1px solid #eee',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            component="img"
            src={content.mediaUrl}
            alt={content.videoData.caption || 'Content'}
            sx={{
              width: '100%',
              height: 623,
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid #eee',
            }}
          >
            <Typography
              sx={{
                fontSize: 14,
                color: '#333',
                mb: 0,
                lineHeight: 1.4,
              }}
            >
              {content.videoData.caption || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.'}
            </Typography>
          </Box>
        </Card>
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
              gridTemplateRows: {
                xs: 'repeat(4, 1fr)',
                sm: '1fr 1fr',
                md: '1fr 1fr',
              },
              gap: '28px',
            }}
          >
            {renderEngagementCard({
              icon: 'mdi:eye-outline',
              title: 'Views',
              value: content.metrics?.views || 0,
              metricKey: 'views'
            })}

            {renderEngagementCard({
              icon: 'mdi:heart-outline',
              title: 'Likes',
              value: content.metrics?.likes || 0,
              metricKey: 'likes'
            })}

            {renderEngagementCard({
              icon: 'mdi:comment-outline',
              title: 'Comments',
              value: content.metrics?.comments || 0,
              metricKey: 'comments'
            })}

            {renderEngagementCard({
              icon: 'mdi:bookmark-outline',
              title: 'Saved',
              value: content.metrics?.saved || 0,
              metricKey: 'saved'
            })}
          </Box>
        </Box>

        {/* Circular Stats with Campaign Averages */}
        <Grid container spacing={4} sx={{ py: 1 }}>
          <Grid item xs={12} md={4}>
            {renderCircularStat({
              width: '75%',
              label: 'Interactions',
              value: content.metrics?.total_interactions || 0,
              metricKey: 'totalInteractions'
            })}
          </Grid>
          
          <Grid item xs={12} md={4}>
            {renderCircularStat({
              width: '75%',
              label: 'Reach',
              value: content.metrics?.reach || 0,
              metricKey: 'reach'
            })}
          </Grid>

          <Grid item xs={12} md={4}>
            {renderCircularStat({
              width: '75%',
              label: 'Shares',
              value: content.metrics?.shares || 0,
              metricKey: 'shares'
            })}
          </Grid>
        </Grid>

        <StatsLegend />
      </Grid>
    </Grid>
  );
};

export default InstagramLayout;