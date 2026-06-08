import PropTypes from 'prop-types';

import BriefModal from './brief-modal';

// Destructive confirmation (🗑️, red) before permanently deleting a brief.
export default function DeleteBriefDialog({ open, brandName, onConfirm, onClose, loading }) {
  return (
    <BriefModal
      open={open}
      onClose={onClose}
      emoji="🗑️"
      iconBg="#FEE2E2"
      title="Delete brief?"
      body={
        <>
          This will permanently delete the brief for <strong>{brandName || 'this brand'}</strong>. This
          action cannot be undone.
        </>
      }
      actions={[
        { label: loading ? 'Deleting…' : 'Delete', onClick: onConfirm, variant: 'danger', disabled: loading },
        { label: 'Cancel', onClick: onClose, variant: 'outlined', disabled: loading },
      ]}
    />
  );
}

DeleteBriefDialog.propTypes = {
  open: PropTypes.bool,
  brandName: PropTypes.string,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func,
  loading: PropTypes.bool,
};
