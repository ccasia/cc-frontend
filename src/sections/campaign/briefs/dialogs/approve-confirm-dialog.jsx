import PropTypes from 'prop-types';

import BriefModal from './brief-modal';

// "Approve brief?" confirmation. Two contexts share the same dialog, differing
// only in the subtext:
//   context="client" (default) → "Once approved, this action cannot be undone"
//   context="bd"               → "Once approved, you'll be able to handover the
//                                 brief to the CS team"
export default function ApproveConfirmDialog({ open, onConfirm, onClose, loading, context = 'client' }) {
  const body =
    context === 'bd'
      ? "Once approved, you'll be able to handover the brief to the CS team"
      : 'Once approved, this action cannot be undone';

  return (
    <BriefModal
      open={open}
      onClose={onClose}
      emoji="✅"
      iconBg="#8A5AFE"
      title="Approve brief?"
      body={body}
      actions={[
        { label: loading ? 'Approving…' : 'Approve', onClick: onConfirm, variant: 'blue', disabled: loading },
        { label: 'Cancel', onClick: onClose, variant: 'outlined', disabled: loading },
      ]}
    />
  );
}

ApproveConfirmDialog.propTypes = {
  open: PropTypes.bool,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func,
  loading: PropTypes.bool,
  context: PropTypes.oneOf(['client', 'bd']),
};
