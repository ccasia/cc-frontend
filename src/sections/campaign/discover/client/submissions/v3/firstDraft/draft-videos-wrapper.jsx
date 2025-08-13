import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography } from '@mui/material';

import FirstDraftVideoCard from './draft-videos';

const DraftVideosWrapper = ({ 
  campaign, 
  submission, 
  deliverables, 
  onVideoClick, 
  userRole,
  handleClientApprove,
  handleClientReject,
}) => {
  if (!deliverables?.videos || deliverables.videos.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No draft videos submitted yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {deliverables.videos.map((video, index) => (
        <FirstDraftVideoCard
          key={video.id}
          videoItem={video}
          index={index}
          submission={submission}
          onVideoClick={onVideoClick}
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

DraftVideosWrapper.propTypes = {
  campaign: PropTypes.object.isRequired,
  submission: PropTypes.object.isRequired,
  deliverables: PropTypes.object.isRequired,
  onVideoClick: PropTypes.func.isRequired,
  userRole: PropTypes.string.isRequired,
  handleClientApprove: PropTypes.func.isRequired,
  handleClientReject: PropTypes.func.isRequired,
};

export default DraftVideosWrapper; 