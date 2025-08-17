import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, CircularProgress } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';
import RawFootageCard from './raw-footage';

const RawFootageWrapper = ({ 
  campaign,
  submission,
  deliverables,
  onRawFootageClick,
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

  if (!deliverables?.rawFootages || deliverables.rawFootages.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No raw footage available for review.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>   
      <Stack spacing={2}>
        {deliverables.rawFootages.map((rawFootage, index) => (
          <RawFootageCard
            key={rawFootage.id}
            rawFootageItem={rawFootage}
            index={index}
            submission={submission}
            onRawFootageClick={onRawFootageClick}
            handleApprove={onIndividualApprove}
            handleRequestChange={onIndividualRequestChange}
            selectedRawFootagesForChange={[]}
            handleRawFootageSelection={() => {}}
            userRole={userRole}
            deliverables={deliverables}
            handleClientApprove={handleClientApproveRawFootage}
            handleClientReject={handleClientRejectRawFootage}
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

RawFootageWrapper.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  deliverables: PropTypes.object,
  onRawFootageClick: PropTypes.func,
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

export default RawFootageWrapper; 