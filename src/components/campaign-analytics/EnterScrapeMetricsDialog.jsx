import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance from 'src/utils/axios';
import { formatNumber } from 'src/utils/socialMetricsCalculator';

import Iconify from 'src/components/iconify';

import WarningMessage from 'src/sections/campaign/discover/client/v3-pitches/guest-extraction/warning-message';
import { PRIMARY_BUTTON_SX } from 'src/sections/campaign/discover/client/v3-pitches/guest-extraction/manual-metrics-dialog';
import {
  CC,
  labelSx,
  inputSx,
} from 'src/sections/campaign/discover/client/v3-pitches/guest-extraction/creator-field-tokens';

import { scrapeFailureMessage, scrapeFailureHeadline } from './scrape-failure-copy';

/**
 * Counters typed by hand for a post whose Bright Data scrape failed. Chrome
 * matches ManualMetricsDialog: grey paper, 20px radius, serif title. The
 * admin opens the post, reads the missing numbers, and sees the rate they give.
 */

const LABELS = { views: 'Views', likes: 'Likes', comments: 'Comments', shares: 'Shares' };

const MAX_COUNT = 2_000_000_000;

const SECONDARY_BUTTON_SX = {
  ...PRIMARY_BUTTON_SX,
  bgcolor: '#FFFFFF',
  borderColor: '#E7E7E7',
  borderBottomColor: '#E7E7E7',
  color: CC.onyx,
  '&:hover': { bgcolor: '#F5F5F5', borderColor: '#221f20', borderBottomColor: '#221f20' },
};

/** Counters the admin must enter: views always, the rest only when the scrape did not get them. */
export const missingFields = (partial, isInstagram) => {
  if (partial) return ['views'];
  return isInstagram ? ['views', 'likes', 'comments'] : ['views', 'likes', 'comments', 'shares'];
};

const emptyValues = (fields) => Object.fromEntries(fields.map((field) => [field, '']));

const withCommas = (digits) => (digits === '' ? '' : Number(digits).toLocaleString('en-US'));

function ScrapedTile({ label, value }) {
  return (
    <Box
      sx={{
        flex: '1 1 0',
        minWidth: 0,
        px: 1.5,
        py: 1,
        borderRadius: '10px',
        bgcolor: '#FFFFFF',
        border: `1px solid ${CC.light100}`,
      }}
    >
      <Typography sx={{ ...labelSx, display: 'block' }}>{label}</Typography>
      <Typography
        noWrap
        sx={{
          mt: 0.25,
          fontSize: 16,
          fontWeight: 600,
          lineHeight: '22px',
          color: typeof value === 'number' ? CC.onyx : CC.grey25,
        }}
      >
        {typeof value === 'number' ? formatNumber(value) : value}
      </Typography>
    </Box>
  );
}

ScrapedTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default function EnterScrapeMetricsDialog({
  open,
  onClose,
  campaignId,
  postingUrlId,
  failure,
  isInstagram,
  onSaved,
  postUrl,
  creatorName,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const partial = failure?.partial || null;
  const fields = missingFields(partial, isInstagram);
  const fieldsKey = fields.join(',');

  const [values, setValues] = useState(() => emptyValues(fields));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValues(emptyValues(fieldsKey.split(',')));
  }, [open, fieldsKey]);

  const tooLarge = (field) => values[field] !== '' && Number(values[field]) > MAX_COUNT;
  const canSave = fields.every((field) => values[field] !== '' && !tooLarge(field));

  // The same rule the backend stores: (likes + comments + shares) / views.
  // A typed number wins; a field the form does not ask for comes from the scrape.
  const numberFor = (field) => (values[field] ? Number(values[field]) : (partial?.[field] ?? 0));
  const views = numberFor('views');
  const engagementRate =
    canSave && views > 0
      ? ((numberFor('likes') + numberFor('comments') + (isInstagram ? 0 : numberFor('shares'))) /
          views) *
        100
      : null;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      await axiosInstance.post(
        `/api/campaign/${campaignId}/post-scrapes/${postingUrlId}/metrics`,
        Object.fromEntries(fields.map((field) => [field, Number(values[field])]))
      );
      enqueueSnackbar('Post metrics saved.', { variant: 'success' });
      onClose();
      onSaved?.();
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || error?.message || 'Could not save the numbers.',
        { variant: 'error' }
      );
    } finally {
      setSaving(false);
    }
  };

  const scrapedTiles = partial
    ? [
        ['Likes', partial.likes],
        ['Comments', partial.comments],
        ['Shares', isInstagram ? 'Private' : partial.shares],
        ...(isInstagram ? [['Saves', 'Private']] : []),
      ]
    : [];

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth={false}
      aria-labelledby="enter-scrape-metrics-title"
      PaperProps={{
        sx: {
          width: 520,
          maxWidth: 'calc(100% - 32px)',
          bgcolor: `${CC.paper} !important`,
          backgroundImage: 'none',
          borderRadius: '20px',
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <Box sx={{ p: 3, bgcolor: CC.paper }}>
        {/* Header: what is missing, for whom, and where to find it */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              id="enter-scrape-metrics-title"
              component="h2"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontWeight: 400,
                fontSize: { xs: '28px', sm: '36px' },
                lineHeight: '40px',
                color: CC.onyx,
              }}
            >
              {partial ? 'Add view count' : 'Enter post numbers'}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5, minWidth: 0 }}>
              {creatorName && (
                <Typography noWrap sx={{ fontSize: 14, lineHeight: '20px', color: CC.grey50 }}>
                  {creatorName}
                </Typography>
              )}
              {creatorName && postUrl && (
                <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: CC.grey25 }} />
              )}
              {postUrl && (
                <Link
                  href={postUrl}
                  target="_blank"
                  rel="noopener"
                  underline="hover"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    flexShrink: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: '20px',
                    color: CC.blue500,
                  }}
                >
                  Open post
                  <Iconify icon="eva:external-link-fill" width={14} />
                </Link>
              )}
            </Stack>
          </Box>
          <IconButton onClick={onClose} disabled={saving} aria-label="Close" sx={{ mt: -0.5 }}>
            <Iconify icon="eva:close-fill" width={24} />
          </IconButton>
        </Stack>

        <Box sx={{ mt: 2 }}>
          <WarningMessage
            title={scrapeFailureHeadline(failure)}
            description={scrapeFailureMessage(failure)}
          />
        </Box>

        {/* What the scrape did get */}
        {scrapedTiles.length > 0 && (
          <Box sx={{ mt: 2.5 }}>
            <Typography sx={{ ...labelSx, display: 'block', mb: 1 }}>Already scraped</Typography>
            <Stack direction="row" spacing={1}>
              {scrapedTiles.map(([label, value]) => (
                <ScrapedTile key={label} label={label} value={value} />
              ))}
            </Stack>
          </Box>
        )}

        {/* What the admin enters */}
        <Box sx={{ mt: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap flexWrap="wrap">
            {fields.map((field, index) => (
              <Box key={field} sx={{ flex: '1 1 0', minWidth: { sm: 120 } }}>
                <Typography
                  component="label"
                  htmlFor={`scrape-${field}`}
                  sx={{ ...labelSx, display: 'block', mb: '4px' }}
                >
                  {LABELS[field]}
                </Typography>
                <TextField
                  id={`scrape-${field}`}
                  fullWidth
                  autoFocus={index === 0}
                  placeholder="0"
                  inputProps={{ inputMode: 'numeric' }}
                  value={withCommas(values[field])}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      [field]: event.target.value.replace(/[^0-9]/g, '').slice(0, 10),
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleSave();
                  }}
                  error={tooLarge(field)}
                  helperText={tooLarge(field) ? 'Enter a number up to 2,000,000,000.' : undefined}
                  disabled={saving}
                  sx={inputSx}
                />
              </Box>
            ))}
          </Stack>

          <Typography sx={{ mt: 1, fontSize: 12, lineHeight: '16px', color: CC.grey50 }}>
            {partial
              ? 'Use the view count shown under the Reel on Instagram.'
              : 'Use the numbers shown on the post, or from an Insights screenshot.'}
          </Typography>
        </Box>

        {/* Footer: the rate these numbers give, then the actions */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mt: 3 }}
        >
          <Typography sx={{ fontSize: 13, lineHeight: '18px', color: CC.grey50 }}>
            Engagement rate:{' '}
            <Box
              component="span"
              sx={{ fontWeight: 700, color: engagementRate === null ? CC.grey25 : CC.blue500 }}
            >
              {engagementRate === null ? '–' : `${engagementRate.toFixed(2)}%`}
            </Box>
          </Typography>

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={onClose} disabled={saving} sx={SECONDARY_BUTTON_SX}>
              Cancel
            </Button>
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
        </Stack>
      </Box>
    </Dialog>
  );
}

EnterScrapeMetricsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  campaignId: PropTypes.string.isRequired,
  postingUrlId: PropTypes.string.isRequired,
  /** `{ code, message, partial }` from /post-scrapes/failed. */
  failure: PropTypes.object,
  isInstagram: PropTypes.bool,
  onSaved: PropTypes.func,
  postUrl: PropTypes.string,
  creatorName: PropTypes.string,
};
