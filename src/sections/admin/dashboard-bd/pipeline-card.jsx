import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import { daysSinceSent, FOLLOW_UP_DAYS } from './pipeline-utils';

// ----------------------------------------------------------------------

const ACTION_COLORS = {
  blue: { bg: '#1340FF', hover: '#0f34cc' },
  green: { bg: '#1E7E45', hover: '#186537' },
  amber: { bg: '#B98900', hover: '#9c7400' },
};

function ActionButton({ label, color, onClick }) {
  const c = ACTION_COLORS[color] || ACTION_COLORS.blue;
  return (
    <Button
      fullWidth
      variant="contained"
      onClick={onClick}
      sx={{
        bgcolor: c.bg,
        color: '#fff',
        fontWeight: 700,
        fontSize: '0.8rem',
        borderRadius: 1.5,
        boxShadow: 'none',
        py: 1,
        '&:hover': { bgcolor: c.hover, boxShadow: 'none' },
      }}
    >
      {label}
    </Button>
  );
}

ActionButton.propTypes = {
  label: PropTypes.string,
  color: PropTypes.string,
  onClick: PropTypes.func,
};

// ----------------------------------------------------------------------

export default function PipelineCard({ brief, onSend, onCopyLink, onReview, onHandover, onView, onLost, onDelete }) {
  const [menuEl, setMenuEl] = useState(null);
  const closeMenu = () => setMenuEl(null);

  const status = brief.draftStatus;
  const email = brief.clientEmail;
  const canDelete = status === 'DRAFTED';

  const renderBody = () => {
    switch (status) {
      case 'DRAFTED':
        return <ActionButton label="Send to client" color="blue" onClick={() => onSend(brief)} />;

      case 'SENT_TO_CLIENT': {
        const days = daysSinceSent(brief.sentToClientAt);
        const needsFollowUp = days != null && days >= FOLLOW_UP_DAYS;
        return (
          <Stack spacing={1.25}>
            {needsFollowUp ? (
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#D5451B' }}>
                Follow up · {days}d, no reply
              </Typography>
            ) : (
              <Typography sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
                {days != null ? `Sent ${days === 0 ? 'today' : `${days}d ago`}` : 'Sent'}
              </Typography>
            )}
            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => onCopyLink(brief)}
                disabled={!brief.clientLink}
                sx={{
                  color: '#1340FF',
                  borderColor: '#E7E7E7',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  borderRadius: 1.5,
                  '&:hover': { borderColor: '#1340FF', bgcolor: 'transparent' },
                }}
              >
                Copy link
              </Button>
              <Tooltip title="Resend brief">
                <IconButton
                  onClick={() => onSend(brief)}
                  sx={{ border: '1px solid #E7E7E7', borderRadius: 1.5, color: '#1340FF' }}
                >
                  <Iconify icon="mdi:email-outline" width={18} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        );
      }

      case 'PENDING_REVIEW':
        return <ActionButton label="Review" color="amber" onClick={() => onReview(brief)} />;

      case 'APPROVED':
        return <ActionButton label="Hand over to CS" color="green" onClick={() => onHandover(brief)} />;

      case 'HANDED_OVER': {
        const isLive = brief.status === 'ACTIVE';
        return (
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box
                sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: isLive ? '#22c55e' : '#d1d5db' }}
              />
              <Typography sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
                {isLive ? 'Live' : 'Not live yet'}
              </Typography>
            </Stack>
            <Button
              onClick={() => onView(brief)}
              sx={{ color: '#1340FF', fontWeight: 700, fontSize: '0.8rem', minWidth: 0, px: 1 }}
            >
              View
            </Button>
          </Stack>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid #e5e7eb',
        bgcolor: '#fff',
        boxShadow: 'none',
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', pr: 1 }}>
          {brief.name || 'Untitled brief'}
        </Typography>
        <IconButton size="small" onClick={(e) => setMenuEl(e.currentTarget)} sx={{ mt: -0.5, mr: -0.5 }}>
          <Iconify icon="eva:more-horizontal-fill" width={18} sx={{ color: '#9ca3af' }} />
        </IconButton>
      </Stack>

      <Typography sx={{ fontSize: '0.85rem', color: email ? '#6b7280' : '#b0b0b5', mb: 1.75 }}>
        {email || 'no client email'}
      </Typography>

      {renderBody()}

      <Menu anchorEl={menuEl} open={Boolean(menuEl)} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            closeMenu();
            onReview(brief);
          }}
        >
          <Iconify icon="mdi:eye-outline" width={18} sx={{ mr: 1 }} />
          Open brief
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            onLost(brief);
          }}
        >
          <Iconify icon="mdi:close-circle-outline" width={18} sx={{ mr: 1 }} />
          Mark as lost
        </MenuItem>
        {canDelete && (
          <MenuItem
            onClick={() => {
              closeMenu();
              onDelete(brief);
            }}
            sx={{ color: '#dc2626' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} sx={{ mr: 1 }} />
            Delete draft
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}

PipelineCard.propTypes = {
  brief: PropTypes.object,
  onSend: PropTypes.func,
  onCopyLink: PropTypes.func,
  onReview: PropTypes.func,
  onHandover: PropTypes.func,
  onView: PropTypes.func,
  onLost: PropTypes.func,
  onDelete: PropTypes.func,
};
