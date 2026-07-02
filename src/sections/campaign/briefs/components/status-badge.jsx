import PropTypes from 'prop-types';

import Chip from '@mui/material/Chip';

// Map of draftStatus → display config. Order roughly matches the lifecycle.
// Exported so action buttons (e.g. the brief detail footer) can color
// themselves with the same per-status palette as the badge.
export const STATUS_CONFIG = {
  DRAFTED: { label: 'DRAFT', color: '#9CA3AF', bg: 'transparent', border: '#9CA3AF' },
  SENT_TO_CLIENT: { label: 'SENT TO CLIENT', color: '#6D28D9', bg: 'transparent', border: '#6D28D9' },
  PENDING_REVIEW: { label: 'PENDING REVIEW', color: '#CA8A04', bg: 'transparent', border: '#CA8A04' },
  APPROVED: { label: 'APPROVED', color: '#15803D', bg: 'transparent', border: '#15803D' },
  HANDED_OVER: { label: 'HANDED OVER', color: '#1340FF', bg: 'transparent', border: '#1340FF' },
  LOST: { label: 'LOST', color: '#DC2626', bg: 'transparent', border: '#DC2626' },
  ACTIVE: { label: 'ACTIVE', color: '#15803D', bg: 'transparent', border: '#15803D' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status || '—',
    color: '#9CA3AF',
    bg: 'transparent',
    border: '#9CA3AF',
  };

  return (
    <Chip
      label={config.label}
      size="small"
      variant="outlined"
      sx={{
        textTransform: 'uppercase',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        py: 0.5,
        px: 1,
        fontSize: 12,
        border: '1px solid',
        borderBottom: '3px solid',
        borderRadius: 0.8,
        bgcolor: 'white',
        whiteSpace: 'nowrap',
        height: 'auto',
        color: config.color,
        borderColor: config.color,
        '& .MuiChip-label': { px: 0 },
      }}
    />
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
};
