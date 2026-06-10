import PropTypes from 'prop-types';

import { Stack, Dialog, Divider, IconButton } from '@mui/material';

import Iconify from 'src/components/iconify';

import CreatorProfilePanel from './CreatorProfilePanel';

// ─── Compare (Versus) Modal ─────────────────────────────────────────────────────

const CreatorCompareDialog = ({
  open,
  onClose,
  creators,
  rowKeys,
  selectedIds,
  onToggleBookmark,
  onInvite,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth={false}
    PaperProps={{
      sx: {
        width: { xs: 1, md: 1200 },
        maxWidth: '95vw',
        maxHeight: '96vh',
        borderRadius: '20px',
        p: { xs: 2, sm: 6 },
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        position: 'relative',
        bgcolor: '#FFFFFF',
      },
    }}
  >
    <IconButton
      aria-label="Close"
      onClick={onClose}
      sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1, color: '#636366' }}
    >
      <Iconify icon="eva:close-fill" width={24} />
    </IconButton>

    <Stack
      direction={{ xs: 'column', md: 'row' }}
      sx={{ flex: 1, minHeight: 0, gap: { xs: 4, md: 7.5 } }}
      divider={<Divider orientation="vertical" flexItem sx={{ borderColor: '#EBEBEB' }} />}
    >
      {creators.map((creator, index) => (
        <CreatorProfilePanel
          key={rowKeys[index] || creator.creatorId || index}
          creator={creator}
          rowKey={rowKeys[index]}
          selected={selectedIds?.includes(rowKeys[index])}
          onToggleBookmark={onToggleBookmark}
          onInvite={onInvite}
          variant="compare"
        />
      ))}
    </Stack>
  </Dialog>
);

CreatorCompareDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  creators: PropTypes.arrayOf(PropTypes.object),
  rowKeys: PropTypes.arrayOf(PropTypes.string),
  selectedIds: PropTypes.arrayOf(PropTypes.string),
  onToggleBookmark: PropTypes.func,
  onInvite: PropTypes.func,
};

CreatorCompareDialog.defaultProps = {
  open: false,
  onClose: undefined,
  creators: [],
  rowKeys: [],
  selectedIds: [],
  onToggleBookmark: undefined,
  onInvite: undefined,
};

export default CreatorCompareDialog;
