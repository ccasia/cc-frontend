import React from 'react';

import { Box, Stack, TextField, InputAdornment, IconButton } from '@mui/material';

import Iconify from 'src/components/iconify';

import FilterDropdown from './FilterDropdown';
import { TYPE_LABEL, TYPE_ORDER, STATUS_CHIP } from '../constants';
import {
  setSearch,
  setTypeFilter,
  setStatusFilter,
  useCreatorSubmissionsStore,
} from '../store/use-creator-submissions-store';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  ...Object.entries(STATUS_CHIP).map(([value, { label }]) => ({ value, label })),
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  ...TYPE_ORDER.map((value) => ({ value, label: TYPE_LABEL[value] })),
];

const CreatorSubmissionsToolbar = () => {
  const search = useCreatorSubmissionsStore((state) => state.search);
  const statusFilter = useCreatorSubmissionsStore((state) => state.statusFilter);
  const typeFilter = useCreatorSubmissionsStore((state) => state.typeFilter);

  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Box>
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
        options={STATUS_OPTIONS}
        value={statusFilter}
        onChange={setStatusFilter}
        clearLabel="Clear status filter"
        fallbackLabel="Status"
      />

      <FilterDropdown
        options={TYPE_OPTIONS}
        value={typeFilter}
        onChange={setTypeFilter}
        clearLabel="Clear type filter"
        fallbackLabel="Type"
      />
    </Stack>
  );
};

export default CreatorSubmissionsToolbar;
