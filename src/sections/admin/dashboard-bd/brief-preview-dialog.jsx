import PropTypes from 'prop-types';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';

import CampaignBriefDetailView from 'src/sections/campaign/briefs/brief-detail-view';

// ----------------------------------------------------------------------

export default function BriefPreviewDialog({ open, brief, onClose, onChanged }) {
  const handleClose = () => {
    onChanged?.();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      scroll="paper"
      PaperProps={{ sx: { height: '92vh', borderRadius: 2 } }}
    >
      <DialogContent sx={{ p: { xs: 0, sm: 1 }, overflow: 'hidden', display: 'flex', minHeight: 0 }}>
        {brief?.id && <CampaignBriefDetailView briefId={brief.id} onClose={handleClose} />}
      </DialogContent>
    </Dialog>
  );
}

BriefPreviewDialog.propTypes = {
  open: PropTypes.bool,
  brief: PropTypes.object,
  onClose: PropTypes.func,
  onChanged: PropTypes.func,
};
