import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, Grid } from '@mui/material';

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
    <Box sx={{ position: 'relative' }}>
      {/* Horizontal Scrollable Container */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          overflowY: 'hidden',
          pb: 1,
          maxWidth: '100%',
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c1c1c1',
            borderRadius: 4,
            '&:hover': {
              backgroundColor: '#a8a8a8',
            },
          },
        }}
      >
        {deliverables.photos.map((photo, index) => (
          <Box
            key={photo.id}
            sx={{
              width: { xs: '280px', sm: '300px', md: '300px' },
              minWidth: { xs: '280px', sm: '300px', md: '300px' },
              flexShrink: 0,
            }}
          >
            <PhotoCard
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
          </Box>
        ))}
      </Box>
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