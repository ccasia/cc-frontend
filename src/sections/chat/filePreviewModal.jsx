import React, { useState } from "react";
import { Box, Modal, Typography, IconButton, Button } from "@mui/material";
import PropTypes from "prop-types";
import CloseIcon from "@mui/icons-material/Close";

const FilePreviewModal = ({ open, handleClose, handleSend, filePreview, file }) =>  (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 2,
          maxWidth: 400,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Close Button */}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Modal Content */}
        <Typography id="modal-title" variant="h5"  sx={{
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          mb: 4
         }}>
          File Preview
        </Typography>

        {filePreview && (
          <Box
            sx={{
              maxWidth: 300,
              maxHeight: 150,
              overflow: "hidden",
              borderRadius: 1,
              p: 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mb: 2,
            }}
          >
            {file.type.startsWith("image/") && (
              <img
                src={filePreview}
                alt="Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}

            {file.type.startsWith("video/") && (
              <video
                src={filePreview}
                controls
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}

            {file.type === "application/pdf" && (
               <Box
               sx={{
                 width: '320px',
                 height: '240px',
                 overflow: 'hidden',
                 borderRadius: 2,
                 boxShadow: 1,
                 display: 'flex',
               }}
             >
               <iframe
                 src={filePreview}
                 width="100%"
                 height="100%"
                 title="PDF preview"
                 style={{ border: 'none' }} 
               >
                 Your browser does not support PDFs.
               </iframe>
             </Box>
            )}

            {!file.type.startsWith("image/") &&
              !file.type.startsWith("video/") &&
              file.type !== "application/pdf" && (
                <Typography variant="body2" sx={{ textAlign: "center" }}>
                  Unsupported file: {file.name}
                </Typography>
              )}
          </Box>
        )}

        {/* Send Button */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleSend}
          fullWidth
        >
          Send
        </Button>
      </Box>
    </Modal>
  );


FilePreviewModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func.isRequired,
  handleSend: PropTypes.func.isRequired,
  filePreview: PropTypes.string.isRequired,
  file: PropTypes.shape({
    type: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
};


export default FilePreviewModal
