import PropTypes from 'prop-types';

import { LoadingButton } from '@mui/lab';
import { Box, Stack, Divider, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';
import {
  PRIMARY_ACTION_SX,
  SECONDARY_ACTION_SX,
} from 'src/components/campaign/action-button-styles';

import NewNumber, { NUMBER_FONT_SX } from './new-number';
import useMetricsReview, { formatCount, lowerMetrics } from './use-metrics-review';

const NUMBER_SX = { ...NUMBER_FONT_SX, fontSize: 22, lineHeight: '24px' };

const small = (sx) => ({ ...sx, height: 32, fontSize: 13, padding: '6px 12px 9px' });
const USE_SX = small(PRIMARY_ACTION_SX);
const KEEP_SX = small(SECONDARY_ACTION_SX);

const uploaderName = (uploadedBy) => {
  if (!uploadedBy) return null;
  const role = uploadedBy.role === 'creator' ? 'creator' : 'admin';
  return uploadedBy.name ? `${uploadedBy.name} (${role})` : `the ${role}`;
};

/**
 * Lower screenshot numbers wait for an admin: use them, or keep the current ones.
 * Higher numbers are applied without asking, so they never show here.
 */
export default function MetricsReviewNotice({ campaignId, insights, sx }) {
  const { decide, isPending, approving, dismissing } = useMetricsReview(campaignId, insights?.id);
  const pending = insights?.metricsReview?.pending;
  if (!pending) return null;

  const by = uploaderName(pending.uploadedBy);

  return (
    <Stack
      role="status"
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ md: 'center' }}
      spacing={{ xs: 1.5, md: 3 }}
      sx={{
        px: 2,
        py: 1.25,
        borderRadius: '10px',
        bgcolor: '#FFFCF5',
        border: '1px solid #F4E7C8',
        ...sx,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
        <Iconify icon="eva:alert-circle-fill" width={18} sx={{ color: '#FFAB00', flexShrink: 0 }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: '18px', color: '#231F20' }}>
            Lower numbers in new screenshot
          </Typography>
          {by && (
            <Typography sx={{ fontSize: 12, lineHeight: '16px', color: '#8E8E93' }}>
              From {by}
            </Typography>
          )}
        </Box>
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        flexWrap="wrap"
        divider={<Divider orientation="vertical" flexItem sx={{ borderColor: '#EFE3C6' }} />}
        sx={{ flex: 1, columnGap: 2, rowGap: 1 }}
      >
        {lowerMetrics(pending).map(({ key, label, value, current }) => (
          <Stack key={key} direction="row" alignItems="baseline" spacing={1}>
            <Typography sx={{ fontSize: 12, lineHeight: '16px', color: '#8E8E93' }}>
              {label}
            </Typography>
            <Typography component="span" sx={{ ...NUMBER_SX, color: '#636366' }}>
              {formatCount(current)}
            </Typography>
            <Iconify
              icon="eva:arrow-forward-fill"
              width={14}
              sx={{ color: '#AEAEB2', alignSelf: 'center' }}
            />
            <NewNumber value={value} current={current} sx={NUMBER_SX} />
          </Stack>
        ))}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
        <LoadingButton
          loading={dismissing}
          disabled={isPending}
          onClick={() => decide(false)}
          sx={KEEP_SX}
        >
          Keep current
        </LoadingButton>
        <LoadingButton
          loading={approving}
          disabled={isPending}
          onClick={() => decide(true)}
          sx={USE_SX}
        >
          Use screenshot
        </LoadingButton>
      </Stack>
    </Stack>
  );
}

MetricsReviewNotice.propTypes = {
  campaignId: PropTypes.string.isRequired,
  insights: PropTypes.object,
  sx: PropTypes.object,
};
