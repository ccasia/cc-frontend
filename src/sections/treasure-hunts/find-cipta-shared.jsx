import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

// Shared house-style tokens for the Find Cipta screens, so the blue "physical"
// buttons, grey table headers, and dialog chrome are defined once instead of
// copy-pasted into every tab.
// ----------------------------------------------------------------------

export const primaryButtonSx = {
  bgcolor: '#203ff5',
  border: '1px solid #203ff5',
  borderBottom: '3px solid #1933cc',
  height: 44,
  color: '#ffffff',
  fontSize: '0.85rem',
  fontWeight: 600,
  px: 2.5,
  borderRadius: 1.15,
  textTransform: 'none',
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: '#1933cc', opacity: 0.9 },
  '&:disabled': {
    bgcolor: '#e7e7e7',
    color: '#999999',
    border: '1px solid #e7e7e7',
    borderBottom: '3px solid #d1d1d1',
  },
};

export const secondaryButtonSx = {
  bgcolor: '#FFFFFF',
  border: '1.5px solid #e7e7e7',
  borderBottom: '3px solid #e7e7e7',
  borderRadius: 1.15,
  color: '#1340FF',
  height: 44,
  px: 2.5,
  fontWeight: 600,
  fontSize: '0.85rem',
  textTransform: 'none',
  whiteSpace: 'nowrap',
  '&:hover': {
    bgcolor: 'rgba(19, 64, 255, 0.08)',
    border: '1.5px solid #1340FF',
    borderBottom: '3px solid #1340FF',
    color: '#1340FF',
  },
};

// Ending the event is irreversible and almost never the thing you came here to
// do, so it reads as available rather than as the loudest control on the page.
export const dangerGhostButtonSx = {
  bgcolor: '#FFFFFF',
  border: '1.5px solid #F0C9C2',
  borderBottom: '3px solid #F0C9C2',
  borderRadius: 1.15,
  color: '#D4321C',
  height: 44,
  px: 2.5,
  fontWeight: 600,
  fontSize: '0.85rem',
  textTransform: 'none',
  whiteSpace: 'nowrap',
  '&:hover': {
    bgcolor: 'rgba(212, 50, 28, 0.06)',
    border: '1.5px solid #D4321C',
    borderBottom: '3px solid #D4321C',
  },
};

export const dangerButtonSx = {
  bgcolor: '#D4321C',
  border: '1px solid #D4321C',
  borderBottom: '3px solid #b71c1c',
  borderRadius: 1.15,
  color: '#fff',
  height: 44,
  px: 2.5,
  fontWeight: 600,
  fontSize: '0.85rem',
  textTransform: 'none',
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: '#B71C1C' },
};

export const iconButtonSx = {
  width: 36,
  height: 36,
  borderRadius: 1,
  border: '1px solid #E7E7E7',
  boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
  bgcolor: '#fff',
  '&:hover': { bgcolor: '#f5f5f5' },
  '&:disabled': { opacity: 0.5 },
};

export const headerCellSx = {
  py: 1,
  px: 2,
  color: '#221f20',
  fontWeight: 600,
  bgcolor: '#f5f5f5',
  whiteSpace: 'nowrap',
  fontSize: '0.875rem',
};

export const firstHeaderCellSx = { ...headerCellSx, borderRadius: '10px 0 0 10px' };
export const lastHeaderCellSx = { ...headerCellSx, borderRadius: '0 10px 10px 0' };

export const tableContainerSx = {
  width: '100%',
  maxWidth: '100%',
  overflowX: 'auto',
  position: 'relative',
  bgcolor: 'transparent',
  borderBottom: '1px solid',
  borderColor: 'divider',
  '&::-webkit-scrollbar': { height: 8 },
  '&::-webkit-scrollbar-track': { backgroundColor: '#f5f5f5', borderRadius: 4 },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#d0d0d0',
    borderRadius: 4,
    '&:hover': { backgroundColor: '#b0b0b0' },
  },
};

export const searchFieldSx = {
  width: { xs: '100%', sm: 300 },
  '& .MuiOutlinedInput-root': {
    bgcolor: '#FFFFFF',
    border: '1.5px solid #e7e7e7',
    borderBottom: '3px solid #e7e7e7',
    borderRadius: 1.15,
    height: 44,
    fontSize: '0.85rem',
    '& fieldset': { border: 'none' },
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
    '&::placeholder': { color: '#637381', opacity: 1, fontWeight: 400 },
  },
};

