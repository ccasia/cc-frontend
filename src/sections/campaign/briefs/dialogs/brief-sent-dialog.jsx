import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';

import BriefModal from './brief-modal';

// Shown to the BD after a brief is sent to the client (🚀, purple).
export default function BriefSentDialog({ open, link, onClose }) {
  const { enqueueSnackbar } = useSnackbar();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      enqueueSnackbar('Link copied', { variant: 'success' });
    } catch {
      enqueueSnackbar('Could not copy — select and copy manually', { variant: 'warning' });
    }
  };

  return (
    <BriefModal
      open={open}
      onClose={onClose}
      emoji="🚀"
      iconBg="#8A5AFE"
      title="Brief Sent to Client!"
      body="Your client will receive a link in their email inbox! You may also copy the link or save the QR to send to them directly."
      actions={[
        { label: 'Copy Link', onClick: handleCopy, variant: 'dark' },
        { label: 'Done', onClick: onClose, variant: 'outlined' },
      ]}
    />
  );
}

BriefSentDialog.propTypes = {
  open: PropTypes.bool,
  link: PropTypes.string,
  onClose: PropTypes.func,
};
