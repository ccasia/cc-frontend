import PropTypes from 'prop-types';

import BriefModal from './brief-modal';

// In-app notification (📩, purple) telling a recipient that a client has sent a
// brief awaiting their approval.
export default function BriefToApproveDialog({ open, onGoToBriefs, onClose }) {
  return (
    <BriefModal
      open={open}
      onClose={onClose}
      emoji="📩"
      iconBg="#8A5AFE"
      title="You've got a brief to approve"
      body="A client has sent a brief for approval, great work!"
      actions={[
        ...(onGoToBriefs ? [{ label: 'Go to Briefs', onClick: onGoToBriefs, variant: 'dark' }] : []),
        { label: 'Done', onClick: onClose, variant: 'outlined' },
      ]}
    />
  );
}

BriefToApproveDialog.propTypes = {
  open: PropTypes.bool,
  onGoToBriefs: PropTypes.func,
  onClose: PropTypes.func,
};
