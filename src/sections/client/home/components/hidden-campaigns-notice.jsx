import PropTypes from 'prop-types';

import { alpha } from '@mui/material/styles';
import { Box, Stack, Avatar, Button } from '@mui/material';

import { secondarySx } from './empty-state';
import { plural, LOGO_RING, initialOf, campaignThumb } from '../utils';

const PEEK = 3;

// Says what the date filter hid and how to bring it back, with a peek at the hidden campaigns.
export default function HiddenCampaignsNotice({ campaigns, phrase, onShowAll }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      gap={1.5}
      sx={(theme) => ({
        mt: 2,
        px: 2,
        py: 1.5,
        borderRadius: '14px',
        bgcolor: alpha(theme.palette.grey[500], 0.08),
      })}
    >
      <Stack direction="row" alignItems="center" aria-hidden sx={{ flex: 'none' }}>
        {campaigns.slice(0, PEEK).map((campaign, i) => (
          <Avatar
            key={campaign.id}
            variant="rounded"
            src={campaignThumb(campaign) ?? undefined}
            sx={(theme) => ({
              width: 28,
              height: 28,
              ml: i ? -1 : 0,
              zIndex: PEEK - i,
              fontSize: 11,
              fontWeight: 600,
              borderRadius: '8px',
              color: 'grey.600',
              bgcolor: 'grey.200',
              boxShadow: `0 0 0 2px ${theme.palette.background.paper}, ${LOGO_RING}`,
            })}
          >
            {initialOf(campaign.name)}
          </Avatar>
        ))}
        {campaigns.length > PEEK && (
          <Box sx={{ ml: 0.75, fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
            +{campaigns.length - PEEK}
          </Box>
        )}
      </Stack>

      <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
        <Box sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
          {plural(campaigns.length, 'campaign')} hidden
        </Box>
        <Box sx={{ fontSize: 12, color: 'text.secondary' }}>
          {campaigns.length === 1 ? 'It had' : 'They had'} no posts {phrase}.
        </Box>
      </Box>

      <Button variant="outlined" onClick={onShowAll} sx={{ ...secondarySx, flex: 'none' }}>
        Show all time
      </Button>
    </Stack>
  );
}

HiddenCampaignsNotice.propTypes = {
  campaigns: PropTypes.arrayOf(PropTypes.object).isRequired,
  phrase: PropTypes.string.isRequired,
  onShowAll: PropTypes.func.isRequired,
};
