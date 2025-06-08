import PropTypes from 'prop-types';
import { useCallback } from 'react';

import {
  Box,
  Chip,
  Stack,
  Select,
  Button,
  MenuItem,
  Checkbox,
  InputBase,
  Typography,
  FormControl,
  OutlinedInput,
} from '@mui/material';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function CreatorTableToolbar({
  filters,
  onFilters,
  onResetFilters,
  ageRange,
  onAgeRangeChange,
  pronounceOptions,
  results,
}) {
  const handleFilterName = useCallback(
    (event) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  // Check if any filters are active
  const hasActiveFilters = filters.name || filters.pronounce.length > 0 || filters.status !== 'all';

  return (
    <Box>
      {/* Main Toolbar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 1.5, md: 1.5 },
        }}
      >
        {/* Search Box */}
        <Box
          sx={{
            width: { xs: '100%', sm: '240px', md: '320px' },
            border: '1px solid #e7e7e7',
            borderRadius: 0.75,
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            height: '38px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            '&:hover': {
              borderColor: '#1340ff',
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 8px rgba(19, 64, 255, 0.1)',
            },
            '&:focus-within': {
              borderColor: '#1340ff',
              boxShadow: '0 0 0 3px rgba(19, 64, 255, 0.1)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          <InputBase
            value={filters.name}
            onChange={handleFilterName}
            placeholder="Search creators..."
            startAdornment={
              <Iconify
                icon="heroicons:magnifying-glass-20-solid"
                sx={{
                  width: 18,
                  height: 18,
                  color: 'text.disabled',
                  ml: 1.5,
                  mr: 1,
                  transition: 'color 0.2s ease',
                }}
              />
            }
            sx={{
              width: '100%',
              color: 'text.primary',
              fontSize: '0.95rem',
              '& input': {
                py: 1,
                px: 1,
                height: '100%',
                transition: 'all 0.2s ease',
                '&::placeholder': {
                  color: '#999999',
                  opacity: 1,
                  transition: 'color 0.2s ease',
                },
                '&:focus::placeholder': {
                  color: '#cccccc',
                },
              },
            }}
          />
        </Box>

        {/* Right Side Controls */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {/* Pronouns Filter */}
          <Box
            sx={{
              width: { xs: '100%', sm: '200px' },
              minWidth: { xs: '100%', sm: '200px' },
              maxWidth: { xs: '100%', sm: '200px' },
              border: '1px solid #e7e7e7',
              borderRadius: 0.75,
              bgcolor: 'background.paper',
              height: '38px',
              transition: 'border-color 0.2s ease',
              '&:hover': {
                borderColor: '#1340ff',
              },
            }}
          >
            <FormControl fullWidth size="small">
              <Select
                multiple
                value={filters.pronounce}
                onChange={(event) => onFilters('pronounce', event.target.value)}
                input={<OutlinedInput />}
                displayEmpty
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return (
                      <Box sx={{ 
                        color: '#999999', 
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%',
                      }}>
                        Filter by pronouns
                      </Box>
                    );
                  }
                  return selected.join(', ');
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: 'white',
                      border: '1px solid #e7e7e7',
                      borderRadius: 1,
                      mt: 0.5,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      maxHeight: 240,
                    },
                  },
                }}
                sx={{
                  height: '100%',
                  '& .MuiSelect-select': {
                    py: 1,
                    px: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: 'unset',
                    fontSize: '0.875rem',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '& .MuiSelect-icon': {
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: filters.pronounce.length > 0 ? '#1340ff' : 'text.secondary',
                    transition: 'color 0.2s ease',
                  },
                }}
              >
                {pronounceOptions.map((option) => (
                  <MenuItem
                    key={option}
                    value={option}
                    sx={{
                      mx: 0.5,
                      my: 0.25,
                      borderRadius: 0.75,
                      fontSize: '0.875rem',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(19, 64, 255, 0.08) !important',
                        color: '#1340ff',
                        '&:hover': {
                          bgcolor: 'rgba(19, 64, 255, 0.12)',
                        },
                      },
                      '&:hover': {
                        bgcolor: 'rgba(19, 64, 255, 0.04)',
                      },
                    }}
                  >
                    <Checkbox
                      disableRipple
                      size="small"
                      checked={filters.pronounce.includes(option)}
                      sx={{
                        mr: 1,
                        '&.Mui-checked': {
                          color: '#1340ff',
                        },
                      }}
                    />
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Results Count - Only show when filters are active */}
          {hasActiveFilters && results !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 'fit-content' }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                <strong style={{ color: '#374151' }}>{results}</strong> results
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Box sx={{ mt: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {/* Search Term Chip */}
            {filters.name && (
              <Chip
                label={`Search: "${filters.name}"`}
                size="small"
                onDelete={() => onFilters('name', '')}
                sx={{
                  bgcolor: '#f0f9ff',
                  color: '#1340ff',
                  border: '1px solid rgba(19, 64, 255, 0.2)',
                  height: '32px',
                  '& .MuiChip-deleteIcon': {
                    color: '#1340ff',
                    '&:hover': {
                      color: '#0f35d1',
                    },
                  },
                }}
              />
            )}

            {/* Status Chip */}
            {filters.status !== 'all' && (
              <Chip
                label={`Status: ${filters.status}`}
                size="small"
                onDelete={() => onFilters('status', 'all')}
                sx={{
                  bgcolor: '#f0f9ff',
                  color: '#1340ff',
                  border: '1px solid rgba(19, 64, 255, 0.2)',
                  height: '32px',
                  '& .MuiChip-deleteIcon': {
                    color: '#1340ff',
                    '&:hover': {
                      color: '#0f35d1',
                    },
                  },
                }}
              />
            )}

            {/* Pronouns Chips */}
            {filters.pronounce.map((pronoun) => (
              <Chip
                key={pronoun}
                label={`Pronouns: ${pronoun}`}
                size="small"
                onDelete={() => {
                  const newPronounce = filters.pronounce.filter((p) => p !== pronoun);
                  onFilters('pronounce', newPronounce);
                }}
                sx={{
                  bgcolor: '#f0f9ff',
                  color: '#1340ff',
                  border: '1px solid rgba(19, 64, 255, 0.2)',
                  height: '32px',
                  '& .MuiChip-deleteIcon': {
                    color: '#1340ff',
                    '&:hover': {
                      color: '#0f35d1',
                    },
                  },
                }}
              />
            ))}

            {/* Clear All Button */}
            <Button
              size="small"
              onClick={onResetFilters}
              startIcon={<Iconify icon="heroicons:trash-20-solid" width={14} height={14} />}
              sx={{
                color: '#dc3545',
                bgcolor: 'rgba(220, 53, 69, 0.08)',
                border: '1px solid rgba(220, 53, 69, 0.2)',
                borderRadius: 0.75,
                px: 1.5,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'none',
                height: '32px',
                '&:hover': {
                  bgcolor: 'rgba(220, 53, 69, 0.12)',
                  borderColor: 'rgba(220, 53, 69, 0.3)',
                },
              }}
            >
              Clear
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

CreatorTableToolbar.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  onResetFilters: PropTypes.func,
  ageRange: PropTypes.array,
  onAgeRangeChange: PropTypes.func,
  pronounceOptions: PropTypes.array,
  results: PropTypes.number,
};
