import PropTypes from 'prop-types';

import { Box, Divider, Typography } from '@mui/material';

import ScrapeFixButton from './ScrapeFixButton';
import { METRIC_LABELS } from './scrape-metrics';
import useScrapeMetricsDraft from './use-scrape-metrics-draft';
import MissingMetricField, { NUMBER_HEIGHT, MissingMetricIcon } from './MissingMetricField';

/**
 * Metric slots for a post whose Bright Data scrape failed. Shows the counters
 * the scrape did get. Each missing number has a warning icon beside its label
 * and, for an admin, an open input that saves when it loses focus. Once every
 * number is in, the engagement rate shows. The desktop layout copies
 * the loaded metrics row in UserPerformanceCard, so columns line up with the rows
 * around it. The edit button sits in the card's action column (ScrapeFixButton).
 */

const labelSx = { whiteSpace: 'nowrap' };
const dividerSx = { width: '1px', height: '55px', backgroundColor: '#1340FF', flexShrink: 0 };

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

function EngagementRateValue({ rate }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: NUMBER_HEIGHT }}>
      <Typography
        fontFamily="Instrument Serif"
        fontSize={{ xs: 24, md: 28, lg: 36, xl: 40 }}
        fontWeight={400}
        lineHeight={1.1}
        color={rate === null ? '#B0B0B0' : '#1340FF'}
      >
        {rate === null ? '–' : `${rate.toFixed(2)}%`}
      </Typography>
    </Box>
  );
}

EngagementRateValue.propTypes = { rate: PropTypes.number };

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
  const { fields, pending, entered, numbers, engagementRate, saveField, savingField } =
    useScrapeMetricsDraft({ scrapeFailure, isInstagram, campaignId, onSaved });

  // TikTok rows have no Saves column. Instagram scrapes cannot see shares or saves,
  // so those show only a number entered by hand or read from a screenshot.
  const keys = isInstagram
    ? ['views', 'likes', 'comments', 'shares', 'saved']
    : ['views', 'likes', 'comments', 'shares'];
  const labelOf = (key) => METRIC_LABELS[key];
  const valueOf = (key) =>
    isInstagram && ['shares', 'saved'].includes(key) ? entered[key] : numbers[key];

  const labelFor = (key) => (
    <>
      {labelOf(key)}
      {pending.includes(key) && <MissingMetricIcon label={labelOf(key)} failure={failure} />}
    </>
  );

  // Fields stay open until every number is in. Then the row completes.
  const fieldFor = (key) => (
    <MissingMetricField
      label={labelOf(key)}
      value={valueOf(key)}
      editable={canEnterMetrics && pending.length > 0 && fields.includes(key)}
      saving={savingField === key}
      onSave={(number) => saveField(key, number)}
    />
  );

  if (isMobile) {
    return (
      <Box width="100%" mb={1.5} px={1}>
        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontSize={12} color="text.secondary" sx={labelSx}>
              Engagement Rate
            </Typography>
            <EngagementRateValue rate={engagementRate} />
          </Box>
          {keys.map((key) => (
            <Box key={key} sx={{ minWidth: 0 }}>
              <Typography fontSize={12} color="text.secondary" sx={labelSx}>
                {labelFor(key)}
              </Typography>
              {fieldFor(key)}
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
        <EngagementRateValue rate={engagementRate} />
      </Box>

      {keys.map((key) => (
        <Box key={key} display="flex" alignItems="center" flex={1} minWidth={0}>
          <Divider sx={dividerSx} />
          <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', px: 1 }}>
            <MetricLabel>{labelFor(key)}</MetricLabel>
            {fieldFor(key)}
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
  /** `{ postingUrlId, failure: { code, message, jobIds, partial, entered } }` from /post-scrapes/failed. */
  scrapeFailure: PropTypes.object.isRequired,
  isInstagram: PropTypes.bool,
  isMobile: PropTypes.bool,
  campaignId: PropTypes.string,
  /** Lets the admin type missing numbers. Mobile also shows the edit button under the numbers. */
  canEnterMetrics: PropTypes.bool,
  onSaved: PropTypes.func,
  creatorName: PropTypes.string,
};
