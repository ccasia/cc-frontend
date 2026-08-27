import React from 'react';
import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';

import { AnimatedNumber } from 'src/components/campaign-analytics';
import { formatNumber } from 'src/utils/socialMetricsCalculator';

const RenderEngagementCard = ({
  title,
  value,
  metricKey,
  filteredInsightsData,
  filteredSubmissions,
  findTopPerformerByMetric,
}) => {
  const topPerformer = findTopPerformerByMetric(
    metricKey,
    filteredInsightsData,
    filteredSubmissions
  );
  const { data: topCreator } = useGetCreatorById(topPerformer?.submission?.user);
  // For manual entries, use the creator name directly; for API entries, use the creator from the hook
  const creatorName = topPerformer?.manualEntry
    ? topPerformer.manualEntry.creatorName
    : topCreator?.user?.name || 'Unknown';
  const percentage = topPerformer && value > 0 ? Math.round((topPerformer.value / value) * 100) : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: 2,
        height: { xs: 100, sm: 116 },
        background: '#F5F5F5',
        boxShadow: '0px 4px 4px rgba(142, 142, 147, 0.25)',
        borderRadius: '20px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            height: { xs: 70, sm: 85 },
            minWidth: 0,
            mr: 1,
          }}
        >
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: { xs: 16, sm: 18 },
              color: '#636366',
              maxWidth: { xs: 70, sm: 120, md: 200 },
            }}
          >
            {title}
          </Typography>

          {topPerformer && (
            <Box>
              <Typography
                fontSize={{ xs: 12, sm: 14 }}
                component="span"
                color="#1340FF"
                fontWeight={600}
              >
                {percentage}%{' '}
                <Typography fontSize={{ xs: 12, sm: 14 }} color="#000" component="span">
                  from
                </Typography>
              </Typography>
              <Typography
                fontSize={{ xs: 12, sm: 14 }}
                color="#000"
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: { xs: 85, sm: 120, md: 140 },
                  display: 'block',
                }}
              >
                {creatorName}
              </Typography>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: { xs: 60, sm: 70, md: 79 },
            height: { xs: 60, sm: 70, md: 79 },
            background: '#1340FF',
            borderRadius: '8px',
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: { xs: 16, sm: 20, md: 24 },
              color: '#FFFFFF',
            }}
          >
            {typeof value === 'number' ? (
              <AnimatedNumber value={value} formatFn={formatNumber} />
            ) : (
              value
            )}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default RenderEngagementCard;

RenderEngagementCard.propTypes = {
  title: PropTypes.string,
  value: PropTypes.string,
  metricKey: PropTypes.string,
  filteredInsightsData: PropTypes.string,
  filteredSubmissions: PropTypes.string,
  findTopPerformerByMetric: PropTypes.string,
};
