import PropTypes from 'prop-types';

import { alpha } from '@mui/material/styles';
import { Box, Stack, InputBase, ButtonBase } from '@mui/material';

import Iconify from 'src/components/iconify';

import { ACTION_BLUE } from './utils';

export default function CampaignFilters({ query, onQueryChange, tab, onTabChange, tabs }) {
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

      <Stack
        direction="row"
        role="group"
        aria-label="Show campaigns"
        flexWrap="wrap"
        gap="2px"
        sx={(theme) => ({
          p: '3px',
          borderRadius: '10px',
          bgcolor: alpha(theme.palette.grey[500], 0.16),
        })}
      >
        {tabs.map((item) => {
          const selected = item.value === tab;
          return (
            <ButtonBase
              key={item.value}
              aria-pressed={selected}
              onClick={() => onTabChange(item.value)}
              sx={{
                gap: 0.75,
                px: 1.5,
                py: 0.875,
                borderRadius: 1,
                fontSize: 13,
                whiteSpace: 'nowrap',
                color: selected ? 'text.primary' : 'grey.700',
                bgcolor: selected ? 'background.paper' : 'transparent',
                boxShadow: selected ? '0 1px 2px rgba(18, 18, 20, 0.08)' : 'none',
              }}
            >
              {item.label}
              <Box
                component="span"
                sx={{ fontSize: 12, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
              >
                {item.count}
              </Box>
            </ButtonBase>
          );
        })}
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
};
