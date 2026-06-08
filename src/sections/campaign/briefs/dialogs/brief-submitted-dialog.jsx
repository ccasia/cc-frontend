import PropTypes from 'prop-types';

import BriefModal from './brief-modal';

// Shown after a prospect submits the public BD brief form (🥳, blue).
export default function BriefSubmittedDialog({ open, onClose }) {
  return (
    <BriefModal
      open={open}
      onClose={onClose}
      emoji="🥳"
      iconBg="#1340FF"
      title="Brief sent!"
      body="Thank you for your submission, you will get notified once it has been approved by our team"
      actions={[{ label: 'Done', onClick: onClose, variant: 'dark' }]}
    />
  );
}

BriefSubmittedDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
