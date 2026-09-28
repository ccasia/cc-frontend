import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import Iconify from 'src/components/iconify';

import useJustFinished from '../use-just-finished';
import CreatorFieldLoading from './creator-field-loading';
import { platformLabel } from './profile-link-validation';
import { extractionErrorCopy } from './extraction-error-copy';
import ScrapeTextFieldReveal from '../scrape-text-field-reveal';
import EngagementBreakdownDialog from './engagement-breakdown-dialog';
import { CC, labelSx, inputSx, FIELD_HEIGHT } from './creator-field-tokens';
import {
  ACTIONS,
  ENTRY_MODE,
  ROW_STATUS,
  isRowActive,
  metricSourceOf,
  fieldProvenanceOf,
  FIELD_UPDATE_SOURCE,
  hasSafeFollowerCount,
  hasSafeEngagementRate,
} from './creator-row-machine';

/**
 * One creator row, laid out to the "No-Platform Creators/default" handoff.
 *
 * Profile Link sits on the left of a vertical rule. A valid link starts the
 * fetch on its own. The three fields on the right of the rule are the ones
 * the fetch fills in, and they stay editable. There is no Platform field:
 * the platform comes from the link, and the icon inside the link field
 * reports what was recognised.
 */

/**
 * Outline, not fill, and each platform in its own brand colour. This is the
 * same field in the same position as the one in Add Platform Creators, so the
 * two modals share these values rather than each picking their own.
 */
const PLATFORM_ICON = {
  instagram: { icon: 'ri:instagram-line', color: '#C13584' },
  tiktok: { icon: 'ic:baseline-tiktok', color: '#000000' },
};

/**
 * Grouped digits, same as Add Platform Creators. State still stores a plain
 * digit string; the commas only exist in the field.
 */
const formatFollowerCountDisplay = (value) => {
  if (value === '' || value === undefined) return '';
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  return n.toLocaleString();
};

/**
 * A compact warning strip under the fields: a soft amber tint with no border,
 * so it stands apart from the form without shouting like a banner. Amber, not
 * red, because the admin can recover by typing the values in. The copy uses
 * the theme's darker warning shade so 12px text stays readable on the tint.
 */
const WARNING = {
  icon: '#FFAB00',
  text: '#7A4100',
  tint: 'rgba(255, 171, 0, 0.1)',
};

function InlineWarning({ title, children, action }) {
  return (
    <Stack
      role="alert"
      direction="row"
      alignItems="flex-start"
      spacing={0.75}
      sx={{ mt: 1, px: 1.25, py: 0.75, minWidth: 0, borderRadius: '8px', bgcolor: WARNING.tint }}
    >
      <Iconify
        icon="eva:alert-triangle-fill"
        width={14}
        sx={{ mt: '2px', flexShrink: 0, color: WARNING.icon }}
      />
      <Typography
        component="div"
        sx={{ fontSize: '12px', lineHeight: '18px', color: WARNING.text }}
      >
        {title && (
          <>
            <Box component="span" sx={{ fontWeight: 600 }}>
              {title}
            </Box>{' '}
          </>
        )}
        {children}
        {action && <> {action}</>}
      </Typography>
    </Stack>
  );
}

InlineWarning.propTypes = {
  title: PropTypes.node,
  children: PropTypes.node,
  action: PropTypes.node,
};

const retryLinkSx = {
  minWidth: 0,
  p: 0,
  verticalAlign: 'baseline',
  // Blue, like every other clickable thing in this modal, so the action stands
  // apart from the amber copy around it.
  color: CC.blue500,
  fontSize: '12px',
  fontWeight: 600,
  lineHeight: '18px',
  textTransform: 'none',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: 'transparent', textDecoration: 'underline', opacity: 0.8 },
};

