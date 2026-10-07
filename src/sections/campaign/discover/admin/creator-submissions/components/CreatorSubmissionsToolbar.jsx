import React from 'react';

import { Box, Stack, TextField, InputAdornment } from '@mui/material';

import { STATUS_COLORS } from 'src/contants/statusColors';

import Iconify from 'src/components/iconify';

import FilterDropdown from './FilterDropdown';
import {
  setSearch,
  setTypeFilter,
  setStatusFilter,
  useCreatorSubmissionsStore,
} from '../store/useCreatorSubmissionsStore';

// TODO: this app's real submission statuses (src/contants/statusColors.js) cover several
// different flows at once (draft review, posting-link approval, client approval). Confirm which
// subset actually applies to this board before shipping — for now every status is listed.
const toTitleCase = (value) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  ...Object.keys(STATUS_COLORS).map((status) => ({
    value: status,
    label: toTitleCase(status),
  })),
];

// Submission content types — matches the label set already used elsewhere in the admin area
// (see ClientFeedbacksModal.jsx / DraftsPendingModal.jsx), so "type" means the same thing here
// as it does on the other admin dashboards.
const TYPE_LABEL = {
  FIRST_DRAFT: 'First Draft',
  FINAL_DRAFT: 'Final Draft',
  POSTING: 'Posting Link',
  VIDEO: 'Video',
  PHOTO: 'Photo',
  RAW_FOOTAGE: 'Raw Footage',
};

const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  ...Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label })),
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
