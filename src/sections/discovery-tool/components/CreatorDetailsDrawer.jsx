import PropTypes from 'prop-types';

import { Stack, Drawer, IconButton } from '@mui/material';

import Iconify from 'src/components/iconify';

import CreatorProfilePanel from './CreatorProfilePanel';

// ─── Main Drawer ──────────────────────────────────────────────────────────────

const CreatorDetailsDrawer = ({
  creator,
  open,
  onClose,
  rowKey,
  lists,
  creatorListIds,
  onToggleList,
  onOpenListManager,
  onInvite,
}) => {
  if (!creator) {
    return <Drawer open={open} onClose={onClose} anchor="right" />;
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      PaperProps={{
        sx: {
          width: { xs: 1, sm: 380 },
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#FFFFFF',
          boxShadow: '-12px 0 40px -4px rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      {/* -- Sticky header -- */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-start"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          flexShrink: 0,
          height: 72,
          px: 3,
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #EBEBEB',
        }}
      >
        <IconButton aria-label="Close" onClick={onClose} sx={{ color: '#636366', ml: -1 }}>
          <Iconify icon="eva:close-fill" width={28} />
        </IconButton>
      </Stack>

      <CreatorProfilePanel
        creator={creator}
        rowKey={rowKey}
        lists={lists}
        creatorListIds={creatorListIds}
        onToggleList={onToggleList}
        onOpenListManager={onOpenListManager}
        onInvite={onInvite}
      />
    </Drawer>
  );
};

CreatorDetailsDrawer.propTypes = {
  creator: PropTypes.shape({
    creatorId: PropTypes.string,
    name: PropTypes.string,
    age: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    gender: PropTypes.string,
    location: PropTypes.string,
    creditTier: PropTypes.string,
    languages: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    pastCampaigns: PropTypes.arrayOf(PropTypes.object),
    interests: PropTypes.arrayOf(PropTypes.string),
    handles: PropTypes.shape({
      instagram: PropTypes.string,
      tiktok: PropTypes.string,
    }),
    instagram: PropTypes.object,
    tiktok: PropTypes.object,
  }),
  open: PropTypes.bool,
  onClose: PropTypes.func,
  rowKey: PropTypes.string,
  lists: PropTypes.array,
  creatorListIds: PropTypes.oneOfType([PropTypes.array, PropTypes.instanceOf(Set)]),
  onToggleList: PropTypes.func,
  onOpenListManager: PropTypes.func,
  onInvite: PropTypes.func,
};

CreatorDetailsDrawer.defaultProps = {
  creator: null,
  open: false,
  onClose: undefined,
  rowKey: undefined,
  lists: [],
  creatorListIds: [],
  onToggleList: undefined,
  onOpenListManager: undefined,
  onInvite: undefined,
};

export default CreatorDetailsDrawer;
