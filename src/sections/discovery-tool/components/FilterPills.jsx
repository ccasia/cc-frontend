import PropTypes from 'prop-types';

import { Chip, Stack } from '@mui/material';

import Iconify from 'src/components/iconify';

import { PLATFORMS, CREDIT_TIERS } from '../constants';

// ─── Component ────────────────────────────────────────────────────────────────

const FilterPills = ({ filters, onRemoveFilter }) => {
  const pills = [];

  if (filters.platform && filters.platform !== 'all') {
    const platform = PLATFORMS.find((p) => p.value === filters.platform);
    pills.push({
      key: 'platform',
      label: platform ? platform.label : filters.platform,
      onRemove: () => onRemoveFilter('SET_PLATFORM', 'all'),
    });
  }

  if (filters.keyword) {
    pills.push({
      key: 'keyword',
      label: `Keyword: "${filters.keyword}"`,
      onRemove: () => onRemoveFilter('SET_KEYWORD', ''),
    });
  }

  if (filters.hashtag) {
    pills.push({
      key: 'hashtag',
      label: `Hashtag: "${filters.hashtag}"`,
      onRemove: () => onRemoveFilter('SET_HASHTAG', ''),
    });
  }

  if (filters.gender) {
    pills.push({
      key: 'gender',
      label: `Gender: ${filters.gender}`,
      onRemove: () => onRemoveFilter('SET_GENDER', ''),
    });
  }

  if (filters.ageRange) {
    pills.push({
      key: 'ageRange',
      label: `Age: ${filters.ageRange}`,
      onRemove: () => onRemoveFilter('SET_AGE_RANGE', ''),
    });
  }

  if (filters.country) {
    pills.push({
      key: 'country',
      label: `Country: ${filters.country}`,
      onRemove: () => onRemoveFilter('SET_COUNTRY', null),
    });
  }

  if (filters.city) {
    pills.push({
      key: 'city',
      label: `City: ${filters.city}`,
      onRemove: () => onRemoveFilter('SET_CITY', null),
    });
  }

  if (filters.creditTier) {
    const tier = CREDIT_TIERS.find((t) => t.value === filters.creditTier);
    pills.push({
      key: 'creditTier',
      label: tier ? `Credit Tier: ${tier.label}` : filters.creditTier,
      onRemove: () => onRemoveFilter('SET_CREDIT_TIER', ''),
    });
  }

  if (filters.interests.length > 0) {
    pills.push({
      key: 'interests',
      label: `Interests: ${filters.interests.join(', ')}`,
      onRemove: () => onRemoveFilter('SET_INTERESTS', []),
    });
  }

  if (pills.length === 0) return null;

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={1}>
      {pills.map((pill) => (
        <Chip
          key={pill.key}
          label={pill.label}
          onDelete={pill.onRemove}
          deleteIcon={<Iconify icon="mingcute:close-line" width={12} />}
          size="small"
					variant='outline'
          sx={{
						px: 0.5,
						py: 1.6,
						bgcolor: '#D9D9D9',
						color: '#231F20',
							borderRadius: 2,
							fontSize: 13,
							'& .MuiChip-deleteIcon': {
								marginLeft: 2,
							},
          }}
        />
      ))}
    </Stack>
  );
};

FilterPills.propTypes = {
  filters: PropTypes.shape({
    platform: PropTypes.string,
    keyword: PropTypes.string,
    hashtag: PropTypes.string,
    gender: PropTypes.string,
    ageRange: PropTypes.string,
    country: PropTypes.string,
    city: PropTypes.string,
    creditTier: PropTypes.string,
    interests: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onRemoveFilter: PropTypes.func.isRequired,
};

export default FilterPills;
