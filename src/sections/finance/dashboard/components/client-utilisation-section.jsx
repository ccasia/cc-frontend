import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import Iconify from 'src/components/iconify';

import ClientCard from './client-card';
import { CARD_BORDER, maxUtilisation } from '../utils';

// ----------------------------------------------------------------------

const THRESHOLDS = [
  { value: 'all', label: 'All' },
  { value: 50, label: '≥ 50%' },
  { value: 75, label: '≥ 75%' },
  { value: 90, label: '≥ 90%' },
];

export default function ClientUtilisationSection({ clients, onViewBreakdown }) {
  const [search, setSearch] = useState('');
  const [threshold, setThreshold] = useState(75);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return clients.filter((client) => {
      if (query && !client.companyName.toLowerCase().includes(query)) return false;
      if (threshold !== 'all' && maxUtilisation(client) < threshold) return false;
      return true;
    });
  }, [clients, search, threshold]);

  const emptyMessage = clients.length === 0 ? 'No active packages' : 'No clients match';

  return (
    <Card
      sx={{
        p: { xs: 2, md: 3 },
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 2,
        bgcolor: 'common.white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              bgcolor: '#FFF7E0',
              color: '#B76E00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Iconify icon="mdi:credit-card-clock-outline" width={24} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
              Client credit utilisation
            </Typography>
            <Typography variant="body2" sx={{ color: '#637381' }}>
              Bill clients before their credits run out.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexShrink: 0 }}>
          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search client"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: 1, sm: 220 },
              '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'common.white' },
            }}
          />

          <Typography variant="body2" sx={{ color: '#637381', whiteSpace: 'nowrap' }}>
            Show utilised
          </Typography>

          <Select
            size="small"
            value={threshold}
            onChange={(event) => setThreshold(event.target.value)}
            sx={{ minWidth: 96, borderRadius: 1.5, bgcolor: 'common.white' }}
          >
            {THRESHOLDS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </Stack>

      {filtered.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Iconify icon="mdi:package-variant" width={40} sx={{ color: '#C4CDD5', mb: 1 }} />
          <Typography variant="subtitle1" sx={{ color: '#637381' }}>
            {emptyMessage}
          </Typography>
          {clients.length > 0 && (
            <Typography variant="body2" sx={{ color: '#919EAB' }}>
              Try a different search or lower the utilisation threshold.
            </Typography>
          )}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((client) => (
            <Grid key={client.companyId} item xs={12} md={6}>
              <ClientCard client={client} onViewBreakdown={onViewBreakdown} />
            </Grid>
          ))}
        </Grid>
      )}
    </Card>
  );
}

ClientUtilisationSection.propTypes = {
  clients: PropTypes.array.isRequired,
  onViewBreakdown: PropTypes.func.isRequired,
};
