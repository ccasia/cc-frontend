import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography } from '@mui/material';

import FirstDraftPhotoCard from './photos';

const PhotosWrapper = ({ 
  campaign, 
  submission, 
  deliverables, 
  onImageClick, 
  userRole,
  handleClientApprove,
  handleClientReject,
}) => {
  if (!deliverables?.photos || deliverables.photos.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No photos submitted yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {deliverables.photos.map((photo, index) => (
        <FirstDraftPhotoCard
          key={photo.id}
          photoItem={photo}
          index={index}
          submission={submission}
          onImageClick={onImageClick}
          handleApprove={() => {}} // Not used for client role
          handleRequestChange={() => {}} // Not used for client role
          userRole={userRole}
          deliverables={deliverables}
          handleClientApprove={handleClientApprove}
          handleClientReject={handleClientReject}
        />
      ))}
    </Stack>
  );
};

PhotosWrapper.propTypes = {
  campaign: PropTypes.object.isRequired,
  submission: PropTypes.object.isRequired,
  deliverables: PropTypes.object.isRequired,
  onImageClick: PropTypes.func.isRequired,
  userRole: PropTypes.string.isRequired,
  handleClientApprove: PropTypes.func.isRequired,
  handleClientReject: PropTypes.func.isRequired,
};

export default PhotosWrapper; 