export default function CreatorScrapeRow({
  row,
  isDuplicate,
  disabled,
  dispatch,
  onLinkChange,
  onRetry,
}) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const active = isRowActive(row);
  const loading = [ROW_STATUS.QUEUED, ROW_STATUS.RUNNING, ROW_STATUS.POLLING].includes(row.status);
  const justFinished = useJustFinished(loading);
  const canFallback = Boolean(row.fallbackReason);
  const isManualEntry = row.entryMode === ENTRY_MODE.MANUAL;
  const isUsageLimit = /monthly usage hard limit|cost.limit/i.test(
    `${row.error?.code ?? ''} ${row.error?.message ?? ''}`
  );
  const revealScrapedFields = justFinished && row.fieldUpdateSource === FIELD_UPDATE_SOURCE.SCRAPE;
  const platformIcon = PLATFORM_ICON[row.platform];

  const hasBreakdown = row.status === ROW_STATUS.READY;

  const label = (text, hint, provenance) => (
    <Stack direction="row" alignItems="center" spacing={0.25} sx={{ mb: '4px', height: '16px' }}>
      <Typography component="span" sx={labelSx}>
        {text}
        {provenance ? (
          <Box component="span" sx={{ fontStyle: 'italic', fontWeight: 400 }}>
            {` (${provenance})`}
          </Box>
        ) : null}
      </Typography>
      {hint}
    </Stack>
  );

  /** A field the fetch fills in. It shows a skeleton while the fetch runs. */
  const metricField = (field, text, hint) => {
    const isFollowers = field === 'followerCount';
    const isRate = field === 'engagementRate';
    const hasValue = String(row[field] ?? '').length > 0;
    const invalidManualValue =
      isManualEntry &&
      hasValue &&
      ((field === 'name' && !row.name.trim()) ||
        (isFollowers && !hasSafeFollowerCount(row[field])) ||
        (isRate && !hasSafeEngagementRate(row[field])));
    let manualHelperText = 'Enter a creator name.';
    if (isFollowers) manualHelperText = 'Enter a whole number from 1 to 2,000,000,000.';
    if (isRate) manualHelperText = 'Enter a percentage from 0 to 1,000.';

    return (
      <>
        {label(text, hint, fieldProvenanceOf(row, field))}
        {loading ? (
          <CreatorFieldLoading label={`Fetching ${text.toLowerCase()}`} showSpinner />
        ) : (
          <ScrapeTextFieldReveal
            reveal={revealScrapedFields}
            text={isFollowers ? formatFollowerCountDisplay(row[field]) : row[field]}
            height={FIELD_HEIGHT}
            overlayPaddingRight={isRate ? 36 : 12}
          >
            <TextField
              fullWidth
              placeholder={text}
              value={isFollowers ? formatFollowerCountDisplay(row[field]) : row[field]}
              onChange={(event) => {
                let { value } = event.target;
                if (isFollowers) value = value.replace(/[^0-9]/g, '');
                // A percentage, so digits and one dot only.
                if (isRate) value = value.replace(/[^0-9.]/g, '');
                dispatch({ type: ACTIONS.EDIT_FIELD, rowId: row.id, field, value });
              }}
              disabled={disabled || active}
              required={isManualEntry}
              error={invalidManualValue}
              helperText={invalidManualValue ? manualHelperText : undefined}
              sx={inputSx}
              InputProps={
                isRate
                  ? { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                  : undefined
              }
              inputProps={
                isFollowers || isRate
                  ? { inputMode: isFollowers ? 'numeric' : 'decimal' }
                  : undefined
              }
            />
          </ScrapeTextFieldReveal>
        )}
      </>
    );
  };

  // A real button, so a keyboard and a touch user can reach the breakdown.
  const rateHint = hasBreakdown ? (
    <Tooltip title="How this rate was worked out" arrow describeChild>
      <IconButton
        aria-label="How this engagement rate was worked out"
        onClick={() => setBreakdownOpen(true)}
        size="small"
        sx={{ p: 0, color: CC.grey25, '&:hover': { color: CC.blue500, bgcolor: 'transparent' } }}
      >
        <Iconify icon="eva:info-outline" width={14} />
      </IconButton>
    </Tooltip>
  ) : null;

  // A short title says what went wrong; the line under it says what to do.
  const lookupAlertTitle = isUsageLimit
    ? 'Monthly scraping limit reached.'
    : 'Automatic lookup failed.';

  return (
    <Box data-testid="creator-scrape-row" aria-busy={loading ? 'true' : undefined}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'flex-start' }}
        spacing={{ xs: 2, md: 1.5 }}
      >
        {/* Left of the rule: the link the admin supplies. */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'flex-start' }}
          spacing={{ xs: 2, md: 2.5 }}
          sx={{ flex: 1, minWidth: 0 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {label('Profile Link')}
            <TextField
              fullWidth
              placeholder="Profile Link"
              value={row.profileLink}
              onChange={(event) => onLinkChange(row.id, event.target.value)}
              disabled={disabled}
              error={Boolean(row.linkError) || isDuplicate}
              helperText={
                isDuplicate ? 'This creator is already in the list.' : row.linkError?.message
              }
              sx={{
                ...inputSx,
                '& .MuiFormHelperText-root': { ml: 0, mt: '4px' },
                '& .MuiOutlinedInput-input': {
                  ...inputSx['& .MuiOutlinedInput-input'],
                  color: row.linkError || isDuplicate ? CC.onyx : CC.blue500,
                },
              }}
              InputProps={{
                // The only report of the detected platform, now that the
                // Platform field is gone.
                startAdornment: platformIcon ? (
                  <InputAdornment position="start" sx={{ mr: 0.75 }}>
                    <Box
                      component="span"
                      role="img"
                      aria-label={platformLabel(row.platform)}
                      sx={{ display: 'inline-flex', color: platformIcon.color }}
                    >
                      <Iconify icon={platformIcon.icon} width={18} />
                    </Box>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Box>

          {/* The rule marks the boundary: fetched values start here. */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              pl: { md: '20px' },
              borderLeft: { md: `1px solid ${CC.light100}` },
            }}
          >
            {metricField('name', 'Creator Name')}
          </Box>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'flex-start' }}
          spacing={{ xs: 2, sm: 1.25 }}
          sx={{ flexShrink: 0 }}
        >
          <Box sx={{ width: { xs: '100%', sm: 175 } }}>
            {metricField('engagementRate', 'Engagement Rate', rateHint)}
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 175 } }}>
            {metricField('followerCount', 'Follower Count')}
          </Box>
        </Stack>
      </Stack>

      {row.status === ROW_STATUS.READY && metricSourceOf(row) === 'manual_override' && (
        <Typography sx={{ mt: 1, fontSize: '12px', color: CC.blue500 }}>
          Saved as a manual override. The fetched values are kept for the record.
        </Typography>
      )}

      {row.error && !canFallback && (
        <InlineWarning
          title={lookupAlertTitle}
          action={
            // A retry clears the row, so typed manual values would be lost.
            !isManualEntry && (
              <Button
                variant="text"
                disableRipple
                onClick={() => onRetry?.(row.id)}
                disabled={disabled}
                sx={retryLinkSx}
              >
                Retry lookup
              </Button>
            )
          }
        >
          Enter a valid name, engagement rate, and follower count to continue.
        </InlineWarning>
      )}

      {row.saveError && (
        <InlineWarning>{row.saveError.message || 'This creator could not be added.'}</InlineWarning>
      )}

      {canFallback && (
        <Alert severity="info" sx={{ mt: 1.5, borderRadius: 1 }}>
          <Typography sx={{ fontSize: '13px', mb: 0.5 }}>
            {extractionErrorCopy(row)}
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={row.fallbackConfirmed}
                onChange={(event) =>
                  dispatch({
                    type: ACTIONS.CONFIRM_FALLBACK,
                    rowId: row.id,
                    confirmed: event.target.checked,
                  })
                }
              />
            }
            label={
              <Typography sx={{ fontSize: '13px' }}>
                Enter the name and follower count by hand. Engagement rate may stay blank.
              </Typography>
            }
          />
          {row.fallbackConfirmed && row.engagementRate && (
            <Typography sx={{ fontSize: '12px', color: CC.blue500 }}>
              This engagement rate is recorded as entered by hand, not measured.
            </Typography>
          )}
        </Alert>
      )}

      <EngagementBreakdownDialog
        open={breakdownOpen}
        onClose={() => setBreakdownOpen(false)}
        posts={row.selectedPosts}
        formulaVersion={row.formulaVersion}
        engagementRate={row.engagementRate}
        followerCount={Number(row.followerCount) || null}
        creatorName={row.name || undefined}
      />

      <Box sx={{ mt: 1.5 }}>
        {label('CS Comments (Optional)')}
        <TextField
          fullWidth
          placeholder="Input comments about the creator that your clients might find helpful"
          value={row.adminComments}
          onChange={(event) =>
            dispatch({ type: ACTIONS.SET_COMMENTS, rowId: row.id, value: event.target.value })
          }
          disabled={disabled}
          sx={inputSx}
        />
      </Box>
    </Box>
  );
}

CreatorScrapeRow.propTypes = {
  row: PropTypes.object.isRequired,
  isDuplicate: PropTypes.bool,
  disabled: PropTypes.bool,
  dispatch: PropTypes.func.isRequired,
  onLinkChange: PropTypes.func.isRequired,
  onRetry: PropTypes.func,
};
