/* eslint-disable react/prop-types */
// components/reporting/TikTokLayout.jsx
// components/reporting/TikTokLayout.jsx
import { Box, Grid, Typography } from '@mui/material';

import { StatsLegend, ContentImageCard, ContentInfoHeader } from './shared-components';

const TikTokLayout = ({ height, content, renderEngagementCard, renderCircularStat }) => (
  <Grid container spacing={3}>
    {/* Content Image and Caption */}
    <Grid item xs={12} md={5}>
      <ContentImageCard content={content} />
    </Grid>

    {/* Right side content */}
    <Grid item xs={12} md={7}>
      {/* Account, Content Type, Date Posted Row */}
      <ContentInfoHeader content={content} />

      {/* Content Engagement Section - TikTok Layout (3 cards in column, interactions and shares on right) */}
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
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            alignContent: 'center',
          }}
        >
          {/* Left column: Engagement cards */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: '16px', sm: '20px' },
              justifyContent: 'space-between',
              pr: 2,
            }}
          >
            {renderEngagementCard({
              height: 130,
              icon: 'mdi:eye-outline',
              title: 'Views',
              value: content.metrics?.views || 0,
              metricKey: 'views',
              color: '#D3D3D3',
            })}

            {renderEngagementCard({
              height: 130,
              icon: 'mdi:heart-outline',
              title: 'Likes',
              value: content.metrics?.likes || 0,
              metricKey: 'likes',
              color: '#E7E7E7',
            })}

            {renderEngagementCard({
              height: 130,
              icon: 'mdi:comment-outline',
              title: 'Comments',
              value: content.metrics?.comments || 0,
              metricKey: 'comments',
              color: '#F5F5F5',
            })}
          </Box>

          {/* Right column: Circular stats */}
          <Box
            sx={{
              mt: { xs: 4, sm: 0 },
            }}
          >
            <Box
              sx={{
                overflowX: { xs: 'auto', md: 'visible' },
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 4, md: 0 },
                  flexDirection: { xs: 'row', md: 'column' },
                  minWidth: { xs: 'min-content', md: 'auto' },
                }}
              >
                {renderCircularStat({
                  label: 'Interactions',
                  value: content.metrics?.total_interactions || 0,
                  metricKey: 'totalInteractions',
                })}

                {renderCircularStat({
                  label: 'Shares',
                  value: content.metrics?.shares || 0,
                  metricKey: 'shares',
                })}
              </Box>
            </Box>

            <StatsLegend />
          </Box>
        </Box>
      </Box>

      {/* Circular Stats - Only Interactions and Shares for TikTok */}

      {/* Legend */}
    </Grid>
  </Grid>
);

export default TikTokLayout;
