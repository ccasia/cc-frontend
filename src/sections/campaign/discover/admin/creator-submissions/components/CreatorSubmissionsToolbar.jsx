import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

import { Box, Stack, TextField, IconButton, InputAdornment } from '@mui/material';

import Iconify from 'src/components/iconify';

import FilterDropdown from './FilterDropdown';
import { TYPE_LABEL, TYPE_ORDER, STATUS_CHIP } from '../utils/constants';
import {
  setSearch,
  setTypeFilter,
  setStatusFilter,
  useCreatorSubmissionsStore,
} from '../store/use-creator-submissions-store';

const withCount = (label, count) => `${label} (${count ?? 0})`;

const CreatorSubmissionsToolbar = ({ counts }) => {
  const search = useCreatorSubmissionsStore((state) => state.search);
  const statusFilter = useCreatorSubmissionsStore((state) => state.statusFilter);
  const typeFilter = useCreatorSubmissionsStore((state) => state.typeFilter);

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All' },
      ...Object.entries(STATUS_CHIP).map(([value, { label }]) => ({
        value,
        label: withCount(label, counts.status[value]),
      })),
    ],
    [counts.status]
  );

  const typeOptions = useMemo(
    () => [
      { value: 'all', label: 'All' },
      ...TYPE_ORDER.map((value) => ({
        value,
        label: withCount(TYPE_LABEL[value], counts.type[value]),
      })),
    ],
    [counts.type]
  );

  return (
    <Stack direction="row" alignItems="center" flexWrap="wrap" useFlexGap spacing={1.5}>
      <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
        <TextField
          placeholder="Search creators..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            width: { xs: '100%', sm: 300 },
            '& .MuiOutlinedInput-root': {
              bgcolor: '#FFFFFF',
              border: '1.5px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1.15,
              height: 44,
              fontSize: '0.85rem',
              '& fieldset': {
                border: 'none',
              },
              '&.Mui-focused': {
                border: '1.5px solid #e7e7e7',
                borderBottom: '3px solid #e7e7e7',
              },
            },
            '& .MuiOutlinedInput-input': {
              py: 1.25,
              px: 0,
              color: '#637381',
              fontWeight: 600,
              '&::placeholder': {
                color: '#637381',
                opacity: 1,
                fontWeight: 400,
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" width={18} sx={{ color: '#637381' }} />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearch('')}>
                  <Iconify icon="fa7-solid:remove" width={14} sx={{ color: '#637381' }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <FilterDropdown
        options={statusOptions}
        value={statusFilter}
        onChange={setStatusFilter}
        clearLabel="Clear status filter"
        fallbackLabel="Submission Status"
      />

      <FilterDropdown
        options={typeOptions}
        value={typeFilter}
        onChange={setTypeFilter}
        clearLabel="Clear type filter"
        fallbackLabel="Submission Type"
      />
    </Stack>
  );
};

export default CreatorSubmissionsToolbar;

CreatorSubmissionsToolbar.propTypes = {
  counts: PropTypes.shape({
    status: PropTypes.object.isRequired,
    type: PropTypes.object.isRequired,
  }).isRequired,
};
