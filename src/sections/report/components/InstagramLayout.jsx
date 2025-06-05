import { Box, Grid, Card, Typography, Divider, CircularProgress } from '@mui/material';
import { width } from '@mui/system';
import Iconify from 'src/components/iconify';
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
        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontSize: { xs: 20, sm: 24 },
              fontWeight: 600,
              mb: 3,
            }}
          >
            Content Engagement
          </Typography>

          <Box
            sx={{
              height: 'auto',
              width: '95%',
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
              gap: { xs: '16px', sm: '28px' },
            }}
          >
            {renderEngagementCard({
              icon: 'mdi:eye-outline',
              title: 'Views',
              value: content.metrics?.views || 0,
            })}

            {renderEngagementCard({
              icon: 'mdi:heart-outline',
              title: 'Likes',
              value: content.metrics?.likes || 0,
            })}

            {renderEngagementCard({
              icon: 'mdi:comment-outline',
              title: 'Comments',
              value: content.metrics?.comments || 0,
            })}

            {renderEngagementCard({
              icon: 'mdi:bookmark-outline',
              title: 'Saved',
              value: content.metrics?.saved || 0,
            })}
          </Box>
        </Box>

        {/* Circular Stats */}
        <Grid container spacing={4} sx={{ py: 2 }}>
          <Grid item xs={12} md={4}>
            {renderCircularStat({
              width: '75%',
              label: 'Interactions',
              value: content.metrics?.total_interactions || 0,
              averageValue: 300,
              isAboveAverage: (content.metrics?.total_interactions || 0) > 110,
              percentageDiff: 24,
            })}
          </Grid>
          
          <Grid item xs={12} md={4}>
            {renderCircularStat({
              width: '75%',
              label: 'Reach',
              value: content.metrics?.reach || 0,
              averageValue: 8000,
              isAboveAverage: (content.metrics?.reach || 0) > 100,
              percentageDiff: 11,
            })}
          </Grid>

          <Grid item xs={12} md={4}>
            {renderCircularStat({
              width: '75%',
              label: 'Shares',
              value: content.metrics?.shares || 0,
              averageValue: 100,
              isAboveAverage: (content.metrics?.shares || 0) > 30,
              percentageDiff: 85,
            })}
          </Grid>
        </Grid>

        {/* Legend */}
        <StatsLegend />
      </Grid>
    </Grid>
  );
};

export default InstagramLayout;