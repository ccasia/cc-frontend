import PropTypes from 'prop-types';

import { Box, Stack, Divider, Tooltip, Typography } from '@mui/material';

import { formatNumber } from 'src/utils/socialMetricsCalculator';

import Iconify from 'src/components/iconify';

import { CC } from 'src/sections/campaign/discover/client/v3-pitches/guest-extraction/creator-field-tokens';
import { barTipProps } from 'src/sections/campaign/discover/client/v3-pitches/guest-extraction/engagement-breakdown';

import ScrapeFixButton from './ScrapeFixButton';
import { missingFields } from './EnterScrapeMetricsDialog';
import { scrapeFailureMessage, scrapeFailureHeadline } from './scrape-failure-copy';

/**
 * Metric slots for a post whose Bright Data scrape failed. Shows the counters
 * the scrape did get; each number the admin must enter shows a warning icon
 * whose tooltip gives the reason. The desktop layout copies the loaded metrics
 * row in UserPerformanceCard, so columns line up with the rows around it. The
 * edit button sits in the card's action column (ScrapeFixButton).
 */

const labelSx = { whiteSpace: 'nowrap' };
const WARNING = '#FFAB00';
const dividerSx = { width: '1px', height: '55px', backgroundColor: '#1340FF', flexShrink: 0 };

const FIELD_BY_LABEL = { Views: 'views', Likes: 'likes', Comments: 'comments', Shares: 'shares' };

function MetricLabel({ children }) {
  return (
    <Typography
      fontFamily="Aileron"
      fontSize={{ md: 14, lg: 16, xl: 18 }}
      fontWeight={600}
      color="#636366"
      sx={labelSx}
    >
      {children}
    </Typography>
  );
}

MetricLabel.propTypes = { children: PropTypes.node };

function FailureTooltipTitle({ failure }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.75}>
        <Iconify icon="eva:alert-triangle-fill" width={16} sx={{ color: WARNING, flexShrink: 0 }} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: '18px', color: CC.onyx }}>
          {scrapeFailureHeadline(failure)}
        </Typography>
      </Stack>
      <Typography sx={{ mt: 0.5, fontSize: 13, lineHeight: '18px', color: CC.grey50 }}>
        {scrapeFailureMessage(failure)}
      </Typography>
    </Box>
  );
}

FailureTooltipTitle.propTypes = { failure: PropTypes.object };

/** Same height as a metric number, so a warning slot lines up with the numbers beside it. */
const NUMBER_HEIGHT = { md: 31, lg: 40, xl: 44 };

function MetricNumber({ value, missing, failure }) {
  if (missing) {
    return (
      <Tooltip
        title={<FailureTooltipTitle failure={failure} />}
        arrow
        placement="top"
        componentsProps={barTipProps}
      >
        <Box
          tabIndex={0}
          aria-label={`${scrapeFailureHeadline(failure)}. ${scrapeFailureMessage(failure)}`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: NUMBER_HEIGHT,
            width: 'fit-content',
            cursor: 'help',
            outline: 'none',
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: '999px',
              bgcolor: '#FFF8E6',
              border: '1px solid #FFE2A8',
              transition: 'border-color 0.2s ease',
              '&:hover': { borderColor: WARNING },
            }}
          >
            <Iconify
              icon="eva:alert-triangle-fill"
              width={14}
              sx={{ color: WARNING, flexShrink: 0 }}
            />
            <Typography
              sx={{
                fontSize: { md: 12, lg: 13 },
                fontWeight: 600,
                lineHeight: '18px',
                color: '#7A4100',
              }}
            >
              Missing
            </Typography>
          </Stack>
        </Box>
      </Tooltip>
    );
  }

  const known = typeof value === 'number';
  return (
    <Typography
      fontFamily="Instrument Serif"
      fontSize={{ md: 28, lg: 36, xl: 40 }}
      fontWeight={400}
      color={known ? '#1340FF' : '#B0B0B0'}
      lineHeight={1.1}
    >
      {known ? formatNumber(value) : '–'}
    </Typography>
  );
}

MetricNumber.propTypes = {
  value: PropTypes.number,
  missing: PropTypes.bool,
  failure: PropTypes.object,
};

export default function ScrapeFailedMetrics({
  scrapeFailure,
  isInstagram,
  isMobile,
  campaignId,
  canEnterMetrics,
  onSaved,
  creatorName,
}) {
  const { failure } = scrapeFailure;
  const partial = failure?.partial || null;
  const missing = new Set(missingFields(partial, isInstagram));

  const values = {
    Views: undefined,
    Likes: partial?.likes,
    Comments: partial?.comments,
    Shares: !isInstagram ? partial?.shares : undefined,
    ...(isInstagram ? { Saves: undefined } : {}),
  };

  const numberFor = (label, value) => (
    <MetricNumber value={value} missing={missing.has(FIELD_BY_LABEL[label])} failure={failure} />
  );

  if (isMobile) {
    return (
      <Box width="100%" mb={1.5} px={1}>
        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={1.5}>
          {Object.entries({ 'Engagement Rate': undefined, ...values }).map(([label, value]) => (
            <Box key={label} sx={{ minWidth: 0 }}>
              <Typography fontSize={12} color="text.secondary" sx={labelSx}>
                {label}
              </Typography>
              {numberFor(label, value)}
            </Box>
          ))}
        </Box>
        {canEnterMetrics && (
          <Box mt={1.5} display="flex" justifyContent="flex-end">
            <ScrapeFixButton
              scrapeFailure={scrapeFailure}
              isInstagram={isInstagram}
              campaignId={campaignId}
              onSaved={onSaved}
              creatorName={creatorName}
            />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      flex={1}
      justifyContent="space-between"
      sx={{ mx: 1, minWidth: 0, overflow: 'hidden' }}
    >
      <Box sx={{ textAlign: 'left', minWidth: 110 }}>
        <MetricLabel>
          <Box component="span" pr={1.5} sx={{ display: { xs: 'none', xl: 'inline' } }}>
            Engagement Rate
          </Box>
          <Box component="span" sx={{ display: { xs: 'inline', xl: 'none' } }}>
            Eng. Rate
          </Box>
        </MetricLabel>
        <MetricNumber />
      </Box>

      {Object.entries(values).map(([label, value]) => (
        <Box key={label} display="flex" alignItems="center" flex={1} minWidth={0}>
          <Divider sx={dividerSx} />
          <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', px: 1 }}>
            <MetricLabel>{label}</MetricLabel>
            {numberFor(label, value)}
          </Box>
        </Box>
      ))}

      {/* TikTok has no Saves. A blank slot keeps its columns in line with Instagram rows. */}
      {!isInstagram && (
        <Box display="flex" alignItems="center" flex={1} minWidth={0}>
          <Divider sx={{ ...dividerSx, backgroundColor: 'transparent' }} />
          <Box sx={{ flex: 1, px: 1 }} />
        </Box>
      )}
    </Box>
  );
}

ScrapeFailedMetrics.propTypes = {
  /** `{ postingUrlId, failure: { code, message, jobIds, partial } }` from /post-scrapes/failed. */
  scrapeFailure: PropTypes.object.isRequired,
  isInstagram: PropTypes.bool,
  isMobile: PropTypes.bool,
  /** Mobile only: the edit button sits under the numbers. Desktop puts it in the card's action column. */
  campaignId: PropTypes.string,
  canEnterMetrics: PropTypes.bool,
  onSaved: PropTypes.func,
  creatorName: PropTypes.string,
};
