import React from 'react';
import PropTypes from 'prop-types';

import { Box, ClickAwayListener, Fade, Menu, MenuItem, Popover, Popper } from '@mui/material';

const ChatModal = ({ open, onClose, anchorEl }) => {
  console.log(anchorEl);
  return (
    <Popover
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      s
      slotProps={{
        paper: {
          sx: {
            marginTop: -1,
          },
        },
      }}
    >
      <Box sx={{ bgcolor: 'transparent', minWidth: 350, height: 400, p: 2 }}>
        All chat component goes here
      </Box>
    </Popover>
  );
};

export default ChatModal;

ChatModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  anchorEl: PropTypes.object,
};
