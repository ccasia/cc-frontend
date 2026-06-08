import PropTypes from 'prop-types';

import BriefModal from './brief-modal';

// Two voices for this dialog:
//   mode="client" → the client's own post-approve confirmation (✉️, blue)
//   mode="bd"     → the BD notification that their client approved (🚀, purple)
export default function BriefApprovedDialog({ open, brandName, mode = 'bd', onGoToBriefs, onClose }) {
  const isClient = mode === 'client';

  const actions = isClient
    ? [{ label: 'Done', onClick: onClose, variant: 'dark' }]
    : [
        ...(onGoToBriefs ? [{ label: 'Go to Briefs', onClick: onGoToBriefs, variant: 'dark' }] : []),
        { label: 'Done', onClick: onClose, variant: 'outlined' },
      ];

  return (
    <BriefModal
      open={open}
      onClose={onClose}
      emoji={isClient ? '✉️' : '🚀'}
      iconBg={isClient ? '#1340FF' : '#8A5AFE'}
      title={isClient ? 'Brief approved!' : 'Brief Approved!'}
      body={
        isClient ? (
          "Got it! We'll notify you if any further action is required"
        ) : (
          <>
            <strong>{brandName || 'The brand'}</strong> has approved the brief you sent to them. Great
            work!
          </>
        )
      }
      actions={actions}
    />
  );
}

BriefApprovedDialog.propTypes = {
  open: PropTypes.bool,
  brandName: PropTypes.string,
  mode: PropTypes.oneOf(['client', 'bd']),
  onGoToBriefs: PropTypes.func,
  onClose: PropTypes.func,
};
