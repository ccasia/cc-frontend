import PropTypes from 'prop-types';

import { Box, Dialog, Button, Typography, DialogContent } from '@mui/material';

export default function ConfirmDialogClient({
  title,
  emoji,
  content,
  open,
  onClose,
  onApprove,
  onLeaveFeedback,
  loading = false,
  ...other
}) {
  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      onClose={onClose}
      {...other}
      PaperProps={{ sx: { padding: 2, width: 380, bgcolor: '#F4F4F4' } }}
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
          lineHeight: 1.2,
          mt: 2,
        }}
      >
        {title}
      </Typography>
      {content && (
        <DialogContent
          sx={{
            typography: 'body2',
            textAlign: 'center',
            color: 'text.secondary',
            lineHeight: 1.2,
            mb: 1,
          }}
        >
          {content}
        </DialogContent>
      )}

      <Button
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{
          bgcolor: '#333333',
          color: '#fff',
          py: 1,
          my: 1,
          textTransform: 'none',
          boxShadow: '0px -3px 0px 0px #000000 inset',
          backgroundColor: '#3A3A3C',
          fontSize: '0.95rem',
          '&:hover': {
            backgroundColor: '#3A3A3C',
            boxShadow: '0px -3px 0px 0px #000000ef inset',
          },
          '&:active': {
            boxShadow: '0px 0px 0px 0px #000000 inset',
            transform: 'translateY(1px)',
          },
        }}
        onClick={onApprove}
      >
        {loading ? 'Processing...' : 'Yes, approve'}
      </Button>
      <Button
        variant="outlined"
        fullWidth
        onClick={onLeaveFeedback}
        sx={{
          py: 1,
          textTransform: 'none',
          fontSize: '0.95rem',
          color: '#231F20',
          bgcolor: '#FFFFFF',
          boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
          borderColor: '#E7E7E7',
          '&:hover': {
            bgcolor: '#FFFFFF',
            borderColor: '#E7E7E7',
            boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
          },
          '&:active': {
            boxShadow: '0px 0px 0px 0px #E7E7E7 inset',
            transform: 'translateY(1px)',
          },
        }}
      >
        No, leave feedback
      </Button>
    </Dialog>
  );
}

ConfirmDialogClient.propTypes = {
  emoji: PropTypes.node,
  content: PropTypes.node,
  onClose: PropTypes.func,
  onApprove: PropTypes.func,
  onLeaveFeedback: PropTypes.func,
  open: PropTypes.bool,
  title: PropTypes.string,
  loading: PropTypes.bool,
};
