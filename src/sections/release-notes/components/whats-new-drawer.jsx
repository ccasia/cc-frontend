import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

import ReleaseTypeChip from './release-type-chip';
import { sortByType, RELEASE_TYPES, RELEASE_TYPE_META } from '../constants';

const FILTERS = [
  { value: 'all', label: 'All' },
  ...RELEASE_TYPES.map((type) => ({ value: type, label: RELEASE_TYPE_META[type].label })),
];

export default function WhatsNewDrawer({ open, onClose, releases, isLoading }) {
  const [filter, setFilter] = useState('all');

  // Grouped by release date; items ordered New > Improved > Fixed within each date
  const groups = useMemo(
    () =>
      releases
        .map((release) => ({
          ...release,
          items: sortByType(
            release.items.filter((item) => filter === 'all' || item.type === filter)
          ),
        }))
        .filter((release) => release.items.length),
    [releases, filter]
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{ sx: { width: 1, maxWidth: 600, borderRadius: '12px 0 0 0' } }}
    >
      <Stack direction="row" alignItems="center" sx={{ py: 2, pl: 3, pr: 3, minHeight: 68 }}>
        <Typography
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            fontSize: { md: 32, xs: 24 },
            // flexGrow: 0.5,
          }}
        >
          What&apos;s New
        </Typography>
        <Stack direction="row" spacing={1} sx={{ px: 3, flexGrow: 1 }}>
          {FILTERS.map((option) => {
            const selected = filter === option.value;
            return (
              <Chip
                key={option.value}
                label={option.label}
                size="large"
                clickable
                variant={selected ? 'filled' : 'outlined'}
                onClick={() => setFilter(option.value)}
                sx={
                  selected
                    ? {
                        bgcolor: 'text.primary',
                        color: 'background.paper',
                        '&:hover': { bgcolor: 'text.primary' },
                        borderRadius: '50px',
                      }
                    : { borderRadius: '50px' }
                }
              />
            );
          })}
        </Stack>
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Stack>

      <Divider />

      <Scrollbar>
        <Box sx={{ px: 3, py: 2.5 }}>
          {!isLoading && !groups.length && (
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', textAlign: 'center', py: 5 }}
            >
              No release notes yet.
            </Typography>
          )}

          <Stack spacing={3} divider={<Divider flexItem />}>
            {groups.map((release) => (
              <Stack key={release.id} spacing={1.5}>
                <Typography variant="subtitle1">
                  {dayjs(release.releaseDate).format('DD MMM YYYY')}
                </Typography>

                {/* [type] [title] [description] — columns align across rows */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'auto 1fr', sm: '72px 120px 1fr' },
                    columnGap: 2,
                    rowGap: 0.5,
                    alignItems: 'baseline',
                  }}
                >
                  {release.items.map((item) => (
                    <Box key={item.id} sx={{ display: 'contents' }}>
                      <ReleaseTypeChip type={item.type} />
                      <Typography variant="subtitle2">{item.title}</Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          whiteSpace: 'pre-line',
                          gridColumn: { xs: '2', sm: 'auto' },
                        }}
                      >
                        {item.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Scrollbar>
    </Drawer>
  );
}

WhatsNewDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  releases: PropTypes.array,
  isLoading: PropTypes.bool,
};
