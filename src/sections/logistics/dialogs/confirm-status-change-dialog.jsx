import PropTypes from 'prop-types';
import { Box, Stack, Dialog, Button, Typography } from '@mui/material';

// Reuse config to get colors/labels
const STATUS_CONFIG = {
  PENDING_ASSIGNMENT: { label: 'UNASSIGNED', color: '#B0B0B0' },
  SCHEDULED: { label: 'YET TO SHIP', color: '#FF9A02' },
  SHIPPED: { label: 'SHIPPED OUT', color: '#8A5AFE' },
  DELIVERED: { label: 'DELIVERED', color: '#1ABF66' },
  ISSUE_REPORTED: { label: 'FAILED', color: '#D4321C' },
};

function StatusPill({ value }) {
  const config = STATUS_CONFIG[value] || { label: value, color: '#B0B0B0' };

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 0.5,
        py: 0.5,
        mx: 0.5,
        borderRadius: '6px',
        border: `1px solid ${config.color}`,
        boxShadow: `0px -2px 0px 0px ${config.color} inset`,
        color: config.color,
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        verticalAlign: 'middle',
        cursor: 'default',
      }}
    >
      {config.label}
    </Box>
  );
}

StatusPill.propTypes = {
  value: PropTypes.string,
};

export default function ConfirmStatusChangeDialog({
  open,
  onClose,
  onConfirm,
  oldStatus,
  newStatus,
  loading,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#F4F4F4',
          p: 3,
          width: '100%',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Emoji Circle */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: '#8A5AFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            fontSize: 40,
            boxShadow: '0px 8px 16px rgba(138, 90, 254, 0.24)',
          }}
        >
          😲
        </Box>

        <Typography
          variant="h2"
          sx={{
            fontFamily: 'instrument serif',
            fontWeight: 400,
            color: '#231F20',
            cursor: 'default',
          }}
        >
          Change statuses?
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: '#636366',
            fontWeight: 400,
            mb: 4,
            lineHeight: 1.5,
            maxWidth: 300,
            cursor: 'default',
          }}
        >
          Changing from
          <StatusPill value={oldStatus} />
          to
          <StatusPill value={newStatus} />
          affects the statuses and actions on the Creators and Clients side as well
        </Typography>

        <Stack spacing={1.5} sx={{ width: '100%' }}>
          <Button
            fullWidth
            variant="contained"
            onClick={onConfirm}
            disabled={loading}
            sx={{
              bgcolor: '#3A3A3C',
              color: '#fff',
              py: 1.5,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0px -4px 0px 0px #00000073 inset',
              '&:hover': { bgcolor: '#3a3a3cd1', boxShadow: '0px -4px 0px 0px #000000 inset' },
              '&:active': {
                boxShadow: '0px 0px 0px 0px #000000 inset',
                transform: 'translateY(1px)',
              },
            }}
          >
            {loading ? 'Confirming...' : 'Confirm'}
          </Button>
          <Button
            fullWidth
            onClick={onClose}
            disabled={loading}
            sx={{
              bgcolor: '#fff',
              color: '#231F20',
              py: 1.5,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              border: '1px solid #E0E0E0',
              boxShadow: `0px -2px 0px 0px #E0E0E0 inset`,
              '&:hover': {
                backgroundColor: '#F8F9FA',
                border: `1px solid #E0E0E0`,
                boxShadow: `0px -2px 0px 0px #E0E0E0 inset`,
              },
              '&:active': {
                boxShadow: `0px -1px 0px 0px #fff inset`,
                transform: 'translateY(1px)',
              },
              // '&:hover': { bgcolor: '#F8F9FA' },
            }}
            //  boxShadow: `0px -2px 0px 0px ${option.color} inset`,
            //                   fontSize: { xs: 8, sm: 10, md: 12 },
            //                   fontWeight: 600,
            //                   typography: 'subtitle2',
            //                   textTransform: 'uppercase',
            //                   position: 'relative',
            //                   bgcolor: isSelected ? `${option.color}14` : 'transparent',
            //                   '&:hover': {
            //                     backgroundColor: '#F8F9FA',
            //                     border: `1px solid ${option.color}`,
            //                     boxShadow: `0px -2px 0px 0px ${option.color} inset`,
            //                   },
            //                   '&:active': {
            //                     boxShadow: `0px -1px 0px 0px ${option.color} inset`,
            //                     transform: 'translateY(1px)',
            //                   },
          >
            Cancel
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}

ConfirmStatusChangeDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
  oldStatus: PropTypes.string,
  newStatus: PropTypes.string,
  loading: PropTypes.bool,
};
