import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography } from '@mui/material';

import FirstDraftRawFootageCard from './raw-footage';

const RawFootagesWrapper = ({ 
  campaign, 
  submission, 
  deliverables, 
  onVideoClick, 
  userRole,
  handleClientApprove,
  handleClientReject,
  deliverableMutate,
  submissionMutate,
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
        {deliverables.rawFootages.map((rawFootage, index) => (
          <Box
            key={rawFootage.id}
            sx={{
              width: { xs: '280px', sm: '300px', md: '300px' },
              minWidth: { xs: '280px', sm: '300px', md: '300px' },
              flexShrink: 0,
            }}
          >
            <FirstDraftRawFootageCard
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
              deliverableMutate={deliverableMutate}
              submissionMutate={submissionMutate}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

RawFootagesWrapper.propTypes = {
  campaign: PropTypes.object.isRequired,
  submission: PropTypes.object.isRequired,
  deliverables: PropTypes.object.isRequired,
  onVideoClick: PropTypes.func.isRequired,
  userRole: PropTypes.string.isRequired,
  handleClientApprove: PropTypes.func.isRequired,
  handleClientReject: PropTypes.func.isRequired,
  deliverableMutate: PropTypes.func,
  submissionMutate: PropTypes.func,
};

export default RawFootagesWrapper; 