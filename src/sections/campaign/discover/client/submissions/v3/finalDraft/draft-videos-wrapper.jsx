import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, CircularProgress } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';
import VideoCard from './draft-videos';

const DraftVideosWrapper = ({ 
  campaign,
  submission,
  deliverables,
  onVideoClick,
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
  
  console.log('🔍 DraftVideosWrapper - User info:', { 
    userId: user?.id, 
    userRole: user?.role, 
    adminMode: user?.admin?.mode,
    adminRole: user?.admin?.role?.name 
  });

  if (!deliverables?.videos || deliverables.videos.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No draft videos available for review.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>     
      <Stack spacing={2}>
        {deliverables.videos.map((video, index) => (
          <VideoCard
            key={video.id}
            videoItem={video}
            index={index}
            submission={submission}
            onVideoClick={onVideoClick}
            handleApprove={onIndividualApprove}
            handleRequestChange={onIndividualRequestChange}
            selectedVideosForChange={[]}
            handleVideoSelection={() => {}}
            userRole={userRole}
            deliverables={deliverables}
            handleClientApprove={handleClientApproveVideo}
            handleClientReject={handleClientRejectVideo}
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

DraftVideosWrapper.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  deliverables: PropTypes.object,
  onVideoClick: PropTypes.func,
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

export default DraftVideosWrapper; 