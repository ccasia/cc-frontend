import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance, { endpoints } from 'src/utils/axios';
import {
  metricLabel,
  metricError,
  hasSafePrimaryMetric,
  isRecentViewsPlatform,
  normalizePrimaryMetric,
  withThousandsSeparators,
  formatPrimaryMetricInput,
  sanitizePrimaryMetricInput,
} from 'src/utils/platform-metric';

import Iconify from 'src/components/iconify';

import WarningMessage from './warning-message';
import { failureDetails } from './extraction-error-copy';
import { hasSafeFollowerCount } from './creator-row-machine';
import { CC, labelSx, inputSx } from './creator-field-tokens';

/**
 * Followers and ER typed by hand for a platform creator whose fetch failed.
 *
 * Opened from the pitch row and from the creator modal. Chrome matches the
 * other guest-extraction dialogs: grey paper, 20px radius, serif title.
 */

const toText = (value) => (value == null ? '' : String(value));

export const PRIMARY_BUTTON_SX = {
  height: 44,
  minWidth: 120,
  px: 3,
  borderRadius: 1.15,
  borderStyle: 'solid',
  borderWidth: '1.5px',
  borderBottomWidth: '3px',
  fontSize: '0.875rem',
  fontWeight: 600,
  textTransform: 'none',
  bgcolor: '#203ff5',
  borderColor: '#203ff5',
  borderBottomColor: '#1933cc',
  color: '#ffffff',
  '&:hover': { bgcolor: '#1933cc', opacity: 0.9 },
  '&:disabled:not(.MuiLoadingButton-loading)': {
    bgcolor: '#e7e7e7',
    color: '#999999',
    borderColor: '#e7e7e7',
    borderBottomColor: '#d1d1d1',
  },
};

export default function ManualMetricsDialog({ open, onClose, pitch, initialValues, onSaved }) {
  const { enqueueSnackbar } = useSnackbar();
  const [followerCount, setFollowerCount] = useState('');
  const [engagementRate, setEngagementRate] = useState('');
  const [saving, setSaving] = useState(false);

  // Open with the numbers the admin was looking at. The backend leaves a
  // blank field as it is, so an untouched field is never erased.
  // `manualFollowerCount` defaults to 0, which means "unknown", not a count.
  const rawFollowers = initialValues?.followerCount ?? pitch?.followerCount;
  const initialFollowers = Number(rawFollowers) > 0 ? rawFollowers : '';
  const initialRate = initialValues?.engagementRate ?? pitch?.engagementRate;
  useEffect(() => {
    if (!open) return;
    setFollowerCount(toText(initialFollowers));
    setEngagementRate(toText(initialRate));
  }, [open, initialFollowers, initialRate]);

  const platform = pitch?.selectedPlatform;
  const isViews = isRecentViewsPlatform(platform);
  const rateLabel = metricLabel(platform);
  const details = failureDetails(pitch?.metricsFailureCode, platform);
  const showWarning = !isViews || Boolean(pitch?.metricsFailureCode);
  const followersInvalid = followerCount !== '' && !hasSafeFollowerCount(followerCount);
  const rateInvalid = engagementRate !== '' && !hasSafePrimaryMetric(platform, engagementRate);
  const hasInput = followerCount !== '' || engagementRate !== '';
  const canSave = hasInput && !followersInvalid && !rateInvalid;

  const handleSave = async () => {
    if (!canSave || !pitch?.id) return;
    try {
      setSaving(true);
      const { data } = await axiosInstance.patch(endpoints.campaign.pitch.v3.metrics(pitch.id), {
        followerCount,
        engagementRate: normalizePrimaryMetric(platform, engagementRate),
      });
      enqueueSnackbar(data?.message || 'Creator numbers updated.', { variant: 'success' });
      onSaved?.(data?.pitch);
      onClose();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Could not save the numbers.', {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth={false}
      aria-labelledby="manual-metrics-title"
      onClick={(event) => event.stopPropagation()}
      PaperProps={{
        sx: {
          width: 560,
          maxWidth: 'calc(100% - 32px)',
          bgcolor: `${CC.paper} !important`,
          backgroundImage: 'none',
          borderRadius: '20px',
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <Box sx={{ p: 3, bgcolor: CC.paper }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Typography
            id="manual-metrics-title"
            component="h2"
            sx={{
              fontFamily: 'Instrument Serif, serif',
              fontWeight: 400,
              fontSize: { xs: '28px', sm: '36px' },
              lineHeight: '40px',
              color: CC.onyx,
            }}
          >
            Enter numbers
          </Typography>
          <IconButton onClick={onClose} disabled={saving} aria-label="Close">
            <Iconify icon="eva:close-fill" width={24} />
          </IconButton>
        </Stack>

        {showWarning && (
          <Box sx={{ mt: 1.5 }}>
            <WarningMessage
              title={details.title}
              description={details.intro}
              reasons={details.reasons}
            />
          </Box>
        )}

        <Typography sx={{ mt: 1.5, fontSize: 12, lineHeight: '16px', color: CC.grey50 }}>
          {isViews
            ? 'Copy the follower count and recent views from the Threads app.'
            : "Use numbers from the creator's media kit or an Insights screenshot."}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              component="label"
              htmlFor="manual-followers"
              sx={{ ...labelSx, display: 'block', mb: '4px' }}
            >
              Follower Count
            </Typography>
            <TextField
              id="manual-followers"
              fullWidth
              placeholder="Follower Count"
              value={withThousandsSeparators(followerCount)}
              onChange={(event) => setFollowerCount(event.target.value.replace(/[^0-9]/g, ''))}
              error={followersInvalid}
              helperText={followersInvalid ? 'Enter a whole number from 1 to 2,000,000,000.' : undefined}
              disabled={saving}
              sx={inputSx}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              component="label"
              htmlFor="manual-rate"
              sx={{ ...labelSx, display: 'block', mb: '4px' }}
            >
              {rateLabel}
            </Typography>
            <TextField
              id="manual-rate"
              fullWidth
              placeholder={rateLabel}
              value={formatPrimaryMetricInput(platform, engagementRate)}
              onChange={(event) =>
                setEngagementRate(sanitizePrimaryMetricInput(platform, event.target.value))
              }
              error={rateInvalid}
              helperText={rateInvalid ? metricError(platform) : undefined}
              disabled={saving}
              InputProps={
                isViews
                  ? undefined
                  : { endAdornment: <InputAdornment position="end">%</InputAdornment> }
              }
              sx={inputSx}
            />
          </Box>
        </Stack>

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
          <LoadingButton
            onClick={handleSave}
            disabled={!canSave}
            loading={saving}
            loadingIndicator={<CircularProgress size={20} sx={{ color: '#fff' }} />}
            sx={PRIMARY_BUTTON_SX}
          >
            Save
          </LoadingButton>
        </Stack>
      </Box>
    </Dialog>
  );
}

ManualMetricsDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  pitch: PropTypes.object,
  initialValues: PropTypes.shape({
    followerCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    engagementRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onSaved: PropTypes.func,
};
