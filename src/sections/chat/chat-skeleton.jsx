import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function ChatNavItemSkeleton({ sx, ...other }) {
  return (
    <Stack
      spacing={2}
      direction="row"
      alignItems="center"
      sx={{
        px: 2.5,
        py: 1.5,
        ...sx,
      }}
      {...other}
    >
      <Skeleton variant="circular" sx={{ width: 48, height: 48 }} />

      <Stack spacing={1} flexGrow={1}>
        <Skeleton sx={{ width: 0.75, height: 10 }} />
        <Skeleton sx={{ width: 0.5, height: 10 }} />
      </Stack>
    </Stack>
  );
}

ChatNavItemSkeleton.propTypes = {
  sx: PropTypes.object,
};

// ----------------------------------------------------------------------

const DETAIL_WIDTHS = [96, 120, 160];

export function ChatRoomSkeleton() {
  return (
    <Box
      aria-busy="true"
      aria-label="Loading"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        margin: 2,
        padding: 1,
      }}
    >
      <Skeleton variant="circular" sx={{ width: 108, height: 108, margin: 2 }} />

      <Typography variant="h6" sx={{ marginBottom: 2 }}>
        <Skeleton sx={{ width: 120, height: '1em', display: 'inline-block', verticalAlign: 'middle' }} />
      </Typography>

      <Stack spacing={4} sx={{ px: 2, py: 2.5, alignSelf: 'stretch' }}>
        {DETAIL_WIDTHS.map((width) => (
          <Stack key={width} direction="row" alignItems="center" sx={{ height: 22 }}>
            <Skeleton sx={{ width: 20, height: 20, mr: 1, flexShrink: 0 }} />
            <Skeleton sx={{ width, height: 12 }} />
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
