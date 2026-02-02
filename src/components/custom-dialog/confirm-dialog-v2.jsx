import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { Box, Typography } from '@mui/material';
import DialogContent from '@mui/material/DialogContent';

// ----------------------------------------------------------------------

export default function ConfirmDialogV2({
  title,
  emoji,
  content,
  action,
  isPosting = false,
  open,
  onClose,
  ...other
}) {
  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={open}
      onClose={onClose}
      {...other}
      PaperProps={{ sx: { padding: 2, width: 380 } }}
    >
      {emoji && (
        <Box display="flex" justifyContent="center">
          {emoji}
        </Box>
      )}

      <Typography
        sx={{
          textAlign: 'center',
          fontFamily: 'Instrument Serif',
          fontSize: 36,
          fontWeight: 400,
          my: 2,
          lineHeight: 1.2,
        }}
      >
        {title}
      </Typography>

      {content && (
        <DialogContent
          sx={{
            typography: 'body2',
            textAlign: 'center',
          }}
        >
          {content}
        </DialogContent>
      )}

      {action && (
        <Button
          variant="contained"
          fullWidth
          sx={{
            bgcolor: '#3A3A3C',
            color: '#fff',
            py: 1,
            mb: 1,
            borderRadius: 1,
            '&:hover': {
              bgcolor: '#1F2937',
            },
            boxShadow: 'inset 0px -2px 0px 0px #00000073',
          }}
          onClick={action.props.onClick}
        >
          Yes
        </Button>
      )}

      <Button
        variant="outlined"
        fullWidth
        onClick={onClose}
        sx={{
          borderColor: '#E5E7EB',
          color: '#000',
          py: 1,
          borderRadius: 1,
          '&:hover': {
            backgroundColor: '#F5F5F5',
            boxShadow: 'inset 0px -2px 0px 0px #E7E7E7',
          },
          boxShadow: 'inset 0px -2px 0px 0px #E7E7E7',
        }}
      >
        Cancel
      </Button>
    </Dialog>
  );
}

ConfirmDialogV2.propTypes = {
  action: PropTypes.node,
  isPosting: PropTypes.bool,
  emoji: PropTypes.node,
  content: PropTypes.node,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  title: PropTypes.string,
};
