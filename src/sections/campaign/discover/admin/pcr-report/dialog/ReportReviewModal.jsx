import React from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Dialog,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import Iconify from 'src/components/iconify';

const ReportReviewModal = ({ isOpen, onClose, previewImages }) => (
  <Dialog
    open={isOpen}
    onClose={() => onClose()}
    maxWidth="lg"
    fullWidth
    PaperProps={{
      sx: {
        maxHeight: '90vh',
        borderRadius: '12px',
      },
    }}
  >
    <DialogTitle
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #E7E7E7',
        pb: 2,
      }}
    >
      <Typography variant="h5" sx={{ fontFamily: 'Aileron', fontWeight: 600 }}>
        Report Preview
      </Typography>
      <IconButton onClick={() => onClose()}>
        <Iconify icon="mingcute:close-line" width={24} />
      </IconButton>
    </DialogTitle>
    <DialogContent sx={{ p: 0, overflow: 'auto', bgcolor: '#F5F5F5' }}>
      {previewImages.length > 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            p: 3,
            minHeight: '500px',
          }}
        >
          {previewImages.map((imgData, index) => (
            <Box
              key={index}
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: '800px',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  top: -24,
                  left: 0,
                  color: '#6B7280',
                  fontWeight: 600,
                }}
              >
                Page {index + 1} of {previewImages.length}
              </Typography>
              <Box
                component="img"
                src={imgData}
                alt={`Report Preview - Page ${index + 1}`}
                sx={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
                  border: '1px solid #E5E7EB',
                }}
              />
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '500px',
            p: 4,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Generating preview with page breaks...
            </Typography>
          </Box>
        </Box>
      )}
    </DialogContent>
  </Dialog>
);

export default ReportReviewModal;

ReportReviewModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  previewImages: PropTypes.array,
};
