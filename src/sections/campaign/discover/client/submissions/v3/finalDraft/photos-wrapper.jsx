import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, CircularProgress } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';
import PhotoCard from './photos';

const PhotosWrapper = ({ 
  campaign,
  submission,
  deliverables,
  onImageClick,
  onSubmit,
  isDisabled,
  // Individual admin approval handlers
  onIndividualApprove,
  onIndividualRequestChange,
  // Individual client approval handlers
  handleClientApproveVideo,
  handleClientApprovePhoto,
  handleClientApproveRawFootage,
  handleClientRejectVideo,
  handleClientRejectPhoto,
  handleClientRejectRawFootage,
  // Admin feedback handlers
  handleAdminEditFeedback,
  handleAdminSendToCreator,
  // SWR mutations
  deliverableMutate,
  submissionMutate,
}) => {
  const { user } = useAuthContext();
  const userRole = user?.role || 'admin';

  if (!deliverables?.photos || deliverables.photos.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No photos available for review.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>     
      <Stack spacing={2}>
        {deliverables.photos.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photoItem={photo}
            index={index}
            submission={submission}
            onImageClick={onImageClick}
            handleApprove={onIndividualApprove}
            handleRequestChange={onIndividualRequestChange}
            selectedPhotosForChange={[]}
            handlePhotoSelection={() => {}}
            userRole={userRole}
            deliverables={deliverables}
            handleClientApprove={handleClientApprovePhoto}
            handleClientReject={handleClientRejectPhoto}
            deliverableMutate={deliverableMutate}
            submissionMutate={submissionMutate}
            // Admin feedback handlers
            handleAdminEditFeedback={handleAdminEditFeedback}
            handleAdminSendToCreator={handleAdminSendToCreator}
          />
        ))}
      </Stack>
    </Box>
  );
};

PhotosWrapper.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  deliverables: PropTypes.object,
  onImageClick: PropTypes.func,
  onSubmit: PropTypes.func,
  isDisabled: PropTypes.bool,
  onIndividualApprove: PropTypes.func,
  onIndividualRequestChange: PropTypes.func,
  handleClientApproveVideo: PropTypes.func,
  handleClientApprovePhoto: PropTypes.func,
  handleClientApproveRawFootage: PropTypes.func,
  handleClientRejectVideo: PropTypes.func,
  handleClientRejectPhoto: PropTypes.func,
  handleClientRejectRawFootage: PropTypes.func,
  handleAdminEditFeedback: PropTypes.func,
  handleAdminSendToCreator: PropTypes.func,
  deliverableMutate: PropTypes.func,
  submissionMutate: PropTypes.func,
};

export default PhotosWrapper; 