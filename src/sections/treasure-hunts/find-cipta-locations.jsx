import { useState } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';

import { useBoolean } from 'src/hooks/use-boolean';

import { reorderTreasureHuntLocations } from 'src/api/treasure-hunts';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content/empty-content';

import FindCiptaLocationRow from './find-cipta-location-row';
import FindCiptaLocationForm from './find-cipta-location-form';
import {
  INK,
  MUTED,
  headerCellSx,
  searchFieldSx,
  primaryButtonSx,
  lastHeaderCellSx,
  tableContainerSx,
  firstHeaderCellSx,
} from './find-cipta-shared';

// Doubles as the tab's summary: the counts answer "how ready are we?" without
// making anyone read the table row by row.
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'on', label: 'Switched on' },
  { value: 'needsQr', label: 'Needs a QR' },
];

const matchesFilter = (location, filter) => {
  if (filter === 'on') return location.isEnabled;
  if (filter === 'needsQr') return location.bitlyPublication?.status !== 'READY';
  return true;
};

const chipSx = (active) => ({
  height: 34,
  px: 1.75,
  borderRadius: 1.15,
  fontSize: '0.8rem',
  fontWeight: 600,
  textTransform: 'none',
  whiteSpace: 'nowrap',
  color: active ? '#fff' : MUTED,
  bgcolor: active ? INK : '#fff',
  border: '1.5px solid',
  borderColor: active ? INK : '#e7e7e7',
  borderBottom: '3px solid',
  borderBottomColor: active ? INK : '#e7e7e7',
  '&:hover': { bgcolor: active ? INK : '#f5f5f5', borderColor: active ? INK : '#d0d0d0' },
});

const getEmptyCopy = (query, filter) => {
  if (query) {
    return { title: 'No locations match that search', description: 'Try a different name or hint.' };
  }
  if (filter === 'on') {
    return {
      title: 'Nothing is switched on',
      description: 'Switch a spot on to make it collectable in the app.',
    };
  }
  if (filter === 'needsQr') {
    return {
      title: 'Every spot has a QR code',
      description: 'All locations are ready to print.',
    };
  }
  return {
    title: 'No locations yet',
    description: 'Add the first spot Cipta is hiding at, then generate its QR code.',
  };
};

export default function FindCiptaLocations({ hunt, mutate }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [reordering, setReordering] = useState(false);
  const form = useBoolean();

  const locations = [...(hunt.locations ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const query = search.trim().toLowerCase();

  const counts = {
    all: locations.length,
    on: locations.filter((l) => matchesFilter(l, 'on')).length,
    needsQr: locations.filter((l) => matchesFilter(l, 'needsQr')).length,
  };

  const visible = locations.filter((location) => {
    if (!matchesFilter(location, filter)) return false;
    if (!query) return true;
    return (
      location.name?.toLowerCase().includes(query) || location.hint?.toLowerCase().includes(query)
    );
  });

  // Reordering a narrowed list would move a row past spots that aren't on
  // screen, so the arrows stand down until the full order is visible.
  const canReorder = !query && filter === 'all';

  const handleAdd = () => {
    setEditing(null);
    form.onTrue();
  };

  const handleEdit = (location) => {
    setEditing(location);
    form.onTrue();
  };

  const handleMove = async (locationId, direction) => {
    const orderedIds = locations.map((location) => location.id);
    const from = orderedIds.indexOf(locationId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= orderedIds.length) return;

    orderedIds.splice(to, 0, orderedIds.splice(from, 1)[0]);

    try {
      setReordering(true);
      await reorderTreasureHuntLocations(hunt.id, orderedIds);
      await mutate();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to reorder locations.', { variant: 'error' });
    } finally {
      setReordering(false);
    }
  };

  const empty = getEmptyCopy(query, filter);

  return (
    <Box sx={{ width: '100%' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <TextField
            placeholder="Search by name or hint..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ ...searchFieldSx, width: { xs: '100%', sm: 260 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} sx={{ color: '#637381' }} />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {FILTERS.map((item) => (
              <Button
                key={item.value}
                disableRipple
                onClick={() => setFilter(item.value)}
                sx={chipSx(filter === item.value)}
              >
                {item.label}
                <Box
                  component="span"
                  sx={{ ml: 0.75, opacity: filter === item.value ? 0.7 : 0.55 }}
                >
                  {counts[item.value]}
                </Box>
              </Button>
            ))}
          </Stack>
        </Stack>

        <Button
          onClick={handleAdd}
          startIcon={<Iconify icon="mingcute:add-fill" width={16} />}
          sx={primaryButtonSx}
        >
          Add location
        </Button>
      </Stack>

      {visible.length === 0 ? (
        <EmptyContent title={empty.title} description={empty.description} sx={{ py: 10 }} />
      ) : (
        <TableContainer sx={tableContainerSx}>
          <Table size="medium" sx={{ minWidth: 1010, width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...firstHeaderCellSx, width: 96 }}>Order</TableCell>
                <TableCell sx={headerCellSx}>Location</TableCell>
                <TableCell sx={{ ...headerCellSx, width: 110 }} align="center">
                  Collected
                </TableCell>
                <TableCell sx={{ ...headerCellSx, width: 150 }}>Last collected</TableCell>
                <TableCell sx={{ ...headerCellSx, width: 120 }} align="center">
                  In the app
                </TableCell>
                <TableCell sx={{ ...headerCellSx, width: 260 }}>QR code</TableCell>
                <TableCell sx={{ ...lastHeaderCellSx, width: 100 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {visible.map((location) => (
                <FindCiptaLocationRow
                  key={location.id}
                  row={location}
                  huntId={hunt.id}
                  isFirst={locations[0]?.id === location.id}
                  isLast={locations[locations.length - 1]?.id === location.id}
                  canReorder={canReorder}
                  reordering={reordering}
                  onMove={handleMove}
                  onEdit={() => handleEdit(location)}
                  mutate={mutate}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {visible.length > 0 && (
        <Typography sx={{ color: MUTED, fontSize: '0.813rem', mt: 2 }}>
          Order sets how the spots are listed in the app&apos;s collectible grid.
          {!canReorder && ' Clear the search and filter to reorder them.'}
        </Typography>
      )}

      <FindCiptaLocationForm
        open={form.value}
        onClose={form.onFalse}
        huntId={hunt.id}
        location={editing}
        mutate={mutate}
      />
    </Box>
  );
}

FindCiptaLocations.propTypes = {
  hunt: PropTypes.object,
  mutate: PropTypes.func,
};
