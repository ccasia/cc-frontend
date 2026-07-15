import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

const BUCKETS = [
  { key: 'under3d', label: '<3d', color: '#1B806A', bg: '#E9FBF5', border: '#B6E9D8' },
  { key: 'from3to7d', label: '3-7d', color: '#B76E00', bg: '#FFF7E0', border: '#F5DFA6' },
  { key: 'over7d', label: '>7d', color: '#B71D18', bg: '#FFF0EE', border: '#F7C6C0' },
];

export default function AgingChips({ aging }) {
  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
      {BUCKETS.map((bucket) => (
        <Typography
          key={bucket.key}
          component="span"
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 5,
            fontSize: '0.72rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            color: bucket.color,
            bgcolor: bucket.bg,
            border: `1px solid ${bucket.border}`,
          }}
        >
          {bucket.label} · {aging?.[bucket.key] ?? 0}
        </Typography>
      ))}
    </Stack>
  );
}

AgingChips.propTypes = {
  aging: PropTypes.shape({
    under3d: PropTypes.number,
    from3to7d: PropTypes.number,
    over7d: PropTypes.number,
  }),
};
