import PropTypes from 'prop-types';

import { Box, Stack, ButtonBase, Typography } from '@mui/material';

import { BLUE, delta, formatRate, compactNumber } from './stages';
import { goToTab, OverviewCard, tabularNums } from './parts';

export default function PerformanceCard({ performance }) {
  const previous = performance?.previous;
  const er = performance?.engagementRate;

  const metrics = [
    {
      label: 'Views',
      value: compactNumber(performance?.views),
      change: delta(performance?.views, previous?.views),
    },
    {
      label: 'Likes',
      value: compactNumber(performance?.likes),
      change: delta(performance?.likes, previous?.likes),
    },
    {
      label: 'Comments',
      value: compactNumber(performance?.comments),
      change: delta(performance?.comments, previous?.comments),
    },
    {
      label: 'Engagement',
      value: formatRate(er),
      change: delta(er, previous?.engagementRate),
    },
  ];

  return (
    <OverviewCard
      title="Performance"
      aside={
        <ButtonBase
          onClick={() => goToTab('analytics')}
          sx={{ fontSize: 12.5, fontWeight: 500, color: BLUE, borderRadius: 0.5 }}
        >
          View analytics →
        </ButtonBase>
      }
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 2.5 }}>
        {metrics.map((m) => (
          <Box key={m.label}>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{m.label}</Typography>
            <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ mt: 0.5 }}>
              <Typography sx={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2, ...tabularNums }}>
                {m.value}
              </Typography>
              {m.change != null && (
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: m.change >= 0 ? 'success.dark' : 'error.dark',
                    ...tabularNums,
                  }}
                >
                  {m.change >= 0 ? '+' : ''}
                  {m.change}%
                </Typography>
              )}
            </Stack>
          </Box>
        ))}
      </Box>
    </OverviewCard>
  );
}

PerformanceCard.propTypes = {
  performance: PropTypes.shape({
    views: PropTypes.number,
    likes: PropTypes.number,
    comments: PropTypes.number,
    engagementRate: PropTypes.number,
    previous: PropTypes.object,
  }),
};
