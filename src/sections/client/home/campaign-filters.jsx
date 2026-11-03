import PropTypes from 'prop-types';

import { alpha } from '@mui/material/styles';
import { Box, Stack, InputBase } from '@mui/material';

import Iconify from 'src/components/iconify';

import { plural, ACTION_BLUE, STATUS_COLOR } from './utils';
import PostedPeriodPicker from './components/posted-period-picker';
import CampaignStatusTabs from './components/campaign-status-tabs';

export default function CampaignFilters({
  query,
  onQueryChange,
  tab,
  onTabChange,
  tabs,
  period,
  onPeriodChange,
  posted,
  postDays,
  countPosts,
}) {
  return (
    <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
      <Stack
        component="label"
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{
          flex: { xs: '1 1 100%', sm: '1 1 220px' },
          maxWidth: { sm: 340 },
          height: 38,
          px: 1.5,
          border: 1,
          borderColor: 'divider',
          borderRadius: '10px',
          bgcolor: 'background.paper',
          '&:focus-within': { borderColor: ACTION_BLUE },
        }}
      >
        <Iconify icon="eva:search-fill" width={16} sx={{ color: 'grey.500', flex: 'none' }} />
        <InputBase
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search campaigns"
          inputProps={{ 'aria-label': 'Search campaigns' }}
          sx={{ flex: 1, minWidth: 0, fontSize: 14 }}
        />
      </Stack>

      <CampaignStatusTabs tab={tab} tabs={tabs} onChange={onTabChange} />

      <Stack
        direction="row"
        alignItems="center"
        sx={(theme) => ({
          ml: { sm: 'auto' },
          flex: { xs: '1 1 100%', sm: 'none' },
          p: '3px',
          borderRadius: '10px',
          bgcolor: alpha(theme.palette.grey[500], 0.16),
        })}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          aria-live="polite"
          sx={{
            flex: 1,
            px: 1.25,
            fontSize: 13,
            color: 'grey.700',
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <Box
            component="span"
            sx={{
              width: 6,
              height: 6,
              flex: 'none',
              borderRadius: '50%',
              bgcolor: posted.total ? STATUS_COLOR.done : 'grey.400',
            }}
          />
          {/* Remounts on change so the new number fades in. */}
          <Box
            component="span"
            key={`${posted.total}:${posted.campaigns}`}
            sx={{
              '@keyframes postedIn': {
                from: { opacity: 0, filter: 'blur(2px)' },
                to: { opacity: 1, filter: 'blur(0)' },
              },
              animation: 'postedIn 180ms ease-out',
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          >
            {posted.total ? (
              <>
                <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {plural(posted.total, 'post')}
                </Box>
                {' · '}
                {plural(posted.campaigns, 'campaign')}
              </>
            ) : (
              'No posts'
            )}
          </Box>
        </Stack>
        <PostedPeriodPicker
          period={period}
          onChange={onPeriodChange}
          postDays={postDays}
          countPosts={countPosts}
        />
      </Stack>
    </Stack>
  );
}

CampaignFilters.propTypes = {
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  tab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string, label: PropTypes.string, count: PropTypes.number })
  ).isRequired,
  period: PropTypes.shape({
    value: PropTypes.string.isRequired,
    from: PropTypes.instanceOf(Date),
    to: PropTypes.instanceOf(Date),
  }).isRequired,
  onPeriodChange: PropTypes.func.isRequired,
  posted: PropTypes.shape({ total: PropTypes.number, campaigns: PropTypes.number }).isRequired,
  postDays: PropTypes.instanceOf(Map),
  countPosts: PropTypes.func,
};
