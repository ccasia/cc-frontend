import PropTypes from 'prop-types';
import React, { useMemo, useEffect, useReducer, useCallback } from 'react';

import {
  Box,
  Stack,
  Select,
  Button,
  MenuItem,
  InputBase,
  TextField,
  Typography,
  Autocomplete,
} from '@mui/material';

import { interestsLists } from 'src/contants/interestLists';

import Iconify from 'src/components/iconify';

import {
  GENDERS,
  PLATFORMS,
  AGE_RANGES,
  CREDIT_TIERS,
  filterReducer,
  FILTER_INITIAL_STATE,
} from '../constants';

import FilterPills from './FilterPills';

// ─── Component ────────────────────────────────────────────────────────────────

const DiscoveryFilterBar = React.memo(({ onFiltersChange, availableLocations, resultCount, isCountLoading, onShowResults, showButton }) => {
  const [state, dispatch] = useReducer(filterReducer, FILTER_INITIAL_STATE);

  // Debounce keyword → debouncedKeyword
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_DEBOUNCED_KEYWORD', payload: state.keyword });
    }, 300);
    return () => clearTimeout(timer);
  }, [state.keyword]);

  // Debounce hashtag → debouncedHashtag
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_DEBOUNCED_HASHTAG', payload: state.hashtag });
    }, 300);
    return () => clearTimeout(timer);
  }, [state.hashtag]);

  // Notify parent whenever relevant filter state changes
  useEffect(() => {
    onFiltersChange({
      platform: state.platform,
      debouncedKeyword: state.debouncedKeyword,
      debouncedHashtag: state.debouncedHashtag,
      ageRange: state.ageRange,
      country: state.country,
      city: state.city,
      gender: state.gender,
      creditTier: state.creditTier,
      interests: state.interests,
    });
  }, [
    state.platform,
    state.debouncedKeyword,
    state.debouncedHashtag,
    state.ageRange,
    state.country,
    state.city,
    state.gender,
    state.creditTier,
    state.interests,
    onFiltersChange,
  ]);

  // Derive location options from the available locations returned by the API
  const countryOptions = useMemo(() => Object.keys(availableLocations || {}), [availableLocations]);
  const cityOptions = useMemo(
    () => (state.country && availableLocations ? availableLocations[state.country] || [] : []),
    [state.country, availableLocations]
  );

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handlePlatform = useCallback((e) => {
    dispatch({ type: 'SET_PLATFORM', payload: e.target.value });
  }, []);

  const handleKeyword = useCallback((e) => {
    dispatch({ type: 'SET_KEYWORD', payload: e.target.value });
  }, []);

  const handleHashtag = useCallback((e) => {
    dispatch({ type: 'SET_HASHTAG', payload: e.target.value });
  }, []);

  const handleAgeRange = useCallback((e) => {
    dispatch({ type: 'SET_AGE_RANGE', payload: e.target.value });
  }, []);

  const handleGender = useCallback((e) => {
    dispatch({ type: 'SET_GENDER', payload: e.target.value });
  }, []);

  const handleCreditTier = useCallback((e) => {
    dispatch({ type: 'SET_CREDIT_TIER', payload: e.target.value });
  }, []);

  const handleCountry = useCallback((_e, value) => {
    dispatch({ type: 'SET_COUNTRY', payload: value });
  }, []);

  const handleCity = useCallback((_e, value) => {
    dispatch({ type: 'SET_CITY', payload: value });
  }, []);

  const handleInterests = useCallback((_e, value) => {
    dispatch({ type: 'SET_INTERESTS', payload: value });
  }, []);

  const handleRemoveFilter = useCallback(
    (type, value) => {
      if (type === 'REMOVE_INTEREST') {
        dispatch({ type: 'SET_INTERESTS', payload: state.interests.filter((i) => i !== value) });
      } else {
        dispatch({ type, payload: value });
      }
    },
    [state.interests]
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box sx={{ mt: 3 }}>
      {/* Row 1: Search + Platform */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        {/* Platform */}
        <Select
          value={state.platform}
          onChange={handlePlatform}
          size="medium"
          displayEmpty
          sx={{ minWidth: 180 }}
          IconComponent={() => null}
          endAdornment={
            <Iconify icon='line-md:chevron-down' width={40} height={40} color='#231F20' />
          }
        >
          {PLATFORMS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ height: 50 }}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>

        {/* Keyword search */}
        <Box
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            py: 1.5,
          }}
        >
          <InputBase
            fullWidth
            value={state.keyword}
            onChange={handleKeyword}
            placeholder="Keywords"
            sx={{ fontSize: 14 }}
          />
        </Box>

        {/* Hashtag search */}
        <Box
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            py: 1.5,
          }}
        >
          <InputBase
            fullWidth
            value={state.hashtag}
            onChange={handleHashtag}
            placeholder="Hashtags"
            sx={{ fontSize: 14 }}
          />
        </Box>

        {/* Gender */}
        <Select
          value={state.gender}
          onChange={handleGender}
          size="medium"
          displayEmpty
          sx={{ minWidth: 170 }}
          IconComponent={() => null}
          endAdornment={
            <Iconify icon='line-md:chevron-down' width={40} height={40} color='#231F20' />
          }
          renderValue={(selected) => {
            if (!selected) return <Typography sx={{ color: 'text.disabled', fontSize: 14 }}>Gender</Typography>;
            return selected;
          }}
        >
          {GENDERS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ height: 50 }}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>

        {/* Age Range */}
        <Select
          value={state.ageRange}
          onChange={handleAgeRange}
          size="medium"
          displayEmpty
          sx={{ minWidth: 170 }}
          IconComponent={() => null}
          endAdornment={
            <Iconify icon='line-md:chevron-down' width={40} height={40} color='#231F20' />
          }
          renderValue={(selected) => {
            if (!selected) return <Typography sx={{ color: 'text.disabled', fontSize: 14 }}>Age Range</Typography>;
            return selected;
          }}
        >
          {AGE_RANGES.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ height: 50 }}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      {/* Row 2: All other filters */}
      <Stack direction="row" spacing={1} alignItems="start" sx={{ mb: 1 }}>
        {/* Country */}
        <Autocomplete
          value={state.country}
          onChange={handleCountry}
          options={countryOptions}
          size="medium"
          fullWidth
          popupIcon={<Iconify icon="line-md:chevron-down" width={21} height={21} color="#231F20" />}
          renderInput={(params) => <TextField {...params} placeholder="Creator Country" />}
          ListboxProps={{
            style: {
              maxHeight: 500
            }
          }}
        />

        {/* City */}
        <Autocomplete
          value={state.city}
          onChange={handleCity}
          options={cityOptions}
          size="medium"
          disabled={!state.country}
          fullWidth
          popupIcon={<Iconify icon="line-md:chevron-down" width={21} height={21} color="#231F20" />}
          renderInput={(params) => (
            <TextField {...params} placeholder={state.country ? 'City' : 'Creator City - Select Country'} />
          )}
        />

        {/* Interests (multi-select) */}
        <Select
          multiple
          value={state.interests}
          onChange={(e) => handleInterests(null, e.target.value)}
          size="medium"
          displayEmpty
          fullWidth
          sx={{
            minWidth: 240,
            flex: 1,
            maxHeight: 53.5,
            '& .MuiSelect-select': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            },
          }}
          MenuProps={{
            style: {
              maxHeight: 500
            }
          }}  
          IconComponent={() => null}
          endAdornment={
            <Iconify icon="line-md:chevron-down" width={30} height={30} color="#231F20" />
          }
          renderValue={(selected) => {
            if (!selected || selected.length === 0) {
              return <Typography sx={{ color: 'text.disabled', fontSize: 14 }}>Interests</Typography>;
            }
            return selected.join(', ');
          }}
        >
          {interestsLists.map((interest) => (
            <MenuItem key={interest} value={interest} sx={{ height: 50 }}>
              {interest}
            </MenuItem>
          ))}
        </Select>

        {/* Credit Tier */}
        <Select
          value={state.creditTier}
          onChange={handleCreditTier}
          size="medium"
          displayEmpty
          sx={{ minWidth: 170 }}
          IconComponent={() => null}
          endAdornment={
            <Iconify icon='line-md:chevron-down' width={40} height={40} color='#231F20' />
          }
          renderValue={(selected) => {
            if (!selected)
              return <Typography sx={{ color: 'text.disabled', fontSize: 14 }}>Credit Tier</Typography>;
            const tier = CREDIT_TIERS.find((t) => t.value === selected);
            return tier ? tier.label : selected;
          }}
        >
          {CREDIT_TIERS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ height: 50 }}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>

        {/* Show Results Button */}
        {showButton && (
          <Button
            variant="contained"
            onClick={onShowResults}
            disabled={isCountLoading}
            sx={{
              minWidth: 170,
              bgcolor: '#1340FF',
              '&:hover': { bgcolor: '#0F30D4' },
              textTransform: 'none',
              borderRadius: 1,
              fontSize: 14,
              fontWeight: 600,
              minHeight: 53.5,
              boxShadow: '0px -3px 0px 0px #00000073 inset'
            }}
          >
            {isCountLoading
              ? 'Searching creators...'
              : resultCount != null
              ? `Show ${resultCount} Creator${resultCount !== 1 ? 's' : ''}`
              : 'Show Results'}
          </Button>
        )}
      </Stack>

      {/* Active Filter Pills */}
      <FilterPills filters={state} onRemoveFilter={handleRemoveFilter} />
    </Box>
  );
});

DiscoveryFilterBar.displayName = 'DiscoveryFilterBar';

DiscoveryFilterBar.propTypes = {
  onFiltersChange: PropTypes.func.isRequired,
  availableLocations: PropTypes.object,
  resultCount: PropTypes.number,
  isCountLoading: PropTypes.bool,
  onShowResults: PropTypes.func,
  showButton: PropTypes.bool,
};

export default DiscoveryFilterBar;