export const dialogPaperProps = { sx: { borderRadius: 2, bgcolor: '#F4F4F4' } };

export const dialogTitleSx = {
  fontFamily: 'Instrument Serif',
  fontSize: '40px !important',
  fontWeight: 400,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  pb: 2,
  lineHeight: 1.2,
};

export const fieldLabelSx = {
  mb: 0.5,
  display: 'block',
  color: '#636366',
  fontSize: '14px !important',
  fontWeight: 600,
};

export const RequiredMark = () => (
  <Box component="span" sx={{ color: 'error.main' }}>
    {' *'}
  </Box>
);

export const inputSx = {
  '& .MuiOutlinedInput-root': { bgcolor: '#fff', minHeight: 48, borderRadius: 1 },
};

// ----------------------------------------------------------------------

export const INK = '#221f20';
export const MUTED = '#636366';
export const HAIRLINE = '#EBEBEB';

// Event lifecycle, worded for admins rather than mirroring the enum.
export const HUNT_STATUS = {
  DRAFT: { label: 'Draft', color: '#8E8E93' },
  PUBLISHED: { label: 'Live', color: '#1ABF66' },
  PAUSED: { label: 'Paused', color: '#FF9A02' },
  ARCHIVED: { label: 'Ended', color: '#B0B0B0' },
};

/**
 * The real state an admin cares about, which is NOT the enum: a PUBLISHED event
 * whose window has not opened yet is invisible in the app, and one whose window
 * has closed stops accepting scans even though the row still says PUBLISHED.
 * Showing "Live" in either case is how you end up hunting for a bug that isn't
 * one, so the derived state is the single source of truth for every label here.
 */
export const getEventState = (hunt, now = new Date()) => {
  if (!hunt) return HUNT_STATUS.DRAFT;

  const startsAt = new Date(hunt.startsAt);
  const endsAt = new Date(hunt.endsAt);

  if (hunt.status === 'ARCHIVED') return { ...HUNT_STATUS.ARCHIVED, phase: 'ended' };
  if (hunt.status === 'DRAFT') return { ...HUNT_STATUS.DRAFT, phase: 'draft' };
  if (now >= endsAt) return { label: 'Ended', color: '#B0B0B0', phase: 'ended' };
  if (hunt.status === 'PAUSED') return { ...HUNT_STATUS.PAUSED, phase: 'paused' };
  if (now < startsAt) return { label: 'Scheduled', color: '#FF9A02', phase: 'scheduled' };
  return { ...HUNT_STATUS.PUBLISHED, phase: 'live' };
};

/** What a creator opening the app would actually see right now. */
export const getAppVisibility = (hunt, state) => {
  if (hunt?.featuredSlot !== 1) {
    return { visible: false, label: 'Not on the home feed yet' };
  }

  switch (state.phase) {
    case 'live':
      return { visible: true, label: 'Showing on the home feed' };
    case 'scheduled':
      return { visible: false, label: 'Hidden until the event starts' };
    case 'paused':
      return { visible: false, label: 'Hidden while paused' };
    default:
      return { visible: false, label: 'No longer shown' };
  }
};

// Bitly publication states for a location's QR code.
export const QR_STATUS = {
  NOT_STARTED: { label: 'Not generated', color: '#8E8E93' },
  BITLINK_CREATED: { label: 'Generating', color: '#1340FF' },
  QR_CREATED: { label: 'Generating', color: '#1340FF' },
  READY: { label: 'Ready', color: '#1ABF66' },
  RATE_LIMITED: { label: 'Rate limited', color: '#FF9A02' },
  FAILED: { label: 'Failed', color: '#D4321C' },
};

export function StatusPill({ label, color }) {
  return (
    <Box
      component="span"
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
        color,
        borderColor: color,
      }}
    >
      {label}
    </Box>
  );
}

StatusPill.propTypes = {
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};

/**
 * Header variant of StatusPill: same outlined treatment, sized to the 44px
 * control height so it shares a baseline with the lifecycle buttons beside it.
 */
export function EventStatusPill({ label, color }) {
  return (
    <Box
      component="span"
      sx={{
        textTransform: 'uppercase',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        height: 44,
        px: 2,
        fontSize: 12,
        border: '1px solid',
        borderBottom: '3px solid',
        borderRadius: 1.15,
        bgcolor: 'white',
        whiteSpace: 'nowrap',
        color,
        borderColor: color,
      }}
    >
      {label}
    </Box>
  );
}

EventStatusPill.propTypes = {
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};
