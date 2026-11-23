import { useState } from 'react';
import PropTypes from 'prop-types';

import { Box, Badge, Tooltip } from '@mui/material';

import Iconify from 'src/components/iconify';

import { zeroFields } from './scrape-metrics';
import useScrapeMetricsDraft from './use-scrape-metrics-draft';
import EnterScrapeMetricsDialog from './EnterScrapeMetricsDialog';

/**
 * The edit button of a failed scrape row, or of a scraped row with a count of 0
 * (`counts`). Same chrome as ManualCreatorCard's edit button; the amber badge
 * counts the numbers the admin still has to enter.
 */

const buttonSx = (disabled) => ({
  width: 36,
  height: 36,
  borderRadius: 1.5,
  border: '1px solid #E7E7E7',
  borderBottom: '3px solid #E7E7E7',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.5 : 1,
  transition: 'all 0.2s ease',
  '&:hover': disabled
    ? {}
    : {
        bgcolor: '#f5f5f5',
        borderColor: '#221f20',
        borderBottom: '3px solid',
        borderBottomColor: '#221f20',
      },
});

const badgeSx = {
  '& .MuiBadge-badge': {
    bgcolor: '#FFAB00',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: 11,
    minWidth: 18,
    height: 18,
    px: 0.5,
  },
  // Less overhang than the default 50%, so the badge stays inside the row's border.
  '& .MuiBadge-badge:not(.MuiBadge-invisible)': { transform: 'scale(1) translate(35%, -35%)' },
};

export default function ScrapeFixButton({
  scrapeFailure,
  isInstagram,
  campaignId,
  onSaved,
  disabled,
  creatorName,
  counts,
}) {
  const [open, setOpen] = useState(false);
  const { failure, postingUrlId } = scrapeFailure;
  const { pending, entered } = useScrapeMetricsDraft({
    scrapeFailure,
    isInstagram,
    campaignId,
    onSaved,
  });
  const missing = failure ? pending.length : zeroFields(counts, isInstagram).length;

  return (
    <>
      <Tooltip
        title={
          missing ? `Enter ${missing} missing number${missing === 1 ? '' : 's'}` : 'Edit numbers'
        }
        arrow
      >
        <Badge badgeContent={missing} overlap="rectangular" sx={badgeSx}>
          <Box
            role="button"
            aria-label="Enter missing post metrics"
            onClick={() => !disabled && setOpen(true)}
            sx={buttonSx(disabled)}
          >
            <Iconify icon="mdi:pencil-outline" width={18} sx={{ color: '#221f20' }} />
          </Box>
        </Badge>
      </Tooltip>

      {!disabled && (
        <EnterScrapeMetricsDialog
          open={open}
          onClose={() => setOpen(false)}
          campaignId={campaignId}
          postingUrlId={postingUrlId}
          failure={failure}
          entered={failure ? entered : undefined}
          isInstagram={isInstagram}
          onSaved={onSaved}
          postUrl={scrapeFailure.postUrl}
          creatorName={creatorName}
          counts={counts}
        />
      )}
    </>
  );
}

ScrapeFixButton.propTypes = {
  /** `{ postingUrlId, failure, postUrl }`; `failure` is null for a scraped post. */
  scrapeFailure: PropTypes.object.isRequired,
  isInstagram: PropTypes.bool,
  campaignId: PropTypes.string,
  onSaved: PropTypes.func,
  disabled: PropTypes.bool,
  creatorName: PropTypes.string,
  /** The scraped post's counts, when there is no failure. */
  counts: PropTypes.object,
};
