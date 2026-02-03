import React from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';

import useGetV3Pitches from 'src/hooks/use-get-v3-pitches';
import CampaignV3Pitches from './campaign-v3-pitches';

const CampaignV3PitchesWrapper = ({ campaign, campaignMutate, isDisabled = false }) => {
  const { pitches, isLoading, isError, mutate } = useGetV3Pitches(campaign?.id);

  const handlePitchUpdate = (updatedPitch) => {
    // If no payload provided, revalidate from server (e.g., guest shortlist added a new pitch)
    if (!updatedPitch) {
      mutate();
      campaignMutate?.();
      return;
    }

    // Update the pitches list with the updated pitch
    mutate((currentPitches) => {
      if (!currentPitches) return currentPitches;
      const updatedPitches = currentPitches.map((pitch) =>
        pitch.id === updatedPitch.id ? updatedPitch : pitch
      );
      return updatedPitches;
    });

    // Trigger campaign data revalidation for:
    // - APPROVED status (client approved for v4, or admin approved for non-v4)
    // - SENT_TO_CLIENT status (admin approved for v4)
    // This ensures credits and shortlisted data are refreshed
    if (updatedPitch.status === 'APPROVED' || updatedPitch.status === 'SENT_TO_CLIENT') {
      campaignMutate?.();
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
        isDisabled={isDisabled}
      />
    </Box>
  );
};

export default CampaignV3PitchesWrapper;

CampaignV3PitchesWrapper.propTypes = {
  campaign: PropTypes.object.isRequired,
  campaignMutate: PropTypes.func,
  isDisabled: PropTypes.bool,
}; 