import { useState } from 'react';
import PropTypes from 'prop-types';

import { Box, Badge, Tooltip } from '@mui/material';

import Iconify from 'src/components/iconify';

import EnterScrapeMetricsDialog, { missingFields } from './EnterScrapeMetricsDialog';

/**
 * The edit button of a failed scrape row. Same chrome as ManualCreatorCard's
 * edit button; the amber badge counts the numbers the admin still has to enter.
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
};

export default function ScrapeFixButton({
  scrapeFailure,
  isInstagram,
  campaignId,
  onSaved,
  disabled,
  creatorName,
}) {
  const [open, setOpen] = useState(false);
  const { failure, postingUrlId } = scrapeFailure;
  const missing = missingFields(failure?.partial || null, isInstagram).length;

  return (
    <>
      <Tooltip title={`Enter ${missing} missing number${missing === 1 ? '' : 's'}`} arrow>
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
          isInstagram={isInstagram}
          onSaved={onSaved}
          postUrl={scrapeFailure.postUrl}
          creatorName={creatorName}
        />
      )}
    </>
  );
}

ScrapeFixButton.propTypes = {
  /** `{ postingUrlId, failure }` from /post-scrapes/failed. */
  scrapeFailure: PropTypes.object.isRequired,
  isInstagram: PropTypes.bool,
  campaignId: PropTypes.string,
  onSaved: PropTypes.func,
  disabled: PropTypes.bool,
  creatorName: PropTypes.string,
};
