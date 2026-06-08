import PropTypes from 'prop-types';

import BriefModal from './brief-modal';

// Pre-submit confirmation (✍️, purple): "Confirm this brief?" before it's sent
// to the BD team for approval.
export default function ConfirmBriefDialog({ open, onConfirm, onClose, loading }) {
  return (
    <BriefModal
      open={open}
      onClose={onClose}
      emoji="✍️"
      iconBg="#8A5AFE"
      title="Confirm this brief?"
      body="If yes, this will be sent over to our BD team for approval"
      actions={[
        { label: loading ? 'Confirming…' : 'Confirm', onClick: onConfirm, variant: 'blue', disabled: loading },
        { label: 'Cancel', onClick: onClose, variant: 'outlined', disabled: loading },
      ]}
    />
  );
}

ConfirmBriefDialog.propTypes = {
  open: PropTypes.bool,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func,
  loading: PropTypes.bool,
};
