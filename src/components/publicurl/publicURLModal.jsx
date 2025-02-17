import React from 'react';
import PropTypes from 'prop-types';

import { Box, Button, Dialog, Typography, DialogContent } from '@mui/material';

const PublicUrlModal = ({ open, onClose, publicUrl, password }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    PaperProps={{
      sx: {
        borderRadius: 1,
      },
    }}
    // aria-labelledby="modal-title"
    // aria-describedby="modal-description"
  >
    <DialogContent>
      <Box
        // sx={{
        //   position: 'absolute',
        //   top: '50%',
        //   left: '50%',
        //   transform: 'translate(-50%, -50%)',
        //   width: 800,
        //   bgcolor: 'white',
        //   borderRadius: 2,
        //   boxShadow: 24,
        //   p: 4,
        // }}
        sx={{ p: 3 }}
      >
        <Typography
          variant="h3"
          gutterBottom
          sx={{ fontFamily: (theme) => theme.typography.fontSecondaryFamily }}
        >
          Public Access Generated
        </Typography>
        <Typography variant="body1" id="modal-description" gutterBottom>
          <strong>Generated URL:</strong>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            {publicUrl}
          </a>
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Password:</strong> {password}
        </Typography>

        <Box textAlign="end">
          <Button onClick={onClose} variant="contained" sx={{ borderRadius: 0.5 }}>
            Close
          </Button>
        </Box>
      </Box>
    </DialogContent>
  </Dialog>
);

PublicUrlModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  publicUrl: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
};

export default PublicUrlModal;
