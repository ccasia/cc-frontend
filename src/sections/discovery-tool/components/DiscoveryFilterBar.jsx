import PropTypes from 'prop-types';
import React, { useMemo, useState, useEffect, useReducer, useCallback } from 'react';

import {
  Box,
  Stack,
  Button,
  Drawer,
  Select,
  MenuItem,
  InputBase,
  TextField,
  Typography,
  Autocomplete,
} from '@mui/material';

import { interestsLists } from 'src/contants/interestLists';

import FilterPills from './FilterPills';
import {
  GENDERS,
  LANGUAGES,
  PLATFORMS,
  AGE_RANGES,
  CREDIT_TIERS,
  filterReducer,
  FILTER_INITIAL_STATE,
} from '../constants';

const DropdownChevronIcon = ({ sx, color = '#231F20', ...other }) => (
  <Box
    {...other}
    component="svg"
    viewBox="0 0 24 24"
    sx={{
      ...sx,
      width: 24,
      height: 24,
      minWidth: 24,
      right: 12,
      color,
      pointerEvents: 'none',
    }}
  >
    <path
      d="M6 9L12 15L18 9"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Box>
);

DropdownChevronIcon.propTypes = {
  color: PropTypes.string,
  sx: PropTypes.object,
};

// ─── Component ────────────────────────────────────────────────────────────────

