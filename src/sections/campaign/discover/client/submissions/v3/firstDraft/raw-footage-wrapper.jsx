import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography } from '@mui/material';

import FirstDraftRawFootageCard from './raw-footage';

const RawFootageWrapper = ({ 
  campaign, 
  submission, 
  deliverables, 
  onVideoClick, 
  userRole,
  handleClientApprove,
  handleClientReject,
}) => {
  if (!deliverables?.rawFootages || deliverables.rawFootages.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No raw footage submitted yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {deliverables.rawFootages.map((rawFootage, index) => (
        <FirstDraftRawFootageCard
          key={rawFootage.id}
          rawFootageItem={rawFootage}
          index={index}
          submission={submission}
          onRawFootageClick={onVideoClick}
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

RawFootageWrapper.propTypes = {
  campaign: PropTypes.object.isRequired,
  submission: PropTypes.object.isRequired,
  deliverables: PropTypes.object.isRequired,
  onVideoClick: PropTypes.func.isRequired,
  userRole: PropTypes.string.isRequired,
  handleClientApprove: PropTypes.func.isRequired,
  handleClientReject: PropTypes.func.isRequired,
};

export default RawFootageWrapper; 