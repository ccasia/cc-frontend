import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import {
  TelegramIcon,
  WhatsappIcon,
  TelegramShareButton,
  WhatsappShareButton,
} from 'react-share';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import BriefModal from './brief-modal';

// Shown to the BD after a brief is sent to the client (🚀, purple).
export default function BriefSentDialog({ open, link, message, onClose }) {
  const { enqueueSnackbar } = useSnackbar();

  const copyText = async (text, successMsg) => {
    try {
      await navigator.clipboard.writeText(text);
      enqueueSnackbar(successMsg, { variant: 'success' });
    } catch {
      enqueueSnackbar('Could not copy — select and copy manually', { variant: 'warning' });
    }
  };

  const handleCopy = () => copyText(link, 'Link copied');
  const handleCopyWithMessage = () =>
    copyText(`${message}\n\n${link}`, 'Message and link copied');

  // react-share appends the URL after the title; add spacing when a note exists.
  const shareTitle = message ? `${message}\n\n` : '';

  const shareRow = link ? (
    <Stack spacing={1}>
      <Typography variant="caption" sx={{ color: '#6B7280' }}>
        Or share the link directly
      </Typography>
      <Stack direction="row" spacing={1.5} justifyContent="center">
        {/* `separator=""` keeps our own spacing in shareTitle from doubling up. */}
        <WhatsappShareButton url={link} title={shareTitle} separator="">
          <WhatsappIcon size={44} borderRadius={14} />
        </WhatsappShareButton>
        <TelegramShareButton url={link} title={shareTitle}>
          <TelegramIcon size={44} borderRadius={14}/>
        </TelegramShareButton>
      </Stack>
    </Stack>
  ) : null;

  return (
    <BriefModal
      open={open}
      onClose={onClose}
      emoji="🚀"
      iconBg="#8A5AFE"
      title="Brief Sent to Client!"
      body="Your client will receive a link in their email inbox!"
      extra={shareRow}
      actions={[
        { label: 'Copy Link', onClick: handleCopy, variant: 'dark' },
        ...(message
          ? [{ label: 'Copy Message + Link', onClick: handleCopyWithMessage, variant: 'outlined' }]
          : []),
        { label: 'Done', onClick: onClose, variant: 'outlined' },
      ]}
    />
  );
}

BriefSentDialog.propTypes = {
  open: PropTypes.bool,
  link: PropTypes.string,
  message: PropTypes.string,
  onClose: PropTypes.func,
};