const DiscoveryFilterBar = React.memo(({ onFiltersChange, availableLocations }) => {
  const [state, dispatch] = useReducer(filterReducer, FILTER_INITIAL_STATE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
      languages: state.languages,
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
    state.languages,
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

  const handleLanguages = useCallback((_e, value) => {
    dispatch({ type: 'SET_LANGUAGES', payload: value });
  }, []);

  const handleOpenMobileFilters = useCallback(() => {
    setMobileFiltersOpen(true);
  }, []);

  const handleCloseMobileFilters = useCallback(() => {
    setMobileFiltersOpen(false);
  }, []);

  const handleClearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const handleRemoveFilter = useCallback(
    (type, value) => {
      if (type === 'REMOVE_INTEREST') {
        dispatch({ type: 'SET_INTERESTS', payload: state.interests.filter((i) => i !== value) });
      } else if (type === 'REMOVE_LANGUAGE') {
        dispatch({ type: 'SET_LANGUAGES', payload: state.languages.filter((language) => language !== value) });
      } else {
        dispatch({ type, payload: value });
      }
    },
    [state.interests, state.languages]
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  const chevronIcon = (color = '#231F20') => (
    <DropdownChevronIcon color={color} sx={{ flexShrink: 0 }} />
  );

  const inputTextSx = {
    fontSize: 14,
    lineHeight: '18px',
    color: '#231F20',
    '&::placeholder': {
      color: '#B0B0B0',
      opacity: 1,
    },
  };

  const filterControlSx = {
    height: 48,
    bgcolor: '#FFFFFF',
    borderRadius: '8px',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#EBEBEB',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#EBEBEB',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#EBEBEB',
      borderWidth: 1,
    },
    '& .MuiSelect-select': {
      display: 'flex',
      alignItems: 'center',
      minHeight: 'auto !important',
      height: 18,
      py: '15px',
      pl: '14px',
      pr: '44px !important',
      fontSize: 14,
      lineHeight: '18px',
      color: '#231F20',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '&, & .MuiSelect-select': {
      cursor: 'pointer',
    },
    '& .MuiSelect-icon': {
      top: 'calc(50% - 12px)',
      right: 12,
      width: 24,
      height: 24,
      color: '#231F20',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      right: 10,
      width: 28,
      height: 28,
      borderRadius: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      transition: 'background-color 150ms ease',
    },
    '&:hover::after': {
      bgcolor: 'rgba(0, 0, 0, 0.04)',
    },
  };

  const placeholderSx = {
    color: '#B0B0B0',
    fontSize: 14,
    lineHeight: '18px',
    fontWeight: 400,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const autocompleteSx = {
    '& .MuiOutlinedInput-root': {
      height: 48,
      bgcolor: '#FFFFFF',
      borderRadius: '8px',
      py: 0,
      pl: '14px',
      pr: '12px !important',
      '& fieldset': {
        borderColor: '#EBEBEB',
      },
      '&:hover fieldset': {
        borderColor: '#EBEBEB',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#EBEBEB',
        borderWidth: 1,
      },
    },
    '& .MuiOutlinedInput-input': {
      ...inputTextSx,
      p: '0 !important',
    },
    '& .MuiInputBase-input::placeholder': {
      color: '#B0B0B0',
      opacity: 1,
    },
    '& .MuiAutocomplete-popupIndicator': {
      width: 28,
      height: 28,
      mr: '-6px',
      color: '#231F20',
    },
    '& .MuiAutocomplete-popupIndicator svg': {
      width: 24,
      height: 24,
      color: '#231F20',
    },
  };

  const textInputSx = {
    height: 48,
    border: '1px solid #EBEBEB',
    borderRadius: '8px',
    bgcolor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    px: '14px',
  };

  const fixedFieldSx = (width) => ({
    width: { xs: '100%', sm: 'calc(50% - 6px)', lg: width },
    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 6px)', lg: `0 0 ${width}px` },
    minWidth: 0,
  });

  const flexibleFieldSx = {
    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 6px)', lg: '1 1 0' },
    minWidth: 0,
  };

  const rowSx = {
    width: 1,
    flexWrap: 'wrap',
    gap: '12px',
  };

  const mobileAdvancedFilterCount = [
    state.ageRange,
    state.country,
    state.city,
    state.gender,
    state.creditTier,
    state.languages.length,
    state.interests.length,
  ].filter(Boolean).length;

  return (
    <Box sx={{ mt: 3 }}>
      <Stack spacing="9px" sx={{ display: { xs: 'flex', sm: 'none' }, width: 1 }}>
        <Select
          value={state.platform}
          onChange={handlePlatform}
          size="medium"
          displayEmpty
          sx={{ ...filterControlSx, width: 1 }}
          IconComponent={DropdownChevronIcon}
        >
          {PLATFORMS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ height: 50 }}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>

        <Box sx={{ ...textInputSx, width: 1 }}>
          <InputBase
            fullWidth
            value={state.keyword}
            onChange={handleKeyword}
            placeholder="Keywords"
            sx={inputTextSx}
          />
        </Box>

        <Box sx={{ ...textInputSx, width: 1 }}>
          <InputBase
            fullWidth
            value={state.hashtag}
            onChange={handleHashtag}
            placeholder="Hashtags"
            sx={inputTextSx}
          />
        </Box>

        <Button
          variant="outlined"
          onClick={handleOpenMobileFilters}
          sx={{
            height: 48,
            justifyContent: 'space-between',
            borderColor: '#EBEBEB',
            borderRadius: '8px',
            color: '#231F20',
            px: '14px',
            textTransform: 'none',
            fontSize: 14,
            fontWeight: 400,
            '&:hover': {
              borderColor: '#EBEBEB',
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
          endIcon={<DropdownChevronIcon />}
        >
          {mobileAdvancedFilterCount ? `Filters (${mobileAdvancedFilterCount})` : 'Filters'}
        </Button>
      </Stack>

      <Drawer
        anchor="bottom"
        open={mobileFiltersOpen}
        onClose={handleCloseMobileFilters}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '85vh',
          },
        }}
      >
        <Stack spacing={2} sx={{ p: 2.5, pb: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: '#231F20' }}>Filters</Typography>
            <Button onClick={handleClearAll} sx={{ color: '#231F20', textTransform: 'none' }}>
              Clear all
            </Button>
          </Stack>

          <Stack spacing="9px">
            <Select
              value={state.gender}
              onChange={handleGender}
              size="medium"
              displayEmpty
              sx={{ ...filterControlSx, width: 1 }}
              IconComponent={DropdownChevronIcon}
              renderValue={(selected) => {
                if (!selected) return <Typography sx={placeholderSx}>Creator Gender</Typography>;
                return selected;
              }}
            >
              {GENDERS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value} sx={{ height: 50 }}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>

            <Select
              multiple
              value={state.languages}
              onChange={(e) => handleLanguages(null, e.target.value)}
              size="medium"
              displayEmpty
              sx={{ ...filterControlSx, width: 1 }}
              MenuProps={{ style: { maxHeight: 500 } }}
              IconComponent={DropdownChevronIcon}
              renderValue={(selected) => {
                if (!selected || selected.length === 0) {
                  return <Typography sx={placeholderSx}>Creator Language</Typography>;
                }
                return selected.join(', ');
              }}
            >
              {LANGUAGES.map((language) => (
                <MenuItem key={language} value={language} sx={{ height: 50 }}>
                  {language}
                </MenuItem>
              ))}
            </Select>

            <Autocomplete
              value={state.country}
              onChange={handleCountry}
              options={countryOptions}
              size="medium"
              sx={{ ...autocompleteSx, width: 1 }}
              popupIcon={chevronIcon()}
              renderInput={(params) => <TextField {...params} placeholder="Creator Country" />}
              ListboxProps={{ style: { maxHeight: 500 } }}
            />

            <Autocomplete
              value={state.city}
              onChange={handleCity}
              options={cityOptions}
              size="medium"
              disabled={!state.country}
              sx={{ ...autocompleteSx, width: 1 }}
              popupIcon={chevronIcon(state.country ? '#231F20' : '#B0B0B0')}
              renderInput={(params) => (
                <TextField {...params} placeholder={state.country ? 'Creator City' : 'Creator City - Select Country'} />
              )}
            />

            <Select
              multiple
              value={state.interests}
              onChange={(e) => handleInterests(null, e.target.value)}
              size="medium"
              displayEmpty
              sx={{ ...filterControlSx, width: 1 }}
              MenuProps={{ style: { maxHeight: 500 } }}
              IconComponent={DropdownChevronIcon}
              renderValue={(selected) => {
                if (!selected || selected.length === 0) {
                  return <Typography sx={placeholderSx}>Creator Industry</Typography>;
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

            <Select
              value={state.ageRange}
              onChange={handleAgeRange}
              size="medium"
              displayEmpty
              sx={{ ...filterControlSx, width: 1 }}
              IconComponent={DropdownChevronIcon}
              renderValue={(selected) => {
                if (!selected) return <Typography sx={placeholderSx}>Creator Age</Typography>;
                return selected;
              }}
            >
              {AGE_RANGES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value} sx={{ height: 50 }}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>

            <Select
              value={state.creditTier}
              onChange={handleCreditTier}
              size="medium"
              displayEmpty
              sx={{ ...filterControlSx, width: 1 }}
              IconComponent={DropdownChevronIcon}
              renderValue={(selected) => {
                if (!selected) return <Typography sx={placeholderSx}>Creator Tier</Typography>;
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
          </Stack>

          <Button
            variant="contained"
            onClick={handleCloseMobileFilters}
            sx={{
              height: 48,
              bgcolor: '#231F20',
              borderRadius: '8px',
              textTransform: 'none',
              '&:hover': { bgcolor: '#231F20' },
            }}
          >
            Apply Filters
          </Button>
        </Stack>
      </Drawer>

      <Stack spacing="9px" sx={{ display: { xs: 'none', sm: 'flex' }, width: 1 }}>
      {/* Row 1: Search + Platform */}
      <Stack direction="row" alignItems="center" useFlexGap sx={rowSx}>
        {/* Platform */}
        <Select
          value={state.platform}
          onChange={handlePlatform}
          size="medium"
          displayEmpty
          sx={{ ...filterControlSx, ...fixedFieldSx(149) }}
          IconComponent={DropdownChevronIcon}
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
            ...textInputSx,
            ...flexibleFieldSx,
          }}
        >
          <InputBase
            fullWidth
            value={state.keyword}
            onChange={handleKeyword}
            placeholder="Keywords"
            sx={inputTextSx}
          />
        </Box>

        {/* Hashtag search */}
        <Box
          sx={{
            ...textInputSx,
            ...fixedFieldSx(242),
          }}
        >
          <InputBase
            fullWidth
            value={state.hashtag}
            onChange={handleHashtag}
            placeholder="Hashtags"
            sx={inputTextSx}
          />
        </Box>

        {/* Gender */}
        <Select
          value={state.gender}
          onChange={handleGender}
          size="medium"
          displayEmpty
          sx={{ ...filterControlSx, ...fixedFieldSx(210) }}
          IconComponent={DropdownChevronIcon}
          renderValue={(selected) => {
            if (!selected) return <Typography sx={placeholderSx}>Creator Gender</Typography>;
            return selected;
          }}
        >
          {GENDERS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ height: 50 }}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>

        {/* Languages */}
        <Select
          multiple
          value={state.languages}
          onChange={(e) => handleLanguages(null, e.target.value)}
          size="medium"
          displayEmpty
          sx={{ ...filterControlSx, ...fixedFieldSx(210) }}
          MenuProps={{
            style: {
              maxHeight: 500,
            }
          }}
          IconComponent={DropdownChevronIcon}
          renderValue={(selected) => {
            if (!selected || selected.length === 0) {
              return <Typography sx={placeholderSx}>Creator Language</Typography>;
            }
            return selected.join(', ');
          }}
        >
          {LANGUAGES.map((language) => (
            <MenuItem key={language} value={language} sx={{ height: 50 }}>
              {language}
            </MenuItem>
          ))}
        </Select>

      </Stack>

      {/* Row 2: All other filters */}
      <Stack direction="row" alignItems="center" useFlexGap sx={rowSx}>
        {/* Country */}
        <Autocomplete
          value={state.country}
          onChange={handleCountry}
          options={countryOptions}
          size="medium"
          sx={{ ...autocompleteSx, ...fixedFieldSx(225) }}
          popupIcon={chevronIcon()}
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
          sx={{ ...autocompleteSx, ...fixedFieldSx(237) }}
          popupIcon={chevronIcon(state.country ? '#231F20' : '#B0B0B0')}
          renderInput={(params) => (
            <TextField {...params} placeholder={state.country ? 'Creator City' : 'Creator City - Select Country'} />
          )}
        />

        {/* Interests (multi-select) */}
        <Select
          multiple
          value={state.interests}
          onChange={(e) => handleInterests(null, e.target.value)}
          size="medium"
          displayEmpty
          sx={{ ...filterControlSx, ...fixedFieldSx(260) }}
          MenuProps={{
            style: {
              maxHeight: 500,
            }
          }}  
          IconComponent={DropdownChevronIcon}
          renderValue={(selected) => {
            if (!selected || selected.length === 0) {
              return <Typography sx={placeholderSx}>Creator Industry</Typography>;
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

        {/* Age Range */}
        <Select
          value={state.ageRange}
          onChange={handleAgeRange}
          size="medium"
          displayEmpty
          sx={{ ...filterControlSx, ...flexibleFieldSx }}
          IconComponent={DropdownChevronIcon}
          renderValue={(selected) => {
            if (!selected) return <Typography sx={placeholderSx}>Creator Age</Typography>;
            return selected;
          }}
        >
          {AGE_RANGES.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ height: 50 }}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>

        {/* Credit Tier */}
        <Select
          value={state.creditTier}
          onChange={handleCreditTier}
          size="medium"
          displayEmpty
          sx={{ ...filterControlSx, ...flexibleFieldSx }}
          IconComponent={DropdownChevronIcon}
          renderValue={(selected) => {
            if (!selected)
              return <Typography sx={placeholderSx}>Creator Tier</Typography>;
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

      </Stack>
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
};

export default DiscoveryFilterBar;
