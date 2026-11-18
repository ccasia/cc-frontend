import PropTypes from 'prop-types';

import { Box, Stack, Divider, Tooltip, Typography } from '@mui/material';

import { formatNumber } from 'src/utils/media-kit-utils';
import { metricLabel, formatPrimaryMetric, isRecentViewsPlatform } from 'src/utils/platform-metric';

const ICONS = {
  followers: '/assets/icons/overview/purpleGroup.svg',
  metric: '/assets/icons/overview/greenChart.svg',
};

function SnapshotStat({ icon, value, fullValue, caption }) {
  return (
    <Stack spacing={0.5} alignItems="flex-end" sx={{ minWidth: 80 }}>
      <Box component="img" src={icon} alt="" sx={{ width: 20, height: 20 }} />
      <Tooltip title={fullValue ?? ''} arrow placement="top">
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '14px' }}>
          {value}
        </Typography>
      </Tooltip>
      <Typography
        variant="caption"
        sx={{ color: '#8e8e93', whiteSpace: 'nowrap', fontWeight: 500, fontSize: '12px' }}
      >
        {caption}
      </Typography>
    </Stack>
  );
}

SnapshotStat.propTypes = {
  icon: PropTypes.string,
  value: PropTypes.string,
  fullValue: PropTypes.string,
  caption: PropTypes.string,
};

/** The numbers saved on the pitch, for a creator with no connected account (guests included). */
export default function PitchSnapshotStats({ platform, followerCount, metric }) {
  const followers = Number(followerCount);
  const hasFollowers = Number.isFinite(followers) && followers > 0;
  const metricText = formatPrimaryMetric(platform, metric, { compact: true });

  if (!hasFollowers && !metricText) return null;

  return (
    <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 2 }}>
      <SnapshotStat
        icon={ICONS.followers}
        value={hasFollowers ? formatNumber(followers) : '—'}
        fullValue={hasFollowers ? followers.toLocaleString('en-US') : undefined}
        caption="Followers"
      />
      <Divider orientation="vertical" flexItem />
      <SnapshotStat
        icon={ICONS.metric}
        value={metricText ?? '—'}
        fullValue={
          isRecentViewsPlatform(platform) ? formatPrimaryMetric(platform, metric) : undefined
        }
        caption={metricLabel(platform)}
      />
    </Stack>
  );
}

PitchSnapshotStats.propTypes = {
  platform: PropTypes.string,
  followerCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  metric: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
