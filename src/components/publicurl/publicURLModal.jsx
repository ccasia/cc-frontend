import React from 'react';
import PropTypes from 'prop-types';

import {  Box,  Modal, Button, Typography } from '@mui/material';


const PublicUrlModal = ({ open, onClose, publicUrl, password }) => (
  <Modal
    open={open}
    onClose={onClose}
    aria-labelledby="modal-title"
    aria-describedby="modal-description"
  >
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 800,
        bgcolor: 'white',
        borderRadius: 2,
        boxShadow: 24,
        p: 4,
      }}
    >
      <Typography variant="h6" id="modal-title" gutterBottom>
        Public Access Generated
      </Typography>
      <Typography variant="body1" id="modal-description" gutterBottom>
        <strong>Generated URL:</strong>
        <a href={publicUrl} target="_blank" rel="noopener noreferrer">{publicUrl}</a>
      </Typography>
      <Typography variant="body1" gutterBottom>
        <strong>Password:</strong> {password}
      </Typography>
      <Button onClick={onClose} variant="contained" color="primary">
        Close
      </Button>
    </Box>
  </Modal>
);

PublicUrlModal.propTypes = {
  open: PropTypes.bool,           
  onClose: PropTypes.func,       
  publicUrl: PropTypes.string.isRequired,   
  password: PropTypes.string.isRequired,    
};

export default PublicUrlModal;
