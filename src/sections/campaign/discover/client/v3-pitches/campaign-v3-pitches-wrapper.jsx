import React from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';

import useGetV3Pitches from 'src/hooks/use-get-v3-pitches';

import CampaignV3Pitches from './campaign-v3-pitches';

const CampaignV3PitchesWrapper = ({ campaign, campaignMutate }) => {
  const { pitches, isLoading, isError, mutate } = useGetV3Pitches(campaign?.id);

  const handlePitchUpdate = (updatedPitch) => {
    // Update the pitches list with the updated pitch
    mutate((currentPitches) => {
      if (!currentPitches) return currentPitches;
      
      return currentPitches.map((pitch) => 
        pitch.id === updatedPitch.id ? updatedPitch : pitch
      );
    });

    // If the pitch was approved by client, also trigger campaign data revalidation
    if (updatedPitch.status === 'APPROVED' && campaignMutate) {
      campaignMutate();
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading pitches. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <CampaignV3Pitches
        pitches={pitches}
        campaign={campaign}
        onUpdate={handlePitchUpdate}
      />
    </Box>
  );
};

export default CampaignV3PitchesWrapper;

CampaignV3PitchesWrapper.propTypes = {
  campaign: PropTypes.object.isRequired,
  campaignMutate: PropTypes.func,
}; 