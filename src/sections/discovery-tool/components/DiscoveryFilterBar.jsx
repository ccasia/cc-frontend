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
  InputAdornment,
} from '@mui/material';

import { interestsLists } from 'src/contants/interestLists';

import Iconify from 'src/components/iconify';

import {
  GENDERS,
  selectSx,
  PLATFORMS,
  AGE_RANGES,
  CREDIT_TIERS,
  filterReducer,
  FILTER_INITIAL_STATE,
} from '../constants';

// ─── Component ────────────────────────────────────────────────────────────────

const DiscoveryFilterBar = React.memo(({ onFiltersChange, availableLocations }) => {
  const [state, dispatch] = useReducer(filterReducer, FILTER_INITIAL_STATE);

  // Debounce keyword → debouncedKeyword
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_DEBOUNCED_KEYWORD', payload: state.keyword });
    }, 300);
    return () => clearTimeout(timer);
  }, [state.keyword]);

  // Notify parent whenever relevant filter state changes
  useEffect(() => {
    onFiltersChange({
      platform: state.platform,
      debouncedKeyword: state.debouncedKeyword,
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

  // Check if any filter is active (for showing Clear All)
  const hasActiveFilters = useMemo(
    () =>
      state.platform !== 'all' ||
      state.keyword !== '' ||
      state.ageRange !== '' ||
      state.country !== null ||
      state.city !== null ||
      state.gender !== '' ||
      state.creditTier !== '' ||
      state.interests.length > 0,
    [state]
  );

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handlePlatform = useCallback((e) => {
    dispatch({ type: 'SET_PLATFORM', payload: e.target.value });
  }, []);

  const handleKeyword = useCallback((e) => {
    dispatch({ type: 'SET_KEYWORD', payload: e.target.value });
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

  const handleClearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box sx={{ mt: 3 }}>
      {/* Row 1: Search + Platform */}
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
        {/* Keyword search */}
        <Box
          sx={{
            flex: 1,
            minWidth: 250,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            py: 0.5,
          }}
        >
          <InputAdornment position="start">
            <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', mr: 1 }} />
          </InputAdornment>
          <InputBase
            fullWidth
            value={state.keyword}
            onChange={handleKeyword}
            placeholder="Search by caption keyword..."
            sx={{ fontSize: 14 }}
          />
        </Box>

        {/* Platform */}
        <Select
          value={state.platform}
          onChange={handlePlatform}
          size="small"
          displayEmpty
          sx={selectSx}
        >
          {PLATFORMS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      {/* Row 2: All other filters */}
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
        {/* Gender */}
        <Select
          value={state.gender}
          onChange={handleGender}
          size="small"
          displayEmpty
          sx={selectSx}
          renderValue={(selected) => {
            if (!selected) return <Typography sx={{ color: 'text.disabled', fontSize: 14 }}>Gender</Typography>;
            return selected;
          }}
        >
          <MenuItem value="">
            <em>All Genders</em>
          </MenuItem>
          {GENDERS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>

        {/* Age Range */}
        <Select
          value={state.ageRange}
          onChange={handleAgeRange}
          size="small"
          displayEmpty
          sx={selectSx}
          renderValue={(selected) => {
            if (!selected) return <Typography sx={{ color: 'text.disabled', fontSize: 14 }}>Age Range</Typography>;
            return selected;
          }}
        >
          <MenuItem value="">
            <em>All Ages</em>
          </MenuItem>
          {AGE_RANGES.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>

        {/* Credit Tier */}
        <Select
          value={state.creditTier}
          onChange={handleCreditTier}
          size="small"
          displayEmpty
          sx={selectSx}
          renderValue={(selected) => {
            if (!selected)
              return <Typography sx={{ color: 'text.disabled', fontSize: 14 }}>Credit Tier</Typography>;
            const tier = CREDIT_TIERS.find((t) => t.value === selected);
            return tier ? tier.label : selected;
          }}
        >
          <MenuItem value="">
            <em>All Tiers</em>
          </MenuItem>
          {CREDIT_TIERS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>

        {/* Country */}
        <Autocomplete
          value={state.country}
          onChange={handleCountry}
          options={countryOptions}
          size="small"
          sx={{ minWidth: 180 }}
          renderInput={(params) => <TextField {...params} placeholder="Country" />}
        />

        {/* City */}
        <Autocomplete
          value={state.city}
          onChange={handleCity}
          options={cityOptions}
          size="small"
          disabled={!state.country}
          sx={{ minWidth: 180 }}
          renderInput={(params) => (
            <TextField {...params} placeholder={state.country ? 'City' : 'Select country first'} />
          )}
        />

        {/* Interests (multi-select) */}
        <Autocomplete
          multiple
          value={state.interests}
          onChange={handleInterests}
          options={interestsLists}
          size="small"
          limitTags={2}
          sx={{ minWidth: 250 }}
          renderInput={(params) => <TextField {...params} placeholder="Interests" />}
        />

        {/* Clear All */}
        {hasActiveFilters && (
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            onClick={handleClearAll}
            startIcon={<Iconify icon="solar:trash-bin-minimalistic-bold" />}
            sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            Clear All
          </Button>
        )}
      </Stack>
    </Box>
  );
});

DiscoveryFilterBar.displayName = 'DiscoveryFilterBar';

DiscoveryFilterBar.propTypes = {
  onFiltersChange: PropTypes.func.isRequired,
  availableLocations: PropTypes.object,
};

export default DiscoveryFilterBar;
