import PropTypes from 'prop-types';

import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { ConfirmDialog } from 'src/components/custom-dialog';

import { LIP_BUTTON_SX } from 'src/sections/release-notes/constants';

export default function RaiseMinimumDialog({
  open,
  platformLabel,
  version,
  loading,
  onClose,
  onConfirm,
}) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title={`Block old ${platformLabel} versions?`}
      content={
        <Typography variant="body2">
          Every {platformLabel} user below <strong>{version}</strong> will see a full-screen
          &quot;Update now&quot; block and cannot use the app until they update.
        </Typography>
      }
      action={
        <LoadingButton loading={loading} onClick={onConfirm} sx={LIP_BUTTON_SX.danger}>
          Block below {version}
        </LoadingButton>
      }
    />
  );
}

RaiseMinimumDialog.propTypes = {
  open: PropTypes.bool,
  platformLabel: PropTypes.string,
  version: PropTypes.string,
  loading: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
};
